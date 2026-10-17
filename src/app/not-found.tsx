import Link from "next/link";
import { Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-24 text-center sm:px-6">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <Clapperboard className="size-7" aria-hidden="true" />
      </span>
      <h1 className="mt-6 text-2xl font-bold tracking-tight">
        This scene doesn&apos;t exist
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The page or project you are looking for was moved, deleted, or never
        existed.
      </p>
      <div className="mt-8 flex gap-3">
        <Button asChild className="rounded-xl">
          <Link href="/">Back to home</Link>
        </Button>
        <Button asChild variant="secondary" className="rounded-xl">
          <Link href="/home">Open workspace</Link>
        </Button>
      </div>
    </div>
  );
}
