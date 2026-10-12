"use client";

import { useState } from "react";
import Link from "next/link";
import { ScrollReveal } from "@/components/scroll-reveal";

const ZONES = ["AZ-a", "AZ-b", "AZ-c"] as const;
const QUORUM = 2; // RF=3 → LOCAL_QUORUM needs floor(3/2) + 1 replicas

// Tap a zone to take it offline. Interactive instead of a looping animation:
// the reader sets the failure, so cause and effect are theirs.
export function AzTopologySection() {
  const [down, setDown] = useState<Set<string>>(() => new Set(["AZ-b"]));
  const up = ZONES.length - down.size;
  const ok = up >= QUORUM;

  function toggle(zone: string) {
    setDown((prev) => {
      const next = new Set(prev);
      if (next.has(zone)) next.delete(zone);
      else next.add(zone);
      return next;
    });
  }

  return (
    <section className="bg-paper-raised">
      <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-20 md:py-28">
        <ScrollReveal>
          <div className="max-w-3xl mb-12 md:mb-16">
            <p className="type-eyebrow mb-3">Rack-aware replication, RF=3</p>
            <h2 className="type-headline text-balance">One availability zone goes dark. Nothing pages.</h2>
            <p className="type-lede mt-5 text-pretty">
              Three replicas, one per zone. Writes go to all three; a{" "}
              <code className="font-mono text-[0.85em] bg-paper rounded-md px-1.5 py-0.5">LOCAL_QUORUM</code>{" "}
              read only needs two to agree &mdash; the consistency model from{" "}
              <Link href="/foundations#consistency-levels-in-plain-terms" className="text-accent-strong hover:underline underline-offset-4">
                Foundations
              </Link>
              . Tap a zone to take it offline.
            </p>
          </div>

          <div className="card-elevated p-6 md:p-10">
            <div className="grid grid-cols-3 gap-3 md:gap-6">
              {ZONES.map((z) => {
                const isDown = down.has(z);
                return (
                  <button
                    key={z}
                    type="button"
                    onClick={() => toggle(z)}
                    aria-pressed={isDown}
                    aria-label={`${z}: ${isDown ? "offline, tap to restore" : "online, tap to take offline"}`}
                    className="pressable group flex flex-col items-center gap-3 rounded-[var(--radius-lg)] bg-paper-raised px-2 py-6 md:py-8 cursor-pointer transition-opacity duration-300"
                    style={{ opacity: isDown ? 0.45 : 1 }}
                  >
                    <span
                      className="relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full transition-colors duration-300"
                      style={{ background: isDown ? "var(--border)" : "var(--accent-soft)" }}
                      aria-hidden="true"
                    >
                      <span
                        className="w-4 h-4 md:w-5 md:h-5 rounded-full transition-colors duration-300"
                        style={{ background: isDown ? "var(--ink-faint)" : "var(--accent)" }}
                      />
                    </span>
                    <span className="font-semibold">{z}</span>
                    <span className="text-xs text-ink-muted">{isDown ? "Offline" : "Replica online"}</span>
                  </button>
                );
              })}
            </div>

            <div
              className="mt-6 md:mt-8 rounded-[var(--radius-lg)] px-5 py-4 text-[0.95rem] transition-colors duration-300"
              style={{ background: ok ? "var(--tip-soft)" : "var(--danger-soft)" }}
              aria-live="polite"
            >
              <span className="font-semibold" style={{ color: ok ? "var(--tip)" : "var(--danger)" }}>
                {up} of 3 replicas reachable.
              </span>{" "}
              {ok
                ? "LOCAL_QUORUM reads and writes still succeed."
                : "LOCAL_QUORUM can't be met: reads and writes fail with UnavailableException until a zone returns."}
            </div>

            <p className="mt-5 text-sm text-ink-muted">
              Running more than one datacenter?{" "}
              <Link href="/recipes/multi-dc-deployment" className="text-accent-strong hover:underline underline-offset-4">
                Multi-DC recipe &rsaquo;
              </Link>
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
