// A consistent-hashing ring, rendered as line art. This isn't decoration for
// decoration's sake — it's the actual mental model /foundations teaches
// (partitions own arcs of a ring, tokens land somewhere on it), reused
// visually instead of reaching for a generic gradient blob.
export function RingMotif({ className }: { className?: string }) {
  const nodes = [18, 71, 132, 196, 244, 305];
  const polar = (deg: number, r: number) => {
    const rad = (deg - 90) * (Math.PI / 180);
    return [200 + r * Math.cos(rad), 200 + r * Math.sin(rad)] as const;
  };

  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <circle cx="200" cy="200" r="150" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" />
      <circle cx="200" cy="200" r="150" stroke="currentColor" strokeOpacity="0.15" strokeWidth="18" strokeDasharray="1 11" strokeLinecap="round" />
      {nodes.map((deg, i) => {
        const [x, y] = polar(deg, 150);
        const [lx, ly] = polar(deg, 172);
        return (
          <g key={i}>
            <line x1={x} y1={y} x2={lx} y2={ly} stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" />
            <circle cx={x} cy={y} r={i === 2 ? 5 : 3.5} fill="currentColor" fillOpacity={i === 2 ? 0.9 : 0.5} />
          </g>
        );
      })}
      <circle cx="200" cy="200" r="2" fill="currentColor" fillOpacity="0.4" />
    </svg>
  );
}
