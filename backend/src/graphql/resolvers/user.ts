import { AuthenticationError, UserInputError } from 'apollo-server-express';
import { User } from '../../models/User';
import { Context } from '../context';
import { OpenAIService } from '../../services/openaiService';
import { calculateMacroGoals, normalizeActivityLevel } from '../../utils/nutritionGoals';

const openAIService = new OpenAIService();

export const userResolvers = {
  UserPreferences: {
    activityLevel: (preferences: any) => {
      const value = String(preferences?.activityLevel || 'moderate');
      return value.toUpperCase();
    },
    primaryGoal: (preferences: any) => {
      const value = String(preferences?.primaryGoal || 'maintenance');
      return value.toUpperCase();
    },
    coachingTone: (preferences: any) => {
      const value = String(preferences?.coachingTone || 'supportive');
      return value.toUpperCase();
    },
    proactivityLevel: (preferences: any) => {
      const value = String(preferences?.proactivityLevel || 'medium');
      return value.toUpperCase();
    },
  },

  Query: {},

  Mutation: {
    updatePreferences: async (_: any, { input }: { input: any }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const {
        dailyCalorieGoal,
        proteinGoal,
        carbsGoal,
        fatGoal,
        weeklyWorkoutsGoal,
        weeklyActiveMinutesGoal,
        primaryGoal,
        coachingTone,
        proactivityLevel,
        dietaryRestrictions,
        activityLevel,
        notifications,
      } = input;

      // Validation
      if (dailyCalorieGoal && (dailyCalorieGoal < 800 || dailyCalorieGoal > 5000)) {
        throw new UserInputError('Calorie goal must be between 800 and 5000 kcal');
      }

      if (
        weeklyWorkoutsGoal !== undefined &&
        (weeklyWorkoutsGoal < 0 || weeklyWorkoutsGoal > 14)
      ) {
        throw new UserInputError('Weekly workouts goal must be between 0 and 14');
      }

      if (
        weeklyActiveMinutesGoal !== undefined &&
        (weeklyActiveMinutesGoal < 0 || weeklyActiveMinutesGoal > 2000)
      ) {
        throw new UserInputError('Weekly active minutes goal must be between 0 and 2000');
      }

      const updateData: any = {};
      const nextDailyGoal = dailyCalorieGoal ?? context.user.preferences.dailyCalorieGoal ?? 2000;
      const nextActivityLevel = normalizeActivityLevel(
        activityLevel !== undefined ? activityLevel : context.user.preferences.activityLevel
      );

      if (dailyCalorieGoal !== undefined) updateData['preferences.dailyCalorieGoal'] = dailyCalorieGoal;
      if (weeklyWorkoutsGoal !== undefined) updateData['preferences.weeklyWorkoutsGoal'] = weeklyWorkoutsGoal;
      if (weeklyActiveMinutesGoal !== undefined) updateData['preferences.weeklyActiveMinutesGoal'] = weeklyActiveMinutesGoal;
      if (primaryGoal !== undefined) {
        updateData['preferences.primaryGoal'] = String(primaryGoal || 'MAINTENANCE').toLowerCase();
      }
      if (coachingTone !== undefined) {
        updateData['preferences.coachingTone'] = String(coachingTone || 'SUPPORTIVE').toLowerCase();
      }
      if (proactivityLevel !== undefined) {
        updateData['preferences.proactivityLevel'] = String(proactivityLevel || 'MEDIUM').toLowerCase();
      }
      if (dietaryRestrictions !== undefined) updateData['preferences.dietaryRestrictions'] = dietaryRestrictions;
      if (activityLevel !== undefined) updateData['preferences.activityLevel'] = nextActivityLevel;
      if (notifications !== undefined) updateData['preferences.notifications'] = notifications;

      const autoGoals = calculateMacroGoals(nextDailyGoal, nextActivityLevel);
      const hasManualMacroOverrides = [proteinGoal, carbsGoal, fatGoal].some((value) => value !== undefined);

      if (hasManualMacroOverrides) {
        if (
          (proteinGoal !== undefined && proteinGoal <= 0) ||
          (carbsGoal !== undefined && carbsGoal <= 0) ||
          (fatGoal !== undefined && fatGoal <= 0)
        ) {
          throw new UserInputError('Macro goals must be greater than zero');
        }
      }

      updateData['preferences.proteinGoal'] = proteinGoal ?? autoGoals.proteinGoal;
      updateData['preferences.carbsGoal'] = carbsGoal ?? autoGoals.carbsGoal;
      updateData['preferences.fatGoal'] = fatGoal ?? autoGoals.fatGoal;

      const updatedUser = await User.findByIdAndUpdate(
        context.user.id,
        { $set: updateData },
        { new: true }
      );

      if (!updatedUser) {
        throw new Error('Failed to update preferences');
      }

      return updatedUser;
    },

    setGoalsWithAI: async (_: any, { input }: { input: { prompt: string } }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const prompt = input.prompt?.trim();
      if (!prompt || prompt.length < 5) {
        throw new UserInputError('Please provide a longer goal request');
      }

      const suggested = await openAIService.suggestGoalsFromPrompt(prompt, {
        dailyCalorieGoal: context.user.preferences?.dailyCalorieGoal,
        activityLevel: context.user.preferences?.activityLevel,
      });

      const activityLevel = normalizeActivityLevel(suggested.activityLevel);
      const macroGoals = calculateMacroGoals(suggested.dailyCalorieGoal, activityLevel);

      const updatedUser = await User.findByIdAndUpdate(
        context.user.id,
        {
          $set: {
            'preferences.dailyCalorieGoal': suggested.dailyCalorieGoal,
            'preferences.activityLevel': activityLevel,
            'preferences.proteinGoal': macroGoals.proteinGoal,
            'preferences.carbsGoal': macroGoals.carbsGoal,
            'preferences.fatGoal': macroGoals.fatGoal,
          },
        },
        { new: true }
      );

      if (!updatedUser) {
        throw new Error('Failed to update goals');
      }

      return {
        user: updatedUser,
        message: `${suggested.message} New macro goals: ${macroGoals.proteinGoal}g protein, ${macroGoals.carbsGoal}g carbs, ${macroGoals.fatGoal}g fat.`,
      };
    },
  },
};
