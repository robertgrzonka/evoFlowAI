'use client';

import { useMemo, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { Dumbbell, Flame, Lightbulb, Target, Timer, TrendingUp } from 'lucide-react';
import { WEEKLY_WORKOUTS_COACH_QUERY, WEEKLY_WORKOUTS_TRAINING_QUERY } from '@/lib/graphql/queries';
import { Skeleton } from '@/components/ui/loading';
import { AISectionHeader } from '@/components/evo';
import { useAppUiLocale } from '@/lib/i18n/use-app-ui-locale';
import { weeklySectionsCopy } from '@/lib/i18n/copy/weekly-sections';
import { formatDayWeekCardHeading } from '@/lib/i18n/format-day-label';

type DayRow = {
  date: string;
  sessionCount: number;
  totalMinutes: number;
  caloriesBurned: number;
  lowMinutes: number;
  mediumMinutes: number;
  highMinutes: number;
};

export default function WeeklyWorkoutsTrainingSection({ weekEndDate }: { weekEndDate: string }) {
  const locale = useAppUiLocale();
  const ws = weeklySectionsCopy[locale];
  const router = useRouter();
  const variables = useMemo(() => ({ endDate: weekEndDate }), [weekEndDate]);

  const { data: trainingData, loading: trainingLoading } = useQuery(WEEKLY_WORKOUTS_TRAINING_QUERY, {
    variables,
    fetchPolicy: 'cache-and-network',
  });

  const { data: coachData, loading: coachLoading } = useQuery(WEEKLY_WORKOUTS_COACH_QUERY, {
    variables,
    fetchPolicy: 'cache-and-network',
  });

  const summary = trainingData?.weeklyWorkoutsTraining;
  const coach = coachData?.weeklyWorkoutsCoachInsight;
  const days: DayRow[] = summary?.days || [];
  const maxMinutes = Math.max(...days.map((d) => d.totalMinutes), 1);
  const goals = summary?.goals;

  const highPctOfWeek = useMemo(() => {
    const t = summary?.totals.minutes || 0;
    if (t <= 0) return 0;
    const highSum = days.reduce((acc, d) => acc + d.highMinutes, 0);
    return Math.round((highSum / t) * 100);
  }, [days, summary?.totals.minutes]);

  const targetMinutesPerDay = goals ? Math.round(goals.weeklyActiveMinutesTarget / 7) : 0;
  const targetSessionsPerDay = goals ? goals.weeklySessionsTarget / 7 : 0;

  return (
    <section className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="relative px-4 py-5 md:px-6 md:py-6 border-b border-border/80 bg-gradient-to-br from-amber-400/10 via-transparent to-cyan-500/5">
        <AISectionHeader eyebrow={ws.workoutsEyebrow} title={ws.workoutsTitle} subtitle={ws.workoutsSubtitle} />
        {summary ? (
          <p className="text-xs text-text-muted mt-2">
            {ws.mealsWindow}{' '}
            <span className="text-text-secondary font-medium">{summary.weekStart}</span>
            {' → '}
            <span className="text-text-secondary font-medium">{summary.weekEnd}</span>
            {' · '}
            <span className="text-text-secondary">
              {summary.daysWithWorkouts}/7 {ws.workoutsDaysWithTraining}
            </span>
            {summary.totalSessions ? (
              <>
                {' · '}
                <span className="text-text-secondary">
                  {summary.totalSessions} {ws.workoutsSessions}
                </span>
              </>
            ) : null}
          </p>
        ) : null}
      </div>

      <div className="p-4 md:p-6 space-y-8">
        {trainingLoading && !summary ? (
          <div className="overflow-x-auto -mx-1 px-1">
            <div className="grid min-w-[44rem] grid-cols-7 gap-2 sm:min-w-0">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          </div>
        ) : summary ? (
          <>
            <div className="overflow-x-auto -mx-1 px-1 pb-0.5 scroll-smooth">
              <div className="grid min-w-[44rem] grid-cols-7 gap-2 sm:min-w-0">
                {days.map((day) => {
                  const widthPct = day.sessionCount === 0 ? 0 : Math.max(10, (day.totalMinutes / maxMinutes) * 100);
                  const muted = day.sessionCount === 0;
                  const t = day.totalMinutes;
                  const pct = (v: number) => (t > 0 ? (v / t) * 100 : 0);
                  return (
                    <div
                      key={day.date}
                      title={day.date}
                      className={`relative flex min-w-0 flex-col rounded-xl border px-2 pt-2.5 pb-2 min-h-[8.5rem] ${
                        muted ? 'border-border/60 bg-surface-elevated/40' : 'border-border bg-surface-elevated'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <p className="min-w-0 text-[11px] font-medium leading-tight text-text-secondary truncate">
                          {formatDayWeekCardHeading(day.date, locale)}
                        </p>
                        {day.sessionCount > 0 ? (
                          <span className="text-[10px] tabular-nums rounded-md bg-amber-500/20 text-amber-200 px-1 py-0.5 shrink-0">
                            {day.sessionCount}×
                          </span>
                        ) : (
                          <span className="text-[10px] text-text-muted shrink-0">—</span>
                        )}
                      </div>
                      <p className={`text-base font-semibold tabular-nums leading-none ${muted ? 'text-text-muted' : 'text-text-primary'}`}>
                        {Math.round(day.totalMinutes)}
                        <span className="text-[10px] font-normal text-text-muted ml-0.5">min</span>
                      </p>
                      <p className="text-[10px] text-text-secondary mt-1 tabular-nums">
                        {Math.round(day.caloriesBurned)} kcal
                      </p>
                      <div className="mt-1.5 grid grid-cols-3 gap-x-0.5 gap-y-0.5 text-[10px] leading-tight tabular-nums text-text-secondary">
                        <span className="text-violet-300/90">L {Math.round(day.lowMinutes)}</span>
                        <span className="text-cyan-300/90 text-center">M {Math.round(day.mediumMinutes)}</span>
                        <span className="text-amber-200/90 text-right">H {Math.round(day.highMinutes)}</span>
                      </div>
                      <div className="mt-auto pt-2 space-y-1">
                        <div className="flex h-1.5 rounded-full overflow-hidden w-full bg-background/80">
                          {!muted ? (
                            <>
                              <div className="h-full bg-violet-500/90 transition-all duration-500" style={{ width: `${pct(day.lowMinutes)}%` }} />
                              <div className="h-full bg-cyan-400/90 transition-all duration-500" style={{ width: `${pct(day.mediumMinutes)}%` }} />
                              <div className="h-full bg-amber-400/90 transition-all duration-500" style={{ width: `${pct(day.highMinutes)}%` }} />
                            </>
                          ) : (
                            <div className="h-full w-full bg-border/60" />
                          )}
                        </div>
                        <div className="h-1 rounded-full bg-background/80 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-[width] duration-500 ${
                              muted ? 'bg-border' : 'bg-gradient-to-r from-amber-400 to-orange-400'
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

            {goals ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <MacroStatCard
                  label={ws.avgMinutesDay}
                  value={Math.round(summary.averages.minutes)}
                  hint={`~${targetMinutesPerDay} ${ws.avgMinutesHint}`}
                  icon={<Timer className="h-4 w-4 text-cyan-400" />}
                />
                <MacroStatCard
                  label={ws.avgSessionsDay}
                  value={summary.averages.sessions.toFixed(2)}
                  hint={ws.sessionsGoalHint(goals.weeklySessionsTarget, targetSessionsPerDay.toFixed(1))}
                  icon={<Dumbbell className="h-4 w-4 text-amber-400" />}
                />
                <MacroStatCard
                  label={ws.avgKcalBurnedDay}
                  value={Math.round(summary.averages.caloriesBurned)}
                  hint={ws.fromLoggedSessions}
                  icon={<Flame className="h-4 w-4 text-orange-400" />}
                />
                <MacroStatCard
                  label={ws.highIntensityShare}
                  value={`${highPctOfWeek}%`}
                  hint={ws.ofWeeklyTrainingMinutes}
                  icon={<TrendingUp className="h-4 w-4 text-rose-300" />}
                />
              </div>
            ) : null}
          </>
        ) : null}

        <div className="rounded-xl border border-border/90 bg-gradient-to-br from-surface-elevated to-background/40 p-4 md:p-5 space-y-4">
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
                <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/25">
                  <Lightbulb className="h-5 w-5 text-amber-300 stroke-[1.75]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-amber-200/90 mb-1">{ws.evoCoachNote}</p>
                  <h3 className="text-lg md:text-xl font-semibold text-text-primary leading-snug">{coach.headline}</h3>
                  <p className="text-sm text-text-secondary mt-2 leading-relaxed">{coach.summary}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-border bg-background/30 p-4">
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
                <div className="rounded-lg border border-border bg-background/30 p-4">
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
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200/90">{ws.coachProTipEyebrow}</p>
                <p className="text-sm text-text-primary/95 leading-relaxed whitespace-pre-line">{coach.closingLine}</p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button type="button" className="btn-secondary text-sm" onClick={() => router.push('/chat?channel=COACH')}>
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

function MacroStatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-elevated/80 px-3.5 py-3 flex gap-3">
      <div className="mt-0.5 text-text-muted">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-text-muted">{label}</p>
        <p className="text-lg font-semibold text-text-primary tabular-nums">{value}</p>
        <p className="text-[11px] text-text-muted mt-0.5">{hint}</p>
      </div>
    </div>
  );
}
