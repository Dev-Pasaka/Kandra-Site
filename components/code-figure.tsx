"use client";

import { Check, Copy } from "lucide-react";
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
        <div className="flex items-center justify-between px-4 pt-2 -mb-2 text-xs font-mono text-ink-muted">
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
      className="pressable inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.75rem] text-ink-muted hover:text-ink hover:bg-paper transition-colors cursor-pointer"
      aria-label="Copy code"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" /> Copied
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" strokeWidth={1.8} aria-hidden="true" /> Copy
        </>
      )}
    </button>
  );
}
