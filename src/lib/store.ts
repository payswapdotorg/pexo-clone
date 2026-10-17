import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * PC1 project store — file-backed (data/projects.json, gitignored) so the
 * placeholder projects survive dev-server reloads. PC2 replaces this with
 * Prisma models; the shapes here deliberately mirror those planned models.
 */

export type MessageRole = "user" | "agent";

export interface StoredMessage {
  id: string;
  role: MessageRole;
  markdown: string;
  stage?: string;
  ts: number;
}

export interface StoredProject {
  id: string;
  title: string;
  status: "working" | "ready";
  createdAt: number;
  updatedAt: number;
  messages: StoredMessage[];
}

interface StoreFile {
  projects: StoredProject[];
  seq: number;
}

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "projects.json");

const EMPTY_STORE: StoreFile = { projects: [], seq: 0 };

async function readStore(): Promise<StoreFile> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as StoreFile;
    if (!Array.isArray(parsed.projects) || typeof parsed.seq !== "number") {
      return EMPTY_STORE;
    }
    return parsed;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.writeFile(STORE_PATH, JSON.stringify(EMPTY_STORE));
      } catch {
        /* best effort */
      }
      return EMPTY_STORE;
    }
    throw err;
  }
}

async function writeStore(store: StoreFile): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = STORE_PATH + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(store, null, 1));
  await fs.rename(tmp, STORE_PATH);
}

export interface ProjectSummary {
  id: string;
  title: string;
  status: StoredProject["status"];
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}

export async function listProjects(
  page = 1,
  pageSize = 10
): Promise<{ projects: ProjectSummary[]; page: number; pageSize: number; total: number }> {
  const store = await readStore();
  const sorted = [...store.projects].sort((a, b) => b.createdAt - a.createdAt);
  const total = sorted.length;
  const p = Math.max(1, Math.floor(page) || 1);
  const size = Math.min(50, Math.max(1, Math.floor(pageSize) || 10));
  const slice = sorted.slice((p - 1) * size, p * size);
  return {
    projects: slice.map((pr) => ({
      id: pr.id,
      title: pr.title,
      status: pr.status,
      createdAt: pr.createdAt,
      updatedAt: pr.updatedAt,
      messageCount: pr.messages.length,
    })),
    page: p,
    pageSize: size,
    total,
  };
}

export async function getProject(id: string): Promise<StoredProject | null> {
  const store = await readStore();
  return store.projects.find((pr) => pr.id === id) ?? null;
}

export function deriveTitle(message: string): string {
  const firstLine = message.trim().split("\n")[0] ?? "";
  const cleaned = firstLine.replace(/\s+/g, " ").trim();
  if (!cleaned) return "Untitled project";
  return cleaned.length > 60 ? `${cleaned.slice(0, 57)}…` : cleaned;
}

/**
 * The PC1 stub agent turn (work order item 7): the stage machine's first
 * stage with a placeholder brain. PC2 replaces the markdown with the real
 * LLM-driven PLAN_QUESTIONS turn.
 */
export const STUB_TURN = Object.freeze({
  stage: "PLAN_QUESTIONS",
  markdown: "(agent brain arrives in phase 2)",
});

function newMessageId(seq: number, n: number): string {
  return `m${seq}.${n}`;
}

export interface AppendResult {
  project: StoredProject;
  turn: { stage: string; markdown: string };
}

export async function appendTurn(opts: {
  projectId: string | null;
  message: string;
  attachments?: { kind: string; value: string }[];
}): Promise<AppendResult | null> {
  const store = await readStore();
  const text = opts.message.trim();
  if (!text) return null;

  const attachmentSummary = (opts.attachments ?? [])
    .map((a) => `[attached ${a.kind}: ${a.value}]`)
    .join(" ");
  const userMarkdown = text + (attachmentSummary ? `\n\n${attachmentSummary}` : "");

  let project = opts.projectId
    ? store.projects.find((pr) => pr.id === opts.projectId)
    : undefined;
  if (opts.projectId && !project) return null;

  if (!project) {
    store.seq += 1;
    const now = Date.now();
    project = {
      id: `${Math.floor(now / 1000)}${store.seq}`,
      title: deriveTitle(text),
      status: "working",
      createdAt: now,
      updatedAt: now,
      messages: [],
    };
    store.projects.push(project);
  }

  const seqTag = store.seq;
  project.messages.push({
    id: newMessageId(seqTag, project.messages.length + 1),
    role: "user",
    markdown: userMarkdown,
    ts: Date.now(),
  });
  const turn = { ...STUB_TURN };
  project.messages.push({
    id: newMessageId(seqTag, project.messages.length + 1),
    role: "agent",
    markdown: turn.markdown,
    stage: turn.stage,
    ts: Date.now(),
  });
  project.updatedAt = Date.now();

  await writeStore(store);
  return { project, turn };
}
