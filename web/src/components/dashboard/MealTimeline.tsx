'use client';

import { Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import type { DashboardStrings } from '@/lib/i18n/copy/dashboard';

export type MealTimelineItem = {
  id: string;
  name: string;
  mealType: string;
  createdAt?: string | null;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
};

type MealTimelineProps = {
  ui: DashboardStrings;
  meals: MealTimelineItem[];
  locale: string;
  onDelete: (id: string) => void;
  deleteBusy?: boolean;
  suggestedHint?: string;
  suggestedDetail?: string;
  onSuggestedLog?: () => void;
  suggestedCtaLabel?: string;
};

function formatMealTime(iso: string | null | undefined, locale: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(locale === 'pl' ? 'pl-PL' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export default function MealTimeline({
  ui,
  meals,
  locale,
  onDelete,
  deleteBusy,
  suggestedHint,
  suggestedDetail,
  onSuggestedLog,
  suggestedCtaLabel,
}: MealTimelineProps) {
  const sorted = [...meals].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return ta - tb;
  });

  const showSuggestion = Boolean(suggestedHint?.trim());

  return (
    <div className="relative pl-2.5">
      <div className="absolute left-[5px] top-1.5 bottom-1.5 w-px bg-gradient-to-b from-border via-border/60 to-transparent" aria-hidden />
      <ul className="space-y-0">
        {sorted.map((meal) => {
          const time = formatMealTime(meal.createdAt, locale);
          return (
            <li key={meal.id} className="relative flex gap-2.5 pb-4 last:pb-0">
              <div className="relative z-[1] mt-2 h-2 w-2 shrink-0 rounded-full bg-primary-400/90 ring-2 ring-surface" />
              <div
                className={clsx(
                  'relative min-w-0 flex-1 rounded-lg py-2 px-2.5 pr-10',
                  'bg-surface-elevated/35 ring-1 ring-white/[0.05]'
                )}
              >
                <button
                  type="button"
                  onClick={() => onDelete(meal.id)}
                  disabled={deleteBusy}
                  className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title={ui.deleteMeal}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  {time ? (
                    <span className="text-[11px] font-semibold font-mono text-primary-200/90 tabular-nums">{time}</span>
                  ) : null}
                  <span className="inline-flex rounded-md bg-background/55 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider text-text-muted">
                    {meal.mealType.toLowerCase()}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-text-primary leading-snug mt-0.5 pr-1">{meal.name}</h4>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  <span className="rounded-md bg-background/50 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-primary-300">
                    {meal.nutrition.calories.toFixed(0)} kcal
                  </span>
                  <span className="rounded-md bg-background/40 px-1.5 py-0.5 text-[10px] tabular-nums text-text-muted">
                    P{meal.nutrition.protein.toFixed(0)}
                  </span>
                  <span className="rounded-md bg-background/40 px-1.5 py-0.5 text-[10px] tabular-nums text-text-muted">
                    C{meal.nutrition.carbs.toFixed(0)}
                  </span>
                  <span className="rounded-md bg-background/40 px-1.5 py-0.5 text-[10px] tabular-nums text-text-muted">
                    F{meal.nutrition.fat.toFixed(0)}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {showSuggestion ? (
        <div className="mt-3 rounded-xl bg-primary-500/[0.06] ring-1 ring-primary-500/20 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-200/90">{ui.suggestedNextMeal}</p>
          <p className="text-xs text-text-primary mt-1 font-medium leading-snug">{suggestedHint}</p>
          {suggestedDetail ? (
            <p className="text-[11px] text-text-secondary mt-1 leading-snug line-clamp-3">{suggestedDetail}</p>
          ) : null}
          {onSuggestedLog && suggestedCtaLabel ? (
            <button
              type="button"
              onClick={onSuggestedLog}
              className="mt-2.5 inline-flex h-10 min-h-[40px] max-w-full shrink-0 items-center justify-center self-start rounded-lg border border-primary-400/35 bg-primary-500/[0.14] px-4 text-xs font-semibold text-primary-100 shadow-none transition-colors hover:bg-primary-500/[0.22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40"
            >
              {suggestedCtaLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
