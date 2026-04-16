import { AuthenticationError } from 'apollo-server-express';
import { ChatMessage } from '../../models/ChatMessage';
import { FoodItem } from '../../models/FoodItem';
import { OpenAIService } from '../../services/openaiService';
import { Context } from '../context';
import { withFilter } from 'graphql-subscriptions';

const openAIService = new OpenAIService();
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

const sanitizeBase64 = (value: string): string =>
  value.includes(',') ? value.split(',')[1] : value;

export const chatResolvers = {
  Query: {
    myChatHistory: async (_: any, { limit = 50, offset = 0 }: { limit?: number; offset?: number }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const messages = await ChatMessage.find({ userId: context.user.id })
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(offset);

      return messages.reverse(); // Return in chronological order
    },
  },
  
  Mutation: {
    sendMessage: async (_: any, { input }: any, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      try {
        // Save user message
        const userMessage = new ChatMessage({
          userId: context.user.id,
          content: input.content,
          role: 'USER',
          context: input.context,
          timestamp: new Date(),
        });

        await userMessage.save();

        // Publish user message
        context.pubsub.publish('NEW_CHAT_MESSAGE', {
          newChatMessage: userMessage,
          userId: context.user.id,
        });

        // Get recent chat history for context
        const recentMessages = await ChatMessage.find({ userId: context.user.id })
          .sort({ timestamp: -1 })
          .limit(10);

        const conversationHistory = recentMessages
          .reverse()
          .map(msg => ({
            role: msg.role === 'USER' ? 'user' as const : 'assistant' as const,
            content: msg.content
          }));

        // Get user context (preferences and today's stats)
        const userContext = {
          dailyCalorieGoal: context.user.preferences?.dailyCalorieGoal,
          activityLevel: context.user.preferences?.activityLevel,
          dietaryRestrictions: context.user.preferences?.dietaryRestrictions,
        };

        // Get today's stats if requested
        if (input.context?.statsReference) {
          const today = new Date().toISOString().split('T')[0];
          const todaysFoodItems = await FoodItem.find({
            userId: context.user.id,
            createdAt: {
              $gte: new Date(today),
              $lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000)
            }
          });

          const todayStats = todaysFoodItems.reduce((acc, item) => ({
            calories: acc.calories + item.nutrition.calories,
            protein: acc.protein + item.nutrition.protein,
            carbs: acc.carbs + item.nutrition.carbs,
            fat: acc.fat + item.nutrition.fat,
          }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

          (userContext as any).todayStats = todayStats;
        }

        // Generate AI response
        const aiResponse = await openAIService.chat(conversationHistory, userContext);

        // Save AI message
        const assistantMessage = new ChatMessage({
          userId: context.user.id,
          content: aiResponse,
          role: 'ASSISTANT',
          timestamp: new Date(),
        });

        await assistantMessage.save();

        // Publish AI message
        context.pubsub.publish('NEW_CHAT_MESSAGE', {
          newChatMessage: assistantMessage,
          userId: context.user.id,
        });

        return assistantMessage;

      } catch (error: any) {
        console.error('Chat error:', error);
        throw new Error(error.message || 'Failed to send message');
      }
    },

    logMealWithAI: async (_: any, { input }: any, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const content = (input.content || '').trim();
      const imageBase64 = input.imageBase64 ? sanitizeBase64(input.imageBase64) : '';
      const imageMimeType = input.imageMimeType || 'image/jpeg';
      const mealType = input.mealType;

      if (!content && !imageBase64) {
        throw new Error('Provide a meal description or an image');
      }

      if (!MEAL_TYPES.includes(mealType)) {
        throw new Error('Invalid meal type');
      }

      try {
        const userMessageContent = content || `Analyze this ${mealType} image and save it`;

        const userMessage = new ChatMessage({
          userId: context.user.id,
          content: userMessageContent,
          role: 'USER',
          timestamp: new Date(),
        });
        await userMessage.save();

        context.pubsub.publish('NEW_CHAT_MESSAGE', {
          newChatMessage: userMessage,
          userId: context.user.id,
        });

        const analysis = imageBase64
          ? await openAIService.analyzeFood(imageBase64, mealType, input.additionalContext, imageMimeType)
          : await openAIService.analyzeFoodFromDescription(content, mealType, input.additionalContext);

        const foodItem = new FoodItem({
          userId: context.user.id,
          imageUrl: imageBase64 ? 'ai://image-upload' : 'ai://text-entry',
          name: analysis.foodName,
          description: analysis.description,
          nutrition: analysis.nutrition,
          mealType,
        });
        await foodItem.save();

        context.pubsub.publish('NEW_FOOD_ITEM', {
          newFoodItem: foodItem,
          userId: context.user.id,
        });

        const assistantContent = [
          `Great job logging your meal: ${analysis.foodName}!`,
          `Estimated macros: ${analysis.nutrition.calories.toFixed(0)} kcal, ${analysis.nutrition.protein.toFixed(1)}g protein, ${analysis.nutrition.carbs.toFixed(1)}g carbs, ${analysis.nutrition.fat.toFixed(1)}g fat.`,
          analysis.suggestions?.[0] ? `Coach tip: ${analysis.suggestions[0]}` : 'Coach tip: Keep your next meal balanced with protein and veggies to stay on track.',
        ].filter(Boolean).join(' ');

        const assistantMessage = new ChatMessage({
          userId: context.user.id,
          content: assistantContent,
          role: 'ASSISTANT',
          context: {
            relatedFoodItems: [foodItem.id],
            statsReference: new Date().toISOString().split('T')[0],
          },
          timestamp: new Date(),
        });
        await assistantMessage.save();

        context.pubsub.publish('NEW_CHAT_MESSAGE', {
          newChatMessage: assistantMessage,
          userId: context.user.id,
        });

        return {
          message: assistantMessage,
          foodItem,
        };
      } catch (error: any) {
        console.error('AI meal logging error:', error);
        throw new Error(error.message || 'Failed to analyze and save meal');
      }
    },
  },
  
  Subscription: {
    newChatMessage: {
      subscribe: withFilter(
        (_: any, __: any, context: any) => context.pubsub.asyncIterator(['NEW_CHAT_MESSAGE']),
        (payload: any, variables: any) => payload.userId === variables.userId
      ),
    },
  },
};

