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
