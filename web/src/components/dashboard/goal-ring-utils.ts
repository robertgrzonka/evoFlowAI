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

/** True progress vs goal as percent (can exceed 100, e.g. 120). */
export function goalRingActualPercent(consumed: number, target: number): number {
  if (!Number.isFinite(consumed) || !Number.isFinite(target) || target <= 0) return 0;
  return Math.max(0, (consumed / target) * 100);
}

/** 0–1 of the first lap for the primary ring arc (hits full circle at goal). */
export function goalRingPrimaryArcRatio(consumed: number, target: number): number {
  if (!Number.isFinite(consumed) || !Number.isFinite(target) || target <= 0) return 0;
  return Math.min(Math.max(consumed / target, 0), 1);
}

/** 0–1 of a second lap for overflow past 100% (for optional double-ring draw). */
export function goalRingOverflowArcRatio(consumed: number, target: number): number {
  if (!Number.isFinite(consumed) || !Number.isFinite(target) || target <= 0) return 0;
  const r = consumed / target;
  if (r <= 1) return 0;
  return Math.min(r - 1, 1);
}
