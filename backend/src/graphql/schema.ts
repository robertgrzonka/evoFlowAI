import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  scalar Date
  scalar Upload

  type User {
    id: ID!
    email: String!
    name: String!
    preferences: UserPreferences!
    createdAt: Date!
  }

  type UserPreferences {
    dailyCalorieGoal: Int!
    weightKg: Float
    heightCm: Float
    proteinGoal: Int!
    carbsGoal: Int!
    fatGoal: Int!
    weeklyWorkoutsGoal: Int!
    weeklyActiveMinutesGoal: Int!
    primaryGoal: String!
    coachingTone: CoachingTone!
    proactivityLevel: ProactivityLevel!
    dietaryRestrictions: [String!]!
    activityLevel: ActivityLevel!
    notifications: Boolean!
    """UI + Evo insights language (beta)."""
    appLocale: AppLocale!
  }

  enum ActivityLevel {
    SEDENTARY
    LIGHT
    MODERATE
    ACTIVE
    VERY_ACTIVE
  }

  enum CoachingTone {
    GENTLE
    SUPPORTIVE
    DIRECT
    STRICT
  }

  enum ProactivityLevel {
    LOW
    MEDIUM
    HIGH
  }

  enum AppLocale {
    EN
    PL
  }

  type NutritionInfo {
    calories: Float!
    protein: Float!
    carbs: Float!
    fat: Float!
    fiber: Float
    sugar: Float
    sodium: Float
    confidence: Float!
  }

  enum MealType {
    breakfast
    lunch
    dinner
    snack
  }

  type FoodItem {
    id: ID!
    userId: ID!
    imageUrl: String!
    name: String!
    description: String
    nutrition: NutritionInfo!
    mealType: MealType!
    createdAt: Date!
  }

  type DailyStats {
    date: String!
    totalCalories: Float!
    totalProtein: Float!
    totalCarbs: Float!
    totalFat: Float!
    dynamicGoals: GoalTargets!
    steps: Int!
    stepsCalories: Float!
    workoutCalories: Float!
    """Extra kcal allowance you set for this day (planned walk, etc.); already included in calorieBudget."""
    activityBonusKcal: Float!
    calorieBudget: Float!
    meals: [FoodItem!]!
    goalProgress: GoalProgress!
  }

  type GoalTargets {
    calories: Float!
    protein: Float!
    carbs: Float!
    fat: Float!
  }

  type GoalProgress {
    calories: Float!
    protein: Float!
    carbs: Float!
    fat: Float!
  }

  type ChatMessage {
    id: ID!
    userId: ID!
    content: String!
    role: MessageRole!
    channel: ChatChannel!
    timestamp: Date!
    context: MessageContext
  }

  enum MessageRole {
    USER
    ASSISTANT
  }

  enum ChatChannel {
    GENERAL
    COACH
    LOG
  }

  type MessageContext {
    relatedFoodItems: [ID!]
    statsReference: String
  }

  type AIRecommendation {
    id: ID!
    userId: ID!
    type: RecommendationType!
    title: String!
    content: String!
    priority: Priority!
    createdAt: Date!
    isRead: Boolean!
  }

  enum RecommendationType {
    MEAL_SUGGESTION
    NUTRITION_TIP
    GOAL_ADJUSTMENT
    WARNING
  }

  enum Priority {
    LOW
    MEDIUM
    HIGH
  }

  enum WorkoutIntensity {
    LOW
    MEDIUM
    HIGH
  }

  type Workout {
    id: ID!
    userId: ID!
    title: String!
    notes: String
    durationMinutes: Int!
    caloriesBurned: Int!
    intensity: WorkoutIntensity!
    performedAt: Date!
    createdAt: Date!
  }

  type WorkoutCoachSummary {
    date: String!
    consumedCalories: Float!
    consumedProtein: Float!
    calorieGoal: Int!
    proteinGoal: Int!
    caloriesBurned: Float!
    steps: Int!
    stepsCalories: Float!
    calorieBudget: Float!
    netCalories: Float!
    remainingCalories: Float!
    remainingProtein: Float!
    message: String!
  }

  enum DashboardNextActionTarget {
    MEALS
    WORKOUTS
    CHAT_COACH
    STATS
    GOALS
  }

  type DashboardInsightNextAction {
    title: String!
    description: String!
    actionLabel: String!
    target: DashboardNextActionTarget!
  }

  type DashboardInsight {
    date: String!
    summary: String!
    """Short warm vibe line from AI — not a duplicate of summary."""
    supportLine: String!
    tips: [String!]!
    """AI-personalized next step; when null, open chat from the client."""
    nextAction: DashboardInsightNextAction
    caloriesBurned: Float!
    steps: Int!
    stepsCalories: Float!
    calorieBudget: Float!
    netCalories: Float!
    remainingCalories: Float!
    remainingProtein: Float!
  }

  type DailyActivity {
    date: String!
    steps: Int!
    estimatedCalories: Float!
    activityBonusKcal: Int!
  }

  type WeeklyEvoReview {
    startDate: String!
    endDate: String!
    trackedDays: Int!
    availableDays: Int!
    isCompleteWeek: Boolean!
    summary: String!
    highlights: [String!]!
    """One sharp, preference-aware coaching move — not generic filler."""
    proTip: String!
    nutritionScore: Int!
    trainingScore: Int!
    consistencyScore: Int!
  }

  type WeeklyMealsDayLoggedMeal {
    name: String!
    mealType: String!
    calories: Float!
  }

  type WeeklyMealsDayRow {
    date: String!
    calories: Float!
    protein: Float!
    carbs: Float!
    fat: Float!
    mealCount: Int!
    meals: [WeeklyMealsDayLoggedMeal!]!
    """Calorie budget that day (rest-day target + logged workout burn + manual activity bonus; steps do not add kcal)."""
    dayCalorieBudget: Float!
    workoutCaloriesBurned: Float!
    workoutSessions: Int!
    activityBonusKcal: Float!
    steps: Int!
    """Reserved: kcal from steps are not applied to budget in this app (always 0)."""
    stepCaloriesBudget: Float!
  }

  type WeeklyMealsMacroTotals {
    calories: Float!
    protein: Float!
    carbs: Float!
    fat: Float!
  }

  type WeeklyMealsGoals {
    calories: Float!
    protein: Float!
    carbs: Float!
    fat: Float!
  }

  type WeeklyMealsNutritionSummary {
    weekStart: String!
    weekEnd: String!
    days: [WeeklyMealsDayRow!]!
    daysWithMeals: Int!
    totalMealsLogged: Int!
    goals: WeeklyMealsGoals!
    totals: WeeklyMealsMacroTotals!
    averages: WeeklyMealsMacroTotals!
    """Daily averages for the 7-day window immediately before weekStart (for week-over-week deltas)."""
    priorWeekAverages: WeeklyMealsMacroTotals!
    """Mean workout kcal burned per day over that prior window."""
    priorAvgWorkoutKcalPerDay: Float!
  }

  type WeeklyMealsCoachInsight {
    headline: String!
    summary: String!
    focusAreas: [String!]!
    improvements: [String!]!
    closingLine: String!
  }

  type WeeklyWorkoutsDayRow {
    date: String!
    sessionCount: Int!
    totalMinutes: Float!
    caloriesBurned: Float!
    lowMinutes: Float!
    mediumMinutes: Float!
    highMinutes: Float!
  }

  type WeeklyWorkoutsTotals {
    minutes: Float!
    caloriesBurned: Float!
    sessions: Float!
  }

  type WeeklyWorkoutsGoals {
    weeklySessionsTarget: Float!
    weeklyActiveMinutesTarget: Float!
  }

  type WeeklyWorkoutsTrainingSummary {
    weekStart: String!
    weekEnd: String!
    days: [WeeklyWorkoutsDayRow!]!
    daysWithWorkouts: Int!
    totalSessions: Int!
    goals: WeeklyWorkoutsGoals!
    totals: WeeklyWorkoutsTotals!
    averages: WeeklyWorkoutsTotals!
  }

  type WeeklyWorkoutsCoachInsight {
    headline: String!
    summary: String!
    focusAreas: [String!]!
    improvements: [String!]!
    closingLine: String!
  }

  enum ProMealStyle {
    HIGH_PROTEIN
    LOW_CARB
    BALANCED
    QUICK_EASY
    BUDGET_FRIENDLY
    COMFORT_HEALTHY
  }

  enum ProTrainingType {
    GYM
    RUNNING
    WALKING
    CYCLING
    CALISTHENICS
    MOBILITY
    STRETCHING
    HIIT
  }

  enum ProCoachingStyle {
    SUPPORTIVE
    DIRECT
    ANALYTICAL
    MOTIVATING
  }

  enum ProPlanAggressiveness {
    CONSERVATIVE
    BALANCED
    AGGRESSIVE
  }

  enum ProAdaptiveAction {
    SLEPT_BADLY
    MISSED_WORKOUT
    ONLY_30_MINUTES
    ATE_MORE_THAN_PLANNED
    NEED_EASIER_DAY
    SIMPLER_MEAL_TODAY
    SHOULDER_KNEE_ISSUE
  }

  type CoachProOverview {
    calorieTargetRange: String!
    trainingFrequency: String!
    planDifficulty: String!
    expectedPace: String!
    flexibilityLevel: String!
    """Long-form Evo narrative for the dashboard header; ties goals to overview pills."""
    evoDashboardInsight: String
  }

  type CoachProMeal {
    mealType: String!
    name: String!
    description: String!
    estimatedCalories: Int!
    estimatedProtein: Int!
    estimatedCarbs: Int!
    estimatedFat: Int!
    fiberGrams: Int
    estimatedSatiety: String
    suggestedUse: String
    prepTimeMinutes: Int!
    tags: [String!]!
    ingredients: [CoachProMealIngredient!]!
    recipeSteps: [String!]!
    substitutions: [String!]!
    mealPrepNote: String
    rationale: String
  }

  type CoachProMealIngredient {
    item: String!
    quantity: String!
  }

  type CoachProNutritionDay {
    dayLabel: String!
    calorieTarget: Int!
    proteinTarget: Int!
    carbsTarget: Int!
    fatTarget: Int!
    meals: [CoachProMeal!]!
  }

  type CoachProExerciseBlock {
    name: String!
    sets: String
    reps: String
    durationMinutes: Int
    notes: String
  }

  type CoachProTrainingSession {
    dayLabel: String!
    sessionGoal: String!
    workoutType: String!
    durationMinutes: Int!
    intensity: String!
    structure: [CoachProExerciseBlock!]!
    fallbackVersion: String!
    minimumViableVersion: String!
  }

  type CoachProShoppingList {
    proteins: [String!]!
    carbs: [String!]!
    fats: [String!]!
    vegetables: [String!]!
    dairy: [String!]!
    extras: [String!]!
    optionalItems: [String!]!
  }

  type CoachProSubstitutions {
    ingredientSubstitutions: [String!]!
    mealSwaps: [String!]!
    exerciseSubstitutions: [String!]!
    lowEnergyAlternatives: [String!]!
    shortOnTimeAlternatives: [String!]!
  }

  type CoachProPlan {
    generatedAt: Date!
    generationSource: String!
    fallbackReason: String
    generationWarnings: [String!]!
    normalizationApplied: Boolean!
    normalizationSummary: [String!]!
    normalizedFields: [String!]!
    shoppingListSource: String!
    shoppingListWarnings: [String!]!
    sectionSources: [String!]!
    fallbackSections: [String!]!
    overview: CoachProOverview!
    weeklyNutrition: [CoachProNutritionDay!]!
    weeklyTraining: [CoachProTrainingSession!]!
    rationale: [String!]!
    smartWarnings: [String!]!
    shoppingList: CoachProShoppingList!
    substitutions: CoachProSubstitutions!
    coachNotes: [String!]!
    hardestPartThisWeek: String!
    focusForBestResults: String!
    executionTips: [String!]!
    mealPrepTips: [String!]!
    recoveryNote: String!
    bestCasePlan: String!
    realisticPlan: String!
  }

  type CoachProTrainingDrawerDetails {
    session: CoachProTrainingSession!
    whyThisSession: String!
    painSubstitution: String!
  }

  enum StepSyncProvider {
    GARMIN
  }

  type StepSyncStatus {
    provider: StepSyncProvider!
    connected: Boolean!
    configured: Boolean!
    usingEnvToken: Boolean!
    lastSyncedAt: Date
    lastError: String
  }

  type StepSyncResult {
    date: String!
    importedSteps: Int!
    savedSteps: Int!
    source: StepSyncProvider!
    syncedAt: Date!
  }

  type AnalyzeImageResponse {
    nutrition: NutritionInfo!
    foodName: String!
    description: String!
    suggestions: [String!]!
  }

  type StatsResponse {
    period: String!
    averageCalories: Float!
    averageProtein: Float!
    averageCarbs: Float!
    averageFat: Float!
    totalMeals: Int!
    goalAchievementRate: Float!
    trends: StatsTrends!
  }

  type StatsTrends {
    calories: [Float!]!
    weight: [Float!]
  }

  enum StatsPeriod {
    DAY
    WEEK
    MONTH
    YEAR
  }

  # Inputs
  input RegisterInput {
    email: String!
    password: String!
    name: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input RequestPasswordResetInput {
    email: String!
  }

  input ResetPasswordInput {
    token: String!
    newPassword: String!
  }

  input UpdatePreferencesInput {
    dailyCalorieGoal: Int
    weightKg: Float
    heightCm: Float
    proteinGoal: Int
    carbsGoal: Int
    fatGoal: Int
    weeklyWorkoutsGoal: Int
    weeklyActiveMinutesGoal: Int
    primaryGoal: String
    coachingTone: CoachingTone
    proactivityLevel: ProactivityLevel
    dietaryRestrictions: [String!]
    activityLevel: ActivityLevel
    notifications: Boolean
    appLocale: AppLocale
  }

  input SetGoalsWithAIInput {
    prompt: String!
  }

  input AnalyzeImageInput {
    image: Upload!
    mealType: MealType!
    additionalContext: String
  }

  input AddFoodItemInput {
    imageUrl: String!
    name: String!
    description: String
    nutrition: NutritionInfoInput!
    mealType: MealType!
  }

  input NutritionInfoInput {
    calories: Float!
    protein: Float!
    carbs: Float!
    fat: Float!
    fiber: Float
    sugar: Float
    sodium: Float
    confidence: Float!
  }

  input SendMessageInput {
    content: String!
    channel: ChatChannel
    context: MessageContextInput
  }

  input LogMealWithAIInput {
    content: String
    imageBase64: String
    imageMimeType: String
    mealType: MealType!
    additionalContext: String
    """Calendar day for this entry (YYYY-MM-DD). Defaults to today; cannot be in the future."""
    loggedDate: String
  }

  input MessageContextInput {
    relatedFoodItems: [ID!]
    statsReference: String
    """IANA timezone from the client (e.g. Europe/Warsaw). Used with statsReference for day bucketing."""
    clientTimeZone: String
    """Device clock when the message was sent (ms since epoch). Used for local-time coaching (meal timing, sleep)."""
    clientNowMs: Float
  }

  input StatsQueryInput {
    period: StatsPeriod!
    startDate: String!
    endDate: String
  }

  input LogWorkoutInput {
    title: String!
    notes: String
    durationMinutes: Int!
    caloriesBurned: Int
    intensity: WorkoutIntensity!
    performedAt: String
  }

  input ImportWorkoutFileInput {
    fileName: String!
    fileContentBase64: String!
    performedAt: String
    title: String
    notes: String
    intensity: WorkoutIntensity
  }

  input UpsertDailyActivityInput {
    date: String!
    steps: Int!
    """Optional: 0–1500 kcal added to today's budget (planned activity). Omit to leave unchanged."""
    activityBonusKcal: Int
  }

  input ConnectGarminStepSyncInput {
    apiToken: String
  }

  input CoachProNutritionPreferencesInput {
    hardExclusions: [String!]!
    softDislikes: [String!]!
    allergies: [String!]!
    favoriteFoods: [String!]!
    stapleFoods: [String!]!
    preferredStyles: [ProMealStyle!]!
    mealsPerDay: Int!
    allowRepeatedBreakfasts: Boolean!
    requireLunchDinnerVariety: Boolean!
    cookingSkill: String!
    cookingEnjoyment: String!
    cookingTimeMinutes: Int!
    wantsMealPrep: Boolean!
    weeklyFoodBudget: Int
    useUpIngredients: [String!]!
  }

  input CoachProTrainingProfileInput {
    trainingTypes: [ProTrainingType!]!
    realisticDaysPerWeek: Int!
    preferredDurationMinutes: Int!
    availableEquipment: [String!]!
    favoriteExercises: [String!]!
    dislikedExercises: [String!]!
    injuriesOrLimitations: [String!]!
    preferredIntensity: String!
    strictOrFlexible: String!
  }

  input CoachProGoalSetupInput {
    primaryGoal: String!
    secondaryGoal: String
    targetDate: String
    priorityFocus: [String!]!
    coachingStyle: ProCoachingStyle!
    aggressiveness: ProPlanAggressiveness!
  }

  input CoachProLifestyleInput {
    workScheduleIntensity: String!
    sleepQuality: String!
    stressLevel: String!
    averageDailyActivity: String!
    weekendsDiffer: Boolean!
    eatsOutOften: Boolean!
    practicalOverIdeal: Boolean!
    extraContext: String
  }

  input GenerateCoachProPlanInput {
    nutrition: CoachProNutritionPreferencesInput!
    training: CoachProTrainingProfileInput!
    goals: CoachProGoalSetupInput!
    lifestyle: CoachProLifestyleInput!
  }

  input AdaptCoachProPlanInput {
    currentPlanJson: String!
    action: ProAdaptiveAction!
    note: String
  }

  input CoachProMealDrawerInput {
    dayLabel: String!
    mealType: String!
    name: String!
    description: String!
    estimatedCalories: Int!
    estimatedProtein: Int!
    estimatedCarbs: Int!
    estimatedFat: Int!
    prepTimeMinutes: Int!
    dayTargetCalories: Int!
    dayTargetProtein: Int!
    dayTargetCarbs: Int!
    dayTargetFat: Int!
  }

  enum CoachProMealSmartAction {
    REPLACE_MEAL
    SHOW_SUBSTITUTIONS
    ADD_INGREDIENTS_TO_SHOPPING_LIST
    REGENERATE_RECIPE
    MAKE_IT_FASTER
    MAKE_IT_CHEAPER
    MAKE_IT_VEGETARIAN
    INCREASE_PROTEIN
  }

  input CoachProSmartMealIngredientInput {
    item: String!
    quantity: String!
  }

  input CoachProMealSmartActionInput {
    action: CoachProMealSmartAction!
    dayLabel: String!
    mealType: String!
    name: String!
    description: String!
    estimatedCalories: Int!
    estimatedProtein: Int!
    estimatedCarbs: Int!
    estimatedFat: Int!
    prepTimeMinutes: Int!
    dayTargetCalories: Int!
    dayTargetProtein: Int!
    dayTargetCarbs: Int!
    dayTargetFat: Int!
    ingredients: [CoachProSmartMealIngredientInput!]
    recipeSteps: [String!]
    substitutions: [String!]
  }

  type CoachProMealSmartActionPayload {
    meal: CoachProMeal!
    updatedPlan: CoachProPlan!
    notice: String
  }

  input CoachProExerciseBlockInput {
    name: String!
    sets: String
    reps: String
    durationMinutes: Int
    notes: String
  }

  input CoachProTrainingDrawerInput {
    dayLabel: String!
    sessionGoal: String!
    workoutType: String!
    durationMinutes: Int!
    intensity: String!
    structure: [CoachProExerciseBlockInput!]!
    fallbackVersion: String!
    minimumViableVersion: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type LogMealWithAIPayload {
    message: ChatMessage!
    foodItem: FoodItem!
  }

  type PasswordResetRequestPayload {
    success: Boolean!
    message: String!
    resetUrl: String
  }

  type SetGoalsWithAIPayload {
    user: User!
    message: String!
  }

  type Query {
    # Auth
    me: User

    # Food
    myFoodItems(limit: Int, offset: Int): [FoodItem!]!
    foodItem(id: ID!): FoodItem
    dailyStats(date: String!, clientTimeZone: String): DailyStats!
    weeklyMealsNutrition(endDate: String): WeeklyMealsNutritionSummary!
    weeklyMealsCoachInsight(endDate: String): WeeklyMealsCoachInsight!
    
    # Stats
    getStats(input: StatsQueryInput!): StatsResponse!
    
    # Chat
    myChatHistory(channel: ChatChannel, limit: Int, offset: Int): [ChatMessage!]!
    
    # Recommendations
    myRecommendations(unreadOnly: Boolean): [AIRecommendation!]!

    # Workouts
    myWorkouts(date: String, limit: Int, offset: Int, clientTimeZone: String): [Workout!]!
    dailyActivity(date: String!): DailyActivity!
    workoutCoachSummary(date: String!, clientTimeZone: String): WorkoutCoachSummary!
    dashboardInsight(date: String!, clientTimeZone: String): DashboardInsight!
    rollingSevenDayAverageSteps(endDate: String, clientTimeZone: String): Int!
    weeklyEvoReview(endDate: String): WeeklyEvoReview!
    weeklyWorkoutsTraining(endDate: String): WeeklyWorkoutsTrainingSummary!
    weeklyWorkoutsCoachInsight(endDate: String): WeeklyWorkoutsCoachInsight!
    stepSyncStatus(provider: StepSyncProvider!): StepSyncStatus!
    generateEvoCoachProPlan(input: GenerateCoachProPlanInput!): CoachProPlan!
    myEvoCoachProPlan: CoachProPlan
    coachProMealDrawerDetails(input: CoachProMealDrawerInput!): CoachProMeal!
    coachProTrainingDrawerDetails(input: CoachProTrainingDrawerInput!): CoachProTrainingDrawerDetails!
  }

  type Mutation {
    # Auth
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    requestPasswordReset(input: RequestPasswordResetInput!): PasswordResetRequestPayload!
    resetPassword(input: ResetPasswordInput!): AuthPayload!
    
    # User
    updatePreferences(input: UpdatePreferencesInput!): User!
    setGoalsWithAI(input: SetGoalsWithAIInput!): SetGoalsWithAIPayload!
    
    # Food
    analyzeImage(input: AnalyzeImageInput!): AnalyzeImageResponse!
    addFoodItem(input: AddFoodItemInput!): FoodItem!
    deleteFoodItem(id: ID!): Boolean!
    
    # Chat
    sendMessage(input: SendMessageInput!): ChatMessage!
    logMealWithAI(input: LogMealWithAIInput!): LogMealWithAIPayload!
    
    # Recommendations
    markRecommendationAsRead(id: ID!): AIRecommendation!

    # Workouts
    logWorkout(input: LogWorkoutInput!): Workout!
    importWorkoutFile(input: ImportWorkoutFileInput!): Workout!
    upsertDailyActivity(input: UpsertDailyActivityInput!): DailyActivity!
    deleteWorkout(id: ID!): Boolean!
    connectGarminStepSync(input: ConnectGarminStepSyncInput): StepSyncStatus!
    disconnectStepSync(provider: StepSyncProvider!): Boolean!
    syncGarminSteps(date: String!): StepSyncResult!
    adaptEvoCoachProPlan(input: AdaptCoachProPlanInput!): CoachProPlan!
    refreshEvoCoachProPlanByTodaySignals(date: String!): CoachProPlan!
    applyCoachProMealSmartAction(input: CoachProMealSmartActionInput!): CoachProMealSmartActionPayload!
  }

  type Subscription {
    # Real-time updates
    newFoodItem(userId: ID!): FoodItem!
    newChatMessage(userId: ID!, channel: ChatChannel): ChatMessage!
    newRecommendation(userId: ID!): AIRecommendation!
    statsUpdated(userId: ID!): DailyStats!
    newWorkout(userId: ID!): Workout!
  }
`;
