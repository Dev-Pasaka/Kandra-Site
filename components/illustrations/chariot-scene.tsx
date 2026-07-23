// Kandra driving Cassandra and ScyllaDB forward as one chariot — the hero's
// answer to "what does this library actually do." Built from the same ring
// language as the rest of the site (no borrowed logos, no gradients): two
// hash-ring wheels labeled by database, a Kandra emblem at the prow, and
// restrained CSS motion (wheels turning, dust drifting) instead of a static
// pin. Motion is off entirely under prefers-reduced-motion (see globals.css).

function Wheel({ cx, cy, r, label }: { cx: number; cy: number; r: number; label: string }) {
  const ticks = Array.from({ length: 10 }, (_, i) => i * 36);
  return (
    <g>
      <g className="anim-wheel" style={{ transformOrigin: `${cx}px ${cy}px` }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth="2.5" />
        <circle cx={cx} cy={cy} r={r - 10} fill="none" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1" />
        {ticks.map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = cx + Math.cos(rad) * (r - 10);
          const y1 = cy + Math.sin(rad) * (r - 10);
          const x2 = cx + Math.cos(rad) * r;
          const y2 = cy + Math.sin(rad) * r;
          return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="2" />;
        })}
        <circle cx={cx} cy={cy} r="4" fill="var(--accent)" />
      </g>
      <text
        x={cx}
        y={cy + r + 22}
        textAnchor="middle"
        fontSize="12"
        fontFamily="var(--font-mono)"
        letterSpacing="0.04em"
        fill="var(--ink-faint)"
      >
        {label}
      </text>
    </g>
  );
}

export function ChariotScene({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 620 340"
      className={className}
      role="img"
      aria-label="A line-art chariot, driven by Kandra's ring emblem, with two wheels labeled ScyllaDB and Cassandra turning beneath it — Kandra steering both databases forward."
    >
      {/* ground */}
      <line x1="20" y1="300" x2="600" y2="300" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1" />

      {/* dust/motion streaks trailing behind */}
      {[0, 1, 2].map((i) => (
        <line
          key={i}
          className="anim-streak"
          x1={70 - i * 22}
          y1={230 + i * 20}
          x2={130 - i * 22}
          y2={230 + i * 20}
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ animationDelay: `${i * 0.25}s` }}
        />
      ))}

      <g className="anim-bob">
        {/* chariot body */}
        <path
          d="M 190 210 L 470 210 L 500 160 L 430 160 L 400 130 L 260 130 L 240 160 L 160 160 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <line x1="330" y1="130" x2="330" y2="210" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.5" />

        {/* Kandra emblem at the prow, on a standard */}
        <line x1="470" y1="160" x2="500" y2="90" stroke="currentColor" strokeWidth="2" />
        <circle cx="504" cy="82" r="14" fill="none" stroke="var(--accent)" strokeWidth="2.5" />
        <circle cx="504" cy="82" r="14" stroke="var(--accent)" strokeOpacity="0.3" strokeWidth="5" strokeDasharray="0.5 5" strokeLinecap="round" fill="none" />
        <circle cx="504" cy="70" r="2.4" fill="var(--accent)" />
        <text x="504" y="115" textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="var(--accent-strong)" fontWeight="600">
          kandra
        </text>

        {/* axle */}
        <line x1="215" y1="220" x2="445" y2="220" stroke="currentColor" strokeWidth="2.5" />
      </g>

      <Wheel cx={215} cy={220} r={65} label="SCYLLADB" />
      <Wheel cx={445} cy={220} r={65} label="CASSANDRA" />
    </svg>
  );
}
