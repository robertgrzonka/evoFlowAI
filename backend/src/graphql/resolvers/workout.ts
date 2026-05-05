import crypto from 'crypto';
import { coachPromptModeFromPrimaryGoal } from '@evoflowai/shared';
import { AuthenticationError, UserInputError } from 'apollo-server-express';
import { withFilter } from 'graphql-subscriptions';
import { FoodItem } from '../../models/FoodItem';
import { Workout } from '../../models/Workout';
import { DailyActivity } from '../../models/DailyActivity';
import { StepSyncConnection } from '../../models/StepSyncConnection';
import { Context } from '../context';
import { OpenAIService } from '../../services/openaiService';
import {
  fingerprintWeeklyWorkoutsCoach,
  getWeeklyCoachInsightFromCache,
  saveWeeklyCoachInsightToCache,
} from '../../services/weeklyCoachInsightCache';
import {
  fingerprintDashboardInsight,
  getDashboardInsightFromCache,
  saveDashboardInsightToCache,
} from '../../services/dashboardInsightCache';
import { DashboardInsightCache } from '../../models/DashboardInsightCache';
import {
  fingerprintWeeklyEvoReview,
  getWeeklyEvoReviewFromCache,
  saveWeeklyEvoReviewToCache,
} from '../../services/weeklyEvoReviewCache';
import { normalizeAppLocale } from '../../utils/appLocale';
import { GarminStepService } from '../../services/garminStepService';
import { parseWorkoutFile } from '../../services/workoutImportService';
import { getDailyMetrics, normalizeDateKey, resolveDayRangeForMetrics } from '../../utils/dailyMetrics';
import { buildWeekDateKeys, toWeekRange } from '../../utils/weekRange';
import { buildDynamicTargets } from '../../utils/activityBudget';
import { resolveAIAccessRuntime, runWithAIAccess } from '../../services/aiAccessService';
const parseIntensity = (value: string) => value.toLowerCase();
const openAIService = new OpenAIService();

/** Workout day panel: coaching copy comes from dashboard AI / chat — no template strings here. */
const buildCoachMessage = (_: {
  remainingProtein: number;
  remainingCalories: number;
  netCalories: number;
}) => '';

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

function weeklyEvoEmptyWindowHighlights(
  locale: ReturnType<typeof normalizeAppLocale>,
  availableDays: number
): string[] {
  if (locale === 'pl') {
    return [
      `Na razie brak logów posiłków w ${availableDays}-dniowym oknie — nie widać jeszcze profilu kalorycznego.`,
      `Nie ma też zapisanych treningów w tym oknie, więc obciążenie ruchem pozostaje niewiadomą.`,
      `Dodaj choć jeden dzień z posiłkiem lub treningiem, a Evo ułoży z tego sensowny tygodniowy obraz.`,
    ];
  }
  return [
    `No meal logs in this ${availableDays}-day window yet — calories are still a blank page.`,
    `No workouts logged here either — training load is unknown so far.`,
    `Add one day with a meal or a session and Evo can shape a real weekly trend.`,
  ];
}

function weeklyEvoFallbackHighlights(opts: {
  locale: ReturnType<typeof normalizeAppLocale>;
  availableDays: number;
  periodDays: number;
  trackedDays: number;
  mealDays: number;
  workoutDays: number;
  totalCalories: number;
  targetPeriodCalories: number;
  staticWeekKcal: number;
  calorieGoalBase: number;
  avgDailyProtein: number;
  proteinGoal: number;
  workoutsCount: number;
  totalMinutes: number;
  totalStepsTracked: number;
  scaledWorkoutGoal: number;
  scaledMinutesGoal: number;
  weeklyWorkoutGoal: number;
  weeklyMinutesGoal: number;
}): string[] {
  const isPl = opts.locale === 'pl';
  const {
    availableDays,
    periodDays,
    trackedDays,
    mealDays,
    workoutDays,
    totalCalories,
    targetPeriodCalories,
    staticWeekKcal,
    calorieGoalBase,
    avgDailyProtein,
    proteinGoal,
    workoutsCount,
    totalMinutes,
    totalStepsTracked,
    scaledWorkoutGoal,
    scaledMinutesGoal,
    weeklyWorkoutGoal,
    weeklyMinutesGoal,
  } = opts;

  if (isPl) {
    return [
      `Odżywianie: ok. ${Math.round(totalCalories)} kcal przy szacunku ~${Math.round(targetPeriodCalories)} kcal (suma dziennych celów z paleniem z treningu i bonusami; „goła” baza 7×${calorieGoalBase} kcal to ${staticWeekKcal} kcal). Średnio ${Math.round(avgDailyProtein)} g białka dziennie przy celu ${proteinGoal} g.`,
      `Trening: ${workoutsCount} sesji, ${Math.round(totalMinutes)} aktywnych minut, ${Math.round(totalStepsTracked)} kroków w logu. Dla tego okna skalowane cele to ~${Math.round(scaledWorkoutGoal)} sesji i ~${Math.round(scaledMinutesGoal)} min (pełny tydzień: ${weeklyWorkoutGoal} sesji / ${weeklyMinutesGoal} min).`,
      `Konsekwencja: dni z jedzeniem ${mealDays}/${periodDays}, z treningiem ${workoutDays}/${periodDays}; ${trackedDays} dni miało jakikolwiek wpis w śledzonym oknie.`,
    ];
  }
  return [
    `Nutrition: about ${Math.round(totalCalories)} kcal vs a ~${Math.round(targetPeriodCalories)} kcal budget (daily targets with workout burn and bonuses; flat 7×${calorieGoalBase} kcal would be ${staticWeekKcal} kcal). Avg protein ~${Math.round(avgDailyProtein)} g/day vs ${proteinGoal} g.`,
    `Training: ${workoutsCount} sessions, ${Math.round(totalMinutes)} active minutes, ${Math.round(totalStepsTracked)} tracked steps. Scaled targets for this span: ~${Math.round(scaledWorkoutGoal)} sessions, ~${Math.round(scaledMinutesGoal)} min (full week: ${weeklyWorkoutGoal} / ${weeklyMinutesGoal}).`,
    `Consistency: ${mealDays}/${periodDays} days with meals, ${workoutDays}/${periodDays} with workouts; ${trackedDays} days had any log.`,
  ];
}

const ENV_GARMIN_API_TOKEN = process.env.GARMIN_API_TOKEN || '';
const GARMIN_PROVIDER = 'GARMIN' as const;

const formatStepSyncStatus = (connection: any) => ({
  provider: GARMIN_PROVIDER,
  connected: Boolean(connection?.status === 'CONNECTED'),
  configured: GarminStepService.isConfigured(),
  usingEnvToken: Boolean(!connection?.apiToken && ENV_GARMIN_API_TOKEN),
  lastSyncedAt: connection?.lastSyncedAt || null,
  lastError: connection?.lastError || null,
});

type WeeklyWorkoutsDayAgg = {
  date: string;
  sessionCount: number;
  totalMinutes: number;
  caloriesBurned: number;
  lowMinutes: number;
  mediumMinutes: number;
  highMinutes: number;
};

type WeeklyWorkoutsPayload = {
  weekStart: string;
  weekEnd: string;
  days: WeeklyWorkoutsDayAgg[];
  daysWithWorkouts: number;
  totalSessions: number;
  goals: { weeklySessionsTarget: number; weeklyActiveMinutesTarget: number };
  totals: { minutes: number; caloriesBurned: number; sessions: number };
  averages: { minutes: number; caloriesBurned: number; sessions: number };
};

const bucketIntensityMinutes = (intensityRaw: string | undefined, minutes: number) => {
  const int = String(intensityRaw || 'medium').toLowerCase();
  if (int === 'high') return { low: 0, medium: 0, high: minutes };
  if (int === 'low') return { low: minutes, medium: 0, high: 0 };
  return { low: 0, medium: minutes, high: 0 };
};

const loadWeeklyWorkoutsTraining = async (context: Context, endDateInput?: string | null): Promise<WeeklyWorkoutsPayload> => {
  const { startDate, nextDay, endKey, startKey } = toWeekRange(endDateInput || undefined);
  const dateKeys = buildWeekDateKeys(endKey);

  const sessions = await Workout.find({
    userId: context.user.id,
    performedAt: { $gte: startDate, $lt: nextDay },
  }).lean();

  type Bucket = {
    sessionCount: number;
    totalMinutes: number;
    caloriesBurned: number;
    lowMinutes: number;
    mediumMinutes: number;
    highMinutes: number;
  };

  const byKey = new Map<string, Bucket>();
  for (const key of dateKeys) {
    byKey.set(key, {
      sessionCount: 0,
      totalMinutes: 0,
      caloriesBurned: 0,
      lowMinutes: 0,
      mediumMinutes: 0,
      highMinutes: 0,
    });
  }

  for (const w of sessions) {
    const key = new Date(w.performedAt as Date).toISOString().split('T')[0];
    const bucket = byKey.get(key);
    if (!bucket) continue;
    const mins = Number(w.durationMinutes || 0);
    const kcal = Number(w.caloriesBurned || 0);
    const split = bucketIntensityMinutes(w.intensity as string | undefined, mins);
    bucket.sessionCount += 1;
    bucket.totalMinutes += mins;
    bucket.caloriesBurned += kcal;
    bucket.lowMinutes += split.low;
    bucket.mediumMinutes += split.medium;
    bucket.highMinutes += split.high;
  }

  const days: WeeklyWorkoutsDayAgg[] = dateKeys.map((date) => {
    const b = byKey.get(date)!;
    return {
      date,
      sessionCount: b.sessionCount,
      totalMinutes: b.totalMinutes,
      caloriesBurned: b.caloriesBurned,
      lowMinutes: b.lowMinutes,
      mediumMinutes: b.mediumMinutes,
      highMinutes: b.highMinutes,
    };
  });

  const prefs = context.user.preferences;
  const weeklySessionsTarget = Number(prefs?.weeklyWorkoutsGoal || 4);
  const weeklyActiveMinutesTarget = Number(prefs?.weeklyActiveMinutesGoal || 180);

  let totalMinutes = 0;
  let totalCaloriesBurned = 0;
  let totalSessions = 0;
  let daysWithWorkouts = 0;
  for (const d of days) {
    totalMinutes += d.totalMinutes;
    totalCaloriesBurned += d.caloriesBurned;
    totalSessions += d.sessionCount;
    if (d.sessionCount > 0) daysWithWorkouts += 1;
  }

  const periodDays = 7;
  const averages = {
    minutes: totalMinutes / periodDays,
    caloriesBurned: totalCaloriesBurned / periodDays,
    sessions: totalSessions / periodDays,
  };

  return {
    weekStart: dateKeys[0] || startKey,
    weekEnd: dateKeys[6] || endKey,
    days,
    daysWithWorkouts,
    totalSessions,
    goals: {
      weeklySessionsTarget,
      weeklyActiveMinutesTarget,
    },
    totals: {
      minutes: totalMinutes,
      caloriesBurned: totalCaloriesBurned,
      sessions: totalSessions,
    },
    averages,
  };
};

const buildFallbackWeeklyWorkoutsCoach = (prefs: any, payload: WeeklyWorkoutsPayload) => {
  const goalMode = coachPromptModeFromPrimaryGoal(prefs?.primaryGoal);
  const goalPhrase = String(prefs?.primaryGoal || 'maintenance').replace(/_/g, ' ');
  const sessionsTarget = payload.goals.weeklySessionsTarget;
  const minutesTarget = payload.goals.weeklyActiveMinutesTarget;
  const totalM = payload.totals.minutes;
  const totalS = payload.totals.sessions;
  const highShare =
    totalM > 0 ? payload.days.reduce((acc, d) => acc + d.highMinutes, 0) / totalM : 0;

  const headline =
    payload.daysWithWorkouts === 0
      ? 'No training signal this week yet'
      : totalS < sessionsTarget * 0.6
        ? 'Volume is behind your weekly target'
        : highShare > 0.55
          ? 'Intensity-heavy week — watch recovery'
          : 'Training week looks balanced';

  const summary =
    payload.daysWithWorkouts === 0
      ? 'Zero sessions in this 7-day window. Once you log a few workouts, Evo can read streaks, intensity mix, and how volume tracks against your goals.'
      : `You logged ${totalS} sessions and ~${Math.round(totalM)} training minutes vs targets of ${sessionsTarget} sessions and ${minutesTarget} active minutes per week. ${
          highShare > 0.5 ? 'A big share of minutes landed in high intensity—watch joint stress and sleep.' : 'Intensity spread looks workable for steady progression.'
        }`;

  const focusAreas: string[] = [];
  focusAreas.push(
    payload.daysWithWorkouts < 4
      ? `Only ${payload.daysWithWorkouts}/7 days had movement—pattern risk (weekend pile-ups) stays invisible.`
      : `Consistency across ${payload.daysWithWorkouts} active days is your main signal for ${
          goalPhrase.length > 56 ? `${goalPhrase.slice(0, 53)}…` : goalPhrase
        }.`
  );
  focusAreas.push(
    totalM < minutesTarget * 0.5
      ? `Total minutes (~${Math.round(totalM)}) are well under ${minutesTarget}/week—either deliberate deload or under-logging.`
      : `Total minutes (~${Math.round(totalM)}) vs ${minutesTarget}/week target frames how aggressive next week can be.`
  );
  focusAreas.push(
    highShare > 0.45
      ? `${Math.round(highShare * 100)}% of time in high intensity—pair with mobility or easy cardio if joints feel cranky.`
      : 'Intensity mix has headroom to add one harder block without blowing recovery.'
  );

  const improvements: string[] = [];
  improvements.push(
    totalS < sessionsTarget
      ? `Book ${Math.min(3, Math.max(1, sessionsTarget - totalS))} fixed sessions next week before touching nutrition targets.`
      : 'Keep session count; upgrade one slot with a measurable progression (load, reps, or tempo).'
  );
  improvements.push(
    totalM < minutesTarget * 0.65
      ? `Add ${Math.max(10, Math.round(minutesTarget / sessionsTarget - 20))}+ minutes to your shortest session twice this week.`
      : 'Add one 20-minute easy zone-2 finisher after strength for aerobic base without extra joint load.'
  );
  improvements.push(
    goalMode === 'FAT_LOSS' || goalMode === 'STRENGTH'
      ? 'Log RPE or top set each session so next week’s progression is honest, not guessed.'
      : 'Rotate one new movement pattern weekly to keep adherence high without boredom.'
  );

  const closingLine =
    payload.daysWithWorkouts === 0
      ? 'This 7-day window has zero logged sessions, so there is no volume or intensity pattern to read yet. Book one short session in the next 48 hours and log it so next week’s snapshot can anchor to real data.'
      : `Across the week you logged ${totalS} sessions and about ${Math.round(totalM)} minutes vs goals of ${sessionsTarget} sessions and ${minutesTarget} active minutes. For next week, keep the same slot rhythm but add ${totalS < sessionsTarget ? 'one extra' : 'a quality'} session where your minutes were lowest, so averages move toward target without a shock week.`;

  return {
    headline,
    summary,
    focusAreas: focusAreas.slice(0, 3),
    improvements: improvements.slice(0, 3),
    closingLine,
  };
};

export const workoutResolvers = {
  Workout: {
    intensity: (parent: { intensity?: string }) => String(parent.intensity || 'medium').toUpperCase(),
  },

  Query: {
    myWorkouts: async (
      _: any,
      {
        date,
        limit = 20,
        offset = 0,
        clientTimeZone,
      }: { date?: string; limit?: number; offset?: number; clientTimeZone?: string | null },
      context: Context
    ) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const filter: any = { userId: context.user.id };
      if (date) {
        const { startDate, endDate } = resolveDayRangeForMetrics(date, clientTimeZone ?? null);
        filter.performedAt = { $gte: startDate, $lt: endDate };
      }

      return Workout.find(filter)
        .sort({ performedAt: -1 })
        .limit(limit)
        .skip(offset);
    },

    dailyActivity: async (_: any, { date }: { date: string }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const record = await DailyActivity.findOne({ userId: context.user.id, date });
      const steps = Number(record?.steps || 0);
      return {
        date,
        steps,
        estimatedCalories: 0,
        activityBonusKcal: Math.max(0, Math.round(Number(record?.activityBonusKcal ?? 0))),
      };
    },

    rollingSevenDayAverageSteps: async (
      _: any,
      { endDate }: { endDate?: string | null; clientTimeZone?: string | null },
      context: Context
    ) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const endKey = normalizeDateKey(endDate ?? undefined);
      const keys = buildWeekDateKeys(endKey);
      const rows = await DailyActivity.find({
        userId: context.user.id,
        date: { $in: keys },
      }).lean();
      const total = rows.reduce((acc, r) => acc + Math.max(0, Number(r.steps || 0)), 0);
      return Math.round(total / keys.length);
    },

    workoutCoachSummary: async (
      _: any,
      { date, clientTimeZone }: { date: string; clientTimeZone?: string | null },
      context: Context
    ) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const dayMetrics = await getDailyMetrics({
        userId: context.user.id,
        dateKey: date,
        preferences: context.user.preferences,
        clientTimeZone: clientTimeZone ?? undefined,
      });

      return {
        date: dayMetrics.dateKey,
        consumedCalories: dayMetrics.totals.calories,
        consumedProtein: dayMetrics.totals.protein,
        calorieGoal: dayMetrics.dynamicTargets.calorieBudget,
        proteinGoal: dayMetrics.dynamicTargets.proteinGoal,
        caloriesBurned: dayMetrics.workoutTotals.caloriesBurned,
        steps: dayMetrics.steps,
        stepsCalories: dayMetrics.stepsCalories,
        calorieBudget: dayMetrics.dynamicTargets.calorieBudget,
        netCalories: dayMetrics.netCalories,
        remainingCalories: dayMetrics.remainingCalories,
        remainingProtein: dayMetrics.remainingProtein,
        message: buildCoachMessage({
          remainingProtein: dayMetrics.remainingProtein,
          remainingCalories: dayMetrics.remainingCalories,
          netCalories: dayMetrics.netCalories,
        }),
      };
    },

    dashboardInsight: async (
      _: any,
      { date, clientTimeZone }: { date: string; clientTimeZone?: string | null },
      context: Context
    ) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const dayMetrics = await getDailyMetrics({
        userId: context.user.id,
        dateKey: date,
        preferences: context.user.preferences,
        clientTimeZone: clientTimeZone ?? undefined,
      });
      const primaryGoal = context.user.preferences?.primaryGoal || 'maintenance';
      const now = new Date();
      const currentHour = now.getHours();
      const remainingHours = Math.max(0, 24 - currentHour);
      const remainingDayPercent = Math.max(0, Math.min(100, Math.round((remainingHours / 24) * 100)));
      const estimatedMealsLeft =
        currentHour < 11 ? 3 : currentHour < 16 ? 2 : currentHour < 21 ? 1 : 0;
      const voiceRefreshBucket = Math.floor(Date.now() / (3 * 60 * 60 * 1000));
      const mealDetails = dayMetrics.meals
        .slice(0, 5)
        .map((meal: any) => {
          const mealTime = meal.createdAt ? new Date(meal.createdAt) : null;
          const timeLabel = mealTime && Number.isFinite(mealTime.getTime())
            ? mealTime.toISOString().slice(11, 16)
            : 'time n/a';
          return `${String(meal.mealType || 'meal')} "${String(meal.name || 'Unnamed')}" at ${timeLabel} (${Math.round(Number(meal.nutrition?.calories || 0))} kcal, ${Math.round(Number(meal.nutrition?.protein || 0))}g protein)`;
        });
      const workoutDetails = dayMetrics.workouts
        .slice(0, 4)
        .map((workout: any) => {
          const workoutTime = workout.performedAt ? new Date(workout.performedAt) : null;
          const timeLabel = workoutTime && Number.isFinite(workoutTime.getTime())
            ? workoutTime.toISOString().slice(11, 16)
            : 'time n/a';
          return `"${String(workout.title || 'Workout')}" at ${timeLabel} (${Math.round(Number(workout.durationMinutes || 0))} min, ${Math.round(Number(workout.caloriesBurned || 0))} kcal)`;
        });

      const openaiModel = resolveAIAccessRuntime(context.user).model;
      const dashboardFingerprint = fingerprintDashboardInsight({
        dateKey: dayMetrics.dateKey,
        currentHour,
        remainingDayPercent,
        estimatedMealsLeft,
        primaryGoal,
        userName: String(context.user.name || ''),
        coachingTone: context.user.preferences?.coachingTone,
        proactivityLevel: context.user.preferences?.proactivityLevel,
        appLocale: context.user.preferences?.appLocale,
        consumedCalories: dayMetrics.totals.calories,
        consumedProtein: dayMetrics.totals.protein,
        consumedCarbs: dayMetrics.totals.carbs,
        consumedFat: dayMetrics.totals.fat,
        calorieGoal: dayMetrics.dynamicTargets.calorieBudget,
        proteinGoal: dayMetrics.dynamicTargets.proteinGoal,
        caloriesBurned: dayMetrics.workoutTotals.caloriesBurned,
        remainingCalories: dayMetrics.remainingCalories,
        remainingProtein: dayMetrics.remainingProtein,
        mealsCount: dayMetrics.meals.length,
        workoutSessions: dayMetrics.workouts.length,
        steps: dayMetrics.steps,
        mealDetails,
        workoutDetails,
        openaiModel,
        voiceRefreshBucket,
      });

      let aiInsight = await getDashboardInsightFromCache(
        context.user.id,
        dayMetrics.dateKey,
        dashboardFingerprint
      );

      if (!aiInsight) {
        try {
          const { value } = await runWithAIAccess(context.user, openAIService, (service) =>
            service.generateDashboardInsights({
              date: dayMetrics.dateKey,
              calorieGoal: dayMetrics.dynamicTargets.calorieBudget,
              proteinGoal: dayMetrics.dynamicTargets.proteinGoal,
              primaryGoal,
              userName: context.user.name,
              coachingTone: context.user.preferences?.coachingTone,
              proactivityLevel: context.user.preferences?.proactivityLevel,
              consumedCalories: dayMetrics.totals.calories,
              consumedProtein: dayMetrics.totals.protein,
              consumedCarbs: dayMetrics.totals.carbs,
              consumedFat: dayMetrics.totals.fat,
              caloriesBurned: dayMetrics.workoutTotals.caloriesBurned,
              remainingCalories: dayMetrics.remainingCalories,
              remainingProtein: dayMetrics.remainingProtein,
              mealsCount: dayMetrics.meals.length,
              workoutSessions: dayMetrics.workouts.length,
              steps: dayMetrics.steps,
              currentHour,
              remainingDayPercent,
              estimatedMealsLeft,
              mealDetails,
              workoutDetails,
              appLocale: context.user.preferences?.appLocale,
            })
          );
          aiInsight = value;
          await saveDashboardInsightToCache(
            context.user.id,
            dayMetrics.dateKey,
            dashboardFingerprint,
            aiInsight
          );
        } catch (error) {
          console.error('dashboardInsight AI error:', error);
          return {
            date: dayMetrics.dateKey,
            summary: '',
            supportLine: '',
            tips: [],
            nextAction: null,
            insightUpdatedAt: null,
            caloriesBurned: dayMetrics.workoutTotals.caloriesBurned,
            steps: dayMetrics.steps,
            stepsCalories: dayMetrics.stepsCalories,
            calorieBudget: dayMetrics.dynamicTargets.calorieBudget,
            netCalories: dayMetrics.netCalories,
            remainingCalories: dayMetrics.remainingCalories,
            remainingProtein: dayMetrics.remainingProtein,
          };
        }
      }

      const cacheRow = await DashboardInsightCache.findOne({
        userId: context.user.id,
        date: dayMetrics.dateKey,
      }).lean();
      const insightUpdatedAt =
        cacheRow &&
        cacheRow.fingerprint === dashboardFingerprint &&
        cacheRow.updatedAt
          ? new Date(cacheRow.updatedAt).toISOString()
          : null;

      return {
        date: dayMetrics.dateKey,
        summary: aiInsight.summary,
        supportLine: aiInsight.supportLine || '',
        tips: Array.isArray(aiInsight.tips) ? aiInsight.tips.slice(0, 3) : [],
        nextAction: aiInsight.nextAction || null,
        insightUpdatedAt,
        caloriesBurned: dayMetrics.workoutTotals.caloriesBurned,
        steps: dayMetrics.steps,
        stepsCalories: dayMetrics.stepsCalories,
        calorieBudget: dayMetrics.dynamicTargets.calorieBudget,
        netCalories: dayMetrics.netCalories,
        remainingCalories: dayMetrics.remainingCalories,
        remainingProtein: dayMetrics.remainingProtein,
      };
    },

    weeklyEvoReview: async (_: any, { endDate }: { endDate?: string }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const { startDate, nextDay, startKey, endKey, weekEndLastInstant } = toWeekRange(endDate);
      const [meals, workouts, activityDays] = await Promise.all([
        FoodItem.find({
          userId: context.user.id,
          createdAt: { $gte: startDate, $lt: nextDay },
        }),
        Workout.find({
          userId: context.user.id,
          performedAt: { $gte: startDate, $lt: nextDay },
        }),
        DailyActivity.find({
          userId: context.user.id,
          date: {
            $gte: startKey,
            $lte: endKey,
          },
        }),
      ]);

      const calorieGoal = context.user.preferences?.dailyCalorieGoal || 2000;
      const proteinGoal = context.user.preferences?.proteinGoal || 150;
      const weeklyWorkoutGoal = context.user.preferences?.weeklyWorkoutsGoal || 4;
      const weeklyMinutesGoal = context.user.preferences?.weeklyActiveMinutesGoal || 180;

      const totalCalories = meals.reduce((acc, meal) => acc + meal.nutrition.calories, 0);
      const totalProtein = meals.reduce((acc, meal) => acc + meal.nutrition.protein, 0);
      const totalMinutes = workouts.reduce((acc, workout) => acc + (workout.durationMinutes || 0), 0);

      const mealDays = new Set(
        meals.map((meal) => new Date(meal.createdAt).toISOString().split('T')[0])
      ).size;
      const workoutDays = new Set(
        workouts.map((workout) => new Date(workout.performedAt).toISOString().split('T')[0])
      ).size;
      const trackedDaySet = new Set<string>([
        ...meals.map((meal) => new Date(meal.createdAt).toISOString().split('T')[0]),
        ...workouts.map((workout) => new Date(workout.performedAt).toISOString().split('T')[0]),
        ...activityDays.map((day) => day.date),
      ]);
      const trackedDays = trackedDaySet.size;
      const userCreatedAtRaw = (context.user as any)?.createdAt ? new Date((context.user as any).createdAt) : new Date();
      userCreatedAtRaw.setHours(0, 0, 0, 0);
      const availableStartDate = userCreatedAtRaw > startDate ? userCreatedAtRaw : startDate;
      const availableDays = Math.min(
        7,
        Math.max(1, Math.floor((weekEndLastInstant.getTime() - availableStartDate.getTime()) / (24 * 60 * 60 * 1000)) + 1)
      );
      const isCompleteWeek = availableDays >= 7;
      const periodDays = availableDays;
      const periodRatio = Math.min(1, periodDays / 7);

      const prefs = context.user.preferences;
      const uiLocale = normalizeAppLocale(String(prefs?.appLocale));
      const totalStepsTracked = activityDays.reduce((acc, day) => acc + Number(day.steps || 0), 0);

      if (trackedDays === 0) {
        return {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endKey,
          trackedDays,
          availableDays,
          isCompleteWeek,
          summary: '',
          highlights: weeklyEvoEmptyWindowHighlights(uiLocale, availableDays),
          proTip: '',
          nutritionScore: 0,
          trainingScore: 0,
          consistencyScore: 0,
        };
      }

      // Weekly calorie *target* = sum of each day's dynamic budget (same as dashboard day view:
      // base + goal delta + logged workout burn + steps estimate + manual activity bonus). Avoids flat 7×base e.g. 14000.
      const weekDateKeys = buildWeekDateKeys(endKey);
      const workoutBurnByDate = new Map<string, number>();
      for (const dk of weekDateKeys) workoutBurnByDate.set(dk, 0);
      for (const workout of workouts) {
        const dk = new Date(workout.performedAt).toISOString().split('T')[0];
        if (!workoutBurnByDate.has(dk)) continue;
        workoutBurnByDate.set(dk, (workoutBurnByDate.get(dk) || 0) + Number(workout.caloriesBurned || 0));
      }
      const activityBonusByDate = new Map<string, number>();
      for (const day of activityDays) {
        activityBonusByDate.set(
          String(day.date),
          Math.max(0, Math.round(Number(day.activityBonusKcal ?? 0)))
        );
      }
      const carbsGoalNum = Number(prefs?.carbsGoal ?? 200);
      const fatGoalNum = Number(prefs?.fatGoal ?? 65);
      let sumWeeklyCalorieBudget = 0;
      for (const dk of weekDateKeys) {
        const burn = workoutBurnByDate.get(dk) || 0;
        const bonus = activityBonusByDate.get(dk) || 0;
        const dt = buildDynamicTargets({
          baseCalories: Number(calorieGoal),
          activityLevel: prefs?.activityLevel,
          primaryGoal: prefs?.primaryGoal,
          workoutCalories: burn,
          stepCalories: 0,
          manualActivityBonusKcal: bonus,
          manualProtein: Number(proteinGoal),
          manualCarbs: carbsGoalNum,
          manualFat: fatGoalNum,
        });
        sumWeeklyCalorieBudget += dt.calorieBudget;
      }

      const targetPeriodCalories = sumWeeklyCalorieBudget;
      const avgDailyProtein = totalProtein / periodDays;
      const scaledWorkoutGoal = weeklyWorkoutGoal > 0 ? Math.max(1, weeklyWorkoutGoal * periodRatio) : 0;
      const scaledMinutesGoal = weeklyMinutesGoal > 0 ? Math.max(1, weeklyMinutesGoal * periodRatio) : 0;

      const calorieDeltaRatio =
        targetPeriodCalories > 0
          ? Math.abs(totalCalories - targetPeriodCalories) / targetPeriodCalories
          : 1;
      const proteinRatio = proteinGoal > 0 ? avgDailyProtein / proteinGoal : 0;
      const workoutGoalRatio = scaledWorkoutGoal > 0 ? workouts.length / scaledWorkoutGoal : 1;
      const minutesGoalRatio = scaledMinutesGoal > 0 ? totalMinutes / scaledMinutesGoal : 1;

      const nutritionScore = clampScore((1 - calorieDeltaRatio) * 60 + Math.min(1, proteinRatio) * 40);
      const trainingScore = clampScore(Math.min(1, workoutGoalRatio) * 55 + Math.min(1, minutesGoalRatio) * 45);
      const consistencyScore = clampScore(((mealDays / periodDays) * 50) + ((workoutDays / periodDays) * 50));

      const staticWeekKcal = Math.round(Number(calorieGoal) * weekDateKeys.length);

      const fallbackHighlights = weeklyEvoFallbackHighlights({
        locale: uiLocale,
        availableDays,
        periodDays,
        trackedDays,
        mealDays,
        workoutDays,
        totalCalories,
        targetPeriodCalories,
        staticWeekKcal,
        calorieGoalBase: Number(calorieGoal),
        avgDailyProtein,
        proteinGoal,
        workoutsCount: workouts.length,
        totalMinutes,
        totalStepsTracked,
        scaledWorkoutGoal,
        scaledMinutesGoal,
        weeklyWorkoutGoal: weeklyWorkoutGoal,
        weeklyMinutesGoal: weeklyMinutesGoal,
      });

      let summary = '';
      let proTip = '';
      let highlightsOut = fallbackHighlights;

      const sampleMealNames = [
        ...new Set(
          meals
            .map((m) => String(m.name || '').trim())
            .filter((n) => n.length > 1)
        ),
      ].slice(0, 10);
      const sampleWorkoutTitles = [
        ...new Set(
          workouts
            .map((w) => String(w.title || '').trim())
            .filter((t) => t.length > 1)
        ),
      ].slice(0, 8);
      const narrativeLens =
        parseInt(crypto.createHash('sha256').update(`${context.user.id}:${endKey}`).digest('hex').slice(0, 8), 16) % 4;

      const openaiModel = resolveAIAccessRuntime(context.user).model;
      const voiceRefreshBucket = Math.floor(Date.now() / (3 * 60 * 60 * 1000));
      const weeklyFingerprint = fingerprintWeeklyEvoReview({
        weekEnd: endKey,
        voiceRefreshBucket,
        openaiModel,
        appLocale: prefs?.appLocale,
        coachingTone: prefs?.coachingTone,
        proactivityLevel: prefs?.proactivityLevel,
        primaryGoal: prefs?.primaryGoal,
        nutritionScore,
        trainingScore,
        consistencyScore,
        totalCalories,
        totalProtein,
        avgDailyProtein,
        targetPeriodCalories,
        staticWeekKcal,
        calorieGoal: Number(calorieGoal),
        proteinGoal: Number(proteinGoal),
        workoutsCount: workouts.length,
        totalMinutes,
        totalStepsTracked,
        mealDays,
        workoutDays,
        trackedDays,
        availableDays,
        isCompleteWeek,
        periodDays,
        scaledWeeklySessionsTarget: scaledWorkoutGoal,
        scaledWeeklyMinutesTarget: scaledMinutesGoal,
      });

      const cachedWeekly = await getWeeklyEvoReviewFromCache(context.user.id, endKey, weeklyFingerprint);
      if (cachedWeekly) {
        summary = cachedWeekly.summary;
        proTip = cachedWeekly.proTip;
        highlightsOut = cachedWeekly.highlights;
      } else {
        try {
          const { value: aiNarrative } = await runWithAIAccess(context.user, openAIService, (service) =>
            service.generateWeeklyEvoReviewNarrative({
              userName: context.user.name,
              coachingTone: prefs?.coachingTone,
              proactivityLevel: prefs?.proactivityLevel,
              primaryGoal: prefs?.primaryGoal,
              activityLevel: prefs?.activityLevel,
              dietaryRestrictions: prefs?.dietaryRestrictions,
              weightKg: typeof prefs?.weightKg === 'number' ? prefs.weightKg : undefined,
              weeklyWorkoutsGoal: weeklyWorkoutGoal,
              weeklyActiveMinutesGoal: weeklyMinutesGoal,
              isCompleteWeek,
              availableDays,
              trackedDays,
              periodDays,
              nutritionScore,
              trainingScore,
              consistencyScore,
              weekStart: startKey,
              weekEnd: endKey,
              appLocale: prefs?.appLocale,
              narrativeLens,
              loggedMealNames: sampleMealNames,
              loggedWorkoutTitles: sampleWorkoutTitles,
              totalCalories,
              targetPeriodCalories,
              staticWeekKcal,
              calorieGoalBase: Number(calorieGoal),
              avgDailyProtein,
              proteinGoal,
              workoutsCount: workouts.length,
              totalActiveMinutes: totalMinutes,
              totalStepsTracked,
              mealDays,
              workoutDays,
              scaledWeeklySessionsTarget: scaledWorkoutGoal,
              scaledWeeklyMinutesTarget: scaledMinutesGoal,
            })
          );
          summary = aiNarrative.summary;
          proTip = aiNarrative.proTip;
          highlightsOut = aiNarrative.highlights;
          await saveWeeklyEvoReviewToCache(context.user.id, endKey, weeklyFingerprint, aiNarrative);
        } catch (error) {
          console.error('weeklyEvoReview narrative error:', error);
          summary = '';
          proTip = '';
          highlightsOut = fallbackHighlights;
        }
      }

      return {
        startDate: startKey,
        endDate: endKey,
        trackedDays,
        availableDays,
        isCompleteWeek,
        summary,
        highlights: highlightsOut,
        proTip,
        nutritionScore,
        trainingScore,
        consistencyScore,
      };
    },

    weeklyWorkoutsTraining: async (_: any, { endDate }: { endDate?: string | null }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }
      return loadWeeklyWorkoutsTraining(context, endDate);
    },

    weeklyWorkoutsCoachInsight: async (_: any, { endDate }: { endDate?: string | null }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const payload = await loadWeeklyWorkoutsTraining(context, endDate);
      const prefs = context.user.preferences;

      if (payload.daysWithWorkouts === 0) {
        return buildFallbackWeeklyWorkoutsCoach(prefs, payload);
      }

      const fingerprint = fingerprintWeeklyWorkoutsCoach(payload, prefs, context.user.name);
      const cached = await getWeeklyCoachInsightFromCache(context.user.id, 'workouts', payload.weekEnd, fingerprint);
      if (cached) {
        return cached;
      }

      try {
        const { value: insight } = await runWithAIAccess(context.user, openAIService, (service) =>
          service.generateWeeklyWorkoutsCoachInsight({
            weekStart: payload.weekStart,
            weekEnd: payload.weekEnd,
            userName: context.user.name,
            primaryGoal: prefs?.primaryGoal,
            coachingTone: prefs?.coachingTone,
            proactivityLevel: prefs?.proactivityLevel,
            activityLevel: prefs?.activityLevel,
            weeklyWorkoutsGoal: payload.goals.weeklySessionsTarget,
            weeklyActiveMinutesGoal: payload.goals.weeklyActiveMinutesTarget,
            daysWithWorkouts: payload.daysWithWorkouts,
            totalSessions: payload.totalSessions,
            days: payload.days,
            averages: payload.averages,
            totals: payload.totals,
            appLocale: prefs?.appLocale,
          })
        );
        await saveWeeklyCoachInsightToCache(context.user.id, 'workouts', payload.weekEnd, fingerprint, insight);
        return insight;
      } catch (error) {
        console.error('weeklyWorkoutsCoachInsight AI error:', error);
        const fallback = buildFallbackWeeklyWorkoutsCoach(prefs, payload);
        await saveWeeklyCoachInsightToCache(context.user.id, 'workouts', payload.weekEnd, fingerprint, fallback);
        return fallback;
      }
    },

    stepSyncStatus: async (_: any, { provider }: { provider: 'GARMIN' }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }
      if (provider !== GARMIN_PROVIDER) {
        throw new UserInputError('Unsupported sync provider');
      }

      const connection = await StepSyncConnection.findOne({
        userId: context.user.id,
        provider: GARMIN_PROVIDER,
      });
      return formatStepSyncStatus(connection);
    },
  },

  Mutation: {
    logWorkout: async (_: any, { input }: any, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const durationMinutes = Number(input.durationMinutes);
      const caloriesBurned = Number(input.caloriesBurned ?? 0);

      if (!Number.isFinite(durationMinutes) || durationMinutes < 1) {
        throw new UserInputError('Workout duration must be at least 1 minute');
      }

      if (!Number.isFinite(caloriesBurned) || caloriesBurned < 0) {
        throw new UserInputError('Calories burned cannot be negative');
      }

      const workout = new Workout({
        userId: context.user.id,
        title: input.title.trim(),
        notes: input.notes?.trim() || undefined,
        durationMinutes: Math.round(durationMinutes),
        caloriesBurned: Math.round(caloriesBurned),
        intensity: parseIntensity(input.intensity),
        performedAt: input.performedAt ? new Date(input.performedAt) : new Date(),
      });

      await workout.save();

      context.pubsub.publish('NEW_WORKOUT', {
        newWorkout: workout,
        userId: context.user.id,
      });

      return workout;
    },
    importWorkoutFile: async (
      _: any,
      {
        input,
      }: {
        input: {
          fileName: string;
          fileContentBase64: string;
          performedAt?: string | null;
          title?: string | null;
          notes?: string | null;
          intensity?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
        };
      },
      context: Context
    ) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const fileName = String(input.fileName || '').trim();
      if (!fileName) {
        throw new UserInputError('File name is required');
      }

      const contentBase64 = String(input.fileContentBase64 || '');
      if (!contentBase64) {
        throw new UserInputError('File content is required');
      }

      const buffer = Buffer.from(contentBase64, 'base64');
      if (!buffer.length) {
        throw new UserInputError('File content could not be decoded');
      }
      if (buffer.length > 10 * 1024 * 1024) {
        throw new UserInputError('Workout file is too large. Max size is 10MB.');
      }

      let parsed;
      try {
        parsed = await parseWorkoutFile({
          fileName,
          fileBuffer: buffer,
          weightKg: Number(context.user.preferences?.weightKg || 70),
        });
      } catch (error: any) {
        throw new UserInputError(error?.message || 'Could not parse workout file.');
      }

      const workout = new Workout({
        userId: context.user.id,
        title: String(input.title || '').trim() || parsed.title,
        notes: [String(parsed.notes || '').trim(), String(input.notes || '').trim()].filter(Boolean).join(' ').trim() || undefined,
        durationMinutes: Math.max(1, Math.round(parsed.durationMinutes)),
        caloriesBurned: Math.max(0, Math.round(parsed.caloriesBurned)),
        intensity: parseIntensity(String(input.intensity || 'MEDIUM')),
        performedAt: input.performedAt ? new Date(input.performedAt) : parsed.performedAt,
      });

      await workout.save();
      context.pubsub.publish('NEW_WORKOUT', {
        newWorkout: workout,
        userId: context.user.id,
      });

      return workout;
    },

    upsertDailyActivity: async (
      _: any,
      { input }: { input: { date: string; steps: number; activityBonusKcal?: number | null } },
      context: Context
    ) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const steps = Number(input.steps);
      if (!Number.isFinite(steps) || steps < 0 || steps > 120000) {
        throw new UserInputError('Steps must be between 0 and 120000');
      }

      const date = String(input.date || '').slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new UserInputError('Date must be in YYYY-MM-DD format');
      }

      const existing = await DailyActivity.findOne({ userId: context.user.id, date }).lean();
      const prevBonus = Math.max(0, Math.round(Number((existing as { activityBonusKcal?: number })?.activityBonusKcal ?? 0)));
      const bonusRaw = input.activityBonusKcal;
      const activityBonusKcal =
        bonusRaw === undefined || bonusRaw === null
          ? prevBonus
          : Math.max(0, Math.min(1500, Math.round(Number(bonusRaw))));

      const record = await DailyActivity.findOneAndUpdate(
        { userId: context.user.id, date },
        { $set: { steps: Math.round(steps), activityBonusKcal } },
        { upsert: true, new: true }
      );

      return {
        date,
        steps: Number(record?.steps || 0),
        estimatedCalories: 0,
        activityBonusKcal: Math.max(0, Math.round(Number(record?.activityBonusKcal ?? 0))),
      };
    },

    updateWorkout: async (_: any, { input }: any, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const doc = await Workout.findOne({ _id: input.id, userId: context.user.id });
      if (!doc) {
        throw new UserInputError('Workout not found');
      }

      if (input.title != null) {
        const t = String(input.title).trim();
        if (!t) {
          throw new UserInputError('Workout title cannot be empty');
        }
        doc.title = t;
      }
      if (input.notes !== undefined) {
        doc.notes = String(input.notes || '').trim() || undefined;
      }
      if (input.durationMinutes != null) {
        const d = Number(input.durationMinutes);
        if (!Number.isFinite(d) || d < 1) {
          throw new UserInputError('Workout duration must be at least 1 minute');
        }
        doc.durationMinutes = Math.round(d);
      }
      if (input.caloriesBurned != null) {
        const c = Number(input.caloriesBurned);
        if (!Number.isFinite(c) || c < 0) {
          throw new UserInputError('Calories burned cannot be negative');
        }
        doc.caloriesBurned = Math.round(c);
      }
      if (input.intensity != null) {
        doc.intensity = parseIntensity(String(input.intensity)) as typeof doc.intensity;
      }
      if (input.performedAt != null) {
        doc.performedAt = new Date(input.performedAt);
      }

      await doc.save();
      return doc;
    },

    deleteWorkout: async (_: any, { id }: { id: string }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const result = await Workout.deleteOne({ _id: id, userId: context.user.id });
      return result.deletedCount > 0;
    },
    connectGarminStepSync: async (
      _: any,
      { input }: { input?: { apiToken?: string | null } },
      context: Context
    ) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      if (!GarminStepService.isConfigured()) {
        throw new UserInputError(
          'Garmin sync is not configured on the server. Missing GARMIN_DAILY_STEPS_ENDPOINT.'
        );
      }

      const incomingToken = String(input?.apiToken || '').trim();
      if (!incomingToken && !ENV_GARMIN_API_TOKEN) {
        throw new UserInputError('Provide Garmin API token or configure GARMIN_API_TOKEN on the server.');
      }

      const connection = await StepSyncConnection.findOneAndUpdate(
        { userId: context.user.id, provider: GARMIN_PROVIDER },
        {
          $set: {
            status: 'CONNECTED',
            apiToken: incomingToken || undefined,
            lastError: null,
          },
        },
        { upsert: true, new: true }
      );

      return formatStepSyncStatus(connection);
    },
    disconnectStepSync: async (_: any, { provider }: { provider: 'GARMIN' }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }
      if (provider !== GARMIN_PROVIDER) {
        throw new UserInputError('Unsupported sync provider');
      }

      const result = await StepSyncConnection.findOneAndUpdate(
        { userId: context.user.id, provider: GARMIN_PROVIDER },
        {
          $set: {
            status: 'DISCONNECTED',
            apiToken: undefined,
            lastError: null,
          },
        },
        { new: true }
      );

      return Boolean(result);
    },
    syncGarminSteps: async (_: any, { date }: { date: string }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }
      const dateKey = normalizeDateKey(date);

      if (!GarminStepService.isConfigured()) {
        throw new UserInputError(
          'Garmin sync is not configured on the server. Missing GARMIN_DAILY_STEPS_ENDPOINT.'
        );
      }

      const connection = await StepSyncConnection.findOne({
        userId: context.user.id,
        provider: GARMIN_PROVIDER,
      });

      const apiToken = String(connection?.apiToken || ENV_GARMIN_API_TOKEN || '').trim();
      if (!apiToken) {
        throw new UserInputError('Garmin token is missing. Connect Garmin first in Settings.');
      }

      try {
        const importedSteps = await GarminStepService.fetchDailySteps({ date: dateKey, apiToken });
        const existing = await DailyActivity.findOne({ userId: context.user.id, date: dateKey });
        const savedSteps = Math.max(importedSteps, Number(existing?.steps || 0));
        const updatedActivity = await DailyActivity.findOneAndUpdate(
          { userId: context.user.id, date: dateKey },
          { $set: { steps: savedSteps } },
          { upsert: true, new: true }
        );

        const syncedAt = new Date();
        await StepSyncConnection.findOneAndUpdate(
          { userId: context.user.id, provider: GARMIN_PROVIDER },
          {
            $set: {
              status: 'CONNECTED',
              lastSyncedAt: syncedAt,
              lastError: null,
            },
          },
          { upsert: true, new: true }
        );

        return {
          date: dateKey,
          importedSteps,
          savedSteps: Number(updatedActivity?.steps || savedSteps),
          source: GARMIN_PROVIDER,
          syncedAt,
        };
      } catch (error: any) {
        await StepSyncConnection.findOneAndUpdate(
          { userId: context.user.id, provider: GARMIN_PROVIDER },
          {
            $set: {
              status: 'ERROR',
              lastError: error?.message || 'Garmin sync failed',
            },
          },
          { upsert: true, new: true }
        );
        throw new UserInputError(error?.message || 'Garmin sync failed');
      }
    },
  },

  Subscription: {
    newWorkout: {
      subscribe: withFilter(
        (_: any, __: any, context: any) => context.pubsub.asyncIterator(['NEW_WORKOUT']),
        (payload: any, variables: any) => payload.userId === variables.userId
      ),
    },
  },
};
