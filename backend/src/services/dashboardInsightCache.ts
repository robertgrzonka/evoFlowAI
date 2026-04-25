import crypto from 'crypto';
import { DashboardInsightCache } from '../models/DashboardInsightCache';

export type DashboardNextActionAiPayload = {
  title: string;
  description: string;
  actionLabel: string;
  /** MEALS | WORKOUTS | CHAT_COACH | STATS | GOALS */
  target: string;
};

export type DashboardInsightAiPayload = {
  summary: string;
  supportLine: string;
  tips: string[];
  nextAction?: DashboardNextActionAiPayload;
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
  /** Rotates every ~3h so cached copy refreshes without data changes. */
  voiceRefreshBucket: number;
}): string {
  const body = {
    schema: 'dashboard_insight_v3',
    openaiModel: input.openaiModel,
    voiceRefreshBucket: input.voiceRefreshBucket,
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
  const nextAction =
    doc.nextActionTitle &&
    doc.nextActionDescription &&
    doc.nextActionLabel &&
    doc.nextActionTarget
      ? {
          title: doc.nextActionTitle,
          description: doc.nextActionDescription,
          actionLabel: doc.nextActionLabel,
          target: doc.nextActionTarget,
        }
      : undefined;
  return {
    summary: doc.summary,
    supportLine: String(doc.supportLine || ''),
    tips: [...doc.tips],
    ...(nextAction ? { nextAction } : {}),
  };
}

export async function saveDashboardInsightToCache(
  userId: string,
  date: string,
  fingerprint: string,
  insight: DashboardInsightAiPayload
): Promise<void> {
  const $set: Record<string, unknown> = {
    userId,
    date,
    fingerprint,
    summary: insight.summary,
    supportLine: insight.supportLine,
    tips: insight.tips.slice(0, 3),
    updatedAt: new Date(),
  };
  if (insight.nextAction) {
    $set.nextActionTitle = insight.nextAction.title;
    $set.nextActionDescription = insight.nextAction.description;
    $set.nextActionLabel = insight.nextAction.actionLabel;
    $set.nextActionTarget = insight.nextAction.target;
  }
  const update: Record<string, unknown> = { $set };
  if (!insight.nextAction) {
    update.$unset = {
      nextActionTitle: '',
      nextActionDescription: '',
      nextActionLabel: '',
      nextActionTarget: '',
    };
  }
  await DashboardInsightCache.findOneAndUpdate({ userId, date }, update, { upsert: true, new: true });
}
