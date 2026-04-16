import { AuthenticationError, UserInputError } from 'apollo-server-express';
import { FoodItem } from '../../models/FoodItem';
import { Context } from '../context';
import { OpenAIService } from '../../services/openaiService';
import { withFilter } from 'graphql-subscriptions';
import { getDailyMetrics } from '../../utils/dailyMetrics';

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

      const dayMetrics = await getDailyMetrics({
        userId: context.user.id,
        dateKey: date,
        preferences: context.user.preferences,
      });

      return {
        date: dayMetrics.dateKey,
        totalCalories: dayMetrics.totals.calories,
        totalProtein: dayMetrics.totals.protein,
        totalCarbs: dayMetrics.totals.carbs,
        totalFat: dayMetrics.totals.fat,
        dynamicGoals: {
          calories: dayMetrics.dynamicTargets.calorieBudget,
          protein: dayMetrics.dynamicTargets.proteinGoal,
          carbs: dayMetrics.dynamicTargets.carbsGoal,
          fat: dayMetrics.dynamicTargets.fatGoal,
        },
        steps: dayMetrics.steps,
        stepsCalories: dayMetrics.stepsCalories,
        workoutCalories: dayMetrics.workoutTotals.caloriesBurned,
        calorieBudget: dayMetrics.dynamicTargets.calorieBudget,
        meals: dayMetrics.meals,
        goalProgress: dayMetrics.goalProgress,
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
