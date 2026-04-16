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
    proteinGoal: Int!
    carbsGoal: Int!
    fatGoal: Int!
    weeklyWorkoutsGoal: Int!
    weeklyActiveMinutesGoal: Int!
    primaryGoal: PrimaryGoal!
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
    meals: [FoodItem!]!
    goalProgress: GoalProgress!
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
    timestamp: Date!
    context: MessageContext
  }

  enum MessageRole {
    USER
    ASSISTANT
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
    netCalories: Float!
    remainingCalories: Float!
    remainingProtein: Float!
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
    proteinGoal: Int
    carbsGoal: Int
    fatGoal: Int
    weeklyWorkoutsGoal: Int
    weeklyActiveMinutesGoal: Int
    primaryGoal: PrimaryGoal
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
    myChatHistory(limit: Int, offset: Int): [ChatMessage!]!
    
    # Recommendations
    myRecommendations(unreadOnly: Boolean): [AIRecommendation!]!

    # Workouts
    myWorkouts(date: String, limit: Int, offset: Int): [Workout!]!
    workoutCoachSummary(date: String!): WorkoutCoachSummary!
    dashboardInsight(date: String!): DashboardInsight!
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
    deleteWorkout(id: ID!): Boolean!
  }

  type Subscription {
    # Real-time updates
    newFoodItem(userId: ID!): FoodItem!
    newChatMessage(userId: ID!): ChatMessage!
    newRecommendation(userId: ID!): AIRecommendation!
    statsUpdated(userId: ID!): DailyStats!
    newWorkout(userId: ID!): Workout!
  }
`;
