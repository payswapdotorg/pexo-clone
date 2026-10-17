"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, Menu, Globe, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";
import { LANGUAGES } from "@/lib/content";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const NAV_LINKS = [
  { href: "/video-agent", label: "AI Video Agent" },
  { href: "/skills", label: "Skills" },
  { href: "/pricing", label: "Pricing" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("en");

  const pickLang = (code: string, label: string) => {
    setLang(code);
    window.localStorage.setItem("vidra-lang", code);
    toast(`Language set to ${label} (interface arrives in a later phase)`);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`${BRAND} home`}
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Clapperboard className="size-4" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight">{BRAND}</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                pathname === link.href && "bg-accent text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                aria-label="Select language"
              >
                <Globe className="size-4" aria-hidden="true" />
                <span className="uppercase">{lang}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {LANGUAGES.map((l) => (
                <DropdownMenuItem
                  key={l.code}
                  onClick={() => pickLang(l.code, l.label)}
                  className="justify-between"
                >
                  {l.label}
                  {lang === l.code && (
                    <Check className="size-4 text-primary" aria-hidden="true" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Get Started</Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="size-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <Clapperboard className="size-3.5" aria-hidden="true" />
                  </span>
                  {BRAND}
                </SheetTitle>
              </SheetHeader>
              <nav aria-label="Mobile" className="flex flex-col gap-1 px-4">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                      pathname === link.href && "bg-accent text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <Button asChild className="mt-3">
                  <Link href="/login" onClick={() => setOpen(false)}>
                    Get Started
                  </Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
