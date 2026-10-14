"use client";

import { useEffect, useState } from "react";
import { api, relativeTime, signInHref, useMe, type Submission } from "@/lib/community";
import { AccountBar } from "./account-bar";

const STATUS: Record<Submission["status"], { label: string; className: string }> = {
  pending: { label: "In review", className: "bg-gotcha-soft text-gotcha" },
  approved: { label: "Published", className: "bg-tip-soft text-tip" },
  rejected: { label: "Not accepted", className: "bg-danger-soft text-danger" },
};

export function MySubmissions() {
  const { me, loaded, refresh } = useMe();
  const [items, setItems] = useState<Submission[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!me) return;
    api<{ items: Submission[] }>("/me/submissions")
      .then((r) => setItems(r.items))
      .catch((e: Error) => setError(e.message));
  }, [me]);

  if (!loaded) return <p className="text-ink-muted">Loading…</p>;
  if (!me) {
    return (
      <a href={signInHref("/community/mine")} className="btn btn-primary">
        Sign in with GitHub
      </a>
    );
  }

  async function remove(id: number) {
    await api(`/submissions/${id}`, { method: "DELETE" });
    setItems((prev) => prev?.filter((s) => s.id !== id) ?? null);
  }

  return (
    <div>
      <div className="mb-8">
        <AccountBar me={me} loaded={loaded} onSignedOut={refresh} />
      </div>
      {error && <p className="text-danger text-sm" role="alert">{error}</p>}
      {items?.length === 0 && <p className="text-ink-muted">You haven&apos;t submitted anything yet.</p>}
      <ul className="divide-y divide-border border-y border-border">
        {items?.map((s) => (
          <li key={s.id} className="py-5 flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                <span className={`rounded-full px-2 py-0.5 font-semibold ${STATUS[s.status].className}`}>{STATUS[s.status].label}</span>
                <span>{s.kind === "link" ? "Link" : "Resource"}</span>
                <span>&middot; submitted {relativeTime(s.createdAt)}</span>
              </div>
              <a href={s.url} target="_blank" rel="nofollow ugc noopener noreferrer" className="mt-1 block font-semibold hover:text-accent-strong">
                {s.title}
              </a>
              {s.status === "rejected" && s.rejectReason && <p className="mt-1 text-sm text-ink-muted">Reason: {s.rejectReason}</p>}
            </div>
            <button type="button" className="text-sm text-danger hover:underline cursor-pointer shrink-0" onClick={() => remove(s.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>

      <section className="mt-16">
        <h2 className="type-title">Delete your account</h2>
        <p className="mt-2 text-ink-muted text-pretty max-w-xl">
          Removes your profile, everything you submitted, your votes and your reports. This can&apos;t be undone.
        </p>
        {confirmDelete ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className="btn btn-sm cursor-pointer bg-danger text-white"
              onClick={async () => {
                await api("/me", { method: "DELETE" });
                window.location.href = "/community";
              }}
            >
              Delete everything
            </button>
            <button type="button" className="btn btn-secondary btn-sm cursor-pointer" onClick={() => setConfirmDelete(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" className="mt-4 btn btn-secondary btn-sm cursor-pointer !text-danger !shadow-[inset_0_0_0_1px_var(--danger)]" onClick={() => setConfirmDelete(true)}>
            Delete account…
          </button>
        )}
      </section>
    </div>
  );
}
