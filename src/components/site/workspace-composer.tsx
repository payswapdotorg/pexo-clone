"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUp,
  FileText,
  Film,
  ImageIcon,
  LayoutTemplate,
  Link2,
  Loader2,
  Music,
  Paperclip,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useComposerStore } from "@/lib/composer-store";
import {
  CONFIRM_POLICIES,
  HERO,
  QUICK_STARTS,
  TEMPLATE_FIELDS,
} from "@/lib/content";

type AttachKind = "url" | "pdf" | "image" | "video" | "audio";

interface Attachment {
  kind: AttachKind;
  value: string;
}

interface ChatSendResult {
  projectId: string;
  title: string;
  turn: { stage: string; markdown: string; blocked?: string };
  artifacts: {
    id: string;
    kind: string;
    url: string;
    filename: string;
    durationSec?: number;
  }[];
  credits: number;
  status: string;
}

const ATTACH_MENU: { kind: AttachKind; label: string; icon: React.ReactNode }[] =
  [
    { kind: "url", label: "URL", icon: <Link2 className="size-4" /> },
    { kind: "pdf", label: "PDF", icon: <FileText className="size-4" /> },
    { kind: "image", label: "Image", icon: <ImageIcon className="size-4" /> },
    { kind: "video", label: "Video", icon: <Film className="size-4" /> },
    { kind: "audio", label: "Audio", icon: <Music className="size-4" /> },
  ];

const UPLOAD_ACCEPT: Record<Exclude<AttachKind, "url">, string> = {
  pdf: ".pdf",
  image: "image/*",
  video: "video/*",
  audio: "audio/*",
};

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_ATTACHMENTS = 8;
const POLICY_STORAGE_KEY = "vidra_confirm_policy";

type ConfirmPolicyValue = (typeof CONFIRM_POLICIES)[number]["value"];

const ATTACH_KINDS: AttachKind[] = [
  "url",
  "pdf",
  "image",
  "video",
  "audio",
];

function isAttachKind(kind: string): kind is AttachKind {
  return ATTACH_KINDS.includes(kind as AttachKind);
}

const QUICK_START_ICONS: Record<string, React.ReactNode> = {
  animation: <Film className="size-3.5" aria-hidden="true" />,
  "short-film": <ImageIcon className="size-3.5" aria-hidden="true" />,
  explainer: <LayoutTemplate className="size-3.5" aria-hidden="true" />,
  "ugc-ad": <Paperclip className="size-3.5" aria-hidden="true" />,
};

const EMPTY_TEMPLATE: Record<string, string> = {};

function WorkingDots() {
  return (
    <span className="flex items-end gap-0.5" aria-hidden="true">
      <span className="size-1 animate-bounce rounded-full bg-primary" />
      <span className="size-1 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
      <span className="size-1 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
    </span>
  );
}

/**
 * The workspace composer (PRODUCT-SPEC §2 /home main composer): promo
 * template card, attachments (paste or upload), confirm-policy selector,
 * quick starts (workspace variant), and the single send path shared by
 * /home (navigates to the project) and /project (onSent → refresh).
 */
export function WorkspaceComposer({
  projectId = null,
  onSent,
  onBusyChange,
}: {
  projectId?: string | null;
  onSent?: (result: ChatSendResult) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [picking, setPicking] = useState<AttachKind | null>(null);
  const [pickValue, setPickValue] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [pending, startTransition] = useTransition();
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateValues, setTemplateValues] = useState<Record<string, string>>(
    EMPTY_TEMPLATE
  );
  const [confirmPolicy, setConfirmPolicy] =
    useState<ConfirmPolicyValue>("always");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const promptSeq = useComposerStore((s) => s.promptSeq);
  const setCredits = useComposerStore((s) => s.setCredits);

  /* Restore the persisted confirm policy. */
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(POLICY_STORAGE_KEY);
      if (
        saved === "large_costs" ||
        saved === "always" ||
        saved === "never"
      ) {
        setConfirmPolicy(saved);
      }
    } catch {
      /* storage unavailable — keep the safe default */
    }
  }, []);

  /* Template-gallery prefill. */
  useEffect(() => {
    if (promptSeq === 0) return;
    setText(useComposerStore.getState().promptDraft);
    textareaRef.current?.focus();
  }, [promptSeq]);

  const busy = sending || pending;
  const attachmentsFull = attachments.length >= MAX_ATTACHMENTS;

  const buildMessage = (): string => {
    const filled = TEMPLATE_FIELDS.map((field) => ({
      label: field.label,
      value: (templateValues[field.id] ?? "").trim(),
    })).filter((field) => field.value.length > 0);
    const block = filled.map((f) => `${f.label}: ${f.value}`).join("\n");
    const free = text.trim();
    if (block && free) return `${block}\n\n${free}`;
    return block || free;
  };

  const message = buildMessage();
  const canSend = message.length > 0 && !busy;

  const send = async (override?: string) => {
    const bodyText = (override ?? buildMessage()).trim();
    if (!bodyText || busy) return;
    setSending(true);
    onBusyChange?.(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          message: bodyText,
          attachments,
          confirmPolicy,
        }),
      });
      if (res.status === 401) {
        toast("Sign in to keep the conversation going", {
          description: "Redirecting you to the login page…",
        });
        startTransition(() => router.push("/login"));
        return;
      }
      if (res.status === 502) {
        toast.error(
          "The agent hit a snag generating this turn — nothing was charged"
        );
        return;
      }
      if (res.status === 429) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        toast("The agent needs a short breather", {
          description:
            body.message ??
            "You're sending messages faster than it can think — try again in a moment.",
        });
        return;
      }
      const data = (await res.json().catch(() => ({}))) as ChatSendResult & {
        message?: string;
      };
      if (!res.ok) {
        throw new Error(data.message ?? `Request failed (${res.status})`);
      }
      setCredits(data.credits);
      if (data.turn?.blocked === "credits") {
        toast.warning("Not enough credits for that step — nothing was charged", {
          description: "Upgrade from the header to keep going.",
        });
      }
      if (projectId) {
        setText("");
        setAttachments([]);
        setTemplateValues(EMPTY_TEMPLATE);
        setTemplateOpen(false);
        setPicking(null);
        onSent?.(data);
      } else {
        startTransition(() => router.push(`/project/${data.projectId}`));
      }
    } catch (err) {
      toast.error("Could not send the message", {
        description:
          err instanceof Error ? err.message : "Unexpected error — try again.",
      });
    } finally {
      setSending(false);
      onBusyChange?.(false);
    }
  };

  /* Latest send for store-routed actions (Mark to fix). */
  const sendRef = useRef<(override?: string) => Promise<void>>(
    async () => undefined
  );
  useEffect(() => {
    sendRef.current = send;
  });

  /* Store subscriptions: "Insert to input" attachments + Mark-to-fix sends. */
  useEffect(() => {
    const unsub = useComposerStore.subscribe((state, prev) => {
      if (state.insertQueue.length > prev.insertQueue.length) {
        const drained = useComposerStore.getState().drainInserts();
        const items = drained
          .filter((item) => isAttachKind(item.kind))
          .map((item) => ({ kind: item.kind as AttachKind, value: item.value }));
        if (items.length > 0) {
          setAttachments((current) =>
            [...current, ...items].slice(0, MAX_ATTACHMENTS)
          );
          textareaRef.current?.focus();
          toast("Reference added to your input");
        }
      }
      if (state.pendingFixText && state.pendingFixText !== prev.pendingFixText) {
        const fixText = state.pendingFixText;
        useComposerStore.getState().setPendingFixText(null);
        void sendRef.current(`Please fix: ${fixText}`);
      }
    });
    return unsub;
  }, []);

  const addPasteAttachment = () => {
    const v = pickValue.trim();
    if (!v || !picking) return;
    setAttachments((prev) =>
      prev.length >= MAX_ATTACHMENTS
        ? prev
        : [...prev, { kind: picking, value: v }]
    );
    setPickValue("");
    setPicking(null);
  };

  const uploadFile = async (file: File) => {
    if (!picking || picking === "url") return;
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("File is too large", {
        description: "Attachments must be 8MB or smaller.",
      });
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: form });
      if (res.status === 401) {
        toast("Sign in to attach files", {
          description: "Redirecting you to the login page…",
        });
        startTransition(() => router.push("/login"));
        return;
      }
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        filename?: string;
        kind?: string;
        message?: string;
      };
      const url = typeof data.url === "string" ? data.url : "";
      const kind = isAttachKind(data.kind ?? "") ? (data.kind as AttachKind) : null;
      if (!res.ok || !url || !kind) {
        throw new Error(data.message ?? `Upload failed (${res.status})`);
      }
      setAttachments((prev) =>
        prev.length >= MAX_ATTACHMENTS
          ? prev
          : [...prev, { kind, value: url }]
      );
      toast(`Attached ${data.filename ?? "file"}`);
      setPicking(null);
      setPickValue("");
    } catch (err) {
      toast.error("Could not attach the file", {
        description:
          err instanceof Error ? err.message : "Unexpected error — try again.",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <section aria-label="Prompt composer">
      <div className="rounded-2xl border border-border/70 bg-card/70 p-3 shadow-2xl shadow-black/40 backdrop-blur-sm has-[textarea:focus-visible]:border-primary/60 has-[textarea:focus-visible]:ring-2 has-[textarea:focus-visible]:ring-ring/70 sm:p-4">
        {/* Template card (the ~30s promo template) */}
        <Collapsible open={templateOpen} onOpenChange={setTemplateOpen}>
          <CollapsibleTrigger
            disabled={busy}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Use the ~30s promo template"
          >
            <LayoutTemplate className="size-4 text-primary" aria-hidden="true" />
            Use the ~30s promo template
            <span className="ml-auto flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              {templateOpen ? "Hide" : "Open"}
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 grid gap-3 rounded-xl border border-border/60 bg-background/40 p-3 sm:grid-cols-2">
              {TEMPLATE_FIELDS.map((field) => (
                <div key={field.id} className="flex flex-col gap-1">
                  <label
                    htmlFor={`template-${field.id}`}
                    className="text-[11px] font-medium text-muted-foreground"
                  >
                    {field.label}
                    {field.optional && (
                      <span className="ml-1 font-normal">
                        (optional)
                      </span>
                    )}
                  </label>
                  <Input
                    id={`template-${field.id}`}
                    value={templateValues[field.id] ?? ""}
                    onChange={(e) =>
                      setTemplateValues((prev) => ({
                        ...prev,
                        [field.id]: e.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                    disabled={busy}
                    maxLength={300}
                    className="h-8 rounded-lg bg-card text-xs"
                  />
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

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
          disabled={busy}
          aria-label={HERO.composerLabel}
          placeholder={HERO.composerPlaceholder}
          rows={3}
          maxLength={2000}
          className="resize-none border-0 bg-transparent px-2 py-2 text-base shadow-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-60 sm:text-lg"
        />

        {attachments.length > 0 && (
          <ul className="flex flex-wrap gap-2 px-2 pb-2" aria-label="Attachments">
            {attachments.map((a, i) => (
              <li
                key={`${a.kind}-${a.value}-${i}`}
                className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 py-1 pl-2.5 pr-1.5 text-xs"
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
                  disabled={busy}
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
          <div className="mx-2 mb-2 rounded-xl border border-border/60 bg-background/40 p-3">
            <p className="text-xs font-medium text-foreground">
              Add a {picking === "url" ? "URL" : picking.toUpperCase()} reference
            </p>
            <div className="mt-2 flex items-center gap-2">
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
                    addPasteAttachment();
                  }
                  if (e.key === "Escape") {
                    setPicking(null);
                    setPickValue("");
                  }
                }}
                placeholder={
                  picking === "url"
                    ? "https://your-product-page…"
                    : `Paste a ${picking} reference…`
                }
                autoFocus
                maxLength={500}
                className="h-8 w-full max-w-xs rounded-md border border-border bg-card px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={addPasteAttachment}
                disabled={!pickValue.trim() || busy}
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
            {picking !== "url" && (
              <>
                <div className="my-2.5 flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span className="h-px flex-1 bg-border" aria-hidden="true" />
                  or upload
                  <span className="h-px flex-1 bg-border" aria-hidden="true" />
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={uploading || busy}
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-1.5 rounded-lg"
                  aria-label={`Upload a ${picking} file`}
                >
                  {uploading ? (
                    <Loader2
                      className="size-3.5 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Upload className="size-3.5" aria-hidden="true" />
                  )}
                  {uploading ? "Uploading…" : "Upload a file"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={UPLOAD_ACCEPT[picking]}
                  className="hidden"
                  aria-hidden="true"
                  tabIndex={-1}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadFile(file);
                  }}
                />
                <p className="mt-1.5 text-[10px] text-muted-foreground">
                  PDF, image, video, or audio — 8MB max.
                </p>
              </>
            )}
          </div>
        )}

        {busy && (
          <p
            className="flex items-center gap-2 px-2 pb-1 text-xs text-muted-foreground"
            aria-live="polite"
          >
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            Agent is working
            <WorkingDots />
          </p>
        )}

        <div className="flex items-center justify-between gap-2 px-1 pt-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={busy || attachmentsFull || picking !== null}
                  aria-label={
                    attachmentsFull
                      ? "Attachment limit reached (8)"
                      : "Add attachment (URL, PDF, image, video, or audio)"
                  }
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

            <Select
              value={confirmPolicy}
              onValueChange={(value: string) => {
                const policy = CONFIRM_POLICIES.find((p) => p.value === value);
                if (!policy) return;
                setConfirmPolicy(policy.value);
                try {
                  window.localStorage.setItem(POLICY_STORAGE_KEY, policy.value);
                } catch {
                  /* storage unavailable — policy stays for this page only */
                }
              }}
              disabled={busy}
            >
              <SelectTrigger
                size="sm"
                aria-label="Confirm before render"
                title="Confirm before render"
                className="h-8 gap-1.5 rounded-lg border-border/70 bg-transparent text-xs text-muted-foreground"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONFIRM_POLICIES.map((policy) => (
                  <SelectItem
                    key={policy.value}
                    value={policy.value}
                    className="text-xs"
                  >
                    {policy.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {attachments.length > 0 && (
              <Badge
                variant="outline"
                className="hidden rounded-full border-border/60 text-[10px] text-muted-foreground sm:inline-flex"
                aria-label={`${attachments.length} of ${MAX_ATTACHMENTS} attachments`}
              >
                {attachments.length}/{MAX_ATTACHMENTS}
              </Badge>
            )}
          </div>

          <Button
            type="button"
            size="icon"
            onClick={() => void send()}
            disabled={!canSend}
            aria-label="Send prompt to the video agent"
            className="size-11 rounded-xl"
          >
            {busy ? (
              <Loader2 className="size-4.5 animate-spin" aria-hidden="true" />
            ) : (
              <ArrowUp className="size-5" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      {/* Quick starts — workspace variant only */}
      {projectId === null && (
        <div
          role="group"
          aria-label="Quick starts"
          className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-app [scrollbar-width:thin]"
        >
          {QUICK_STARTS.map((start) => (
            <button
              key={start.id}
              type="button"
              disabled={busy}
              onClick={() => {
                setText(start.prompt);
                textareaRef.current?.focus();
              }}
              className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border/70 bg-card px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`${start.label} — prefills the composer`}
            >
              {QUICK_START_ICONS[start.id]}
              {start.label}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
