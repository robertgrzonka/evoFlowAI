import type { UiLocale } from '../ui-locale';
import type { ProMealStyle, ProTrainingType } from '@/lib/coach-pro/types';

export const MEAL_SMART_ACTION_KEYS = [
  'REPLACE_MEAL',
  'SHOW_SUBSTITUTIONS',
  'ADD_INGREDIENTS_TO_SHOPPING_LIST',
  'REGENERATE_RECIPE',
  'MAKE_IT_FASTER',
  'MAKE_IT_CHEAPER',
  'MAKE_IT_VEGETARIAN',
  'INCREASE_PROTEIN',
] as const;

export type MealSmartActionKey = (typeof MEAL_SMART_ACTION_KEYS)[number];

const mealSmartLabels: Record<UiLocale, Record<MealSmartActionKey, string>> = {
  en: {
    REPLACE_MEAL: 'Replace meal',
    SHOW_SUBSTITUTIONS: 'Show substitutions',
    ADD_INGREDIENTS_TO_SHOPPING_LIST: 'Add ingredients to shopping list',
    REGENERATE_RECIPE: 'Regenerate recipe',
    MAKE_IT_FASTER: 'Make it faster',
    MAKE_IT_CHEAPER: 'Make it cheaper',
    MAKE_IT_VEGETARIAN: 'Make it vegetarian',
    INCREASE_PROTEIN: 'Increase protein',
  },
  pl: {
    REPLACE_MEAL: 'Zamień posiłek',
    SHOW_SUBSTITUTIONS: 'Pokaż zamienniki',
    ADD_INGREDIENTS_TO_SHOPPING_LIST: 'Dodaj składniki do listy zakupów',
    REGENERATE_RECIPE: 'Wygeneruj przepis ponownie',
    MAKE_IT_FASTER: 'Szybciej w przygotowaniu',
    MAKE_IT_CHEAPER: 'Taniej',
    MAKE_IT_VEGETARIAN: 'Wersja wegetariańska',
    INCREASE_PROTEIN: 'Więcej białka',
  },
};

export function mealSmartActionLabel(locale: UiLocale, key: MealSmartActionKey): string {
  return mealSmartLabels[locale][key];
}

export function mealStyleOptions(locale: UiLocale): { value: ProMealStyle; label: string }[] {
  const m = coachProPageCopy[locale].mealStyles;
  return [
    { value: 'HIGH_PROTEIN', label: m.HIGH_PROTEIN },
    { value: 'LOW_CARB', label: m.LOW_CARB },
    { value: 'BALANCED', label: m.BALANCED },
    { value: 'QUICK_EASY', label: m.QUICK_EASY },
    { value: 'BUDGET_FRIENDLY', label: m.BUDGET_FRIENDLY },
    { value: 'COMFORT_HEALTHY', label: m.COMFORT_HEALTHY },
  ];
}

export function trainingTypeOptions(locale: UiLocale): { value: ProTrainingType; label: string }[] {
  const t = coachProPageCopy[locale].trainingTypes;
  return [
    { value: 'GYM', label: t.GYM },
    { value: 'RUNNING', label: t.RUNNING },
    { value: 'WALKING', label: t.WALKING },
    { value: 'CYCLING', label: t.CYCLING },
    { value: 'CALISTHENICS', label: t.CALISTHENICS },
    { value: 'MOBILITY', label: t.MOBILITY },
    { value: 'STRETCHING', label: t.STRETCHING },
    { value: 'HIIT', label: t.HIIT },
  ];
}

export const coachProPageCopy: Record<
  UiLocale,
  {
    pageTitle: string;
    premiumStrategist: string;
    heroTitle: string;
    heroSubtitle: string;
    metaGoal: string;
    metaCoachingStyle: string;
    metaFlexibility: string;
    metaConfidence: string;
    metaDataSources: string;
    metaDataSourcesValue: string;
    prefilledNone: string;
    prefilledActive: (kcal: number, protein: number, workouts: number) => string;
    step1Eyebrow: string;
    step1Title: string;
    step1Subtitle: string;
    step2Eyebrow: string;
    step2Title: string;
    step2Subtitle: string;
    step3Eyebrow: string;
    step3Title: string;
    step3Subtitle: string;
    step4Eyebrow: string;
    step4Title: string;
    step4Subtitle: string;
    textareaPlaceholder: string;
    hardExclusions: string;
    softDislikes: string;
    allergies: string;
    favoriteFoods: string;
    stapleFoods: string;
    useUpIngredients: string;
    preferredEatingStyle: string;
    mealsPerDay: string;
    cookingTime: string;
    weeklyFoodBudget: string;
    allowRepeatedBreakfasts: string;
    requireLunchDinnerVariety: string;
    enableMealPrep: string;
    trainingTypesTitle: string;
    trainingDaysPerWeek: string;
    preferredDuration: string;
    equipment: string;
    favoriteExercises: string;
    dislikedExercises: string;
    injuries: string;
    preferredIntensity: string;
    planStrictness: string;
    primaryGoal: string;
    secondaryGoal: string;
    targetDate: string;
    targetDatePlaceholder: string;
    priorityFocus: string;
    expectedCoachingStyle: string;
    planAggressiveness: string;
    workScheduleIntensity: string;
    sleepQuality: string;
    stressLevel: string;
    averageDailyActivity: string;
    weekendsDiffer: string;
    eatsOutOften: string;
    practicalOverIdeal: string;
    extraContext: string;
    back: string;
    nextStep: string;
    generating: string;
    generatePlan: string;
    generationIssue: string;
    generationFallback: string;
    progressTitle: string;
    stepOf: (n: number) => string;
    sidebarGenerateTitle: string;
    sidebarGenerateBullets: string[];
    toastReadyTitle: string;
    toastReadyBody: string;
    toastUnsupportedAction: string;
    toastSmartActionTitle: string;
    toastActionFailTitle: string;
    toastActionFailBody: string;
    emptySetupTitle: string;
    emptySetupDescription: string;
    mealStyles: Record<ProMealStyle, string>;
    trainingTypes: Record<ProTrainingType, string>;
    intensityLowModHigh: { value: string; label: string }[];
    strictnessOptions: { value: string; label: string }[];
    lifestyleLowModHigh: { value: string; label: string }[];
    sleepOptions: { value: string; label: string }[];
    stressOptions: { value: string; label: string }[];
    proactivityDisplay: Record<'LOW' | 'MEDIUM' | 'HIGH', string>;
    coachingToneSupportive: string;
    coachingToneDirect: string;
    previewToneTitle: string;
    previewToneDirect: string;
    previewToneSupportive: string;
    confidenceHigh: string;
    confidenceMedium: string;
    confidenceFoundational: string;
    weeklySuccessMarkers: (daysPerWeek: number) => string[];
    nextBestActionPrefix: string;
    nextBestActionFallback: string;
    dashboardEyebrow: string;
    dashboardTitle: string;
    dashboardSubtitle: string;
    overviewCaloriesRange: string;
    overviewTrainingFreq: string;
    overviewDifficulty: string;
    overviewExpectedPace: string;
    overviewFlexibility: string;
    overviewConfidence: string;
    adaptTodayTitle: string;
    whyWeekTitle: string;
    weeklySuccessTitle: string;
    shoppingListTitle: string;
    shopProteins: string;
    shopCarbs: string;
    shopFats: string;
    shopVegetables: string;
    shopDairy: string;
    shopExtras: string;
    shopOptional: string;
    coachGuidanceTitle: string;
    hardestPart: string;
    whereToFocus: string;
    coachNotesTradeoffs: string;
    notesCoach: string;
    notesExecution: string;
    notesMealPrep: string;
    notesSubstitutions: string;
    bestCasePlan: string;
    realisticPlan: string;
    drawerCloseMeal: string;
    drawerClosePanel: string;
    drawerGeneratingMeal: string;
    statCalories: string;
    statProtein: string;
    statCarbsFat: string;
    statPrepTime: string;
    sectionDescription: string;
    whyInPlan: string;
    sectionIngredients: string;
    noIngredients: string;
    sectionRecipe: string;
    noRecipeSteps: string;
    sectionNutritionDetails: string;
    detailFiber: string;
    detailSatiety: string;
    suggestedUseLine: (use: string, kcal: number, p: number) => string;
    generalMeal: string;
    smartActionsTitle: string;
    applyingAction: string;
    drawerTrainingClose: string;
    drawerTrainingSession: string;
    drawerGeneratingTraining: string;
    statDuration: string;
    statIntensity: string;
    statBlocks: string;
    statMode: string;
    statModeAdaptive: string;
    warmUpTitle: string;
    warmUpFallback: string;
    mainWorkTitle: string;
    cooldownTitle: string;
    cooldownFallback: string;
    fallbackShortTitle: string;
    minViableTitle: string;
    whySessionTitle: string;
    whySessionBody: string;
    painSubstitutionFallback: string;
    whySessionPrefix: string;
    booleanEatsOut: string;
    reconfigureSetup: string;
    planOverviewEyebrow: string;
    weeklyNutritionPlanTitle: string;
    weeklyTrainingPlanTitle: string;
    weekNutritionSubtitlePartial: (shown: number, total: number) => string;
    weekNutritionSubtitleFull: string;
    weekTrainingSubtitlePartial: (shown: number, total: number) => string;
    weekTrainingSubtitleFull: string;
    showOnlyThreeNutritionDays: string;
    showRemainingNutritionDays: (n: number) => string;
    showOnlyThreeTrainingDays: string;
    showRemainingTrainingDays: (n: number) => string;
    mealOpenRecipeAria: (mealName: string) => string;
    mealCardDetails: string;
    mealPrepSuffix: (min: number) => string;
    trainingViewSessionDetails: string;
    trainingFallbackLabel: string;
    trainingMinimumViableLabel: string;
    biggestRiskTitle: string;
    bestMitigationPrefix: string;
    bestMitigationDefault: string;
    adaptInProgressBadge: string;
    adaptOneTapEyebrow: string;
    adaptOneTapBody: string;
    syncingTodaySignals: string;
    shoppingListEmpty: string;
    generationOverlayEyebrow: string;
    generationOverlayTitle: string;
    generationOverlayBody: string;
    generationOverlayProcessing: string;
    generationStartedToastTitle: string;
    generationStartedToastBody: string;
    generationBannerMinutesNote: string;
    generationOverlayStayWarning: string;
    generationSkeletonOverview: string;
    generationSkeletonNutrition: string;
    generationSkeletonTraining: string;
    setsRepsMinLine: (sets: string | number, reps: string | number, min: string | number) => string;
    warmUpBlockNoteDefault: string;
    cooldownBlockNoteDefault: string;
    detailCalories: string;
    detailProtein: string;
    detailCarbs: string;
    detailFats: string;
    coachingStyleLabels: Record<'SUPPORTIVE' | 'DIRECT' | 'ANALYTICAL' | 'MOTIVATING', string>;
    aggressivenessLabels: Record<'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE', string>;
  }
> = {
  en: {
    pageTitle: 'Evo Coach Pro',
    premiumStrategist: 'Premium strategist',
    heroTitle: 'Evo Coach Pro',
    heroSubtitle:
      'Personalized weekly nutrition and training blueprint with rationale, smart warnings, substitutions, and adaptive coaching actions.',
    metaGoal: 'Goal',
    metaCoachingStyle: 'Coaching style',
    metaFlexibility: 'Flexibility',
    metaConfidence: 'Confidence',
    metaDataSources: 'Data sources',
    metaDataSourcesValue: 'Profile • Preferences • Activity',
    prefilledNone: 'No user profile context available yet.',
    prefilledActive: (kcal, protein, workouts) =>
      `Profile context active: ${kcal} kcal, ${protein}g protein, ${workouts} workouts/week.`,
    step1Eyebrow: 'Step 1/4',
    step1Title: 'Nutrition preferences',
    step1Subtitle: 'Define hard exclusions, soft dislikes, style, and practical cooking constraints.',
    step2Eyebrow: 'Step 2/4',
    step2Title: 'Training profile',
    step2Subtitle: 'Capture realistic training constraints, equipment, limitations, and preferred intensity.',
    step3Eyebrow: 'Step 3/4',
    step3Title: 'Goal setup',
    step3Subtitle: 'Set target outcomes, timeline, coaching style, and sustainability/aggressiveness.',
    step4Eyebrow: 'Step 4/4',
    step4Title: 'Lifestyle and realism',
    step4Subtitle: 'Map life constraints so Evo generates practical plans, not idealized fantasy schedules.',
    textareaPlaceholder: 'Comma separated values',
    hardExclusions: 'Hard exclusions (never use)',
    softDislikes: 'Soft dislikes (avoid when possible)',
    allergies: 'Allergies / intolerances',
    favoriteFoods: 'Favorite foods',
    stapleFoods: 'Staple foods at home',
    useUpIngredients: 'Ingredients to use up this week',
    preferredEatingStyle: 'Preferred eating style',
    mealsPerDay: 'Meals per day',
    cookingTime: 'Cooking time (minutes)',
    weeklyFoodBudget: 'Weekly food budget',
    allowRepeatedBreakfasts: 'Allow repeated breakfasts',
    requireLunchDinnerVariety: 'Require lunch/dinner variety',
    enableMealPrep: 'Enable meal prep mode',
    trainingTypesTitle: 'Training types',
    trainingDaysPerWeek: 'Realistic training days / week',
    preferredDuration: 'Preferred duration (minutes)',
    equipment: 'Available equipment',
    favoriteExercises: 'Favorite exercises/styles',
    dislikedExercises: 'Disliked exercises/types',
    injuries: 'Injuries / limitations / sensitive body parts',
    preferredIntensity: 'Preferred intensity',
    planStrictness: 'Plan strictness',
    primaryGoal: 'Primary goal',
    secondaryGoal: 'Secondary goal',
    targetDate: 'Target or event date (optional)',
    targetDatePlaceholder: 'YYYY-MM-DD',
    priorityFocus: 'Priority focus (comma separated)',
    expectedCoachingStyle: 'Expected coaching style',
    planAggressiveness: 'Plan aggressiveness',
    workScheduleIntensity: 'Work schedule intensity',
    sleepQuality: 'Sleep quality',
    stressLevel: 'Stress level',
    averageDailyActivity: 'Average daily activity',
    weekendsDiffer: 'Weekends differ from weekdays',
    eatsOutOften: 'I eat out often',
    practicalOverIdeal: 'Prefer practical plans over idealized plans',
    extraContext: 'Extra context for this week',
    back: 'Back',
    nextStep: 'Next step',
    generating: 'Generating Pro strategy...',
    generatePlan: 'Generate Evo Coach Pro plan',
    generationIssue: 'Generation issue',
    generationFallback: 'Could not generate Coach Pro plan.',
    progressTitle: 'Progress',
    stepOf: (n) => `Step ${n} of 4`,
    sidebarGenerateTitle: 'What Evo Coach Pro will generate',
    sidebarGenerateBullets: [
      'Weekly Nutrition Blueprint',
      'Weekly Training Blueprint',
      'AI rationale and constraints',
      'Smart warnings and tradeoffs',
      'Shopping list and substitutions',
      'Adaptive actions for real-world disruptions',
    ],
    toastReadyTitle: 'Evo Coach Pro ready',
    toastReadyBody: 'Premium weekly strategy generated.',
    toastUnsupportedAction: 'Unsupported action',
    toastSmartActionTitle: 'Smart action',
    toastActionFailTitle: 'Action failed',
    toastActionFailBody: 'Could not apply this action.',
    emptySetupTitle: 'Start your Pro setup',
    emptySetupDescription: 'Complete setup steps to generate your premium weekly strategy.',
    mealStyles: {
      HIGH_PROTEIN: 'High protein',
      LOW_CARB: 'Low carb',
      BALANCED: 'Balanced',
      QUICK_EASY: 'Quick & easy',
      BUDGET_FRIENDLY: 'Budget-friendly',
      COMFORT_HEALTHY: 'Comfort but healthy',
    },
    trainingTypes: {
      GYM: 'Gym',
      RUNNING: 'Running',
      WALKING: 'Walking',
      CYCLING: 'Cycling',
      CALISTHENICS: 'Calisthenics',
      MOBILITY: 'Mobility',
      STRETCHING: 'Stretching',
      HIIT: 'HIIT',
    },
    intensityLowModHigh: [
      { value: 'Low', label: 'Low' },
      { value: 'Moderate', label: 'Moderate' },
      { value: 'High', label: 'High' },
    ],
    strictnessOptions: [
      { value: 'Strict plan', label: 'Strict plan' },
      { value: 'Flexible adaptive plan', label: 'Flexible adaptive plan' },
    ],
    lifestyleLowModHigh: [
      { value: 'Low', label: 'Low' },
      { value: 'Moderate', label: 'Moderate' },
      { value: 'High', label: 'High' },
    ],
    sleepOptions: [
      { value: 'Poor', label: 'Poor' },
      { value: 'Average', label: 'Average' },
      { value: 'Good', label: 'Good' },
    ],
    stressOptions: [
      { value: 'Low', label: 'Low' },
      { value: 'Medium', label: 'Medium' },
      { value: 'High', label: 'High' },
    ],
    proactivityDisplay: { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' },
    coachingToneSupportive: 'Supportive',
    coachingToneDirect: 'Direct',
    previewToneTitle: 'Preview tone',
    previewToneDirect: 'Direct: Evo keeps feedback tight and task-focused.',
    previewToneSupportive: 'Supportive: Evo stays warm, but still practical and concrete.',
    confidenceHigh: 'High',
    confidenceMedium: 'Medium',
    confidenceFoundational: 'Foundational',
    weeklySuccessMarkers: (d) => [
      'Hit protein target on at least 5 of 7 days',
      `Complete ${Math.max(3, d - 1)} of ${d} planned sessions`,
      'Lock one meal-prep block before mid-week',
      'Keep recovery day low-intensity with full cooldown',
    ],
    nextBestActionPrefix: 'Next best action:',
    nextBestActionFallback: 'Schedule your first two training sessions now.',
    dashboardEyebrow: 'Evo Coach Pro dashboard',
    dashboardTitle: 'Evo Coach Pro dashboard',
    dashboardSubtitle: 'Transparent, adaptive weekly strategy generated from your profile, constraints, and behavior context.',
    overviewCaloriesRange: 'Calories range',
    overviewTrainingFreq: 'Training frequency',
    overviewDifficulty: 'Difficulty',
    overviewExpectedPace: 'Expected pace',
    overviewFlexibility: 'Flexibility',
    overviewConfidence: 'Confidence',
    adaptTodayTitle: 'Need to adapt today?',
    whyWeekTitle: 'Why this week looks like this',
    weeklySuccessTitle: 'Weekly success markers',
    shoppingListTitle: 'AI shopping list',
    shopProteins: 'Proteins',
    shopCarbs: 'Carbs',
    shopFats: 'Fats',
    shopVegetables: 'Vegetables',
    shopDairy: 'Dairy',
    shopExtras: 'Extras',
    shopOptional: 'Optional items',
    coachGuidanceTitle: 'Coach guidance',
    hardestPart: 'Hardest part this week',
    whereToFocus: 'Where to focus',
    coachNotesTradeoffs: 'Coach notes and tradeoffs',
    notesCoach: 'Coach notes',
    notesExecution: 'Execution tips',
    notesMealPrep: 'Meal prep tips',
    notesSubstitutions: 'Substitutions',
    bestCasePlan: 'Best-case plan',
    realisticPlan: 'Realistic plan',
    drawerCloseMeal: 'Close meal details',
    drawerClosePanel: 'Close panel',
    drawerGeneratingMeal: 'Evo is generating meal instructions...',
    statCalories: 'Calories',
    statProtein: 'Protein',
    statCarbsFat: 'Carbs/Fat',
    statPrepTime: 'Prep time',
    sectionDescription: 'Description',
    whyInPlan: 'Why in plan:',
    sectionIngredients: 'Ingredients',
    noIngredients: 'No ingredients provided yet.',
    sectionRecipe: 'Recipe steps',
    noRecipeSteps: 'No preparation flow available.',
    sectionNutritionDetails: 'Nutrition details',
    detailFiber: 'Fiber',
    detailSatiety: 'Satiety',
    suggestedUseLine: (use, kcal, p) =>
      `Suggested use: ${use} • Day target: ${kcal} kcal / P ${p}g`,
    generalMeal: 'General meal',
    smartActionsTitle: 'Smart actions',
    applyingAction: 'Applying action…',
    drawerTrainingClose: 'Close training details',
    drawerTrainingSession: 'Training session',
    drawerGeneratingTraining: 'Evo is generating session instructions...',
    statDuration: 'Duration',
    statIntensity: 'Intensity',
    statBlocks: 'Blocks',
    statMode: 'Mode',
    statModeAdaptive: 'Adaptive',
    warmUpTitle: 'Warm-up',
    warmUpFallback: 'Start with 8 minutes of dynamic prep and activation.',
    mainWorkTitle: 'Main work',
    cooldownTitle: 'Cooldown',
    cooldownFallback: 'Finish with breathing reset and mobility cooldown.',
    fallbackShortTitle: 'Fallback short version',
    minViableTitle: 'Minimum viable session',
    whySessionTitle: 'Why this session',
    whySessionBody:
      'Session focus supports your weekly objective with a realistic workload and practical fallback path for low-energy days.',
    painSubstitutionFallback:
      'Pain/low-energy substitution: reduce range, lower load, and keep one main movement + one support block.',
    whySessionPrefix: 'Why this session:',
    booleanEatsOut: 'I eat out often',
    reconfigureSetup: 'Reconfigure setup',
    planOverviewEyebrow: 'Plan overview',
    weeklyNutritionPlanTitle: 'Weekly nutrition plan',
    weeklyTrainingPlanTitle: 'Weekly training plan',
    weekNutritionSubtitlePartial: (shown, total) => `From today · showing ${shown} of ${total} days`,
    weekNutritionSubtitleFull: 'From today · full week in this section',
    weekTrainingSubtitlePartial: (shown, total) =>
      `From today · showing ${shown} of ${total} days (same order as nutrition)`,
    weekTrainingSubtitleFull: 'From today · full week · same day order as nutrition',
    showOnlyThreeNutritionDays: 'Show only the next 3 nutrition days',
    showRemainingNutritionDays: (n) => `Show remaining nutrition days (${n})`,
    showOnlyThreeTrainingDays: 'Show only the next 3 training days',
    showRemainingTrainingDays: (n) => `Show remaining training days (${n})`,
    mealOpenRecipeAria: (mealName) => `Open recipe details for ${mealName}`,
    mealCardDetails: 'Details',
    mealPrepSuffix: (min) => `prep ${min} min`,
    trainingViewSessionDetails: 'View session details',
    trainingFallbackLabel: 'Fallback',
    trainingMinimumViableLabel: 'Minimum viable',
    biggestRiskTitle: 'Biggest risk this week',
    bestMitigationPrefix: 'Best mitigation:',
    bestMitigationDefault: 'Prepare two anchor meals and lock training slots early.',
    adaptInProgressBadge: 'In progress',
    adaptOneTapEyebrow: 'One-tap adjustments (preview)',
    adaptOneTapBody:
      'Quick actions for sleep, training, and meals are coming soon. Fewer options will ship first.',
    syncingTodaySignals: 'Syncing today signals...',
    shoppingListEmpty: 'None',
    generationOverlayEyebrow: 'Evo is preparing your plan',
    generationOverlayTitle: 'Generating your personalized Evo Coach Pro strategy',
    generationOverlayBody:
      'Evo is building your weekly meals, training structure, substitutions, and execution guidance.',
    generationOverlayProcessing: 'Processing profile, preferences, and week structure...',
    generationStartedToastTitle: 'Coach Pro is generating',
    generationStartedToastBody:
      'This often takes several minutes. Stay on this tab and do not navigate away until it finishes.',
    generationBannerMinutesNote:
      'Evo is building your full weekly plan (meals, training, shopping list, and the detail pass). With GPT-5 class models this often takes several minutes.',
    generationOverlayStayWarning:
      'Stay on this page and keep this tab open until generation finishes. Navigating elsewhere or closing the tab will interrupt the request and the plan may not be saved.',
    generationSkeletonOverview: 'Plan overview skeleton',
    generationSkeletonNutrition: 'Weekly nutrition skeleton',
    generationSkeletonTraining: 'Weekly training skeleton',
    setsRepsMinLine: (sets, reps, min) => `${sets} sets • ${reps} reps • ${min} min`,
    warmUpBlockNoteDefault: 'Prepare movement quality.',
    cooldownBlockNoteDefault: 'Finish and down-regulate.',
    detailCalories: 'Calories',
    detailProtein: 'Protein',
    detailCarbs: 'Carbs',
    detailFats: 'Fats',
    coachingStyleLabels: {
      SUPPORTIVE: 'Supportive',
      DIRECT: 'Direct',
      ANALYTICAL: 'Analytical',
      MOTIVATING: 'Motivating',
    },
    aggressivenessLabels: {
      CONSERVATIVE: 'Conservative',
      BALANCED: 'Balanced',
      AGGRESSIVE: 'Aggressive',
    },
  },
  pl: {
    pageTitle: 'Evo Coach Pro',
    premiumStrategist: 'Strateg premium',
    heroTitle: 'Evo Coach Pro',
    heroSubtitle:
      'Tygodniowy plan żywienia i treningu z uzasadnieniem, ostrzeżeniami, zamiennikami i adaptacyjnymi działaniami coacha.',
    metaGoal: 'Cel',
    metaCoachingStyle: 'Styl coachowania',
    metaFlexibility: 'Elastyczność',
    metaConfidence: 'Pewność',
    metaDataSources: 'Źródła danych',
    metaDataSourcesValue: 'Profil • Preferencje • Aktywność',
    prefilledNone: 'Brak jeszcze kontekstu profilu.',
    prefilledActive: (kcal, protein, workouts) =>
      `Aktywny kontekst: ${kcal} kcal, ${protein} g białka, ${workouts} treningów/tydz.`,
    step1Eyebrow: 'Krok 1/4',
    step1Title: 'Preferencje żywieniowe',
    step1Subtitle: 'Wykluczenia, nietolerancje, styl jedzenia i realne ograniczenia kuchenne.',
    step2Eyebrow: 'Krok 2/4',
    step2Title: 'Profil treningowy',
    step2Subtitle: 'Dni treningów, sprzęt, ograniczenia i preferowana intensywność.',
    step3Eyebrow: 'Krok 3/4',
    step3Title: 'Cele',
    step3Subtitle: 'Efekty, horyzont czasu, styl coacha i agresywność planu.',
    step4Eyebrow: 'Krok 4/4',
    step4Title: 'Lifestyle i realizm',
    step4Subtitle: 'Ograniczenia życiowe, żeby plan był wykonalny — nie teoretyczny.',
    textareaPlaceholder: 'Wartości oddzielone przecinkami',
    hardExclusions: 'Twarde wykluczenia (nigdy)',
    softDislikes: 'Miękkie „nie lubisz” (unikać)',
    allergies: 'Alergie / nietolerancje',
    favoriteFoods: 'Ulubione produkty',
    stapleFoods: 'Stałe zapasy w domu',
    useUpIngredients: 'Zużyć w tym tygodniu',
    preferredEatingStyle: 'Preferowany styl posiłków',
    mealsPerDay: 'Posiłki dziennie',
    cookingTime: 'Czas gotowania (min)',
    weeklyFoodBudget: 'Tygodniowy budżet żywności',
    allowRepeatedBreakfasts: 'Powtarzalne śniadania dozwolone',
    requireLunchDinnerVariety: 'Różnorodność obiad/kolacja',
    enableMealPrep: 'Tryb meal prep',
    trainingTypesTitle: 'Rodzaje treningu',
    trainingDaysPerWeek: 'Realistycznie dni treningu / tydzień',
    preferredDuration: 'Preferowany czas sesji (min)',
    equipment: 'Dostępny sprzęt',
    favoriteExercises: 'Ulubione ćwiczenia / style',
    dislikedExercises: 'Nielubiane ćwiczenia',
    injuries: 'Kontuzje / ograniczenia / „bolące” strefy',
    preferredIntensity: 'Preferowana intensywność',
    planStrictness: 'Sztywność planu',
    primaryGoal: 'Cel główny',
    secondaryGoal: 'Cel dodatkowy',
    targetDate: 'Data celu / wydarzenia (opcjonalnie)',
    targetDatePlaceholder: 'RRRR-MM-DD',
    priorityFocus: 'Priorytety (po przecinku)',
    expectedCoachingStyle: 'Styl coacha',
    planAggressiveness: 'Agresywność planu',
    workScheduleIntensity: 'Intensywność pracy',
    sleepQuality: 'Jakość snu',
    stressLevel: 'Poziom stresu',
    averageDailyActivity: 'Średnia aktywność dziennie',
    weekendsDiffer: 'Weekendy inne niż dni robocze',
    eatsOutOften: 'Często jem poza domem',
    practicalOverIdeal: 'Wolę praktyczny plan od idealnego na papierze',
    extraContext: 'Dodatkowy kontekst na ten tydzień',
    back: 'Wstecz',
    nextStep: 'Dalej',
    generating: 'Generuję strategię Pro…',
    generatePlan: 'Wygeneruj plan Evo Coach Pro',
    generationIssue: 'Problem generowania',
    generationFallback: 'Nie udało się wygenerować planu Coach Pro.',
    progressTitle: 'Postęp',
    stepOf: (n) => `Krok ${n} z 4`,
    sidebarGenerateTitle: 'Co wygeneruje Evo Coach Pro',
    sidebarGenerateBullets: [
      'Tygodniowy plan żywienia',
      'Tygodniowy plan treningu',
      'Uzasadnienie AI i ograniczenia',
      'Ostrzeżenia i kompromisy',
      'Lista zakupów i zamienniki',
      'Działania adaptacyjne przy zmianach dnia',
    ],
    toastReadyTitle: 'Evo Coach Pro gotowe',
    toastReadyBody: 'Wygenerowano tygodniową strategię premium.',
    toastUnsupportedAction: 'Nieobsługiwane działanie',
    toastSmartActionTitle: 'Szybkie działanie',
    toastActionFailTitle: 'Działanie nieudane',
    toastActionFailBody: 'Nie udało się zastosować tej akcji.',
    emptySetupTitle: 'Zacznij konfigurację Pro',
    emptySetupDescription: 'Uzupełnij kroki, aby wygenerować tygodniową strategię premium.',
    mealStyles: {
      HIGH_PROTEIN: 'Wysokie białko',
      LOW_CARB: 'Niskowęglowe',
      BALANCED: 'Zbalansowane',
      QUICK_EASY: 'Szybkie i proste',
      BUDGET_FRIENDLY: 'Budżetowe',
      COMFORT_HEALTHY: 'Comfort, ale zdrowiej',
    },
    trainingTypes: {
      GYM: 'Siłownia',
      RUNNING: 'Bieganie',
      WALKING: 'Marsz',
      CYCLING: 'Rower',
      CALISTHENICS: 'Kalistenika',
      MOBILITY: 'Mobilność',
      STRETCHING: 'Rozciąganie',
      HIIT: 'HIIT',
    },
    intensityLowModHigh: [
      { value: 'Low', label: 'Niska' },
      { value: 'Moderate', label: 'Umiarkowana' },
      { value: 'High', label: 'Wysoka' },
    ],
    strictnessOptions: [
      { value: 'Strict plan', label: 'Plan ścisły' },
      { value: 'Flexible adaptive plan', label: 'Elastyczny, adaptacyjny' },
    ],
    lifestyleLowModHigh: [
      { value: 'Low', label: 'Niska' },
      { value: 'Moderate', label: 'Umiarkowana' },
      { value: 'High', label: 'Wysoka' },
    ],
    sleepOptions: [
      { value: 'Poor', label: 'Słaba' },
      { value: 'Average', label: 'Średnia' },
      { value: 'Good', label: 'Dobra' },
    ],
    stressOptions: [
      { value: 'Low', label: 'Niski' },
      { value: 'Medium', label: 'Średni' },
      { value: 'High', label: 'Wysoki' },
    ],
    proactivityDisplay: { LOW: 'Niski', MEDIUM: 'Średni', HIGH: 'Wysoki' },
    coachingToneSupportive: 'Wspierający',
    coachingToneDirect: 'Bezpośredni',
    previewToneTitle: 'Podgląd tonu',
    previewToneDirect: 'Bezpośredni: Evo zwięźle i konkretnie.',
    previewToneSupportive: 'Wspierający: Evo ciepło, ale praktycznie.',
    confidenceHigh: 'Wysoka',
    confidenceMedium: 'Średnia',
    confidenceFoundational: 'Wstępna',
    weeklySuccessMarkers: (d) => [
      'Białko w minimum 5 z 7 dni zgodnie z celem',
      `Zrealizuj ${Math.max(3, d - 1)} z ${d} zaplanowanych sesji`,
      'Zablokuj jeden blok meal prep przed środkiem tygodnia',
      'Dzień regeneracji: niska intensywność i rozluźnienie',
    ],
    nextBestActionPrefix: 'Najlepszy następny krok:',
    nextBestActionFallback: 'Zaplanuj dwie pierwsze sesje treningowe.',
    dashboardEyebrow: 'Pulpit Evo Coach Pro',
    dashboardTitle: 'Pulpit Evo Coach Pro',
    dashboardSubtitle: 'Przejrzysta, adaptacyjna strategia tygodnia z profilu, ograniczeń i kontekstu zachowań.',
    overviewCaloriesRange: 'Zakres kalorii',
    overviewTrainingFreq: 'Częstotliwość treningów',
    overviewDifficulty: 'Trudność',
    overviewExpectedPace: 'Oczekiwane tempo',
    overviewFlexibility: 'Elastyczność',
    overviewConfidence: 'Pewność',
    adaptTodayTitle: 'Dostosować dziś?',
    whyWeekTitle: 'Dlaczego taki tydzień',
    weeklySuccessTitle: 'Markery sukcesu tygodnia',
    shoppingListTitle: 'Lista zakupów (AI)',
    shopProteins: 'Białka',
    shopCarbs: 'Węglowodany',
    shopFats: 'Tłuszcze',
    shopVegetables: 'Warzywa',
    shopDairy: 'Nabiał',
    shopExtras: 'Dodatki',
    shopOptional: 'Opcjonalnie',
    coachGuidanceTitle: 'Wskazówki coacha',
    hardestPart: 'Najtrudniejszy fragment tygodnia',
    whereToFocus: 'Na czym się skupić',
    coachNotesTradeoffs: 'Notatki coacha i kompromisy',
    notesCoach: 'Notatki coacha',
    notesExecution: 'Wskazówki wykonania',
    notesMealPrep: 'Meal prep',
    notesSubstitutions: 'Zamienniki',
    bestCasePlan: 'Plan optymistyczny',
    realisticPlan: 'Plan realistyczny',
    drawerCloseMeal: 'Zamknij szczegóły posiłku',
    drawerClosePanel: 'Zamknij panel',
    drawerGeneratingMeal: 'Evo generuje instrukcje posiłku…',
    statCalories: 'Kalorie',
    statProtein: 'Białko',
    statCarbsFat: 'Węgle / tłuszcz',
    statPrepTime: 'Czas prep',
    sectionDescription: 'Opis',
    whyInPlan: 'Dlaczego w planie:',
    sectionIngredients: 'Składniki',
    noIngredients: 'Brak listy składników.',
    sectionRecipe: 'Kroki przepisu',
    noRecipeSteps: 'Brak opisu przygotowania.',
    sectionNutritionDetails: 'Makro — szczegóły',
    detailFiber: 'Błonnik',
    detailSatiety: 'Sycenie',
    suggestedUseLine: (use, kcal, p) =>
      `Sugerowane użycie: ${use} • Cel dnia: ${kcal} kcal / B ${p} g`,
    generalMeal: 'Posiłek ogólny',
    smartActionsTitle: 'Szybkie akcje',
    applyingAction: 'Stosuję akcję…',
    drawerTrainingClose: 'Zamknij szczegóły treningu',
    drawerTrainingSession: 'Sesja treningowa',
    drawerGeneratingTraining: 'Evo generuje instrukcje sesji…',
    statDuration: 'Czas',
    statIntensity: 'Intensywność',
    statBlocks: 'Bloki',
    statMode: 'Tryb',
    statModeAdaptive: 'Adaptacyjny',
    warmUpTitle: 'Rozgrzewka',
    warmUpFallback: 'Zacznij od ok. 8 min dynamicznej rozgrzewki i aktywacji.',
    mainWorkTitle: 'Główna część',
    cooldownTitle: 'Schłodzenie',
    cooldownFallback: 'Zakończ oddechem i mobilnością.',
    fallbackShortTitle: 'Krótsza wersja zapasowa',
    minViableTitle: 'Minimalna wykonalna sesja',
    whySessionTitle: 'Dlaczego ta sesja',
    whySessionBody:
      'Skupienie sesji wspiera cel tygodnia z realnym obciążeniem i planem B przy niskiej energii.',
    painSubstitutionFallback:
      'Zamiennik przy bólu/niskiej energii: mniejszy zakres, lżejszy ciężar, jeden ruch główny + jeden wspierający.',
    whySessionPrefix: 'Dlaczego ta sesja:',
    booleanEatsOut: 'Często jem poza domem',
    reconfigureSetup: 'Skonfiguruj ponownie',
    planOverviewEyebrow: 'Przegląd planu',
    weeklyNutritionPlanTitle: 'Tygodniowy plan żywienia',
    weeklyTrainingPlanTitle: 'Tygodniowy plan treningu',
    weekNutritionSubtitlePartial: (shown, total) => `Od dziś · widać ${shown} z ${total} dni`,
    weekNutritionSubtitleFull: 'Od dziś · pełny tydzień w tej sekcji',
    weekTrainingSubtitlePartial: (shown, total) =>
      `Od dziś · widać ${shown} z ${total} dni (ta sama kolejność co żywienie)`,
    weekTrainingSubtitleFull: 'Od dziś · pełny tydzień · ta sama kolejność co żywienie',
    showOnlyThreeNutritionDays: 'Pokaż tylko 3 kolejne dni żywienia',
    showRemainingNutritionDays: (n) => `Pokaż pozostałe dni żywienia (${n})`,
    showOnlyThreeTrainingDays: 'Pokaż tylko 3 kolejne dni treningu',
    showRemainingTrainingDays: (n) => `Pokaż pozostałe dni treningu (${n})`,
    mealOpenRecipeAria: (mealName) => `Otwórz szczegóły przepisu: ${mealName}`,
    mealCardDetails: 'Szczegóły',
    mealPrepSuffix: (min) => `prep ${min} min`,
    trainingViewSessionDetails: 'Zobacz szczegóły sesji',
    trainingFallbackLabel: 'Plan B',
    trainingMinimumViableLabel: 'Minimum',
    biggestRiskTitle: 'Największe ryzyko w tym tygodniu',
    bestMitigationPrefix: 'Najlepsza łagodność:',
    bestMitigationDefault: 'Przygotuj dwa kotwicowe posiłki i zarezerwuj sloty treningowe wcześnie.',
    adaptInProgressBadge: 'W toku',
    adaptOneTapEyebrow: 'Szybkie zmiany (podgląd)',
    adaptOneTapBody:
      'Akcje dla snu, treningu i posiłków wkrótce. Na start pojawi się mniejszy zestaw opcji.',
    syncingTodaySignals: 'Synchronizacja sygnałów z dzisiaj…',
    shoppingListEmpty: 'Brak',
    generationOverlayEyebrow: 'Evo przygotowuje plan',
    generationOverlayTitle: 'Generowanie spersonalizowanej strategii Evo Coach Pro',
    generationOverlayBody:
      'Evo układa posiłki, strukturę treningu, zamienniki i wskazówki wykonania na tydzień.',
    generationOverlayProcessing: 'Przetwarzanie profilu, preferencji i struktury tygodnia…',
    generationStartedToastTitle: 'Evo generuje plan Coach Pro',
    generationStartedToastBody:
      'To często kilka minut. Zostań na tej karcie i nie przechodź nigdzie indziej, dopóki się nie skończy.',
    generationBannerMinutesNote:
      'Evo układa pełny plan tygodnia (posiłki, trening, lista zakupów i drugi etap szczegółów). Przy modelach z rodziny GPT-5 bywa to kilka minut.',
    generationOverlayStayWarning:
      'Zostań na tej stronie i nie zamykaj karty, dopóki generowanie się nie zakończy. Przejście w inne miejsce aplikacji lub zamknięcie karty przerwie żądanie — plan może się nie zapisać.',
    generationSkeletonOverview: 'Szkic przeglądu planu',
    generationSkeletonNutrition: 'Szkic żywienia tygodnia',
    generationSkeletonTraining: 'Szkic treningu tygodnia',
    setsRepsMinLine: (sets, reps, min) => `${sets} serii • ${reps} powt. • ${min} min`,
    warmUpBlockNoteDefault: 'Dbaj o jakość ruchu.',
    cooldownBlockNoteDefault: 'Schłodzenie i wyciszenie.',
    detailCalories: 'Kalorie',
    detailProtein: 'Białko',
    detailCarbs: 'Węglowodany',
    detailFats: 'Tłuszcze',
    coachingStyleLabels: {
      SUPPORTIVE: 'Wspierający',
      DIRECT: 'Bezpośredni',
      ANALYTICAL: 'Analityczny',
      MOTIVATING: 'Motywujący',
    },
    aggressivenessLabels: {
      CONSERVATIVE: 'Ostrożny',
      BALANCED: 'Zbalansowany',
      AGGRESSIVE: 'Agresywny',
    },
  },
};

export function coachingStyleSelectOptions(locale: UiLocale): { value: string; label: string }[] {
  const L = coachProPageCopy[locale].coachingStyleLabels;
  return (
    [
      ['SUPPORTIVE', L.SUPPORTIVE],
      ['DIRECT', L.DIRECT],
      ['ANALYTICAL', L.ANALYTICAL],
      ['MOTIVATING', L.MOTIVATING],
    ] as const
  ).map(([value, label]) => ({ value, label }));
}

export function aggressivenessSelectOptions(locale: UiLocale): { value: string; label: string }[] {
  const L = coachProPageCopy[locale].aggressivenessLabels;
  return (
    [
      ['CONSERVATIVE', L.CONSERVATIVE],
      ['BALANCED', L.BALANCED],
      ['AGGRESSIVE', L.AGGRESSIVE],
    ] as const
  ).map(([value, label]) => ({ value, label }));
}

export function displayCoachingStyleLabel(locale: UiLocale, code: string): string {
  const key = String(code || '').toUpperCase() as keyof (typeof coachProPageCopy)['en']['coachingStyleLabels'];
  return coachProPageCopy[locale].coachingStyleLabels[key] ?? code;
}

export type CoachProPageCopy = (typeof coachProPageCopy)['en'];
