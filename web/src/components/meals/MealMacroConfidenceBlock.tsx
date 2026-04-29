'use client';

import { clsx } from 'clsx';
import { HelpCircle } from 'lucide-react';
import {
  getMealConfidencePresentation,
  isEvoAiLoggedMeal,
  type MealConfidenceBand,
} from '@/lib/meal-confidence';
import type { UiLocale } from '@/lib/i18n/ui-locale';
import Tooltip from '@/components/ui/atoms/Tooltip';

type Copy = {
  detailsMore: string;
  estimateChipUnknown: string;
  confidenceTooltipExplain: string;
  confidenceTooltipUnavailable: string;
};

const bandClass: Record<MealConfidenceBand, string> = {
  high: 'bg-success-500/15 text-success-200 border-success-500/30',
  medium: 'bg-amber-500/10 text-amber-200 border-amber-500/25',
  low: 'bg-orange-500/10 text-orange-200 border-orange-500/30',
  review: 'bg-rose-500/10 text-rose-200 border-rose-500/35',
};

const unknownBandClass =
  'bg-surface-elevated/50 text-text-secondary border-border/50';

type MealMacroConfidenceBlockProps = {
  imageUrl: string | null | undefined;
  confidence: number | null | undefined;
  locale: UiLocale;
  copy: Copy;
  className?: string;
};

/**
 * Chip + optional details for Evo-logged meals. Hidden when the item is not from the Evo log pipeline.
 */
export function MealMacroConfidenceBlock({
  imageUrl,
  confidence,
  locale,
  copy,
  className,
}: MealMacroConfidenceBlockProps) {
  if (!isEvoAiLoggedMeal(imageUrl)) return null;
  const pres = getMealConfidencePresentation(locale, confidence);

  const pctDisplay =
    confidence != null && Number.isFinite(confidence)
      ? new Intl.NumberFormat(locale === 'pl' ? 'pl-PL' : 'en-US', {
          style: 'percent',
          maximumFractionDigits: 1,
          minimumFractionDigits: 0,
        }).format(Math.max(0, Math.min(1, confidence)))
      : null;

  const helpTooltipContent = (
    <span className="block max-w-[min(100vw-2rem,20rem)] text-left [overflow-wrap:anywhere]">
      {pctDisplay ? (
        <>
          <span className="block text-base font-semibold tabular-nums tracking-tight text-primary-100">
            {pctDisplay}
          </span>
          <span className="mt-1.5 block text-xs leading-relaxed text-text-secondary">
            {copy.confidenceTooltipExplain}
          </span>
        </>
      ) : (
        <span className="block text-sm leading-relaxed text-text-secondary">{copy.confidenceTooltipUnavailable}</span>
      )}
    </span>
  );

  return (
    <div className={clsx('inline-flex max-w-full flex-wrap items-center gap-1.5', className)}>
      <span
        className={clsx(
          'inline-flex max-w-full min-w-0 items-center rounded-md border px-2 py-0.5 text-[11px] font-medium leading-tight',
          pres ? bandClass[pres.band] : unknownBandClass
        )}
      >
        {pres ? pres.label : copy.estimateChipUnknown}
      </span>
      <Tooltip
        content={helpTooltipContent}
        side="top"
        className="z-[300] border-border-light text-text-primary"
      >
        <button
          type="button"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border/60 bg-surface-elevated/50 text-text-muted hover:border-border-light hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40"
          aria-label={copy.detailsMore}
        >
          <HelpCircle className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
        </button>
      </Tooltip>
    </div>
  );
}
