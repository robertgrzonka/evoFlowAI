'use client';

type HeroInsightCardProps = {
  title: string;
  insight: string;
  supportLine?: string;
  children?: React.ReactNode;
  cta?: React.ReactNode;
  /**
   * `split`: on large viewports, places CTA beside the insight so wide screens
   * use horizontal space and the next step stays visible.
   */
  layout?: 'stack' | 'split';
};

export default function HeroInsightCard({
  title,
  insight,
  supportLine,
  children,
  cta,
  layout = 'stack',
}: HeroInsightCardProps) {
  const shell =
    'rounded-xl border border-primary-500/25 bg-gradient-to-br from-primary-500/12 to-surface p-4 md:p-5';

  const headline = (
    <>
      <p className="text-[11px] uppercase tracking-[0.14em] text-primary-300 mb-2">{title}</p>
      <p className="text-base md:text-lg text-text-primary leading-relaxed">{insight}</p>
      {supportLine ? <p className="text-sm text-text-secondary mt-2">{supportLine}</p> : null}
    </>
  );

  if (layout === 'split') {
    return (
      <section className={shell}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch lg:gap-8">
          <div className="min-w-0 flex-1">
            {headline}
            {children ? <div className="mt-3">{children}</div> : null}
          </div>
          {cta ? (
            <div className="flex min-h-0 w-full shrink-0 flex-col lg:w-[min(100%,24rem)] lg:border-l lg:border-border/70 lg:pl-8">
              <div className="flex min-h-0 flex-1 flex-col self-stretch">{cta}</div>
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className={shell}>
      {headline}
      {children ? <div className="mt-3">{children}</div> : null}
      {cta ? <div className="mt-4">{cta}</div> : null}
    </section>
  );
}
