/**
 * Keyboard-only "Skip to main content" link (WCAG 2.4.1 — bypass blocks).
 * First tab stop on every layout; invisible until focused, then a solid,
 * high-contrast pill anchored top-left.
 */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
    >
      Skip to main content
    </a>
  );
}
