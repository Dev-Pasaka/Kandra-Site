"use client";

import { useState } from "react";
import { ChevronUp, ExternalLink, Flag } from "lucide-react";
import { api, RESOURCE_TYPES, relativeTime, signInHref, type Me, type Submission } from "@/lib/community";
import { Avatar } from "./avatar";

export function SubmissionCard({
  item,
  me,
  onTag,
}: {
  item: Submission;
  me: Me | null;
  onTag?: (tag: string) => void;
}) {
  const [votes, setVotes] = useState(item.votes);
  const [voted, setVoted] = useState(item.voted);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const typeLabel = RESOURCE_TYPES.find((t) => t.value === item.resourceType)?.label;

  async function vote() {
    if (!me) {
      window.location.href = signInHref(window.location.pathname);
      return;
    }
    // Optimistic: flip immediately, reconcile with the server's count.
    setVoted(!voted);
    setVotes(votes + (voted ? -1 : 1));
    try {
      const r = await api<{ voted: boolean; votes: number }>(`/submissions/${item.id}/vote`, { method: "POST" });
      setVoted(r.voted);
      setVotes(r.votes);
    } catch {
      setVoted(voted);
      setVotes(votes);
    }
  }

  async function report() {
    try {
      await api(`/submissions/${item.id}/report`, { method: "POST", body: { reason } });
      setNote("Thanks. A moderator will take a look.");
      setReporting(false);
    } catch (e) {
      setNote((e as Error).message);
    }
  }

  return (
    <li className="flex gap-4 py-6">
      <button
        type="button"
        onClick={vote}
        aria-pressed={voted}
        aria-label={`${voted ? "Remove upvote" : "Upvote"}: ${item.title}`}
        className={`pressable flex flex-col items-center justify-center shrink-0 w-12 h-14 rounded-[var(--radius)] text-sm font-semibold cursor-pointer transition-colors ${
          voted ? "bg-accent-soft text-accent-strong" : "bg-paper-raised text-ink-muted hover:text-ink"
        }`}
      >
        <ChevronUp className="w-4 h-4" strokeWidth={2.4} aria-hidden="true" />
        {votes}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted mb-1">
          {typeLabel && <span className="font-semibold text-accent-strong">{typeLabel}</span>}
          <span>{item.domain}</span>
          {item.kandraVersion && <span>&middot; Kandra {item.kandraVersion}</span>}
        </div>
        <a
          href={item.url}
          target="_blank"
          rel="nofollow ugc noopener noreferrer"
          className="group inline-flex items-start gap-1.5 font-semibold text-[1.05rem] leading-snug hover:text-accent-strong transition-colors"
        >
          <span className="text-pretty">{item.title}</span>
          <ExternalLink className="w-3.5 h-3.5 mt-1 shrink-0 text-ink-faint group-hover:text-accent-strong" strokeWidth={2} aria-hidden="true" />
        </a>
        <p className="mt-1.5 text-[0.95rem] text-ink-muted leading-relaxed text-pretty">{item.summary}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <Avatar user={item.author} size={18} />
            <a href={`https://github.com/${item.author.login}`} target="_blank" rel="noopener noreferrer" className="hover:text-ink">
              {item.author.login}
            </a>
          </span>
          {item.publishedAt && <time dateTime={item.publishedAt}>{relativeTime(item.publishedAt)}</time>}
          {item.tags.map((t) =>
            onTag ? (
              <button key={t} type="button" className="chip !py-0.5 !px-2" onClick={() => onTag(t)}>
                {t}
              </button>
            ) : (
              <span key={t} className="chip !py-0.5 !px-2 !cursor-default">{t}</span>
            ),
          )}
          {me && me.id !== item.author.id && !note && (
            <button
              type="button"
              className="inline-flex items-center gap-1 hover:text-ink cursor-pointer"
              onClick={() => setReporting(!reporting)}
              aria-expanded={reporting}
            >
              <Flag className="w-3 h-3" strokeWidth={2} aria-hidden="true" /> Report
            </button>
          )}
        </div>

        {reporting && (
          <form
            className="mt-3 flex flex-col sm:flex-row gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void report();
            }}
          >
            <input
              className="field !py-2 !text-sm"
              placeholder="What's wrong? Spam, broken link, off-topic…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              minLength={3}
              maxLength={300}
              required
              aria-label="Reason for report"
            />
            <button type="submit" className="btn btn-primary btn-sm shrink-0">
              Send report
            </button>
          </form>
        )}
        {note && <p className="mt-2 text-xs text-ink-muted" role="status">{note}</p>}
      </div>
    </li>
  );
}
