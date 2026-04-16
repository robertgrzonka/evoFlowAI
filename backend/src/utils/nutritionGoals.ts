export type ActivityLevelValue =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active';

type MacroRatio = { protein: number; carbs: number; fat: number };

const macroRatiosByActivity: Record<ActivityLevelValue, MacroRatio> = {
  sedentary: { protein: 0.25, carbs: 0.4, fat: 0.35 },
  light: { protein: 0.27, carbs: 0.43, fat: 0.3 },
  moderate: { protein: 0.3, carbs: 0.4, fat: 0.3 },
  active: { protein: 0.3, carbs: 0.45, fat: 0.25 },
  very_active: { protein: 0.3, carbs: 0.5, fat: 0.2 },
};

export const normalizeActivityLevel = (value: string | undefined | null): ActivityLevelValue => {
  const normalized = String(value || 'moderate').toLowerCase() as ActivityLevelValue;
  return normalized in macroRatiosByActivity ? normalized : 'moderate';
};

export const calculateMacroGoals = (
  dailyCalorieGoal: number,
  activityLevel: string | undefined | null
) => {
  const normalizedLevel = normalizeActivityLevel(activityLevel);
  const ratio = macroRatiosByActivity[normalizedLevel];

  return {
    proteinGoal: Math.round((dailyCalorieGoal * ratio.protein) / 4),
    carbsGoal: Math.round((dailyCalorieGoal * ratio.carbs) / 4),
    fatGoal: Math.round((dailyCalorieGoal * ratio.fat) / 9),
  };
};
