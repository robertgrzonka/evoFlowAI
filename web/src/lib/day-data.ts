import type { ApolloClient } from '@apollo/client';
import { DocumentNode } from '@apollo/client';
import {
  DAILY_ACTIVITY_QUERY,
  DAILY_STATS_QUERY,
  DASHBOARD_INSIGHT_QUERY,
  MY_WORKOUTS_QUERY,
  WEEKLY_EVO_REVIEW_QUERY,
  WEEKLY_MEALS_COACH_QUERY,
  WEEKLY_MEALS_NUTRITION_QUERY,
  WEEKLY_WORKOUTS_COACH_QUERY,
  WEEKLY_WORKOUTS_TRAINING_QUERY,
  WORKOUT_COACH_SUMMARY_QUERY,
} from '@/lib/graphql/queries';

export const WORKOUTS_DAY_LIMIT = 50;
export const CHAT_HISTORY_LIMIT = 40;

/** Aligns manual logs with daily rollups (see backend getDayRangeByDateKey). */
export const dateKeyToNoonUtcIso = (dateKey: string): string => `${dateKey}T12:00:00.000Z`;

const currentCalendarDateKey = () => new Date().toISOString().split('T')[0];

/**
 * After food/workout/activity changes, re-fetch weekly Evo review for the affected week end.
 * If the user edited a day other than "today", also refetch the week ending today so the
 * dashboard (anchored to today) stays in sync.
 */
const weeklyEvoReviewRefetches = (impactedDate: string) => {
  const today = currentCalendarDateKey();
  const out: Array<{ query: DocumentNode; variables: Record<string, unknown> }> = [
    { query: WEEKLY_EVO_REVIEW_QUERY, variables: { endDate: impactedDate } },
  ];
  if (impactedDate !== today) {
    out.push({ query: WEEKLY_EVO_REVIEW_QUERY, variables: { endDate: today } });
  }
  return out;
};

/**
 * Fast rollups after logging food/workout/steps — no OpenAI-backed dashboard insight or weekly
 * coach blocks, so the mutation can finish and the UI can unblock before heavy refetches.
 */
export const buildDayRefetchQueriesAfterLog = (
  date: string
): Array<{ query: DocumentNode; variables: Record<string, unknown> }> => [
  { query: DAILY_STATS_QUERY, variables: { date } },
  { query: MY_WORKOUTS_QUERY, variables: { date, limit: WORKOUTS_DAY_LIMIT, offset: 0 } },
  { query: DAILY_ACTIVITY_QUERY, variables: { date } },
  { query: WORKOUT_COACH_SUMMARY_QUERY, variables: { date } },
];

const buildDayDeferredRefetchQueries = (date: string) => [
  { query: DASHBOARD_INSIGHT_QUERY, variables: { date } },
  ...weeklyEvoReviewRefetches(date),
];

/** Full day refetch (legacy): core + dashboard insight + weekly Evo review. */
export const buildDayRefetchQueries = (date: string): Array<{ query: DocumentNode; variables: Record<string, unknown> }> => [
  ...buildDayRefetchQueriesAfterLog(date),
  ...buildDayDeferredRefetchQueries(date),
];

/** Dashboard insight + weekly Evo only (e.g. after steps / activity bonus). */
export function kickDeferredDashboardAndWeeklyEvo(client: ApolloClient<object>): void {
  void client
    .refetchQueries({
      include: [DASHBOARD_INSIGHT_QUERY, WEEKLY_EVO_REVIEW_QUERY],
    })
    .catch(() => {});
}

/** Heavy weeklies + insights after meal changes — run after the main mutation resolved. */
export function kickDeferredAfterMealLog(client: ApolloClient<object>): void {
  void client
    .refetchQueries({
      include: [
        DASHBOARD_INSIGHT_QUERY,
        WEEKLY_EVO_REVIEW_QUERY,
        WEEKLY_MEALS_NUTRITION_QUERY,
        WEEKLY_MEALS_COACH_QUERY,
      ],
    })
    .catch(() => {});
}

/** Heavy weeklies + insights after workout changes — run after the main mutation resolved. */
export function kickDeferredAfterWorkoutLog(client: ApolloClient<object>): void {
  void client
    .refetchQueries({
      include: [
        DASHBOARD_INSIGHT_QUERY,
        WEEKLY_EVO_REVIEW_QUERY,
        WEEKLY_WORKOUTS_TRAINING_QUERY,
        WEEKLY_WORKOUTS_COACH_QUERY,
      ],
    })
    .catch(() => {});
}
