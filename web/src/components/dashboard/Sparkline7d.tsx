'use client';

type Sparkline7dProps = {
  values: number[];
  className?: string;
  strokeClassName?: string;
  ariaLabel: string;
  /** Taller chart for dashboard weekly row (default sm). */
  variant?: 'sm' | 'md';
};

/** Normalized mini line chart for up to 7 numeric points. */
export default function Sparkline7d({
  values,
  className,
  strokeClassName,
  ariaLabel,
  variant = 'sm',
}: Sparkline7dProps) {
  const w = variant === 'md' ? 168 : 120;
  const h = variant === 'md' ? 76 : 36;
  const pad = variant === 'md' ? 3 : 2;
  const strokeW = variant === 'md' ? 2.25 : 2;
  const nums = values.map((v) => (Number.isFinite(v) ? v : 0));
  if (nums.length === 0) {
    return (
      <div className={className} style={{ width: '100%', maxWidth: w, height: h }} aria-label={ariaLabel}>
        <span className="sr-only">{ariaLabel}</span>
      </div>
    );
  }
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min || 1;
  const step = nums.length > 1 ? (w - pad * 2) / (nums.length - 1) : 0;
  const pts = nums.map((v, i) => {
    const x = pad + i * step;
    const y = pad + (1 - (v - min) / span) * (h - pad * 2);
    return `${x},${y}`;
  });
  const d = `M ${pts.join(' L ')}`;

  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
      role="img"
      aria-label={ariaLabel}
    >
      <title>{ariaLabel}</title>
      <path
        d={d}
        fill="none"
        strokeWidth={strokeW}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={strokeClassName || 'stroke-primary-400/80'}
      />
    </svg>
  );
}
