import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageSquare, Image as ImageIcon, CheckCheck, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { VIDEO_AGENT } from "@/lib/content";

export const metadata: Metadata = {
  title: "AI Video Agent",
  description: VIDEO_AGENT.lede,
};

export default function VideoAgentPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-grid-faint">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
        />
        <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <Badge
            variant="outline"
            className="mb-6 rounded-full border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary"
          >
            {VIDEO_AGENT.eyebrow}
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            {VIDEO_AGENT.h1}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty leading-relaxed text-muted-foreground sm:text-lg">
            {VIDEO_AGENT.lede}
          </p>
        </div>
      </section>

      <section aria-label="The idea in three paragraphs">
        <div className="mx-auto grid w-full max-w-3xl gap-8 px-4 py-14 sm:px-6">
          {VIDEO_AGENT.narrative.map((para, i) => (
            <p
              key={i}
              className={
                i === 0
                  ? "text-lg font-medium leading-relaxed text-foreground"
                  : "leading-relaxed text-muted-foreground"
              }
            >
              {para}
            </p>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="capabilities-heading"
        className="border-y border-border/60 bg-card/30"
      >
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2
            id="capabilities-heading"
            className="text-2xl font-bold tracking-tight"
          >
            What the agent does differently
          </h2>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {VIDEO_AGENT.capabilities.map((cap, i) => (
              <li
                key={cap.title}
                className="rounded-xl border border-border/60 bg-background/60 p-6"
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  {i % 3 === 0 ? (
                    <MessageSquare className="size-5" aria-hidden="true" />
                  ) : i % 3 === 1 ? (
                    <ImageIcon className="size-5" aria-hidden="true" />
                  ) : (
                    <ListChecks className="size-5" aria-hidden="true" />
                  )}
                </span>
                <h3 className="mt-4 text-base font-semibold">{cap.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {cap.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="va-qa-heading">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
          <h2 id="va-qa-heading" className="text-2xl font-bold tracking-tight">
            Straight questions
          </h2>
          <Accordion type="single" collapsible className="mt-8 space-y-3">
            {VIDEO_AGENT.qa.map((qa, i) => (
              <AccordionItem
                key={qa.q}
                value={`va-qa-${i}`}
                className="rounded-xl border border-border/60 bg-card/40 px-5 last:border-b"
              >
                <AccordionTrigger className="py-4 text-left text-sm font-medium hover:no-underline">
                  {qa.q}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
                  {qa.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section aria-labelledby="va-cta-heading" className="border-t border-border/60 bg-card/30">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-16 text-center sm:px-6">
          <CheckCheck className="size-8 text-primary" aria-hidden="true" />
          <h2 id="va-cta-heading" className="mt-4 text-2xl font-bold tracking-tight">
            See the loop for yourself
          </h2>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            One prompt gets you a plan, a preview, and a decision to make.
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
