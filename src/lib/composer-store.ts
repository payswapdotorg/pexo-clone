"use client";

import { create } from "zustand";

/**
 * Shared client state for the workspace (PRODUCT-SPEC §4 client-store role,
 * trimmed to what PC2 needs): composer cross-talk (insert attachments, fix
 * requests, prompt prefill) and the live credits balance that the events
 * long-poll and chat responses keep fresh.
 */

export interface ComposerAttachment {
  kind: string;
  value: string;
}

interface ComposerState {
  /** Live credit balance (null until the first server/event value lands). */
  credits: number | null;
  setCredits: (credits: number) => void;

  /** Prompt prefill (template gallery cards, quick external callers). */
  promptDraft: string;
  promptSeq: number;
  prefillPrompt: (text: string) => void;

  /** Queue of attachments pushed into the composer ("Insert to input"). */
  insertQueue: ComposerAttachment[];
  enqueueInsert: (attachment: ComposerAttachment) => void;
  drainInserts: () => ComposerAttachment[];

  /** Mark-to-fix payload routed through the composer's normal send path. */
  pendingFixText: string | null;
  setPendingFixText: (text: string | null) => void;
}

export const useComposerStore = create<ComposerState>()((set, get) => ({
  credits: null,
  setCredits: (credits) => set({ credits }),

  promptDraft: "",
  promptSeq: 0,
  prefillPrompt: (text) =>
    set((state) => ({ promptDraft: text, promptSeq: state.promptSeq + 1 })),

  insertQueue: [],
  enqueueInsert: (attachment) =>
    set((state) => ({ insertQueue: [...state.insertQueue, attachment] })),
  drainInserts: () => {
    const items = get().insertQueue;
    if (items.length > 0) set({ insertQueue: [] });
    return items;
  },

  pendingFixText: null,
  setPendingFixText: (text) => set({ pendingFixText: text }),
}));
