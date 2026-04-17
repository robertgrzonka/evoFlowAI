import { AuthenticationError, UserInputError } from 'apollo-server-express';
import { withFilter } from 'graphql-subscriptions';
import { FoodItem } from '../../models/FoodItem';
import { Workout } from '../../models/Workout';
import { DailyActivity } from '../../models/DailyActivity';
import { StepSyncConnection } from '../../models/StepSyncConnection';
import { Context } from '../context';
import { OpenAIService } from '../../services/openaiService';
import { GarminStepService } from '../../services/garminStepService';
import { parseWorkoutFile } from '../../services/workoutImportService';
import { getDailyMetrics, getDayRangeByDateKey, normalizeDateKey } from '../../utils/dailyMetrics';

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

const buildLivelyDashboardFallback = (input: {
  currentHour: number;
  remainingProtein: number;
  remainingCalories: number;
  meals: any[];
  workouts: any[];
}) => {
  const { currentHour, remainingProtein, remainingCalories, meals, workouts } = input;
  const latestMeal = meals[meals.length - 1];
  const latestWorkout = workouts[workouts.length - 1];
  const mealRef = latestMeal
    ? `Latest meal: ${String(latestMeal.name || 'meal')} (${Math.round(Number(latestMeal.nutrition?.protein || 0))}g protein).`
    : 'No meal logged yet today.';
  const workoutRef = latestWorkout
    ? `Latest workout: ${String(latestWorkout.title || 'session')} (${Math.round(Number(latestWorkout.durationMinutes || 0))} min).`
    : 'No workout logged yet today.';

  const pacingLine =
    remainingProtein <= 20
      ? `Protein pacing is solid for ${String(currentHour).padStart(2, '0')}:00. Keep this rhythm.`
      : `Protein is still behind for ${String(currentHour).padStart(2, '0')}:00 by about ${Math.ceil(remainingProtein)}g.`;

  const summary = `${mealRef} ${workoutRef} ${pacingLine}`.trim();
  const nutritionTip = remainingProtein > 20
    ? `Add a protein-first meal now (30-40g protein) so the gap does not spill into late evening.`
    : 'Protein target is on pace; keep the next meal balanced and avoid empty calories.';
  const trainingTip = workouts.length === 0
    ? 'No session yet today; a short focused workout can still improve your day balance.'
    : 'You already moved today; keep the next effort moderate and technique-focused.';
  const recoveryTip = remainingCalories < 0
    ? 'You are over budget, so keep the rest of the day light and prioritize hydration.'
    : 'Plan the final meal timing around sleep and hydration for cleaner recovery.';

  return { summary, tips: [nutritionTip, trainingTip, recoveryTip] };
};

const normalizeText = (value: string) => String(value || '').toLowerCase();

const hasConcreteDataReference = (text: string, dayMetrics: any) => {
  const normalized = normalizeText(text);
  if (!normalized) return false;

  if (/\d+\s?(kcal|g|min|steps)/i.test(normalized)) {
    return true;
  }

  const mealNames = (dayMetrics?.meals || [])
    .map((meal: any) => normalizeText(meal?.name))
    .filter(Boolean);
  const workoutNames = (dayMetrics?.workouts || [])
    .map((workout: any) => normalizeText(workout?.title))
    .filter(Boolean);

  return [...mealNames, ...workoutNames].some((name) => name.length > 2 && normalized.includes(name));
};

const buildConcreteDashboardInsight = (input: {
  dayMetrics: any;
  currentHour: number;
  estimatedMealsLeft: number;
  remainingDayPercent: number;
}) => {
  const { dayMetrics, currentHour, estimatedMealsLeft, remainingDayPercent } = input;
  const proteinGoal = Number(dayMetrics.dynamicTargets?.proteinGoal || 0);
  const consumedProtein = Number(dayMetrics.totals?.protein || 0);
  const remainingProtein = Math.max(0, Number(dayMetrics.remainingProtein || 0));
  const consumedCalories = Number(dayMetrics.totals?.calories || 0);
  const remainingCalories = Number(dayMetrics.remainingCalories || 0);
  const meals = Array.isArray(dayMetrics.meals) ? dayMetrics.meals : [];
  const workouts = Array.isArray(dayMetrics.workouts) ? dayMetrics.workouts : [];
  const latestMeal = meals[meals.length - 1];
  const latestWorkout = workouts[workouts.length - 1];

  const expectedProteinByNow = proteinGoal > 0 ? proteinGoal * (currentHour / 24) : 0;
  const proteinPacingDelta = consumedProtein - expectedProteinByNow;
  const proteinPacingLine =
    proteinGoal <= 0
      ? `Protein goal is not configured yet, so Evo uses meal quality instead of target pace.`
      : proteinPacingDelta >= 10
        ? `Protein pace is strong for ${String(currentHour).padStart(2, '0')}:00 (+${Math.round(proteinPacingDelta)}g vs expected pace).`
        : proteinPacingDelta <= -10
          ? `Protein pace is behind for ${String(currentHour).padStart(2, '0')}:00 (${Math.round(Math.abs(proteinPacingDelta))}g under expected pace).`
          : `Protein pace is close to target for ${String(currentHour).padStart(2, '0')}:00.`;

  const mealLine = latestMeal
    ? `Latest meal was ${String(latestMeal.name || 'a meal')} (${Math.round(Number(latestMeal.nutrition?.protein || 0))}g protein, ${Math.round(Number(latestMeal.nutrition?.calories || 0))} kcal).`
    : 'No meals logged yet today.';
  const workoutLine = latestWorkout
    ? `Latest workout was ${String(latestWorkout.title || 'a session')} (${Math.round(Number(latestWorkout.durationMinutes || 0))} min, ${Math.round(Number(latestWorkout.caloriesBurned || 0))} kcal).`
    : 'No workouts logged yet today.';

  const opportunitiesLeft = Math.max(1, estimatedMealsLeft || 1);
  const proteinPerMeal = Math.ceil(remainingProtein / opportunitiesLeft);
  const nutritionTip =
    remainingProtein > 0
      ? `You still need ${Math.round(remainingProtein)}g protein, so target about ${proteinPerMeal}g in each of your next ${opportunitiesLeft} meal opportunity/opportunities.`
      : `Protein target is already covered; use the remaining day for balanced carbs, fats, and hydration.`;
  const trainingTip =
    workouts.length > 0
      ? `You already trained today, so next move is recovery-focused movement and sleep quality rather than extra volume.`
      : remainingDayPercent > 35
        ? `You still have time today for one focused workout block to improve your day balance.`
        : `Training window is short now, so prioritize consistency and schedule your next workout slot.`;
  const recoveryTip =
    remainingCalories < 0
      ? `You are above calorie budget by ${Math.round(Math.abs(remainingCalories))} kcal, so keep the rest of day lighter and hydrate well.`
      : `You have about ${Math.round(remainingCalories)} kcal left for the remaining ${remainingDayPercent}% of day; close with controlled portions and hydration.`;

  return {
    summary: `${mealLine} ${workoutLine} ${proteinPacingLine}`.trim(),
    tips: [nutritionTip, trainingTip, recoveryTip],
    consumedCalories,
    consumedProtein,
    remainingCalories,
    remainingProtein,
  };
};

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const ENV_GARMIN_API_TOKEN = process.env.GARMIN_API_TOKEN || '';
const GARMIN_PROVIDER = 'GARMIN' as const;

const formatStepSyncStatus = (connection: any) => ({
  provider: GARMIN_PROVIDER,
  connected: Boolean(connection?.status === 'CONNECTED'),
  configured: GarminStepService.isConfigured(),
  usingEnvToken: Boolean(!connection?.apiToken && ENV_GARMIN_API_TOKEN),
  lastSyncedAt: connection?.lastSyncedAt || null,
  lastError: connection?.lastError || null,
});

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
        const { startDate, endDate } = getDayRangeByDateKey(date);
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

      const dayMetrics = await getDailyMetrics({
        userId: context.user.id,
        dateKey: date,
        preferences: context.user.preferences,
      });

      return {
        date: dayMetrics.dateKey,
        consumedCalories: dayMetrics.totals.calories,
        consumedProtein: dayMetrics.totals.protein,
        calorieGoal: dayMetrics.dynamicTargets.calorieBudget,
        proteinGoal: dayMetrics.dynamicTargets.proteinGoal,
        caloriesBurned: dayMetrics.workoutTotals.caloriesBurned,
        steps: dayMetrics.steps,
        stepsCalories: dayMetrics.stepsCalories,
        calorieBudget: dayMetrics.dynamicTargets.calorieBudget,
        netCalories: dayMetrics.netCalories,
        remainingCalories: dayMetrics.remainingCalories,
        remainingProtein: dayMetrics.remainingProtein,
        message: buildCoachMessage({
          remainingProtein: dayMetrics.remainingProtein,
          remainingCalories: dayMetrics.remainingCalories,
          netCalories: dayMetrics.netCalories,
        }),
      };
    },

    dashboardInsight: async (_: any, { date }: { date: string }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const dayMetrics = await getDailyMetrics({
        userId: context.user.id,
        dateKey: date,
        preferences: context.user.preferences,
      });
      const primaryGoal = context.user.preferences?.primaryGoal || 'maintenance';
      const now = new Date();
      const currentHour = now.getHours();
      const remainingHours = Math.max(0, 24 - currentHour);
      const remainingDayPercent = Math.max(0, Math.min(100, Math.round((remainingHours / 24) * 100)));
      const estimatedMealsLeft =
        currentHour < 11 ? 3 : currentHour < 16 ? 2 : currentHour < 21 ? 1 : 0;
      const concreteInsight = buildConcreteDashboardInsight({
        dayMetrics,
        currentHour,
        estimatedMealsLeft,
        remainingDayPercent,
      });
      const mealDetails = dayMetrics.meals
        .slice(0, 5)
        .map((meal: any) => {
          const mealTime = meal.createdAt ? new Date(meal.createdAt) : null;
          const timeLabel = mealTime && Number.isFinite(mealTime.getTime())
            ? mealTime.toISOString().slice(11, 16)
            : 'time n/a';
          return `${String(meal.mealType || 'meal')} "${String(meal.name || 'Unnamed')}" at ${timeLabel} (${Math.round(Number(meal.nutrition?.calories || 0))} kcal, ${Math.round(Number(meal.nutrition?.protein || 0))}g protein)`;
        });
      const workoutDetails = dayMetrics.workouts
        .slice(0, 4)
        .map((workout: any) => {
          const workoutTime = workout.performedAt ? new Date(workout.performedAt) : null;
          const timeLabel = workoutTime && Number.isFinite(workoutTime.getTime())
            ? workoutTime.toISOString().slice(11, 16)
            : 'time n/a';
          return `"${String(workout.title || 'Workout')}" at ${timeLabel} (${Math.round(Number(workout.durationMinutes || 0))} min, ${Math.round(Number(workout.caloriesBurned || 0))} kcal)`;
        });

      try {
        const aiInsight = await openAIService.generateDashboardInsights({
          date: dayMetrics.dateKey,
          calorieGoal: dayMetrics.dynamicTargets.calorieBudget,
          proteinGoal: dayMetrics.dynamicTargets.proteinGoal,
          primaryGoal,
          userName: context.user.name,
          coachingTone: context.user.preferences?.coachingTone,
          proactivityLevel: context.user.preferences?.proactivityLevel,
          consumedCalories: dayMetrics.totals.calories,
          consumedProtein: dayMetrics.totals.protein,
          consumedCarbs: dayMetrics.totals.carbs,
          consumedFat: dayMetrics.totals.fat,
          caloriesBurned: dayMetrics.workoutTotals.caloriesBurned,
          remainingCalories: dayMetrics.remainingCalories,
          remainingProtein: dayMetrics.remainingProtein,
          mealsCount: dayMetrics.meals.length,
          workoutSessions: dayMetrics.workouts.length,
          steps: dayMetrics.steps,
          currentHour,
          remainingDayPercent,
          estimatedMealsLeft,
          mealDetails,
          workoutDetails,
        });

        const summary = hasConcreteDataReference(aiInsight.summary, dayMetrics)
          ? aiInsight.summary
          : concreteInsight.summary;
        const tips = (Array.isArray(aiInsight.tips) ? aiInsight.tips : [])
          .slice(0, 3)
          .map((tip: string, index: number) =>
            hasConcreteDataReference(tip, dayMetrics) ? tip : concreteInsight.tips[index]
          );

        return {
          date: dayMetrics.dateKey,
          summary,
          tips,
          caloriesBurned: dayMetrics.workoutTotals.caloriesBurned,
          steps: dayMetrics.steps,
          stepsCalories: dayMetrics.stepsCalories,
          calorieBudget: dayMetrics.dynamicTargets.calorieBudget,
          netCalories: dayMetrics.netCalories,
          remainingCalories: dayMetrics.remainingCalories,
          remainingProtein: dayMetrics.remainingProtein,
        };
      } catch (error) {
        return {
          date: dayMetrics.dateKey,
          summary: concreteInsight.summary,
          tips: concreteInsight.tips,
          caloriesBurned: dayMetrics.workoutTotals.caloriesBurned,
          steps: dayMetrics.steps,
          stepsCalories: dayMetrics.stepsCalories,
          calorieBudget: dayMetrics.dynamicTargets.calorieBudget,
          netCalories: dayMetrics.netCalories,
          remainingCalories: dayMetrics.remainingCalories,
          remainingProtein: dayMetrics.remainingProtein,
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
      const userCreatedAtRaw = (context.user as any)?.createdAt ? new Date((context.user as any).createdAt) : new Date();
      userCreatedAtRaw.setHours(0, 0, 0, 0);
      const availableStartDate = userCreatedAtRaw > startDate ? userCreatedAtRaw : startDate;
      const availableDays = Math.min(
        7,
        Math.max(1, Math.floor((weekEndDate.getTime() - availableStartDate.getTime()) / (24 * 60 * 60 * 1000)) + 1)
      );
      const isCompleteWeek = availableDays >= 7;
      const periodDays = availableDays;
      const periodRatio = Math.min(1, periodDays / 7);

      if (trackedDays === 0) {
        return {
          startDate: startDate.toISOString().split('T')[0],
          endDate: weekEndDate.toISOString().split('T')[0],
          trackedDays,
          availableDays,
          isCompleteWeek,
          summary: 'No weekly pattern yet. Log meals, workouts, or steps and Evo will build your weekly trend.',
          highlights: [
            `No nutrition logs captured in the current ${availableDays}/7-day window yet.`,
            `No workouts captured in the current ${availableDays}/7-day window yet.`,
            'Add at least one tracked day so Evo can generate a practical weekly trend.',
          ],
          nutritionScore: 0,
          trainingScore: 0,
          consistencyScore: 0,
        };
      }

      const netWeeklyCalories = totalCalories - totalBurned;
      const targetPeriodCalories = calorieGoal * periodDays;
      const avgDailyProtein = totalProtein / periodDays;
      const scaledWorkoutGoal = weeklyWorkoutGoal > 0 ? Math.max(1, weeklyWorkoutGoal * periodRatio) : 0;
      const scaledMinutesGoal = weeklyMinutesGoal > 0 ? Math.max(1, weeklyMinutesGoal * periodRatio) : 0;

      const calorieDeltaRatio = targetPeriodCalories > 0
        ? Math.abs(netWeeklyCalories - targetPeriodCalories) / targetPeriodCalories
        : 1;
      const proteinRatio = proteinGoal > 0 ? avgDailyProtein / proteinGoal : 0;
      const workoutGoalRatio = scaledWorkoutGoal > 0 ? workouts.length / scaledWorkoutGoal : 1;
      const minutesGoalRatio = scaledMinutesGoal > 0 ? totalMinutes / scaledMinutesGoal : 1;

      const nutritionScore = clampScore((1 - calorieDeltaRatio) * 60 + Math.min(1, proteinRatio) * 40);
      const trainingScore = clampScore(Math.min(1, workoutGoalRatio) * 55 + Math.min(1, minutesGoalRatio) * 45);
      const consistencyScore = clampScore(((mealDays / periodDays) * 50) + ((workoutDays / periodDays) * 50));

      const highlights = [
        `Calories net for current ${availableDays}/7-day window: ${Math.round(netWeeklyCalories)} kcal vs target ${Math.round(targetPeriodCalories)} kcal.`,
        `Avg daily protein: ${Math.round(avgDailyProtein)}g (goal ${proteinGoal}g).`,
        `Training volume: ${workouts.length} sessions, ${Math.round(totalMinutes)} active minutes, and ${activityDays.reduce((acc, day) => acc + Number(day.steps || 0), 0)} tracked steps.`,
      ];

      const summary = isCompleteWeek
        ? [
            `Weekly review: nutrition score ${nutritionScore}/100, training score ${trainingScore}/100, consistency ${consistencyScore}/100.`,
            nutritionScore >= 75
              ? 'Great nutritional control this week.'
              : 'Nutrition needs a tighter plan next week.',
            trainingScore >= 75
              ? 'Training rhythm is solid.'
              : 'Add 1-2 focused sessions or more active minutes next week.',
          ].join(' ')
        : [
            `Weekly review (partial): based on ${availableDays}/7 available days (${trackedDays} tracked), nutrition score ${nutritionScore}/100, training score ${trainingScore}/100, consistency ${consistencyScore}/100.`,
            nutritionScore >= 75
              ? 'Nutrition trend is promising so far.'
              : 'Nutrition trend needs tighter control in the next days.',
            trainingScore >= 75
              ? 'Training trend is on pace.'
              : 'Try adding one focused session or more active minutes before week closes.',
          ].join(' ');

      return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: weekEndDate.toISOString().split('T')[0],
        trackedDays,
        availableDays,
        isCompleteWeek,
        summary,
        highlights,
        nutritionScore,
        trainingScore,
        consistencyScore,
      };
    },
    stepSyncStatus: async (_: any, { provider }: { provider: 'GARMIN' }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }
      if (provider !== GARMIN_PROVIDER) {
        throw new UserInputError('Unsupported sync provider');
      }

      const connection = await StepSyncConnection.findOne({
        userId: context.user.id,
        provider: GARMIN_PROVIDER,
      });
      return formatStepSyncStatus(connection);
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
    importWorkoutFile: async (
      _: any,
      {
        input,
      }: {
        input: {
          fileName: string;
          fileContentBase64: string;
          performedAt?: string | null;
          title?: string | null;
          notes?: string | null;
          intensity?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
        };
      },
      context: Context
    ) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const fileName = String(input.fileName || '').trim();
      if (!fileName) {
        throw new UserInputError('File name is required');
      }

      const contentBase64 = String(input.fileContentBase64 || '');
      if (!contentBase64) {
        throw new UserInputError('File content is required');
      }

      const buffer = Buffer.from(contentBase64, 'base64');
      if (!buffer.length) {
        throw new UserInputError('File content could not be decoded');
      }
      if (buffer.length > 10 * 1024 * 1024) {
        throw new UserInputError('Workout file is too large. Max size is 10MB.');
      }

      let parsed;
      try {
        parsed = await parseWorkoutFile({
          fileName,
          fileBuffer: buffer,
          weightKg: Number(context.user.preferences?.weightKg || 70),
        });
      } catch (error: any) {
        throw new UserInputError(error?.message || 'Could not parse workout file.');
      }

      const workout = new Workout({
        userId: context.user.id,
        title: String(input.title || '').trim() || parsed.title,
        notes: [String(parsed.notes || '').trim(), String(input.notes || '').trim()].filter(Boolean).join(' ').trim() || undefined,
        durationMinutes: Math.max(1, Math.round(parsed.durationMinutes)),
        caloriesBurned: Math.max(0, Math.round(parsed.caloriesBurned)),
        intensity: parseIntensity(String(input.intensity || 'MEDIUM')),
        performedAt: input.performedAt ? new Date(input.performedAt) : parsed.performedAt,
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
    connectGarminStepSync: async (
      _: any,
      { input }: { input?: { apiToken?: string | null } },
      context: Context
    ) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      if (!GarminStepService.isConfigured()) {
        throw new UserInputError(
          'Garmin sync is not configured on the server. Missing GARMIN_DAILY_STEPS_ENDPOINT.'
        );
      }

      const incomingToken = String(input?.apiToken || '').trim();
      if (!incomingToken && !ENV_GARMIN_API_TOKEN) {
        throw new UserInputError('Provide Garmin API token or configure GARMIN_API_TOKEN on the server.');
      }

      const connection = await StepSyncConnection.findOneAndUpdate(
        { userId: context.user.id, provider: GARMIN_PROVIDER },
        {
          $set: {
            status: 'CONNECTED',
            apiToken: incomingToken || undefined,
            lastError: null,
          },
        },
        { upsert: true, new: true }
      );

      return formatStepSyncStatus(connection);
    },
    disconnectStepSync: async (_: any, { provider }: { provider: 'GARMIN' }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }
      if (provider !== GARMIN_PROVIDER) {
        throw new UserInputError('Unsupported sync provider');
      }

      const result = await StepSyncConnection.findOneAndUpdate(
        { userId: context.user.id, provider: GARMIN_PROVIDER },
        {
          $set: {
            status: 'DISCONNECTED',
            apiToken: undefined,
            lastError: null,
          },
        },
        { new: true }
      );

      return Boolean(result);
    },
    syncGarminSteps: async (_: any, { date }: { date: string }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }
      const dateKey = normalizeDateKey(date);

      if (!GarminStepService.isConfigured()) {
        throw new UserInputError(
          'Garmin sync is not configured on the server. Missing GARMIN_DAILY_STEPS_ENDPOINT.'
        );
      }

      const connection = await StepSyncConnection.findOne({
        userId: context.user.id,
        provider: GARMIN_PROVIDER,
      });

      const apiToken = String(connection?.apiToken || ENV_GARMIN_API_TOKEN || '').trim();
      if (!apiToken) {
        throw new UserInputError('Garmin token is missing. Connect Garmin first in Settings.');
      }

      try {
        const importedSteps = await GarminStepService.fetchDailySteps({ date: dateKey, apiToken });
        const existing = await DailyActivity.findOne({ userId: context.user.id, date: dateKey });
        const savedSteps = Math.max(importedSteps, Number(existing?.steps || 0));
        const updatedActivity = await DailyActivity.findOneAndUpdate(
          { userId: context.user.id, date: dateKey },
          { $set: { steps: savedSteps } },
          { upsert: true, new: true }
        );

        const syncedAt = new Date();
        await StepSyncConnection.findOneAndUpdate(
          { userId: context.user.id, provider: GARMIN_PROVIDER },
          {
            $set: {
              status: 'CONNECTED',
              lastSyncedAt: syncedAt,
              lastError: null,
            },
          },
          { upsert: true, new: true }
        );

        return {
          date: dateKey,
          importedSteps,
          savedSteps: Number(updatedActivity?.steps || savedSteps),
          source: GARMIN_PROVIDER,
          syncedAt,
        };
      } catch (error: any) {
        await StepSyncConnection.findOneAndUpdate(
          { userId: context.user.id, provider: GARMIN_PROVIDER },
          {
            $set: {
              status: 'ERROR',
              lastError: error?.message || 'Garmin sync failed',
            },
          },
          { upsert: true, new: true }
        );
        throw new UserInputError(error?.message || 'Garmin sync failed');
      }
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
