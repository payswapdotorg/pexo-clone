"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SkillsCopyButton({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = command;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      onClick={() => void copy()}
      aria-label={copied ? "Copied" : "Copy install command to clipboard"}
      className="gap-1.5"
    >
      {copied ? (
        <Check className="size-3.5 text-primary" aria-hidden="true" />
      ) : (
        <Copy className="size-3.5" aria-hidden="true" />
      )}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}
