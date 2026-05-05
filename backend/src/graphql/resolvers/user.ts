import { AuthenticationError, UserInputError } from 'apollo-server-express';
import { User } from '../../models/User';
import { Context } from '../context';
import { OpenAIService } from '../../services/openaiService';
import { calculateMacroGoals, normalizeActivityLevel } from '../../utils/nutritionGoals';
import { normalizeAppLocale } from '../../utils/appLocale';
import { normalizeCoachingToneKey } from '../../utils/coachingTone';
import {
  encryptUserOpenAIKey,
  getAIAccessStatus,
  runWithAIAccess,
} from '../../services/aiAccessService';

const openAIService = new OpenAIService();

export const userResolvers = {
  User: {
    aiAccess: (user: any) =>
      user.aiAccess || {
        tier: 'free',
        preferredModel: null,
        openaiKeyLast4: null,
        openaiKeyUpdatedAt: null,
        monthlyRequestLimit: null,
        monthlyRequestCount: 0,
        usagePeriodStart: null,
      },
  },
  UserAIAccess: {
    tier: (aiAccess: any) => String(aiAccess?.tier || 'free').toUpperCase(),
  },
  AIAccessStatus: {
    tier: (status: any) => String(status?.tier || 'free').toUpperCase(),
  },
  UserPreferences: {
    activityLevel: (preferences: any) => {
      const value = String(preferences?.activityLevel || 'moderate');
      return value.toUpperCase();
    },
    primaryGoal: (preferences: any) => String(preferences?.primaryGoal ?? 'maintenance'),
    coachingTone: (preferences: any) => {
      const value = String(preferences?.coachingTone || 'supportive');
      return value.toUpperCase();
    },
    proactivityLevel: (preferences: any) => {
      const value = String(preferences?.proactivityLevel || 'medium');
      return value.toUpperCase();
    },
    appLocale: (preferences: any) => {
      return normalizeAppLocale(preferences?.appLocale) === 'pl' ? 'PL' : 'EN';
    },
  },

  Query: {
    aiAccessStatus: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }
      return getAIAccessStatus(context.user);
    },
  },

  Mutation: {
    updatePreferences: async (_: any, { input }: { input: any }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const {
        dailyCalorieGoal,
        weightKg,
        heightCm,
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
        appLocale,
      } = input;

      // Validation
      if (dailyCalorieGoal && (dailyCalorieGoal < 800 || dailyCalorieGoal > 5000)) {
        throw new UserInputError('Calorie goal must be between 800 and 5000 kcal');
      }

      if (weightKg !== undefined && weightKg !== null && (weightKg < 30 || weightKg > 300)) {
        throw new UserInputError('Weight must be between 30 and 300 kg');
      }

      if (heightCm !== undefined && heightCm !== null && (heightCm < 120 || heightCm > 260)) {
        throw new UserInputError('Height must be between 120 and 260 cm');
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
      if (weightKg !== undefined) updateData['preferences.weightKg'] = weightKg;
      if (heightCm !== undefined) updateData['preferences.heightCm'] = heightCm;
      if (weeklyWorkoutsGoal !== undefined) updateData['preferences.weeklyWorkoutsGoal'] = weeklyWorkoutsGoal;
      if (weeklyActiveMinutesGoal !== undefined) updateData['preferences.weeklyActiveMinutesGoal'] = weeklyActiveMinutesGoal;
      if (primaryGoal !== undefined) {
        const trimmed = String(primaryGoal ?? '').trim();
        if (trimmed.length > 400) {
          throw new UserInputError('Primary goal must be at most 400 characters');
        }
        const upper = trimmed.toUpperCase().replace(/\s+/g, '_');
        const legacyMap: Record<string, string> = {
          FAT_LOSS: 'fat_loss',
          MUSCLE_GAIN: 'muscle_gain',
          STRENGTH: 'strength',
          MAINTENANCE: 'maintenance',
        };
        updateData['preferences.primaryGoal'] = trimmed ? legacyMap[upper] ?? trimmed : 'maintenance';
      }
      if (coachingTone !== undefined) {
        updateData['preferences.coachingTone'] = normalizeCoachingToneKey(String(coachingTone));
      }
      if (proactivityLevel !== undefined) {
        updateData['preferences.proactivityLevel'] = String(proactivityLevel || 'MEDIUM').toLowerCase();
      }
      if (dietaryRestrictions !== undefined) updateData['preferences.dietaryRestrictions'] = dietaryRestrictions;
      if (activityLevel !== undefined) updateData['preferences.activityLevel'] = nextActivityLevel;
      if (notifications !== undefined) updateData['preferences.notifications'] = notifications;
      if (appLocale !== undefined && appLocale !== null) {
        updateData['preferences.appLocale'] = normalizeAppLocale(String(appLocale));
      }

      const autoGoals = calculateMacroGoals(nextDailyGoal, nextActivityLevel);
      const nextWeightKg = weightKg ?? context.user.preferences.weightKg;
      const proteinFromBodyWeight =
        typeof nextWeightKg === 'number' && Number.isFinite(nextWeightKg) && nextWeightKg > 0
          ? Math.round(nextWeightKg * 2)
          : undefined;
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

      updateData['preferences.proteinGoal'] = proteinGoal ?? proteinFromBodyWeight ?? autoGoals.proteinGoal;
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

      const { value: suggested } = await runWithAIAccess(context.user, openAIService, (service) =>
        service.suggestGoalsFromPrompt(prompt, {
          dailyCalorieGoal: context.user.preferences?.dailyCalorieGoal,
          activityLevel: context.user.preferences?.activityLevel,
          appLocale: context.user.preferences?.appLocale,
          weeklyWorkoutsGoal: context.user.preferences?.weeklyWorkoutsGoal,
          weeklyActiveMinutesGoal: context.user.preferences?.weeklyActiveMinutesGoal,
          primaryGoal: context.user.preferences?.primaryGoal,
        })
      );

      const activityLevel = normalizeActivityLevel(suggested.activityLevel);
      const macroGoals = calculateMacroGoals(suggested.dailyCalorieGoal, activityLevel);

      const prefsUpdate: Record<string, unknown> = {
        'preferences.dailyCalorieGoal': suggested.dailyCalorieGoal,
        'preferences.activityLevel': activityLevel,
        'preferences.proteinGoal': macroGoals.proteinGoal,
        'preferences.carbsGoal': macroGoals.carbsGoal,
        'preferences.fatGoal': macroGoals.fatGoal,
      };
      if (suggested.primaryGoal !== undefined) {
        const t = suggested.primaryGoal.trim();
        const upper = t.toUpperCase().replace(/\s+/g, '_');
        const legacyMap: Record<string, string> = {
          FAT_LOSS: 'fat_loss',
          MUSCLE_GAIN: 'muscle_gain',
          STRENGTH: 'strength',
          MAINTENANCE: 'maintenance',
        };
        prefsUpdate['preferences.primaryGoal'] = legacyMap[upper] ?? t;
      }
      if (suggested.weeklyWorkoutsGoal !== undefined) {
        prefsUpdate['preferences.weeklyWorkoutsGoal'] = suggested.weeklyWorkoutsGoal;
      }
      if (suggested.weeklyActiveMinutesGoal !== undefined) {
        prefsUpdate['preferences.weeklyActiveMinutesGoal'] = suggested.weeklyActiveMinutesGoal;
      }

      const updatedUser = await User.findByIdAndUpdate(context.user.id, { $set: prefsUpdate }, { new: true });

      if (!updatedUser) {
        throw new Error('Failed to update goals');
      }

      const loc = normalizeAppLocale(context.user.preferences?.appLocale);
      const macroSuffix =
        loc === 'pl'
          ? ` Makra: ${macroGoals.proteinGoal} g B / ${macroGoals.carbsGoal} g W / ${macroGoals.fatGoal} g T.`
          : ` Macros: ${macroGoals.proteinGoal}g protein / ${macroGoals.carbsGoal}g carbs / ${macroGoals.fatGoal}g fat.`;

      return {
        user: updatedUser,
        message: `${suggested.message}${macroSuffix}`,
      };
    },

    setUserOpenAIKey: async (_: any, { input }: { input: { apiKey: string } }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const apiKey = input.apiKey?.trim();
      if (!apiKey) {
        throw new UserInputError('OpenAI API key is required');
      }

      const encrypted = encryptUserOpenAIKey(apiKey);
      const last4 = apiKey.slice(-4);
      const updatedUser = await User.findByIdAndUpdate(
        context.user.id,
        {
          $set: {
            'aiAccess.tier': 'byok',
            'aiAccess.preferredModel': context.user.aiAccess?.preferredModel || 'gpt-5',
            'aiAccess.openaiKeyEncrypted': encrypted,
            'aiAccess.openaiKeyLast4': last4,
            'aiAccess.openaiKeyUpdatedAt': new Date(),
          },
        },
        { new: true }
      );

      if (!updatedUser) {
        throw new Error('Failed to save OpenAI key');
      }

      return getAIAccessStatus(updatedUser);
    },

    removeUserOpenAIKey: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const updatedUser = await User.findByIdAndUpdate(
        context.user.id,
        {
          $set: {
            'aiAccess.tier': context.user.aiAccess?.tier === 'byok' ? 'free' : context.user.aiAccess?.tier || 'free',
            'aiAccess.openaiKeyEncrypted': null,
            'aiAccess.openaiKeyLast4': null,
            'aiAccess.openaiKeyUpdatedAt': null,
          },
        },
        { new: true }
      );

      if (!updatedUser) {
        throw new Error('Failed to remove OpenAI key');
      }

      return getAIAccessStatus(updatedUser);
    },
  },
};
