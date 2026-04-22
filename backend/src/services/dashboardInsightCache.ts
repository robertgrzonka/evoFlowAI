import crypto from 'crypto';
import { DashboardInsightCache } from '../models/DashboardInsightCache';

export type DashboardInsightAiPayload = {
  summary: string;
  tips: string[];
};

const round2 = (n: number) => Math.round(Number(n) * 100) / 100;

function hashJson(payload: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

/**
 * Fingerprint of everything that feeds `generateDashboardInsights` (plus model id so
 * switching GPT-4 ↔ GPT-5 does not reuse the wrong voice).
 */
export function fingerprintDashboardInsight(input: {
  dateKey: string;
  currentHour: number;
  remainingDayPercent: number;
  estimatedMealsLeft: number;
  primaryGoal: string;
  userName: string;
  coachingTone?: string;
  proactivityLevel?: string;
  appLocale?: string;
  consumedCalories: number;
  consumedProtein: number;
  consumedCarbs: number;
  consumedFat: number;
  calorieGoal: number;
  proteinGoal: number;
  caloriesBurned: number;
  remainingCalories: number;
  remainingProtein: number;
  mealsCount: number;
  workoutSessions: number;
  steps: number;
  mealDetails: string[];
  workoutDetails: string[];
  openaiModel: string;
}): string {
  const body = {
    schema: 'dashboard_insight_v1',
    openaiModel: input.openaiModel,
    dateKey: input.dateKey,
    currentHour: input.currentHour,
    remainingDayPercent: input.remainingDayPercent,
    estimatedMealsLeft: input.estimatedMealsLeft,
    primaryGoal: input.primaryGoal,
    userName: String(input.userName || ''),
    coachingTone: input.coachingTone ?? null,
    proactivityLevel: input.proactivityLevel ?? null,
    appLocale: input.appLocale ?? null,
    consumedCalories: Math.round(input.consumedCalories),
    consumedProtein: round2(input.consumedProtein),
    consumedCarbs: round2(input.consumedCarbs),
    consumedFat: round2(input.consumedFat),
    calorieGoal: Math.round(input.calorieGoal),
    proteinGoal: Math.round(input.proteinGoal),
    caloriesBurned: Math.round(input.caloriesBurned),
    remainingCalories: Math.round(input.remainingCalories),
    remainingProtein: round2(input.remainingProtein),
    mealsCount: input.mealsCount,
    workoutSessions: input.workoutSessions,
    steps: Math.round(input.steps),
    mealDetails: input.mealDetails,
    workoutDetails: input.workoutDetails,
  };
  return hashJson(body);
}

export async function getDashboardInsightFromCache(
  userId: string,
  date: string,
  fingerprint: string
): Promise<DashboardInsightAiPayload | null> {
  const doc = await DashboardInsightCache.findOne({ userId, date }).lean();
  if (!doc || doc.fingerprint !== fingerprint) return null;
  return {
    summary: doc.summary,
    tips: [...doc.tips],
  };
}

export async function saveDashboardInsightToCache(
  userId: string,
  date: string,
  fingerprint: string,
  insight: DashboardInsightAiPayload
): Promise<void> {
  await DashboardInsightCache.findOneAndUpdate(
    { userId, date },
    {
      userId,
      date,
      fingerprint,
      summary: insight.summary,
      tips: insight.tips.slice(0, 3),
      updatedAt: new Date(),
    },
    { upsert: true, new: true }
  );
}
