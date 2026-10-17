"use client";

import { useState } from "react";
import { Hand, Loader2, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ChatFeedback } from "@/lib/chat-types";

const RATINGS: {
  value: "good" | "okay" | "bad";
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "good", label: "Good", icon: <ThumbsUp className="size-4" aria-hidden="true" /> },
  { value: "okay", label: "Okay", icon: <Hand className="size-4" aria-hidden="true" /> },
  { value: "bad", label: "Bad", icon: <ThumbsDown className="size-4" aria-hidden="true" /> },
];

/**
 * Satisfaction widget (AGENT-PROTOCOL S6) — shown after the latest
 * delivery while the project has no recorded feedback.
 */
export function FeedbackWidget({
  projectId,
  feedback,
}: {
  projectId: string;
  feedback: ChatFeedback | null;
}) {
  const [submitted, setSubmitted] = useState<string | null>(
    feedback?.rating ?? null
  );
  const [busy, setBusy] = useState<string | null>(null);

  const rate = async (rating: "good" | "okay" | "bad") => {
    setBusy(rating);
    try {
      const res = await fetch(`/api/biz/projects/${projectId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `Failed (${res.status})`);
      }
      setSubmitted(rating);
      toast("Thanks — noted.");
    } catch (err) {
      toast.error("Could not record your rating", {
        description:
          err instanceof Error ? err.message : "Unexpected error — try again.",
      });
    } finally {
      setBusy(null);
    }
  };

  if (submitted) {
    return (
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="flex size-5 items-center justify-center rounded-full bg-primary/15 text-primary">
          <ThumbsUp className="size-3" aria-hidden="true" />
        </span>
        Thanks — noted. You rated this delivery{" "}
        <span className="font-medium capitalize text-foreground">
          {submitted}
        </span>
        .
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card/40 p-4">
      <p className="text-sm font-medium">Are you satisfied with the video?</p>
      <div className="flex items-center gap-2" role="group" aria-label="Rate the delivered video">
        {RATINGS.map((rating) => (
          <Button
            key={rating.value}
            type="button"
            variant="outline"
            size="sm"
            disabled={busy !== null}
            onClick={() => void rate(rating.value)}
            className="h-8 gap-1.5 rounded-lg text-xs"
            aria-label={`Rate the video: ${rating.label}`}
          >
            {busy === rating.value ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              rating.icon
            )}
            {rating.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
