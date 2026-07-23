// Small line icons for the home page cards — same thin-stroke, currentColor
// style as the Callout icons, so nothing here introduces a second visual
// language.

type IconProps = { className?: string };

export function LinkChainIcon({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="5" width="6" height="6" rx="3" stroke="currentColor" strokeWidth="1.3" />
      <rect x="8.5" y="5" width="6" height="6" rx="3" stroke="currentColor" strokeWidth="1.3" />
      <line x1="7" y1="8" x2="9" y2="8" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function PartitionDeleteIcon({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2.5" width="12" height="3" rx="0.6" stroke="currentColor" strokeWidth="1.3" />
      <rect x="2" y="6.5" width="12" height="3" rx="0.6" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.35" />
      <rect x="2" y="10.5" width="12" height="3" rx="0.6" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.35" />
      <path d="M5 1.5l6 13M11 1.5l-6 13" stroke="var(--danger)" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function BatchAtomicIcon({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="5" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9" y="2" width="5" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.3" />
      <rect x="2" y="9" width="5" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.3" />
      <path d="M9 11.5h5" stroke="var(--accent)" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M11.5 9v5" stroke="var(--accent)" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function ScanBlockedIcon({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 16 16" fill="none">
      <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="m10 10 4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M3 3l7 7" stroke="var(--danger)" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function TombstoneIcon({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 16 16" fill="none">
      <path d="M4 14V7a4 4 0 0 1 8 0v7" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <line x1="2.5" y1="14" x2="13.5" y2="14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="6.5" y1="8.5" x2="9.5" y2="8.5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
    </svg>
  );
}

export function ScaleCostIcon({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 16 16" fill="none">
      <line x1="8" y1="2" x2="8" y2="12.5" stroke="currentColor" strokeWidth="1.3" />
      <line x1="3" y1="4.5" x2="13" y2="4.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3 4.5 1.3 8.5a2 2 0 0 0 3.4 0z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M13 4.5 11.3 8.5a2 2 0 0 0 3.4 0z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <line x1="5.5" y1="14" x2="10.5" y2="14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function StartupFlagIcon({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 16 16" fill="none">
      <line x1="3" y1="1.5" x2="3" y2="14.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M3 2.5h9l-2.5 3L12 8.5H3" stroke="var(--accent)" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

export function PlugIcon({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 16 16" fill="none">
      <path d="M6 6V2M10 6V2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M4.5 6h7v2.5a3.5 3.5 0 0 1-7 0Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <line x1="8" y1="11.5" x2="8" y2="14.5" stroke="var(--accent)" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
