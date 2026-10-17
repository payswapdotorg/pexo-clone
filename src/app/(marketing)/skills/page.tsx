import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Terminal, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SkillsCopyButton } from "@/components/site/skills-copy-button";
import { SKILLS } from "@/lib/content";

export const metadata: Metadata = {
  title: "Skills",
  description: SKILLS.lede,
};

export default function SkillsPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-grid-faint">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
        />
        <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <Badge
            variant="outline"
            className="mb-6 rounded-full border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary"
          >
            {SKILLS.eyebrow}
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            {SKILLS.h1}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty leading-relaxed text-muted-foreground sm:text-lg">
            {SKILLS.lede}
          </p>

          <div className="mx-auto mt-10 max-w-xl">
            <div className="flex items-center justify-between gap-2 rounded-xl border border-border/70 bg-card/80 p-2 pl-4 text-left shadow-2xl shadow-black/40">
              <div className="flex min-w-0 items-center gap-3">
                <Terminal
                  className="size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <code className="truncate font-mono text-sm">
                  {SKILLS.installCommand}
                </code>
              </div>
              <SkillsCopyButton command={SKILLS.installCommand} />
            </div>
            <a
              href="https://github.com/payswapdotorg/pexo-clone"
              className="mt-4 inline-flex items-center gap-1.5 rounded text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Github className="size-3.5" aria-hidden="true" />
              Skill repository on GitHub
            </a>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="skills-capabilities"
        className="border-y border-border/60 bg-card/30"
      >
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2
            id="skills-capabilities"
            className="text-2xl font-bold tracking-tight"
          >
            What your agent gains
          </h2>
          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {SKILLS.capabilities.map((cap) => (
              <li
                key={cap.title}
                className="rounded-xl border border-border/60 bg-background/60 p-6"
              >
                <h3 className="text-base font-semibold">{cap.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {cap.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="skills-verticals">
        <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
          <h2
            id="skills-verticals"
            className="text-2xl font-bold tracking-tight"
          >
            Built for your lane
          </h2>
          <ul className="mt-8 divide-y divide-border/60 rounded-xl border border-border/60 bg-card/40">
            {SKILLS.verticals.map((v) => (
              <li
                key={v.title}
                className="flex flex-col gap-1 p-5 sm:flex-row sm:items-baseline sm:gap-6"
              >
                <h3 className="min-w-44 text-sm font-semibold">{v.title}</h3>
                <p className="flex-1 text-sm text-muted-foreground">{v.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        aria-labelledby="skills-tabs"
        className="border-t border-border/60 bg-card/30"
      >
        <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6">
          <h2 id="skills-tabs" className="text-2xl font-bold tracking-tight">
            Three crafts, one install
          </h2>
          <Tabs defaultValue="video" className="mt-8">
            <TabsList
              aria-label="Skill crafts"
              className="bg-card/60 p-1"
            >
              {SKILLS.tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {SKILLS.tabs.map((tab) => (
              <TabsContent
                key={tab.id}
                value={tab.id}
                className="mt-6 focus-visible:outline-none"
              >
                <ul className="grid gap-4 sm:grid-cols-3">
                  {tab.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-xl border border-border/60 bg-background/60 p-5 text-sm leading-relaxed text-muted-foreground"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      <section aria-labelledby="skills-cta">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-16 text-center sm:px-6">
          <h2 id="skills-cta" className="text-2xl font-bold tracking-tight">
            Wire it up in under a minute
          </h2>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            Install once; every agent in your stack can direct video work.
          </p>
          <Button asChild size="lg" className="mt-8 rounded-xl px-8">
            <Link href="/login">
              Get Started
              <ArrowRight className="ml-2 size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
