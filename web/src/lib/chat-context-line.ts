import type { UiLocale } from '@/lib/i18n/ui-locale';

type Copy = {
  contextSparse: string;
  contextRich: (p: {
    meals: number;
    workouts: number;
    kcalLeft: number;
    proteinLeft: number;
    kcalGoal: number;
    proteinGoal: number;
  }) => string;
};

export function buildEvoChatContextLine(
  locale: UiLocale,
  input: {
    mealCount: number;
    workoutCount: number;
    remainingCalories: number;
    remainingProtein: number;
    calorieGoal: number;
    proteinGoal: number;
  },
  copy: Copy
): string {
  const m = input.mealCount;
  const w = input.workoutCount;
  if (m === 0 && w === 0) {
    return copy.contextSparse;
  }
  return copy.contextRich({
    meals: m,
    workouts: w,
    kcalLeft: Math.round(input.remainingCalories),
    proteinLeft: Math.round(input.remainingProtein),
    kcalGoal: Math.round(input.calorieGoal),
    proteinGoal: Math.round(input.proteinGoal),
  });
}
