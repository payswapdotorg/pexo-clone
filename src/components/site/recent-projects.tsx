"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronDown, FolderClock, Loader2, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ProjectRow {
  id: string;
  title: string;
  status: "working" | "waiting" | "ready";
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}

const COLLAPSE_KEY = "vidra_recent_collapsed";
const PAGE_SIZE = 6;

function StatusChip({
  status,
}: {
  status: "working" | "waiting" | "ready";
}) {
  if (status === "working") {
    return (
      <span
        className="flex shrink-0 items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"
        aria-label="Status: working"
      >
        <span className="relative flex size-2" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </span>
        Working
      </span>
    );
  }
  if (status === "waiting") {
    return (
      <span
        className="flex shrink-0 items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"
        aria-label="Status: your move"
      >
        <MessageCircle className="size-3" aria-hidden="true" />
        Your move
      </span>
    );
  }
  return (
    <span
      className="flex shrink-0 items-center gap-1.5 rounded-full border border-border/70 bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
      aria-label="Status: ready"
    >
      <CheckCircle2 className="size-3" aria-hidden="true" />
      Ready
    </span>
  );
}

/**
 * Recent-projects strip on /home (PRODUCT-SPEC §2): collapsible (persisted),
 * status chips, relative time via date-fns, focus refetch.
 */
export function RecentProjects() {
  const [projects, setProjects] = useState<ProjectRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(COLLAPSE_KEY) === "1") {
        setOpen(false);
      }
    } catch {
      /* storage unavailable — stay open */
    }
  }, []);

  const toggleOpen = (next: boolean) => {
    setOpen(next);
    try {
      window.localStorage.setItem(COLLAPSE_KEY, next ? "0" : "1");
    } catch {
      /* storage unavailable — collapse is per-visit only */
    }
  };

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/biz/projects?page=1&page_size=${PAGE_SIZE}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const data = (await res.json()) as { projects: ProjectRow[] };
      setProjects(data.projects);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load projects"
      );
    }
  }, []);

  useEffect(() => {
    void load();
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  return (
    <section aria-labelledby="recent-projects" className="mt-12">
      <Collapsible open={open} onOpenChange={toggleOpen}>
        <h2
          id="recent-projects"
          className="flex items-center gap-2 text-lg font-semibold"
        >
          <FolderClock className="size-5 text-primary" aria-hidden="true" />
          <CollapsibleTrigger
            className="flex items-center gap-2 rounded-lg py-1 text-left text-lg font-semibold transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={
              open ? "Collapse recent projects" : "Expand recent projects"
            }
          >
            Recent projects
            <ChevronDown
              className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 [[data-state=closed]>&]:rotate-180"
              aria-hidden="true"
            />
          </CollapsibleTrigger>
        </h2>

        <CollapsibleContent>
          {projects === null && !error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/60 bg-card/40 p-5 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Loading projects…
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-5 text-sm text-destructive-foreground"
            >
              {error} — try refreshing the page.
            </p>
          )}

          {projects !== null && projects.length === 0 && (
            <p className="mt-4 rounded-xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
              No projects yet. Send your first prompt above and it will show up
              here.
            </p>
          )}

          {projects !== null && projects.length > 0 && (
            <ul
              className="mt-4 grid max-h-96 gap-3 overflow-y-auto pr-1 scrollbar-app sm:grid-cols-2"
              aria-label="Recent projects list"
            >
              {projects.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/project/${p.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/40 p-4 transition-colors hover:border-primary/40 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {p.title}
                      </span>
                      <span
                        suppressHydrationWarning
                        className="mt-1 block text-xs text-muted-foreground"
                      >
                        {formatDistanceToNow(new Date(p.updatedAt), {
                          addSuffix: true,
                        })}{" "}
                        · {p.messageCount} messages
                      </span>
                    </span>
                    <StatusChip status={p.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
