"use client";

import { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";

/**
 * Agent-message markdown renderer: bold lead-ins, numbered decisions, bullet
 * defaults, inline code — styled with Tailwind tokens (no typography plugin
 * in the stack, so components are styled by hand).
 */
const components: Components = {
  p: ({ children }) => (
    <p className="mt-2.5 leading-relaxed first:mt-0">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  ul: ({ children }) => (
    <ul className="mt-2.5 list-disc space-y-1.5 pl-5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-2.5 list-decimal space-y-1.5 pl-5">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="mt-2.5 border-l-2 border-primary/50 pl-3 italic text-muted-foreground">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
      {children}
    </code>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-primary underline underline-offset-2"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-3 border-border/70" />,
  h1: ({ children }) => (
    <h1 className="mt-3.5 text-base font-bold first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-3.5 text-base font-bold first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-3 text-sm font-semibold first:mt-0">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mt-3 text-sm font-semibold first:mt-0">{children}</h4>
  ),
};

export const Markdown = memo(function Markdown({
  children,
}: {
  children: string;
}) {
  return (
    <div className="text-sm text-foreground/90">
      <ReactMarkdown components={components}>{children}</ReactMarkdown>
    </div>
  );
});
