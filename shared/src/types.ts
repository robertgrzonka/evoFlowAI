// Shared types for evoFlowAI application

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  preferences: UserPreferences;
  aiAccess?: UserAIAccess;
}

export type AIAccessTier = 'free' | 'platform_premium' | 'byok';

export interface UserAIAccess {
  tier: AIAccessTier;
  preferredModel?: string | null;
  openaiKeyEncrypted?: string | null;
  openaiKeyLast4?: string | null;
  openaiKeyUpdatedAt?: Date | null;
  monthlyRequestLimit?: number | null;
  monthlyRequestCount?: number;
  usagePeriodStart?: Date | null;
}

export interface UserPreferences {
  dailyCalorieGoal: number;
  weightKg?: number | null;
  heightCm?: number | null;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  weeklyWorkoutsGoal: number;
  weeklyActiveMinutesGoal: number;
  /** Preset slugs (fat_loss, …) or free-text goal for Evo / UI. */
  primaryGoal: string;
  coachingTone: 'gentle' | 'supportive' | 'direct' | 'strict';
  proactivityLevel: 'low' | 'medium' | 'high';
  dietaryRestrictions: string[];
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  notifications: boolean;
  /** App UI + Evo insight language (beta). */
  appLocale?: 'en' | 'pl';
}

export interface FoodItem {
  id: string;
  userId: string;
  imageUrl: string;
  name: string;
  description?: string;
  nutrition: NutritionInfo;
  createdAt: Date;
  mealType: MealType;
}

export interface NutritionInfo {
  calories: number;
  protein: number; // gramy
  carbs: number; // gramy
  fat: number; // gramy
  fiber?: number; // gramy
  sugar?: number; // gramy
  sodium?: number; // mg
  confidence: number; // 0-1, pewność analizy AI
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface DailyStats {
  date: string; // YYYY-MM-DD
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  meals: FoodItem[];
  goalProgress: {
    calories: number; // procent celu dziennego
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface ChatMessage {
  id: string;
  userId: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  context?: {
    relatedFoodItems?: string[]; // ID posiłków
    statsReference?: string; // data statystyk
  };
}

export interface AIRecommendation {
  id: string;
  userId: string;
  type: 'meal_suggestion' | 'nutrition_tip' | 'goal_adjustment' | 'warning';
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  isRead: boolean;
}

export interface AnalyzeImageRequest {
  imageBase64: string;
  mealType: MealType;
  additionalContext?: string;
}

export interface AnalyzeImageResponse {
  nutrition: NutritionInfo;
  foodName: string;
  description: string;
  suggestions: string[];
}

export interface StatsQuery {
  userId: string;
  period: 'day' | 'week' | 'month' | 'year';
  startDate: string;
  endDate?: string;
}

export interface StatsResponse {
  period: string;
  averageCalories: number;
  averageProtein: number;
  averageCarbs: number;
  averageFat: number;
  totalMeals: number;
  goalAchievementRate: number; // procent dni z osiągniętym celem
  trends: {
    calories: number[]; // wartości dla każdego dnia/tygodnia/miesiąca
    weight?: number[]; // jeśli użytkownik śledzi wagę
  };
}

// Kolory aplikacji
export const AppColors = {
  primary: '#1a1a1a', // czerń
  secondary: '#ffffff', // biel
  accent: '#8B4B6B', // ciemny róż
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  }
} as const;
