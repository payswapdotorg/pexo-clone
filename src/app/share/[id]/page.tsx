import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bot, Clapperboard, Eye, UserRound } from "lucide-react";
import { db } from "@/lib/db";
import { BRAND } from "@/lib/brand";
import { Markdown } from "@/components/site/markdown";
import { SkipLink } from "@/components/site/skip-link";

/**
 * /share/[id] — the public, read-only project view (share honesty).
 *
 * Sharing is opt-in and owner-controlled: the Share menu creates an
 * unguessable public id (POST /api/biz/projects/[id]/share) and this page
 * renders exactly what a recipient needs — the conversation, the stills,
 * and the produced video — with no composer, no credits, no feedback, and
 * no session required. Revoking the id (or deleting the project) 404s
 * this page immediately.
 */
export const dynamic = "force-dynamic";

const STAGE_LABELS: Record<string, string> = {
  INTAKE: "Plan",
  PLAN_QUESTIONS: "Plan",
  STILL_PREVIEW: "Preview",
  DELIVERY: "Delivery",
  FEEDBACK: "Follow-up",
};

const SEGMENT_RE = /^[A-Za-z0-9_-]{8,64}$/;

async function loadSharedProject(publicId: string) {
  if (!SEGMENT_RE.test(publicId)) return null;
  const project = await db.project.findUnique({
    where: { publicId },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
    },
  });
  if (!project) return null;

  const [messages, artifacts] = await Promise.all([
    db.message.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        role: true,
        markdown: true,
        stage: true,
        createdAt: true,
      },
    }),
    db.artifact.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        kind: true,
        url: true,
        filename: true,
        durationSec: true,
      },
    }),
  ]);
  return { project, messages, artifacts };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await loadSharedProject(id);
  return {
    title: data ? `${data.project.title} — shared` : "Shared project",
    robots: { index: false, follow: false },
  };
}

export default async function SharedProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadSharedProject(id);
  if (!data) notFound();

  const { project, messages, artifacts } = data;
  const videos = artifacts.filter((a) => a.kind === "video");
  const stills = artifacts.filter((a) => a.kind !== "video");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SkipLink />
      <header className="border-b border-border/60 bg-card/40">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`${BRAND} home`}
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Clapperboard className="size-4" aria-hidden="true" />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              {BRAND}
            </span>
          </Link>
          <span
            className="ml-auto flex items-center gap-1.5 rounded-full border border-border/70 bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
            aria-label="Read-only shared view"
          >
            <Eye className="size-3" aria-hidden="true" />
            Shared — read only
          </span>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight">{project.title}</h1>
        <p className="mt-1.5 text-xs text-muted-foreground">
          A read-only view shared by the project owner. Videos and stills
          stream from the project&apos;s storage; nothing here can be edited.
        </p>

        {videos.length > 0 && (
          <section aria-label="Produced videos" className="mt-8 space-y-5">
            {videos.map((video) => (
              <figure
                key={video.id}
                className="overflow-hidden rounded-2xl border border-border/70 bg-card"
              >
                <video
                  controls
                  preload="metadata"
                  className="w-full"
                  src={video.url}
                  aria-label={`Produced video ${video.filename}`}
                />
                <figcaption className="flex items-center gap-2 p-3 text-xs text-muted-foreground">
                  <span className="truncate font-medium text-foreground/80">
                    {video.filename}
                  </span>
                  {video.durationSec !== null && (
                    <span className="ml-auto shrink-0">
                      {video.durationSec}s
                    </span>
                  )}
                </figcaption>
              </figure>
            ))}
          </section>
        )}

        <section aria-label="Conversation" className="mt-8">
          <h2 className="text-sm font-semibold text-muted-foreground">
            How it was made
          </h2>
          <ol className="mt-3 space-y-4">
            {messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <li
                  key={message.id}
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
                      <span className="rounded-full border border-primary/40 px-2 py-0.5 text-[10px] text-primary">
                        {STAGE_LABELS[message.stage] ?? message.stage}
                      </span>
                    )}
                  </div>
                  <div className="mt-2.5 text-sm leading-relaxed">
                    <Markdown>{message.markdown}</Markdown>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {stills.length > 0 && (
          <section aria-label="Preview stills" className="mt-8">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Preview stills
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {stills.map((still) => (
                <figure
                  key={still.id}
                  className="overflow-hidden rounded-xl border border-border/70 bg-card"
                >
                  <img
                    src={still.url}
                    alt={`Preview still ${still.filename}`}
                    loading="lazy"
                    className="w-full"
                  />
                </figure>
              ))}
            </div>
          </section>
        )}

        <p className="mt-10 rounded-xl border border-dashed border-border/70 p-4 text-xs leading-relaxed text-muted-foreground">
          This link shows the project as the owner shared it. If the owner
          revokes sharing or deletes the project, this page disappears.{" "}
          <Link
            href="/"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Make your own video with {BRAND}
          </Link>
          .
        </p>
      </main>

      <footer className="mt-auto border-t border-border/60 bg-card/40 py-5">
        <p className="mx-auto w-full max-w-3xl px-4 text-center text-xs text-muted-foreground sm:px-6">
          {BRAND} — shared project view
        </p>
      </footer>
    </div>
  );
}
