"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { KANDRA_VERSION } from "@/lib/site-config";
import { api, ApiError, RESOURCE_TYPES, signInHref, useMe, type ResourceType } from "@/lib/community";
import { AccountBar } from "./account-bar";
import { Turnstile, TURNSTILE_SITE_KEY } from "./turnstile";

type Kind = "link" | "resource";

export function SubmitForm() {
  const { me, loaded, refresh } = useMe();
  const [kind, setKind] = useState<Kind>("link");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState("");
  const [resourceType, setResourceType] = useState<ResourceType>("library");
  const [kandraVersion, setKandraVersion] = useState(KANDRA_VERSION);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"approved" | "pending" | null>(null);

  useEffect(() => {
    // ?kind=resource preselects the tab; read once on mount (static export, no server query).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (new URLSearchParams(window.location.search).get("kind") === "resource") setKind("resource");
  }, []);

  const onToken = useCallback((t: string) => setToken(t), []);

  async function unfurl() {
    if (!url || title) return;
    setFetching(true);
    try {
      const r = await api<{ title: string; summary: string }>("/submissions/unfurl", { method: "POST", body: { url } });
      if (r.title) setTitle((t) => t || r.title);
      if (r.summary) setSummary((s) => s || r.summary);
    } catch {
      /* the user can type it themselves */
    } finally {
      setFetching(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ status: "approved" | "pending" }>("/submissions", {
        method: "POST",
        body: {
          kind,
          url,
          title,
          summary,
          tags: tags.split(/[,\s]+/).filter(Boolean),
          resourceType: kind === "resource" ? resourceType : undefined,
          kandraVersion: kind === "resource" ? kandraVersion : undefined,
          turnstileToken: token,
        },
      });
      setDone(r.status);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) return <p className="text-ink-muted">Loading…</p>;

  if (!me) {
    return (
      <div className="card p-8 text-center">
        <p className="font-semibold">Sign in to share</p>
        <p className="mt-2 text-ink-muted text-pretty">
          We use your public GitHub profile to credit you and to keep spam out. We don&apos;t ask for
          access to your repositories or email.
        </p>
        <a href={signInHref("/community/submit")} className="btn btn-primary mt-6">
          Sign in with GitHub
        </a>
      </div>
    );
  }

  if (done) {
    return (
      <div className="card p-8 text-center" role="status">
        <p className="font-semibold">{done === "approved" ? "Published." : "Thanks! It's in the review queue."}</p>
        <p className="mt-2 text-ink-muted">
          {done === "approved"
            ? "It's live now."
            : "A moderator checks every new submission. You can follow its status under My submissions."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={kind === "link" ? "/community" : "/resources"} className="btn btn-primary btn-sm">
            Back to {kind === "link" ? "community" : "resources"}
          </Link>
          <button
            type="button"
            className="btn btn-secondary btn-sm cursor-pointer"
            onClick={() => {
              setDone(null);
              setUrl("");
              setTitle("");
              setSummary("");
              setTags("");
            }}
          >
            Share another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <AccountBar me={me} loaded={loaded} onSignedOut={refresh} />
      </div>
      <form onSubmit={submit} className="space-y-6">
        <div className="segmented" role="group" aria-label="What are you sharing?">
          <button type="button" aria-pressed={kind === "link"} className="cursor-pointer" onClick={() => setKind("link")}>
            Link to your writing
          </button>
          <button type="button" aria-pressed={kind === "resource"} className="cursor-pointer" onClick={() => setKind("resource")}>
            Resource
          </button>
        </div>
        <p className="text-sm text-ink-muted -mt-3">
          {kind === "link"
            ? "A blog post, video or talk you made about Kandra, ScyllaDB or Cassandra data modeling."
            : "A library, sample app, guide, tool or template other Kandra users would find useful."}
        </p>

        <div>
          <label className="field-label" htmlFor="url">URL</label>
          <input
            id="url"
            className="field"
            type="url"
            inputMode="url"
            required
            placeholder="https://"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={unfurl}
          />
          <p className="field-hint">{fetching ? "Reading the page title…" : "We fill in the title and summary from the page if we can."}</p>
        </div>

        {kind === "resource" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label" htmlFor="type">Type</label>
              <select id="type" className="field" value={resourceType} onChange={(e) => setResourceType(e.target.value as ResourceType)}>
                {RESOURCE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="version">Works with Kandra</label>
              <input
                id="version"
                className="field"
                value={kandraVersion}
                onChange={(e) => setKandraVersion(e.target.value)}
                pattern="\d+\.\d+\.\d+"
                placeholder={KANDRA_VERSION}
              />
            </div>
          </div>
        )}

        <div>
          <label className="field-label" htmlFor="title">Title</label>
          <input id="title" className="field" required minLength={8} maxLength={140} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <label className="field-label" htmlFor="summary">Summary</label>
          <textarea
            id="summary"
            className="field min-h-28"
            required
            minLength={20}
            maxLength={400}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
          <p className="field-hint">{summary.length}/400 · What will a reader learn?</p>
        </div>

        <div>
          <label className="field-label" htmlFor="tags">Tags</label>
          <input id="tags" className="field" placeholder="data-modeling, ktor, testing" value={tags} onChange={(e) => setTags(e.target.value)} />
          <p className="field-hint">Up to five, separated by commas.</p>
        </div>

        <Turnstile onToken={onToken} />

        {error && (
          <p className="rounded-[var(--radius)] bg-danger-soft text-danger px-4 py-3 text-sm" role="alert">{error}</p>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" className="btn btn-primary cursor-pointer disabled:opacity-50" disabled={busy || (!!TURNSTILE_SITE_KEY && !token)}>
            {busy ? "Submitting…" : "Submit for review"}
          </button>
          <p className="text-xs text-ink-muted max-w-sm">
            New submissions are reviewed by a moderator. Links are marked <code>nofollow</code>. See the{" "}
            <Link href="/community/guidelines" className="underline">guidelines</Link>.
          </p>
        </div>
      </form>
    </div>
  );
}
