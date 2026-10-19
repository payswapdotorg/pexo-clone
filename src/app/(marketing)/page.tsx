import Link from "next/link";
import {
  Type,
  Image as ImageIcon,
  Link2,
  AudioLines,
  ScrollText,
  UserRound,
  Sparkles,
  Music,
  ArrowRight,
  Play,
  Clock3,
  Quote,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeroComposer } from "@/components/site/hero-composer";
import {
  BLOG_POSTS,
  CATEGORIES,
  EXAMPLE_PROMPTS,
  FAQS,
  FEATURES,
  HERO,
  MODEL_LOGO_STRIP,
  MODEL_WALL,
  STEPS,
  TESTIMONIALS,
} from "@/lib/content";
import { BRAND_TAGLINE } from "@/lib/brand";

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  type: <Type className="size-5" aria-hidden="true" />,
  image: <ImageIcon className="size-5" aria-hidden="true" />,
  link: <Link2 className="size-5" aria-hidden="true" />,
  audio: <AudioLines className="size-5" aria-hidden="true" />,
  scroll: <ScrollText className="size-5" aria-hidden="true" />,
  user: <UserRound className="size-5" aria-hidden="true" />,
  sparkles: <Sparkles className="size-5" aria-hidden="true" />,
  music: <Music className="size-5" aria-hidden="true" />,
};

export default function HomePage() {
  return (
    <>
      {/* ---------------------------------------------------------- hero -- */}
      <section className="relative overflow-hidden bg-grid-faint">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
        />
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-4 pb-16 pt-16 text-center sm:px-6 sm:pt-24">
          <Badge
            variant="outline"
            className="mb-6 gap-1.5 rounded-full border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary"
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            {HERO.eyebrow}
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
            Turn a sentence into a{" "}
            <span className="text-gradient-warm">finished video</span>
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {HERO.subhead}
          </p>
          <div className="mt-10 w-full">
            <HeroComposer />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            {EXAMPLE_PROMPTS.length}+ starting points above — tap one, or write
            your own.
          </p>
        </div>
      </section>

      {/* --------------------------------------------------------- steps -- */}
      <section
        aria-labelledby="how-it-delivers"
        className="border-y border-border/60 bg-card/30"
      >
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2
            id="how-it-delivers"
            className="text-center text-2xl font-bold tracking-tight sm:text-3xl"
          >
            How it delivers
          </h2>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="relative rounded-xl border border-border/60 bg-background/60 p-6"
              >
                <span
                  aria-hidden="true"
                  className="absolute -top-3 left-5 flex size-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
                >
                  {i + 1}
                </span>
                <h3 className="mt-2 text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* --------------------------------------------------- categories -- */}
      <section
        id="categories"
        aria-labelledby="categories-heading"
        className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
      >
        <h2
          id="categories-heading"
          className="text-2xl font-bold tracking-tight sm:text-3xl"
        >
          Made with the agent
        </h2>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Real briefs, real output shapes. Pick a lane to see what a first
          prompt looks like.
        </p>
        <Tabs defaultValue={CATEGORIES[0].id} className="mt-8">
          <TabsList
            aria-label="Video categories"
            className="h-auto flex-wrap justify-start gap-1 bg-card/60 p-1"
          >
            {CATEGORIES.map((cat) => (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {CATEGORIES.map((cat) => (
            <TabsContent
              key={cat.id}
              value={cat.id}
              className="mt-6 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {cat.cards.map((card) => (
                  <li
                    key={card.title}
                    className="group overflow-hidden rounded-xl border border-border/60 bg-card/40 transition-shadow hover:shadow-lg hover:shadow-black/30"
                  >
                    <div
                      aria-hidden="true"
                      className={`relative flex aspect-video items-center justify-center bg-gradient-to-br ${card.gradient}`}
                    >
                      <span className="flex size-12 items-center justify-center rounded-full border border-white/30 bg-black/30 backdrop-blur-sm transition-transform group-hover:scale-110">
                        <Play
                          className="size-5 text-white"
                          fill="currentColor"
                          aria-hidden="true"
                        />
                      </span>
                      <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-medium text-white/90">
                        <Clock3 className="size-3" aria-hidden="true" />
                        {card.duration}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-semibold">{card.title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {card.blurb}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </TabsContent>
          ))}
        </Tabs>
      </section>

      {/* --------------------------------------------------- model wall -- */}
      <section
        id="models"
        aria-labelledby="models-heading"
        className="border-y border-border/60 bg-card/30"
      >
        <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2
            id="models-heading"
            className="text-center text-xl font-bold tracking-tight"
          >
            One agent. Every engine it needs.
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm text-muted-foreground">
            The agent picks the right generator for the job — you never touch a
            model menu.
          </p>
          <ul
            aria-label="Featured models"
            className="mt-8 flex flex-wrap justify-center gap-3"
          >
            {MODEL_WALL.map((model) => (
              <li key={model}>
                <Badge
                  variant="secondary"
                  className="rounded-lg border border-border/70 px-4 py-2 text-sm font-medium"
                >
                  {model}
                </Badge>
              </li>
            ))}
          </ul>
          <ul
            aria-label="Also supported"
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
          >
            {MODEL_LOGO_STRIP.map((model) => (
              <li
                key={model}
                className="text-sm font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {model}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ----------------------------------------------------- features -- */}
      <section
        aria-labelledby="features-heading"
        className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
      >
        <h2
          id="features-heading"
          className="text-2xl font-bold tracking-tight sm:text-3xl"
        >
          Everything in, everything out
        </h2>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Whatever form your idea is in right now, there is a path to video.
        </p>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <li
              key={feature.title}
              className="rounded-xl border border-border/60 bg-card/40 p-5 transition-colors hover:border-primary/40"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                {FEATURE_ICONS[feature.icon]}
              </span>
              <h3 className="mt-4 text-sm font-semibold">{feature.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {feature.text}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* ------------------------------------------------- testimonials -- */}
      <section
        aria-labelledby="testimonials-heading"
        className="border-y border-border/60 bg-card/30"
      >
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2
            id="testimonials-heading"
            className="text-2xl font-bold tracking-tight sm:text-3xl"
          >
            People who stopped editing
          </h2>
          <ul className="mt-10 grid gap-6 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <li
                key={t.name}
                className="flex flex-col rounded-xl border border-border/60 bg-background/60 p-6"
              >
                <Quote
                  className="size-6 text-primary/70"
                  aria-hidden="true"
                />
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground/90">
                  {t.quote}
                </blockquote>
                <footer className="mt-5 text-xs">
                  <span className="font-semibold text-foreground">{t.name}</span>
                  <span className="text-muted-foreground"> · {t.role}</span>
                </footer>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* --------------------------------------------------------- blog -- */}
      <section
        aria-labelledby="blog-heading"
        className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
      >
        <h2
          id="blog-heading"
          className="text-2xl font-bold tracking-tight sm:text-3xl"
        >
          From the workshop
        </h2>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BLOG_POSTS.map((post) => (
            <li key={post.title}>
              <article className="group flex h-full flex-col rounded-xl border border-border/60 bg-card/40 p-6 transition-colors hover:border-primary/40">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge
                    variant="outline"
                    className="rounded-full border-primary/40 text-primary"
                  >
                    {post.tag}
                  </Badge>
                  <span>{post.readTime}</span>
                </div>
                <h3 className="mt-3 text-base font-semibold leading-snug group-hover:text-primary">
                  {post.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {post.blurb}
                </p>
              </article>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------------------------------------------------------- faq -- */}
      <section
        aria-labelledby="faq-heading"
        className="border-t border-border/60 bg-card/30"
      >
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
          <h2
            id="faq-heading"
            className="text-center text-2xl font-bold tracking-tight sm:text-3xl"
          >
            Questions, answered
          </h2>
          <Accordion
            type="single"
            collapsible
            className="mt-10 space-y-3"
          >
            {FAQS.map((faq, i) => (
              <AccordionItem
                key={faq.q}
                value={`faq-${i}`}
                className="rounded-xl border border-border/60 bg-background/60 px-5 last:border-b"
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
        </div>
      </section>

      {/* ---------------------------------------------------------- cta -- */}
      <section aria-labelledby="cta-heading" className="mx-auto w-full max-w-5xl px-4 py-20 text-center sm:px-6">
        <Terminal className="mx-auto size-8 text-primary" aria-hidden="true" />
        <h2 id="cta-heading" className="mt-4 text-3xl font-bold tracking-tight">
          {BRAND_TAGLINE}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
          Start with one sentence. The agent takes it from there — you keep the
          veto.
        </p>
        <Button asChild size="lg" className="mt-8 rounded-xl px-8 text-base">
          <Link href="/login">
            Get Started
            <ArrowRight className="ml-2 size-4" aria-hidden="true" />
          </Link>
        </Button>
      </section>
    </>
  );
}
