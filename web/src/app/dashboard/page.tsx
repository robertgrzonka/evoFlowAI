'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useMutation, useQuery } from '@apollo/client';
import {
  ME_QUERY,
  WEEKLY_EVO_REVIEW_QUERY,
} from '@/lib/graphql/queries';
import { Camera, ChartColumnIncreasing, Dumbbell, Plus, Target, Trash2 } from 'lucide-react';
import { clearAuthToken, hasAuthToken } from '@/lib/auth-token';
import AppShell from '@/components/AppShell';
import AICoachAvatar from '@/components/AICoachAvatar';
import {
  ButtonSpinner,
  ListRowSkeleton,
  PageLoader,
  Skeleton,
  StatCardSkeleton,
} from '@/components/ui/loading';
import {
  DELETE_FOOD_ITEM_MUTATION,
  LOG_WORKOUT_MUTATION,
  UPSERT_DAILY_ACTIVITY_MUTATION,
} from '@/lib/graphql/mutations';
import { appToast } from '@/lib/app-toast';
import { buildDayRefetchQueries } from '@/lib/day-data';
import { useDaySnapshot } from '@/hooks/useDaySnapshot';
import { formatPrimaryGoal } from '@/lib/formatters';
import {
  AISectionHeader,
  EvoHintCard,
  EvoStatusBadge,
  HeroInsightCard,
  InsightEmptyState,
  NextBestActionCard,
} from '@/components/evo';
import Tooltip from '@/components/ui/atoms/Tooltip';

type StatTone = 'brand' | 'info' | 'success' | 'brandSoft';
type WorkoutIntensity = 'LOW' | 'MEDIUM' | 'HIGH';
type ActionTone = 'brand' | 'info' | 'success';

const buildDynamicGuidance = (input: {
  remainingCalories: number;
  remainingProtein: number;
  workoutCount: number;
  steps: number;
  tips?: string[];
}): string => {
  const { remainingCalories, remainingProtein, workoutCount, steps, tips = [] } = input;
  const nutritionTip = tips[0];
  const trainingTip = tips[1];
  const recoveryTip = tips[2];

  if (remainingCalories < -150) {
    if (remainingProtein > 20) {
      return nutritionTip || 'You are over calorie budget, but still short on protein. Keep the next meal small and protein-focused.';
    }
    return recoveryTip || 'You are over calorie budget today. Keep the rest of the day light and prioritize hydration plus recovery.';
  }

  if (remainingProtein > 35) {
    if (remainingCalories < 250) {
      return nutritionTip || 'Calories are limited, so use a lean protein meal to close the protein gap without overshooting.';
    }
    return nutritionTip || 'Main priority now is protein. Build your next meal around 30-40g protein, then fill with carbs as needed.';
  }

  if (remainingCalories > 500) {
    if (workoutCount > 0) {
      return trainingTip || 'You still have solid room today. A balanced post-training meal with protein and carbs fits well now.';
    }
    return nutritionTip || 'You have a lot of budget left. Go for a balanced meal now so you do not under-eat by the end of day.';
  }

  if (steps > 12000 && remainingCalories > 150) {
    return recoveryTip || 'Your activity is high today, so a moderate balanced meal is a good next move.';
  }

  if (remainingCalories > 150) {
    return nutritionTip || 'A moderate balanced meal fits well now. Keep portions controlled and finish protein target.';
  }

  return recoveryTip || 'Day is nearly closed. Keep the next intake light, protein-aware, and focus on recovery.';
};

const buildEvoPresenceLine = (input: {
  remainingCalories: number;
  remainingProtein: number;
  workoutCount: number;
  steps: number;
}): string => {
  const { remainingCalories, remainingProtein, workoutCount, steps } = input;
  if (remainingCalories < -150) return 'Evo status: Tight control mode.';
  if (remainingProtein > 30) return 'Evo status: Protein-first mode.';
  if (workoutCount > 0 && remainingCalories > 250) return 'Evo status: Refuel and recover mode.';
  if (steps > 12000) return 'Evo status: High-activity day mode.';
  return 'Evo status: Keep the momentum.';
};

const buildNextAction = (input: {
  remainingCalories: number;
  remainingProtein: number;
  mealsCount: number;
  workoutCount: number;
}): { title: string; description: string; targetPath: string; actionLabel: string } => {
  const { remainingCalories, remainingProtein, mealsCount, workoutCount } = input;
  if (remainingProtein > 35) {
    return {
      title: 'Close your protein gap first',
      description: `You still have around ${Math.round(remainingProtein)}g protein to hit. Build one protein-first meal now.`,
      targetPath: '/meals',
      actionLabel: 'Log protein-focused meal',
    };
  }
  if (remainingCalories < -150) {
    return {
      title: 'Stabilize intake for the rest of today',
      description: 'You are above today budget. Keep the next meal light and avoid random snacking.',
      targetPath: '/chat?channel=COACH',
      actionLabel: 'Ask Evo for correction plan',
    };
  }
  if (workoutCount === 0 && mealsCount >= 2 && remainingCalories > 350) {
    return {
      title: 'You still have room for useful movement',
      description: 'A short workout can improve energy balance and recovery quality for tomorrow.',
      targetPath: '/workouts',
      actionLabel: 'Log quick workout',
    };
  }
  return {
    title: 'Keep your current rhythm',
    description: 'You are in a decent place. One balanced meal and clean recovery will close the day well.',
    targetPath: '/chat?channel=COACH',
    actionLabel: 'Get Evo end-of-day plan',
  };
};

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [quickWorkoutTitle, setQuickWorkoutTitle] = useState('');
  const [quickWorkoutDuration, setQuickWorkoutDuration] = useState(35);
  const [quickWorkoutBurned, setQuickWorkoutBurned] = useState(250);
  const [quickWorkoutIntensity, setQuickWorkoutIntensity] = useState<WorkoutIntensity>('MEDIUM');
  const [quickSteps, setQuickSteps] = useState(6000);

  const { data: userData, loading: userLoading, error: userError } = useQuery(ME_QUERY);
  const daySnapshot = useDaySnapshot({
    date: today,
    enabled: Boolean(userData?.me),
    includeInsight: true,
  });
  const { data: weeklyReviewData, loading: weeklyReviewLoading } = useQuery(WEEKLY_EVO_REVIEW_QUERY, {
    variables: { endDate: today },
    skip: !userData?.me,
  });

  const [deleteFoodItem, { loading: deletingMeal }] = useMutation(DELETE_FOOD_ITEM_MUTATION, {
    onError: (error) => {
      appToast.error('Delete failed', error.message || 'Could not delete meal.');
    },
    refetchQueries: buildDayRefetchQueries(today),
  });
  const [logWorkout, { loading: quickWorkoutSaving }] = useMutation(LOG_WORKOUT_MUTATION, {
    onCompleted: () => {
      setQuickWorkoutTitle('');
      appToast.success('Workout added', 'New session was saved to your day.');
    },
    onError: (error) => {
      appToast.error('Save failed', error.message || 'Could not add workout.');
    },
    refetchQueries: buildDayRefetchQueries(today),
  });
  const [upsertDailyActivity, { loading: savingSteps }] = useMutation(UPSERT_DAILY_ACTIVITY_MUTATION, {
    onCompleted: () => {
      appToast.success('Activity updated', 'Steps were saved for daily tracking.');
    },
    onError: (error) => {
      appToast.error('Save failed', error.message || 'Could not update daily activity.');
    },
    refetchQueries: buildDayRefetchQueries(today),
  });

  useEffect(() => {
    setMounted(true);

    if (!hasAuthToken()) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (userError) {
      appToast.error('Session expired', 'Please login again.');
      clearAuthToken();
      router.push('/login');
    }
  }, [userError, router]);

  useEffect(() => {
    const steps = daySnapshot.activity?.steps;
    if (steps !== undefined && steps !== null) {
      setQuickSteps(Number(steps));
    }
  }, [daySnapshot.activity?.steps]);

  if (!mounted || userLoading) {
    return <PageLoader />;
  }

  const user = userData?.me;
  const stats = daySnapshot.stats;
  const workouts = daySnapshot.workouts || [];
  const insight = daySnapshot.insight;
  const activity = daySnapshot.activity;
  const weeklyReview = weeklyReviewData?.weeklyEvoReview;
  const goalProgress = stats?.goalProgress || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const completedMeals = stats?.meals?.length || 0;
  const totalTrainingMinutes = daySnapshot.derived.workoutMinutes;
  const dailyTrainingLabel = workouts.length > 0
    ? `${workouts.length} session${workouts.length > 1 ? 's' : ''} • ${totalTrainingMinutes} min`
    : 'No sessions';

  const guidance = insight
    ? buildDynamicGuidance({
        remainingCalories: insight.remainingCalories,
        remainingProtein: insight.remainingProtein,
        workoutCount: daySnapshot.derived.workoutCount,
        steps: daySnapshot.derived.steps,
        tips: insight.tips,
      })
    : 'Log meals and workouts to unlock daily guidance.';
  const evoPresence = insight
    ? buildEvoPresenceLine({
        remainingCalories: insight.remainingCalories,
        remainingProtein: insight.remainingProtein,
        workoutCount: daySnapshot.derived.workoutCount,
        steps: daySnapshot.derived.steps,
      })
    : 'Evo status: Waiting for enough data.';

  const progressTone = insight
    ? insight.remainingProtein <= 10 && insight.remainingCalories >= -100
      ? 'On track'
      : insight.remainingCalories < -100
        ? 'Watch intake'
        : 'In progress'
    : 'In progress';

  const categorizedTips = [
    { label: 'Nutrition notice', tip: insight?.tips?.[0] || 'Prioritize protein and balanced carbs in your next meal.' },
    { label: 'Training notice', tip: insight?.tips?.[1] || 'Keep training quality high and avoid overdoing volume late in the day.' },
    { label: 'Recovery notice', tip: insight?.tips?.[2] || 'Hydrate and support recovery with micronutrient-dense foods.' },
  ];
  const nextAction = buildNextAction({
    remainingCalories: Number(insight?.remainingCalories || 0),
    remainingProtein: Number(insight?.remainingProtein || 0),
    mealsCount: completedMeals,
    workoutCount: daySnapshot.derived.workoutCount,
  });

  const handleDeleteMeal = async (mealId: string) => {
    const confirmed = window.confirm('Delete this meal entry?');
    if (!confirmed) return;

    const result = await deleteFoodItem({ variables: { id: mealId } });
    if (result.data?.deleteFoodItem) {
      appToast.success('Meal deleted', 'Entry was removed from your day.');
    } else {
      appToast.error('Delete failed', 'Could not delete meal.');
    }
  };

  const handleQuickWorkout = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!quickWorkoutTitle.trim()) {
      appToast.info('Workout title missing', 'Enter workout name before saving.');
      return;
    }

    await logWorkout({
      variables: {
        input: {
          title: quickWorkoutTitle.trim(),
          durationMinutes: Number(quickWorkoutDuration),
          caloriesBurned: Number(quickWorkoutBurned),
          intensity: quickWorkoutIntensity,
          performedAt: new Date().toISOString(),
        },
      },
    });
  };

  const handleQuickSteps = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!Number.isFinite(quickSteps) || quickSteps < 0 || quickSteps > 120000) {
      appToast.info('Invalid steps', 'Steps must be between 0 and 120000.');
      return;
    }

    await upsertDailyActivity({
      variables: {
        input: {
          date: today,
          steps: Math.round(quickSteps),
        },
      },
    });
  };

  return (
    <AppShell>
      <div className="space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary mb-1.5">
            Welcome back, {user?.name || 'there'}!
          </h2>
          <p className="max-w-2xl text-sm text-text-secondary">
            One place for meals, training, and next steps from Evo.
          </p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.03, ease: 'easeOut' }}
          className="bg-surface rounded-xl border border-border p-4 md:p-5"
        >
          <AISectionHeader
            eyebrow="Mission control"
            title="Evo daily brief"
            subtitle="How you are doing, what is drifting, and what to do right now."
            status={<EvoStatusBadge label={progressTone} tone={progressTone === 'On track' ? 'success' : progressTone === 'Watch intake' ? 'warning' : 'focus'} />}
            rightAction={<AICoachAvatar size="md" />}
          />

          {daySnapshot.loading ? (
            <div className="space-y-2.5">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ) : insight ? (
            <div className="space-y-4">
              <HeroInsightCard
                title="Main insight"
                insight={insight.summary}
                supportLine={evoPresence}
                cta={
                  <NextBestActionCard
                    title={nextAction.title}
                    description={nextAction.description}
                    actionLabel={nextAction.actionLabel}
                    onAction={() => router.push(nextAction.targetPath)}
                  />
                }
              >
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  <EmojiMetric emoji="🎯" value={formatPrimaryGoal(String(user?.preferences?.primaryGoal || 'MAINTENANCE'))} tooltip="Goal mode" />
                  <EmojiMetric emoji="🍽️" value={`${completedMeals} meals`} tooltip="Meals today" />
                  <EmojiMetric emoji="🏋️" value={`${daySnapshot.derived.workoutCount} • ${totalTrainingMinutes} min`} tooltip={`Training today (${dailyTrainingLabel})`} />
                  <EmojiMetric emoji="⚖️" value={`${insight.netCalories.toFixed(0)} kcal`} tooltip="Net calories (food - workouts)" />
                  <EmojiMetric emoji="🔥" value={`${insight.remainingCalories.toFixed(0)} kcal`} tooltip="Calories left for today" />
                  <EmojiMetric emoji="🥚" value={`${Math.max(0, insight.remainingProtein).toFixed(0)} g`} tooltip="Protein left for today" />
                </div>
              </HeroInsightCard>

              <EvoHintCard title="Quick read from Evo" content={guidance} tone="notice" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {categorizedTips.map((item) => (
                  <EvoHintCard key={item.label} title={item.label} content={item.tip} tone="positive" />
                ))}
              </div>
            </div>
          ) : (
            <InsightEmptyState
              title="Evo is waiting for enough context"
              description="Log at least one meal or workout and Evo will build a focused daily brief."
              actionLabel="Open meals"
              onAction={() => router.push('/meals')}
            />
          )}
        </motion.section>

        <section className="bg-surface rounded-xl border border-border p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold tracking-tight text-text-primary">Weekly Evo review</h3>
            <span className="text-xs text-text-secondary">Last 7 days</span>
          </div>
          {weeklyReviewLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ) : weeklyReview ? (
            !weeklyReview.isCompleteWeek ? (
              <div className="rounded-lg border border-dashed border-border bg-surface-elevated p-3.5">
                <p className="text-sm text-text-primary font-medium mb-1">Evo is collecting weekly data</p>
                <p className="text-sm text-text-secondary">
                  Data has been collected for <span className="font-semibold text-text-primary">{weeklyReview.trackedDays}/7</span> days.
                  Once the full week is complete, you will see the full weekly review with scores and recommendations.
                </p>
              </div>
            ) : (
            <div className="space-y-3">
              <p className="text-sm text-text-secondary">{weeklyReview.summary}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <ScorePill label="Nutrition" score={weeklyReview.nutritionScore} />
                <ScorePill label="Training" score={weeklyReview.trainingScore} />
                <ScorePill label="Consistency" score={weeklyReview.consistencyScore} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {weeklyReview.highlights.map((highlight: string) => (
                  <div key={highlight} className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-secondary">
                    {highlight}
                  </div>
                ))}
              </div>
            </div>
            )
          ) : (
            <p className="text-sm text-text-secondary">Weekly review will appear after more logs.</p>
          )}
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <section className="xl:col-span-8 space-y-4">
            <div className="bg-surface rounded-xl border border-border p-4 md:p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-text-primary">Today goals</h3>
                  <p className="text-sm text-text-secondary">Dynamic daily target and progress for {today}</p>
                </div>
                <button onClick={() => router.push('/goals')} className="btn-secondary">
                  Set Goals
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3">
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
                      hoverHint={buildGoalHoverHint({
                        title: 'Calories',
                        value: Number(stats?.totalCalories || 0),
                        goal: Number(stats?.dynamicGoals?.calories || user?.preferences?.dailyCalorieGoal || 2000),
                        unit: 'kcal',
                      })}
                    />
                    <StatCard
                      title="Protein"
                      value={stats?.totalProtein?.toFixed(1) || '0'}
                      goal={stats?.dynamicGoals?.protein || user?.preferences?.proteinGoal || undefined}
                      progress={goalProgress.protein}
                      unit="g"
                      tone="info"
                      hoverHint={buildGoalHoverHint({
                        title: 'Protein',
                        value: Number(stats?.totalProtein || 0),
                        goal: Number(stats?.dynamicGoals?.protein || user?.preferences?.proteinGoal || 0),
                        unit: 'g',
                      })}
                    />
                    <StatCard
                      title="Carbs"
                      value={stats?.totalCarbs?.toFixed(1) || '0'}
                      goal={stats?.dynamicGoals?.carbs || user?.preferences?.carbsGoal || undefined}
                      progress={goalProgress.carbs}
                      unit="g"
                      tone="success"
                      hoverHint={buildGoalHoverHint({
                        title: 'Carbs',
                        value: Number(stats?.totalCarbs || 0),
                        goal: Number(stats?.dynamicGoals?.carbs || user?.preferences?.carbsGoal || 0),
                        unit: 'g',
                      })}
                    />
                    <StatCard
                      title="Fat"
                      value={stats?.totalFat?.toFixed(1) || '0'}
                      goal={stats?.dynamicGoals?.fat || user?.preferences?.fatGoal || undefined}
                      progress={goalProgress.fat}
                      unit="g"
                      tone="brandSoft"
                      hoverHint={buildGoalHoverHint({
                        title: 'Fat',
                        value: Number(stats?.totalFat || 0),
                        goal: Number(stats?.dynamicGoals?.fat || user?.preferences?.fatGoal || 0),
                        unit: 'g',
                      })}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="bg-surface rounded-xl border border-border p-4 md:p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold tracking-tight text-text-primary">Quick actions</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <ActionCard
                  icon={<Camera />}
                  title="Meals"
                  description="Describe meal or add photo"
                  onClick={() => router.push('/meals')}
                  tone="brand"
                />
                <ActionCard
                  icon={<ChartColumnIncreasing />}
                  title="View Stats"
                  description="Review history by day"
                  onClick={() => router.push('/stats')}
                  tone="info"
                />
                <ActionCard
                  icon={<Target />}
                  title="Goal Settings"
                  description="Adjust kcal and macros"
                  onClick={() => router.push('/goals')}
                  tone="success"
                />
              </div>
            </div>

            <div className="bg-surface rounded-xl border border-border p-4 md:p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold tracking-tight text-text-primary">Today meals</h3>
                <button onClick={() => router.push('/meals')} className="text-info-400 hover:text-info-300 text-sm transition-colors">
                  Open Meals
                </button>
              </div>
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
                        <p className="font-semibold text-text-primary">{meal.nutrition.calories.toFixed(0)} kcal</p>
                        <p className="text-sm text-text-secondary">
                          P: {meal.nutrition.protein.toFixed(0)}g • C: {meal.nutrition.carbs.toFixed(0)}g • F: {meal.nutrition.fat.toFixed(0)}g
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Camera className="h-12 w-12 text-text-muted mx-auto mb-3" />
                  <p className="text-text-secondary mb-4">No meals logged today</p>
                  <button onClick={() => router.push('/meals')} className="btn-primary inline-flex items-center space-x-2 px-4">
                    <Camera className="h-4 w-4" />
                    <span>Log first meal</span>
                  </button>
                </div>
              )}
            </div>
          </section>

          <aside className="xl:col-span-4 space-y-4">
            <section className="bg-surface rounded-xl border border-border p-4 md:p-5">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-base font-semibold tracking-tight text-text-primary">Quick add workout</h3>
                <button onClick={() => router.push('/workouts')} className="text-amber-300 hover:text-amber-200 text-xs transition-colors">
                  Full page
                </button>
              </div>
              <form onSubmit={handleQuickWorkout} className="space-y-3">
                <input
                  value={quickWorkoutTitle}
                  onChange={(event) => setQuickWorkoutTitle(event.target.value)}
                  placeholder="e.g. Running or Push workout"
                  className="input-field w-full"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min={1}
                    value={quickWorkoutDuration}
                    onChange={(event) => setQuickWorkoutDuration(Number(event.target.value))}
                    className="input-field w-full"
                    placeholder="minutes"
                  />
                  <input
                    type="number"
                    min={0}
                    value={quickWorkoutBurned}
                    onChange={(event) => setQuickWorkoutBurned(Number(event.target.value))}
                    className="input-field w-full"
                    placeholder="kcal"
                  />
                </div>
                <select
                  value={quickWorkoutIntensity}
                  onChange={(event) => setQuickWorkoutIntensity(event.target.value as WorkoutIntensity)}
                  className="input-field w-full"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
                <button type="submit" disabled={quickWorkoutSaving} className="btn-primary w-full inline-flex items-center justify-center gap-2">
                  {quickWorkoutSaving ? (
                    <>
                      <ButtonSpinner />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add workout
                    </>
                  )}
                </button>
              </form>
            </section>

            <section className="bg-surface rounded-xl border border-border p-4 md:p-5">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-base font-semibold tracking-tight text-text-primary">Daily steps</h3>
                <span className="text-xs text-text-secondary">Tracked only</span>
              </div>
              <form onSubmit={handleQuickSteps} className="space-y-3">
                <input
                  type="number"
                  min={0}
                  max={120000}
                  value={quickSteps}
                  onChange={(event) => setQuickSteps(Number(event.target.value))}
                  className="input-field w-full"
                  placeholder="Steps today"
                />
                <button type="submit" disabled={savingSteps} className="btn-secondary w-full inline-flex items-center justify-center gap-2">
                  {savingSteps ? (
                    <>
                      <ButtonSpinner />
                      Saving steps...
                    </>
                  ) : (
                    'Save steps'
                  )}
                </button>
              </form>
            </section>

            <section className="bg-surface rounded-xl border border-border p-4 md:p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold tracking-tight text-text-primary">Today training</h3>
                <button onClick={() => router.push('/workouts')} className="text-xs text-text-secondary hover:text-text-primary transition-colors">
                  See all
                </button>
              </div>
              {daySnapshot.loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              ) : workouts.length > 0 ? (
                <div className="space-y-2">
                  {workouts.map((workout: any) => (
                    <div key={workout.id} className="rounded-lg border border-border bg-surface-elevated px-3 py-2.5">
                      <p className="text-sm font-semibold text-text-primary">{workout.title}</p>
                      <p className="text-xs text-text-secondary mt-1">
                        {workout.durationMinutes} min • {workout.caloriesBurned} kcal • {String(workout.intensity || '').toLowerCase()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-3 text-sm text-text-secondary">
                  No workouts yet today.
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({
  title,
  value,
  goal,
  progress,
  unit,
  tone,
  hoverHint,
}: {
  title: string;
  value: string;
  goal?: number;
  progress: number;
  unit: string;
  tone: StatTone;
  hoverHint?: string;
}) {
  const percentage = goal ? (parseFloat(value) / goal) * 100 : progress;
  const toneStyles = {
    brand: {
      value: 'text-primary-500',
      bar: 'bg-primary-500',
      tooltip: 'border-primary-500/45 text-primary-200',
    },
    info: {
      value: 'text-info-500',
      bar: 'bg-info-500',
      tooltip: 'border-info-500/45 text-info-200',
    },
    success: {
      value: 'text-success-500',
      bar: 'bg-success-500',
      tooltip: 'border-success-500/45 text-success-200',
    },
    brandSoft: {
      value: 'text-primary-300',
      bar: 'bg-primary-300',
      tooltip: 'border-primary-300/55 text-primary-100',
    },
  } satisfies Record<StatTone, { value: string; bar: string; tooltip: string }>;
  
  const cardContent = (
    <div className="bg-surface rounded-xl border border-border p-5">
      <h3 className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-text-muted">{title}</h3>
      <div className="mb-3 flex items-baseline space-x-2">
        <span className={`text-2xl font-semibold tracking-tight ${toneStyles[tone].value}`}>{value}</span>
        <span className="text-xs text-text-secondary">{unit}</span>
      </div>
      {goal && (
        <p className="text-xs text-text-muted mb-2">Goal: {goal} {unit}</p>
      )}
      <div className="w-full bg-background/60 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${toneStyles[tone].bar}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <p className="text-xs text-text-muted mt-1">{percentage.toFixed(0)}% of goal</p>
    </div>
  );

  if (!hoverHint) {
    return cardContent;
  }
  const cleanHint = hoverHint.replace(/^Evo hint:\s*/i, '');

  return (
    <Tooltip
      content={
        <span className="leading-snug">
          <span className="font-semibold">Evo hint:</span> {cleanHint}
        </span>
      }
      inline={false}
      className={toneStyles[tone].tooltip}
    >
      <div tabIndex={0} aria-label={hoverHint}>
        {cardContent}
      </div>
    </Tooltip>
  );
}

function ActionCard({
  icon,
  title,
  description,
  onClick,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  tone: ActionTone;
}) {
  const accents = {
    brand: 'border-primary-500/30 bg-primary-500/10 text-primary-500',
    info: 'border-info-500/30 bg-info-500/10 text-info-500',
    success: 'border-success-500/30 bg-success-500/10 text-success-500',
  } satisfies Record<ActionTone, string>;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.995 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-xl p-4 text-left group min-h-[122px] bg-surface-elevated border border-border hover:border-border-light"
    >
      <div className="relative z-10 flex h-full flex-col items-start">
        <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-full border [&>svg]:h-[16px] [&>svg]:w-[16px] [&>svg]:stroke-[1.9] ${accents[tone]}`}>
          {icon}
        </div>
        <h3 className="text-base font-semibold tracking-tight text-text-primary mb-1">{title}</h3>
        <p className="text-text-secondary text-sm">{description}</p>
      </div>
      <div className="absolute inset-0 bg-background/0 group-hover:bg-surface-elevated/40 transition-colors duration-150 ease-out" />
    </motion.button>
  );
}

function EmojiMetric({ emoji, value, tooltip }: { emoji: string; value: string; tooltip: string }) {
  return (
    <Tooltip content={tooltip} inline={false}>
      <div
        tabIndex={0}
        aria-label={tooltip}
        className="relative cursor-help rounded-lg border border-border bg-surface-elevated px-2.5 py-2 text-center after:absolute after:right-1.5 after:top-1 after:text-[10px] after:text-text-muted after:content-['?'] after:opacity-80"
      >
        <p className="text-sm">{emoji}</p>
        <p className="text-xs font-semibold text-text-primary truncate mt-1">{value}</p>
      </div>
    </Tooltip>
  );
}

function ScorePill({ label, score }: { label: string; score: number }) {
  const tone = score >= 75 ? 'text-success-400' : score >= 55 ? 'text-info-400' : 'text-amber-300';
  return (
    <div className="rounded-lg border border-border bg-surface-elevated px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted">{label}</p>
      <p className={`text-lg font-semibold mt-1 ${tone}`}>{score}/100</p>
    </div>
  );
}

function buildGoalHoverHint(input: {
  title: 'Calories' | 'Protein' | 'Carbs' | 'Fat';
  value: number;
  goal: number;
  unit: 'kcal' | 'g';
}) {
  const { title, value, goal, unit } = input;
  if (!goal || goal <= 0) {
    return 'Add more day data and I will provide a precise recommendation.';
  }

  const ratio = value / goal;
  const remaining = Math.max(0, goal - value);

  if (title === 'Calories') {
    if (ratio > 1.05) return `You are over by ${Math.round(value - goal)} ${unit}. Keep next meal lighter and protein-focused.`;
    if (ratio < 0.65) return `You still have around ${Math.round(remaining)} ${unit}. Add a balanced meal to avoid underfueling.`;
    return 'Calorie pace is solid. Keep portions controlled and close the day clean.';
  }

  if (title === 'Protein') {
    if (ratio < 0.7) return `Around ${Math.round(remaining)} ${unit} left. Prioritize lean protein now (skyr, chicken, fish).`;
    if (ratio > 1.15) return 'Protein is already above target. Shift next meal toward vegetables and quality carbs.';
    return 'Protein pace looks good. One moderate protein portion should close the target.';
  }

  if (title === 'Carbs') {
    if (ratio < 0.7) return `About ${Math.round(remaining)} ${unit} left. Use quality carbs around activity (rice, oats, potatoes).`;
    if (ratio > 1.1) return 'Carbs are running high. Keep next meal lower-carb and higher in protein/fiber.';
    return 'Carbs are on track. Keep sources mostly whole-food and easy to digest.';
  }

  if (ratio < 0.7) {
    return `About ${Math.round(remaining)} ${unit} left. Prefer healthy fats like olive oil, nuts, seeds, or fatty fish.`;
  }
  if (ratio > 1.1) {
    return 'Fat is above target. Keep next meal leaner and watch hidden oils/sauces.';
  }
  return 'Fat looks balanced. Keep quality sources and stable portions.';
}

