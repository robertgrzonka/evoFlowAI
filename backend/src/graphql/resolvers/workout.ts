import { AuthenticationError, UserInputError } from 'apollo-server-express';
import { withFilter } from 'graphql-subscriptions';
import { FoodItem } from '../../models/FoodItem';
import { Workout } from '../../models/Workout';
import { DailyActivity } from '../../models/DailyActivity';
import { Context } from '../context';
import { OpenAIService } from '../../services/openaiService';
import { buildDynamicTargets } from '../../utils/activityBudget';

const toDayRange = (date: string) => {
  const startDate = new Date(date);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);

  return { startDate, endDate };
};

const toWeekRange = (endDateInput?: string) => {
  const endDate = endDateInput ? new Date(endDateInput) : new Date();
  endDate.setHours(0, 0, 0, 0);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 6);
  const nextDay = new Date(endDate);
  nextDay.setDate(nextDay.getDate() + 1);
  return { startDate, endDate, nextDay };
};

const parseIntensity = (value: string) => value.toLowerCase();
const openAIService = new OpenAIService();

const buildCoachMessage = ({
  remainingProtein,
  remainingCalories,
  netCalories,
}: {
  remainingProtein: number;
  remainingCalories: number;
  netCalories: number;
}) => {
  const lines: string[] = [];

  if (remainingProtein <= 10) {
    lines.push('Great job! Protein target is almost done today.');
  } else if (remainingProtein <= 35) {
    lines.push(`Solid progress. Try adding around ${Math.ceil(remainingProtein)}g protein in the next meal.`);
  } else {
    lines.push(`You still need about ${Math.ceil(remainingProtein)}g protein. Prioritize lean protein first.`);
  }

  if (remainingCalories < -150) {
    lines.push('You are above your calorie target. Keep your next meal lighter and focus on protein + vegetables.');
  } else if (remainingCalories <= 250) {
    lines.push('Calorie target is close. Keep portions controlled for the rest of the day.');
  } else {
    lines.push(`You have about ${Math.ceil(remainingCalories)} kcal left. Good moment for a balanced meal.`);
  }

  if (netCalories < 0) {
    lines.push('High training output today. Remember hydration and a proper recovery meal.');
  }

  return lines.join(' ');
};

const buildFallbackTips = (remainingProtein: number, remainingCalories: number, netCalories: number) => {
  const nutritionTip =
    remainingProtein > 0
      ? `Aim for about ${Math.ceil(remainingProtein)}g protein in your next meal to stay on target.`
      : 'Protein goal is done. Keep meals lighter and focus on quality carbs and vegetables.';

  const trainingTip =
    remainingCalories < -150
      ? 'You are above net calories, so skip extra training volume and keep movement light today.'
      : netCalories < 0
        ? 'Training output is high today, so keep the next session moderate and prioritize technique.'
        : 'If energy feels good, a short easy session or walk can support consistency.';

  const recoveryTip =
    remainingCalories > 250
      ? `You still have around ${Math.ceil(remainingCalories)} kcal left, so use part of it for a recovery meal and hydration.`
      : 'Focus on hydration, sleep, and a balanced final meal to recover well.';

  return [nutritionTip, trainingTip, recoveryTip];
};

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export const workoutResolvers = {
  Workout: {
    intensity: (parent: { intensity?: string }) => String(parent.intensity || 'medium').toUpperCase(),
  },

  Query: {
    myWorkouts: async (
      _: any,
      { date, limit = 20, offset = 0 }: { date?: string; limit?: number; offset?: number },
      context: Context
    ) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const filter: any = { userId: context.user.id };
      if (date) {
        const { startDate, endDate } = toDayRange(date);
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
      };
    },

    workoutCoachSummary: async (_: any, { date }: { date: string }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const { startDate, endDate } = toDayRange(date);

      const [meals, workouts, dayActivity] = await Promise.all([
        FoodItem.find({
          userId: context.user.id,
          createdAt: { $gte: startDate, $lt: endDate },
        }),
        Workout.find({
          userId: context.user.id,
          performedAt: { $gte: startDate, $lt: endDate },
        }),
        DailyActivity.findOne({
          userId: context.user.id,
          date,
        }),
      ]);

      const consumedCalories = meals.reduce((acc, meal) => acc + meal.nutrition.calories, 0);
      const consumedProtein = meals.reduce((acc, meal) => acc + meal.nutrition.protein, 0);
      const caloriesBurned = workouts.reduce((acc, workout) => acc + (workout.caloriesBurned || 0), 0);

      const steps = Number(dayActivity?.steps || 0);
      const stepsCalories = 0;
      const dynamicTargets = buildDynamicTargets({
        baseCalories: context.user.preferences?.dailyCalorieGoal || 2000,
        activityLevel: context.user.preferences?.activityLevel,
        primaryGoal: context.user.preferences?.primaryGoal,
        workoutCalories: caloriesBurned,
        stepCalories: stepsCalories,
        manualProtein: context.user.preferences?.proteinGoal,
        manualCarbs: context.user.preferences?.carbsGoal,
        manualFat: context.user.preferences?.fatGoal,
      });

      const netCalories = consumedCalories - caloriesBurned;
      const remainingCalories = dynamicTargets.calorieBudget - consumedCalories;
      const remainingProtein = Math.max(0, dynamicTargets.proteinGoal - consumedProtein);

      return {
        date,
        consumedCalories,
        consumedProtein,
        calorieGoal: dynamicTargets.calorieBudget,
        proteinGoal: dynamicTargets.proteinGoal,
        caloriesBurned,
        steps,
        stepsCalories,
        calorieBudget: dynamicTargets.calorieBudget,
        netCalories,
        remainingCalories,
        remainingProtein,
        message: buildCoachMessage({ remainingProtein, remainingCalories, netCalories }),
      };
    },

    dashboardInsight: async (_: any, { date }: { date: string }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const { startDate, endDate } = toDayRange(date);
      const [meals, workouts, dayActivity] = await Promise.all([
        FoodItem.find({
          userId: context.user.id,
          createdAt: { $gte: startDate, $lt: endDate },
        }),
        Workout.find({
          userId: context.user.id,
          performedAt: { $gte: startDate, $lt: endDate },
        }),
        DailyActivity.findOne({
          userId: context.user.id,
          date,
        }),
      ]);

      const consumedCalories = meals.reduce((acc, meal) => acc + meal.nutrition.calories, 0);
      const consumedProtein = meals.reduce((acc, meal) => acc + meal.nutrition.protein, 0);
      const caloriesBurned = workouts.reduce((acc, workout) => acc + (workout.caloriesBurned || 0), 0);

      const steps = Number(dayActivity?.steps || 0);
      const stepsCalories = 0;
      const dynamicTargets = buildDynamicTargets({
        baseCalories: context.user.preferences?.dailyCalorieGoal || 2000,
        activityLevel: context.user.preferences?.activityLevel,
        primaryGoal: context.user.preferences?.primaryGoal,
        workoutCalories: caloriesBurned,
        stepCalories: stepsCalories,
        manualProtein: context.user.preferences?.proteinGoal,
        manualCarbs: context.user.preferences?.carbsGoal,
        manualFat: context.user.preferences?.fatGoal,
      });
      const primaryGoal = context.user.preferences?.primaryGoal || 'maintenance';
      const netCalories = consumedCalories - caloriesBurned;
      const remainingCalories = dynamicTargets.calorieBudget - consumedCalories;
      const remainingProtein = Math.max(0, dynamicTargets.proteinGoal - consumedProtein);

      try {
        const aiInsight = await openAIService.generateDashboardInsights({
          date,
          calorieGoal: dynamicTargets.calorieBudget,
          proteinGoal: dynamicTargets.proteinGoal,
          primaryGoal,
          coachingTone: context.user.preferences?.coachingTone,
          proactivityLevel: context.user.preferences?.proactivityLevel,
          consumedCalories,
          consumedProtein,
          caloriesBurned,
          remainingCalories,
          remainingProtein,
        });

        return {
          date,
          summary: aiInsight.summary,
          tips: aiInsight.tips,
          caloriesBurned,
          steps,
          stepsCalories,
          calorieBudget: dynamicTargets.calorieBudget,
          netCalories,
          remainingCalories,
          remainingProtein,
        };
      } catch (error) {
        const fallbackSummary = buildCoachMessage({ remainingProtein, remainingCalories, netCalories });
        return {
          date,
          summary: fallbackSummary,
          tips: buildFallbackTips(remainingProtein, remainingCalories, netCalories),
          caloriesBurned,
          steps,
          stepsCalories,
          calorieBudget: dynamicTargets.calorieBudget,
          netCalories,
          remainingCalories,
          remainingProtein,
        };
      }
    },

    weeklyEvoReview: async (_: any, { endDate }: { endDate?: string }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const { startDate, endDate: weekEndDate, nextDay } = toWeekRange(endDate);
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
            $gte: startDate.toISOString().split('T')[0],
            $lte: weekEndDate.toISOString().split('T')[0],
          },
        }),
      ]);

      const calorieGoal = context.user.preferences?.dailyCalorieGoal || 2000;
      const proteinGoal = context.user.preferences?.proteinGoal || 150;
      const weeklyWorkoutGoal = context.user.preferences?.weeklyWorkoutsGoal || 4;
      const weeklyMinutesGoal = context.user.preferences?.weeklyActiveMinutesGoal || 180;

      const totalCalories = meals.reduce((acc, meal) => acc + meal.nutrition.calories, 0);
      const totalProtein = meals.reduce((acc, meal) => acc + meal.nutrition.protein, 0);
      const totalWorkoutBurned = workouts.reduce((acc, workout) => acc + (workout.caloriesBurned || 0), 0);
      const totalBurned = totalWorkoutBurned;
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
      const isCompleteWeek = trackedDays >= 7;

      const netWeeklyCalories = totalCalories - totalBurned;
      const targetWeeklyCalories = calorieGoal * 7;
      const avgDailyProtein = totalProtein / 7;

      const calorieDeltaRatio = targetWeeklyCalories > 0
        ? Math.abs(netWeeklyCalories - targetWeeklyCalories) / targetWeeklyCalories
        : 1;
      const proteinRatio = proteinGoal > 0 ? avgDailyProtein / proteinGoal : 0;
      const workoutGoalRatio = weeklyWorkoutGoal > 0 ? workouts.length / weeklyWorkoutGoal : 1;
      const minutesGoalRatio = weeklyMinutesGoal > 0 ? totalMinutes / weeklyMinutesGoal : 1;

      const nutritionScore = clampScore((1 - calorieDeltaRatio) * 60 + Math.min(1, proteinRatio) * 40);
      const trainingScore = clampScore(Math.min(1, workoutGoalRatio) * 55 + Math.min(1, minutesGoalRatio) * 45);
      const consistencyScore = clampScore(((mealDays / 7) * 50) + ((workoutDays / 7) * 50));

      const highlights = [
        `Calories net this week: ${Math.round(netWeeklyCalories)} kcal vs target ${Math.round(targetWeeklyCalories)} kcal.`,
        `Avg daily protein: ${Math.round(avgDailyProtein)}g (goal ${proteinGoal}g).`,
        `Training volume: ${workouts.length} sessions, ${Math.round(totalMinutes)} active minutes, and ${activityDays.reduce((acc, day) => acc + Number(day.steps || 0), 0)} tracked steps.`,
      ];

      const summary = [
        `Weekly review: nutrition score ${nutritionScore}/100, training score ${trainingScore}/100, consistency ${consistencyScore}/100.`,
        nutritionScore >= 75
          ? 'Great nutritional control this week.'
          : 'Nutrition needs a tighter plan next week.',
        trainingScore >= 75
          ? 'Training rhythm is solid.'
          : 'Add 1-2 focused sessions or more active minutes next week.',
      ].join(' ');

      return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: weekEndDate.toISOString().split('T')[0],
        trackedDays,
        isCompleteWeek,
        summary,
        highlights,
        nutritionScore,
        trainingScore,
        consistencyScore,
      };
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

    upsertDailyActivity: async (_: any, { input }: { input: { date: string; steps: number } }, context: Context) => {
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

      const record = await DailyActivity.findOneAndUpdate(
        { userId: context.user.id, date },
        { $set: { steps: Math.round(steps) } },
        { upsert: true, new: true }
      );

      return {
        date,
        steps: Number(record?.steps || 0),
        estimatedCalories: 0,
      };
    },

    deleteWorkout: async (_: any, { id }: { id: string }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const result = await Workout.deleteOne({ _id: id, userId: context.user.id });
      return result.deletedCount > 0;
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
