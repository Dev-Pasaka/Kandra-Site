import type { ReactNode } from "react";
import { Info, Lightbulb, TriangleAlert, OctagonAlert, type LucideIcon } from "lucide-react";

type CalloutKind = "note" | "tip" | "gotcha" | "danger";

const CONFIG: Record<CalloutKind, { label: string; icon: LucideIcon }> = {
  note: { label: "Note", icon: Info },
  tip: { label: "Tip", icon: Lightbulb },
  gotcha: { label: "Gotcha", icon: TriangleAlert },
  danger: { label: "Danger", icon: OctagonAlert },
};

export function Callout({
  kind = "note",
  title,
  children,
}: {
  kind?: CalloutKind;
  title?: string;
  children: ReactNode;
}) {
  const { label, icon: Icon } = CONFIG[kind];
  return (
    <div
      data-callout={kind}
      className="not-prose my-6 rounded-[var(--radius-lg)] px-5 py-4 text-[0.97rem] leading-relaxed"
      style={{
        background: `var(--${kind}-soft)`,
        color: "var(--ink)",
      }}
    >
      <div
        className="flex items-center gap-2 text-[0.9rem] font-semibold mb-1"
        style={{ color: `var(--${kind})` }}
      >
        <Icon className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden="true" />
        {title ?? label}
      </div>
      <div className="[&>p]:m-0 [&>p+p]:mt-2 [&_a]:underline [&_code]:font-mono [&_code]:text-[0.88em] [&_code]:bg-paper/70 [&_code]:rounded-[var(--radius-sm)] [&_code]:px-1">
        {children}
      </div>
    </div>
  );
}
