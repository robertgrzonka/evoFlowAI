import { calculateMacroGoals } from './nutritionGoals';

export const estimateCaloriesFromSteps = (steps: number): number => {
  const normalized = Number.isFinite(steps) ? Math.max(0, Math.round(steps)) : 0;
  return normalized * 0.04;
};

export const getCalorieDeltaByPrimaryGoal = (primaryGoal: string | undefined | null): number => {
  const normalized = String(primaryGoal || 'maintenance').toLowerCase();
  if (normalized === 'fat_loss') return -300;
  if (normalized === 'muscle_gain') return 300;
  if (normalized === 'strength') return 150;
  return 0;
};

export const buildDynamicTargets = (input: {
  baseCalories: number;
  activityLevel: string | undefined | null;
  primaryGoal: string | undefined | null;
  workoutCalories: number;
  stepCalories: number;
  manualProtein?: number;
  manualCarbs?: number;
  manualFat?: number;
}) => {
  const base = Number.isFinite(input.baseCalories) ? Math.max(800, Math.round(input.baseCalories)) : 2000;
  const delta = getCalorieDeltaByPrimaryGoal(input.primaryGoal);
  const activityCalories = Math.max(0, input.workoutCalories) + Math.max(0, input.stepCalories);
  const calorieBudget = Math.max(800, Math.round(base + delta + activityCalories));

  const fallbackBaseMacros = calculateMacroGoals(base, input.activityLevel);
  const ratioProtein =
    base > 0 ? ((input.manualProtein ?? fallbackBaseMacros.proteinGoal) * 4) / base : 0.3;
  const ratioCarbs =
    base > 0 ? ((input.manualCarbs ?? fallbackBaseMacros.carbsGoal) * 4) / base : 0.4;
  const ratioFat =
    base > 0 ? ((input.manualFat ?? fallbackBaseMacros.fatGoal) * 9) / base : 0.3;

  const ratioSum = Math.max(0.0001, ratioProtein + ratioCarbs + ratioFat);
  const normalizedProteinRatio = ratioProtein / ratioSum;
  const normalizedCarbsRatio = ratioCarbs / ratioSum;
  const normalizedFatRatio = ratioFat / ratioSum;

  const proteinGoal = Math.round((calorieBudget * normalizedProteinRatio) / 4);
  const carbsGoal = Math.round((calorieBudget * normalizedCarbsRatio) / 4);
  const fatGoal = Math.round((calorieBudget * normalizedFatRatio) / 9);

  return {
    calorieBudget,
    proteinGoal,
    carbsGoal,
    fatGoal,
    baseCalories: base,
    goalDelta: delta,
  };
};
