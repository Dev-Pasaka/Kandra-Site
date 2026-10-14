"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { api, signInHref, type Me } from "@/lib/community";
import { Avatar } from "./avatar";

// Sign-in state for the community pages. GitHub is the only provider; we read the public profile.
export function AccountBar({ me, loaded, onSignedOut }: { me: Me | null; loaded: boolean; onSignedOut: () => void }) {
  const pathname = usePathname();
  if (!loaded) return <div className="h-9" aria-hidden="true" />;

  if (!me) {
    return (
      <a href={signInHref(pathname)} className="btn btn-secondary btn-sm">
        Sign in with GitHub
      </a>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      <span className="inline-flex items-center gap-2 font-medium">
        <Avatar user={me} size={24} />
        {me.login}
      </span>
      <Link href="/community/mine" className="text-accent-strong hover:underline underline-offset-4">
        My submissions
      </Link>
      {(me.role === "admin" || me.role === "moderator") && (
        <Link href="/admin" className="text-accent-strong hover:underline underline-offset-4">
          Moderation
        </Link>
      )}
      <button
        type="button"
        className="text-ink-muted hover:text-ink cursor-pointer"
        onClick={async () => {
          await api("/auth/logout", { method: "POST" }).catch(() => {});
          onSignedOut();
        }}
      >
        Sign out
      </button>
    </div>
  );
}
