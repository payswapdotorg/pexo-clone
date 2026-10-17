import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { HeroComposer } from "@/components/site/hero-composer";
import { RecentProjects } from "@/components/site/recent-projects";
import { LogoutButton } from "@/components/site/logout-button";

export const metadata: Metadata = {
  title: "Workspace",
};

export const dynamic = "force-dynamic";

export default async function HomeWorkspacePage() {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  const firstName = user.name.split(" ")[0];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Let&apos;s create videos together, {firstName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Start a project below — the agent plans, previews, and renders with
            your go-ahead.
          </p>
        </div>
        <LogoutButton />
      </div>

      <div className="mt-8">
        <HeroComposer />
      </div>

      <RecentProjects />

      <p className="mt-10 text-center text-xs text-muted-foreground/60">
        PC1 workspace: template gallery, quick starts, and credits arrive in
        phase 2.
      </p>
    </div>
  );
}
