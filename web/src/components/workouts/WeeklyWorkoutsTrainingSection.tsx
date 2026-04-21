'use client';

import { useMemo, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { Dumbbell, Flame, Lightbulb, Target, Timer, TrendingUp } from 'lucide-react';
import { WEEKLY_WORKOUTS_COACH_QUERY, WEEKLY_WORKOUTS_TRAINING_QUERY } from '@/lib/graphql/queries';
import { Skeleton } from '@/components/ui/loading';
import { AISectionHeader } from '@/components/evo';

type DayRow = {
  date: string;
  sessionCount: number;
  totalMinutes: number;
  caloriesBurned: number;
  lowMinutes: number;
  mediumMinutes: number;
  highMinutes: number;
};

function formatDayLabel(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00.000Z`);
  return new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' }).format(d);
}

export default function WeeklyWorkoutsTrainingSection({ weekEndDate }: { weekEndDate: string }) {
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
        <AISectionHeader
          eyebrow="7-day lens"
          title="Weekly workout snapshot"
          subtitle="Minutes, sessions, and intensity mix per day — plus Evo’s training read for next week."
        />
        {summary ? (
          <p className="text-xs text-text-muted mt-2">
            Window <span className="text-text-secondary font-medium">{summary.weekStart}</span>
            {' → '}
            <span className="text-text-secondary font-medium">{summary.weekEnd}</span>
            {' · '}
            <span className="text-text-secondary">{summary.daysWithWorkouts}/7 days with training</span>
            {summary.totalSessions ? (
              <>
                {' · '}
                <span className="text-text-secondary">{summary.totalSessions} sessions</span>
              </>
            ) : null}
          </p>
        ) : null}
      </div>

      <div className="p-4 md:p-6 space-y-8">
        {trainingLoading && !summary ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : summary ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
              {days.map((day) => {
                const widthPct = day.sessionCount === 0 ? 0 : Math.max(10, (day.totalMinutes / maxMinutes) * 100);
                const muted = day.sessionCount === 0;
                const t = day.totalMinutes;
                const pct = (v: number) => (t > 0 ? (v / t) * 100 : 0);
                return (
                  <div
                    key={day.date}
                    className={`relative flex flex-col rounded-xl border px-2.5 pt-2.5 pb-2 min-h-[7.5rem] overflow-hidden ${
                      muted ? 'border-border/60 bg-surface-elevated/40' : 'border-border bg-surface-elevated'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-text-muted leading-tight">{formatDayLabel(day.date)}</p>
                        <p className="text-[10px] text-text-muted/80 font-mono">{day.date}</p>
                      </div>
                      {day.sessionCount > 0 ? (
                        <span className="text-[10px] tabular-nums rounded-md bg-amber-500/20 text-amber-200 px-1 py-0.5 shrink-0">
                          {day.sessionCount}×
                        </span>
                      ) : (
                        <span className="text-[10px] text-text-muted">—</span>
                      )}
                    </div>
                    <p className={`text-lg font-semibold tabular-nums leading-none ${muted ? 'text-text-muted' : 'text-text-primary'}`}>
                      {Math.round(day.totalMinutes)}
                      <span className="text-[10px] font-normal text-text-muted ml-0.5">min</span>
                    </p>
                    <p className="text-[10px] text-text-secondary mt-1 leading-snug tabular-nums">
                      {Math.round(day.caloriesBurned)} kcal · L {Math.round(day.lowMinutes)} · M {Math.round(day.mediumMinutes)} · H{' '}
                      {Math.round(day.highMinutes)}
                    </p>
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

            {goals ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <MacroStatCard
                  label="Avg minutes / day"
                  value={Math.round(summary.averages.minutes)}
                  hint={`~${targetMinutesPerDay} min/day from weekly goal`}
                  icon={<Timer className="h-4 w-4 text-cyan-400" />}
                />
                <MacroStatCard
                  label="Avg sessions / day"
                  value={summary.averages.sessions.toFixed(2)}
                  hint={`${goals.weeklySessionsTarget}/week (~${targetSessionsPerDay.toFixed(1)}/day)`}
                  icon={<Dumbbell className="h-4 w-4 text-amber-400" />}
                />
                <MacroStatCard
                  label="Avg kcal burned / day"
                  value={Math.round(summary.averages.caloriesBurned)}
                  hint="From logged sessions"
                  icon={<Flame className="h-4 w-4 text-orange-400" />}
                />
                <MacroStatCard
                  label="High intensity share"
                  value={`${highPctOfWeek}%`}
                  hint="Of weekly training minutes"
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
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-amber-200/90 mb-1">Evo coach note</p>
                  <h3 className="text-lg md:text-xl font-semibold text-text-primary leading-snug">{coach.headline}</h3>
                  <p className="text-sm text-text-secondary mt-2 leading-relaxed">{coach.summary}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-border bg-background/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-200/90 mb-3 flex items-center gap-2">
                    <Target className="h-3.5 w-3.5" />
                    What to watch
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
                    Level up next week
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

              <p className="text-sm text-text-primary/90 border-t border-border/60 pt-4 italic">{coach.closingLine}</p>

              <div className="flex flex-wrap gap-2 pt-1">
                <button type="button" className="btn-secondary text-sm" onClick={() => router.push('/chat?channel=COACH')}>
                  Discuss this week in Evo chat
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
