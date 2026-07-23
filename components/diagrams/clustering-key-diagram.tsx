const ROWS = [
  { ts: "2026-07-22 09:14", text: "Ship the docs site" },
  { ts: "2026-07-21 17:02", text: "Fix ISS-030 regression" },
  { ts: "2026-07-20 11:40", text: "Write tutorial page 06" },
  { ts: "2026-07-18 08:05", text: "Set up ScyllaDB compose" },
];

export function ClusteringKeyDiagram() {
  const rowH = 34;
  const top = 56;
  return (
    <svg
      viewBox={`0 0 480 ${top + ROWS.length * rowH + 20}`}
      className="w-full h-auto"
      role="img"
      aria-label="One partition, owner_id = alice, containing four todo rows physically stored sorted by created_at descending — newest first, with no in-memory sort required."
    >
      <text x="8" y="20" fontSize="12" fontFamily="var(--font-mono)" fill="var(--accent-strong)">
        partition: owner_id = &apos;alice&apos;
      </text>
      <text x="8" y="38" fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink-faint)">
        stored sorted by created_at DESC — no in-memory sort needed
      </text>
      <rect x="4" y={top - 12} width="472" height={ROWS.length * rowH + 16} rx="6" fill="none" stroke="var(--border-strong)" strokeWidth="1" />
      {ROWS.map((r, i) => (
        <g key={r.ts} transform={`translate(0, ${top + i * rowH})`}>
          <rect x="12" y="0" width="456" height={rowH - 6} rx="4" fill={i === 0 ? "var(--accent-soft)" : "var(--paper-raised)"} />
          <text x="24" y={(rowH - 6) / 2 + 4} fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-muted)">
            {r.ts}
          </text>
          <text x="180" y={(rowH - 6) / 2 + 4} fontSize="11" fill="var(--ink)">
            {r.text}
          </text>
          {i === 0 && (
            <text x="440" y={(rowH - 6) / 2 + 4} fontSize="9" fontFamily="var(--font-mono)" fill="var(--accent-strong)" textAnchor="end">
              newest
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
