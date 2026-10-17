"use client";

import { useState } from "react";
import { Download, ExternalLink, Film, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ShareMenu } from "@/components/site/share-menu";
import { useComposerStore } from "@/lib/composer-store";
import type { ChatArtifact } from "@/lib/chat-types";

/** Still frame attached to an agent message — with Insert to input. */
export function StillArtifactCard({ artifact }: { artifact: ChatArtifact }) {
  const enqueueInsert = useComposerStore((s) => s.enqueueInsert);

  return (
    <figure className="m-0">
      <img
        src={artifact.url}
        alt={`Still frame preview: ${artifact.filename}`}
        className="w-full max-w-md rounded-xl border border-border/70"
        loading="lazy"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-8 gap-1.5 rounded-lg text-xs"
          onClick={() =>
            enqueueInsert({ kind: "image", value: artifact.url })
          }
          aria-label="Insert this still into the prompt input"
        >
          Insert to input
        </Button>
        <a
          href={artifact.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/70 px-3 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Open ${artifact.filename} in a new tab`}
        >
          <ExternalLink className="size-3.5" aria-hidden="true" />
          Open
        </a>
        <figcaption className="text-[11px] text-muted-foreground">
          {artifact.filename}
        </figcaption>
      </div>
    </figure>
  );
}

/** "Produced Video" card (AGENT-PROTOCOL S5) — player, badge, actions. */
export function VideoArtifactCard({
  artifact,
  projectTitle,
}: {
  artifact: ChatArtifact;
  projectTitle: string;
}) {
  const setPendingFixText = useComposerStore((s) => s.setPendingFixText);
  const [fixOpen, setFixOpen] = useState(false);
  const [fixText, setFixText] = useState("");

  const sendFix = () => {
    const trimmed = fixText.trim();
    if (!trimmed) return;
    setPendingFixText(trimmed);
    setFixOpen(false);
    setFixText("");
    toast("Sending your fix request to the agent");
  };

  return (
    <figure className="m-0 w-full max-w-xl overflow-hidden rounded-xl border border-primary/30 bg-card/60">
      <div className="relative bg-black">
        <video
          controls
          preload="metadata"
          className="w-full"
          aria-label={`Produced video: ${artifact.filename}`}
        >
          <source
            src={artifact.url}
            type={artifact.url.endsWith(".webm") ? "video/webm" : "video/mp4"}
          />
        </video>
        {artifact.durationSec !== null && (
          <span
            className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white/90"
            aria-label={`Duration: ${artifact.durationSec} seconds`}
          >
            {artifact.durationSec}s
          </span>
        )}
      </div>
      <figcaption className="p-3">
        <p className="flex items-center gap-1.5 text-xs font-medium">
          <Film className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
          <span className="truncate" title={artifact.filename}>
            {artifact.filename}
          </span>
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <a
            href={artifact.url}
            download={artifact.filename}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/70 px-3 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Download ${artifact.filename}`}
          >
            <Download className="size-3.5" aria-hidden="true" />
            Download
          </a>
          <ShareMenu title={projectTitle} compact />
          <Dialog open={fixOpen} onOpenChange={setFixOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 rounded-lg text-xs"
                aria-label="Mark this video to fix"
              >
                <Wrench className="size-3.5" aria-hidden="true" />
                Mark to fix
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-2xl border-border/70 bg-card">
              <DialogHeader>
                <DialogTitle>Mark to fix</DialogTitle>
                <DialogDescription>
                  Tell the agent what to change — it goes straight back to a
                  fresh preview before any re-render.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                value={fixText}
                onChange={(e) => setFixText(e.target.value)}
                placeholder="What should the agent fix?"
                rows={4}
                maxLength={2000}
                aria-label="What should the agent fix?"
                className="mt-1 resize-none rounded-lg bg-background/60 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendFix();
                  }
                }}
                autoFocus
              />
              <DialogFooter className="mt-3 gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setFixOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={sendFix}
                  disabled={!fixText.trim()}
                  aria-label="Send the fix request to the agent"
                  className="rounded-lg"
                >
                  Send fix request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </figcaption>
    </figure>
  );
}
