import type { ReactNode } from "react";

type CalloutKind = "note" | "tip" | "gotcha" | "danger";

const CONFIG: Record<CalloutKind, { label: string; icon: ReactNode }> = {
  note: { label: "Note", icon: <NoteIcon /> },
  tip: { label: "Tip", icon: <TipIcon /> },
  gotcha: { label: "Gotcha", icon: <GotchaIcon /> },
  danger: { label: "Danger", icon: <DangerIcon /> },
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
  const { label, icon } = CONFIG[kind];
  return (
    <div
      data-callout={kind}
      className="not-prose my-6 rounded-md border-l-2 pl-4 pr-4 py-3 text-[0.95rem] leading-relaxed"
      style={{
        borderColor: `var(--${kind})`,
        background: `var(--${kind}-soft)`,
        color: "var(--ink)",
      }}
    >
      <div
        className="flex items-center gap-1.5 font-display text-xs font-semibold uppercase tracking-wide mb-1.5"
        style={{ color: `var(--${kind})` }}
      >
        {icon}
        {title ?? label}
      </div>
      <div className="[&>p]:m-0 [&>p+p]:mt-2 [&_a]:underline [&_code]:font-mono [&_code]:text-[0.88em] [&_code]:bg-paper-raised [&_code]:border [&_code]:border-border [&_code]:rounded-sm [&_code]:px-1">
        {children}
      </div>
    </div>
  );
}

function NoteIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 7.2v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="5" r="0.9" fill="currentColor" />
    </svg>
  );
}

function TipIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5c-2.3 0-4 1.8-4 4 0 1.6.8 2.6 1.6 3.4.5.5.8 1 .8 1.6h3.2c0-.6.3-1.1.8-1.6.8-.8 1.6-1.8 1.6-3.4 0-2.2-1.7-4-4-4Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M6.5 13.5h3M7 15h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function GotchaIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path d="M8 1.6 1.6 13.2h12.8L8 1.6Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M8 6.3v3.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="11.2" r="0.9" fill="currentColor" />
    </svg>
  );
}

function DangerIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 5.5l5 5m0-5-5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
