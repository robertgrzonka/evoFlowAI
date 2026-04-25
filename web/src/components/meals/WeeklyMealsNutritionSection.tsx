'use client';

import { clsx } from 'clsx';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { Flame, Lightbulb, Sparkles, Target, TrendingUp } from 'lucide-react';
import { WEEKLY_MEALS_COACH_QUERY, WEEKLY_MEALS_NUTRITION_QUERY } from '@/lib/graphql/queries';
import { Skeleton } from '@/components/ui/loading';
import { AISectionHeader } from '@/components/evo';
import { useAppUiLocale } from '@/lib/i18n/use-app-ui-locale';
import { weeklySectionsCopy } from '@/lib/i18n/copy/weekly-sections';
import { mealTypeLabels } from '@/lib/i18n/copy/meals-page';
import type { UiLocale } from '@/lib/i18n/ui-locale';
import { formatDayWeekCardHeading } from '@/lib/i18n/format-day-label';
import { accentEdgeClasses, type AccentKind } from '@/components/ui/accent-cards';

type WeeklyWs = (typeof weeklySectionsCopy)['en'];

type DayRow = {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealCount: number;
  dayCalorieBudget?: number;
  workoutCaloriesBurned?: number;
  workoutSessions?: number;
  activityBonusKcal?: number;
  meals?: Array<{ name: string; mealType: string; calories: number }>;
};

export default function WeeklyMealsNutritionSection({ weekEndDate }: { weekEndDate: string }) {
  const locale = useAppUiLocale();
  const ws = weeklySectionsCopy[locale];
  const router = useRouter();
  const variables = useMemo(() => ({ endDate: weekEndDate }), [weekEndDate]);

  const { data: nutritionData, loading: nutritionLoading } = useQuery(WEEKLY_MEALS_NUTRITION_QUERY, {
    variables,
    fetchPolicy: 'cache-and-network',
  });

  const { data: coachData, loading: coachLoading } = useQuery(WEEKLY_MEALS_COACH_QUERY, {
    variables,
    fetchPolicy: 'cache-and-network',
  });

  const summary = nutritionData?.weeklyMealsNutrition;
  const coach = coachData?.weeklyMealsCoachInsight;
  const days: DayRow[] = summary?.days || [];
  const maxKcal = Math.max(...days.map((d) => d.calories), 1);
  const goals = summary?.goals;

  return (
    <section
      className={clsx(
        'rounded-2xl border border-border bg-surface overflow-hidden shadow-sm shadow-black/5',
        accentEdgeClasses('primary', 'left'),
      )}
    >
      <div className="relative px-4 py-5 md:px-6 md:py-6 border-b border-border/80 bg-gradient-to-br from-primary-500/10 via-transparent to-amber-400/5">
        <AISectionHeader eyebrow={ws.mealsEyebrow} title={ws.mealsTitle} subtitle={ws.mealsSubtitle} />
        {summary ? (
          <p className="text-xs text-text-muted mt-2">
            {ws.mealsWindow}{' '}
            <span className="text-text-secondary font-medium">{summary.weekStart}</span>
            {' → '}
            <span className="text-text-secondary font-medium">{summary.weekEnd}</span>
            {' · '}
            <span className="text-text-secondary">
              {summary.daysWithMeals}/7 {ws.mealsDaysWithMeals}
            </span>
            {summary.totalMealsLogged ? (
              <>
                {' · '}
                <span className="text-text-secondary">
                  {summary.totalMealsLogged} {ws.mealsEntries}
                </span>
              </>
            ) : null}
          </p>
        ) : null}
      </div>

      <div className="p-4 md:p-6 space-y-8">
        {nutritionLoading && !summary ? (
          <div className="overflow-x-auto -mx-1 px-1">
            <div className="grid min-w-[44rem] grid-cols-7 gap-2 sm:min-w-0">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          </div>
        ) : summary ? (
          <>
            <WeeklyDayStripWithHover key={weekEndDate} days={days} maxKcal={maxKcal} locale={locale} ws={ws} />

            {goals ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <MacroStatCard
                  label={ws.avgKcalDay}
                  value={Math.round(summary.averages.calories)}
                  hint={`${ws.targetApprox}${Math.round(goals.calories)}`}
                  icon={<Flame className="h-4 w-4 text-amber-400" />}
                  strip="primary"
                />
                <MacroStatCard
                  label={ws.avgProteinDay}
                  value={`${Math.round(summary.averages.protein)} g`}
                  hint={`${ws.goalG} ${Math.round(goals.protein)} g`}
                  icon={<Target className="h-4 w-4 text-cyan-400" />}
                  strip="info"
                />
                <MacroStatCard
                  label={ws.avgCarbsDay}
                  value={`${Math.round(summary.averages.carbs)} g`}
                  hint={`${ws.goalG} ${Math.round(goals.carbs)} g`}
                  icon={<TrendingUp className="h-4 w-4 text-violet-400" />}
                  strip="success"
                />
                <MacroStatCard
                  label={ws.avgFatDay}
                  value={`${Math.round(summary.averages.fat)} g`}
                  hint={`${ws.goalG} ${Math.round(goals.fat)} g`}
                  icon={<Sparkles className="h-4 w-4 text-rose-300" />}
                  strip="primary"
                />
              </div>
            ) : null}
          </>
        ) : null}

        <div
          className={clsx(
            'rounded-xl border border-border/90 bg-gradient-to-br from-surface-elevated to-background/40 p-4 md:p-5 space-y-4 shadow-sm shadow-black/5',
            accentEdgeClasses('success', 'left'),
          )}
        >
          {coachLoading && !coach ? (
            <div className="space-y-3">
              <Skeleton className="h-7 w-2/3 max-w-md rounded-md" />
              <Skeleton className="h-20 w-full rounded-lg" />
              <div className="grid md:grid-cols-2 gap-3">
                <Skeleton className="h-32 rounded-lg" />
                <Skeleton className="h-32 rounded-lg" />
              </div>
            </div>
          ) : coach ? (
            <>
              <div className="flex flex-wrap items-start gap-3">
                <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 border border-primary-500/25">
                  <Lightbulb className="h-5 w-5 text-primary-300 stroke-[1.75]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary-200/90 mb-1">{ws.evoCoachNote}</p>
                  <h3 className="text-lg md:text-xl font-semibold text-text-primary leading-snug">{coach.headline}</h3>
                  <p className="text-sm text-text-secondary mt-2 leading-relaxed">{coach.summary}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div
                  className={clsx(
                    'rounded-lg border border-border bg-background/30 p-4 shadow-sm shadow-black/5',
                    accentEdgeClasses('primary', 'left'),
                  )}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-200/90 mb-3 flex items-center gap-2">
                    <Target className="h-3.5 w-3.5" />
                    {ws.whatToWatch}
                  </p>
                  <ul className="space-y-2.5">
                    {coach.focusAreas.map((line: string, i: number) => (
                      <li key={i} className="text-sm text-text-secondary leading-snug flex gap-2.5">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/80" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div
                  className={clsx(
                    'rounded-lg border border-border bg-background/30 p-4 shadow-sm shadow-black/5',
                    accentEdgeClasses('info', 'left'),
                  )}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-cyan-200/90 mb-3 flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {ws.levelUpNextWeek}
                  </p>
                  <ul className="space-y-2.5">
                    {coach.improvements.map((line: string, i: number) => (
                      <li key={i} className="text-sm text-text-secondary leading-snug flex gap-2.5">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400/80" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="border-t border-border/60 pt-4 space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-200/90">{ws.coachProTipEyebrow}</p>
                <p className="text-sm text-text-primary/95 leading-relaxed whitespace-pre-line">{coach.closingLine}</p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button type="button" className="btn-info text-sm" onClick={() => router.push('/chat?channel=COACH')}>
                  {ws.discussWeekInChat}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function WeeklyDayStripWithHover({
  days,
  maxKcal,
  locale,
  ws,
}: {
  days: DayRow[];
  maxKcal: number;
  locale: UiLocale;
  ws: WeeklyWs;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLElement | null>(null);
  const [openDay, setOpenDay] = useState<DayRow | null>(null);
  const [panelPos, setPanelPos] = useState<{
    top: number;
    left: number;
    transform: string;
    maxW: number;
  } | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const layoutPanel = useCallback(() => {
    const el = anchorRef.current;
    if (!el || !openDay) {
      setPanelPos(null);
      return;
    }
    const r = el.getBoundingClientRect();
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    const vw = vv?.width ?? window.innerWidth;
    const vh = vv?.height ?? window.innerHeight;
    const pad = 10;
    const maxW = Math.min(352, vw - pad * 2);
    const gap = 8;
    const centerX = r.left + r.width / 2;
    const half = Math.min(maxW / 2, 160);
    const clampedX = Math.max(pad + half, Math.min(vw - pad - half, centerX));
    const spaceBelow = vh - r.bottom - gap;
    const spaceAbove = r.top - gap;
    const showBelow = spaceBelow >= 96 || spaceBelow >= spaceAbove;

    if (showBelow) {
      setPanelPos({
        top: r.bottom + gap,
        left: clampedX,
        transform: 'translateX(-50%)',
        maxW,
      });
    } else {
      setPanelPos({
        top: r.top - gap,
        left: clampedX,
        transform: 'translate(-50%, -100%)',
        maxW,
      });
    }
  }, [openDay]);

  useLayoutEffect(() => {
    if (!openDay) return;
    layoutPanel();
    window.addEventListener('scroll', layoutPanel, true);
    window.addEventListener('resize', layoutPanel);
    return () => {
      window.removeEventListener('scroll', layoutPanel, true);
      window.removeEventListener('resize', layoutPanel);
    };
  }, [openDay, layoutPanel]);

  const clearIfLeaveStrip = useCallback((e: React.PointerEvent) => {
    const next = e.relatedTarget as Node | null;
    if (rowRef.current?.contains(next)) return;
    anchorRef.current = null;
    setOpenDay(null);
    setPanelPos(null);
  }, []);

  const portal =
    mounted &&
    openDay &&
    panelPos &&
    createPortal(
      <div
        role="tooltip"
        style={{
          position: 'fixed',
          top: panelPos.top,
          left: panelPos.left,
          transform: panelPos.transform,
          zIndex: 500,
          maxWidth: panelPos.maxW,
          pointerEvents: 'none',
        }}
        className="min-w-0 rounded-md border border-border-light bg-surface-elevated px-2.5 py-1.5 text-[11px] text-text-primary shadow-xl whitespace-normal text-left leading-snug"
      >
        <DayMealsTooltipBody
          day={openDay}
          locale={locale}
          heading={ws.mealsDayTooltipHeading}
          empty={ws.mealsDayTooltipEmpty}
        />
      </div>,
      document.body
    );

  return (
    <>
      <div
        ref={rowRef}
        className="overflow-x-auto -mx-1 px-1 pb-0.5 scroll-smooth"
        onPointerLeave={clearIfLeaveStrip}
      >
        <div className="grid min-w-[44rem] grid-cols-7 gap-2 sm:min-w-0">
          {days.map((day) => {
            const widthPct = day.mealCount === 0 ? 0 : Math.max(10, (day.calories / maxKcal) * 100);
            const muted = day.mealCount === 0;
            return (
              <div
                key={day.date}
                className={`relative flex w-full min-w-0 flex-col rounded-xl border px-2 pt-2.5 pb-2 min-h-[8rem] ${
                  muted ? 'border-border/60 bg-surface-elevated/40' : 'border-border bg-surface-elevated'
                }`}
                onPointerEnter={(e) => {
                  anchorRef.current = e.currentTarget as HTMLElement;
                  setOpenDay(day);
                }}
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <p className="min-w-0 text-[11px] font-medium leading-tight text-text-secondary truncate">
                    {formatDayWeekCardHeading(day.date, locale)}
                  </p>
                  {day.mealCount > 0 ? (
                    <span className="text-[10px] tabular-nums rounded-md bg-primary-500/15 text-primary-200 px-1 py-0.5 shrink-0">
                      {day.mealCount}×
                    </span>
                  ) : (
                    <span className="text-[10px] text-text-muted shrink-0">—</span>
                  )}
                </div>
                <p className={`text-base font-semibold tabular-nums leading-none ${muted ? 'text-text-muted' : 'text-text-primary'}`}>
                  {Math.round(day.calories)}
                  <span className="text-[10px] font-normal text-text-muted ml-0.5">kcal</span>
                </p>
                <div className="mt-1.5 space-y-0.5 text-[10px] leading-snug tabular-nums text-text-secondary">
                  <p>
                    P <span className="text-text-primary/90">{Math.round(day.protein)}</span>
                  </p>
                  <p>
                    C <span className="text-text-primary/90">{Math.round(day.carbs)}</span> · F{' '}
                    <span className="text-text-primary/90">{Math.round(day.fat)}</span>
                  </p>
                </div>
                <div className="mt-auto pt-2">
                  <div className="h-1.5 rounded-full bg-background/80 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 ${
                        muted ? 'bg-border' : 'bg-gradient-to-r from-primary-400 to-cyan-400'
                      }`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {portal}
    </>
  );
}

function DayMealsTooltipBody({
  day,
  locale,
  heading,
  empty,
}: {
  day: DayRow;
  locale: UiLocale;
  heading: string;
  empty: string;
}) {
  const labels = mealTypeLabels[locale];
  const list = day.meals ?? [];

  return (
    <div className="min-w-0 space-y-2">
      <p className="text-[10px] font-semibold text-text-primary border-b border-border/50 pb-1">
        {formatDayWeekCardHeading(day.date, locale)}
      </p>
      <p className="text-[9px] font-medium uppercase tracking-wide text-text-muted">{heading}</p>
      {list.length === 0 ? (
        <p className="text-[11px] text-text-secondary leading-snug">{empty}</p>
      ) : (
        <ul className="m-0 list-none space-y-1.5 p-0">
          {list.map((m, i) => (
            <li key={`${day.date}-${i}`} className="text-[11px] leading-snug break-words">
              <span className="font-medium text-text-primary">{m.name?.trim() || '—'}</span>
              <span className="text-text-muted"> · {labels[m.mealType] ?? m.mealType}</span>
              <span className="tabular-nums text-text-secondary"> · {Math.round(m.calories)} kcal</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MacroStatCard({
  label,
  value,
  hint,
  icon,
  strip,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: ReactNode;
  strip?: AccentKind;
}) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-border bg-surface-elevated/80 px-3.5 py-3 flex gap-3 shadow-sm shadow-black/5',
        strip ? accentEdgeClasses(strip, 'left') : null,
      )}
    >
      <div className="mt-0.5 text-text-muted">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-text-muted">{label}</p>
        <p className="text-lg font-semibold text-text-primary tabular-nums">{value}</p>
        <p className="text-[11px] text-text-muted mt-0.5">{hint}</p>
      </div>
    </div>
  );
}
