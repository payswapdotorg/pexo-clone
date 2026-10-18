/**
 * Serialized wire shapes shared by the project page (server) and the
 * project room (client). Pure types — safe on both sides of the boundary.
 */

export interface ChatArtifact {
  id: string;
  kind: string;
  url: string;
  filename: string;
  durationSec: number | null;
  createdAt: string;
}

export interface ChatAttachment {
  kind: string;
  value: string;
  /** Machine-extracted content the agent read from this attachment. */
  digest?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  markdown: string;
  stage: string | null;
  attachments: ChatAttachment[] | null;
  createdAt: string;
  artifacts: ChatArtifact[];
}

export interface ChatFeedback {
  rating: string;
  note: string | null;
}

/**
 * Project status vocabulary (status honesty):
 * - "working": the agent is genuinely computing right now (a turn is in
 *   flight server-side).
 * - "waiting": the agent finished its turn — the next move is the user's
 *   (answer the plan questions, confirm the render, retry after a
 *   failure, or top up credits).
 * - "ready": the project delivered a video.
 */
export type ProjectStatus = "working" | "waiting" | "ready";
