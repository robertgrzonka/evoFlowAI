import { AuthenticationError, UserInputError } from 'apollo-server-express';
import { withFilter } from 'graphql-subscriptions';
import { FoodItem } from '../../models/FoodItem';
import { Workout } from '../../models/Workout';
import { Context } from '../context';
import { OpenAIService } from '../../services/openaiService';

const toDayRange = (date: string) => {
  const startDate = new Date(date);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);

  return { startDate, endDate };
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

    workoutCoachSummary: async (_: any, { date }: { date: string }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const { startDate, endDate } = toDayRange(date);

      const [meals, workouts] = await Promise.all([
        FoodItem.find({
          userId: context.user.id,
          createdAt: { $gte: startDate, $lt: endDate },
        }),
        Workout.find({
          userId: context.user.id,
          performedAt: { $gte: startDate, $lt: endDate },
        }),
      ]);

      const consumedCalories = meals.reduce((acc, meal) => acc + meal.nutrition.calories, 0);
      const consumedProtein = meals.reduce((acc, meal) => acc + meal.nutrition.protein, 0);
      const caloriesBurned = workouts.reduce((acc, workout) => acc + (workout.caloriesBurned || 0), 0);

      const calorieGoal = context.user.preferences?.dailyCalorieGoal || 2000;
      const proteinGoal = context.user.preferences?.proteinGoal || 150;
      const netCalories = consumedCalories - caloriesBurned;
      const remainingCalories = calorieGoal - netCalories;
      const remainingProtein = Math.max(0, proteinGoal - consumedProtein);

      return {
        date,
        consumedCalories,
        consumedProtein,
        calorieGoal,
        proteinGoal,
        caloriesBurned,
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
      const [meals, workouts] = await Promise.all([
        FoodItem.find({
          userId: context.user.id,
          createdAt: { $gte: startDate, $lt: endDate },
        }),
        Workout.find({
          userId: context.user.id,
          performedAt: { $gte: startDate, $lt: endDate },
        }),
      ]);

      const consumedCalories = meals.reduce((acc, meal) => acc + meal.nutrition.calories, 0);
      const consumedProtein = meals.reduce((acc, meal) => acc + meal.nutrition.protein, 0);
      const caloriesBurned = workouts.reduce((acc, workout) => acc + (workout.caloriesBurned || 0), 0);

      const calorieGoal = context.user.preferences?.dailyCalorieGoal || 2000;
      const proteinGoal = context.user.preferences?.proteinGoal || 150;
      const netCalories = consumedCalories - caloriesBurned;
      const remainingCalories = calorieGoal - netCalories;
      const remainingProtein = Math.max(0, proteinGoal - consumedProtein);

      try {
        const aiInsight = await openAIService.generateDashboardInsights({
          date,
          calorieGoal,
          proteinGoal,
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
          netCalories,
          remainingCalories,
          remainingProtein,
        };
      }
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
