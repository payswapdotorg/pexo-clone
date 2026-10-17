import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Bot, UserRound, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HeroComposer } from "@/components/site/hero-composer";
import { getProject } from "@/lib/store";

export const metadata: Metadata = {
  title: "Project",
};

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/home"
        className="inline-flex items-center gap-1.5 rounded text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to workspace
      </Link>

      <header className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
            {project.title}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Project {project.id}
          </p>
        </div>
        <Badge
          variant="secondary"
          className="gap-1.5 rounded-full"
          aria-label={`Project status: ${project.status}`}
        >
          <Loader2 className="size-3 animate-spin" aria-hidden="true" />
          Working
        </Badge>
      </header>

      <ol
        aria-label="Conversation"
        className="mt-8 space-y-4"
      >
        {project.messages.map((msg) => (
          <li
            key={msg.id}
            className={
              msg.role === "user"
                ? "ml-auto max-w-[85%] rounded-2xl rounded-br-md border border-border/70 bg-card/70 p-4"
                : "max-w-[92%] rounded-2xl rounded-bl-md border border-primary/25 bg-primary/5 p-4"
            }
          >
            <div className="flex items-center gap-2">
              <span
                className={
                  msg.role === "user"
                    ? "flex size-6 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
                    : "flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
                }
                aria-hidden="true"
              >
                {msg.role === "user" ? (
                  <UserRound className="size-3.5" />
                ) : (
                  <Bot className="size-3.5" />
                )}
              </span>
              <span className="text-xs font-semibold">
                {msg.role === "user" ? "You" : "Agent"}
              </span>
              {msg.role === "agent" && msg.stage && (
                <Badge
                  variant="outline"
                  className="rounded-full border-primary/40 text-[10px] text-primary"
                >
                  {msg.stage}
                </Badge>
              )}
              <time
                dateTime={new Date(msg.ts).toISOString()}
                className="ml-auto text-[11px] text-muted-foreground/70"
              >
                {new Date(msg.ts).toLocaleTimeString()}
              </time>
            </div>
            <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {msg.markdown}
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-8">
        <HeroComposer projectId={project.id} showChips={false} />
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground/60">
        PC1 scope: the chat column renders the project conversation. The full
        agent brain (plan → still → confirm → render) arrives in phase 2.
      </p>
    </div>
  );
}
