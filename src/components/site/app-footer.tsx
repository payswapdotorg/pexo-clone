import Link from "next/link";
import { Clapperboard } from "lucide-react";
import { BRAND } from "@/lib/brand";

/** Compact app footer for the workspace pages (PRODUCT-SPEC §6.3 sticky). */
export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-card/30">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/home"
          className="flex min-h-8 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`${BRAND} workspace home`}
        >
          <span className="flex size-5 items-center justify-center rounded bg-primary text-primary-foreground">
            <Clapperboard className="size-3" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold tracking-tight">{BRAND}</span>
        </Link>
        <nav
          aria-label="App footer"
          className="flex flex-wrap items-center gap-x-5 gap-y-1"
        >
          <Link
            href="/video-agent"
            className="inline-flex min-h-8 items-center rounded text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            AI Video Agent
          </Link>
          <Link
            href="/skills"
            className="inline-flex min-h-8 items-center rounded text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Skills
          </Link>
          <Link
            href="/pricing"
            className="inline-flex min-h-8 items-center rounded text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Pricing
          </Link>
        </nav>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} {BRAND} — demo build, no billing.
        </p>
      </div>
    </footer>
  );
}
