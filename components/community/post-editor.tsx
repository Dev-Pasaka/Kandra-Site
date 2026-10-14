"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ImagePlus } from "lucide-react";
import { api, ApiError, MEDIA_ACCEPT, signInHref, uploadMedia, useMe, type CommunityPost } from "@/lib/community";
import { AccountBar } from "./account-bar";

const STATUS_TEXT: Record<CommunityPost["status"], string> = {
  draft: "Draft, only you can see it.",
  pending: "Waiting for a moderator.",
  approved: "Published.",
  rejected: "Not accepted. Edit it and submit again.",
};

function altFromName(name: string): string {
  return name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim().slice(0, 80) || "image";
}

export function PostEditor() {
  const { me, loaded, refresh } = useMe();
  const [id, setId] = useState<number | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [status, setStatus] = useState<CommunityPost["status"] | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState("");
  const [canonical, setCanonical] = useState("");
  const [body, setBody] = useState("");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [preview, setPreview] = useState("");
  const [uploads, setUploads] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  const [loadingPost, setLoadingPost] = useState(false);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // ?id=<n> opens an existing post. Read once on mount (static export, no server query).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("id");
    if (!q || !me) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingPost(true);
    api<CommunityPost>(`/posts/${Number(q)}`)
      .then((p) => {
        setId(p.id);
        setSlug(p.slug);
        setStatus(p.status);
        setTitle(p.title);
        setSummary(p.summary);
        setTags(p.tags.join(", "));
        setCanonical(p.canonicalUrl ?? "");
        setBody(p.body ?? "");
        if (p.status === "rejected" && p.rejectReason) setMessage({ kind: "error", text: `Moderator note: ${p.rejectReason}` });
      })
      .catch((e: Error) => setMessage({ kind: "error", text: e.message }))
      .finally(() => setLoadingPost(false));
  }, [me]);

  function insertAtCursor(text: string): void {
    const el = textarea.current;
    const start = el?.selectionStart ?? body.length;
    const end = el?.selectionEnd ?? body.length;
    setBody((b) => {
      const before = b.slice(0, start);
      const pad = before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
      return `${before}${pad}${text}\n\n${b.slice(end)}`;
    });
  }

  async function addFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => /^(image|video)\//.test(f.type));
    if (!list.length) return;
    setMessage(null);
    // Insert every placeholder at the cursor in one edit, each with a unique marker, then swap each
    // one for its real link as its upload finishes. (Inserting per file at a remembered cursor
    // position would land inside text an earlier upload had already replaced.)
    const batch = list.map((file) => ({ file, alt: altFromName(file.name), placeholder: `![Uploading ${altFromName(file.name)}… #${Math.random().toString(36).slice(2, 8)}]()` }));
    insertAtCursor(batch.map((b) => b.placeholder).join("\n\n"));
    setUploads((n) => n + batch.length);
    for (const { file, alt, placeholder } of batch) {
      try {
        const r = await uploadMedia(file);
        setBody((b) => b.replace(placeholder, `![${alt}](${r.url})`));
      } catch (e) {
        setBody((b) => b.replace(`${placeholder}\n\n`, "").replace(placeholder, ""));
        setMessage({ kind: "error", text: e instanceof ApiError ? e.message : "Upload failed" });
      } finally {
        setUploads((n) => n - 1);
      }
    }
  }

  async function showPreview() {
    setTab("preview");
    try {
      setPreview((await api<{ html: string }>("/posts/preview", { method: "POST", body: { body } })).html);
    } catch (e) {
      setPreview(`<p>${(e as Error).message}</p>`);
    }
  }

  async function save(submit: boolean) {
    setBusy(true);
    setMessage(null);
    try {
      const payload = {
        title,
        summary,
        body,
        canonicalUrl: canonical || undefined,
        tags: tags.split(/[,\s]+/).filter(Boolean),
      };
      const saved = id
        ? await api<{ id: number; slug: string; status: CommunityPost["status"] }>(`/posts/${id}`, { method: "PUT", body: payload })
        : await api<{ id: number; slug: string; status: CommunityPost["status"] }>("/posts", { method: "POST", body: payload });
      setId(saved.id);
      setSlug(saved.slug);
      let next = saved.status;
      if (!id) window.history.replaceState(null, "", `/community/write?id=${saved.id}`);
      if (submit) next = (await api<{ status: CommunityPost["status"] }>(`/posts/${saved.id}/submit`, { method: "POST" })).status;
      setStatus(next);
      setMessage({
        kind: "ok",
        text:
          next === "approved"
            ? "Published."
            : next === "pending"
              ? "Sent for review. A moderator will look at it soon."
              : "Draft saved.",
      });
    } catch (e) {
      setMessage({ kind: "error", text: e instanceof ApiError ? e.message : "Couldn't save" });
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) return <p className="text-ink-muted">Loading…</p>;
  if (!me) {
    return (
      <div className="card p-8 text-center">
        <p className="font-semibold">Sign in to write</p>
        <p className="mt-2 text-ink-muted text-pretty">
          Posts are credited to your public GitHub profile. A moderator reviews new posts before they appear.
        </p>
        <a href={signInHref("/community/write")} className="btn btn-primary mt-6">
          Sign in with GitHub
        </a>
      </div>
    );
  }
  if (loadingPost) return <p className="text-ink-muted">Loading post…</p>;

  return (
    <div>
      <div className="mb-8">
        <AccountBar me={me} loaded={loaded} onSignedOut={refresh} />
      </div>

      {status && (
        <p className="mb-6 text-sm text-ink-muted" role="status">
          {STATUS_TEXT[status]}{" "}
          {slug && (
            <a href={`/community/p/${slug}`} className="text-accent-strong hover:underline underline-offset-4">
              View page &rsaquo;
            </a>
          )}
        </p>
      )}

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          void save(true);
        }}
      >
        <div>
          <label className="field-label" htmlFor="title">Title</label>
          <input id="title" className="field !text-lg !font-semibold" required minLength={8} maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="field-label" htmlFor="summary">Summary</label>
          <textarea id="summary" className="field min-h-20" required minLength={20} maxLength={300} value={summary} onChange={(e) => setSummary(e.target.value)} />
          <p className="field-hint">One or two sentences shown in the post list and link previews.</p>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="segmented" role="group" aria-label="Editor mode">
              <button type="button" aria-pressed={tab === "write"} className="cursor-pointer" onClick={() => setTab("write")}>Write</button>
              <button type="button" aria-pressed={tab === "preview"} className="cursor-pointer" onClick={showPreview}>Preview</button>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm cursor-pointer"
              onClick={() => fileInput.current?.click()}
              disabled={tab !== "write"}
            >
              <ImagePlus className="w-4 h-4" strokeWidth={2} aria-hidden="true" /> Image or video
            </button>
            <input
              ref={fileInput}
              type="file"
              accept={MEDIA_ACCEPT}
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files) void addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {tab === "write" ? (
            <textarea
              ref={textarea}
              id="body"
              aria-label="Post body (Markdown)"
              className="field font-mono !text-[0.9rem] min-h-[28rem] leading-relaxed"
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                if (e.dataTransfer.files.length) {
                  e.preventDefault();
                  void addFiles(e.dataTransfer.files);
                }
              }}
              onPaste={(e) => {
                if (e.clipboardData.files.length) {
                  e.preventDefault();
                  void addFiles(e.clipboardData.files);
                }
              }}
              placeholder={"## Why I tried Kandra\n\nWrite in Markdown. Drag images or videos in, paste screenshots, or use the button above.\n\n```kotlin\n@ScyllaTable(\"users\")\ndata class User(@PartitionKey val id: UUID)\n```"}
            />
          ) : (
            <div
              className="kandra-prose post-body !max-w-none min-h-[28rem] rounded-[var(--radius)] border border-border px-5 py-4"
              // Rendered and sanitized by the Worker (worker/markdown.ts), the same code that renders the public page.
              dangerouslySetInnerHTML={{ __html: preview || "<p>Nothing to preview yet.</p>" }}
            />
          )}
          <p className="field-hint">
            Markdown. Images up to 5 MB (PNG, JPEG, GIF, WebP, AVIF), videos up to 50 MB (MP4, WebM).
            {uploads > 0 && <span className="ml-1 font-medium text-ink"> Uploading {uploads}…</span>}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label" htmlFor="tags">Tags</label>
            <input id="tags" className="field" placeholder="data-modeling, ktor" value={tags} onChange={(e) => setTags(e.target.value)} />
            <p className="field-hint">Up to five.</p>
          </div>
          <div>
            <label className="field-label" htmlFor="canonical">Originally published at</label>
            <input id="canonical" className="field" type="url" placeholder="https:// (optional)" value={canonical} onChange={(e) => setCanonical(e.target.value)} />
            <p className="field-hint">If you&apos;re cross-posting, search engines credit your blog.</p>
          </div>
        </div>

        {message && (
          <p
            className={`rounded-[var(--radius)] px-4 py-3 text-sm ${message.kind === "error" ? "bg-danger-soft text-danger" : "bg-tip-soft text-tip"}`}
            role={message.kind === "error" ? "alert" : "status"}
          >
            {message.text}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn btn-primary cursor-pointer disabled:opacity-50" disabled={busy || uploads > 0}>
            {status === "approved" ? "Save changes" : "Submit for review"}
          </button>
          {status !== "approved" && (
            <button type="button" className="btn btn-secondary cursor-pointer disabled:opacity-50" disabled={busy || uploads > 0} onClick={() => save(false)}>
              Save draft
            </button>
          )}
          <p className="text-xs text-ink-muted">
            See the <Link href="/community/guidelines" className="underline">guidelines</Link>.
          </p>
        </div>
      </form>
    </div>
  );
}
