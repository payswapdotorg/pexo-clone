"use client";

import { Play } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useComposerStore } from "@/lib/composer-store";
import { GALLERY_TABS } from "@/lib/content";

const PATTERN_CLASS: Record<string, string> = {
  dots: "cover-dots",
  lines: "cover-lines",
  grid: "cover-grid",
};

/**
 * Template gallery (PRODUCT-SPEC §2 /home): 7 tabs of starter cards with
 * CSS-art covers; a click prefills the workspace composer with the card's
 * prompt.
 */
export function TemplateGallery() {
  const prefillPrompt = useComposerStore((s) => s.prefillPrompt);

  return (
    <section
      id="gallery"
      aria-labelledby="gallery-heading"
      className="mt-12"
    >
      <h2 id="gallery-heading" className="text-xl font-bold tracking-tight sm:text-2xl">
        Start from the gallery
      </h2>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Pick a starting point — the prompt lands in the composer, ready to
        make yours.
      </p>

      <Tabs defaultValue={GALLERY_TABS[0].id} className="mt-6">
        <TabsList
          aria-label="Template gallery categories"
          className="h-auto w-full justify-start gap-1 overflow-x-auto bg-card/60 p-1 scrollbar-app [scrollbar-width:thin]"
        >
          {GALLERY_TABS.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="shrink-0 rounded-lg px-3.5 py-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {GALLERY_TABS.map((tab) => (
          <TabsContent
            key={tab.id}
            value={tab.id}
            className="mt-6 focus-visible:outline-none"
          >
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {tab.cards.map((card) => (
                <li key={card.title}>
                  <button
                    type="button"
                    onClick={() => {
                      prefillPrompt(card.prompt);
                      toast("Prompt loaded", {
                        description: "Edit it or send it as is.",
                      });
                    }}
                    className="group block w-full overflow-hidden rounded-xl border border-border/60 bg-card/40 text-left transition-shadow hover:shadow-lg hover:shadow-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Start from ${card.title} — prefills the composer`}
                  >
                    <span
                      aria-hidden="true"
                      className={`relative flex aspect-video items-center justify-center bg-gradient-to-br ${card.gradient}`}
                    >
                      {card.pattern && (
                        <span
                          aria-hidden="true"
                          className={`absolute inset-0 ${PATTERN_CLASS[card.pattern]}`}
                        />
                      )}
                      <span className="flex size-11 items-center justify-center rounded-full border border-white/30 bg-black/30 backdrop-blur-sm transition-transform group-hover:scale-110">
                        <Play
                          className="size-4.5 text-white"
                          fill="currentColor"
                          aria-hidden="true"
                        />
                      </span>
                    </span>
                    <span className="block p-4">
                      <span className="block text-sm font-semibold group-hover:text-primary">
                        {card.title}
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                        {card.blurb}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
