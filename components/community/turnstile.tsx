"use client";

import { useEffect, useRef } from "react";

// Cloudflare Turnstile, rendered only when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set at build time.
// The Worker skips verification when TURNSTILE_SECRET_KEY is unset, so local dev needs neither.
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

type TurnstileApi = {
  render: (el: HTMLElement, opts: { sitekey: string; callback: (t: string) => void; "expired-callback": () => void; theme: string }) => string;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !ref.current) return;
    let widget: string | undefined;
    const mount = () => {
      if (!window.turnstile || !ref.current) return;
      widget = window.turnstile.render(ref.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: onToken,
        "expired-callback": () => onToken(""),
        theme: "auto",
      });
    };
    if (window.turnstile) mount();
    else {
      let s = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`);
      if (!s) {
        s = document.createElement("script");
        s.src = SCRIPT;
        s.async = true;
        document.head.appendChild(s);
      }
      s.addEventListener("load", mount, { once: true });
    }
    return () => {
      if (widget && window.turnstile) window.turnstile.remove(widget);
    };
  }, [onToken]);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={ref} className="min-h-[65px]" />;
}
