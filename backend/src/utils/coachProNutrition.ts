/**
 * Minimum daily protein for Coach Pro: higher of stored goal or 2 g/kg body weight when weight is known.
 */
export const resolveCoachProDailyProteinFloor = (
  preferences: { proteinGoal?: number; weightKg?: number } | null | undefined
): number => {
  const stored = Math.round(Number(preferences?.proteinGoal ?? 0));
  const weight = Number(preferences?.weightKg);
  const byWeight = Number.isFinite(weight) && weight > 0 ? Math.round(weight * 2) : 0;
  const floor = Math.max(stored, byWeight);
  return floor > 0 ? floor : 0;
};
