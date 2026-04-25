import crypto from 'crypto';
import { WeeklyCoachInsightCache, type WeeklyCoachInsightKind } from '../models/WeeklyCoachInsightCache';

export type WeeklyCoachInsightPayload = {
  headline: string;
  summary: string;
  focusAreas: string[];
  improvements: string[];
  closingLine: string;
};

const round2 = (n: number) => Math.round(Number(n) * 100) / 100;

function hashJson(payload: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

/** Fingerprint of everything that feeds the weekly meals coach prompt (data + prefs + display name). */
export function fingerprintWeeklyMealsCoach(
  input: {
    weekStart: string;
    weekEnd: string;
    days: Array<{
      date: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      mealCount: number;
      dayCalorieBudget: number;
      workoutCaloriesBurned: number;
      workoutSessions: number;
      activityBonusKcal: number;
      steps: number;
      stepCaloriesBudget: number;
    }>;
    daysWithMeals: number;
    totalMealsLogged: number;
    goals: { calories: number; protein: number; carbs: number; fat: number };
    totals: { calories: number; protein: number; carbs: number; fat: number };
    averages: { calories: number; protein: number; carbs: number; fat: number };
  },
  prefs: {
    primaryGoal?: string;
    coachingTone?: string;
    proactivityLevel?: string;
    appLocale?: string;
  } | null | undefined,
  userName?: string | null
): string {
  const body = {
    schema: 'weekly_meals_coach_v3',
    userName: String(userName || ''),
    weekStart: input.weekStart,
    weekEnd: input.weekEnd,
    days: input.days.map((d) => ({
      date: d.date,
      calories: round2(d.calories),
      protein: round2(d.protein),
      carbs: round2(d.carbs),
      fat: round2(d.fat),
      mealCount: d.mealCount,
      dayCalorieBudget: Math.round(d.dayCalorieBudget),
      workoutCaloriesBurned: Math.round(d.workoutCaloriesBurned),
      workoutSessions: d.workoutSessions,
      activityBonusKcal: Math.round(d.activityBonusKcal),
      steps: Math.round(d.steps),
      stepCaloriesBudget: Math.round(d.stepCaloriesBudget),
    })),
    daysWithMeals: input.daysWithMeals,
    totalMealsLogged: input.totalMealsLogged,
    goals: {
      calories: Math.round(input.goals.calories),
      protein: Math.round(input.goals.protein),
      carbs: Math.round(input.goals.carbs),
      fat: Math.round(input.goals.fat),
    },
    totals: {
      calories: round2(input.totals.calories),
      protein: round2(input.totals.protein),
      carbs: round2(input.totals.carbs),
      fat: round2(input.totals.fat),
    },
    averages: {
      calories: round2(input.averages.calories),
      protein: round2(input.averages.protein),
      carbs: round2(input.averages.carbs),
      fat: round2(input.averages.fat),
    },
    prefs: {
      primaryGoal: prefs?.primaryGoal ?? null,
      coachingTone: prefs?.coachingTone ?? null,
      proactivityLevel: prefs?.proactivityLevel ?? null,
      appLocale: prefs?.appLocale ?? null,
    },
  };
  return hashJson(body);
}

/** Fingerprint of everything that feeds the weekly workouts coach prompt. */
export function fingerprintWeeklyWorkoutsCoach(
  input: {
    weekStart: string;
    weekEnd: string;
    days: Array<{
      date: string;
      sessionCount: number;
      totalMinutes: number;
      caloriesBurned: number;
      lowMinutes: number;
      mediumMinutes: number;
      highMinutes: number;
    }>;
    daysWithWorkouts: number;
    totalSessions: number;
    goals: { weeklySessionsTarget: number; weeklyActiveMinutesTarget: number };
    totals: { minutes: number; caloriesBurned: number; sessions: number };
    averages: { minutes: number; caloriesBurned: number; sessions: number };
  },
  prefs: {
    primaryGoal?: string;
    coachingTone?: string;
    proactivityLevel?: string;
    activityLevel?: string;
    appLocale?: string;
  } | null | undefined,
  userName?: string | null
): string {
  const body = {
    schema: 'weekly_workouts_coach_v1',
    userName: String(userName || ''),
    weekStart: input.weekStart,
    weekEnd: input.weekEnd,
    days: input.days.map((d) => ({
      date: d.date,
      sessionCount: d.sessionCount,
      totalMinutes: round2(d.totalMinutes),
      caloriesBurned: round2(d.caloriesBurned),
      lowMinutes: round2(d.lowMinutes),
      mediumMinutes: round2(d.mediumMinutes),
      highMinutes: round2(d.highMinutes),
    })),
    daysWithWorkouts: input.daysWithWorkouts,
    totalSessions: input.totalSessions,
    goals: {
      weeklySessionsTarget: Math.round(input.goals.weeklySessionsTarget),
      weeklyActiveMinutesTarget: Math.round(input.goals.weeklyActiveMinutesTarget),
    },
    totals: {
      minutes: round2(input.totals.minutes),
      caloriesBurned: round2(input.totals.caloriesBurned),
      sessions: round2(input.totals.sessions),
    },
    averages: {
      minutes: round2(input.averages.minutes),
      caloriesBurned: round2(input.averages.caloriesBurned),
      sessions: round2(input.averages.sessions),
    },
    prefs: {
      primaryGoal: prefs?.primaryGoal ?? null,
      coachingTone: prefs?.coachingTone ?? null,
      proactivityLevel: prefs?.proactivityLevel ?? null,
      activityLevel: prefs?.activityLevel ?? null,
      appLocale: prefs?.appLocale ?? null,
    },
  };
  return hashJson(body);
}

export async function getWeeklyCoachInsightFromCache(
  userId: string,
  kind: WeeklyCoachInsightKind,
  weekEnd: string,
  fingerprint: string
): Promise<WeeklyCoachInsightPayload | null> {
  const doc = await WeeklyCoachInsightCache.findOne({ userId, kind, weekEnd }).lean();
  if (!doc || doc.fingerprint !== fingerprint) return null;
  return {
    headline: doc.headline,
    summary: doc.summary,
    focusAreas: [...doc.focusAreas],
    improvements: [...doc.improvements],
    closingLine: doc.closingLine,
  };
}

export async function saveWeeklyCoachInsightToCache(
  userId: string,
  kind: WeeklyCoachInsightKind,
  weekEnd: string,
  fingerprint: string,
  insight: WeeklyCoachInsightPayload
): Promise<void> {
  await WeeklyCoachInsightCache.findOneAndUpdate(
    { userId, kind, weekEnd },
    {
      userId,
      kind,
      weekEnd,
      fingerprint,
      headline: insight.headline,
      summary: insight.summary,
      focusAreas: insight.focusAreas,
      improvements: insight.improvements,
      closingLine: insight.closingLine,
      updatedAt: new Date(),
    },
    { upsert: true, new: true }
  );
}
