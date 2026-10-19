"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Check,
  CircleHelp,
  Clapperboard,
  Coins,
  Loader2,
  LogOut,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { WhatsNewDialog, WHATS_NEW_STORAGE_KEY } from "@/components/site/whats-new-dialog";
import { useComposerStore } from "@/lib/composer-store";
import { PLANS } from "@/lib/content";
import { BRAND } from "@/lib/brand";

export interface AppUser {
  name: string;
  credits: number;
  plan: string;
}

/** Live credits pill — fed by the composer store (chat responses + events).
 * Links to /account: the pricing FAQ promises the balance is one click
 * away from the itemized ledger. */
function CreditsWidget({ initialCredits }: { initialCredits: number }) {
  const storeCredits = useComposerStore((s) => s.credits);
  const setCredits = useComposerStore((s) => s.setCredits);

  useEffect(() => {
    setCredits(initialCredits);
  }, [initialCredits, setCredits]);

  const credits = storeCredits ?? initialCredits;
  const low = credits < 20;

  return (
    <Link
      href="/account"
      aria-label={`Credit balance: ${credits} — open account page`}
      title="Credit balance — open account page"
      className={
        (low
          ? "flex h-8 items-center gap-1.5 rounded-full border border-amber-500/50 bg-amber-500/10 px-3 text-sm font-semibold text-amber-400"
          : "flex h-8 items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 text-sm font-semibold text-foreground") +
        " outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      }
    >
      <Coins
        className={low ? "size-3.5 text-amber-400" : "size-3.5 text-primary"}
        aria-hidden="true"
      />
      <span className="tabular-nums" aria-live="polite">
        {credits}
      </span>
    </Link>
  );
}

/** Upgrade dialog — plan cards hitting POST /api/user/upgrade (demo flips
 * with an instant credit grant). `variant="full"` renders a page-level
 * primary trigger (account page) instead of the compact header pill. */
export function UpgradeDialog({
  currentPlan,
  variant = "header",
}: {
  currentPlan: string;
  variant?: "header" | "full";
}) {
  const router = useRouter();
  const setCredits = useComposerStore((s) => s.setCredits);
  const [open, setOpen] = useState(false);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);

  const upgrade = async (plan: string, name: string) => {
    setBusyPlan(plan);
    try {
      const res = await fetch("/api/user/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        credits?: number;
        granted?: number;
        message?: string;
      };
      if (!res.ok) {
        throw new Error(data.message ?? `Upgrade failed (${res.status})`);
      }
      if (typeof data.credits === "number") {
        setCredits(data.credits);
      }
      toast.success(
        typeof data.granted === "number" && data.granted > 0
          ? `${name} unlocked — ${data.granted.toLocaleString(
              "en-US"
            )} demo credits granted, nothing billed`
          : `${name} unlocked — demo flip, nothing billed`
      );
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error("Could not switch plans", {
        description:
          err instanceof Error ? err.message : "Unexpected error — try again.",
      });
    } finally {
      setBusyPlan(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {variant === "full" ? (
        <DialogTrigger asChild>
          <Button size="lg" className="rounded-xl px-6">
            <Sparkles className="size-4" aria-hidden="true" />
            Unlock a plan
          </Button>
        </DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button
            size="sm"
            className="h-8 gap-1.5 rounded-full px-3"
            aria-label="Upgrade your plan"
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Upgrade</span>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl rounded-2xl border-border/70 bg-card">
        <DialogHeader>
          <DialogTitle>Upgrade your plan</DialogTitle>
          <DialogDescription>
            More credits every month for longer renders and bigger batches.
            Demo mode — plans flip instantly, nothing is billed.
          </DialogDescription>
        </DialogHeader>
        <ul className="mt-2 grid gap-3 sm:grid-cols-3" aria-label="Available plans">
          {PLANS.slice(1).map((plan) => {
            const key = plan.name.toLowerCase();
            const isCurrent = key === currentPlan;
            return (
              <li
                key={plan.name}
                className={
                  isCurrent
                    ? "flex flex-col rounded-xl border border-primary/50 bg-primary/10 p-4"
                    : "flex flex-col rounded-xl border border-border/70 bg-background/60 p-4"
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">{plan.name}</h3>
                  {isCurrent && (
                    <Badge className="rounded-full px-2 py-0.5 text-[10px]">
                      Current
                    </Badge>
                  )}
                </div>
                <p className="mt-1.5 text-xs font-medium text-primary">
                  {plan.credits}
                </p>
                <ul className="mt-3 flex-1 space-y-1.5">
                  {plan.features.slice(0, 3).map((perk) => (
                    <li
                      key={perk}
                      className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground"
                    >
                      <Check
                        className="mt-0.5 size-3 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      {perk}
                    </li>
                  ))}
                </ul>
                <Button
                  type="button"
                  size="sm"
                  variant={isCurrent ? "secondary" : "default"}
                  disabled={isCurrent || busyPlan !== null}
                  onClick={() => void upgrade(key, plan.name)}
                  className="mt-4 w-full rounded-lg"
                  aria-label={`Unlock ${plan.name}`}
                >
                  {busyPlan === key && (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  )}
                  {isCurrent ? "Current plan" : `Unlock ${plan.name}`}
                </Button>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Compact top bar for the workspace pages (/home, /project/[id]):
 * brand wordmark, live credits, upgrade, what's-new, sign-out.
 */
export function AppHeader({ user }: { user: AppUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (pathname !== "/home") return;
    let frame = 0;
    try {
      if (!window.localStorage.getItem(WHATS_NEW_STORAGE_KEY)) {
        /* Open after first paint (external-system read → deferred state). */
        frame = window.requestAnimationFrame(() => setWhatsNewOpen(true));
      }
    } catch {
      /* storage unavailable — skip the first-run dialog */
    }
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  const signOut = async () => {
    setSigningOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    startTransition(() => {
      router.push("/login");
      router.refresh();
    });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/home"
          className="flex items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`${BRAND} workspace`}
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Clapperboard className="size-4" aria-hidden="true" />
          </span>
          <span className="text-base font-semibold tracking-tight">
            {BRAND}
          </span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            onClick={() => setWhatsNewOpen(true)}
            aria-label="What's new"
            title="What's new"
          >
            <CircleHelp className="size-4.5" aria-hidden="true" />
          </Button>
          <CreditsWidget initialCredits={user.credits} />
          <UpgradeDialog currentPlan={user.plan} />
          <Button
            variant="ghost"
            size="icon"
            className="size-9 text-muted-foreground"
            onClick={() => void signOut()}
            disabled={signingOut || pending}
            aria-label="Sign out"
            title="Sign out"
          >
            {signingOut || pending ? (
              <Loader2 className="size-4.5 animate-spin" aria-hidden="true" />
            ) : (
              <LogOut className="size-4.5" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>
      <WhatsNewDialog open={whatsNewOpen} onOpenChange={setWhatsNewOpen} />
    </header>
  );
}
