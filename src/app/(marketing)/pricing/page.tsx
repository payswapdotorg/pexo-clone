import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MODEL_LOGO_STRIP, MODEL_WALL, CREDITS_FAQ, PLANS } from "@/lib/content";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Credit-based plans for every cadence — from a first free render to studio-scale volume.",
};

export default function PricingPage() {
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
            <Sparkles className="size-3.5" aria-hidden="true" />
            Simple, credit-based pricing
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Pay for work, not seats
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty leading-relaxed text-muted-foreground sm:text-lg">
            Every stage of the agent loop has a known, visible cost. Start
            free; upgrade when your calendar does.
          </p>
        </div>
      </section>

      <section aria-label="Plans">
        <div className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {PLANS.map((plan) => (
              <li
                key={plan.name}
                className={cn(
                  "relative flex flex-col rounded-2xl border p-6",
                  plan.featured
                    ? "border-primary/60 bg-card shadow-2xl shadow-primary/10"
                    : "border-border/60 bg-card/40"
                )}
              >
                {plan.featured && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3">
                    Most popular
                  </Badge>
                )}
                <h2 className="text-lg font-semibold">{plan.name}</h2>
                <p className="mt-1 min-h-8 text-xs text-muted-foreground">
                  {plan.blurb}
                </p>
                <p className="mt-4">
                  <span className="text-3xl font-bold tracking-tight">
                    {plan.price}
                  </span>{" "}
                  <span className="text-xs text-muted-foreground">
                    {plan.period}
                  </span>
                </p>
                <p className="mt-1 text-sm font-medium text-primary">
                  {plan.credits}
                </p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant={plan.featured ? "default" : "secondary"}
                  className="mt-6 w-full rounded-xl"
                >
                  <Link href="/login">{plan.cta}</Link>
                </Button>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            All plans include the full agent loop: planning, preview stills,
            chat revisions, and confirm-gated rendering.
          </p>
        </div>
      </section>

      <section
        aria-labelledby="pricing-models"
        className="border-y border-border/60 bg-card/30"
      >
        <div className="mx-auto w-full max-w-5xl px-4 py-12 text-center sm:px-6 lg:px-8">
          <h2
            id="pricing-models"
            className="text-lg font-bold tracking-tight"
          >
            All engines, every plan
          </h2>
          <ul
            aria-label="Featured models"
            className="mt-6 flex flex-wrap justify-center gap-3"
          >
            {MODEL_WALL.map((model) => (
              <li key={model}>
                <Badge
                  variant="secondary"
                  className="rounded-lg border border-border/70 px-3.5 py-1.5 text-sm"
                >
                  {model}
                </Badge>
              </li>
            ))}
          </ul>
          <ul
            aria-label="Also supported"
            className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
          >
            {MODEL_LOGO_STRIP.map((model) => (
              <li
                key={model}
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {model}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="credits-faq">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
          <h2
            id="credits-faq"
            className="text-center text-2xl font-bold tracking-tight"
          >
            Credits, explained
          </h2>
          <Accordion type="single" collapsible className="mt-10 space-y-3">
            {CREDITS_FAQ.map((faq, i) => (
              <AccordionItem
                key={faq.q}
                value={`credits-${i}`}
                className="rounded-xl border border-border/60 bg-card/40 px-5 last:border-b"
              >
                <AccordionTrigger className="py-4 text-left text-sm font-medium hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="mt-10 text-center">
            <Button asChild size="lg" className="rounded-xl px-8">
              <Link href="/login">
                Start with 100 free credits
                <ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
