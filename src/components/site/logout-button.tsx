"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    startTransition(() => {
      router.push("/login");
      router.refresh();
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => void logout()}
      disabled={pending}
      aria-label="Sign out"
      className="gap-1.5 text-muted-foreground"
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <LogOut className="size-4" aria-hidden="true" />
      )}
      Sign out
    </Button>
  );
}
