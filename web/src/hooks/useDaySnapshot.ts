'use client';

import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import {
  DAILY_ACTIVITY_QUERY,
  DAILY_STATS_QUERY,
  DASHBOARD_INSIGHT_QUERY,
  MY_WORKOUTS_QUERY,
  WORKOUT_COACH_SUMMARY_QUERY,
} from '@/lib/graphql/queries';
import { WORKOUTS_DAY_LIMIT } from '@/lib/day-data';

type UseDaySnapshotOptions = {
  date: string;
  enabled?: boolean;
  includeInsight?: boolean;
};

export const useDaySnapshot = ({ date, enabled = true, includeInsight = false }: UseDaySnapshotOptions) => {
  const shouldSkip = !enabled;
  const statsQuery = useQuery(DAILY_STATS_QUERY, {
    variables: { date },
    skip: shouldSkip,
    fetchPolicy: 'cache-and-network',
  });
  const workoutsQuery = useQuery(MY_WORKOUTS_QUERY, {
    variables: { date, limit: WORKOUTS_DAY_LIMIT, offset: 0 },
    skip: shouldSkip,
    fetchPolicy: 'cache-and-network',
  });
  const activityQuery = useQuery(DAILY_ACTIVITY_QUERY, {
    variables: { date },
    skip: shouldSkip,
    fetchPolicy: 'cache-and-network',
  });
  const summaryQuery = useQuery(WORKOUT_COACH_SUMMARY_QUERY, {
    variables: { date },
    skip: shouldSkip,
    fetchPolicy: 'cache-and-network',
  });
  const insightQuery = useQuery(DASHBOARD_INSIGHT_QUERY, {
    variables: { date },
    skip: shouldSkip || !includeInsight,
    fetchPolicy: 'cache-and-network',
  });

  const stats = statsQuery.data?.dailyStats;
  const workouts = workoutsQuery.data?.myWorkouts || [];
  const activity = activityQuery.data?.dailyActivity;
  const summary = summaryQuery.data?.workoutCoachSummary;
  const insight = insightQuery.data?.dashboardInsight;

  const derived = useMemo(() => {
    const consumedCalories = Number(stats?.totalCalories || 0);
    const consumedProtein = Number(stats?.totalProtein || 0);
    const carbsConsumed = Number(stats?.totalCarbs || 0);
    const fatConsumed = Number(stats?.totalFat || 0);
    const caloriesBurned =
      Number(stats?.workoutCalories ?? 0) ||
      workouts.reduce((acc: number, workout: any) => acc + Number(workout?.caloriesBurned || 0), 0);
    const calorieBudget = Number(stats?.calorieBudget || stats?.dynamicGoals?.calories || 0);
    const proteinGoal = Number(stats?.dynamicGoals?.protein || 0);
    const carbsGoal = Number(stats?.dynamicGoals?.carbs || 0);
    const fatGoal = Number(stats?.dynamicGoals?.fat || 0);
    const steps = Number(activity?.steps ?? stats?.steps ?? 0);
    const workoutCount = workouts.length;
    const workoutMinutes = workouts.reduce((acc: number, workout: any) => acc + Number(workout?.durationMinutes || 0), 0);
    const remainingCalories = calorieBudget - consumedCalories;
    const remainingProtein = Math.max(0, proteinGoal - consumedProtein);
    const netCalories = consumedCalories - caloriesBurned;

    return {
      consumedCalories,
      consumedProtein,
      carbsConsumed,
      fatConsumed,
      caloriesBurned,
      calorieBudget,
      proteinGoal,
      carbsGoal,
      fatGoal,
      steps,
      workoutCount,
      workoutMinutes,
      remainingCalories,
      remainingProtein,
      netCalories,
    };
  }, [activity?.steps, stats, workouts]);

  const loading =
    statsQuery.loading ||
    workoutsQuery.loading ||
    activityQuery.loading ||
    summaryQuery.loading ||
    (includeInsight && insightQuery.loading);

  return {
    date,
    loading,
    stats,
    workouts,
    activity,
    summary,
    insight,
    derived,
    refetchDay: async () => {
      await Promise.all([
        statsQuery.refetch({ date }),
        workoutsQuery.refetch({ date, limit: WORKOUTS_DAY_LIMIT, offset: 0 }),
        activityQuery.refetch({ date }),
        summaryQuery.refetch({ date }),
        includeInsight ? insightQuery.refetch({ date }) : Promise.resolve(),
      ]);
    },
  };
};
