import { AuthenticationError, UserInputError } from 'apollo-server-express';
import { FoodItem } from '../../models/FoodItem';
import { Workout } from '../../models/Workout';
import { DailyActivity } from '../../models/DailyActivity';
import { Context } from '../context';
import { OpenAIService } from '../../services/openaiService';
import { withFilter } from 'graphql-subscriptions';
import { buildDynamicTargets } from '../../utils/activityBudget';

const openAIService = new OpenAIService();

export const foodResolvers = {
  Query: {
    myFoodItems: async (_: any, { limit = 20, offset = 0 }: { limit?: number; offset?: number }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const foodItems = await FoodItem.find({ userId: context.user.id })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset);

      return foodItems;
    },

    foodItem: async (_: any, { id }: { id: string }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const foodItem = await FoodItem.findOne({ _id: id, userId: context.user.id });
      
      if (!foodItem) {
        throw new UserInputError('Food item not found');
      }

      return foodItem;
    },

    dailyStats: async (_: any, { date }: { date: string }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      const meals = await FoodItem.find({
        userId: context.user.id,
        createdAt: {
          $gte: startDate,
          $lt: endDate
        }
      }).sort({ createdAt: 1 });

      const workouts = await Workout.find({
        userId: context.user.id,
        performedAt: {
          $gte: startDate,
          $lt: endDate
        }
      });

      const dayActivity = await DailyActivity.findOne({
        userId: context.user.id,
        date,
      });

      // Calculate total values
      const totals = meals.reduce((acc, meal) => ({
        calories: acc.calories + meal.nutrition.calories,
        protein: acc.protein + meal.nutrition.protein,
        carbs: acc.carbs + meal.nutrition.carbs,
        fat: acc.fat + meal.nutrition.fat
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

      const workoutCalories = workouts.reduce((acc, workout) => acc + (workout.caloriesBurned || 0), 0);
      const steps = Math.max(0, Number(dayActivity?.steps || 0));
      const stepsCalories = 0;

      // Calculate progress towards dynamic goals
      const dynamicTargets = buildDynamicTargets({
        baseCalories: context.user.preferences.dailyCalorieGoal || 2000,
        activityLevel: context.user.preferences.activityLevel,
        primaryGoal: context.user.preferences.primaryGoal,
        workoutCalories,
        stepCalories: stepsCalories,
        manualProtein: context.user.preferences.proteinGoal,
        manualCarbs: context.user.preferences.carbsGoal,
        manualFat: context.user.preferences.fatGoal,
      });

      const goalProgress = {
        calories: dynamicTargets.calorieBudget > 0 ? (totals.calories / dynamicTargets.calorieBudget) * 100 : 0,
        protein: dynamicTargets.proteinGoal > 0 ? (totals.protein / dynamicTargets.proteinGoal) * 100 : 0,
        carbs: dynamicTargets.carbsGoal > 0 ? (totals.carbs / dynamicTargets.carbsGoal) * 100 : 0,
        fat: dynamicTargets.fatGoal > 0 ? (totals.fat / dynamicTargets.fatGoal) * 100 : 0
      };

      return {
        date,
        totalCalories: totals.calories,
        totalProtein: totals.protein,
        totalCarbs: totals.carbs,
        totalFat: totals.fat,
        dynamicGoals: {
          calories: dynamicTargets.calorieBudget,
          protein: dynamicTargets.proteinGoal,
          carbs: dynamicTargets.carbsGoal,
          fat: dynamicTargets.fatGoal,
        },
        steps,
        stepsCalories,
        workoutCalories,
        calorieBudget: dynamicTargets.calorieBudget,
        meals,
        goalProgress
      };
    },
  },

  Mutation: {
    analyzeImage: async (_: any, { input }: { input: any }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const { image, mealType, additionalContext } = input;

      try {
        // OpenAI Vision API integration
        const analysis = await openAIService.analyzeFood(image, mealType, additionalContext);
        
        return analysis;
      } catch (error) {
        console.error('Image analysis error:', error);
        throw new Error('Failed to analyze image');
      }
    },

    addFoodItem: async (_: any, { input }: { input: any }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const foodItem = new FoodItem({
        ...input,
        userId: context.user.id
      });

      await foodItem.save();

      // Send update through subscription
      context.pubsub.publish('NEW_FOOD_ITEM', {
        newFoodItem: foodItem,
        userId: context.user.id
      });

      return foodItem;
    },

    deleteFoodItem: async (_: any, { id }: { id: string }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const result = await FoodItem.deleteOne({ _id: id, userId: context.user.id });
      
      return result.deletedCount > 0;
    },
  },

  Subscription: {
    newFoodItem: {
      subscribe: withFilter(
        (_: any, __: any, context: any) => context.pubsub.asyncIterator(['NEW_FOOD_ITEM']),
        (payload: any, variables: any) => {
          return payload.userId === variables.userId;
        }
      ),
    },
  },
};
