"use client";

import { useEffect } from "react";

// The Worker serves the right <title>, but Next re-applies this shell's metadata title from its
// own payload after hydration (streamed metadata can land after effects run). Keep the post's
// title in place whenever <head> changes.
export function PostTitle() {
  useEffect(() => {
    const h1 = document.querySelector("#community-post h1")?.textContent?.trim();
    if (!h1) return;
    const wanted = `${h1} — Kandra`;
    const apply = () => {
      if (document.title !== wanted) document.title = wanted;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);
  return null;
}
