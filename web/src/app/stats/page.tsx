'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
import { Camera, Dumbbell, Flame, Trash2 } from 'lucide-react';
import {
  ME_QUERY,
  WEEKLY_EVO_REVIEW_QUERY,
} from '@/lib/graphql/queries';
import { clearAuthToken } from '@/lib/auth-token';
import AppShell from '@/components/AppShell';
import PageTopBar from '@/components/ui/molecules/PageTopBar';
import ContextAICoach from '@/components/ContextAICoach';
import { ListRowSkeleton, PageLoader, Skeleton, StatCardSkeleton } from '@/components/ui/loading';
import { DELETE_FOOD_ITEM_MUTATION, DELETE_WORKOUT_MUTATION } from '@/lib/graphql/mutations';
import { UPSERT_DAILY_ACTIVITY_MUTATION } from '@/lib/graphql/mutations';
import { appToast } from '@/lib/app-toast';
import { buildDayRefetchQueries } from '@/lib/day-data';
import { useDaySnapshot } from '@/hooks/useDaySnapshot';
import { formatPrimaryGoal } from '@/lib/formatters';

type StatTone = 'brand' | 'info' | 'success' | 'brandSoft';
type AnalysisMode = 'combined' | 'nutrition' | 'training';

export default function StatsPage() {
  const router = useRouter();
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('combined');
  const [stepsInput, setStepsInput] = useState(0);

  const { data: userData, loading: userLoading, error: userError } = useQuery(ME_QUERY);
  const daySnapshot = useDaySnapshot({
    date: selectedDate,
    enabled: Boolean(userData?.me),
    includeInsight: true,
  });
  const { data: weeklyReviewData } = useQuery(WEEKLY_EVO_REVIEW_QUERY, {
    variables: { endDate: selectedDate },
    skip: !userData?.me,
  });

  const [deleteFoodItem, { loading: deletingMeal }] = useMutation(DELETE_FOOD_ITEM_MUTATION, {
    onError: (error) => {
      appToast.error('Delete failed', error.message || 'Could not delete meal.');
    },
    refetchQueries: buildDayRefetchQueries(selectedDate),
  });

  const [deleteWorkout, { loading: deletingWorkout }] = useMutation(DELETE_WORKOUT_MUTATION, {
    onError: (error) => {
      appToast.error('Delete failed', error.message || 'Could not delete workout.');
    },
    refetchQueries: buildDayRefetchQueries(selectedDate),
  });
  const [upsertDailyActivity, { loading: savingSteps }] = useMutation(UPSERT_DAILY_ACTIVITY_MUTATION, {
    onCompleted: () => {
      appToast.success('Steps updated', 'Daily activity has been saved.');
    },
    onError: (error) => {
      appToast.error('Save failed', error.message || 'Could not update steps.');
    },
    refetchQueries: buildDayRefetchQueries(selectedDate),
  });

  useEffect(() => {
    if (!userError) return;
    appToast.error('Session expired', 'Please login again.');
    clearAuthToken();
    router.push('/login');
  }, [userError, router]);

  useEffect(() => {
    setStepsInput(Number(daySnapshot.activity?.steps || 0));
  }, [daySnapshot.activity?.steps, selectedDate]);

  if (userLoading) {
    return <PageLoader />;
  }

  const user = userData?.me;
  const stats = daySnapshot.stats;
  const workouts = daySnapshot.workouts || [];
  const workoutSummary = daySnapshot.summary;
  const weeklyReview = weeklyReviewData?.weeklyEvoReview;
  const activity = daySnapshot.activity;
  const goalProgress = stats?.goalProgress || { calories: 0, protein: 0, carbs: 0, fat: 0 };

  const handleDeleteMeal = async (mealId: string) => {
    const confirmed = window.confirm('Delete this meal entry?');
    if (!confirmed) return;

    const result = await deleteFoodItem({ variables: { id: mealId } });
    if (result.data?.deleteFoodItem) {
      appToast.success('Meal deleted', 'Entry removed for selected day.');
    } else {
      appToast.error('Delete failed', 'Could not delete meal.');
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    const confirmed = window.confirm('Delete this workout entry?');
    if (!confirmed) return;

    const result = await deleteWorkout({ variables: { id: workoutId } });
    if (result.data?.deleteWorkout) {
      appToast.success('Workout deleted', 'Workout removed for selected day.');
    } else {
      appToast.error('Delete failed', 'Could not delete workout.');
    }
  };

  const handleSaveSteps = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!Number.isFinite(stepsInput) || stepsInput < 0 || stepsInput > 120000) {
      appToast.info('Invalid steps', 'Steps must be between 0 and 120000.');
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
        <div className="mb-5">
          <PageTopBar
            rightContent={
              <span className="text-sm text-text-secondary">
                Goal mode: {formatPrimaryGoal(String(user?.preferences?.primaryGoal || 'MAINTENANCE'))}
              </span>
            }
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <div className="xl:col-span-8">
            <div className="bg-surface rounded-xl border border-border p-5 mb-6">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <h1 className="text-xl font-semibold tracking-tight text-text-primary">Pick Day</h1>
                <div className="inline-flex rounded-lg border border-border bg-surface-elevated p-1 gap-1">
                  <ModeButton label="Combined" active={analysisMode === 'combined'} onClick={() => setAnalysisMode('combined')} />
                  <ModeButton label="Nutrition" active={analysisMode === 'nutrition'} onClick={() => setAnalysisMode('nutrition')} />
                  <ModeButton label="Training" active={analysisMode === 'training'} onClick={() => setAnalysisMode('training')} />
                </div>
              </div>
              <label htmlFor="stats-date" className="block text-sm text-text-secondary mb-2">
                Analysis date
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
                  placeholder="Steps"
                />
                <button type="submit" className="btn-secondary" disabled={savingSteps}>
                  {savingSteps ? 'Saving...' : 'Save steps'}
                </button>
              </form>
              <p className="text-xs text-text-muted mt-2">
                {daySnapshot.loading ? 'Loading activity...' : `Steps tracked: ${Math.round(activity?.steps || 0)}`}
              </p>
            </div>

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
                    title="Calories"
                    value={stats?.totalCalories?.toFixed(0) || '0'}
                    goal={stats?.dynamicGoals?.calories || user?.preferences?.dailyCalorieGoal || 2000}
                    progress={goalProgress.calories}
                    unit="kcal"
                    tone="brand"
                  />
                  <StatCard
                    title="Protein"
                    value={stats?.totalProtein?.toFixed(1) || '0'}
                    goal={stats?.dynamicGoals?.protein || user?.preferences?.proteinGoal || undefined}
                    progress={goalProgress.protein}
                    unit="g"
                    tone="info"
                  />
                  <StatCard
                    title="Carbs"
                    value={stats?.totalCarbs?.toFixed(1) || '0'}
                    goal={stats?.dynamicGoals?.carbs || user?.preferences?.carbsGoal || undefined}
                    progress={goalProgress.carbs}
                    unit="g"
                    tone="success"
                  />
                  <StatCard
                    title="Fat"
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
            <section className="bg-surface rounded-xl border border-border p-5">
              <h3 className="text-xl font-semibold tracking-tight text-text-primary mb-5">Meals for {selectedDate}</h3>
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
                        onClick={() => handleDeleteMeal(meal.id)}
                        disabled={deletingMeal}
                        className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-secondary hover:text-red-400 hover:border-red-400/40 transition-colors"
                        title="Delete meal"
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
                  <p className="text-text-secondary mb-4">No meals logged for {selectedDate}</p>
                  <button
                    onClick={() => router.push('/meals')}
                    className="btn-primary inline-flex items-center space-x-2 px-4"
                  >
                    <Camera className="h-4 w-4 stroke-[1.9]" />
                    <span>Add meal</span>
                  </button>
                </div>
              )}
            </section>
            ) : null}

            {(analysisMode === 'combined' || analysisMode === 'training') ? (
            <section className="bg-surface rounded-xl border border-border p-5 mt-4">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-semibold tracking-tight text-text-primary">Workouts for {selectedDate}</h3>
                <button
                  onClick={() => router.push('/workouts')}
                  className="btn-secondary"
                >
                  Open Workout Coach
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
                    label="Sessions"
                    value={`${workouts.length}`}
                  />
                  <WorkoutSummaryCard
                    icon={<Flame className="h-4 w-4 text-info-500" />}
                    label="Burned"
                    value={`${workoutSummary?.caloriesBurned?.toFixed(0) || '0'} kcal`}
                  />
                  <WorkoutSummaryCard
                    icon={<Camera className="h-4 w-4 text-primary-400" />}
                    label="Net calories"
                    value={`${workoutSummary?.netCalories?.toFixed(0) || '0'} kcal`}
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
                        onClick={() => handleDeleteWorkout(workout.id)}
                        disabled={deletingWorkout}
                        className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-secondary hover:text-red-400 hover:border-red-400/40 transition-colors"
                        title="Delete workout"
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
                  <p className="text-text-secondary mb-4">No workouts logged for {selectedDate}</p>
                  <button
                    onClick={() => router.push('/workouts')}
                    className="btn-primary inline-flex items-center space-x-2 px-4"
                  >
                    <Dumbbell className="h-4 w-4 stroke-[1.9]" />
                    <span>Log workout</span>
                  </button>
                </div>
              )}
            </section>
            ) : null}
          </div>

          <div className="xl:col-span-4">
            <div className="space-y-4">
              {weeklyReview ? (
                <section className="bg-surface rounded-xl border border-border p-4">
                  <h4 className="text-sm font-semibold tracking-tight text-text-primary mb-2">Weekly trend snapshot</h4>
                  {!weeklyReview.isCompleteWeek ? (
                    <div className="rounded-lg border border-dashed border-border bg-surface-elevated p-3.5">
                      <p className="text-sm text-text-primary font-medium mb-1">Evo is waiting for a full week of data</p>
                      <p className="text-sm text-text-secondary">
                        Currently, data is available for <span className="font-semibold text-text-primary">{weeklyReview.trackedDays}/7</span> days.
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-text-secondary mb-3">{weeklyReview.summary}</p>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <WorkoutSummaryCard icon={<Camera className="h-4 w-4 text-info-400" />} label="Nutrition" value={`${weeklyReview.nutritionScore}/100`} />
                        <WorkoutSummaryCard icon={<Dumbbell className="h-4 w-4 text-amber-300" />} label="Training" value={`${weeklyReview.trainingScore}/100`} />
                        <WorkoutSummaryCard icon={<Flame className="h-4 w-4 text-success-400" />} label="Consistency" value={`${weeklyReview.consistencyScore}/100`} />
                      </div>
                    </>
                  )}
                </section>
              ) : null}
              <ContextAICoach
                title="AI Coach"
                description={`Mode: ${analysisMode}. Ask Evo for focused suggestions based on selected date.`}
                quickPrompts={[
                  `Review my nutrition for ${selectedDate}.`,
                  `Combine my meals and workouts for ${selectedDate} and tell me what to do next.`,
                  `What macro is most off target on ${selectedDate}?`,
                  `Suggest one dinner idea for ${selectedDate} for better balance.`,
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
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-elevated p-3">
      <div className="inline-flex items-center gap-1.5 text-xs text-text-muted">
        {icon}
        {label}
      </div>
      <p className="text-sm font-semibold text-text-primary mt-1">{value}</p>
    </div>
  );
}

function StatCard({
  title,
  value,
  goal,
  progress,
  unit,
  tone,
}: {
  title: string;
  value: string;
  goal?: number;
  progress: number;
  unit: string;
  tone: StatTone;
}) {
  const percentage = goal ? (parseFloat(value) / goal) * 100 : progress;
  const toneStyles = {
    brand: { value: 'text-primary-500', bar: 'bg-primary-500' },
    info: { value: 'text-info-500', bar: 'bg-info-500' },
    success: { value: 'text-success-500', bar: 'bg-success-500' },
    brandSoft: { value: 'text-primary-300', bar: 'bg-primary-300' },
  } satisfies Record<StatTone, { value: string; bar: string }>;

  return (
    <div className="bg-surface rounded-xl border border-border p-5">
      <h3 className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-text-muted">{title}</h3>
      <div className="mb-3 flex items-baseline space-x-2">
        <span className={`text-2xl font-semibold tracking-tight ${toneStyles[tone].value}`}>{value}</span>
        <span className="text-xs text-text-secondary">{unit}</span>
      </div>
      {goal ? <p className="text-xs text-text-muted mb-2">Goal: {goal} {unit}</p> : null}
      <div className="w-full bg-background/60 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${toneStyles[tone].bar}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <p className="text-xs text-text-muted mt-1">{percentage.toFixed(0)}% of goal</p>
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
