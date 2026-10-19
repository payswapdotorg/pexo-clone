"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ProjectRow {
  id: string;
  title: string;
  status: "working" | "waiting" | "ready";
  updatedAt: number;
}

const PAGE_SIZE = 20;

/**
 * Recent-projects sidebar (PRODUCT-SPEC §2 /project): active highlight,
 * working indicator, delete with confirmation. Rendered inside the desktop
 * resizable panel and the mobile Sheet.
 */
export function ProjectSidebar({ activeId }: { activeId: string }) {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

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
  }, [load]);

  const remove = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/biz/projects/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(body.message ?? `Failed (${res.status})`);
      }
      if (id === activeId) {
        router.push("/home");
        router.refresh();
      } else {
        setProjects((prev) => prev?.filter((p) => p.id !== id) ?? prev);
        toast("Project deleted");
      }
    } catch (err) {
      toast.error("Could not delete the project", {
        description:
          err instanceof Error ? err.message : "Unexpected error — try again.",
      });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <nav
      aria-label="Recent projects"
      className="flex h-full min-h-0 flex-col border-r border-border/60 bg-card/20"
    >
      <p className="shrink-0 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Projects
      </p>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3 scrollbar-app">
        {projects === null && !error && (
          <p
            className="flex items-center gap-2 px-2 py-3 text-xs text-muted-foreground"
            aria-live="polite"
          >
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            Loading…
          </p>
        )}
        {error && (
          <p role="alert" className="px-2 py-3 text-xs text-destructive-foreground">
            {error} — refresh to retry.
          </p>
        )}
        {projects !== null && projects.length === 0 && (
          <p className="px-2 py-3 text-xs text-muted-foreground">
            No other projects yet.
          </p>
        )}
        {projects !== null && projects.length > 0 && (
          <ul className="space-y-1">
            {projects.map((project) => {
              const active = project.id === activeId;
              return (
                <li key={project.id} className="flex items-center gap-1">
                  <Link
                    href={`/project/${project.id}`}
                    aria-current={active ? "page" : undefined}
                    className={
                      active
                        ? "flex min-w-0 flex-1 items-center gap-2.5 rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-2 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        : "flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    }
                  >
                    <span className="relative flex size-2 shrink-0" aria-hidden="true">
                      {project.status === "working" ? (
                        <>
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                          <span className="relative inline-flex size-2 rounded-full bg-primary" />
                        </>
                      ) : project.status === "waiting" ? (
                        <span className="inline-flex size-2 rounded-full bg-primary/70" />
                      ) : (
                        <span className="inline-flex size-2 rounded-full bg-muted-foreground/50" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate" title={project.title}>
                      {project.title}
                    </span>
                    <span className="sr-only">
                      {project.status === "working"
                        ? "Working"
                        : project.status === "waiting"
                          ? "Your move"
                          : "Ready"}
                    </span>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 text-muted-foreground hover:text-destructive-foreground"
                        aria-label={`Delete project ${project.title}`}
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl border-border/70 bg-card">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete project?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This removes the conversation and its files. The
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-lg">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          disabled={deleting === project.id}
                          onClick={() => void remove(project.id)}
                          className="rounded-lg bg-destructive text-white hover:bg-destructive/90"
                        >
                          {deleting === project.id && (
                            <Loader2
                              className="size-4 animate-spin"
                              aria-hidden="true"
                            />
                          )}
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </nav>
  );
}
