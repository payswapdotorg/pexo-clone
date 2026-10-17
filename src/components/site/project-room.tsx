"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Bot,
  CheckCircle2,
  ChevronDown,
  Download,
  Film,
  FolderOpen,
  Lightbulb,
  Loader2,
  PanelLeft,
  Pencil,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { WorkspaceComposer } from "@/components/site/workspace-composer";
import { ProjectSidebar } from "@/components/site/project-sidebar";
import { Markdown } from "@/components/site/markdown";
import { ShareMenu } from "@/components/site/share-menu";
import { FeedbackWidget } from "@/components/site/feedback-widget";
import {
  StillArtifactCard,
  VideoArtifactCard,
} from "@/components/site/artifact-cards";
import { useComposerStore } from "@/lib/composer-store";
import { GUIDANCE } from "@/lib/content";
import type {
  ChatArtifact,
  ChatAttachment,
  ChatFeedback,
  ChatMessage,
} from "@/lib/chat-types";

/**
 * Mobile-first SSR (matches the mobile tree in the initial HTML — no desktop
 * panel overflow flash on phones); matchMedia upgrades to the resizable
 * desktop tree after hydration.
 */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

const STAGE_LABELS: Record<string, string> = {
  PLAN_QUESTIONS: "Plan",
  STILL_PREVIEW: "Preview",
  DELIVERY: "Delivery",
  FEEDBACK: "Feedback",
};

function WorkingDots() {
  return (
    <span className="flex items-end gap-0.5" aria-hidden="true">
      <span className="size-1 animate-bounce rounded-full bg-primary" />
      <span className="size-1 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
      <span className="size-1 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
    </span>
  );
}

/** The backend appends "[attached kind: value]" chips to user markdown. */
function stripAttachmentChips(
  markdown: string,
  attachments: ChatAttachment[] | null
): string {
  if (!attachments || attachments.length === 0) return markdown;
  const chips = attachments
    .map((a) => `[attached ${a.kind}: ${a.value}]`)
    .join(" ");
  if (markdown.endsWith(chips)) {
    return markdown.slice(0, markdown.length - chips.length).trimEnd();
  }
  return markdown;
}

function GuidanceCollapsible() {
  return (
    <Collapsible>
      <CollapsibleTrigger
        className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Read editing guidance"
      >
        <Lightbulb className="size-3.5" aria-hidden="true" />
        Read editing guidance
        <ChevronDown
          className="size-3.5 text-muted-foreground transition-transform duration-200 [[data-state=closed]>&]:rotate-180"
          aria-hidden="true"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="mt-2 space-y-2 rounded-lg border border-border/60 bg-background/40 p-3">
          {GUIDANCE.map((tip) => (
            <li
              key={tip}
              className="flex gap-2 text-xs leading-relaxed text-muted-foreground"
            >
              <span
                className="mt-1.5 size-1 shrink-0 rounded-full bg-primary/70"
                aria-hidden="true"
              />
              {tip}
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

function MessageItem({
  message,
  projectTitle,
  showGuidance,
}: {
  message: ChatMessage;
  projectTitle: string;
  showGuidance: boolean;
}) {
  const isUser = message.role === "user";
  const attachments = message.attachments ?? [];

  return (
    <li
      className={
        isUser
          ? "ml-auto max-w-[85%] rounded-2xl rounded-br-md border border-border/70 bg-card/70 p-4"
          : "max-w-[92%] rounded-2xl rounded-bl-md border border-primary/25 bg-primary/5 p-4"
      }
    >
      <div className="flex items-center gap-2">
        <span
          className={
            isUser
              ? "flex size-6 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
              : "flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
          }
          aria-hidden="true"
        >
          {isUser ? (
            <UserRound className="size-3.5" />
          ) : (
            <Bot className="size-3.5" />
          )}
        </span>
        <span className="text-xs font-semibold">
          {isUser ? "You" : "Agent"}
        </span>
        {!isUser && message.stage && (
          <Badge
            variant="outline"
            className="rounded-full border-primary/40 text-[10px] text-primary"
          >
            {STAGE_LABELS[message.stage] ?? message.stage}
          </Badge>
        )}
        <time
          dateTime={message.createdAt}
          suppressHydrationWarning
          className="ml-auto text-[11px] text-muted-foreground/70"
        >
          {format(new Date(message.createdAt), "HH:mm")}
        </time>
      </div>

      {isUser ? (
        <div className="mt-2.5">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {stripAttachmentChips(message.markdown, message.attachments)}
          </p>
          {attachments.length > 0 && (
            <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Attachments">
              {attachments.map((attachment, i) => (
                <li
                  key={`${attachment.kind}-${i}`}
                  className="flex max-w-full items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px]"
                >
                  <span className="font-medium uppercase">{attachment.kind}</span>
                  <span className="max-w-44 truncate text-muted-foreground">
                    {attachment.value}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="mt-1.5">
          <Markdown>{message.markdown}</Markdown>
          {message.artifacts.length > 0 && (
            <div className="mt-3 space-y-3">
              {message.artifacts.map((artifact) =>
                artifact.kind === "video" ? (
                  <VideoArtifactCard
                    key={artifact.id}
                    artifact={artifact}
                    projectTitle={projectTitle}
                  />
                ) : (
                  <StillArtifactCard key={artifact.id} artifact={artifact} />
                )
              )}
            </div>
          )}
          {showGuidance && <GuidanceCollapsible />}
        </div>
      )}
    </li>
  );
}

function AssetRow({ artifact }: { artifact: ChatArtifact }) {
  const isStill = artifact.kind === "still";
  return (
    <li className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/40 p-2">
      <a
        href={artifact.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-w-0 flex-1 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Open ${artifact.filename} in a new tab`}
      >
        {isStill ? (
          <img
            src={artifact.url}
            alt={`Still frame preview: ${artifact.filename}`}
            className="h-12 w-20 shrink-0 rounded-md border border-border/60 object-cover"
            loading="lazy"
          />
        ) : (
          <span className="flex h-12 w-20 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted">
            <Film className="size-5 text-muted-foreground" aria-hidden="true" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium">
            {artifact.filename}
          </span>
          <span className="mt-0.5 block text-[11px] text-muted-foreground">
            {artifact.kind === "still" ? "Still" : "Video"}
            {artifact.durationSec !== null
              ? ` · ${artifact.durationSec}s`
              : ""}
          </span>
        </span>
      </a>
      <a
        href={artifact.url}
        download={artifact.filename}
        className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Download ${artifact.filename}`}
      >
        <Download className="size-4" aria-hidden="true" />
      </a>
    </li>
  );
}

function ChatHeaderRow({
  projectId,
  title,
  status,
  artifacts,
}: {
  projectId: string;
  title: string;
  status: "working" | "ready";
  artifacts: ChatArtifact[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [saving, setSaving] = useState(false);
  const [assetsOpen, setAssetsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const editRef = useRef(false);

  const beginEdit = () => {
    setDraft(title);
    editRef.current = true;
    setEditing(true);
  };

  const commit = async () => {
    if (!editRef.current) return;
    editRef.current = false;
    const trimmed = draft.trim();
    if (!trimmed || trimmed === title) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/biz/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(body.message ?? `Failed (${res.status})`);
      }
      toast("Project renamed");
      router.refresh();
    } catch (err) {
      toast.error("Could not rename the project", {
        description:
          err instanceof Error ? err.message : "Unexpected error — try again.",
      });
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  return (
    <div className="shrink-0 border-b border-border/60 bg-background/70 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 md:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open projects sidebar"
        >
          <PanelLeft className="size-4.5" aria-hidden="true" />
        </Button>

        {editing ? (
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void commit();
              }
              if (e.key === "Escape") {
                editRef.current = false;
                setEditing(false);
              }
            }}
            onBlur={() => void commit()}
            autoFocus
            maxLength={80}
            aria-label="Project title"
            className="h-9 min-w-0 flex-1 rounded-lg bg-card text-sm sm:max-w-md"
          />
        ) : (
          <h1
            className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight sm:text-lg"
            title={title}
            aria-label={`${title} — project ${projectId}`}
          >
            {title}
          </h1>
        )}

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground"
            onClick={beginEdit}
            disabled={editing || saving}
            aria-label="Rename project"
            title="Rename project"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Pencil className="size-4" aria-hidden="true" />
            )}
          </Button>

          <Badge
            variant="secondary"
            className="gap-1.5 rounded-full"
            aria-label={`Project status: ${
              status === "working" ? "Working" : "Ready"
            }`}
          >
            {status === "working" ? (
              <Loader2 className="size-3 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="size-3" aria-hidden="true" />
            )}
            {status === "working" ? "Working" : "Ready"}
          </Badge>

          <Sheet open={assetsOpen} onOpenChange={setAssetsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 rounded-lg text-xs text-muted-foreground"
                aria-label={`Open assets (${artifacts.length})`}
              >
                <FolderOpen className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Assets</span>
                <span className="tabular-nums text-muted-foreground/70">
                  {artifacts.length}
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-80 gap-0 p-0 sm:w-96"
              aria-describedby={undefined}
            >
              <SheetHeader className="shrink-0 border-b border-border/60 px-4 py-3">
                <SheetTitle className="text-base">Assets</SheetTitle>
              </SheetHeader>
              <div className="max-h-[calc(100dvh-6rem)] overflow-y-auto scrollbar-app p-3">
                {artifacts.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
                    No assets yet — stills and videos land here as the agent
                    produces them.
                  </p>
                ) : (
                  <ul className="space-y-2" aria-label="Project assets">
                    {artifacts.map((artifact) => (
                      <AssetRow key={artifact.id} artifact={artifact} />
                    ))}
                  </ul>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <ShareMenu title={title} />
        </div>
      </div>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          className="w-72 gap-0 p-0"
          aria-describedby={undefined}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Projects</SheetTitle>
          </SheetHeader>
          <ProjectSidebar activeId={projectId} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

export interface ProjectRoomProps {
  projectId: string;
  initialTitle: string;
  status: "working" | "ready";
  /** True when the persisted tree shows a user turn the agent has not answered. */
  agentMidTurn: boolean;
  initialEventCursor: number;
  messages: ChatMessage[];
  artifacts: ChatArtifact[];
  feedback: ChatFeedback | null;
}

/**
 * /project/[id] room (PRODUCT-SPEC §2): resizable sidebar + chat column
 * (markdown turns, stills, produced videos, feedback), working banner,
 * composer, and the events long-poll loop driving live refreshes.
 */
export function ProjectRoom({
  projectId,
  initialTitle,
  status,
  agentMidTurn,
  initialEventCursor,
  messages,
  artifacts,
  feedback,
}: ProjectRoomProps) {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const setCredits = useComposerStore((s) => s.setCredits);
  const [sendBusy, setSendBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* Events long-poll: message/artifact/status events refresh the room;
     credits events update the header meter live. */
  useEffect(() => {
    const controller = new AbortController();
    let stopped = false;
    let cursor = initialEventCursor;
    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const run = async () => {
      while (!stopped) {
        try {
          const res = await fetch(
            `/api/biz/web-push/events?after_event_id=${cursor}&project_id=${projectId}`,
            { signal: controller.signal, cache: "no-store" }
          );
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          if (!res.ok) {
            throw new Error(`Events request failed (${res.status})`);
          }
          const data = (await res.json()) as {
            events: {
              id: number;
              type: string;
              payload: { credits?: number };
            }[];
            last_event_id: number;
          };
          cursor = data.last_event_id;
          let needsRefresh = false;
          for (const event of data.events) {
            if (
              event.type === "credits.updated" &&
              typeof event.payload?.credits === "number"
            ) {
              setCredits(event.payload.credits);
            } else if (
              event.type === "message.created" ||
              event.type === "artifact.created" ||
              event.type === "project.status"
            ) {
              needsRefresh = true;
            }
          }
          if (needsRefresh) {
            router.refresh();
          }
        } catch {
          if (stopped || controller.signal.aborted) return;
          await sleep(3000);
        }
      }
    };

    void run();
    return () => {
      stopped = true;
      controller.abort();
    };
  }, [projectId, initialEventCursor, router, setCredits]);

  /* Auto-scroll the conversation on new messages. */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight });
  }, [messages.length]);

  const firstPlanId = useMemo(() => {
    const first = messages.find(
      (m) => m.role === "agent" && m.stage === "PLAN_QUESTIONS"
    );
    return first?.id ?? null;
  }, [messages]);

  const lastDeliveryId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i];
      if (message.role === "agent" && message.stage === "DELIVERY") {
        return message.id;
      }
    }
    return null;
  }, [messages]);

  const working = sendBusy || agentMidTurn;

  const chatColumn = (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto scrollbar-app"
        role="log"
        aria-label="Conversation"
      >
        <ol className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6 sm:px-6">
          {messages.map((message) => (
            <Fragment key={message.id}>
              <MessageItem
                message={message}
                projectTitle={initialTitle}
                showGuidance={message.id === firstPlanId}
              />
              {message.id === lastDeliveryId && (
                <li className="max-w-[92%]">
                  <FeedbackWidget projectId={projectId} feedback={feedback} />
                </li>
              )}
            </Fragment>
          ))}
        </ol>
      </div>

      <div className="shrink-0 border-t border-border/60 bg-card/20">
        {working && (
          <p
            role="status"
            aria-live="polite"
            className="mx-auto flex w-full max-w-3xl items-center gap-2 px-4 pb-1.5 pt-3 text-xs font-medium text-primary sm:px-6"
          >
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            Agent is working — this can take a couple of minutes for renders
            <WorkingDots />
          </p>
        )}
        <div className="mx-auto w-full max-w-3xl px-4 py-3 sm:px-6">
          <WorkspaceComposer
            projectId={projectId}
            onSent={() => router.refresh()}
            onBusyChange={setSendBusy}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatHeaderRow
        projectId={projectId}
        title={initialTitle}
        status={status}
        artifacts={artifacts}
      />
      {isDesktop ? (
        <ResizablePanelGroup
          direction="horizontal"
          className="min-h-0 flex-1"
        >
          <ResizablePanel
            defaultSize={20}
            minSize={15}
            collapsible
            className="min-w-0"
          >
            <ProjectSidebar activeId={projectId} />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={80} className="min-w-0">
            {chatColumn}
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        chatColumn
      )}
    </div>
  );
}
