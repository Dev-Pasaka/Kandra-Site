// The visual argument for /why: a relational mental model buries the
// distributed tradeoff beneath a surface that "looks correct" (left panel,
// the fault line drawn faint and dashed, underground); Kandra brings the
// same fault line to the surface, labeled, with a live signal on it (right
// panel). Same ring/line language as chariot-scene.tsx — no borrowed icons,
// no gradients, no photography. Motion (the pulsing signal) is off entirely
// under prefers-reduced-motion, per the .anim-spark rule in globals.css.

function Panel({
  x,
  label,
  sublabel,
  color,
  surfaced,
}: {
  x: number;
  label: string;
  sublabel: string;
  color: string;
  surfaced: boolean;
}) {
  const w = 240;
  const h = 130;
  const surfaceY = 60;
  const crackPath = `M ${x + 20} ${surfaceY} L ${x + 70} ${surfaceY + (surfaced ? 0 : 14)} L ${x + 120} ${surfaceY - (surfaced ? 6 : 4)} L ${x + 170} ${surfaceY + (surfaced ? 4 : 10)} L ${x + 220} ${surfaceY}`;

  return (
    <g>
      <rect
        x={x}
        y="10"
        width={w}
        height={h}
        rx="6"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="2"
      />
      {/* the surface line the crack sits on (or beneath) */}
      <line
        x1={x + 12}
        y1={surfaceY}
        x2={x + w - 12}
        y2={surfaceY}
        stroke="currentColor"
        strokeOpacity={surfaced ? 0.12 : 0.35}
        strokeWidth="1.5"
      />
      <path
        d={crackPath}
        fill="none"
        stroke={color}
        strokeOpacity={surfaced ? 1 : 0.4}
        strokeWidth={surfaced ? 2.5 : 1.5}
        strokeDasharray={surfaced ? undefined : "3 3"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {surfaced && (
        <circle cx={x + 120} cy={surfaceY - 6} r="4" fill={color} className="anim-spark" />
      )}
      <text
        x={x + w / 2}
        y="112"
        textAnchor="middle"
        fontSize="12.5"
        fontFamily="var(--font-mono)"
        fontWeight="600"
        fill={color}
      >
        {label}
      </text>
      <text
        x={x + w / 2}
        y="128"
        textAnchor="middle"
        fontSize="10.5"
        fontFamily="var(--font-mono)"
        fill="var(--ink-faint)"
      >
        {sublabel}
      </text>
    </g>
  );
}

export function FaultLineScene({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 150"
      className={className}
      role="img"
      aria-label="Two panels: the left shows a table with a distributed-systems fault line buried faint and dashed beneath the surface, labeled 'looks correct'. The right shows the same fault line brought fully to the surface with a visible pulsing signal, labeled Kandra: tradeoff visible. An arrow connects the two."
    >
      <Panel x={0} label="looks correct" sublabel="tradeoff hidden below the surface" color="var(--danger)" surfaced={false} />

      <g stroke="var(--ink-faint)" strokeWidth="1.5">
        <line x1="255" y1="75" x2="375" y2="75" strokeDasharray="4 4" />
        <path d="M 368 68 L 378 75 L 368 82" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      </g>

      <Panel x={400} label="visible, by design" sublabel="tradeoff named, on the surface" color="var(--accent)" surfaced={true} />
    </svg>
  );
}
