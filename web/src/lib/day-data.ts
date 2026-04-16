import { DocumentNode } from '@apollo/client';
import {
  DAILY_ACTIVITY_QUERY,
  DAILY_STATS_QUERY,
  DASHBOARD_INSIGHT_QUERY,
  MY_WORKOUTS_QUERY,
  WORKOUT_COACH_SUMMARY_QUERY,
} from '@/lib/graphql/queries';

export const WORKOUTS_DAY_LIMIT = 50;
export const CHAT_HISTORY_LIMIT = 40;

export const buildDayRefetchQueries = (date: string): Array<{ query: DocumentNode; variables: Record<string, unknown> }> => [
  { query: DAILY_STATS_QUERY, variables: { date } },
  { query: MY_WORKOUTS_QUERY, variables: { date, limit: WORKOUTS_DAY_LIMIT, offset: 0 } },
  { query: DAILY_ACTIVITY_QUERY, variables: { date } },
  { query: DASHBOARD_INSIGHT_QUERY, variables: { date } },
  { query: WORKOUT_COACH_SUMMARY_QUERY, variables: { date } },
];
