"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PenLine } from "lucide-react";
import { api, relativeTime, useMe, type CommunityPost } from "@/lib/community";
import { AccountBar } from "./account-bar";
import { Avatar } from "./avatar";

export function CommunityPostList() {
  const { me, loaded, refresh } = useMe();
  const [tag, setTag] = useState<string | null>(null);
  const [tags, setTags] = useState<{ tag: string; count: number }[]>([]);
  const [items, setItems] = useState<CommunityPost[] | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ?tag= from a post's tag chips; read once on mount (static export).
    const t = new URLSearchParams(window.location.search).get("tag");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (t) setTag(t);
    api<{ tags: { tag: string; count: number }[] }>("/posts/tags").then((r) => setTags(r.tags)).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    const q = new URLSearchParams({ page: String(page) });
    if (tag) q.set("tag", tag);
    api<{ items: CommunityPost[]; hasMore: boolean }>(`/posts?${q}`)
      .then((r) => {
        if (cancelled) return;
        setItems((prev) => (page === 0 ? r.items : [...(prev ?? []), ...r.items]));
        setHasMore(r.hasMore);
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [tag, page]);

  function pickTag(t: string | null) {
    setTag(t);
    setPage(0);
    setItems(null);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <AccountBar me={me} loaded={loaded} onSignedOut={refresh} />
        <Link href="/community/write" className="btn btn-primary btn-sm">
          <PenLine className="w-4 h-4" strokeWidth={2} aria-hidden="true" /> Write a post
        </Link>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Filter by tag">
          {tags.map((t) => (
            <button key={t.tag} type="button" className="chip" aria-pressed={tag === t.tag} onClick={() => pickTag(tag === t.tag ? null : t.tag)}>
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
          <p className="font-semibold">No posts yet.</p>
          <p className="mt-1 text-ink-muted">Built something with Kandra? Write it up.</p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border border-y border-border">
            {items.map((p) => (
              <li key={p.id}>
                {/* Plain <a>: post pages are rendered by the Worker, not part of the static route tree. */}
                <a href={`/community/p/${p.slug}`} className="group block py-8">
                  <p className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
                    <Avatar user={p.author} size={20} />
                    <span className="text-ink font-medium">{p.author.name || p.author.login}</span>
                    {p.publishedAt && <span>&middot; {relativeTime(p.publishedAt)}</span>}
                    <span>&middot; {p.readingMinutes} min read</span>
                  </p>
                  <h2 className="type-title mt-2 group-hover:text-accent-strong transition-colors text-balance">{p.title}</h2>
                  <p className="mt-2 text-ink-muted leading-relaxed text-pretty">{p.summary}</p>
                </a>
              </li>
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
