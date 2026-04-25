'use client';

import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import { Camera, Dumbbell, Flame, Trash2 } from 'lucide-react';
import {
  ME_QUERY,
  WEEKLY_EVO_REVIEW_QUERY,
} from '@/lib/graphql/queries';
import { clearAuthToken } from '@/lib/auth-token';
import { clearApolloClientCache } from '@/lib/apollo-client';
import AppShell from '@/components/AppShell';
import PageTopBar from '@/components/ui/molecules/PageTopBar';
import ContextAICoach from '@/components/ContextAICoach';
import { ListRowSkeleton, PageLoader, Skeleton, StatCardSkeleton } from '@/components/ui/loading';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { getDestructiveConfirmLabels } from '@/lib/i18n/destructive-confirm';
import { DELETE_FOOD_ITEM_MUTATION, DELETE_WORKOUT_MUTATION } from '@/lib/graphql/mutations';
import { UPSERT_DAILY_ACTIVITY_MUTATION } from '@/lib/graphql/mutations';
import { appToast } from '@/lib/app-toast';
import {
  buildDayRefetchQueriesAfterLog,
  buildRollingSevenDayAverageStepsRefetch,
  kickDeferredAfterMealLog,
  kickDeferredAfterWorkoutLog,
  kickDeferredDashboardAndWeeklyEvo,
} from '@/lib/day-data';
import { useDaySnapshot } from '@/hooks/useDaySnapshot';
import { useClientCalendarToday } from '@/hooks/useClientCalendarToday';
import { formatPrimaryGoal } from '@/lib/formatters';
import {
  AISectionHeader,
  EvoHintCard,
  InsightEmptyState,
} from '@/components/evo';
import { graphqlAppLocaleToUi } from '@/lib/i18n/ui-locale';
import { statsPageCopy } from '@/lib/i18n/copy/stats-page';
import { accentEdgeClasses } from '@/components/ui/accent-cards';

type StatTone = 'brand' | 'info' | 'success' | 'brandSoft';
type AnalysisMode = 'combined' | 'nutrition' | 'training';

export default function StatsPage() {
  const client = useApolloClient();
  const router = useRouter();
  const { dateKey: today, timeZone } = useClientCalendarToday();
  const [selectedDate, setSelectedDate] = useState(today);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('combined');
  const [stepsInput, setStepsInput] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<{ kind: 'meal' | 'workout'; id: string } | null>(null);

  const { data: userData, loading: userLoading, error: userError } = useQuery(ME_QUERY);
  const daySnapshot = useDaySnapshot({
    date: selectedDate,
    clientTimeZone: timeZone,
    enabled: Boolean(userData?.me),
    includeInsight: true,
  });
  const { data: weeklyReviewData } = useQuery(WEEKLY_EVO_REVIEW_QUERY, {
    variables: { endDate: selectedDate },
    skip: !userData?.me,
  });

  const [deleteFoodItem, { loading: deletingMeal }] = useMutation(DELETE_FOOD_ITEM_MUTATION, {
    onCompleted: () => {
      kickDeferredAfterMealLog(client);
    },
    onError: (error) => {
      appToast.error('Delete failed', error.message || 'Could not delete meal.');
    },
    refetchQueries: [...buildDayRefetchQueriesAfterLog(selectedDate, timeZone)],
    awaitRefetchQueries: true,
  });

  const [deleteWorkout, { loading: deletingWorkout }] = useMutation(DELETE_WORKOUT_MUTATION, {
    onCompleted: () => {
      kickDeferredAfterWorkoutLog(client);
    },
    onError: (error) => {
      appToast.error('Delete failed', error.message || 'Could not delete workout.');
    },
    refetchQueries: [...buildDayRefetchQueriesAfterLog(selectedDate, timeZone)],
    awaitRefetchQueries: true,
  });
  const [upsertDailyActivity, { loading: savingSteps }] = useMutation(UPSERT_DAILY_ACTIVITY_MUTATION, {
    onCompleted: () => {
      kickDeferredDashboardAndWeeklyEvo(client);
      appToast.success('Steps updated', 'Daily activity has been saved.');
    },
    onError: (error) => {
      appToast.error('Save failed', error.message || 'Could not update steps.');
    },
    refetchQueries: [
      ...buildDayRefetchQueriesAfterLog(selectedDate, timeZone),
      buildRollingSevenDayAverageStepsRefetch(today, timeZone),
    ],
    awaitRefetchQueries: true,
  });

  useEffect(() => {
    if (!userError) return;
    appToast.error('Session expired', 'Please login again.');
    void (async () => {
      clearAuthToken();
      await clearApolloClientCache();
      router.push('/login');
    })();
  }, [userError, router]);

  useEffect(() => {
    setStepsInput(Number(daySnapshot.activity?.steps || 0));
  }, [daySnapshot.activity?.steps, selectedDate]);

  if (userLoading) {
    return <PageLoader />;
  }

  const user = userData?.me;
  const locale = graphqlAppLocaleToUi(user?.preferences?.appLocale);
  const sc = statsPageCopy[locale];
  const stats = daySnapshot.stats;
  const workouts = daySnapshot.workouts || [];
  const workoutSummary = daySnapshot.summary;
  const weeklyReview = weeklyReviewData?.weeklyEvoReview;
  const activity = daySnapshot.activity;
  const goalProgress = stats?.goalProgress || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const analysisModeLabel =
    analysisMode === 'combined' ? sc.modeCombined : analysisMode === 'nutrition' ? sc.modeNutrition : sc.modeTraining;
  const delLabels = getDestructiveConfirmLabels(locale);
  const deleteDialogTitle =
    deleteConfirm?.kind === 'workout' ? sc.deleteWorkoutTitle : sc.deleteMealTitle;
  const deleteDialogDescription =
    deleteConfirm?.kind === 'workout' ? sc.confirmDeleteWorkout : sc.confirmDeleteMeal;

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    const { kind, id } = deleteConfirm;
    setDeleteConfirm(null);
    if (kind === 'meal') {
      const result = await deleteFoodItem({ variables: { id } });
      if (result.data?.deleteFoodItem) {
        appToast.success('Meal deleted', 'Entry removed for selected day.');
      } else {
        appToast.error('Delete failed', 'Could not delete meal.');
      }
    } else {
      const result = await deleteWorkout({ variables: { id } });
      if (result.data?.deleteWorkout) {
        appToast.success('Workout deleted', 'Workout removed for selected day.');
      } else {
        appToast.error('Delete failed', 'Could not delete workout.');
      }
    }
  };

  const handleSaveSteps = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!Number.isFinite(stepsInput) || stepsInput < 0 || stepsInput > 120000) {
      appToast.info('Invalid steps', locale === 'pl' ? 'Kroki: 0–120000.' : 'Steps must be between 0 and 120000.');
      return;
    }

    await upsertDailyActivity({
      variables: {
        input: {
          date: selectedDate,
          steps: Math.round(stepsInput),
        },
      },
    });
  };

  return (
      <AppShell>
        <ConfirmDialog
          open={deleteConfirm !== null}
          title={deleteDialogTitle}
          description={deleteDialogDescription}
          confirmLabel={delLabels.confirm}
          cancelLabel={delLabels.cancel}
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={() => void handleConfirmDelete()}
          confirmBusy={
            deleteConfirm?.kind === 'workout' ? deletingWorkout : deleteConfirm?.kind === 'meal' ? deletingMeal : false
          }
          variant="danger"
        />
        <div className="mb-5">
          <PageTopBar
            rightContent={
              <span className="text-sm text-text-secondary">
                {sc.goalModePrefix} {formatPrimaryGoal(String(user?.preferences?.primaryGoal || 'maintenance'), locale)}
              </span>
            }
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <div className="xl:col-span-8">
            <div
              className={clsx(
                'bg-surface rounded-xl border border-border p-5 mb-6 shadow-sm shadow-black/5',
                accentEdgeClasses('primary', 'left'),
              )}
            >
              <AISectionHeader eyebrow={sc.eyebrow} title={sc.pickDayTitle} subtitle={sc.pickDaySubtitle} />
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="inline-flex rounded-lg border border-border bg-surface-elevated p-1 gap-1">
                  <ModeButton label={sc.modeCombined} active={analysisMode === 'combined'} onClick={() => setAnalysisMode('combined')} />
                  <ModeButton label={sc.modeNutrition} active={analysisMode === 'nutrition'} onClick={() => setAnalysisMode('nutrition')} />
                  <ModeButton label={sc.modeTraining} active={analysisMode === 'training'} onClick={() => setAnalysisMode('training')} />
                </div>
              </div>
              <label htmlFor="stats-date" className="block text-sm text-text-secondary mb-2">
                {sc.analysisDate}
              </label>
              <input
                id="stats-date"
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="input-field w-full max-w-sm"
              />
              <form onSubmit={handleSaveSteps} className="mt-3 grid grid-cols-1 sm:grid-cols-[200px_auto] gap-2 max-w-md">
                <input
                  type="number"
                  min={0}
                  max={120000}
                  value={stepsInput}
                  onChange={(event) => setStepsInput(Number(event.target.value))}
                  className="input-field w-full"
                  placeholder={sc.stepsPlaceholder}
                />
                <button type="submit" className="btn-secondary" disabled={savingSteps}>
                  {savingSteps ? sc.saving : sc.saveSteps}
                </button>
              </form>
              <p className="text-xs text-text-muted mt-2">
                {daySnapshot.loading ? sc.loadingActivity : sc.stepsTracked(Math.round(activity?.steps || 0))}
              </p>
            </div>

            {analysisMode === 'combined' && daySnapshot.insight ? (
              <div className="mb-6">
                <EvoHintCard
                  title={sc.mainInsightTitle}
                  tone="notice"
                  content={daySnapshot.insight.summary?.trim() ? daySnapshot.insight.summary : sc.mainInsightPending}
                />
              </div>
            ) : null}

            {(analysisMode === 'combined' || analysisMode === 'nutrition') ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {daySnapshot.loading ? (
                <>
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                </>
              ) : (
                <>
                  <StatCard
                    ui={sc}
                    title={locale === 'pl' ? 'Kalorie' : 'Calories'}
                    value={stats?.totalCalories?.toFixed(0) || '0'}
                    goal={stats?.dynamicGoals?.calories || user?.preferences?.dailyCalorieGoal || 2000}
                    progress={goalProgress.calories}
                    unit="kcal"
                    tone="brand"
                  />
                  <StatCard
                    ui={sc}
                    title={locale === 'pl' ? 'Białko' : 'Protein'}
                    value={stats?.totalProtein?.toFixed(1) || '0'}
                    goal={stats?.dynamicGoals?.protein || user?.preferences?.proteinGoal || undefined}
                    progress={goalProgress.protein}
                    unit="g"
                    tone="info"
                  />
                  <StatCard
                    ui={sc}
                    title={locale === 'pl' ? 'Węglowodany' : 'Carbs'}
                    value={stats?.totalCarbs?.toFixed(1) || '0'}
                    goal={stats?.dynamicGoals?.carbs || user?.preferences?.carbsGoal || undefined}
                    progress={goalProgress.carbs}
                    unit="g"
                    tone="success"
                  />
                  <StatCard
                    ui={sc}
                    title={locale === 'pl' ? 'Tłuszcze' : 'Fat'}
                    value={stats?.totalFat?.toFixed(1) || '0'}
                    goal={stats?.dynamicGoals?.fat || user?.preferences?.fatGoal || undefined}
                    progress={goalProgress.fat}
                    unit="g"
                    tone="brandSoft"
                  />
                </>
              )}
            </div>
            ) : null}

            {(analysisMode === 'combined' || analysisMode === 'nutrition') ? (
            <section
              className={clsx(
                'bg-surface rounded-xl border border-border p-5 shadow-sm shadow-black/5',
                accentEdgeClasses('info', 'left'),
              )}
            >
              <h3 className="text-xl font-semibold tracking-tight text-text-primary mb-5">
                {sc.mealsFor} {selectedDate}
              </h3>
              {daySnapshot.loading ? (
                <div className="space-y-3">
                  <ListRowSkeleton />
                  <ListRowSkeleton />
                  <ListRowSkeleton />
                </div>
              ) : stats?.meals?.length > 0 ? (
                <div className="space-y-3">
                  {stats.meals.map((meal: any) => (
                    <div
                      key={meal.id}
                      className="relative flex items-center justify-between p-3.5 pr-12 bg-surface-elevated rounded-lg border border-border"
                    >
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm({ kind: 'meal', id: meal.id })}
                        disabled={deletingMeal}
                        className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-secondary hover:text-red-400 hover:border-red-400/40 transition-colors"
                        title={sc.deleteMealTitle}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <div>
                        <h4 className="font-semibold text-text-primary">{meal.name}</h4>
                        <p className="text-sm text-text-secondary capitalize">{meal.mealType.toLowerCase()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-text-primary">
                          {meal.nutrition.calories.toFixed(0)} kcal
                        </p>
                        <p className="text-sm text-text-secondary">
                          P: {meal.nutrition.protein.toFixed(0)}g • C: {meal.nutrition.carbs.toFixed(0)}g • F: {meal.nutrition.fat.toFixed(0)}g
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Camera className="h-16 w-16 text-text-muted mx-auto mb-4" />
                  <p className="text-text-secondary mb-4">{sc.noMeals(selectedDate)}</p>
                  <button
                    onClick={() => router.push('/meals')}
                    className="btn-primary inline-flex items-center space-x-2 px-4"
                  >
                    <Camera className="h-4 w-4 stroke-[1.9]" />
                    <span>{sc.addMeal}</span>
                  </button>
                </div>
              )}
            </section>
            ) : null}

            {(analysisMode === 'combined' || analysisMode === 'training') ? (
            <section
              className={clsx(
                'bg-surface rounded-xl border border-border p-5 mt-4 shadow-sm shadow-black/5',
                accentEdgeClasses('success', 'left'),
              )}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-semibold tracking-tight text-text-primary">
                  {sc.workoutsFor} {selectedDate}
                </h3>
                <button type="button" onClick={() => router.push('/workouts')} className="btn-info">
                  {sc.openWorkoutCoach}
                </button>
              </div>

              {daySnapshot.loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                  <WorkoutSummaryCard
                    icon={<Dumbbell className="h-4 w-4 text-amber-400" />}
                    label={sc.sessions}
                    value={`${workouts.length}`}
                    accent="primary"
                  />
                  <WorkoutSummaryCard
                    icon={<Flame className="h-4 w-4 text-info-500" />}
                    label={sc.burned}
                    value={`${workoutSummary?.caloriesBurned?.toFixed(0) || '0'} kcal`}
                    accent="info"
                  />
                  <WorkoutSummaryCard
                    icon={<Camera className="h-4 w-4 text-primary-400" />}
                    label={sc.netCalories}
                    value={`${workoutSummary?.netCalories?.toFixed(0) || '0'} kcal`}
                    accent="success"
                  />
                </div>
              )}

              {daySnapshot.loading ? (
                <div className="space-y-3">
                  <ListRowSkeleton />
                  <ListRowSkeleton />
                </div>
              ) : workouts.length > 0 ? (
                <div className="space-y-3">
                  {workouts.map((workout: any) => (
                    <div
                      key={workout.id}
                      className="relative flex items-center justify-between p-3.5 pr-12 bg-surface-elevated rounded-lg border border-border"
                    >
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm({ kind: 'workout', id: workout.id })}
                        disabled={deletingWorkout}
                        className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-secondary hover:text-red-400 hover:border-red-400/40 transition-colors"
                        title={sc.deleteWorkoutTitle}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <div>
                        <h4 className="font-semibold text-text-primary">{workout.title}</h4>
                        <p className="text-sm text-text-secondary">
                          {workout.durationMinutes} min • {workout.caloriesBurned} kcal • {String(workout.intensity || '').toLowerCase()}
                        </p>
                        {workout.notes ? <p className="text-sm text-text-secondary mt-1">{workout.notes}</p> : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Dumbbell className="h-16 w-16 text-text-muted mx-auto mb-4" />
                  <p className="text-text-secondary mb-4">{sc.noWorkouts(selectedDate)}</p>
                  <button
                    onClick={() => router.push('/workouts')}
                    className="btn-primary inline-flex items-center space-x-2 px-4"
                  >
                    <Dumbbell className="h-4 w-4 stroke-[1.9]" />
                    <span>{sc.logWorkout}</span>
                  </button>
                </div>
              )}
            </section>
            ) : null}
          </div>

          <div className="xl:col-span-4">
            <div className="space-y-4">
              {weeklyReview ? (
                <section
                  className={clsx(
                    'bg-surface rounded-xl border border-border p-4 shadow-sm shadow-black/5',
                    accentEdgeClasses('info', 'left'),
                  )}
                >
                  <h4 className="text-sm font-semibold tracking-tight text-text-primary mb-2">Weekly trend snapshot</h4>
                  {!weeklyReview.isCompleteWeek ? (
                    <div className="rounded-lg border border-dashed border-primary-500/30 bg-primary-500/5 px-3 py-2 mb-3">
                      <p className="text-xs text-primary-200">
                        Partial weekly review for <span className="font-semibold text-primary-100">{weeklyReview.availableDays}/7</span> available days
                        (<span className="font-semibold text-primary-100">{weeklyReview.trackedDays}</span> tracked).
                      </p>
                    </div>
                  ) : null}
                  {weeklyReview.summary?.trim() ? (
                    <p className="text-sm text-text-secondary mb-3 leading-relaxed whitespace-pre-wrap">{weeklyReview.summary}</p>
                  ) : (
                    <p className="text-sm text-text-muted mb-3">{sc.weeklyNarrativePending}</p>
                  )}
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <WorkoutSummaryCard
                      icon={<Camera className="h-4 w-4 text-info-400" />}
                      label={locale === 'pl' ? 'Odżywianie' : 'Nutrition'}
                      value={`${weeklyReview.nutritionScore}/100`}
                      accent="primary"
                    />
                    <WorkoutSummaryCard
                      icon={<Dumbbell className="h-4 w-4 text-amber-300" />}
                      label={locale === 'pl' ? 'Trening' : 'Training'}
                      value={`${weeklyReview.trainingScore}/100`}
                      accent="info"
                    />
                    <WorkoutSummaryCard
                      icon={<Flame className="h-4 w-4 text-success-400" />}
                      label={locale === 'pl' ? 'Konsekwencja' : 'Consistency'}
                      value={`${weeklyReview.consistencyScore}/100`}
                      accent="success"
                    />
                  </div>
                  {weeklyReview.proTip?.trim() ? (
                    <div className="rounded-lg border border-primary-500/25 bg-primary-500/5 px-3 py-2.5 mb-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-200 mb-1">{sc.proTip}</p>
                      <p className="text-xs text-text-primary leading-snug">{weeklyReview.proTip}</p>
                    </div>
                  ) : null}
                </section>
              ) : (
                <section
                  className={clsx(
                    'bg-surface rounded-xl border border-border p-4 shadow-sm shadow-black/5',
                    accentEdgeClasses('info', 'left'),
                  )}
                >
                  <InsightEmptyState title={sc.weeklyEmptyTitle} description={sc.weeklyEmptyDescription} />
                </section>
              )}
              <ContextAICoach
                title={sc.aiCoachTitle}
                description={sc.aiCoachDescription(analysisModeLabel)}
                quickPrompts={[
                  sc.quick1(selectedDate),
                  sc.quick2(selectedDate),
                  sc.quick3(selectedDate),
                  sc.quick4(selectedDate),
                ]}
                statsReference={selectedDate}
              />
            </div>
          </div>
        </div>
    </AppShell>
  );
}

function WorkoutSummaryCard({
  icon,
  label,
  value,
  accent = 'info',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: 'primary' | 'info' | 'success';
}) {
  return (
    <div
      className={clsx(
        'rounded-lg border border-border bg-surface-elevated p-3 shadow-sm shadow-black/5',
        accentEdgeClasses(accent, 'left'),
      )}
    >
      <div className="inline-flex items-center gap-1.5 text-xs text-text-muted">
        {icon}
        {label}
      </div>
      <p className="text-sm font-semibold text-text-primary mt-1">{value}</p>
    </div>
  );
}

function StatCard({
  ui,
  title,
  value,
  goal,
  progress,
  unit,
  tone,
}: {
  ui: (typeof statsPageCopy)['en'];
  title: string;
  value: string;
  goal?: number;
  progress: number;
  unit: string;
  tone: StatTone;
}) {
  const percentage = goal ? (parseFloat(value) / goal) * 100 : progress;
  const toneStyles = {
    brand: { value: 'text-primary-500', bar: 'bg-primary-500', edge: accentEdgeClasses('primary', 'left') },
    info: { value: 'text-info-500', bar: 'bg-info-500', edge: accentEdgeClasses('info', 'left') },
    success: { value: 'text-success-500', bar: 'bg-success-500', edge: accentEdgeClasses('success', 'left') },
    brandSoft: { value: 'text-primary-300', bar: 'bg-primary-300', edge: 'border-l-4 border-l-primary-300' },
  } satisfies Record<StatTone, { value: string; bar: string; edge: string }>;

  return (
    <div
      className={clsx(
        'bg-surface rounded-xl border border-border p-5 shadow-sm shadow-black/5',
        toneStyles[tone].edge,
      )}
    >
      <h3 className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-text-muted">{title}</h3>
      <div className="mb-3 flex items-baseline space-x-2">
        <span className={`text-2xl font-semibold tracking-tight ${toneStyles[tone].value}`}>{value}</span>
        <span className="text-xs text-text-secondary">{unit}</span>
      </div>
      {goal ? (
        <p className="text-xs text-text-muted mb-2">
          {ui.statGoal} {goal} {unit}
        </p>
      ) : null}
      <div className="w-full bg-background/60 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${toneStyles[tone].bar}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <p className="text-xs text-text-muted mt-1">{ui.statPercentOfGoal(percentage.toFixed(0))}</p>
    </div>
  );
}

function ModeButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-2.5 py-1.5 text-xs transition-colors ${
        active
          ? 'bg-primary-500/15 border border-primary-500/30 text-text-primary'
          : 'text-text-secondary border border-transparent hover:text-text-primary'
      }`}
    >
      {label}
    </button>
  );
}
