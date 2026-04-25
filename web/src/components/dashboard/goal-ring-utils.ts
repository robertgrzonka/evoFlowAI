export type GoalRingKind = 'calories' | 'protein' | 'carbs' | 'fat';

export type GoalRingStatus = 'on_track' | 'low' | 'high' | 'done';

export function computeGoalRingStatus(consumed: number, target: number, kind: GoalRingKind): GoalRingStatus {
  if (!Number.isFinite(consumed) || !Number.isFinite(target) || target <= 0) {
    return 'on_track';
  }
  const ratio = consumed / target;
  if (kind === 'protein') {
    if (ratio >= 0.97) return 'done';
    if (ratio > 1.15) return 'high';
    if (ratio < 0.72) return 'low';
    return 'on_track';
  }
  if (ratio >= 0.95 && ratio <= 1.02) return 'done';
  if (ratio > 1.06) return 'high';
  if (ratio < 0.72) return 'low';
  return 'on_track';
}

/** Ring fill 0–100 for display (caps over-target visually at 100). */
export function goalRingPercent(consumed: number, target: number): number {
  if (!Number.isFinite(target) || target <= 0) return 0;
  return Math.max(0, Math.min(100, (consumed / target) * 100));
}
