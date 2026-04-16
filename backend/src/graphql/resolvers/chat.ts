import { AuthenticationError } from 'apollo-server-express';
import { ChatMessage } from '../../models/ChatMessage';
import { FoodItem } from '../../models/FoodItem';
import { Workout } from '../../models/Workout';
import { DailyActivity } from '../../models/DailyActivity';
import { OpenAIService } from '../../services/openaiService';
import { Context } from '../context';
import { withFilter } from 'graphql-subscriptions';
import { buildDynamicTargets } from '../../utils/activityBudget';
import { EvoUserContext } from '../../ai/evo';

const openAIService = new OpenAIService();
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const CHAT_CHANNELS = ['GENERAL', 'COACH', 'LOG'] as const;
type ChatChannel = (typeof CHAT_CHANNELS)[number];
type MealType = (typeof MEAL_TYPES)[number];

const sanitizeBase64 = (value: string): string =>
  value.includes(',') ? value.split(',')[1] : value;

const getDayRange = (statsReference?: string) => {
  const base = statsReference ? new Date(statsReference) : new Date();
  if (Number.isNaN(base.getTime())) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { startDate: today, endDate: tomorrow };
  }

  const startDate = new Date(base);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);
  return { startDate, endDate };
};

const getTodayDateKey = (): string => new Date().toISOString().split('T')[0];
const normalizeChannel = (channel?: string): ChatChannel =>
  CHAT_CHANNELS.includes(String(channel || '').toUpperCase() as ChatChannel)
    ? (String(channel || '').toUpperCase() as ChatChannel)
    : 'GENERAL';

const isLikelyPolish = (text: string): boolean => /[ąćęłńóśźż]/i.test(text) || /\b(dodaj|posiłek|śniadanie|obiad|kolacja|przekąska)\b/i.test(text);

const inferMealType = (text: string): MealType => {
  const normalized = text.toLowerCase();
  if (/\b(śniadanie|sniadanie|breakfast)\b/.test(normalized)) return 'breakfast';
  if (/\b(obiad|lunch)\b/.test(normalized)) return 'lunch';
  if (/\b(kolacja|dinner)\b/.test(normalized)) return 'dinner';
  if (/\b(przekąska|przekaska|snack)\b/.test(normalized)) return 'snack';
  return 'lunch';
};

const extractMealLogRequest = (content: string): { description: string; mealType: MealType } | null => {
  const text = content.trim();
  const patterns = [
    /^(dodaj(?:\s+mi)?(?:\s+ten)?\s+posi[łl]ek)\s*[:,-]?\s*(.+)$/i,
    /^(zaloguj(?:\s+mi)?(?:\s+ten)?\s+posi[łl]ek)\s*[:,-]?\s*(.+)$/i,
    /^(add(?:\s+this)?\s+meal)\s*[:,-]?\s*(.+)$/i,
    /^(log(?:\s+this)?\s+meal)\s*[:,-]?\s*(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const description = String(match[2] || '').trim();
    if (!description) return null;
    return {
      description,
      mealType: inferMealType(description),
    };
  }

  // Natural language fallback:
  // "Będę jadł ... policz i dodaj jako posiłek ..."
  const normalized = text.toLowerCase();
  const hasMealActionIntent =
    /(dodaj|zaloguj).*(posi[łl]ek)/i.test(text) || /(add|log).*(meal)/i.test(text);
  if (!hasMealActionIntent) {
    return null;
  }

  const likelyFoodSignal =
    /\b(jem|zjem|b[eę]d[eę]\s+jad[łl]|meal|eat|food|kurczak|chicken|ry[żz]|rice|ziemniak|potato|owsianka|oatmeal|jajk|egg)\b/i.test(
      text
    );
  if (!likelyFoodSignal) {
    return null;
  }

  let description = text;
  description = description.replace(/^dobra,?\s*/i, '');
  description = description.replace(/^ok,?\s*/i, '');
  description = description.replace(/^okej,?\s*/i, '');
  description = description.replace(
    /\b(dodaj|zaloguj)\s+(to|ten|je)?\s*jako\s+posi[łl]ek\b.*$/i,
    ''
  );
  description = description.replace(/\b(add|log)\s+(it|this)?\s+as\s+a?\s*meal\b.*$/i, '');
  description = description.replace(/\b(policz|oblicz|powiedz|tell me|calculate)\b.*$/i, '');
  description = description.trim().replace(/[,.:\-–]+$/, '').trim();

  if (!description) {
    description = text;
  }

  return {
    description,
    mealType: inferMealType(description),
  };
};

export const chatResolvers = {
  ChatMessage: {
    channel: (message: { channel?: string }) => normalizeChannel(message.channel || 'COACH'),
  },
  Query: {
    myChatHistory: async (
      _: unknown,
      { channel = 'GENERAL', limit = 50, offset = 0 }: { channel?: ChatChannel; limit?: number; offset?: number },
      context: Context
    ) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const normalizedChannel = normalizeChannel(channel);
      const query =
        normalizedChannel === 'COACH'
          ? {
              userId: context.user.id,
              $or: [{ channel: 'COACH' }, { channel: { $exists: false } }],
            }
          : { userId: context.user.id, channel: normalizedChannel };

      const messages = await ChatMessage.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(offset);

      return messages.reverse(); // Return in chronological order
    },
  },
  
  Mutation: {
    sendMessage: async (
      _: unknown,
      { input }: { input: { content: string; channel?: ChatChannel; context?: { statsReference?: string } } },
      context: Context
    ) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      try {
        const channel = normalizeChannel(input.channel);

        // Save user message
        const userMessage = new ChatMessage({
          userId: context.user.id,
          content: input.content,
          role: 'USER',
          channel,
          context: input.context,
          timestamp: new Date(),
        });

        await userMessage.save();

        // Publish user message
        context.pubsub.publish('NEW_CHAT_MESSAGE', {
          newChatMessage: userMessage,
          userId: context.user.id,
          channel,
        });

        const mealLogRequest = extractMealLogRequest(input.content);
        if (mealLogRequest) {
          const analysis = await openAIService.analyzeFoodFromDescription(
            mealLogRequest.description,
            mealLogRequest.mealType
          );

          const foodItem = new FoodItem({
            userId: context.user.id,
            imageUrl: 'ai://text-entry',
            name: analysis.foodName,
            description: analysis.description,
            nutrition: analysis.nutrition,
            mealType: mealLogRequest.mealType,
          });
          await foodItem.save();

          context.pubsub.publish('NEW_FOOD_ITEM', {
            newFoodItem: foodItem,
            userId: context.user.id,
          });

          const polish = isLikelyPolish(input.content);
          const assistantContent = polish
            ? `Dodałem posiłek **${analysis.foodName}** do dziennika.\n\nSzacunek: **${analysis.nutrition.calories.toFixed(0)} kcal**, **B ${analysis.nutrition.protein.toFixed(1)} g**, **W ${analysis.nutrition.carbs.toFixed(1)} g**, **T ${analysis.nutrition.fat.toFixed(1)} g**.\n\n${analysis.suggestions?.[0] ? `**Wskazówka:** ${analysis.suggestions[0]}` : ''}`.trim()
            : `I added **${analysis.foodName}** to your meal log.\n\nEstimate: **${analysis.nutrition.calories.toFixed(0)} kcal**, **P ${analysis.nutrition.protein.toFixed(1)} g**, **C ${analysis.nutrition.carbs.toFixed(1)} g**, **F ${analysis.nutrition.fat.toFixed(1)} g**.\n\n${analysis.suggestions?.[0] ? `**Tip:** ${analysis.suggestions[0]}` : ''}`.trim();

          const assistantMessage = new ChatMessage({
            userId: context.user.id,
            content: assistantContent,
            role: 'ASSISTANT',
            channel,
            context: {
              relatedFoodItems: [String(foodItem.id)],
              statsReference: getTodayDateKey(),
            },
            timestamp: new Date(),
          });

          await assistantMessage.save();
          context.pubsub.publish('NEW_CHAT_MESSAGE', {
            newChatMessage: assistantMessage,
            userId: context.user.id,
            channel,
          });

          return assistantMessage;
        }

        // Get recent chat history for context
        const recentMessagesQuery =
          channel === 'COACH'
            ? {
                userId: context.user.id,
                $or: [{ channel: 'COACH' }, { channel: { $exists: false } }],
              }
            : { userId: context.user.id, channel };
        const recentMessages = await ChatMessage.find(recentMessagesQuery)
          .sort({ timestamp: -1 })
          .limit(10);

        const conversationHistory = recentMessages
          .reverse()
          .map(msg => ({
            role: msg.role === 'USER' ? 'user' as const : 'assistant' as const,
            content: msg.content
          }));

        // Get user context (preferences and today's stats)
        const userContext: EvoUserContext = {
          dailyCalorieGoal: context.user.preferences?.dailyCalorieGoal,
          proteinGoal: context.user.preferences?.proteinGoal,
          carbsGoal: context.user.preferences?.carbsGoal,
          fatGoal: context.user.preferences?.fatGoal,
          weeklyWorkoutsGoal: context.user.preferences?.weeklyWorkoutsGoal,
          weeklyActiveMinutesGoal: context.user.preferences?.weeklyActiveMinutesGoal,
          primaryGoal: context.user.preferences?.primaryGoal,
          coachingTone: context.user.preferences?.coachingTone,
          proactivityLevel: context.user.preferences?.proactivityLevel,
          activityLevel: context.user.preferences?.activityLevel,
          dietaryRestrictions: context.user.preferences?.dietaryRestrictions,
        };

        // Always enrich chat with daily stats (selected date or today)
        const statsReference = String(input.context?.statsReference || getTodayDateKey());
        const { startDate, endDate } = getDayRange(statsReference);
          const [todaysFoodItems, todaysWorkouts, dayActivity] = await Promise.all([
            FoodItem.find({
              userId: context.user.id,
              createdAt: {
                $gte: startDate,
                $lt: endDate
              }
            }),
            Workout.find({
              userId: context.user.id,
              performedAt: {
                $gte: startDate,
                $lt: endDate
              }
            }),
            DailyActivity.findOne({
              userId: context.user.id,
              date: statsReference,
            }),
          ]);

          const todayStats = todaysFoodItems.reduce((acc, item) => ({
            calories: acc.calories + item.nutrition.calories,
            protein: acc.protein + item.nutrition.protein,
            carbs: acc.carbs + item.nutrition.carbs,
            fat: acc.fat + item.nutrition.fat,
          }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

          const todayWorkouts = todaysWorkouts.reduce((acc, item) => ({
            sessions: acc.sessions + 1,
            minutes: acc.minutes + (item.durationMinutes || 0),
            caloriesBurned: acc.caloriesBurned + (item.caloriesBurned || 0),
          }), { sessions: 0, minutes: 0, caloriesBurned: 0 });

          const steps = Number(dayActivity?.steps || 0);
          const stepsCalories = 0;
          const dynamicTargets = buildDynamicTargets({
            baseCalories: context.user.preferences?.dailyCalorieGoal || 2000,
            activityLevel: context.user.preferences?.activityLevel,
            primaryGoal: context.user.preferences?.primaryGoal,
            workoutCalories: todayWorkouts.caloriesBurned,
            stepCalories: stepsCalories,
            manualProtein: context.user.preferences?.proteinGoal,
            manualCarbs: context.user.preferences?.carbsGoal,
            manualFat: context.user.preferences?.fatGoal,
          });

          userContext.todayStats = todayStats;
          userContext.todayWorkouts = todayWorkouts;
          userContext.todayActivity = {
            steps,
            stepsCalories,
            calorieBudget: dynamicTargets.calorieBudget,
          };

        // Generate AI response
        const aiResponse = await openAIService.chat(conversationHistory, userContext);

        // Save AI message
        const assistantMessage = new ChatMessage({
          userId: context.user.id,
          content: aiResponse,
          role: 'ASSISTANT',
          channel,
          timestamp: new Date(),
        });

        await assistantMessage.save();

        // Publish AI message
        context.pubsub.publish('NEW_CHAT_MESSAGE', {
          newChatMessage: assistantMessage,
          userId: context.user.id,
          channel,
        });

        return assistantMessage;

      } catch (error: unknown) {
        console.error('Chat error:', error);
        const message = error instanceof Error ? error.message : 'Failed to send message';
        throw new Error(message);
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
          channel: 'LOG',
          timestamp: new Date(),
        });
        await userMessage.save();

        context.pubsub.publish('NEW_CHAT_MESSAGE', {
          newChatMessage: userMessage,
          userId: context.user.id,
          channel: 'LOG',
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
          channel: 'LOG',
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
          channel: 'LOG',
        });

        return {
          message: assistantMessage,
          foodItem,
        };
      } catch (error: unknown) {
        console.error('AI meal logging error:', error);
        const message = error instanceof Error ? error.message : 'Failed to analyze and save meal';
        throw new Error(message);
      }
    },
  },
  
  Subscription: {
    newChatMessage: {
      subscribe: withFilter(
        (_: unknown, __: unknown, context: Context) => context.pubsub.asyncIterator(['NEW_CHAT_MESSAGE']),
        (
          payload: { userId: string; channel?: ChatChannel },
          variables: { userId: string; channel?: ChatChannel }
        ) => {
          if (payload.userId !== variables.userId) {
            return false;
          }
          if (!variables.channel) {
            return true;
          }
          return normalizeChannel(payload.channel) === normalizeChannel(variables.channel);
        }
      ),
    },
  },
};

