const NODES = [
  { label: "Node A", start: 0, deg: 0 },
  { label: "Node B", start: 120, deg: 120 },
  { label: "Node C", start: 240, deg: 240 },
];

function polar(deg: number, r: number, cx = 220, cy = 220) {
  const rad = (deg - 90) * (Math.PI / 180);
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as const;
}

function arcPath(startDeg: number, endDeg: number, r: number) {
  const [x1, y1] = polar(startDeg, r);
  const [x2, y2] = polar(endDeg, r);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

const COLORS = ["var(--accent)", "var(--note)", "var(--tip)"];

export function PartitionRingDiagram() {
  const tokenDeg = 65; // where our example row's partition key hashes to
  const [tx, ty] = polar(tokenDeg, 150);
  const [tlx, tly] = polar(tokenDeg, 195);

  return (
    <svg viewBox="0 0 440 300" className="w-full h-auto" role="img" aria-label="Consistent hashing ring showing three nodes owning arcs of the token range, and a row's partition key hashing to a point on the ring owned by Node B.">
      {NODES.map((n, i) => {
        const end = NODES[(i + 1) % NODES.length].start || 360;
        return (
          <path
            key={n.label}
            d={arcPath(n.start, i === NODES.length - 1 ? 360 : end, 150)}
            stroke={COLORS[i]}
            strokeWidth="10"
            fill="none"
            strokeLinecap="butt"
          />
        );
      })}
      <circle cx="220" cy="220" r="150" fill="none" stroke="var(--border)" strokeWidth="1" />

      {NODES.map((n, i) => {
        const mid = i === 2 ? 300 : n.start + 60;
        const [lx, ly] = polar(mid, 178);
        return (
          <text key={n.label} x={lx} y={ly} textAnchor="middle" fontSize="12" fontFamily="var(--font-mono)" fill={COLORS[i]}>
            {n.label}
          </text>
        );
      })}

      <line x1="220" y1="220" x2={tx} y2={ty} stroke="var(--ink-faint)" strokeDasharray="3 3" strokeWidth="1" />
      <circle cx={tx} cy={ty} r="5" fill="var(--ink)" stroke="var(--paper)" strokeWidth="1.5" />
      <text x={tlx} y={tly - 4} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink)">
        token(user_id)
      </text>
      <text x={tlx} y={tly + 12} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink-faint)">
        owned by Node B
      </text>

      <text x="220" y="216" textAnchor="middle" fontSize="11" fill="var(--ink-faint)">
        hash ring
      </text>
    </svg>
  );
}
