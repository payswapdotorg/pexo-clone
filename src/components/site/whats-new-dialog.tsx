"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WHATS_NEW } from "@/lib/content";

export const WHATS_NEW_STORAGE_KEY = "vidra_whats_new_v1";

/**
 * First-run "What's new" dialog (PRODUCT-SPEC §2 /home surface): 3 slides
 * with prev/next + dots. Any dismissal records the storage key so it never
 * auto-opens again.
 */
export function WhatsNewDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [slide, setSlide] = useState(0);
  const last = slide === WHATS_NEW.length - 1;

  const dismiss = () => {
    try {
      window.localStorage.setItem(WHATS_NEW_STORAGE_KEY, "seen");
    } catch {
      /* storage unavailable — the dialog just won't stay dismissed */
    }
    setSlide(0);
    onOpenChange(false);
    /*
     * The dialog auto-opens (no invoking trigger), so Radix has nowhere to
     * return focus — send keyboard users to the page's composer instead of
     * dumping them back at the document body (WCAG 2.4.3 focus order).
     */
    window.requestAnimationFrame(() => {
      const target =
        document.querySelector<HTMLTextAreaElement>("textarea") ??
        document.querySelector<HTMLElement>("h1");
      if (target) {
        if (!(target instanceof HTMLTextAreaElement)) {
          target.setAttribute("tabindex", "-1");
        }
        target.focus({ preventScroll: false });
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) dismiss();
      }}
    >
      <DialogContent className="max-w-md rounded-2xl border-border/70 bg-card p-0 overflow-hidden max-sm:top-[10.5rem] max-sm:max-h-[calc(100dvh-12rem)] max-sm:translate-y-0 max-sm:overflow-y-auto">
        <div
          aria-hidden="true"
          className="relative flex h-32 items-center justify-center bg-gradient-to-br from-primary/25 via-accent to-background"
        >
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Sparkles className="size-6" aria-hidden="true" />
          </span>
        </div>
        <div className="p-6 pt-4">
          <DialogHeader>
            <DialogTitle className="text-lg leading-snug">
              {WHATS_NEW[slide].title}
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {WHATS_NEW[slide].text}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 flex items-center justify-between gap-3">
            <div
              className="flex items-center gap-2"
              role="tablist"
              aria-label="What's new slides"
            >
              {WHATS_NEW.map((item, i) => (
                <button
                  key={item.title}
                  type="button"
                  role="tab"
                  aria-selected={i === slide}
                  aria-label={`Slide ${i + 1}: ${item.title}`}
                  onClick={() => setSlide(i)}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span
                    aria-hidden="true"
                    className={
                      i === slide
                        ? "block size-2 rounded-full bg-primary"
                        : "block size-2 rounded-full bg-muted-foreground/40"
                    }
                  />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {slide > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSlide((s) => s - 1)}
                  aria-label="Previous slide"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                </Button>
              )}
              {last ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => dismiss()}
                  aria-label="Start creating"
                >
                  Start creating
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setSlide((s) => s + 1)}
                  aria-label="Next slide"
                >
                  Next
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
