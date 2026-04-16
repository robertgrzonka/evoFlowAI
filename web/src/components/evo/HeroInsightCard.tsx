'use client';

type HeroInsightCardProps = {
  title: string;
  insight: string;
  supportLine?: string;
  children?: React.ReactNode;
  cta?: React.ReactNode;
};

export default function HeroInsightCard({
  title,
  insight,
  supportLine,
  children,
  cta,
}: HeroInsightCardProps) {
  return (
    <section className="rounded-xl border border-primary-500/25 bg-gradient-to-br from-primary-500/12 to-surface p-4 md:p-5">
      <p className="text-[11px] uppercase tracking-[0.14em] text-primary-300 mb-2">{title}</p>
      <p className="text-base md:text-lg text-text-primary leading-relaxed">{insight}</p>
      {supportLine ? <p className="text-sm text-text-secondary mt-2">{supportLine}</p> : null}
      {children ? <div className="mt-3">{children}</div> : null}
      {cta ? <div className="mt-4">{cta}</div> : null}
    </section>
  );
}
