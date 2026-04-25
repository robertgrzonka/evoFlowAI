'use client';

import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { ChevronDown, Info } from 'lucide-react';
import AICoachAvatar from '@/components/AICoachAvatar';
import { AISectionHeader, EvoStatusBadge } from '@/components/evo';
import type { DashboardStrings } from '@/lib/i18n/copy/dashboard';

export type DailyBriefHeroProps = {
  ui: DashboardStrings;
  eyebrow: string;
  title: string;
  subtitle: string;
  progressLabel: string;
  progressTone: 'success' | 'warning' | 'focus';
  loading: boolean;
  headline: string;
  supportLine?: string;
  fullSummary?: string;
  briefExpanded: boolean;
  onToggleBrief: () => void;
  showBriefToggle: boolean;
  onOpenReasoning?: () => void;
  showReasoningButton: boolean;
  reasoningTriggerLabel?: string;
  /** Full-width goal / primary context chip (kept out of the stats grid so layout doesn’t break). */
  metricGoalSlot?: ReactNode;
  /** Compact stat pills in a dedicated grid (e.g. meals, activity, macros, steps). */
  metricStatsSlot?: ReactNode;
  nextActionSlot: ReactNode;
  insightCardsSlot: ReactNode;
  alertSlot?: ReactNode;
  emptySlot?: ReactNode;
};

export default function DailyBriefHero({
  ui,
  eyebrow,
  title,
  subtitle,
  progressLabel,
  progressTone,
  loading,
  headline,
  supportLine,
  fullSummary,
  briefExpanded,
  onToggleBrief,
  showBriefToggle,
  onOpenReasoning,
  showReasoningButton,
  reasoningTriggerLabel,
  metricGoalSlot,
  metricStatsSlot,
  nextActionSlot,
  insightCardsSlot,
  alertSlot,
  emptySlot,
}: DailyBriefHeroProps) {
  const reasoningLabel = reasoningTriggerLabel ?? ui.reasoningTitle;

  return (
    <section
      className={clsx(
        'rounded-2xl bg-gradient-to-br from-primary-500/[0.07] via-surface to-surface',
        'ring-1 ring-primary-500/15 shadow-md shadow-black/15',
        'p-2.5 md:p-3.5'
      )}
    >
      <AISectionHeader
        compact
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        status={<EvoStatusBadge label={progressLabel} tone={progressTone} />}
        rightAction={<AICoachAvatar size="sm" />}
      />

      {loading ? (
        <div className="mt-1.5 space-y-1.5 animate-pulse">
          <div className="h-9 rounded-lg bg-surface-elevated/70 max-w-xl" />
          <div className="h-7 rounded-md bg-surface-elevated/50 max-w-md" />
        </div>
      ) : emptySlot ? (
        <div className="mt-1.5">{emptySlot}</div>
      ) : (
        <div className="mt-1.5 space-y-2">
          {alertSlot}

          <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-4">
            <div className="min-w-0 flex-1 flex flex-col gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-200/80 mb-0.5">
                  {ui.mainInsight}
                </p>
                <p
                  className={clsx(
                    'text-sm md:text-[15px] text-text-primary leading-snug font-semibold',
                    !briefExpanded && 'line-clamp-2'
                  )}
                >
                  {headline}
                </p>
                {supportLine && !briefExpanded ? (
                  <p className="text-xs text-text-secondary mt-1 leading-snug line-clamp-2">{supportLine}</p>
                ) : null}

                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  {showBriefToggle ? (
                    <button
                      type="button"
                      onClick={onToggleBrief}
                      className="inline-flex items-center gap-0.5 text-[11px] font-medium text-info-400/95 hover:text-info-300"
                    >
                      <ChevronDown className={clsx('h-3 w-3 transition-transform', briefExpanded && 'rotate-180')} />
                      {briefExpanded ? ui.briefShowLess : ui.briefShowMore}
                    </button>
                  ) : null}
                  {showReasoningButton && onOpenReasoning ? (
                    <button
                      type="button"
                      onClick={onOpenReasoning}
                      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-text-muted hover:text-text-secondary hover:bg-surface-elevated/60 transition-colors"
                    >
                      <Info className="h-3 w-3 opacity-80" aria-hidden />
                      {reasoningLabel}
                    </button>
                  ) : null}
                </div>

                {briefExpanded && fullSummary ? (
                  <p className="mt-2 text-xs text-text-secondary leading-relaxed whitespace-pre-wrap border-l border-border/40 pl-2.5">
                    {fullSummary}
                  </p>
                ) : null}
              </div>

              {metricGoalSlot || metricStatsSlot ? (
                <div className="w-full space-y-2 rounded-xl bg-background/35 p-2 ring-1 ring-white/[0.06]">
                  {metricGoalSlot ? <div className="w-full min-w-0">{metricGoalSlot}</div> : null}
                  {metricStatsSlot ? (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">{metricStatsSlot}</div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {nextActionSlot ? (
              <aside className="flex min-h-0 w-full flex-col lg:w-[min(100%,16.75rem)] lg:shrink-0">
                {nextActionSlot}
              </aside>
            ) : null}
          </div>

          {insightCardsSlot ? (
            <div className="grid grid-cols-1 gap-1.5 border-t border-border/25 pt-2 sm:grid-cols-2 lg:grid-cols-3">
              {insightCardsSlot}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
