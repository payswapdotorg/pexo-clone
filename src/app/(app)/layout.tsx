import { redirect } from "next/navigation";
import { AppHeader } from "@/components/site/app-header";
import { AppFooter } from "@/components/site/app-footer";
import { SkipLink } from "@/components/site/skip-link";
import { getSession } from "@/lib/session";

/**
 * App shell (/home, /project/[id]) — session-gated (PRODUCT-SPEC §2). The
 * compact app header carries the live credits meter; the footer is pinned
 * to the viewport bottom (spec §6.3).
 */
export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <AppHeader
        user={{ name: user.name, credits: user.credits, plan: user.plan }}
      />
      <main id="main" className="flex min-h-0 flex-1 flex-col">
        {children}
      </main>
      <AppFooter />
    </div>
  );
}
