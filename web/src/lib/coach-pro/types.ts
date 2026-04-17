export type ProMealStyle =
  | 'HIGH_PROTEIN'
  | 'LOW_CARB'
  | 'BALANCED'
  | 'QUICK_EASY'
  | 'BUDGET_FRIENDLY'
  | 'COMFORT_HEALTHY';

export type ProTrainingType =
  | 'GYM'
  | 'RUNNING'
  | 'WALKING'
  | 'CYCLING'
  | 'CALISTHENICS'
  | 'MOBILITY'
  | 'STRETCHING'
  | 'HIIT';

export type ProAdaptiveAction =
  | 'SLEPT_BADLY'
  | 'MISSED_WORKOUT'
  | 'ONLY_30_MINUTES'
  | 'ATE_MORE_THAN_PLANNED'
  | 'NEED_EASIER_DAY'
  | 'SIMPLER_MEAL_TODAY'
  | 'SHOULDER_KNEE_ISSUE';

export type CoachProSetupInput = {
  nutrition: {
    hardExclusions: string[];
    softDislikes: string[];
    allergies: string[];
    favoriteFoods: string[];
    stapleFoods: string[];
    preferredStyles: ProMealStyle[];
    mealsPerDay: number;
    allowRepeatedBreakfasts: boolean;
    requireLunchDinnerVariety: boolean;
    cookingSkill: string;
    cookingEnjoyment: string;
    cookingTimeMinutes: number;
    wantsMealPrep: boolean;
    weeklyFoodBudget?: number | null;
    useUpIngredients: string[];
  };
  training: {
    trainingTypes: ProTrainingType[];
    realisticDaysPerWeek: number;
    preferredDurationMinutes: number;
    availableEquipment: string[];
    favoriteExercises: string[];
    dislikedExercises: string[];
    injuriesOrLimitations: string[];
    preferredIntensity: string;
    strictOrFlexible: string;
  };
  goals: {
    primaryGoal: string;
    secondaryGoal?: string | null;
    targetDate?: string | null;
    priorityFocus: string[];
    coachingStyle: 'SUPPORTIVE' | 'DIRECT' | 'ANALYTICAL' | 'MOTIVATING';
    aggressiveness: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
  };
  lifestyle: {
    workScheduleIntensity: string;
    sleepQuality: string;
    stressLevel: string;
    averageDailyActivity: string;
    weekendsDiffer: boolean;
    eatsOutOften: boolean;
    practicalOverIdeal: boolean;
    extraContext?: string | null;
  };
};

export type CoachProPlan = {
  generatedAt: string;
  generationSource: 'ai' | 'fallback' | 'unknown';
  fallbackReason?: string | null;
  generationWarnings: string[];
  normalizationApplied: boolean;
  normalizationSummary: string[];
  normalizedFields: string[];
  shoppingListSource: 'ai' | 'fallback' | 'derived-from-fallback-bases' | 'derived-from-plan' | 'unknown';
  shoppingListWarnings: string[];
  sectionSources: string[];
  fallbackSections: string[];
  overview: {
    calorieTargetRange: string;
    trainingFrequency: string;
    planDifficulty: string;
    expectedPace: string;
    flexibilityLevel: string;
  };
  weeklyNutrition: Array<{
    dayLabel: string;
    calorieTarget: number;
    proteinTarget: number;
    carbsTarget: number;
    fatTarget: number;
    meals: Array<{
      mealType: string;
      name: string;
      description: string;
      estimatedCalories: number;
      estimatedProtein: number;
      estimatedCarbs: number;
      estimatedFat: number;
      fiberGrams?: number | null;
      estimatedSatiety?: string | null;
      suggestedUse?: string | null;
      prepTimeMinutes: number;
      tags: string[];
      ingredients: Array<{
        item: string;
        quantity: string;
      }>;
      recipeSteps: string[];
      substitutions: string[];
      mealPrepNote?: string | null;
      rationale?: string | null;
    }>;
  }>;
  weeklyTraining: Array<{
    dayLabel: string;
    sessionGoal: string;
    workoutType: string;
    durationMinutes: number;
    intensity: string;
    structure: Array<{
      name: string;
      sets?: string | null;
      reps?: string | null;
      durationMinutes?: number | null;
      notes?: string | null;
    }>;
    fallbackVersion: string;
    minimumViableVersion: string;
  }>;
  rationale: string[];
  smartWarnings: string[];
  shoppingList: {
    proteins: string[];
    carbs: string[];
    fats: string[];
    vegetables: string[];
    dairy: string[];
    extras: string[];
    optionalItems: string[];
  };
  substitutions: {
    ingredientSubstitutions: string[];
    mealSwaps: string[];
    exerciseSubstitutions: string[];
    lowEnergyAlternatives: string[];
    shortOnTimeAlternatives: string[];
  };
  coachNotes: string[];
  hardestPartThisWeek: string;
  focusForBestResults: string;
  executionTips: string[];
  mealPrepTips: string[];
  recoveryNote: string;
  bestCasePlan: string;
  realisticPlan: string;
};
