"use client";

import { useState } from "react";
import { Check, Copy, Mail, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Share menu (PRODUCT-SPEC §2 project header + Produced Video card):
 * copy link, X, LinkedIn, and Email intents with the current URL.
 */
export function ShareMenu({
  title,
  compact = false,
}: {
  title: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const currentUrl = () => window.location.href.split("#")[0];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl());
      setCopied(true);
      toast("Link copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy the link", {
        description: "Your browser blocked clipboard access.",
      });
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
      <PopoverContent align="end" className="w-52 p-2">
        <div className="flex flex-col gap-1" role="group" aria-label="Share options">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void copyLink()}
            className="w-full justify-start gap-2 rounded-lg text-xs"
            aria-label="Copy link to this project"
          >
            {copied ? (
              <Check className="size-3.5 text-primary" aria-hidden="true" />
            ) : (
              <Copy className="size-3.5" aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy link"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              openIntent(`https://x.com/intent/post?url=${encodeURIComponent(currentUrl())}&text=${shareText}`)
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
              openIntent(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl())}`)
            }
            className="w-full justify-start gap-2 rounded-lg text-xs"
            aria-label="Share on LinkedIn"
          >
            <span aria-hidden="true" className="flex size-3.5 items-center justify-center">
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
              openIntent(`mailto:?subject=${shareText}&body=${encodeURIComponent(currentUrl())}`)
            }
            className="w-full justify-start gap-2 rounded-lg text-xs"
            aria-label="Share by email"
          >
            <Mail className="size-3.5" aria-hidden="true" />
            Email
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
