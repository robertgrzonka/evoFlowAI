'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
import { ArrowLeft, Camera, Dumbbell, Flame, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  DAILY_STATS_QUERY,
  ME_QUERY,
  MY_WORKOUTS_QUERY,
  WORKOUT_COACH_SUMMARY_QUERY,
} from '@/lib/graphql/queries';
import { clearAuthToken } from '@/lib/auth-token';
import AppShell from '@/components/AppShell';
import ContextAICoach from '@/components/ContextAICoach';
import { ListRowSkeleton, PageLoader, Skeleton, StatCardSkeleton } from '@/components/ui/loading';
import { DELETE_FOOD_ITEM_MUTATION, DELETE_WORKOUT_MUTATION } from '@/lib/graphql/mutations';

type StatTone = 'brand' | 'info' | 'success' | 'brandSoft';

export default function StatsPage() {
  const router = useRouter();
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState(today);

  const { data: userData, loading: userLoading, error: userError } = useQuery(ME_QUERY);
  const { data: statsData, loading: statsLoading } = useQuery(DAILY_STATS_QUERY, {
    variables: { date: selectedDate },
    skip: !userData?.me,
  });
  const { data: workoutsData, loading: workoutsLoading } = useQuery(MY_WORKOUTS_QUERY, {
    variables: { date: selectedDate, limit: 30, offset: 0 },
    skip: !userData?.me,
  });
  const { data: workoutSummaryData, loading: workoutSummaryLoading } = useQuery(WORKOUT_COACH_SUMMARY_QUERY, {
    variables: { date: selectedDate },
    skip: !userData?.me,
  });

  const [deleteFoodItem, { loading: deletingMeal }] = useMutation(DELETE_FOOD_ITEM_MUTATION, {
    onError: (error) => {
      toast.error(error.message || 'Could not delete meal');
    },
    refetchQueries: [
      { query: DAILY_STATS_QUERY, variables: { date: selectedDate } },
      { query: WORKOUT_COACH_SUMMARY_QUERY, variables: { date: selectedDate } },
    ],
  });

  const [deleteWorkout, { loading: deletingWorkout }] = useMutation(DELETE_WORKOUT_MUTATION, {
    onError: (error) => {
      toast.error(error.message || 'Could not delete workout');
    },
    refetchQueries: [
      { query: MY_WORKOUTS_QUERY, variables: { date: selectedDate, limit: 30, offset: 0 } },
      { query: WORKOUT_COACH_SUMMARY_QUERY, variables: { date: selectedDate } },
    ],
  });

  useEffect(() => {
    if (!userError) return;
    toast.error('Session expired. Please login again.');
    clearAuthToken();
    router.push('/login');
  }, [userError, router]);

  if (userLoading) {
    return <PageLoader />;
  }

  const user = userData?.me;
  const stats = statsData?.dailyStats;
  const workouts = workoutsData?.myWorkouts || [];
  const workoutSummary = workoutSummaryData?.workoutCoachSummary;
  const goalProgress = stats?.goalProgress || { calories: 0, protein: 0, carbs: 0, fat: 0 };

  const handleDeleteMeal = async (mealId: string) => {
    const confirmed = window.confirm('Delete this meal entry?');
    if (!confirmed) return;

    const result = await deleteFoodItem({ variables: { id: mealId } });
    if (result.data?.deleteFoodItem) {
      toast.success('Meal deleted');
    } else {
      toast.error('Could not delete meal');
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    const confirmed = window.confirm('Delete this workout entry?');
    if (!confirmed) return;

    const result = await deleteWorkout({ variables: { id: workoutId } });
    if (result.data?.deleteWorkout) {
      toast.success('Workout deleted');
    } else {
      toast.error('Could not delete workout');
    }
  };

  return (
    <AppShell>
        <div className="flex items-center justify-between mb-5">
          <Link href="/dashboard" className="inline-flex items-center text-text-secondary hover:text-text-primary transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4 stroke-[1.9]" />
            Back to dashboard
          </Link>
          <span className="text-sm text-text-secondary">View stats by date</span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <div className="xl:col-span-8">
            <div className="bg-surface rounded-xl border border-border p-5 mb-6">
              <h1 className="text-xl font-semibold tracking-tight text-text-primary mb-3">Pick Day</h1>
              <label htmlFor="stats-date" className="block text-sm text-text-secondary mb-2">
                Nutrition stats for selected date
              </label>
              <input
                id="stats-date"
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="input-field w-full max-w-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {statsLoading ? (
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
                    goal={user?.preferences?.dailyCalorieGoal || 2000}
                    progress={goalProgress.calories}
                    unit="kcal"
                    tone="brand"
                  />
                  <StatCard
                    title="Protein"
                    value={stats?.totalProtein?.toFixed(1) || '0'}
                    progress={goalProgress.protein}
                    unit="g"
                    tone="info"
                  />
                  <StatCard
                    title="Carbs"
                    value={stats?.totalCarbs?.toFixed(1) || '0'}
                    progress={goalProgress.carbs}
                    unit="g"
                    tone="success"
                  />
                  <StatCard
                    title="Fat"
                    value={stats?.totalFat?.toFixed(1) || '0'}
                    progress={goalProgress.fat}
                    unit="g"
                    tone="brandSoft"
                  />
                </>
              )}
            </div>

            <section className="bg-surface rounded-xl border border-border p-5">
              <h3 className="text-xl font-semibold tracking-tight text-text-primary mb-5">Meals for {selectedDate}</h3>
              {statsLoading ? (
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
                    onClick={() => router.push('/chat')}
                    className="btn-primary inline-flex items-center space-x-2 px-4"
                  >
                    <Camera className="h-4 w-4 stroke-[1.9]" />
                    <span>Log Meal</span>
                  </button>
                </div>
              )}
            </section>

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

              {workoutSummaryLoading ? (
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

              {workoutsLoading ? (
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
          </div>

          <div className="xl:col-span-4">
            <div>
              <ContextAICoach
                title="AI Coach"
                description="Get suggestions for this selected day and improve your next meal."
                quickPrompts={[
                  `Review my nutrition for ${selectedDate}.`,
                  `Combine my meals and workouts for ${selectedDate} and tell me what to do next.`,
                  'What macro is most off target today?',
                  'Suggest one dinner idea for better balance.',
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
