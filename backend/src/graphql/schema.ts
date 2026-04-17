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
    primaryGoal: PrimaryGoal!
    coachingTone: CoachingTone!
    proactivityLevel: ProactivityLevel!
    dietaryRestrictions: [String!]!
    activityLevel: ActivityLevel!
    notifications: Boolean!
  }

  enum ActivityLevel {
    SEDENTARY
    LIGHT
    MODERATE
    ACTIVE
    VERY_ACTIVE
  }

  enum PrimaryGoal {
    FAT_LOSS
    MAINTENANCE
    MUSCLE_GAIN
    STRENGTH
  }

  enum CoachingTone {
    SUPPORTIVE
    DIRECT
  }

  enum ProactivityLevel {
    LOW
    MEDIUM
    HIGH
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

  type DashboardInsight {
    date: String!
    summary: String!
    tips: [String!]!
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
  }

  type WeeklyEvoReview {
    startDate: String!
    endDate: String!
    trackedDays: Int!
    availableDays: Int!
    isCompleteWeek: Boolean!
    summary: String!
    highlights: [String!]!
    nutritionScore: Int!
    trainingScore: Int!
    consistencyScore: Int!
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
    primaryGoal: PrimaryGoal
    coachingTone: CoachingTone
    proactivityLevel: ProactivityLevel
    dietaryRestrictions: [String!]
    activityLevel: ActivityLevel
    notifications: Boolean
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
  }

  input MessageContextInput {
    relatedFoodItems: [ID!]
    statsReference: String
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
    dailyStats(date: String!): DailyStats!
    
    # Stats
    getStats(input: StatsQueryInput!): StatsResponse!
    
    # Chat
    myChatHistory(channel: ChatChannel, limit: Int, offset: Int): [ChatMessage!]!
    
    # Recommendations
    myRecommendations(unreadOnly: Boolean): [AIRecommendation!]!

    # Workouts
    myWorkouts(date: String, limit: Int, offset: Int): [Workout!]!
    dailyActivity(date: String!): DailyActivity!
    workoutCoachSummary(date: String!): WorkoutCoachSummary!
    dashboardInsight(date: String!): DashboardInsight!
    weeklyEvoReview(endDate: String): WeeklyEvoReview!
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
