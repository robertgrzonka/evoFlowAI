import { AuthenticationError, UserInputError } from 'apollo-server-express';
import { FoodItem } from '../../models/FoodItem';
import { Context } from '../context';
import { OpenAIService } from '../../services/openaiService';
import {
  fingerprintWeeklyMealsCoach,
  getWeeklyCoachInsightFromCache,
  saveWeeklyCoachInsightToCache,
} from '../../services/weeklyCoachInsightCache';
import { withFilter } from 'graphql-subscriptions';
import { normalizeAppLocale } from '../../utils/appLocale';
import { getDailyMetrics } from '../../utils/dailyMetrics';
import { buildWeekDateKeys, toWeekRange } from '../../utils/weekRange';

const openAIService = new OpenAIService();

type WeeklyDayLoggedMeal = { name: string; mealType: string; calories: number; sortKey: number };

type WeeklyDayRow = {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealCount: number;
  meals: { name: string; mealType: string; calories: number }[];
};

type WeeklyNutritionPayload = {
  weekStart: string;
  weekEnd: string;
  days: WeeklyDayRow[];
  daysWithMeals: number;
  totalMealsLogged: number;
  goals: { calories: number; protein: number; carbs: number; fat: number };
  totals: { calories: number; protein: number; carbs: number; fat: number };
  averages: { calories: number; protein: number; carbs: number; fat: number };
};

const loadWeeklyMealsNutrition = async (context: Context, endDateInput?: string | null): Promise<WeeklyNutritionPayload> => {
  const { startDate, nextDay, endKey, startKey } = toWeekRange(endDateInput || undefined);
  const dateKeys = buildWeekDateKeys(endKey);

  const meals = await FoodItem.find({
    userId: context.user.id,
    createdAt: { $gte: startDate, $lt: nextDay },
  }).lean();

  const byKey = new Map<
    string,
    { calories: number; protein: number; carbs: number; fat: number; mealCount: number; mealAcc: WeeklyDayLoggedMeal[] }
  >();
  for (const key of dateKeys) {
    byKey.set(key, { calories: 0, protein: 0, carbs: 0, fat: 0, mealCount: 0, mealAcc: [] });
  }

  for (const meal of meals) {
    const key = new Date(meal.createdAt as Date).toISOString().split('T')[0];
    const bucket = byKey.get(key);
    if (!bucket) continue;
    bucket.calories += Number(meal.nutrition?.calories || 0);
    bucket.protein += Number(meal.nutrition?.protein || 0);
    bucket.carbs += Number(meal.nutrition?.carbs || 0);
    bucket.fat += Number(meal.nutrition?.fat || 0);
    bucket.mealCount += 1;
    bucket.mealAcc.push({
      name: String(meal.name || '').trim() || 'Meal',
      mealType: String(meal.mealType || 'snack'),
      calories: Number(meal.nutrition?.calories || 0),
      sortKey: new Date(meal.createdAt as Date).getTime(),
    });
  }

  const days: WeeklyDayRow[] = dateKeys.map((date) => {
    const b = byKey.get(date)!;
    const mealsSorted = [...b.mealAcc]
      .sort((a, z) => a.sortKey - z.sortKey)
      .map(({ name, mealType, calories }) => ({ name, mealType, calories }));
    return {
      date,
      calories: b.calories,
      protein: b.protein,
      carbs: b.carbs,
      fat: b.fat,
      mealCount: b.mealCount,
      meals: mealsSorted,
    };
  });

  const prefs = context.user.preferences;
  const calorieGoal = Number(prefs?.dailyCalorieGoal || 2000);
  const proteinGoal = Number(prefs?.proteinGoal || 150);
  const carbsGoal = Number(prefs?.carbsGoal || 200);
  const fatGoal = Number(prefs?.fatGoal || 65);

  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalMealsLogged = 0;
  let daysWithMeals = 0;
  for (const d of days) {
    totalCalories += d.calories;
    totalProtein += d.protein;
    totalCarbs += d.carbs;
    totalFat += d.fat;
    totalMealsLogged += d.mealCount;
    if (d.mealCount > 0) daysWithMeals += 1;
  }

  const periodDays = 7;
  const averages = {
    calories: totalCalories / periodDays,
    protein: totalProtein / periodDays,
    carbs: totalCarbs / periodDays,
    fat: totalFat / periodDays,
  };

  return {
    weekStart: dateKeys[0] || startKey,
    weekEnd: dateKeys[6] || endKey,
    days,
    daysWithMeals,
    totalMealsLogged,
    goals: { calories: calorieGoal, protein: proteinGoal, carbs: carbsGoal, fat: fatGoal },
    totals: { calories: totalCalories, protein: totalProtein, carbs: totalCarbs, fat: totalFat },
    averages,
  };
};

const buildFallbackWeeklyCoach = (payload: WeeklyNutritionPayload, prefs: any) => {
  const { averages, totals, goals, daysWithMeals, days } = payload;
  const pRatio = goals.protein > 0 ? averages.protein / goals.protein : 0;
  const cRatio = goals.calories > 0 ? averages.calories / goals.calories : 0;
  const highest = [...days].sort((a, b) => b.calories - a.calories)[0];

  const headline =
    daysWithMeals === 0
      ? 'Start logging to unlock weekly insights'
      : daysWithMeals < 4
        ? 'Your week is only partly visible'
        : pRatio >= 0.95 && cRatio <= 1.05
          ? 'Solid macro week — keep the rhythm'
          : pRatio < 0.85
            ? 'Protein is the main lever this week'
            : cRatio > 1.08
              ? 'Calorie pacing ran a little hot'
              : 'Room to tighten consistency';

  const summary =
    daysWithMeals === 0
      ? 'No meals in this 7-day window yet. Log a few days in a row and Evo can read variance, weekends, and protein pacing.'
      : `You averaged ${Math.round(averages.calories)} kcal/day vs a ${Math.round(goals.calories)} kcal target, with ~${Math.round(averages.protein)}g protein/day vs ${Math.round(goals.protein)}g. ${
          highest?.mealCount ? `Peak intake landed on ${highest.date} (${Math.round(highest.calories)} kcal).` : ''
        }`.trim();

  const focusAreas: string[] = [];
  if (daysWithMeals < 4) {
    focusAreas.push(`Only ${daysWithMeals}/7 days have meals — patterns (weekends, protein gaps) stay hidden.`);
  }
  focusAreas.push(
    pRatio < 0.9
      ? `Protein averaged ${Math.round(averages.protein)}g vs ${Math.round(goals.protein)}g goal — prioritize a protein anchor meal daily.`
      : `Protein pacing looks ${pRatio >= 1 ? 'on target' : 'close'} at ~${Math.round(averages.protein)}g/day.`
  );
  focusAreas.push(
    cRatio > 1.05
      ? `Calories averaged ${Math.round(averages.calories)} kcal/day vs ${Math.round(goals.calories)} kcal — watch energy-dense extras.`
      : `Calorie average (~${Math.round(averages.calories)} kcal/day) vs ${Math.round(goals.calories)} kcal target is a useful pacing signal.`
  );
  while (focusAreas.length < 3) {
    focusAreas.push('Track meal timing to see if late-day calories cluster.');
  }

  const improvements: string[] = [];
  improvements.push(
    pRatio < 0.9
      ? `Next week: add one 30–40g protein serving before ${prefs?.primaryGoal === 'weight_loss' ? 'snack-heavy' : 'late'} evening.`
      : 'Next week: keep a repeatable high-protein lunch template 4+ days.'
  );
  improvements.push(
    daysWithMeals < 5
      ? 'Aim to log at least 5/7 days so weekly averages reflect real life, not a lucky streak.'
      : 'Review the lowest day and decide if it was intentional deficit or under-logging.'
  );
  improvements.push(
    totals.carbs / 7 > goals.carbs * 1.1
      ? 'Trim refined carbs on 2 days where carbs overshoot — swap for vegetables + lean protein.'
      : 'Experiment with one new vegetable-heavy dinner to widen micronutrient variety.'
  );
  while (improvements.length < 3) {
    improvements.push('Log breakfast within 2 hours of waking to stabilize appetite later.');
  }

  const closingLine =
    daysWithMeals === 0
      ? 'This window has no meal logs, so weekly averages and macro gaps cannot be inferred. Log at least breakfast and dinner tomorrow so the next 7-day rollup has real numbers to compare against your targets.'
      : `You averaged about ${Math.round(averages.calories)} kcal and ${Math.round(averages.protein)} g protein per day vs goals of ${Math.round(goals.calories)} kcal and ${Math.round(goals.protein)} g protein. Next week, repeat your highest-protein day template on one extra weekday to lift the weekly mean without a full diet overhaul.`;

  return {
    headline,
    summary,
    focusAreas: focusAreas.slice(0, 3),
    improvements: improvements.slice(0, 3),
    closingLine,
  };
};

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
        activityBonusKcal: dayMetrics.activityBonusKcal,
        calorieBudget: dayMetrics.dynamicTargets.calorieBudget,
        meals: dayMetrics.meals,
        goalProgress: dayMetrics.goalProgress,
      };
    },

    weeklyMealsNutrition: async (_: any, { endDate }: { endDate?: string | null }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }
      return loadWeeklyMealsNutrition(context, endDate);
    },

    weeklyMealsCoachInsight: async (_: any, { endDate }: { endDate?: string | null }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const payload = await loadWeeklyMealsNutrition(context, endDate);
      const prefs = context.user.preferences;

      if (payload.daysWithMeals === 0) {
        return buildFallbackWeeklyCoach(payload, prefs);
      }

      const fingerprint = fingerprintWeeklyMealsCoach(payload, prefs, context.user.name);
      const cached = await getWeeklyCoachInsightFromCache(context.user.id, 'meals', payload.weekEnd, fingerprint);
      if (cached) {
        return cached;
      }

      try {
        const insight = await openAIService.generateWeeklyMealsCoachInsight({
          weekStart: payload.weekStart,
          weekEnd: payload.weekEnd,
          userName: context.user.name,
          primaryGoal: prefs?.primaryGoal,
          coachingTone: prefs?.coachingTone,
          proactivityLevel: prefs?.proactivityLevel,
          calorieGoal: payload.goals.calories,
          proteinGoal: payload.goals.protein,
          carbsGoal: payload.goals.carbs,
          fatGoal: payload.goals.fat,
          daysWithMeals: payload.daysWithMeals,
          totalMealsLogged: payload.totalMealsLogged,
          days: payload.days,
          averages: payload.averages,
          totals: payload.totals,
          appLocale: prefs?.appLocale,
        });
        await saveWeeklyCoachInsightToCache(context.user.id, 'meals', payload.weekEnd, fingerprint, insight);
        return insight;
      } catch (error) {
        console.error('weeklyMealsCoachInsight AI error:', error);
        const fallback = buildFallbackWeeklyCoach(payload, prefs);
        await saveWeeklyCoachInsightToCache(context.user.id, 'meals', payload.weekEnd, fingerprint, fallback);
        return fallback;
      }
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
        const analysis = await openAIService.analyzeFood(
          image,
          mealType,
          additionalContext,
          'image/jpeg',
          normalizeAppLocale(context.user.preferences?.appLocale)
        );
        
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
