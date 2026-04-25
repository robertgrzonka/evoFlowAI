import crypto from 'crypto';
import { WeeklyEvoReviewCache } from '../models/WeeklyEvoReviewCache';

export type WeeklyEvoReviewAiPayload = {
  summary: string;
  proTip: string;
  highlights: string[];
};

const round2 = (n: number) => Math.round(Number(n) * 100) / 100;

function hashJson(payload: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

/**
 * Fingerprint: same numbers → same scores; `voiceRefreshBucket` rotates copy every ~3h without data change.
 */
export function fingerprintWeeklyEvoReview(input: {
  weekEnd: string;
  voiceRefreshBucket: number;
  openaiModel: string;
  appLocale?: string;
  coachingTone?: string;
  proactivityLevel?: string;
  primaryGoal?: string;
  nutritionScore: number;
  trainingScore: number;
  consistencyScore: number;
  totalCalories: number;
  totalProtein: number;
  avgDailyProtein: number;
  targetPeriodCalories: number;
  staticWeekKcal: number;
  calorieGoal: number;
  proteinGoal: number;
  workoutsCount: number;
  totalMinutes: number;
  totalStepsTracked: number;
  mealDays: number;
  workoutDays: number;
  trackedDays: number;
  availableDays: number;
  isCompleteWeek: boolean;
  periodDays: number;
  scaledWeeklySessionsTarget: number;
  scaledWeeklyMinutesTarget: number;
}): string {
  const body = {
    schema: 'weekly_evo_review_v1',
    openaiModel: input.openaiModel,
    voiceRefreshBucket: input.voiceRefreshBucket,
    weekEnd: input.weekEnd,
    appLocale: input.appLocale ?? null,
    coachingTone: input.coachingTone ?? null,
    proactivityLevel: input.proactivityLevel ?? null,
    primaryGoal: input.primaryGoal ?? null,
    nutritionScore: input.nutritionScore,
    trainingScore: input.trainingScore,
    consistencyScore: input.consistencyScore,
    totalCalories: Math.round(input.totalCalories),
    totalProtein: round2(input.totalProtein),
    avgDailyProtein: round2(input.avgDailyProtein),
    targetPeriodCalories: Math.round(input.targetPeriodCalories),
    staticWeekKcal: Math.round(input.staticWeekKcal),
    calorieGoal: Math.round(input.calorieGoal),
    proteinGoal: Math.round(input.proteinGoal),
    workoutsCount: input.workoutsCount,
    totalMinutes: Math.round(input.totalMinutes),
    totalStepsTracked: Math.round(input.totalStepsTracked),
    mealDays: input.mealDays,
    workoutDays: input.workoutDays,
    trackedDays: input.trackedDays,
    availableDays: input.availableDays,
    isCompleteWeek: input.isCompleteWeek,
    periodDays: input.periodDays,
    scaledWeeklySessionsTarget: round2(input.scaledWeeklySessionsTarget),
    scaledWeeklyMinutesTarget: Math.round(input.scaledWeeklyMinutesTarget),
  };
  return hashJson(body);
}

export async function getWeeklyEvoReviewFromCache(
  userId: string,
  weekEnd: string,
  fingerprint: string
): Promise<WeeklyEvoReviewAiPayload | null> {
  const doc = await WeeklyEvoReviewCache.findOne({ userId, weekEnd }).lean();
  if (!doc || doc.fingerprint !== fingerprint) return null;
  const highlights = Array.isArray(doc.highlights) ? [...doc.highlights] : [];
  return {
    summary: doc.summary,
    proTip: doc.proTip,
    highlights,
  };
}

export async function saveWeeklyEvoReviewToCache(
  userId: string,
  weekEnd: string,
  fingerprint: string,
  payload: WeeklyEvoReviewAiPayload
): Promise<void> {
  await WeeklyEvoReviewCache.findOneAndUpdate(
    { userId, weekEnd },
    {
      userId,
      weekEnd,
      fingerprint,
      summary: payload.summary,
      proTip: payload.proTip,
      highlights: payload.highlights.slice(0, 3),
      updatedAt: new Date(),
    },
    { upsert: true, new: true }
  );
}
