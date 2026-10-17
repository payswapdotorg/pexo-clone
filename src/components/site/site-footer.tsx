import Link from "next/link";
import { Clapperboard, Github } from "lucide-react";
import { BRAND, BRAND_DESCRIPTION } from "@/lib/brand";
import {
  FOOTER_LEGAL,
  FOOTER_SECTIONS,
  FOOTER_SOCIALS,
} from "@/lib/content";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-card/40">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Link
              href="/"
              className="flex w-fit items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`${BRAND} home`}
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Clapperboard className="size-4" aria-hidden="true" />
              </span>
              <span className="text-lg font-semibold tracking-tight">
                {BRAND}
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {BRAND_DESCRIPTION}
            </p>
            <p className="mt-4 text-xs text-muted-foreground/70">
              A clean-room behavioral clone built for study. Not affiliated
              with any commercial video product.
            </p>
          </div>

          {FOOTER_SECTIONS.map((section) => (
            <nav key={section.title} aria-label={section.title}>
              <h3 className="text-sm font-semibold">{section.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="rounded text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-6 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="flex flex-wrap items-center gap-2"
            aria-label="Community links (placeholders)"
          >
            {FOOTER_SOCIALS.map((s) => (
              <span
                key={s.label}
                aria-label={`${s.label} (placeholder)`}
                title={`${s.label} — community link arrives in a later phase`}
                className="cursor-default rounded-md border border-border/60 px-2.5 py-1.5 text-xs font-medium text-muted-foreground"
              >
                {s.label}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {FOOTER_LEGAL.map((l) => (
              <span
                key={l.label}
                aria-label={`${l.label} (placeholder)`}
                title={`${l.label} — legal page arrives in a later phase`}
                className="cursor-default rounded text-xs text-muted-foreground"
              >
                {l.label}
              </span>
            ))}
            <a
              href="https://github.com/payswapdotorg/pexo-clone"
              className="flex items-center gap-1.5 rounded text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Source repository on GitHub"
            >
              <Github className="size-3.5" aria-hidden="true" />
              Source
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
