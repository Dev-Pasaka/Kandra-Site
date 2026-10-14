"use client";

import { useCallback, useEffect, useState } from "react";
import { api, RESOURCE_TYPES, relativeTime, signInHref, useMe, type Submission } from "@/lib/community";
import { AccountBar } from "./account-bar";
import { Avatar } from "./avatar";

interface Report {
  id: number;
  reason: string;
  created_at: string;
  submission_id: number;
  reporter: string;
  title: string;
  url: string;
  status: string;
}

export function AdminQueue() {
  const { me, loaded, refresh } = useMe();
  const [pending, setPending] = useState<Submission[] | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await api<{ pending: Submission[]; reports: Report[] }>("/admin/queue");
      setPending(r.pending);
      setReports(r.reports);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (me) void load();
  }, [me, load]);

  async function act(path: string, body?: unknown) {
    try {
      await api(path, { method: "POST", body });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (!loaded) return <p className="text-ink-muted">Loading…</p>;
  if (!me) {
    return (
      <a href={signInHref("/admin")} className="btn btn-primary">
        Sign in with GitHub
      </a>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <AccountBar me={me} loaded={loaded} onSignedOut={refresh} />
      </div>
      {error && <p className="mb-6 rounded-[var(--radius)] bg-danger-soft text-danger px-4 py-3 text-sm" role="alert">{error}</p>}

      <h2 className="type-title mb-4">Waiting for review {pending && <span className="text-ink-muted font-normal">({pending.length})</span>}</h2>
      {pending?.length === 0 && <p className="text-ink-muted mb-10">Queue is empty.</p>}
      <ul className="divide-y divide-border border-y border-border mb-14">
        {pending?.map((s) => (
          <li key={s.id} className="py-5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
              <span className="font-semibold text-accent-strong">
                {s.kind === "link" ? "Link" : (RESOURCE_TYPES.find((t) => t.value === s.resourceType)?.label ?? "Resource")}
              </span>
              <span>{s.domain}</span>
              <span className="inline-flex items-center gap-1">
                &middot; <Avatar user={s.author} size={16} /> {s.author.login}
              </span>
              <span>&middot; {relativeTime(s.createdAt)}</span>
            </div>
            <a href={s.url} target="_blank" rel="nofollow noopener noreferrer" className="mt-1 block font-semibold hover:text-accent-strong break-words">
              {s.title}
            </a>
            <p className="mt-1 text-sm text-ink-muted">{s.summary}</p>
            <p className="mt-1 text-xs text-ink-faint break-all">{s.url}</p>
            {s.tags.length > 0 && <p className="mt-1 text-xs text-ink-muted">{s.tags.map((t) => `#${t}`).join(" ")}</p>}

            {rejecting === s.id ? (
              <form
                className="mt-3 flex flex-col sm:flex-row gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void act(`/admin/submissions/${s.id}`, { action: "reject", reason: reason || undefined });
                  setRejecting(null);
                  setReason("");
                }}
              >
                <input className="field !py-2 !text-sm" placeholder="Reason shown to the author (optional)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
                <button type="submit" className="btn btn-sm cursor-pointer bg-danger text-white shrink-0">Reject</button>
                <button type="button" className="btn btn-secondary btn-sm cursor-pointer shrink-0" onClick={() => setRejecting(null)}>Cancel</button>
              </form>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="btn btn-primary btn-sm cursor-pointer" onClick={() => act(`/admin/submissions/${s.id}`, { action: "approve" })}>
                  Approve
                </button>
                <button type="button" className="btn btn-secondary btn-sm cursor-pointer" onClick={() => setRejecting(s.id)}>
                  Reject…
                </button>
                <button
                  type="button"
                  className="btn btn-plain btn-sm cursor-pointer !text-danger"
                  onClick={() => act(`/admin/users/${s.author.id}/ban`)}
                >
                  Ban {s.author.login}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <h2 className="type-title mb-4">Open reports <span className="text-ink-muted font-normal">({reports.length})</span></h2>
      {reports.length === 0 && <p className="text-ink-muted">No open reports.</p>}
      <ul className="divide-y divide-border border-y border-border">
        {reports.map((r) => (
          <li key={r.id} className="py-5">
            <p className="text-xs text-ink-muted">
              {r.reporter} reported &middot; {relativeTime(r.created_at)} &middot; item is {r.status}
            </p>
            <a href={r.url} target="_blank" rel="nofollow noopener noreferrer" className="mt-1 block font-semibold hover:text-accent-strong">
              {r.title}
            </a>
            <p className="mt-1 text-sm">&ldquo;{r.reason}&rdquo;</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn btn-secondary btn-sm cursor-pointer" onClick={() => act(`/admin/reports/${r.id}/resolve`)}>
                Dismiss
              </button>
              <button
                type="button"
                className="btn btn-sm cursor-pointer bg-danger text-white"
                onClick={async () => {
                  await act(`/admin/submissions/${r.submission_id}`, { action: "reject", reason: "Removed after a report" });
                  await act(`/admin/reports/${r.id}/resolve`);
                }}
              >
                Take down
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
