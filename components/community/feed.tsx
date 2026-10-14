"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { api, RESOURCE_TYPES, useMe, type ResourceType, type Submission } from "@/lib/community";
import { AccountBar } from "./account-bar";
import { SubmissionCard } from "./submission-card";

type Sort = "new" | "top";

export function Feed({ kind }: { kind: "link" | "resource" }) {
  const { me, loaded, refresh } = useMe();
  const [sort, setSort] = useState<Sort>(kind === "resource" ? "top" : "new");
  const [tag, setTag] = useState<string | null>(null);
  const [type, setType] = useState<ResourceType | null>(null);
  const [tags, setTags] = useState<{ tag: string; count: number }[]>([]);
  const [items, setItems] = useState<Submission[] | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ tags: { tag: string; count: number }[] }>(`/submissions/tags?kind=${kind}`)
      .then((r) => setTags(r.tags))
      .catch(() => {});
  }, [kind]);

  useEffect(() => {
    let cancelled = false;
    const q = new URLSearchParams({ kind, sort, page: String(page) });
    if (tag) q.set("tag", tag);
    if (type) q.set("type", type);
    api<{ items: Submission[]; hasMore: boolean }>(`/submissions?${q}`)
      .then((r) => {
        if (cancelled) return;
        setItems((prev) => (page === 0 ? r.items : [...(prev ?? []), ...r.items]));
        setHasMore(r.hasMore);
        setError(null);
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
    // `me` is a dependency so "voted" state refreshes after sign-in/out.
  }, [kind, sort, tag, type, page, me]);

  function filter(update: () => void) {
    update();
    setPage(0);
    setItems(null);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <AccountBar me={me} loaded={loaded} onSignedOut={refresh} />
        <Link href={`/community/submit?kind=${kind}`} className="btn btn-primary btn-sm">
          <Plus className="w-4 h-4" strokeWidth={2.2} aria-hidden="true" />
          {kind === "link" ? "Share a link" : "Add a resource"}
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="segmented" role="group" aria-label="Sort by">
          {(["new", "top"] as const).map((s) => (
            <button key={s} type="button" aria-pressed={sort === s} className="cursor-pointer" onClick={() => filter(() => setSort(s))}>
              {s === "new" ? "Newest" : "Top"}
            </button>
          ))}
        </div>
        {kind === "resource" && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Resource type">
            <button type="button" className="chip" aria-pressed={type === null} onClick={() => filter(() => setType(null))}>
              All
            </button>
            {RESOURCE_TYPES.map((t) => (
              <button key={t.value} type="button" className="chip" aria-pressed={type === t.value} onClick={() => filter(() => setType(t.value))}>
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Filter by tag">
          {tags.map((t) => (
            <button
              key={t.tag}
              type="button"
              className="chip"
              aria-pressed={tag === t.tag}
              onClick={() => filter(() => setTag(tag === t.tag ? null : t.tag))}
            >
              #{t.tag}
            </button>
          ))}
        </div>
      )}

      {error ? (
        <p className="rounded-[var(--radius-lg)] bg-danger-soft text-danger px-5 py-4 text-sm" role="alert">{error}</p>
      ) : items === null ? (
        <p className="py-10 text-ink-muted" aria-busy="true">Loading…</p>
      ) : items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-semibold">Nothing here yet.</p>
          <p className="mt-1 text-ink-muted">
            {tag || type ? "Try another filter, or be the first to add one." : "Be the first to add one."}
          </p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border border-y border-border">
            {items.map((item) => (
              <SubmissionCard key={item.id} item={item} me={me} onTag={(t) => filter(() => setTag(t))} />
            ))}
          </ul>
          {hasMore && (
            <div className="mt-8 text-center">
              <button type="button" className="btn btn-secondary btn-sm cursor-pointer" onClick={() => setPage(page + 1)}>
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
