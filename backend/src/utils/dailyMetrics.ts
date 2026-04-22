import { FoodItem } from '../models/FoodItem';
import { addDaysToDateKey } from './weekRange';
import { Workout } from '../models/Workout';
import { DailyActivity } from '../models/DailyActivity';
import { buildDynamicTargets } from './activityBudget';

type UserPreferencesShape = {
  dailyCalorieGoal?: number;
  activityLevel?: string;
  primaryGoal?: string;
  proteinGoal?: number;
  carbsGoal?: number;
  fatGoal?: number;
};

export const getTodayDateKey = (): string => new Date().toISOString().split('T')[0];

export const normalizeDateKey = (input?: string): string => {
  const candidate = String(input || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
    return candidate;
  }
  const parsed = new Date(candidate);
  if (Number.isNaN(parsed.getTime())) {
    return getTodayDateKey();
  }
  return parsed.toISOString().split('T')[0];
};

export const getDayRangeByDateKey = (dateKey: string): { startDate: Date; endDate: Date } => {
  const normalized = normalizeDateKey(dateKey);
  const startDate = new Date(`${normalized}T00:00:00.000Z`);
  const endDate = new Date(`${addDaysToDateKey(normalized, 1)}T00:00:00.000Z`);
  return { startDate, endDate };
};

export const getDailyMetrics = async (input: {
  userId: string;
  dateKey?: string;
  preferences?: UserPreferencesShape;
}) => {
  const dateKey = normalizeDateKey(input.dateKey);
  const { startDate, endDate } = getDayRangeByDateKey(dateKey);

  const [meals, workouts, dayActivity] = await Promise.all([
    FoodItem.find({
      userId: input.userId,
      createdAt: { $gte: startDate, $lt: endDate },
    }).sort({ createdAt: 1 }),
    Workout.find({
      userId: input.userId,
      performedAt: { $gte: startDate, $lt: endDate },
    }).sort({ performedAt: -1 }),
    DailyActivity.findOne({
      userId: input.userId,
      date: dateKey,
    }),
  ]);

  const totals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.nutrition.calories,
      protein: acc.protein + meal.nutrition.protein,
      carbs: acc.carbs + meal.nutrition.carbs,
      fat: acc.fat + meal.nutrition.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const workoutTotals = workouts.reduce(
    (acc, workout) => ({
      sessions: acc.sessions + 1,
      minutes: acc.minutes + Number(workout.durationMinutes || 0),
      caloriesBurned: acc.caloriesBurned + Number(workout.caloriesBurned || 0),
    }),
    { sessions: 0, minutes: 0, caloriesBurned: 0 }
  );

  const steps = Math.max(0, Number(dayActivity?.steps || 0));
  const activityBonusKcal = Math.max(0, Math.round(Number(dayActivity?.activityBonusKcal ?? 0)));
  const stepsCalories = 0;
  const dynamicTargets = buildDynamicTargets({
    baseCalories: input.preferences?.dailyCalorieGoal || 2000,
    activityLevel: input.preferences?.activityLevel,
    primaryGoal: input.preferences?.primaryGoal,
    workoutCalories: workoutTotals.caloriesBurned,
    stepCalories: stepsCalories,
    manualActivityBonusKcal: activityBonusKcal,
    manualProtein: input.preferences?.proteinGoal,
    manualCarbs: input.preferences?.carbsGoal,
    manualFat: input.preferences?.fatGoal,
  });

  const netCalories = totals.calories - workoutTotals.caloriesBurned;
  const remainingCalories = dynamicTargets.calorieBudget - totals.calories;
  const remainingProtein = Math.max(0, dynamicTargets.proteinGoal - totals.protein);
  const goalProgress = {
    calories: dynamicTargets.calorieBudget > 0 ? (totals.calories / dynamicTargets.calorieBudget) * 100 : 0,
    protein: dynamicTargets.proteinGoal > 0 ? (totals.protein / dynamicTargets.proteinGoal) * 100 : 0,
    carbs: dynamicTargets.carbsGoal > 0 ? (totals.carbs / dynamicTargets.carbsGoal) * 100 : 0,
    fat: dynamicTargets.fatGoal > 0 ? (totals.fat / dynamicTargets.fatGoal) * 100 : 0,
  };

  return {
    dateKey,
    startDate,
    endDate,
    meals,
    workouts,
    steps,
    stepsCalories,
    activityBonusKcal,
    totals,
    workoutTotals,
    dynamicTargets,
    netCalories,
    remainingCalories,
    remainingProtein,
    goalProgress,
  };
};
