import { KANDRA_VERSION } from "@/lib/site-config";

export function VersionNote({ children }: { children?: React.ReactNode }) {
  return (
    <p className="not-prose inline-flex items-center gap-1.5 rounded-full border border-border bg-paper-raised px-2.5 py-1 text-xs font-mono text-ink-muted">
      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
      as of Kandra v{KANDRA_VERSION}
      {children ? <span className="text-ink-faint">— {children}</span> : null}
    </p>
  );
}
