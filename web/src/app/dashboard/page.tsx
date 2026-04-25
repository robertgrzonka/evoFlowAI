'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import {
  ME_QUERY,
  ROLLING_SEVEN_DAY_AVERAGE_STEPS_QUERY,
  WEEKLY_EVO_REVIEW_QUERY,
} from '@/lib/graphql/queries';
import { Camera, ChartColumnIncreasing, Dumbbell, Plus, Target, Trash2 } from 'lucide-react';
import { clearAuthToken, hasAuthToken } from '@/lib/auth-token';
import { clearApolloClientCache } from '@/lib/apollo-client';
import AppShell from '@/components/AppShell';
import { useAppShellLayout } from '@/components/app-shell-layout';
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
  EvoStatusBadge,
  EvoThinkingOverlay,
  HeroInsightCard,
  InsightEmptyState,
  NextBestActionCard,
} from '@/components/evo';
import Tooltip from '@/components/ui/atoms/Tooltip';
import { accentEdgeClasses } from '@/components/ui/accent-cards';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { getDestructiveConfirmLabels } from '@/lib/i18n/destructive-confirm';
import { graphqlAppLocaleToUi } from '@/lib/i18n/ui-locale';
import {
  buildDashboardGoalHoverHint,
  getDashboardStrings,
  resolveDashboardInsightNextActionPath,
} from '@/lib/i18n/copy/dashboard';

type StatTone = 'brand' | 'info' | 'success' | 'brandSoft';
type WorkoutIntensity = 'LOW' | 'MEDIUM' | 'HIGH';
type ActionTone = 'brand' | 'info' | 'success';

export default function DashboardPage() {
  const client = useApolloClient();
  const router = useRouter();
  const { sidebarCollapsed } = useAppShellLayout();
  const [mounted, setMounted] = useState(false);
  const { dateKey: today, timeZone } = useClientCalendarToday();
  const [quickWorkoutTitle, setQuickWorkoutTitle] = useState('');
  const [quickWorkoutDuration, setQuickWorkoutDuration] = useState(35);
  const [quickWorkoutBurned, setQuickWorkoutBurned] = useState(250);
  const [quickWorkoutIntensity, setQuickWorkoutIntensity] = useState<WorkoutIntensity>('MEDIUM');
  const [quickSteps, setQuickSteps] = useState(6000);
  const [deleteMealId, setDeleteMealId] = useState<string | null>(null);

  const { data: userData, loading: userLoading, error: userError } = useQuery(ME_QUERY);
  const daySnapshot = useDaySnapshot({
    date: today,
    clientTimeZone: timeZone,
    enabled: Boolean(userData?.me),
    includeInsight: true,
  });
  const { data: weeklyReviewData, loading: weeklyReviewLoading } = useQuery(WEEKLY_EVO_REVIEW_QUERY, {
    variables: { endDate: today },
    skip: !userData?.me,
  });
  const { data: rollingStepsData } = useQuery(ROLLING_SEVEN_DAY_AVERAGE_STEPS_QUERY, {
    variables: { endDate: today, clientTimeZone: timeZone },
    skip: !userData?.me,
    fetchPolicy: 'cache-and-network',
  });

  const [deleteFoodItem, { loading: deletingMeal }] = useMutation(DELETE_FOOD_ITEM_MUTATION, {
    onCompleted: () => {
      kickDeferredAfterMealLog(client);
    },
    onError: (error) => {
      appToast.error('Delete failed', error.message || 'Could not delete meal.');
    },
    refetchQueries: [...buildDayRefetchQueriesAfterLog(today, timeZone)],
    awaitRefetchQueries: true,
  });
  const [logWorkout, { loading: quickWorkoutSaving }] = useMutation(LOG_WORKOUT_MUTATION, {
    onCompleted: () => {
      setQuickWorkoutTitle('');
      kickDeferredAfterWorkoutLog(client);
      appToast.success('Workout added', 'New session was saved to your day.');
    },
    onError: (error) => {
      appToast.error('Save failed', error.message || 'Could not add workout.');
    },
    refetchQueries: [...buildDayRefetchQueriesAfterLog(today, timeZone)],
    awaitRefetchQueries: true,
  });
  const [upsertDailyActivity, { loading: savingSteps }] = useMutation(UPSERT_DAILY_ACTIVITY_MUTATION, {
    onCompleted: () => {
      kickDeferredDashboardAndWeeklyEvo(client);
      appToast.success('Activity updated', 'Steps were saved for daily tracking.');
    },
    onError: (error) => {
      appToast.error('Save failed', error.message || 'Could not update daily activity.');
    },
    refetchQueries: [
      ...buildDayRefetchQueriesAfterLog(today, timeZone),
      buildRollingSevenDayAverageStepsRefetch(today, timeZone),
    ],
    awaitRefetchQueries: true,
  });

  useEffect(() => {
    setMounted(true);

    if (!hasAuthToken()) {
      router.push('/login');
    }
  }, [router]);

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
    const steps = daySnapshot.activity?.steps;
    if (steps !== undefined && steps !== null) {
      setQuickSteps(Number(steps));
    }
  }, [daySnapshot.activity?.steps]);

  if (!mounted || userLoading) {
    return <PageLoader />;
  }

  const user = userData?.me;
  const locale = graphqlAppLocaleToUi(user?.preferences?.appLocale);
  const d = getDashboardStrings(locale);
  const rollingStepsAvg = Number(rollingStepsData?.rollingSevenDayAverageSteps ?? 0);
  const steps7Display = new Intl.NumberFormat(locale === 'pl' ? 'pl-PL' : 'en-US').format(
    rollingStepsAvg
  );
  const delLabels = getDestructiveConfirmLabels(locale);
  const stats = daySnapshot.stats;
  const workouts = daySnapshot.workouts || [];
  const insight = daySnapshot.insight;
  const activity = daySnapshot.activity;
  const weeklyReview = weeklyReviewData?.weeklyEvoReview;
  const goalProgress = stats?.goalProgress || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const completedMeals = stats?.meals?.length || 0;
  const totalTrainingMinutes = daySnapshot.derived.workoutMinutes;
  const dailyTrainingLabel =
    workouts.length > 0
      ? `${workouts.length} ${workouts.length > 1 ? d.sessionsMany : d.sessionsOne} • ${totalTrainingMinutes} min`
      : d.noSessions;

  const tipsFromAi = (insight?.tips || []).map((t) => String(t || '').trim()).filter(Boolean);
  const hasAiBrief =
    Boolean(insight) &&
    String(insight?.summary || '').trim().length >= 20 &&
    tipsFromAi.length === 3 &&
    tipsFromAi.every((t) => t.length >= 12);

  const progressTone = insight
    ? insight.remainingProtein <= 10 && insight.remainingCalories >= -100
      ? d.progressOnTrack
      : insight.remainingCalories < -100
        ? d.progressWatch
        : d.progressInProgress
    : d.progressInProgress;

  const categorizedTips = hasAiBrief
    ? [
        { label: d.tipNutrition, tip: tipsFromAi[0] },
        { label: d.tipTraining, tip: tipsFromAi[1] },
        { label: d.tipRecovery, tip: tipsFromAi[2] },
      ]
    : [];
  const aiNext = insight?.nextAction;
  const nextAction =
    aiNext &&
    typeof aiNext.title === 'string' &&
    aiNext.title.trim() &&
    typeof aiNext.description === 'string' &&
    aiNext.description.trim() &&
    typeof aiNext.actionLabel === 'string' &&
    aiNext.actionLabel.trim() &&
    aiNext.target
      ? {
          title: aiNext.title.trim(),
          description: aiNext.description.trim(),
          actionLabel: aiNext.actionLabel.trim(),
          targetPath: resolveDashboardInsightNextActionPath(String(aiNext.target)),
        }
      : {
          title: d.nextActionOpenChatTitle,
          description: d.nextActionOpenChatDesc,
          actionLabel: d.nextActionOpenChatLabel,
          targetPath: '/chat?channel=COACH',
        };

  const metricsGrid =
    insight ? (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
        <EmojiMetric
          emoji="🎯"
          value={formatPrimaryGoal(String(user?.preferences?.primaryGoal || 'maintenance'), locale)}
          tooltip={d.metricGoal}
        />
        <EmojiMetric
          emoji="🍽️"
          value={`${completedMeals} ${d.mealsLoggedWord}`}
          tooltip={d.metricMealsToday}
        />
        <EmojiMetric
          emoji="🏋️"
          value={`${daySnapshot.derived.workoutCount} • ${totalTrainingMinutes} min`}
          tooltip={`${d.metricTrainingToday} (${dailyTrainingLabel})`}
        />
        <EmojiMetric emoji="👟" value={steps7Display} tooltip={d.metricSteps7d} />
        <EmojiMetric emoji="🔥" value={`${insight.remainingCalories.toFixed(0)} kcal`} tooltip={d.metricKcalLeft} />
        <EmojiMetric emoji="🥚" value={`${Math.max(0, insight.remainingProtein).toFixed(0)} g`} tooltip={d.metricProteinLeft} />
      </div>
    ) : null;

  const handleConfirmDeleteMeal = async () => {
    if (!deleteMealId) return;
    const id = deleteMealId;
    setDeleteMealId(null);
    const result = await deleteFoodItem({ variables: { id } });
    if (result.data?.deleteFoodItem) {
      appToast.success('Meal deleted', 'Entry was removed from your day.');
    } else {
      appToast.error('Delete failed', 'Could not delete meal.');
    }
  };

  const handleQuickWorkout = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!quickWorkoutTitle.trim()) {
      appToast.info('Workout title missing', d.workoutTitleMissing);
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
      appToast.info('Invalid steps', d.invalidSteps);
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
      <ConfirmDialog
        open={deleteMealId !== null}
        title={d.deleteMeal}
        description={d.confirmDeleteMeal}
        confirmLabel={delLabels.confirm}
        cancelLabel={delLabels.cancel}
        onCancel={() => setDeleteMealId(null)}
        onConfirm={() => void handleConfirmDeleteMeal()}
        confirmBusy={deletingMeal}
        variant="danger"
      />
      <EvoThinkingOverlay
        open={daySnapshot.insightBootstrapping || quickWorkoutSaving}
        locale={locale}
        intent={daySnapshot.insightBootstrapping ? 'default' : 'workout'}
      />
      <div className="space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary mb-1.5">
            {d.welcomeName(user?.name || 'there')}
          </h2>
          <p className="max-w-2xl text-sm text-text-secondary">{d.welcomeSub}</p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.03, ease: 'easeOut' }}
          className={clsx(
            'bg-surface rounded-xl border border-border p-4 md:p-5 shadow-sm shadow-black/5',
            accentEdgeClasses('primary', 'left'),
          )}
        >
          <AISectionHeader
            eyebrow={d.missionEyebrow}
            title={d.dailyBriefTitle}
            subtitle={d.dailyBriefSubtitle}
            status={
              <EvoStatusBadge
                label={progressTone}
                tone={
                  progressTone === d.progressOnTrack ? 'success' : progressTone === d.progressWatch ? 'warning' : 'focus'
                }
              />
            }
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
              {!hasAiBrief && !daySnapshot.insightBootstrapping ? (
                <EvoHintCard
                  title={d.insightBriefFailedTitle}
                  content={d.insightBriefFailedBody}
                  tone="warning"
                  action={
                    <button type="button" className="btn-info text-sm" onClick={() => void daySnapshot.refetchDay()}>
                      {d.refetchBriefLabel}
                    </button>
                  }
                />
              ) : null}
              {hasAiBrief ? (
                <HeroInsightCard
                  layout="split"
                  title={d.mainInsight}
                  insight={insight.summary}
                  supportLine={insight.supportLine?.trim() || undefined}
                  cta={
                    <NextBestActionCard
                      fillHeight
                      eyebrow={d.nextStepEyebrow}
                      title={nextAction.title}
                      description={nextAction.description}
                      actionLabel={nextAction.actionLabel}
                      onAction={() => router.push(nextAction.targetPath)}
                    />
                  }
                >
                  {metricsGrid}
                </HeroInsightCard>
              ) : !daySnapshot.insightBootstrapping ? (
                <div
                  className={clsx(
                    'rounded-xl border border-border bg-surface p-4 md:p-5 shadow-sm shadow-black/5',
                    accentEdgeClasses('info', 'left'),
                  )}
                >
                  <p className="text-xs uppercase tracking-[0.12em] text-text-muted mb-3">{d.mainInsight}</p>
                  {metricsGrid}
                  <div className="mt-4 max-w-md">
                    <NextBestActionCard
                      eyebrow={d.nextStepEyebrow}
                      title={nextAction.title}
                      description={nextAction.description}
                      actionLabel={nextAction.actionLabel}
                      onAction={() => router.push(nextAction.targetPath)}
                    />
                  </div>
                </div>
              ) : null}

              {hasAiBrief ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 2xl:gap-4 w-full">
                  {categorizedTips.map((item) => (
                    <EvoHintCard key={item.label} title={item.label} content={item.tip} tone="positive" />
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <InsightEmptyState
              title={d.emptyTitle}
              description={d.emptyDesc}
              actionLabel={d.emptyAction}
              onAction={() => router.push('/meals')}
            />
          )}
        </motion.section>

        <section
          className={clsx(
            'bg-surface rounded-xl border border-border p-4 md:p-5 shadow-sm shadow-black/5',
            accentEdgeClasses('info', 'left'),
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold tracking-tight text-text-primary">{d.weeklyTitle}</h3>
            <span className="text-xs text-text-secondary">{d.weeklyLast7}</span>
          </div>
          {weeklyReviewLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ) : weeklyReview ? (
            <div className="space-y-3">
              {!weeklyReview.isCompleteWeek ? (
                <div className="rounded-lg border border-dashed border-primary-500/30 bg-primary-500/5 px-3 py-2">
                  <p className="text-xs text-primary-200">{d.weeklyPartial(weeklyReview.availableDays, weeklyReview.trackedDays)}</p>
                </div>
              ) : null}
              {weeklyReview.summary?.trim() ? (
                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{weeklyReview.summary}</p>
              ) : (
                <p className="text-sm text-text-muted">{d.weeklyNarrativePending}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <ScorePill label={d.scoreNutrition} score={weeklyReview.nutritionScore} />
                <ScorePill label={d.scoreTraining} score={weeklyReview.trainingScore} />
                <ScorePill label={d.scoreConsistency} score={weeklyReview.consistencyScore} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 2xl:gap-4 w-full">
                {weeklyReview.highlights.map((highlight: string) => (
                  <div
                    key={highlight}
                    className={clsx(
                      'rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-secondary shadow-sm shadow-black/5',
                      accentEdgeClasses('success', 'left'),
                    )}
                  >
                    {highlight}
                  </div>
                ))}
              </div>
              {weeklyReview.proTip?.trim() ? (
                <div className="rounded-xl border border-primary-500/25 bg-gradient-to-br from-primary-500/10 via-surface-elevated/80 to-amber-400/5 px-4 py-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-200/95 mb-1.5">{d.proTip}</p>
                  <p className="text-sm text-text-primary leading-snug">{weeklyReview.proTip}</p>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">{d.weeklyEmpty}</p>
          )}
        </section>

        <div
          className={clsx(
            'grid grid-cols-1 gap-4 lg:grid-cols-12',
            sidebarCollapsed && '2xl:gap-6'
          )}
        >
          <section className={clsx('space-y-4', sidebarCollapsed ? 'lg:col-span-8 2xl:col-span-9' : 'lg:col-span-8')}>
            <div
              className={clsx(
                'bg-surface rounded-xl border border-border p-4 md:p-5 shadow-sm shadow-black/5',
                accentEdgeClasses('success', 'left'),
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-text-primary">{d.todayGoals}</h3>
                  <p className="text-sm text-text-secondary">{d.todayGoalsSub(today)}</p>
                </div>
                <button type="button" onClick={() => router.push('/goals')} className="btn-info">
                  {d.setGoals}
                </button>
              </div>
              <div
                className={clsx(
                  'grid grid-cols-1 sm:grid-cols-2 gap-3',
                  sidebarCollapsed ? 'lg:grid-cols-4' : 'lg:grid-cols-2 xl:grid-cols-4'
                )}
              >
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
                      ui={d}
                      title={d.statCalories}
                      value={stats?.totalCalories?.toFixed(0) || '0'}
                      goal={stats?.dynamicGoals?.calories || user?.preferences?.dailyCalorieGoal || 2000}
                      progress={goalProgress.calories}
                      unit="kcal"
                      tone="brand"
                      hoverHint={buildDashboardGoalHoverHint(locale, {
                        title: 'Calories',
                        value: Number(stats?.totalCalories || 0),
                        goal: Number(stats?.dynamicGoals?.calories || user?.preferences?.dailyCalorieGoal || 2000),
                        unit: 'kcal',
                      })}
                    />
                    <StatCard
                      ui={d}
                      title={d.statProtein}
                      value={stats?.totalProtein?.toFixed(1) || '0'}
                      goal={stats?.dynamicGoals?.protein || user?.preferences?.proteinGoal || undefined}
                      progress={goalProgress.protein}
                      unit="g"
                      tone="info"
                      hoverHint={buildDashboardGoalHoverHint(locale, {
                        title: 'Protein',
                        value: Number(stats?.totalProtein || 0),
                        goal: Number(stats?.dynamicGoals?.protein || user?.preferences?.proteinGoal || 0),
                        unit: 'g',
                      })}
                    />
                    <StatCard
                      ui={d}
                      title={d.statCarbs}
                      value={stats?.totalCarbs?.toFixed(1) || '0'}
                      goal={stats?.dynamicGoals?.carbs || user?.preferences?.carbsGoal || undefined}
                      progress={goalProgress.carbs}
                      unit="g"
                      tone="success"
                      hoverHint={buildDashboardGoalHoverHint(locale, {
                        title: 'Carbs',
                        value: Number(stats?.totalCarbs || 0),
                        goal: Number(stats?.dynamicGoals?.carbs || user?.preferences?.carbsGoal || 0),
                        unit: 'g',
                      })}
                    />
                    <StatCard
                      ui={d}
                      title={d.statFat}
                      value={stats?.totalFat?.toFixed(1) || '0'}
                      goal={stats?.dynamicGoals?.fat || user?.preferences?.fatGoal || undefined}
                      progress={goalProgress.fat}
                      unit="g"
                      tone="brandSoft"
                      hoverHint={buildDashboardGoalHoverHint(locale, {
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

            <div
              className={clsx(
                'bg-surface rounded-xl border border-border p-4 md:p-5 shadow-sm shadow-black/5',
                accentEdgeClasses('primary', 'left'),
              )}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold tracking-tight text-text-primary">{d.quickActions}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <ActionCard
                  icon={<Camera />}
                  title={d.actionMealsTitle}
                  description={d.actionMealsDesc}
                  onClick={() => router.push('/meals')}
                  tone="brand"
                />
                <ActionCard
                  icon={<ChartColumnIncreasing />}
                  title={d.actionStatsTitle}
                  description={d.actionStatsDesc}
                  onClick={() => router.push('/stats')}
                  tone="info"
                />
                <ActionCard
                  icon={<Target />}
                  title={d.actionGoalsTitle}
                  description={d.actionGoalsDesc}
                  onClick={() => router.push('/goals')}
                  tone="success"
                />
              </div>
            </div>

            <div
              className={clsx(
                'bg-surface rounded-xl border border-border p-4 md:p-5 shadow-sm shadow-black/5',
                accentEdgeClasses('info', 'left'),
              )}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold tracking-tight text-text-primary">{d.todayMeals}</h3>
                <button onClick={() => router.push('/meals')} className="text-info-400 hover:text-info-300 text-sm transition-colors">
                  {d.openMeals}
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
                        onClick={() => setDeleteMealId(meal.id)}
                        disabled={deletingMeal}
                        className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-secondary hover:text-red-400 hover:border-red-400/40 transition-colors"
                        title={d.deleteMeal}
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
                  <p className="text-text-secondary mb-4">{d.noMealsToday}</p>
                  <button onClick={() => router.push('/meals')} className="btn-primary inline-flex items-center space-x-2 px-4">
                    <Camera className="h-4 w-4" />
                    <span>{d.logFirstMeal}</span>
                  </button>
                </div>
              )}
            </div>
          </section>

          <aside className={clsx('space-y-4', sidebarCollapsed ? 'lg:col-span-4 2xl:col-span-3' : 'lg:col-span-4')}>
            <section
              className={clsx(
                'bg-surface rounded-xl border border-border p-4 md:p-5 shadow-sm shadow-black/5',
                accentEdgeClasses('primary', 'left'),
              )}
            >
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-base font-semibold tracking-tight text-text-primary">{d.quickWorkout}</h3>
                <button onClick={() => router.push('/workouts')} className="text-amber-300 hover:text-amber-200 text-xs transition-colors">
                  {d.fullPage}
                </button>
              </div>
              <form onSubmit={handleQuickWorkout} className="space-y-3">
                <input
                  value={quickWorkoutTitle}
                  onChange={(event) => setQuickWorkoutTitle(event.target.value)}
                  placeholder={d.workoutPlaceholder}
                  className="input-field w-full"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min={1}
                    value={quickWorkoutDuration}
                    onChange={(event) => setQuickWorkoutDuration(Number(event.target.value))}
                    className="input-field w-full"
                    placeholder={d.minutesPh}
                  />
                  <input
                    type="number"
                    min={0}
                    value={quickWorkoutBurned}
                    onChange={(event) => setQuickWorkoutBurned(Number(event.target.value))}
                    className="input-field w-full"
                    placeholder={d.kcalPh}
                  />
                </div>
                <select
                  value={quickWorkoutIntensity}
                  onChange={(event) => setQuickWorkoutIntensity(event.target.value as WorkoutIntensity)}
                  className="input-field w-full"
                >
                  <option value="LOW">{d.intensityLow}</option>
                  <option value="MEDIUM">{d.intensityMedium}</option>
                  <option value="HIGH">{d.intensityHigh}</option>
                </select>
                <button type="submit" disabled={quickWorkoutSaving} className="btn-primary w-full inline-flex items-center justify-center gap-2">
                  {quickWorkoutSaving ? (
                    <>
                      <ButtonSpinner />
                      {d.adding}
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      {d.addWorkout}
                    </>
                  )}
                </button>
              </form>
            </section>

            <section
              className={clsx(
                'bg-surface rounded-xl border border-border p-4 md:p-5 shadow-sm shadow-black/5',
                accentEdgeClasses('success', 'left'),
              )}
            >
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-base font-semibold tracking-tight text-text-primary">{d.dailySteps}</h3>
                <span className="text-xs text-text-secondary">{d.trackedOnly}</span>
              </div>
              <form onSubmit={handleQuickSteps} className="space-y-3">
                <input
                  type="number"
                  min={0}
                  max={120000}
                  value={quickSteps}
                  onChange={(event) => setQuickSteps(Number(event.target.value))}
                  className="input-field w-full"
                  placeholder={d.stepsPlaceholder}
                />
                <button type="submit" disabled={savingSteps} className="btn-secondary w-full inline-flex items-center justify-center gap-2">
                  {savingSteps ? (
                    <>
                      <ButtonSpinner />
                      {d.savingSteps}
                    </>
                  ) : (
                    d.saveSteps
                  )}
                </button>
              </form>
            </section>

            <section
              className={clsx(
                'bg-surface rounded-xl border border-border p-4 md:p-5 shadow-sm shadow-black/5',
                accentEdgeClasses('info', 'left'),
              )}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold tracking-tight text-text-primary">{d.todayTraining}</h3>
                <button onClick={() => router.push('/workouts')} className="text-xs text-text-secondary hover:text-text-primary transition-colors">
                  {d.seeAll}
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
                  {d.noWorkoutsToday}
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
  ui,
  title,
  value,
  goal,
  progress,
  unit,
  tone,
  hoverHint,
}: {
  ui: ReturnType<typeof getDashboardStrings>;
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
      edge: accentEdgeClasses('primary', 'left'),
    },
    info: {
      value: 'text-info-500',
      bar: 'bg-info-500',
      tooltip: 'border-info-500/45 text-info-200',
      edge: accentEdgeClasses('info', 'left'),
    },
    success: {
      value: 'text-success-500',
      bar: 'bg-success-500',
      tooltip: 'border-success-500/45 text-success-200',
      edge: accentEdgeClasses('success', 'left'),
    },
    brandSoft: {
      value: 'text-primary-300',
      bar: 'bg-primary-300',
      tooltip: 'border-primary-300/55 text-primary-100',
      edge: 'border-l-4 border-l-primary-300',
    },
  } satisfies Record<StatTone, { value: string; bar: string; tooltip: string; edge: string }>;
  
  const cardContent = (
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
      {goal && (
        <p className="text-xs text-text-muted mb-2">
          {ui.statGoalLine} {goal} {unit}
        </p>
      )}
      <div className="w-full bg-background/60 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${toneStyles[tone].bar}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <p className="text-xs text-text-muted mt-1">{ui.statPercentGoal(percentage.toFixed(0))}</p>
    </div>
  );

  if (!hoverHint) {
    return cardContent;
  }
  const cleanHint = hoverHint.replace(/^Evo hint:\s*/i, '').replace(/^Podpowiedź Evo:\s*/i, '');

  return (
    <Tooltip
      content={
        <span className="leading-snug">
          <span className="font-semibold">{ui.evoHintPrefix}</span> {cleanHint}
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
