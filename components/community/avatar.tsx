import type { Author } from "@/lib/community";

export function Avatar({ user, size = 20 }: { user: Pick<Author, "login" | "avatarUrl">; size?: number }) {
  if (user.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- static export, GitHub-hosted avatar
      <img
        src={`${user.avatarUrl}${user.avatarUrl.includes("?") ? "&" : "?"}s=${size * 2}`}
        alt=""
        width={size}
        height={size}
        className="rounded-full bg-paper-raised shrink-0"
        loading="lazy"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="inline-flex items-center justify-center rounded-full bg-accent-soft text-accent-strong font-semibold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      {user.login.slice(0, 1).toUpperCase()}
    </span>
  );
}
