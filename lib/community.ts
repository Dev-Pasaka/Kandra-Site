"use client";

import { useCallback, useEffect, useState } from "react";

// Client side of the community API (worker/). The pages are static shells; everything dynamic is
// fetched from /api on the same origin. Under plain `next dev` there is no Worker, so calls fail
// with a message pointing at `npm run preview`.

export interface Author {
  id: number;
  login: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface Submission {
  id: number;
  kind: "link" | "resource";
  url: string;
  domain: string;
  title: string;
  summary: string;
  resourceType: ResourceType | null;
  kandraVersion: string | null;
  status: "pending" | "approved" | "rejected";
  rejectReason: string | null;
  createdAt: string;
  publishedAt: string | null;
  votes: number;
  voted: boolean;
  tags: string[];
  author: Author;
}

export interface Me {
  id: number;
  login: string;
  name: string | null;
  avatarUrl: string | null;
  role: "member" | "moderator" | "admin";
}

export interface CommunityPost {
  id: number;
  slug: string;
  title: string;
  summary: string;
  status: "draft" | "pending" | "approved" | "rejected";
  rejectReason: string | null;
  canonicalUrl: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  readingMinutes: number;
  tags: string[];
  author: Author;
  body?: string;
}

export const MEDIA_ACCEPT = "image/png,image/jpeg,image/gif,image/webp,image/avif,video/mp4,video/webm";

/** Uploads one image or video; the server checks the real type from the file's bytes. */
export async function uploadMedia(file: File): Promise<{ url: string; kind: "image" | "video" }> {
  if (file.size > 50 * 1024 * 1024) throw new ApiError(413, `${file.name} is larger than 50 MB`);
  let res: Response;
  try {
    res = await fetch("/api/media", { method: "PUT", credentials: "same-origin", body: file });
  } catch {
    throw new ApiError(0, "Upload failed. Check your connection and try again.");
  }
  const data = (await res.json().catch(() => ({ error: "Upload failed" }))) as { url: string; kind: "image" | "video"; error?: string };
  if (!res.ok) throw new ApiError(res.status, data.error ?? "Upload failed");
  return data;
}

export const RESOURCE_TYPES = [
  { value: "library", label: "Library" },
  { value: "sample", label: "Sample app" },
  { value: "guide", label: "Guide" },
  { value: "talk", label: "Talk" },
  { value: "tool", label: "Tool" },
  { value: "template", label: "Template" },
] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number]["value"];

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: init?.method ?? "GET",
      credentials: "same-origin",
      headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }
  const isJson = (res.headers.get("Content-Type") ?? "").includes("application/json");
  if (!isJson) {
    throw new ApiError(res.status, "The community API isn't running here. Use `npm run preview` instead of `next dev`.");
  }
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new ApiError(res.status, data.error ?? "Something went wrong");
  return data;
}

export function signInHref(next: string): string {
  return `/api/auth/github?next=${encodeURIComponent(next)}`;
}

export function useMe() {
  const [me, setMe] = useState<Me | null>(null);
  const [loaded, setLoaded] = useState(false);
  const refresh = useCallback(async () => {
    try {
      setMe((await api<{ user: Me | null }>("/me")).user);
    } catch {
      setMe(null);
    } finally {
      setLoaded(true);
    }
  }, []);
  useEffect(() => {
    // Session state lives in an HttpOnly cookie only the Worker can read.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);
  return { me, loaded, refresh };
}

export function relativeTime(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "minute"],
    [3600, "hour"],
    [86400, "day"],
    [86400 * 30, "month"],
    [86400 * 365, "year"],
  ];
  const fmt = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (let i = units.length - 1; i >= 0; i--) {
    const [size, unit] = units[i];
    if (s >= size) return fmt.format(-Math.floor(s / size), unit);
  }
  return "just now";
}
