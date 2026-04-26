'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import {
  ME_QUERY,
  ROLLING_SEVEN_DAY_AVERAGE_STEPS_QUERY,
  WEEKLY_EVO_REVIEW_QUERY,
  WEEKLY_MEALS_NUTRITION_QUERY,
} from '@/lib/graphql/queries';
import {
  Activity,
  Camera,
  ChartColumnIncreasing,
  Dumbbell,
  Flame,
  Footprints,
  Plus,
  Salad,
  Target,
  Moon,
  UtensilsCrossed,
} from 'lucide-react';
import { clearAuthToken, hasAuthToken } from '@/lib/auth-token';
import { clearApolloClientCache } from '@/lib/apollo-client';
import AppShell from '@/components/AppShell';
import { useAppShellLayout } from '@/components/app-shell-layout';
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
import { EvoHintCard, EvoThinkingOverlay, InsightEmptyState, NextBestActionCard } from '@/components/evo';
import {
  AiReasoningDrawer,
  CollapsibleWidget,
  DailyBriefHero,
  GoalRingCard,
  InsightCard,
  MealTimeline,
  WeeklyScoreCard,
  WeeklyTrendMetricCard,
  type MealTimelineItem,
} from '@/components/dashboard';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Tooltip from '@/components/ui/atoms/Tooltip';
import { NumericInput } from '@/components/ui/atoms/NumericInput';
import { getDestructiveConfirmLabels } from '@/lib/i18n/destructive-confirm';
import { graphqlAppLocaleToUi } from '@/lib/i18n/ui-locale';
import {
  buildDashboardGoalHoverHint,
  getDashboardStrings,
  resolveDashboardInsightNextActionPath,
} from '@/lib/i18n/copy/dashboard';
import { buildWeeklyScoreNarratives } from '@/lib/dashboard/weeklyScoreNarratives';

type WorkoutIntensity = 'LOW' | 'MEDIUM' | 'HIGH';
type ActionTone = 'brand' | 'info' | 'success';

type DayWorkoutRow = {
  id: string;
  title: string;
  durationMinutes: number;
  caloriesBurned: number;
  intensity?: string | null;
};

function shortenInsightText(text: string, maxChars = 200): string {
  const t = text.trim();
  if (t.length <= maxChars) return t;
  const slice = t.slice(0, maxChars);
  const i = slice.lastIndexOf('.');
  if (i > 50) return slice.slice(0, i + 1).trim();
  return `${slice.trim()}…`;
}

/** First sentence or clause, capped — for hero / weekly one-liners. */
function firstSentence(text: string, maxChars: number): string {
  const t = text.trim();
  if (!t) return '';
  const cut = (t.split(/(?<=[.!?])\s+/)[0] ?? t).trim();
  if (cut.length <= maxChars) return cut;
  return `${cut.slice(0, maxChars)}…`;
}

function weeklyOneLiner(text: string, maxChars: number): string {
  return firstSentence(text, maxChars);
}

/** Short label for next action (e.g. meal name), not a full sentence. */
function formatSignedTrendQuantity(delta: number, unit: 'kcal' | 'g'): string {
  if (unit === 'kcal') {
    const r = Math.round(delta);
    if (r === 0) return '0 kcal';
    const sign = r > 0 ? '+' : '−';
    return `${sign}${Math.abs(r)} kcal`;
  }
  const r = Math.round(delta * 10) / 10;
  if (Math.abs(r) < 0.05) return '0 g';
  const sign = r > 0 ? '+' : '−';
  const abs = Math.abs(r);
  const body = Number.isInteger(abs) ? String(Math.round(abs)) : String(abs);
  return `${sign}${body} g`;
}

function shortActionTitle(title: string, maxLen = 40): string {
  const t = title.trim();
  if (!t) return '';
  if (t.length <= maxLen) return t;
  const byDelim = t.split(/[,:;—–-]/)[0]?.trim() ?? '';
  if (byDelim.length >= 6 && byDelim.length <= maxLen + 20) {
    return byDelim.length <= maxLen ? byDelim : `${byDelim.slice(0, maxLen)}…`;
  }
  return `${t.slice(0, maxLen)}…`;
}

type InsightForMealTags = {
  remainingCalories: number;
  remainingProtein: number;
};

function mealRecommendationMacroTags(
  insight: InsightForMealTags,
  carbsGoalNum: number,
  carbsConsumed: number
): ReactNode {
  const remK = Math.max(0, Number(insight.remainingCalories));
  const remP = Math.max(0, Number(insight.remainingProtein));
  const remC = carbsGoalNum > 0 ? Math.max(0, carbsGoalNum - carbsConsumed) : 72;

  let kLo = Math.round(Math.max(380, remK * 0.48));
  let kHi = Math.round(Math.min(remK * 0.88, Math.max(kLo + 90, remK * 0.72)));
  if (remK < 420) {
    kLo = Math.max(280, Math.round(remK * 0.35));
    kHi = Math.max(kLo + 60, Math.round(remK * 0.92));
  }
  kHi = Math.max(kHi, kLo + 80);
  kHi = Math.min(kHi, 780);
  kLo = Math.min(kLo, Math.max(280, kHi - 220));

  const pLo = Math.max(22, Math.round(remP * 0.7));
  let pHi = Math.round(Math.min(52, Math.max(pLo + 6, remP * 0.96)));
  if (pHi <= pLo) pHi = pLo + 8;
  pHi = Math.min(55, pHi);

  let cLo = remC >= 25 ? Math.round(Math.max(42, remC * 0.48)) : 60;
  let cHi = remC >= 25 ? Math.round(Math.min(110, Math.max(cLo + 18, remC * 0.88))) : 90;
  if (cHi <= cLo) cHi = cLo + 20;

  const enDash = '\u2013';
  const tagClass =
    'rounded-md bg-background/55 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-text-secondary ring-1 ring-white/[0.06]';

  return (
    <>
      <span className={tagClass}>{`${kLo}${enDash}${kHi} kcal`}</span>
      <span className={tagClass}>{`${pLo}${enDash}${pHi} g P`}</span>
      <span className={tagClass}>{`${cLo}${enDash}${cHi} g C`}</span>
    </>
  );
}

export default function DashboardPage() {
  const client = useApolloClient();
  const router = useRouter();
  const { sidebarCollapsed } = useAppShellLayout();
  const [mounted, setMounted] = useState(false);
  const { dateKey: today, timeZone } = useClientCalendarToday();
  const [quickWorkoutTitle, setQuickWorkoutTitle] = useState('');
  const [quickWorkoutDurationInput, setQuickWorkoutDurationInput] = useState('35');
  const [quickWorkoutBurnedInput, setQuickWorkoutBurnedInput] = useState('250');
  const [quickWorkoutIntensity, setQuickWorkoutIntensity] = useState<WorkoutIntensity>('MEDIUM');
  /** String while editing so the field can be cleared without forcing 0 */
  const [quickStepsInput, setQuickStepsInput] = useState('');
  const [deleteMealId, setDeleteMealId] = useState<string | null>(null);
  const [briefExpanded, setBriefExpanded] = useState(false);
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const [weeklyExpanded, setWeeklyExpanded] = useState(false);

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
  const { data: weeklyNutritionData } = useQuery(WEEKLY_MEALS_NUTRITION_QUERY, {
    variables: { endDate: today },
    skip: !userData?.me,
    fetchPolicy: 'cache-first',
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
      setQuickStepsInput(String(Math.round(Number(steps))));
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

  const primaryActionLabel = nextAction.targetPath.startsWith('/meals')
    ? d.addSuggestedMeal
    : nextAction.actionLabel;

  const weeklyNutrition = weeklyNutritionData?.weeklyMealsNutrition;
  const nutritionDays = weeklyNutrition?.days ?? [];
  const trendCalories = nutritionDays.map((day) => Number(day.calories ?? 0));
  const trendProtein = nutritionDays.map((day) => Number(day.protein ?? 0));
  const trendActivity = nutritionDays.map((day) => Number(day.workoutCaloriesBurned ?? 0));

  const reasoningTips = hasAiBrief ? tipsFromAi : [];
  const reasoningBullets: string[] = [];
  if (stats?.date) reasoningBullets.push(`${locale === 'pl' ? 'Dzień' : 'Day'}: ${stats.date}`);
  reasoningBullets.push(
    `${locale === 'pl' ? 'Posiłki' : 'Meals'}: ${completedMeals} · ${locale === 'pl' ? 'Treningi' : 'Workouts'}: ${workouts.length}`
  );
  if (activity?.steps != null) {
    reasoningBullets.push(`${locale === 'pl' ? 'Kroki' : 'Steps'}: ${activity.steps}`);
  }
  if (stats?.calorieBudget != null) {
    reasoningBullets.push(
      `${locale === 'pl' ? 'Budżet kcal (dzień)' : 'Day calorie budget'}: ~${Math.round(Number(stats.calorieBudget))} kcal`
    );
  }

  const progressBadgeTone =
    progressTone === d.progressOnTrack ? 'success' : progressTone === d.progressWatch ? 'warning' : 'focus';
  const insightSummaryText = insight?.summary?.trim() ?? '';
  const summaryFirst = insight ? firstSentence(insightSummaryText, 95) : '';
  const supportRaw = insight?.supportLine?.trim() ?? '';
  const supportFirst = supportRaw ? firstSentence(supportRaw, 105) : '';
  const headlinePrimary = summaryFirst || supportFirst || (insight ? d.mainInsight : '');
  const supportForHero =
    summaryFirst && supportFirst && supportFirst !== summaryFirst ? supportFirst : undefined;
  const showBriefToggle = Boolean(
    insight && insightSummaryText.trim().length > summaryFirst.length + 14
  );
  const weeklyHl = weeklyReview?.highlights ?? [];
  const wNut = weeklyHl[0]?.trim() || '';
  const wTrain = weeklyHl[1]?.trim() || '';
  const wCons = weeklyHl[2]?.trim() || '';
  const wNutShort = wNut ? weeklyOneLiner(wNut, 100) : '';
  const wTrainShort = wTrain ? weeklyOneLiner(wTrain, 100) : '';
  const wConsShort = wCons ? weeklyOneLiner(wCons, 100) : '';

  const weeklyNarratives = weeklyNutrition
    ? buildWeeklyScoreNarratives({
        locale,
        days: weeklyNutrition.days.map((day) => ({
          calories: Number(day.calories ?? 0),
          protein: Number(day.protein ?? 0),
          mealCount: Number(day.mealCount ?? 0),
          workoutSessions: Number(day.workoutSessions ?? 0),
          workoutCaloriesBurned: Number(day.workoutCaloriesBurned ?? 0),
        })),
        averages: {
          calories: Number(weeklyNutrition.averages?.calories ?? 0),
          protein: Number(weeklyNutrition.averages?.protein ?? 0),
        },
        goals: {
          calories: Number(weeklyNutrition.goals?.calories ?? 0),
          protein: Number(weeklyNutrition.goals?.protein ?? 0),
        },
        priorWeekAverages: {
          calories: Number(weeklyNutrition.priorWeekAverages?.calories ?? 0),
          protein: Number(weeklyNutrition.priorWeekAverages?.protein ?? 0),
        },
        priorAvgWorkoutKcalPerDay: Number(weeklyNutrition.priorAvgWorkoutKcalPerDay ?? 0),
        daysWithMeals: Number(weeklyNutrition.daysWithMeals ?? 0),
      })
    : null;

  const wScores = weeklyNarratives ?? {
    nutrition: {
      insight: wNutShort || d.weeklyFallbackNutritionInsight,
      focus: d.weeklyFallbackNutritionFocus,
    },
    training: {
      insight: wTrainShort || d.weeklyFallbackTrainingInsight,
      focus: d.weeklyFallbackTrainingFocus,
    },
    consistency: {
      insight: wConsShort || d.weeklyFallbackConsistencyInsight,
      focus: d.weeklyFallbackConsistencyFocus,
    },
  };

  function tipLeadSentence(tip: string): string {
    const t = tip.trim();
    const cut = t.split(/(?<=[.!?])\s+/)[0];
    if (cut && cut.length <= 140) return cut;
    if (t.length <= 120) return t;
    return `${t.slice(0, 117)}…`;
  }

  const calGoalNum = Number(stats?.dynamicGoals?.calories || user?.preferences?.dailyCalorieGoal || 2000);
  const proteinGoalNum = Number(stats?.dynamicGoals?.protein || user?.preferences?.proteinGoal || 0);
  const carbsGoalNum = Number(stats?.dynamicGoals?.carbs || user?.preferences?.carbsGoal || 0);
  const fatGoalNum = Number(stats?.dynamicGoals?.fat || user?.preferences?.fatGoal || 0);
  const calConsumed = Number(stats?.totalCalories || 0);
  const proteinConsumed = Number(stats?.totalProtein || 0);
  const carbsConsumed = Number(stats?.totalCarbs || 0);
  const fatConsumed = Number(stats?.totalFat || 0);

  const stepsBriefFormatted = new Intl.NumberFormat(locale === 'pl' ? 'pl-PL' : 'en-US').format(
    Math.max(0, Math.round(Number(activity?.steps ?? 0)))
  );

  const metricGoalChipEl =
    insight && stats ? (
      <BriefStatPill
        tabularValue={false}
        tooltip={d.briefTooltipGoal}
        icon={<Target className="h-4 w-4 text-text-muted" aria-hidden />}
        label={d.briefStatGoal}
        value={formatPrimaryGoal(String(user?.preferences?.primaryGoal || 'maintenance'), locale)}
      />
    ) : null;

  const metricStatsChipsEl =
    insight && stats ? (
      <>
        <BriefStatPill
          tooltip={d.briefTooltipMeals}
          icon={<UtensilsCrossed className="h-4 w-4 text-text-muted" aria-hidden />}
          label={d.briefStatMeals}
          value={`${completedMeals}`}
        />
        <BriefStatPill
          tooltip={d.briefTooltipActivity}
          icon={<Activity className="h-4 w-4 text-text-muted" aria-hidden />}
          label={d.briefStatActivity}
          value={`${totalTrainingMinutes} min`}
        />
        <BriefStatPill
          tooltip={d.briefTooltipCalories}
          icon={<Flame className="h-4 w-4 text-text-muted" aria-hidden />}
          label={d.briefStatCalories}
          value={`${Math.round(calConsumed)} kcal`}
        />
        <BriefStatPill
          tooltip={d.briefTooltipProtein}
          icon={<Salad className="h-4 w-4 text-text-muted" aria-hidden />}
          label={d.statProtein}
          value={`${Math.round(proteinConsumed)} g`}
        />
        <BriefStatPill
          tooltip={d.briefTooltipSteps}
          icon={<Footprints className="h-4 w-4 text-text-muted" aria-hidden />}
          label={d.briefStatSteps}
          value={stepsBriefFormatted}
        />
      </>
    ) : null;

  const nutritionTipFull = categorizedTips[0]?.tip?.trim();
  const suggestedMealHint =
    nextAction.targetPath.startsWith('/meals') && nextAction.title
      ? shortenInsightText(nextAction.title, 88)
      : nutritionTipFull
        ? firstSentence(nutritionTipFull, 100)
        : undefined;
  const suggestedMealDetail =
    nextAction.targetPath.startsWith('/meals') && nutritionTipFull
      ? shortenInsightText(nutritionTipFull, 140)
      : nutritionTipFull && suggestedMealHint && nutritionTipFull.length > suggestedMealHint.length + 8
        ? nutritionTipFull.slice(suggestedMealHint.length).replace(/^[\s.]+/, '').trim()
        : undefined;

  const goalsFocusLine = (() => {
    if (!stats) return null;
    type Gap = { macro: string; gap: number; unit: string; ratio: number };
    const gaps: Gap[] = [];
    if (calGoalNum > 0) {
      const ratio = calConsumed / calGoalNum;
      if (ratio < 0.97) gaps.push({ macro: d.statCalories, gap: calGoalNum - calConsumed, unit: 'kcal', ratio });
    }
    if (proteinGoalNum > 0) {
      const ratio = proteinConsumed / proteinGoalNum;
      if (ratio < 0.97) gaps.push({ macro: d.statProtein, gap: proteinGoalNum - proteinConsumed, unit: 'g', ratio });
    }
    if (carbsGoalNum > 0) {
      const ratio = carbsConsumed / carbsGoalNum;
      if (ratio < 0.97) gaps.push({ macro: d.statCarbs, gap: carbsGoalNum - carbsConsumed, unit: 'g', ratio });
    }
    if (fatGoalNum > 0) {
      const ratio = fatConsumed / fatGoalNum;
      if (ratio < 0.97) gaps.push({ macro: d.statFat, gap: fatGoalNum - fatConsumed, unit: 'g', ratio });
    }
    if (gaps.length === 0) return null;
    gaps.sort((a, b) => a.ratio - b.ratio);
    const w = gaps[0];
    const amount =
      w.unit === 'kcal' ? String(Math.round(Math.max(0, w.gap))) : Math.max(0, w.gap).toFixed(0);
    return d.goalsDayFocus(w.macro, amount, w.unit);
  })();

  const stepsVisualGoal = Math.max(10000, Math.round(rollingStepsAvg) || 10000);
  const stepsTodayNum = Number(activity?.steps ?? 0);
  const stepsBarPct = Math.min(100, stepsVisualGoal > 0 ? (stepsTodayNum / stepsVisualGoal) * 100 : 0);

  const nextActionMetricTags =
    insight && nextAction.targetPath.startsWith('/meals')
      ? mealRecommendationMacroTags(insight, carbsGoalNum, carbsConsumed)
      : insight
        ? (
            <>
              <span className="rounded-md bg-background/55 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-text-secondary ring-1 ring-white/[0.06]">
                {Math.round(Math.max(0, insight.remainingCalories))} kcal
              </span>
              <span className="rounded-md bg-background/55 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-text-secondary ring-1 ring-white/[0.06]">
                P {Math.max(0, insight.remainingProtein).toFixed(0)}g
              </span>
            </>
          )
        : null;

  const nextTitleForCard = shortActionTitle(nextAction.title, 42);
  const nextDescForCard =
    nextAction.targetPath.startsWith('/meals') ? '' : shortenInsightText(nextAction.description, 72);

  const mealTimelineItems: MealTimelineItem[] = (stats?.meals ?? []).map((meal) => ({
    id: meal.id,
    name: meal.name,
    mealType: meal.mealType,
    createdAt: meal.createdAt ?? null,
    nutrition: {
      calories: Number(meal.nutrition?.calories ?? 0),
      protein: Number(meal.nutrition?.protein ?? 0),
      carbs: Number(meal.nutrition?.carbs ?? 0),
      fat: Number(meal.nutrition?.fat ?? 0),
    },
  }));

  const typedWorkouts = workouts as DayWorkoutRow[];

  const insightCardAccents = [
    'border-l-rose-400/55',
    'border-l-sky-400/55',
    'border-l-emerald-400/55',
  ] as const;

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

  const handleQuickWorkout = async (event: FormEvent) => {
    event.preventDefault();
    if (!quickWorkoutTitle.trim()) {
      appToast.info('Workout title missing', d.workoutTitleMissing);
      return;
    }

    const durationMinutes = Number(quickWorkoutDurationInput.trim());
    const caloriesBurned = Number(quickWorkoutBurnedInput.trim());
    if (!Number.isFinite(durationMinutes) || durationMinutes < 1) {
      appToast.info('Invalid duration', d.invalidWorkoutMinutes);
      return;
    }
    if (!Number.isFinite(caloriesBurned) || caloriesBurned < 0) {
      appToast.info('Invalid kcal', d.invalidWorkoutCalories);
      return;
    }

    await logWorkout({
      variables: {
        input: {
          title: quickWorkoutTitle.trim(),
          durationMinutes: Math.round(durationMinutes),
          caloriesBurned: Math.round(caloriesBurned),
          intensity: quickWorkoutIntensity,
          performedAt: new Date().toISOString(),
        },
      },
    });
  };

  const handleQuickSteps = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = quickStepsInput.trim();
    if (trimmed === '') {
      appToast.info('Steps', d.stepsCountRequired);
      return;
    }
    const steps = Number(trimmed);
    if (!Number.isFinite(steps) || steps < 0 || steps > 120000) {
      appToast.info('Invalid steps', d.invalidSteps);
      return;
    }

    await upsertDailyActivity({
      variables: {
        input: {
          date: today,
          steps: Math.round(steps),
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
      <AiReasoningDrawer
        open={reasoningOpen}
        onClose={() => setReasoningOpen(false)}
        ui={d}
        mainInsight={insightSummaryText}
        supportLine={insight?.supportLine?.trim() || undefined}
        tips={reasoningTips}
        dataBullets={reasoningBullets}
      />
      <div className="space-y-4 md:space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary mb-1">
            {d.welcomeName(user?.name || 'there')}
          </h2>
          <p className="max-w-2xl text-xs md:text-sm text-text-secondary leading-snug">{d.welcomeSub}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.03, ease: 'easeOut' }}
        >
          <DailyBriefHero
            ui={d}
            eyebrow={d.missionEyebrow}
            title={d.dailyBriefTitle}
            subtitle={d.briefHeroSubtitle}
            progressLabel={progressTone}
            progressTone={progressBadgeTone}
            loading={daySnapshot.loading}
            headline={headlinePrimary}
            supportLine={supportForHero}
            fullSummary={insight?.summary?.trim() || undefined}
            briefExpanded={briefExpanded}
            onToggleBrief={() => setBriefExpanded((v) => !v)}
            showBriefToggle={showBriefToggle}
            onOpenReasoning={() => setReasoningOpen(true)}
            showReasoningButton={Boolean(insight && insightSummaryText.length > 0)}
            reasoningTriggerLabel={d.reasoningTriggerShort}
            metricGoalSlot={metricGoalChipEl}
            metricStatsSlot={metricStatsChipsEl}
            nextActionSlot={
              insight ? (
                <NextBestActionCard
                  compact
                  fillHeight
                  className="min-h-0 flex-1"
                  eyebrow={d.nextStepEyebrow}
                  title={nextTitleForCard}
                  description={nextDescForCard}
                  actionLabel={primaryActionLabel}
                  metricTags={nextActionMetricTags}
                  onAction={() => router.push(nextAction.targetPath)}
                  secondaryLabel={d.seeOtherOptions}
                  onSecondary={() => router.push('/chat?channel=COACH')}
                />
              ) : null
            }
            insightCardsSlot={
              hasAiBrief ? (
                <>
                  {categorizedTips.map((item, i) => (
                    <InsightCard
                      key={item.label}
                      icon={
                        i === 0 ? (
                          <Salad className="h-4 w-4 text-rose-300" aria-hidden />
                        ) : i === 1 ? (
                          <Dumbbell className="h-4 w-4 text-sky-300" aria-hidden />
                        ) : (
                          <Moon className="h-4 w-4 text-emerald-300" aria-hidden />
                        )
                      }
                      label={item.label}
                      summary={tipLeadSentence(item.tip)}
                      detail={item.tip}
                      accentClassName={insightCardAccents[i] ?? insightCardAccents[0]}
                    />
                  ))}
                </>
              ) : null
            }
            alertSlot={
              insight && !hasAiBrief && !daySnapshot.insightBootstrapping ? (
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
              ) : undefined
            }
            emptySlot={
              !insight && !daySnapshot.loading ? (
                <InsightEmptyState
                  title={d.emptyTitle}
                  description={d.emptyDesc}
                  actionLabel={d.emptyAction}
                  onAction={() => router.push('/meals')}
                />
              ) : undefined
            }
          />
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: 'easeOut' }}
          className="rounded-2xl bg-surface/70 p-3 md:p-4 ring-1 ring-white/[0.06]"
        >
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold tracking-tight text-text-primary">{d.todayGoals}</h3>
              <p className="text-xs text-text-muted line-clamp-1">{d.todayGoalsSub(today)}</p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/goals')}
              className="btn-info text-xs h-8 px-3 shrink-0"
            >
              {d.setGoals}
            </button>
          </div>
          <div
            className={clsx(
              'grid grid-cols-1 gap-2.5 sm:grid-cols-2',
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
                <GoalRingCard
                  ui={d}
                  title={d.statCalories}
                  kind="calories"
                  consumed={calConsumed}
                  target={calGoalNum}
                  unit="kcal"
                  tone="brand"
                  hoverHint={buildDashboardGoalHoverHint(locale, {
                    title: 'Calories',
                    value: calConsumed,
                    goal: calGoalNum,
                    unit: 'kcal',
                  })}
                />
                <GoalRingCard
                  ui={d}
                  title={d.statProtein}
                  kind="protein"
                  consumed={proteinConsumed}
                  target={proteinGoalNum}
                  unit="g"
                  tone="info"
                  hoverHint={buildDashboardGoalHoverHint(locale, {
                    title: 'Protein',
                    value: proteinConsumed,
                    goal: proteinGoalNum,
                    unit: 'g',
                  })}
                />
                <GoalRingCard
                  ui={d}
                  title={d.statCarbs}
                  kind="carbs"
                  consumed={carbsConsumed}
                  target={carbsGoalNum}
                  unit="g"
                  tone="success"
                  hoverHint={buildDashboardGoalHoverHint(locale, {
                    title: 'Carbs',
                    value: carbsConsumed,
                    goal: carbsGoalNum,
                    unit: 'g',
                  })}
                />
                <GoalRingCard
                  ui={d}
                  title={d.statFat}
                  kind="fat"
                  consumed={fatConsumed}
                  target={fatGoalNum}
                  unit="g"
                  tone="brandSoft"
                  hoverHint={buildDashboardGoalHoverHint(locale, {
                    title: 'Fat',
                    value: fatConsumed,
                    goal: fatGoalNum,
                    unit: 'g',
                  })}
                />
              </>
            )}
          </div>
          {goalsFocusLine ? (
            <p className="text-[11px] text-text-muted mt-3 leading-snug border-t border-border/30 pt-2.5">{goalsFocusLine}</p>
          ) : null}
        </motion.section>

        <div
          className={clsx(
            'grid grid-cols-1 gap-3 lg:grid-cols-12',
            sidebarCollapsed && '2xl:gap-6'
          )}
        >
          <section className={clsx('space-y-3', sidebarCollapsed ? 'lg:col-span-8 2xl:col-span-9' : 'lg:col-span-8')}>
            <div className="rounded-xl bg-surface/45 p-2 md:p-2.5 ring-1 ring-white/[0.04]">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted mb-1.5">
                {d.quickActions}
              </h3>
              <div className="flex flex-wrap gap-1.5 md:flex-nowrap md:gap-2">
                <QuickActionTile
                  icon={<Camera />}
                  title={d.actionMealsTitle}
                  description={d.actionMealsDesc}
                  onClick={() => router.push('/meals')}
                  tone="brand"
                />
                <QuickActionTile
                  icon={<ChartColumnIncreasing />}
                  title={d.actionStatsTitle}
                  description={d.actionStatsDesc}
                  onClick={() => router.push('/stats')}
                  tone="info"
                />
                <QuickActionTile
                  icon={<Target />}
                  title={d.actionGoalsTitle}
                  description={d.actionGoalsDesc}
                  onClick={() => router.push('/goals')}
                  tone="success"
                />
              </div>
            </div>

            <div className="rounded-2xl bg-surface/60 p-3 md:p-4 ring-1 ring-white/[0.05]">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold tracking-tight text-text-primary">{d.todayMeals}</h3>
                <button
                  type="button"
                  onClick={() => router.push('/meals')}
                  className="text-info-400 hover:text-info-300 text-sm transition-colors shrink-0"
                >
                  {d.openMeals}
                </button>
              </div>
              {daySnapshot.loading ? (
                <div className="space-y-3">
                  <ListRowSkeleton />
                  <ListRowSkeleton />
                  <ListRowSkeleton />
                </div>
              ) : stats?.meals && stats.meals.length > 0 ? (
                <MealTimeline
                  ui={d}
                  meals={mealTimelineItems}
                  locale={locale}
                  onDelete={(id) => setDeleteMealId(id)}
                  deleteBusy={deletingMeal}
                  suggestedHint={suggestedMealHint}
                  suggestedDetail={suggestedMealDetail}
                  onSuggestedLog={suggestedMealHint ? () => router.push('/meals') : undefined}
                  suggestedCtaLabel={suggestedMealHint ? d.logSuggestionCta : undefined}
                />
              ) : (
                <div className="text-center py-10">
                  <Camera className="h-12 w-12 text-text-muted mx-auto mb-3" />
                  <p className="text-text-secondary mb-4">{d.noMealsToday}</p>
                  <button
                    type="button"
                    onClick={() => router.push('/meals')}
                    className="btn-primary inline-flex items-center space-x-2 px-4"
                  >
                    <Camera className="h-4 w-4" />
                    <span>{d.logFirstMeal}</span>
                  </button>
                </div>
              )}
            </div>
          </section>

          <aside className={clsx('space-y-4', sidebarCollapsed ? 'lg:col-span-4 2xl:col-span-3' : 'lg:col-span-4')}>
            <CollapsibleWidget
              dense
              title={d.quickWorkout}
              headerRight={
                <button
                  type="button"
                  onClick={() => router.push('/workouts')}
                  className="text-[10px] text-amber-300/90 hover:text-amber-200 transition-colors shrink-0"
                >
                  {d.fullPage}
                </button>
              }
              accent="primary"
              expandLabel={d.quickLogExpand}
              collapseLabel={d.quickLogCollapse}
              summary={
                <p className="text-[11px] text-text-muted tabular-nums">
                  <span className="text-text-secondary">
                    {quickWorkoutDurationInput.trim() === '' ? '—' : quickWorkoutDurationInput}′
                  </span>
                  <span className="mx-1 text-border">·</span>
                  <span className="text-text-secondary">
                    {quickWorkoutBurnedInput.trim() === '' ? '—' : quickWorkoutBurnedInput} kcal
                  </span>
                  <span className="mx-1 text-border">·</span>
                  {String(quickWorkoutIntensity).toLowerCase()}
                </p>
              }
            >
              <form onSubmit={handleQuickWorkout} className="space-y-3">
                <input
                  value={quickWorkoutTitle}
                  onChange={(event) => setQuickWorkoutTitle(event.target.value)}
                  placeholder={d.workoutPlaceholder}
                  className="input-field w-full"
                />
                <div className="grid grid-cols-2 gap-2">
                  <NumericInput
                    min={1}
                    value={quickWorkoutDurationInput}
                    onChange={(event) => setQuickWorkoutDurationInput(event.target.value)}
                    className="w-full"
                    placeholder={d.minutesPh}
                  />
                  <NumericInput
                    min={0}
                    value={quickWorkoutBurnedInput}
                    onChange={(event) => setQuickWorkoutBurnedInput(event.target.value)}
                    className="w-full"
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
                <button
                  type="submit"
                  disabled={quickWorkoutSaving}
                  className="btn-primary w-full inline-flex items-center justify-center gap-2"
                >
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
            </CollapsibleWidget>

            <CollapsibleWidget
              dense
              title={d.dailySteps}
              headerRight={<span className="text-[10px] text-text-muted shrink-0">{d.trackedOnly}</span>}
              accent="success"
              expandLabel={d.quickLogExpand}
              collapseLabel={d.quickLogCollapse}
              summary={
                <div className="space-y-1.5">
                  <div className="flex justify-between gap-2 text-[11px] tabular-nums">
                    <span className="text-text-muted">
                      {d.mealTimelineTitle}{' '}
                      <span className="font-semibold text-text-primary">
                        {new Intl.NumberFormat(locale === 'pl' ? 'pl-PL' : 'en-US').format(stepsTodayNum)}
                      </span>
                    </span>
                    <span className="text-text-muted text-right leading-tight">
                      {d.stepsSoftTarget(
                        new Intl.NumberFormat(locale === 'pl' ? 'pl-PL' : 'en-US').format(stepsVisualGoal)
                      )}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-background/70">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-success-500/50 to-success-400/85 transition-[width] duration-500"
                      style={{ width: `${stepsBarPct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-text-muted">7d Ø {steps7Display}</p>
                </div>
              }
            >
              <form onSubmit={handleQuickSteps} className="space-y-3">
                <NumericInput
                  min={0}
                  max={120000}
                  value={quickStepsInput}
                  onChange={(event) => setQuickStepsInput(event.target.value)}
                  className="w-full"
                  placeholder={d.stepsPlaceholder}
                />
                <button
                  type="submit"
                  disabled={savingSteps}
                  className="btn-secondary w-full inline-flex items-center justify-center gap-2"
                >
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
            </CollapsibleWidget>

            <section className="rounded-xl bg-surface/50 p-2.5 ring-1 ring-white/[0.05]">
              <div className="mb-2 flex flex-wrap items-start gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-semibold tracking-tight text-text-primary">{d.todayTraining}</h3>
                  <p className="text-[10px] text-text-muted mt-0.5 line-clamp-1">{dailyTrainingLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/workouts')}
                  className="text-[10px] text-info-400 hover:text-info-300 transition-colors shrink-0"
                >
                  {d.seeAll}
                </button>
              </div>
              {daySnapshot.loading ? (
                <div className="space-y-1.5">
                  <Skeleton className="h-9 w-full rounded-md" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
              ) : typedWorkouts.length > 0 ? (
                <div className="space-y-1.5">
                  {typedWorkouts.map((workout) => (
                    <div key={workout.id} className="rounded-lg bg-background/35 px-2.5 py-2">
                      <p className="text-xs font-semibold text-text-primary leading-snug">{workout.title}</p>
                      <p className="text-[10px] text-text-muted mt-0.5 tabular-nums">
                        {workout.durationMinutes}′ · {workout.caloriesBurned} kcal ·{' '}
                        {String(workout.intensity || '').toLowerCase()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg bg-background/25 px-2 py-2 text-[10px] text-text-muted">{d.noWorkoutsToday}</div>
              )}
            </section>
          </aside>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08, ease: 'easeOut' }}
          className="rounded-2xl bg-surface/40 p-3 md:p-4 ring-1 ring-white/[0.04]"
        >
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium tracking-tight text-text-secondary">{d.weeklyTitle}</h3>
            <span className="text-[10px] text-text-muted">{d.weeklyLast7}</span>
          </div>
          {weeklyReviewLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ) : weeklyReview ? (
            <div className="space-y-3">
              {!weeklyReview.isCompleteWeek ? (
                <div className="rounded-lg bg-primary-500/[0.06] px-2.5 py-1.5 ring-1 ring-primary-500/15">
                  <p className="text-[10px] text-primary-200/95 leading-snug">
                    {d.weeklyPartial(weeklyReview.availableDays, weeklyReview.trackedDays)}
                  </p>
                </div>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <WeeklyScoreCard
                  label={d.scoreNutrition}
                  score={weeklyReview.nutritionScore}
                  insight={wScores.nutrition.insight}
                  focus={wScores.nutrition.focus}
                  accent="nutrition"
                />
                <WeeklyScoreCard
                  label={d.scoreTraining}
                  score={weeklyReview.trainingScore}
                  insight={wScores.training.insight}
                  focus={wScores.training.focus}
                  accent="training"
                />
                <WeeklyScoreCard
                  label={d.scoreConsistency}
                  score={weeklyReview.consistencyScore}
                  insight={wScores.consistency.insight}
                  focus={wScores.consistency.focus}
                  accent="consistency"
                />
              </div>

              {weeklyNutrition && nutritionDays.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-3">
                  {(() => {
                    const curK = Number(weeklyNutrition.averages?.calories ?? 0);
                    const curP = Number(weeklyNutrition.averages?.protein ?? 0);
                    const priorK = Number(weeklyNutrition.priorWeekAverages?.calories ?? 0);
                    const priorP = Number(weeklyNutrition.priorWeekAverages?.protein ?? 0);
                    const priorT = Number(weeklyNutrition.priorAvgWorkoutKcalPerDay ?? 0);
                    const curTday = trendActivity.length > 0 ? trendActivity.reduce((a, b) => a + b, 0) / 7 : 0;
                    const hasPriorK = priorK >= 85 || priorP >= 12;
                    const hasPriorP = priorP >= 8 || priorK >= 85;
                    const hasPriorT = priorT >= 12 || curTday >= 12;
                    const dk = curK - priorK;
                    const dp = curP - priorP;
                    const dt = curTday - priorT;
                    const kcalDeltaLine = !hasPriorK
                      ? d.trendDeltaNone
                      : Math.round(dk) === 0
                        ? d.trendDeltaFlat
                        : d.trendDeltaVsPriorWeek(formatSignedTrendQuantity(dk, 'kcal'));
                    const proteinDeltaLine = !hasPriorP
                      ? d.trendDeltaNone
                      : Math.abs(dp) < 0.25
                        ? d.trendDeltaFlat
                        : d.trendDeltaVsPriorWeek(formatSignedTrendQuantity(dp, 'g'));
                    const trainDeltaLine = !hasPriorT
                      ? d.trendDeltaNone
                      : Math.round(dt) === 0
                        ? d.trendDeltaFlat
                        : d.trendDeltaVsPriorWeek(formatSignedTrendQuantity(dt, 'kcal'));
                    return (
                      <>
                        <WeeklyTrendMetricCard
                          title={d.trendCalories}
                          primaryMetric={d.trendPrimaryKcalAvg(String(Math.round(curK)))}
                          deltaLine={kcalDeltaLine}
                          deltaEmphasis={hasPriorK && Math.abs(Math.round(dk)) >= 100}
                          sparklineValues={trendCalories}
                          sparkStrokeClassName="stroke-rose-400/85"
                          sparkAriaLabel={d.trendCalories}
                        />
                        <WeeklyTrendMetricCard
                          title={d.trendProtein}
                          primaryMetric={d.trendPrimaryProteinAvg(String(Math.round(curP)))}
                          deltaLine={proteinDeltaLine}
                          deltaEmphasis={hasPriorP && Math.abs(Math.round(dp)) >= 8}
                          sparklineValues={trendProtein}
                          sparkStrokeClassName="stroke-sky-400/85"
                          sparkAriaLabel={d.trendProtein}
                        />
                        <WeeklyTrendMetricCard
                          title={d.trendActivity}
                          primaryMetric={d.trendPrimaryTrainingKcalAvg(String(Math.round(curTday)))}
                          deltaLine={trainDeltaLine}
                          deltaEmphasis={hasPriorT && Math.abs(Math.round(dt)) >= 40}
                          sparklineValues={trendActivity}
                          sparkStrokeClassName="stroke-emerald-400/85"
                          sparkAriaLabel={d.trendActivity}
                        />
                      </>
                    );
                  })()}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => setWeeklyExpanded((v) => !v)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-info-500/30 bg-info-500/[0.08] px-3 py-2 text-xs font-semibold text-info-200 hover:bg-info-500/15 transition-colors"
              >
                {weeklyExpanded ? d.weeklyCollapse : d.weeklyExpand}
              </button>

              {weeklyExpanded ? (
                <div className="space-y-2.5 rounded-xl bg-background/15 p-3">
                  {weeklyReview.summary?.trim() ? (
                    <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">{weeklyReview.summary}</p>
                  ) : (
                    <p className="text-xs text-text-muted">{d.weeklyNarrativePending}</p>
                  )}
                  {weeklyReview.highlights.length > 0 ? (
                    <ul className="space-y-1.5">
                      {weeklyReview.highlights.map((highlight: string) => (
                        <li key={highlight} className="text-[11px] text-text-secondary leading-snug pl-2 border-l border-border/40">
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {weeklyReview.proTip?.trim() ? (
                    <div className="rounded-lg bg-primary-500/[0.06] px-3 py-2 ring-1 ring-primary-500/15">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-primary-200/90 mb-1">{d.proTip}</p>
                      <p className="text-xs text-text-primary leading-snug">{weeklyReview.proTip}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">{d.weeklyEmpty}</p>
          )}
        </motion.section>
      </div>
    </AppShell>
  );
}

function QuickActionTile({
  icon,
  title,
  description,
  onClick,
  tone,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  tone: ActionTone;
}) {
  const accents = {
    brand: 'border-primary-500/25 bg-primary-500/10 text-primary-400',
    info: 'border-info-500/25 bg-info-500/10 text-info-400',
    success: 'border-success-500/25 bg-success-500/10 text-success-400',
  } satisfies Record<ActionTone, string>;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -0.5 }}
      whileTap={{ scale: 0.995 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
      className={clsx(
        'relative flex min-w-[calc(33.333%-0.35rem)] flex-1 flex-col gap-0.5 rounded-lg bg-background/20 px-2 py-1.5 text-left',
        'ring-1 ring-white/[0.05] hover:bg-background/35 md:min-h-0 md:min-w-0 md:flex-row md:items-center md:justify-center md:gap-2 md:py-2'
      )}
    >
      <div className="flex items-center gap-2 md:justify-center">
        <div
          className={clsx(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border',
            '[&>svg]:h-[14px] [&>svg]:w-[14px] [&>svg]:stroke-[1.85]',
            accents[tone]
          )}
        >
          {icon}
        </div>
        <span className="text-xs font-semibold tracking-tight text-text-primary leading-tight truncate md:text-center">
          {title}
        </span>
      </div>
      <p className="line-clamp-2 pl-9 text-[10px] leading-snug text-text-muted md:hidden">{description}</p>
    </motion.button>
  );
}

function BriefStatPill({
  label,
  value,
  icon,
  className,
  tabularValue,
  tooltip,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  className?: string;
  /** Prose goals read better without tabular figures */
  tabularValue?: boolean;
  tooltip?: string;
}) {
  const body = (
    <div
      className={clsx(
        'flex min-h-[2.75rem] min-w-0 items-start gap-2 rounded-lg bg-background/55 px-2.5 py-2 ring-1 ring-white/[0.08]',
        tooltip && 'cursor-help',
        className
      )}
      tabIndex={tooltip ? 0 : undefined}
    >
      {icon ? <span className="mt-0.5 shrink-0 text-text-muted opacity-90">{icon}</span> : null}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">{label}</p>
        <p
          className={clsx(
            'mt-0.5 text-xs font-semibold leading-snug text-text-primary break-words',
            tabularValue !== false && 'tabular-nums'
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );

  if (!tooltip?.trim()) return body;

  return (
    <Tooltip content={tooltip} inline={false} side="top" anchored>
      {body}
    </Tooltip>
  );
}

