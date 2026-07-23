"use client";

import { Children, cloneElement, isValidElement, useRef, useState, type ReactElement, type ReactNode, type Ref } from "react";

export function CodeFigure({ children }: { children?: ReactNode }) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  let filename: string | null = null;
  let preElement: ReactElement<{ ref?: Ref<HTMLPreElement> }> | null = null;

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === "figcaption") {
      const kids = (child.props as { children?: ReactNode }).children;
      filename = typeof kids === "string" ? kids : null;
    } else if (child.type === "pre") {
      preElement = child as ReactElement<{ ref?: Ref<HTMLPreElement> }>;
    }
  });

  async function handleCopy() {
    const text = preRef.current?.textContent ?? "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="kandra-codeblock not-prose">
      {filename ? (
        <div className="flex items-center justify-between border-b border-border px-4 py-1.5 text-xs font-mono text-ink-muted">
          <span>{filename}</span>
          <CopyButton copied={copied} onClick={handleCopy} />
        </div>
      ) : (
        <div className="flex justify-end px-2 pt-1.5">
          <CopyButton copied={copied} onClick={handleCopy} />
        </div>
      )}
      {/* Attaching a ref via cloneElement, not reading .current during render. */}
      {/* eslint-disable-next-line react-hooks/refs */}
      {preElement ? cloneElement(preElement, { ref: preRef }) : null}
    </div>
  );
}

function CopyButton({ copied, onClick }: { copied: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-[0.72rem] font-mono text-ink-faint hover:text-accent hover:bg-paper-raised transition-colors cursor-pointer"
      aria-label="Copy code"
    >
      {copied ? (
        <>
          <CheckIcon /> Copied
        </>
      ) : (
        <>
          <CopyIcon /> Copy
        </>
      )}
    </button>
  );
}

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <rect x="5.5" y="5.5" width="8.5" height="8.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2.5 10.5V3a1 1 0 0 1 1-1h7.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
