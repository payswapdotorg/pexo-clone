import type { Artifact, Project, User } from "@prisma/client";
import { db } from "@/lib/db";
import { appendMessage } from "@/lib/projects";
import {
  artifactKeyForUrl,
  deleteArtifact,
  getArtifact,
} from "@/lib/storage";
import { BRAND } from "@/lib/brand";
import { CREDITS, rollbackCredits, spendCredits } from "./credits";
import { askLLM } from "./llm";
import { generateStill } from "./image";
import { renderVideo, type StillSource } from "./video";
import { aspectFromText, DEFAULT_ASPECT } from "./aspect";
import {
  emitArtifactCreated,
  emitCreditsUpdated,
  emitMessageCreated,
  emitProjectStatus,
} from "./events";

/**
 * THE AGENT BRAIN — the AGENT-PROTOCOL stage machine (docs/AGENT-PROTOCOL.md),
 * with the LLM/image/video SDK as the language and generation engines.
 *
 * INTAKE ▶ PLAN_QUESTIONS ▶ STILL_PREVIEW ▶ CONFIRM_GATE ▶ RENDERING ▶ DELIVERY ▶ FEEDBACK
 *
 * The current gate is derived from the LAST agent message's stage. Turns are
 * transactional: generation happens first, then the credit spend, then the
 * message/artifact/event writes; failures roll the spend back.
 */
export const STAGES = Object.freeze({
  INTAKE: "INTAKE",
  PLAN_QUESTIONS: "PLAN_QUESTIONS",
  STILL_PREVIEW: "STILL_PREVIEW",
  DELIVERY: "DELIVERY",
  FEEDBACK: "FEEDBACK",
});

export interface TurnArtifact {
  id: string;
  kind: string;
  url: string;
  filename: string;
  durationSec?: number;
}

export interface TurnResult {
  projectId: string;
  stage: string;
  markdown: string;
  artifacts: TurnArtifact[];
  credits: number;
  blocked?: "credits";
  status: string;
}

interface UserAttachment {
  kind: string;
  value: string;
}

/** CONFIRM_GATE: only an explicit affirmation advances to RENDERING. */
const AFFIRM_START =
  /^\s*(go|go ahead|yes|yes please|do it|render it|looks good(\s*,)? go|ok go|okay go|confirm|approved)\b/i;
const AFFIRM_ANYWHERE = /\b(go ahead|do it|render it|yes, render)\b/i;

function isAffirmation(text: string): boolean {
  return AFFIRM_START.test(text) || AFFIRM_ANYWHERE.test(text);
}

async function lastAgentStage(projectId: string): Promise<string | null> {
  const [last] = await db.message.findMany({
    where: { projectId, role: "agent" },
    orderBy: { createdAt: "desc" },
    take: 1,
  });
  return last?.stage ?? null;
}

async function buildHistory(projectId: string): Promise<string> {
  const messages = await db.message.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });
  return messages
    .map((m) => `${m.role === "user" ? "User" : "Agent"}: ${m.markdown}`)
    .join("\n\n");
}

function toTurnArtifact(artifact: Artifact): TurnArtifact {
  return artifact.durationSec === null || artifact.durationSec === undefined
    ? { id: artifact.id, kind: artifact.kind, url: artifact.url, filename: artifact.filename }
    : {
        id: artifact.id,
        kind: artifact.kind,
        url: artifact.url,
        filename: artifact.filename,
        durationSec: artifact.durationSec,
      };
}

/* ------------------------------------------------------------------ */
/* LLM prompt bodies (clean-room, AGENT-PROTOCOL S1/S2)                 */
/* ------------------------------------------------------------------ */

const PLAN_SYSTEM = `You are the video agent of ${BRAND}, replying to a user's first brief for a short video project. This turn is the PLAN stage of a fixed pipeline: plan and questions first, then a still-frame preview of the look, then a render that starts only after an explicit "go" from the user.

Write your reply as markdown with EXACTLY this numbered shape:

1. **What I'd make:** one concrete creative paragraph describing the specific video you would build for this brief — composition, motion, mood. Specific to THIS brief, never generic.
2. **{N} decisions for you:** a numbered list of real forks the user must decide (write the actual number, typically 2-3). Focus on asset availability (for example a real logo file versus plain type, because you cannot design a logo yourself), template or format fit, and scope. Name the tradeoff in each item.
3. **Defaults I'll use unless you change them:** a bullet list that ALWAYS includes exactly these four labels: Length, Aspect ratio, Palette, Sound — each with the value you would pick for this brief. The Aspect ratio value MUST be a plain ratio like "9:16", "16:9" or "1:1" followed by the short explanation, because the render engine reads it to pick the frame size.
4. A short closing of direct questions: ask exactly what you need answered to proceed, and note that you will show a still frame of the look for approval before animating anything.

Style rules:
- Collaborative, specific, honest about limitations. If the brief asks for something you cannot do (design a logo, produce licensed music, guarantee brand colors), say so plainly and give the practical alternative (for example: send the file or the agent will set plain type).
- Length honesty: the render engine produces ONE 5-second clip per render. If the brief asks for a different length, say so plainly in the Length default (for example "5 s per clip — engine limit") and offer the practical alternative (loop the clip, or plan multiple clips).
- Never sycophantic: do not praise the brief. No emojis. No headings besides the numbered list. Keep the whole reply under 250 words.`;

const STILL_SYSTEM = `You are the video agent of ${BRAND}. The user has answered your plan questions, or asked for changes to an earlier preview. This turn is the STILL PREVIEW stage: show one still frame of the look plus a second-by-second timeline, then wait for an explicit "go" before anything renders.

Your reply MUST begin with this marker line, with nothing before it:
[[STILL_PROMPT: one line describing the still image to generate — subject, composition, palette, lighting]]

After the marker line, write the visible markdown reply:
- One short sentence introducing the frame and what it locks in.
- A bullet-list timeline covering the whole duration, each bullet EXACTLY in the format "X–Ys: what happens" (for example "0–1.2s: ...", "1.2–3s: ...", "3–4.6s: ...", "4.6–5s: ..."). The render engine produces ONE 5-second clip per render — the timeline MUST cover exactly 0–5s; if the user asked for a longer video, say plainly that the clip is 5 s and will be cut to loop (and how you would chain clips for a longer cut). No gaps; the final beat must set up a clean loop back to the first frame.
- One honest limitations line: what this preview does not include or verify (sound, motion quality, and anything else true of this project).
- A closing ask for an explicit "go" before rendering. Never suggest the render already started.

If the user asked for changes to an earlier preview, fold their changes into the updated frame and timeline.

Style rules: collaborative, specific, honest; never sycophantic; no emojis; under 200 words after the marker.`;

function planUserInput(
  project: Project,
  userMessage: string,
  attachments: UserAttachment[]
): string {
  const lines = [
    `Project title: ${project.title}`,
    `Confirm policy: ${project.confirmPolicy}`,
    "",
    "User brief:",
    userMessage,
  ];
  if (attachments.length > 0) {
    lines.push("", "Attachments the user provided:");
    lines.push(...attachments.map((a) => `- ${a.kind}: ${a.value}`));
  } else {
    lines.push("", "Attachments: none.");
  }
  lines.push("", "Write the PLAN stage reply now.");
  return lines.join("\n");
}

function stillUserInput(project: Project, history: string): string {
  return [
    `Project title: ${project.title}`,
    "",
    "Conversation so far (oldest first):",
    history,
    "",
    "Write the STILL PREVIEW stage reply now. The still image will be generated from your [[STILL_PROMPT: ...]] marker line.",
  ].join("\n");
}

/** Extract + strip the [[STILL_PROMPT: ...]] marker; fall back to title+plan. */
function extractStillPrompt(
  raw: string,
  project: Project,
  planExcerpt: string
): { prompt: string; markdown: string } {
  const match = raw.match(/^\s*\[\[STILL_PROMPT:\s*(.+?)\s*\]\]\s*$/im);
  if (match && match[1] && match.index !== undefined) {
    const prompt = match[1].trim();
    const markdown =
      raw.slice(0, match.index) + raw.slice(match.index + match[0].length);
    if (prompt) {
      return { prompt, markdown: markdown.trim() };
    }
  }
  const prompt = `${project.title}. Key frame still: ${planExcerpt}`
    .replace(/\s+/g, " ")
    .slice(0, 300);
  return { prompt, markdown: raw.trim() };
}

async function planExcerptFor(projectId: string): Promise<string> {
  const [plan] = await db.message.findMany({
    where: { projectId, stage: STAGES.PLAN_QUESTIONS },
    orderBy: { createdAt: "desc" },
    take: 1,
  });
  if (!plan) return "";
  return plan.markdown.replace(/\s+/g, " ").slice(0, 200);
}

/**
 * The aspect ratio agreed for this project. The plan stage's "Aspect ratio"
 * default and any later user override ("make it vertical", "9:16 please")
 * are honored: the NEWEST explicit mention in the conversation wins, so a
 * user override beats the plan default. Falls back to 16:9.
 */
async function agreedAspect(projectId: string): Promise<string> {
  const mentions = await db.message.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: { markdown: true },
    take: 20,
  });
  for (const message of mentions) {
    const aspect = aspectFromText(message.markdown);
    if (aspect) return aspect;
  }
  return DEFAULT_ASPECT;
}

/* ------------------------------------------------------------------ */
/* Blocked turns (insufficient credits — nothing is charged)            */
/* ------------------------------------------------------------------ */

async function blockedTurn(
  user: User,
  project: Project,
  remainStage: string,
  stage: keyof typeof CREDITS,
  action: string
): Promise<TurnResult> {
  const fresh = await db.user.findUnique({ where: { id: user.id } });
  const balance = fresh?.credits ?? user.credits;
  const markdown = [
    `I have to stop before I ${action}: that step costs ${CREDITS[stage]} credits and your balance is ${balance}.`,
    "",
    "Nothing was charged for it. Once you top up or upgrade your plan from the pricing page, send any message here and I'll pick up exactly where we left off.",
  ].join("\n");
  const message = await appendMessage(project.id, {
    role: "agent",
    markdown,
    stage: remainStage,
  });
  await emitMessageCreated(project.id, message);
  return {
    projectId: project.id,
    stage: remainStage,
    markdown,
    artifacts: [],
    credits: balance,
    blocked: "credits",
    status: project.status,
  };
}

/* ------------------------------------------------------------------ */
/* Stage implementations                                               */
/* ------------------------------------------------------------------ */

async function runIntake(
  user: User,
  project: Project,
  userMessage: string,
  attachments: UserAttachment[]
): Promise<TurnResult> {
  if (user.credits < CREDITS.PROJECT_START) {
    return blockedTurn(
      user,
      project,
      STAGES.INTAKE,
      "PROJECT_START",
      "start this project"
    );
  }

  const markdown = await askLLM(
    PLAN_SYSTEM,
    planUserInput(project, userMessage, attachments)
  );

  const spend = await spendCredits(user.id, project.id, "PROJECT_START");
  if (!spend.ok) {
    return blockedTurn(
      user,
      project,
      STAGES.INTAKE,
      "PROJECT_START",
      "start this project"
    );
  }

  try {
    const message = await appendMessage(project.id, {
      role: "agent",
      markdown,
      stage: STAGES.PLAN_QUESTIONS,
    });
    await emitMessageCreated(project.id, message);
    await emitCreditsUpdated(project.id, spend.balance);
  } catch (err) {
    await rollbackCredits(spend.eventId ?? "");
    throw err;
  }

  return {
    projectId: project.id,
    stage: STAGES.PLAN_QUESTIONS,
    markdown,
    artifacts: [],
    credits: spend.balance,
    status: project.status,
  };
}

async function runStillPreview(
  user: User,
  project: Project,
  isReworkAfterDelivery: boolean
): Promise<TurnResult> {
  if (user.credits < CREDITS.PREVIEW) {
    return blockedTurn(
      user,
      project,
      isReworkAfterDelivery ? STAGES.DELIVERY : STAGES.PLAN_QUESTIONS,
      "PREVIEW",
      "generate the still preview"
    );
  }

  const history = await buildHistory(project.id);
  const planExcerpt = await planExcerptFor(project.id);
  const aspect = await agreedAspect(project.id);
  const raw = await askLLM(STILL_SYSTEM, stillUserInput(project, history));
  const { prompt, markdown } = extractStillPrompt(raw, project, planExcerpt);

  const still = await generateStill(project.id, prompt, aspect);

  const spend = await spendCredits(user.id, project.id, "PREVIEW");
  if (!spend.ok) {
    await deleteArtifact(still.url);
    return blockedTurn(
      user,
      project,
      isReworkAfterDelivery ? STAGES.DELIVERY : STAGES.PLAN_QUESTIONS,
      "PREVIEW",
      "generate the still preview"
    );
  }

  try {
    if (isReworkAfterDelivery && project.status !== "working") {
      await db.project.update({
        where: { id: project.id },
        data: { status: "working" },
      });
      project = { ...project, status: "working" };
      await emitProjectStatus(project.id, "working");
    }

    const message = await appendMessage(project.id, {
      role: "agent",
      markdown,
      stage: STAGES.STILL_PREVIEW,
    });
    const artifact = await db.artifact.create({
      data: {
        projectId: project.id,
        messageId: message.id,
        kind: "still",
        url: still.url,
        filename: still.filename,
      },
    });
    await emitMessageCreated(project.id, message);
    await emitArtifactCreated(project.id, artifact);
    await emitCreditsUpdated(project.id, spend.balance);

    return {
      projectId: project.id,
      stage: STAGES.STILL_PREVIEW,
      markdown,
      artifacts: [toTurnArtifact(artifact)],
      credits: spend.balance,
      status: project.status,
    };
  } catch (err) {
    await deleteArtifact(still.url);
    await rollbackCredits(spend.eventId ?? "");
    throw err;
  }
}

function deliveryMarkdown(
  filename: string,
  resolution: string,
  method: "sdk" | "ffmpeg"
): string {
  const methodPhrase =
    method === "sdk"
      ? "rendered with the video model"
      : "rendered programmatically from the still frame (ffmpeg)";
  return [
    `**Produced video: \`${filename}\`** — 5 seconds, ${resolution}, ${methodPhrase}.`,
    "",
    `Honest limitations: I verified a single still frame of the look before rendering — I did not review the motion smoothness or pacing, and there is no sound. Give the loop point a look when you play it; if anything drifts, tell me what to change and I'll set up a revised preview before any re-render.`,
  ].join("\n");
}

async function runRendering(
  user: User,
  project: Project
): Promise<TurnResult> {
  if (user.credits < CREDITS.RENDER) {
    return blockedTurn(
      user,
      project,
      STAGES.STILL_PREVIEW,
      "RENDER",
      "render the video"
    );
  }

  const previousStatus = project.status;
  await db.project.update({
    where: { id: project.id },
    data: { status: "working" },
  });
  await emitProjectStatus(project.id, "working");

  const spend = await spendCredits(user.id, project.id, "RENDER");
  if (!spend.ok) {
    await db.project.update({
      where: { id: project.id },
      data: { status: previousStatus },
    });
    await emitProjectStatus(project.id, previousStatus);
    return blockedTurn(
      user,
      project,
      STAGES.STILL_PREVIEW,
      "RENDER",
      "render the video"
    );
  }

  const [latestStill] = await db.artifact.findMany({
    where: { projectId: project.id, kind: "still" },
    orderBy: { createdAt: "desc" },
    take: 1,
  });
  let still: StillSource | null = null;
  if (latestStill) {
    const key = artifactKeyForUrl(latestStill.url);
    if (key) {
      const fetched = await getArtifact(key);
      if (fetched.ok && fetched.bytes && fetched.contentType) {
        still = { contentType: fetched.contentType, bytes: fetched.bytes };
      }
    }
  }

  const [preview] = await db.message.findMany({
    where: { projectId: project.id, stage: STAGES.STILL_PREVIEW },
    orderBy: { createdAt: "desc" },
    take: 1,
  });
  const motionPlan = (preview?.markdown ?? project.title).replace(/\s+/g, " ");
  const videoPrompt = `${project.title}. Animate the provided still frame into a 5-second seamless loop. Motion plan: ${motionPlan.slice(0, 500)}`;
  const aspect = await agreedAspect(project.id);

  let video;
  try {
    video = await renderVideo(project.id, videoPrompt, still, aspect);
  } catch (err) {
    await rollbackCredits(spend.eventId ?? "");
    throw err;
  }

  try {
    const markdown = deliveryMarkdown(
      video.filename,
      video.resolution,
      video.method
    );
    const message = await appendMessage(project.id, {
      role: "agent",
      markdown,
      stage: STAGES.DELIVERY,
    });
    const artifact = await db.artifact.create({
      data: {
        projectId: project.id,
        messageId: message.id,
        kind: "video",
        url: video.url,
        filename: video.filename,
        durationSec: video.durationSec,
      },
    });
    await db.project.update({
      where: { id: project.id },
      data: { status: "ready" },
    });
    await emitMessageCreated(project.id, message);
    await emitArtifactCreated(project.id, artifact);
    await emitProjectStatus(project.id, "ready");
    await emitCreditsUpdated(project.id, spend.balance);

    return {
      projectId: project.id,
      stage: STAGES.DELIVERY,
      markdown,
      artifacts: [toTurnArtifact(artifact)],
      credits: spend.balance,
      status: "ready",
    };
  } catch (err) {
    await deleteArtifact(video.url);
    await rollbackCredits(spend.eventId ?? "");
    throw err;
  }
}

/* ------------------------------------------------------------------ */
/* Entry point                                                         */
/* ------------------------------------------------------------------ */

export async function runAgentTurn(
  user: User,
  project: Project,
  userMessage: string,
  attachments: UserAttachment[]
): Promise<TurnResult> {
  const stage = await lastAgentStage(project.id);

  if (stage === null || stage === STAGES.INTAKE) {
    return runIntake(user, project, userMessage, attachments);
  }

  if (stage === STAGES.PLAN_QUESTIONS) {
    // The user answered the plan: show the still preview.
    return runStillPreview(user, project, false);
  }

  if (stage === STAGES.STILL_PREVIEW) {
    // CONFIRM_GATE: only an explicit affirmation renders (never auto-advance).
    if (isAffirmation(userMessage)) {
      return runRendering(user, project);
    }
    return runStillPreview(user, project, false);
  }

  // DELIVERY / FEEDBACK: any follow-up text is a fix request → back to S2.
  return runStillPreview(user, project, true);
}
