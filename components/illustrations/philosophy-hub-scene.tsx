// Five decisions radiating from one hub — the /philosophy index's visual
// table of contents. Same hub-and-spoke language as the hash-ring wheels in
// chariot-scene.tsx: a center emblem, thin radial spokes, small labeled
// nodes. Purely decorative/non-interactive, so colors are chosen to
// distinguish the five nodes, not to imply severity (no --danger here).

const NODES = [
  { label: "Atomicity", color: "var(--accent)" },
  { label: "Consistency", color: "var(--note)" },
  { label: "Schema safety", color: "var(--tip)" },
  { label: "Denormalization", color: "var(--accent-strong)" },
  { label: "Testing", color: "var(--ink-muted)" },
];

const CX = 240;
const CY = 220;
const R = 150;

function polar(deg: number, r: number) {
  const rad = (deg * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)] as const;
}

export function PhilosophyHubScene({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 400"
      className={className}
      role="img"
      aria-label="A hub labeled Kandra with five spokes radiating out to labeled nodes: Atomicity, Consistency, Schema safety, Denormalization, and Testing."
    >
      {NODES.map((n, i) => {
        const deg = -90 + i * (360 / NODES.length);
        const [nx, ny] = polar(deg, R);
        const [tx, ty] = polar(deg, R + 34);
        const [lx, ly] = polar(deg, 34);
        return (
          <g key={n.label}>
            <line x1={lx} y1={ly} x2={nx} y2={ny} stroke={n.color} strokeOpacity="0.55" strokeWidth="1.5" />
            <circle cx={nx} cy={ny} r="7" fill="none" stroke={n.color} strokeWidth="2.5" />
            <circle cx={nx} cy={ny} r="2.2" fill={n.color} />
            <text
              x={tx}
              y={ty}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="13"
              fontFamily="var(--font-mono)"
              fontWeight="600"
              fill={n.color}
            >
              {n.label}
            </text>
          </g>
        );
      })}

      <circle cx={CX} cy={CY} r="30" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx={CX} cy={CY} r="30" stroke="currentColor" strokeOpacity="0.25" strokeWidth="6" strokeDasharray="0.5 6" strokeLinecap="round" fill="none" />
      <text
        x={CX}
        y={CY + 4}
        textAnchor="middle"
        fontSize="12.5"
        fontFamily="var(--font-mono)"
        fontWeight="600"
        fill="var(--accent-strong)"
      >
        kandra
      </text>
    </svg>
  );
}
