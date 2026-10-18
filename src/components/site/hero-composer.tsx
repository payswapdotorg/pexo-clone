"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowUp,
  Link2,
  FileText,
  ImageIcon,
  Film,
  Music,
  Paperclip,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EXAMPLE_PROMPTS, HERO } from "@/lib/content";

type AttachKind = "url" | "pdf" | "image" | "video" | "audio";

interface Attachment {
  kind: AttachKind;
  value: string;
}

const ATTACH_MENU: { kind: AttachKind; label: string; icon: React.ReactNode }[] =
  [
    { kind: "url", label: "URL", icon: <Link2 className="size-4" /> },
    { kind: "pdf", label: "PDF", icon: <FileText className="size-4" /> },
    { kind: "image", label: "Image", icon: <ImageIcon className="size-4" /> },
    { kind: "video", label: "Video", icon: <Film className="size-4" /> },
    { kind: "audio", label: "Audio", icon: <Music className="size-4" /> },
  ];

const CHIP_STYLE =
  "whitespace-nowrap rounded-full border border-border/70 bg-card px-4 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function HeroComposer({
  projectId = null,
  showChips = true,
}: {
  projectId?: string | null;
  showChips?: boolean;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [picking, setPicking] = useState<AttachKind | null>(null);
  const [pickValue, setPickValue] = useState("");
  const [sending, setSending] = useState(false);
  const [pending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = 0;
  }, []);

  const busy = sending || pending;
  const canSend = text.trim().length > 0 && !busy;

  const pickExample = (prompt: string) => {
    setText(prompt);
    textareaRef.current?.focus();
  };

  const addAttachment = () => {
    const v = pickValue.trim();
    if (!v || !picking) return;
    setAttachments((prev) => [...prev, { kind: picking, value: v }]);
    setPickValue("");
    setPicking(null);
  };

  const send = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          message: text.trim(),
          attachments,
        }),
      });
      if (res.status === 401) {
        toast("Sign in to start your first project", {
          description: "Redirecting you to the login page…",
        });
        startTransition(() => router.push("/login"));
        return;
      }
      if (res.status === 429) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        toast("The agent needs a short breather", {
          description:
            body.message ??
            "You're sending faster than the agent can think — try again in a moment.",
        });
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
          message?: string;
        };
        throw new Error(
          body.message ?? body.error ?? `Request failed (${res.status})`
        );
      }
      const data = (await res.json()) as { projectId: string };
      startTransition(() => router.push(`/project/${data.projectId}`));
    } catch (err) {
      toast.error("Could not start the project", {
        description:
          err instanceof Error ? err.message : "Unexpected error — try again.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <section aria-label="Prompt composer">
      <div className="rounded-2xl border border-border/70 bg-card/70 p-3 shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-4">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          aria-label={HERO.composerLabel}
          placeholder={HERO.composerPlaceholder}
          rows={3}
          maxLength={2000}
          className="resize-none border-0 bg-transparent px-2 py-1.5 text-base shadow-none focus-visible:ring-0 sm:text-lg"
        />

        {attachments.length > 0 && (
          <ul className="flex flex-wrap gap-2 px-2 pb-2" aria-label="Attachments">
            {attachments.map((a, i) => (
              <li
                key={`${a.kind}-${a.value}-${i}`}
                className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 pl-2.5 pr-1.5 py-1 text-xs"
              >
                <Paperclip className="size-3 text-primary" aria-hidden="true" />
                <span className="max-w-40 truncate" title={a.value}>
                  <span className="font-medium uppercase">{a.kind}</span>:{" "}
                  {a.value}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setAttachments((prev) => prev.filter((_, j) => j !== i))
                  }
                  aria-label={`Remove ${a.kind} attachment`}
                  className="rounded-full p-0.5 hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {picking && (
          <div className="flex items-center gap-2 px-2 pb-2">
            <label className="sr-only" htmlFor="attach-value">
              {picking} value
            </label>
            <input
              id="attach-value"
              value={pickValue}
              onChange={(e) => setPickValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addAttachment();
                }
                if (e.key === "Escape") setPicking(null);
              }}
              placeholder={
                picking === "url"
                  ? "https://your-product-page…"
                  : `Paste a ${picking} reference…`
              }
              autoFocus
              className="h-8 w-full max-w-xs rounded-md border border-border bg-background px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={addAttachment}
              disabled={!pickValue.trim()}
            >
              Add
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setPicking(null);
                setPickValue("");
              }}
            >
              Cancel
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 px-1 pt-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Add attachment (URL, PDF, image, video, or audio)"
                title="Add attachment"
              >
                <Paperclip className="size-4.5" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {ATTACH_MENU.map((item) => (
                <DropdownMenuItem
                  key={item.kind}
                  onClick={() => {
                    setPicking(item.kind);
                    setPickValue("");
                  }}
                  className="gap-2"
                >
                  {item.icon}
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            type="button"
            size="icon"
            onClick={() => void send()}
            disabled={!canSend}
            aria-label="Send prompt to the video agent"
            className="size-10 rounded-xl"
          >
            {busy ? (
              <Loader2 className="size-4.5 animate-spin" aria-hidden="true" />
            ) : (
              <ArrowUp className="size-5" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      {showChips && (
        <div
          ref={scrollRef}
          role="group"
          aria-label="Example prompts"
          className="mt-4 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]"
        >
          {EXAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => pickExample(prompt)}
              className={CHIP_STYLE}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
