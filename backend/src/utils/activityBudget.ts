import { calorieDeltaForInferredTone, inferCalorieGoalTone } from '@evoflowai/shared';
import { calculateMacroGoals } from './nutritionGoals';

export const estimateCaloriesFromSteps = (steps: number): number => {
  const normalized = Number.isFinite(steps) ? Math.max(0, Math.round(steps)) : 0;
  return normalized * 0.04;
};

export const getCalorieDeltaByPrimaryGoal = (primaryGoal: string | undefined | null): number => {
  return calorieDeltaForInferredTone(inferCalorieGoalTone(primaryGoal));
};

export const buildDynamicTargets = (input: {
  baseCalories: number;
  activityLevel: string | undefined | null;
  primaryGoal: string | undefined | null;
  workoutCalories: number;
  stepCalories: number;
  /** User-entered planned extra allowance (same day); capped to avoid absurd budgets. */
  manualActivityBonusKcal?: number;
  manualProtein?: number;
  manualCarbs?: number;
  manualFat?: number;
}) => {
  const base = Number.isFinite(input.baseCalories) ? Math.max(800, Math.round(input.baseCalories)) : 2000;
  const delta = getCalorieDeltaByPrimaryGoal(input.primaryGoal);
  const bonusRaw = Number(input.manualActivityBonusKcal ?? 0);
  const manualBonus = Number.isFinite(bonusRaw) ? Math.max(0, Math.min(1500, Math.round(bonusRaw))) : 0;
  const activityCalories =
    Math.max(0, input.workoutCalories) + Math.max(0, input.stepCalories) + manualBonus;
  const calorieBudget = Math.max(800, Math.round(base + delta + activityCalories));

  const fallbackBaseMacros = calculateMacroGoals(base, input.activityLevel);
  // Macro targets stay stable (settings/body-composition driven), not activity-scaled.
  const proteinGoal = Math.max(1, Math.round(input.manualProtein ?? fallbackBaseMacros.proteinGoal));
  const carbsGoal = Math.max(1, Math.round(input.manualCarbs ?? fallbackBaseMacros.carbsGoal));
  const fatGoal = Math.max(1, Math.round(input.manualFat ?? fallbackBaseMacros.fatGoal));

  return {
    calorieBudget,
    proteinGoal,
    carbsGoal,
    fatGoal,
    baseCalories: base,
    goalDelta: delta,
    manualActivityBonusKcal: manualBonus,
  };
};
