"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clapperboard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LOGIN } from "@/lib/content";
import { BRAND } from "@/lib/brand";

function GoogleGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-4"
      fill="currentColor"
    >
      <path d="M12 11c-.6 0-1 .4-1 1v.5h2v-.5c0-.6-.4-1-1-1Z" />
      <path d="M21 12.09c0-.38-.03-.75-.09-1.11H12v2.1h5.03a4.3 4.3 0 0 1-1.86 2.82v2.34h3.01c1.76-1.62 2.82-4.02 2.82-6.15Z" />
      <path d="M12 21c2.43 0 4.47-.8 5.96-2.16l-2.97-2.31c-.83.56-1.88.89-2.99.89a5.26 5.26 0 0 1-4.94-3.63H3.98v2.42A9 9 0 0 0 12 21Z" />
      <path d="M7.06 13.79a5.26 5.26 0 0 1 0-3.36V7.79H3.98a9 9 0 0 0 0 8.08l3.08-2.08Z" />
      <path d="M12 6.58c1.32 0 2.5.46 3.43 1.35l2.65-2.65A8.97 8.97 0 0 0 3.98 7.79l3.08 2.64A5.25 5.25 0 0 1 12 6.58Z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [busy, setBusy] = useState<"google" | "demo" | null>(null);
  const [pending, startTransition] = useTransition();

  const login = async (mode: "google" | "demo") => {
    setBusy(mode);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Both flows are honest mocks: the server issues a per-visitor
        // sandbox identity (own projects, own credits) — never a shared
        // account. Returning visitors land back in their own sandbox.
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(
          data.message ?? `Login failed (${res.status})`
        );
      }
      startTransition(() => router.push("/home"));
    } catch (err) {
      setBusy(null);
      alert(err instanceof Error ? err.message : "Unexpected error — try again.");
    }
  };

  const working = busy !== null || pending;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-16 sm:px-6 sm:py-24">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <Clapperboard className="size-7" aria-hidden="true" />
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight">{LOGIN.h1}</h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        {LOGIN.subhead}
      </p>

      <div className="mt-8 w-full rounded-2xl border border-border/70 bg-card/60 p-6 shadow-2xl shadow-black/30">
        <Button
          onClick={() => void login("google")}
          disabled={working}
          className="h-11 w-full rounded-xl text-sm"
          aria-label={LOGIN.googleCta}
        >
          {busy === "google" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <GoogleGlyph />
          )}
          {LOGIN.googleCta}
        </Button>

        <div className="my-5 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            {LOGIN.divider}
          </span>
          <Separator className="flex-1" />
        </div>

        <Button
          onClick={() => void login("demo")}
          disabled={working}
          variant="secondary"
          className="h-11 w-full rounded-xl text-sm"
          aria-label={LOGIN.demoCta}
        >
          {busy === "demo" && (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          )}
          {LOGIN.demoCta}
        </Button>
        <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
          {LOGIN.demoHint}
        </p>
      </div>

      <p className="mt-6 max-w-xs text-center text-xs leading-relaxed text-muted-foreground">
        {LOGIN.note.replace("Terms of Service", "Terms").replace("Privacy Policy", "Privacy")}
      </p>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        PC1 scope: {BRAND} auth is a mock demo session — real sign-in arrives in phase 2.
      </p>
    </div>
  );
}
