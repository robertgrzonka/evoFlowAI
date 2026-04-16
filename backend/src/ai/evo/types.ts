export type EvoTone = 'supportive' | 'direct';

export type EvoResponseMode =
  | 'coach'
  | 'analysis'
  | 'check_in'
  | 'motivation'
  | 'education'
  | 'warning'
  | 'insight'
  | 'onboarding'
  | 'microcopy'
  | 'notification';

export type EvoPrimaryGoal = 'fat_loss' | 'maintenance' | 'muscle_gain' | 'strength';

export type EvoProactivity = 'low' | 'medium' | 'high';

export type EvoChatMessageRole = 'user' | 'assistant' | 'system';

export type EvoChatMessage = {
  role: EvoChatMessageRole;
  content: string;
};

export type EvoTodayStats = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type EvoTodayWorkouts = {
  sessions: number;
  minutes: number;
  caloriesBurned: number;
};

export type EvoTodayActivity = {
  steps: number;
  stepsCalories: number;
  calorieBudget: number;
};

export type EvoUserContext = {
  primaryGoal?: string;
  coachingTone?: string;
  proactivityLevel?: string;
  dailyCalorieGoal?: number;
  proteinGoal?: number;
  carbsGoal?: number;
  fatGoal?: number;
  weeklyWorkoutsGoal?: number;
  weeklyActiveMinutesGoal?: number;
  activityLevel?: string;
  dietaryRestrictions?: string[];
  todayStats?: EvoTodayStats;
  todayWorkouts?: EvoTodayWorkouts;
  todayActivity?: EvoTodayActivity;
};

export type EvoPromptComposeInput = {
  mode: EvoResponseMode;
  tone: EvoTone;
  proactivity: EvoProactivity;
  userContext?: EvoUserContext;
  includeHumor?: boolean;
  latestUserMessage?: string;
  channel?: 'chat' | 'insight' | 'summary' | 'empty_state' | 'onboarding' | 'notification';
};
