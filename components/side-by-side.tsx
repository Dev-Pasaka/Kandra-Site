import type { ReactNode } from "react";

// Generic two-up layout for code comparisons: entity/DDL pairs on module
// pages, relational-instinct-vs-Kandra-way pairs in the tutorial. Renders
// actual highlighted code fences passed as children — no runtime compiler,
// no live sandbox, matching the "static site, no backend" constraint.
export function SideBySide({
  leftLabel,
  rightLabel,
  left,
  right,
}: {
  leftLabel: string;
  rightLabel: string;
  left: ReactNode;
  right: ReactNode;
}) {
  return (
    <div className="not-prose my-6 grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <div className="mb-1.5 text-xs font-display font-semibold uppercase tracking-wide text-ink-faint">
          {leftLabel}
        </div>
        {left}
      </div>
      <div>
        <div className="mb-1.5 text-xs font-display font-semibold uppercase tracking-wide text-ink-faint">
          {rightLabel}
        </div>
        {right}
      </div>
    </div>
  );
}
