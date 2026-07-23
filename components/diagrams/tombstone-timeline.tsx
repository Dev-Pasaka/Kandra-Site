export function TombstoneTimeline() {
  return (
    <svg viewBox="0 0 520 140" className="w-full h-auto" role="img" aria-label="Timeline: a DELETE writes a tombstone at day 0, reads pay the cost of skipping past it until gc_grace_seconds (10 days by default) passes, after which compaction reclaims the space.">
      <line x1="30" y1="70" x2="490" y2="70" stroke="var(--border-strong)" strokeWidth="1.5" />

      <circle cx="60" cy="70" r="5" fill="var(--danger)" />
      <text x="60" y="95" textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="var(--danger)">DELETE</text>
      <text x="60" y="110" textAnchor="middle" fontSize="10" fill="var(--ink-faint)">tombstone written</text>

      <rect x="60" y="64" width="360" height="12" rx="6" fill="var(--gotcha-soft)" stroke="var(--gotcha)" strokeWidth="1" />
      <text x="240" y="45" textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="var(--gotcha)">
        gc_grace_seconds (default 864000s / 10 days)
      </text>
      <text x="240" y="128" textAnchor="middle" fontSize="10" fill="var(--ink-faint)">
        reads on this partition must skip past the tombstone
      </text>

      <circle cx="420" cy="70" r="5" fill="var(--tip)" />
      <text x="420" y="95" textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="var(--tip)">compaction</text>
      <text x="420" y="110" textAnchor="middle" fontSize="10" fill="var(--ink-faint)">space reclaimed</text>
    </svg>
  );
}
