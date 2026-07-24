import type { SimpleIcon } from "simple-icons";

// Real third-party brand marks (Kotlin, ScyllaDB, Apache Cassandra, Spring Boot) — used only
// where the page makes a factual claim about one of those products (trust bar, comparison table),
// never as a stand-in for a Kandra-specific concept. See components/icons.tsx for those.
// `fill="currentColor"` by default so a brand mark inherits text-ink-muted/text-accent-strong like
// every hand-drawn icon already does; hovering reveals the mark's real brand color.
export function BrandLogo({ icon, size = 20, className }: { icon: SimpleIcon; size?: number; className?: string }) {
  return (
    <svg
      role="img"
      aria-label={icon.title}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`brand-logo ${className ?? ""}`}
      style={{ "--brand-hex": `#${icon.hex}` } as React.CSSProperties}
      fill="currentColor"
    >
      <path d={icon.path} />
    </svg>
  );
}
