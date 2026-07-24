"use client";

import { useState } from "react";

// A self-select wayfinding control, not a content gate: nothing on the page is ever hidden by this.
// Clicking a pill jumps (smooth-scroll, see `scroll-behavior` in globals.css) to that persona's
// deeper section and marks the pill pressed. The header and hero each render their own independent
// instance — deliberately not sharing state (SiteHeader is an ancestor of the page in layout.tsx,
// so a context provided inside the page can't flow up to it) — both just scroll to the same anchors.
const PERSONAS = [
  { id: "dev", label: "For Developers", href: "#code-showcase" },
  { id: "team", label: "For Teams", href: "#business-case" },
] as const;

export function PersonaToggle({ variant = "header" }: { variant?: "header" | "hero" }) {
  const [pressed, setPressed] = useState<"dev" | "team" | null>(null);

  const size = variant === "hero" ? "text-sm px-4 py-2" : "text-xs px-3 py-1.5";

  return (
    <div
      className={`inline-flex items-center rounded-full border border-border p-0.5 ${variant === "hero" ? "gap-0.5" : "gap-0"}`}
      role="group"
      aria-label="Jump to content for"
    >
      {PERSONAS.map((p) => (
        <a
          key={p.id}
          href={p.href}
          onClick={() => setPressed(p.id)}
          aria-current={pressed === p.id ? "true" : undefined}
          className={`rounded-full font-medium transition-colors ${size} ${
            pressed === p.id
              ? p.id === "dev"
                ? "bg-accent text-accent-ink"
                : "bg-note text-accent-ink"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          {p.label}
        </a>
      ))}
    </div>
  );
}
