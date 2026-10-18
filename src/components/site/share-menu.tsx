"use client";

import { useState } from "react";
import { Check, Copy, Link2Off, Mail, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Share menu (PRODUCT-SPEC §2 project header + Produced Video card) —
 * share honesty edition.
 *
 * The menu used to copy the session-scoped project URL, which only ever
 * worked for the owner — every recipient hit "This scene doesn't exist".
 * Now sharing is a real, opt-in capability: the owner creates an
 * unguessable public link (/share/<id>, read-only), can copy or rotate
 * it, and can stop sharing at any time. Social intents appear only
 * while a link exists, so the UI never promises a link that can't work.
 */
export function ShareMenu({
  projectId,
  title,
  compact = false,
  initialPublicId = null,
}: {
  projectId: string;
  title: string;
  compact?: boolean;
  initialPublicId?: string | null;
}) {
  const [publicId, setPublicId] = useState<string | null>(initialPublicId);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  const shareUrl = () =>
    `${window.location.origin}/share/${publicId as string}`;

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("Share link copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy the link", {
        description: "Your browser blocked clipboard access.",
      });
    }
  };

  const post = async (action: "create" | "revoke"): Promise<string | null> => {
    const res = await fetch(`/api/biz/projects/${projectId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.status === 401) {
      toast("Sign in to manage sharing", {
        description: "Redirecting you to the login page…",
      });
      throw new Error("no_session");
    }
    if (res.status === 404) {
      toast.error("Project not found", {
        description: "It may have been deleted in another tab.",
      });
      throw new Error("project_not_found");
    }
    if (!res.ok) {
      toast.error("Sharing isn't available right now", {
        description: "Please try again in a moment.",
      });
      throw new Error("share_failed");
    }
    const data = (await res.json()) as { publicId: string | null };
    return data.publicId;
  };

  const createLink = async () => {
    setBusy(true);
    try {
      const id = await post("create");
      setPublicId(id);
      await copyUrl(`${window.location.origin}/share/${id}`);
    } catch {
      /* toast already shown */
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    if (!publicId) return;
    await copyUrl(shareUrl());
  };

  const stopSharing = async () => {
    setBusy(true);
    try {
      await post("revoke");
      setPublicId(null);
      setCopied(false);
      toast("Sharing stopped", {
        description: "The public link no longer works for anyone.",
      });
    } catch {
      /* toast already shown */
    } finally {
      setBusy(false);
    }
  };

  const openIntent = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareText = encodeURIComponent(`${title} — made with a video agent`);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {compact ? (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-lg text-xs"
            aria-label={`Share ${title}`}
          >
            <Share2 className="size-3.5" aria-hidden="true" />
            Share
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 rounded-lg text-xs text-muted-foreground"
            aria-label={`Share ${title}`}
          >
            <Share2 className="size-4" aria-hidden="true" />
            Share
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2">
        <div
          className="flex flex-col gap-1"
          role="group"
          aria-label="Share options"
        >
          {publicId ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void copyLink()}
                className="w-full justify-start gap-2 rounded-lg text-xs"
                aria-label="Copy public share link"
              >
                {copied ? (
                  <Check className="size-3.5 text-primary" aria-hidden="true" />
                ) : (
                  <Copy className="size-3.5" aria-hidden="true" />
                )}
                {copied ? "Copied" : "Copy public link"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  openIntent(`https://x.com/intent/post?url=${encodeURIComponent(shareUrl())}&text=${shareText}`)
                }
                className="w-full justify-start gap-2 rounded-lg text-xs"
                aria-label="Share on X"
              >
                <span
                  aria-hidden="true"
                  className="flex size-3.5 items-center justify-center font-bold"
                >
                  X
                </span>
                X
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  openIntent(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl())}`)
                }
                className="w-full justify-start gap-2 rounded-lg text-xs"
                aria-label="Share on LinkedIn"
              >
                <span
                  aria-hidden="true"
                  className="flex size-3.5 items-center justify-center"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5">
                    <path d="M4.98 3.5a2.49 2.49 0 1 1 0 4.98 2.49 2.49 0 0 1 0-4.98ZM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.5c0-1.3-.03-3-1.83-3-1.83 0-2.11 1.43-2.11 2.9V21H9z" />
                  </svg>
                </span>
                LinkedIn
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  openIntent(`mailto:?subject=${shareText}&body=${encodeURIComponent(shareUrl())}`)
                }
                className="w-full justify-start gap-2 rounded-lg text-xs"
                aria-label="Share by email"
              >
                <Mail className="size-3.5" aria-hidden="true" />
                Email
              </Button>
              <p className="px-2 pb-1 pt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                Anyone with the link can view this project (read-only).
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void stopSharing()}
                disabled={busy}
                className="w-full justify-start gap-2 rounded-lg text-xs text-muted-foreground hover:text-destructive"
                aria-label="Stop sharing this project"
              >
                <Link2Off className="size-3.5" aria-hidden="true" />
                Stop sharing
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void createLink()}
                disabled={busy}
                className="w-full justify-start gap-2 rounded-lg text-xs"
                aria-label="Create a public share link for this project"
              >
                <Share2 className="size-3.5" aria-hidden="true" />
                {busy ? "Creating…" : "Create public link"}
              </Button>
              <p className="px-2 pb-1 pt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                Anyone with the link gets a read-only view of this project —
                the conversation, stills, and the produced video. You can
                stop sharing anytime.
              </p>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
