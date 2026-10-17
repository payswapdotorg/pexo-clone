"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock3, Loader2, FolderClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProjectRow {
  id: string;
  title: string;
  status: "working" | "ready";
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}

function timeAgo(ts: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function RecentProjects() {
  const [projects, setProjects] = useState<ProjectRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/biz/projects?page=1&page_size=10");
        if (!res.ok) throw new Error(`Failed (${res.status})`);
        const data = (await res.json()) as { projects: ProjectRow[] };
        if (!cancelled) {
          setProjects(data.projects);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load projects");
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section aria-labelledby="recent-projects" className="mt-12">
      <h2
        id="recent-projects"
        className="flex items-center gap-2 text-lg font-semibold"
      >
        <FolderClock className="size-5 text-primary" aria-hidden="true" />
        Recent projects
      </h2>

      {projects === null && !error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/60 bg-card/40 p-5 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Loading projects…
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-5 text-sm text-destructive-foreground">
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
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
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
                  <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock3 className="size-3" aria-hidden="true" />
                    {timeAgo(p.updatedAt)} · {p.messageCount} messages
                  </span>
                </span>
                <Badge
                  variant="secondary"
                  className="shrink-0 rounded-full"
                >
                  {p.status === "working" ? "Working" : "Ready"}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
