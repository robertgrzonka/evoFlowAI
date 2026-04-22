import { DocumentNode } from '@apollo/client';
import {
  DAILY_ACTIVITY_QUERY,
  DAILY_STATS_QUERY,
  DASHBOARD_INSIGHT_QUERY,
  MY_WORKOUTS_QUERY,
  WEEKLY_EVO_REVIEW_QUERY,
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

export const buildDayRefetchQueries = (date: string): Array<{ query: DocumentNode; variables: Record<string, unknown> }> => [
  { query: DAILY_STATS_QUERY, variables: { date } },
  { query: MY_WORKOUTS_QUERY, variables: { date, limit: WORKOUTS_DAY_LIMIT, offset: 0 } },
  { query: DAILY_ACTIVITY_QUERY, variables: { date } },
  { query: DASHBOARD_INSIGHT_QUERY, variables: { date } },
  { query: WORKOUT_COACH_SUMMARY_QUERY, variables: { date } },
  ...weeklyEvoReviewRefetches(date),
];
