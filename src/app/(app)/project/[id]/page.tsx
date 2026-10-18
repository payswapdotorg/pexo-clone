import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ProjectRoom } from "@/components/site/project-room";
import type {
  ChatArtifact,
  ChatAttachment,
  ChatFeedback,
  ChatMessage,
  ProjectStatus,
} from "@/lib/chat-types";

export const metadata: Metadata = {
  title: "Project",
};

export const dynamic = "force-dynamic";

function toAttachments(value: unknown): ChatAttachment[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter(
    (item): item is ChatAttachment =>
      item !== null &&
      typeof item === "object" &&
      typeof (item as { kind?: unknown }).kind === "string" &&
      typeof (item as { value?: unknown }).value === "string"
  );
}

/**
 * /project/[id] (PRODUCT-SPEC §2): ownership-checked project with the full
 * conversation, artifacts, feedback, and the event cursor the live loop
 * starts from (read BEFORE the messages so nothing is skipped).
 */
export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  const project = await db.project.findFirst({
    where: { id, userId: user.id },
  });
  if (!project) {
    notFound();
  }

  const lastEvent = await db.projectEvent.findFirst({
    where: { projectId: project.id },
    orderBy: { id: "desc" },
    select: { id: true },
  });

  const [messageRows, artifactRows, feedbackRow] = await Promise.all([
    db.message.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "asc" },
    }),
    db.artifact.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "asc" },
    }),
    db.feedback.findFirst({
      where: { projectId: project.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const byMessage = new Map<string, typeof artifactRows>();
  for (const artifact of artifactRows) {
    if (!artifact.messageId) continue;
    const list = byMessage.get(artifact.messageId) ?? [];
    list.push(artifact);
    byMessage.set(artifact.messageId, list);
  }

  const serializeArtifact = (
    artifact: (typeof artifactRows)[number]
  ): ChatArtifact => ({
    id: artifact.id,
    kind: artifact.kind,
    url: artifact.url,
    filename: artifact.filename,
    durationSec: artifact.durationSec,
    createdAt: artifact.createdAt.toISOString(),
  });

  const messages: ChatMessage[] = messageRows.map((message) => ({
    id: message.id,
    role: message.role === "user" ? "user" : "agent",
    markdown: message.markdown,
    stage: message.stage,
    attachments: toAttachments(message.attachments),
    createdAt: message.createdAt.toISOString(),
    artifacts: (byMessage.get(message.id) ?? []).map(serializeArtifact),
  }));

  const artifacts = artifactRows.map(serializeArtifact);

  const feedback: ChatFeedback | null = feedbackRow
    ? { rating: feedbackRow.rating, note: feedbackRow.note }
    : null;

  const lastMessage = messages[messages.length - 1];
  /* Status honesty: "working" is only true while a turn is in flight —
     which implies the user's message is the latest one. A row that says
     "working" while the agent's message is the latest is a pre-fix
     legacy state (the agent idles waiting for the user), so read it as
     "waiting". */
  const status: ProjectStatus =
    project.status === "ready"
      ? "ready"
      : project.status === "waiting"
        ? "waiting"
        : lastMessage?.role === "agent"
          ? "waiting"
          : "working";
  const agentMidTurn = status === "working";

  return (
    <ProjectRoom
      projectId={project.id}
      initialTitle={project.title}
      status={status}
      agentMidTurn={agentMidTurn}
      initialEventCursor={lastEvent?.id ?? 0}
      messages={messages}
      artifacts={artifacts}
      feedback={feedback}
    />
  );
}
