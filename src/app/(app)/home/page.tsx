import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { WorkspaceComposer } from "@/components/site/workspace-composer";
import { TemplateGallery } from "@/components/site/template-gallery";
import { RecentProjects } from "@/components/site/recent-projects";

export const metadata: Metadata = {
  title: "Workspace",
};

export const dynamic = "force-dynamic";

/**
 * /home — the workspace (PRODUCT-SPEC §2): greeting, main composer, quick
 * starts (inside the composer), template gallery, recent projects.
 */
export default async function HomeWorkspacePage() {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  const firstName = user.name.split(" ")[0];

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Let&apos;s create videos together, {firstName}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Start a project below — the agent plans, previews, and renders with
        your go-ahead.
      </p>

      <div className="mt-8">
        <WorkspaceComposer />
      </div>

      <TemplateGallery />

      <RecentProjects />
    </div>
  );
}
