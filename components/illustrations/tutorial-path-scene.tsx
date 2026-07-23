// The tutorial's fifteen checkpoints as a single path, echoing the chariot's
// forward motion from the homepage hero: a small ring emblem (same mark as
// chariot-scene.tsx's Kandra standard) sets off from the left, passes one
// tick per tutorial page, and reaches a target ring — "shipped" — on the
// right. Purely decorative; the numbered links below carry the real nav.

const STOPS = 15;

export function TutorialPathScene({ className }: { className?: string }) {
  const startX = 60;
  const endX = 560;
  const y = 70;
  const span = endX - startX;

  return (
    <svg
      viewBox="0 0 620 130"
      className={className}
      role="img"
      aria-label="A path from a small ring emblem on the left, through fifteen tick marks representing the tutorial's checkpoints, to a target ring on the right labeled shipped."
    >
      <line x1={startX} y1={y} x2={endX} y2={y} stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.5" />

      {Array.from({ length: STOPS }, (_, i) => {
        const x = startX + ((i + 1) / (STOPS + 1)) * span;
        return (
          <line key={i} x1={x} y1={y - 6} x2={x} y2={y + 6} stroke="var(--ink-faint)" strokeWidth="1.5" />
        );
      })}

      {/* start: Kandra ring emblem, same mark as the chariot standard */}
      <circle cx={startX} cy={y} r="13" fill="none" stroke="var(--accent)" strokeWidth="2.5" />
      <circle cx={startX} cy={y} r="13" stroke="var(--accent)" strokeOpacity="0.3" strokeWidth="4.5" strokeDasharray="0.5 5" strokeLinecap="round" fill="none" />
      <circle cx={startX} cy={y - 11} r="2" fill="var(--accent)" />
      <text x={startX} y={y + 34} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="var(--accent-strong)">
        page one
      </text>

      {/* end: target ring, shipped */}
      <circle cx={endX} cy={y} r="13" fill="none" stroke="var(--tip)" strokeWidth="2.5" />
      <circle cx={endX} cy={y} r="7" fill="none" stroke="var(--tip)" strokeWidth="2" />
      <circle cx={endX} cy={y} r="2.2" fill="var(--tip)" />
      <text x={endX} y={y + 34} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="var(--tip)">
        shipped
      </text>
    </svg>
  );
}
