import { AuthenticationError, UserInputError } from 'apollo-server-express';
import { FoodItem } from '../../models/FoodItem';
import { Context } from '../context';
import { OpenAIService } from '../../services/openaiService';
import { withFilter } from 'graphql-subscriptions';
import { calculateMacroGoals } from '../../utils/nutritionGoals';

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

      // Calculate total values
      const totals = meals.reduce((acc, meal) => ({
        calories: acc.calories + meal.nutrition.calories,
        protein: acc.protein + meal.nutrition.protein,
        carbs: acc.carbs + meal.nutrition.carbs,
        fat: acc.fat + meal.nutrition.fat
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

      // Calculate progress towards goals
      const dailyGoal = context.user.preferences.dailyCalorieGoal || 2000;
      const fallbackMacroGoals = calculateMacroGoals(dailyGoal, context.user.preferences.activityLevel);
      const proteinGoal = context.user.preferences.proteinGoal || fallbackMacroGoals.proteinGoal;
      const carbsGoal = context.user.preferences.carbsGoal || fallbackMacroGoals.carbsGoal;
      const fatGoal = context.user.preferences.fatGoal || fallbackMacroGoals.fatGoal;

      const goalProgress = {
        calories: dailyGoal > 0 ? (totals.calories / dailyGoal) * 100 : 0,
        protein: proteinGoal > 0 ? (totals.protein / proteinGoal) * 100 : 0,
        carbs: carbsGoal > 0 ? (totals.carbs / carbsGoal) * 100 : 0,
        fat: fatGoal > 0 ? (totals.fat / fatGoal) * 100 : 0
      };

      return {
        date,
        totalCalories: totals.calories,
        totalProtein: totals.protein,
        totalCarbs: totals.carbs,
        totalFat: totals.fat,
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
