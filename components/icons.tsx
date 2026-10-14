import type { LucideIcon } from "lucide-react";

// Every icon on the site comes from Lucide (one drawn set, SF Symbols-like 24px grid, round caps)
// instead of hand-drawn one-offs, so stroke weight, corner radius and optical size always match.
// Import glyphs from "lucide-react" directly; this file only holds the shared tile treatment.

export type { LucideIcon };

export type IconTone = "accent" | "danger" | "gotcha" | "tip" | "neutral";

const TONE: Record<IconTone, { bg: string; fg: string }> = {
  accent: { bg: "var(--accent-soft)", fg: "var(--accent-strong)" },
  danger: { bg: "var(--danger-soft)", fg: "var(--danger)" },
  gotcha: { bg: "var(--gotcha-soft)", fg: "var(--gotcha)" },
  tip: { bg: "var(--tip-soft)", fg: "var(--tip)" },
  neutral: { bg: "var(--paper)", fg: "var(--ink-muted)" },
};

// A glyph on a tinted rounded square, like an app-settings row icon. Sized in rem so it scales
// with the user's text size.
export function IconTile({
  icon: Icon,
  tone = "accent",
  size = "md",
  className,
}: {
  icon: LucideIcon;
  tone?: IconTone;
  size?: "sm" | "md";
  className?: string;
}) {
  const t = TONE[tone];
  const box = size === "sm" ? "w-7 h-7 rounded-[8px]" : "w-10 h-10 rounded-[11px]";
  const glyph = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${box} ${className ?? ""}`}
      style={{ background: t.bg, color: t.fg }}
      aria-hidden="true"
    >
      <Icon className={glyph} strokeWidth={1.9} />
    </span>
  );
}
