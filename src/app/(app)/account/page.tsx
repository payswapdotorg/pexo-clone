import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Coins, ReceiptText, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UpgradeDialog } from "@/components/site/app-header";
import {
  CREDITS,
  formatCreditAmount,
  PLAN_CREDITS,
  STAGE_LABELS,
} from "@/lib/credit-amounts";

export const metadata: Metadata = {
  title: "Account",
};

export const dynamic = "force-dynamic";

/**
 * /account — the itemized ledger the pricing FAQ promises: balance, plan,
 * and every credit event (spend or demo grant) with its stage, project,
 * and timestamp. PRODUCT-SPEC §6.7: pricing honesty.
 */
export default async function AccountPage() {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  const events = await db.creditEvent.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  /* CreditEvent rows carry a bare projectId — resolve titles in one query. */
  const projectIds = [
    ...new Set(
      events.map((e) => e.projectId).filter((id): id is string => !!id)
    ),
  ];
  const projects = projectIds.length
    ? await db.project.findMany({
        where: { id: { in: projectIds } },
        select: { id: true, title: true },
      })
    : [];
  const titleFor = new Map(projects.map((p) => [p.id, p.title]));

  const spent = events
    .filter((e) => e.amount < 0)
    .reduce((sum, e) => sum + Math.abs(e.amount), 0);
  const granted = events
    .filter((e) => e.amount > 0)
    .reduce((sum, e) => sum + e.amount, 0);

  const planName = user.plan.charAt(0).toUpperCase() + user.plan.slice(1);

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/home"
        className="inline-flex min-h-8 items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to workspace
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {user.name} ·{" "}
            <span className="font-medium text-foreground">{planName} plan</span>
          </p>
        </div>
        <UpgradeDialog currentPlan={user.plan} variant="full" />
      </div>

      {/* Balance + flat prices — the exact numbers the engine charges. */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Coins className="size-4 text-primary" aria-hidden="true" />
              Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold tabular-nums tracking-tight">
              {user.credits.toLocaleString("en-US")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              credits available now
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
              Flat stage prices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm">
              <li className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Project start</span>
                <span className="font-semibold tabular-nums">
                  {CREDITS.PROJECT_START} cr
                </span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Still preview</span>
                <span className="font-semibold tabular-nums">
                  {CREDITS.PREVIEW} cr
                </span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Render</span>
                <span className="font-semibold tabular-nums">
                  {CREDITS.RENDER} cr
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* The itemized ledger. */}
      <Card className="mt-6 rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base font-semibold">
            <span className="flex items-center gap-2">
              <ReceiptText className="size-4 text-primary" aria-hidden="true" />
              Credit ledger
            </span>
            <span className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="rounded-full font-normal">
                Spent to date: {spent.toLocaleString("en-US")}
              </Badge>
              {granted > 0 && (
                <Badge
                  variant="secondary"
                  className="rounded-full border-emerald-500/40 bg-emerald-500/10 font-normal text-emerald-700 dark:text-emerald-400"
                >
                  Granted: {granted.toLocaleString("en-US")}
                </Badge>
              )}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No credit events yet — your first project starts at{" "}
              {CREDITS.PROJECT_START} credits.
            </p>
          ) : (
            <ul
              aria-label="Credit events, newest first"
              className="max-h-96 divide-y divide-border/60 overflow-y-auto"
            >
              {events.map((event) => (
                <li
                  key={event.id}
                  className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <span
                    className={`w-16 shrink-0 text-right text-sm font-semibold tabular-nums ${
                      event.amount > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-foreground"
                    }`}
                  >
                    {formatCreditAmount(event.amount)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {STAGE_LABELS[event.stage] ?? event.stage}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {event.projectId && titleFor.has(event.projectId) ? (
                        <Link
                          href={`/project/${event.projectId}`}
                          className="rounded outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {titleFor.get(event.projectId)}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </span>
                  </span>
                  <time
                    dateTime={event.createdAt.toISOString()}
                    className="shrink-0 text-xs tabular-nums text-muted-foreground"
                  >
                    {dateFormatter.format(event.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Demo deployment — nothing is billed. Plan unlocks grant their
            credits instantly (Pro {PLAN_CREDITS.pro.toLocaleString("en-US")},{" "}
            {PLAN_CREDITS.elite.toLocaleString("en-US")} for Elite,{" "}
            {PLAN_CREDITS.max.toLocaleString("en-US")} for Max); every other
            line is a real spend that happened in this workspace.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
