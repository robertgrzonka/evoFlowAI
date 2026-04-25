export type InferredPrimaryGoalTone =
  | 'fat_loss'
  | 'light_deficit'
  | 'muscle_gain'
  | 'strength'
  | 'maintenance';

/**
 * Maps stored primaryGoal (preset slug or free text) to a tone for calorie deltas and coach prompts.
 * Free text is interpreted with light PL/EN heuristics; ambiguous "utrzymanie + deficyt" → maintenance.
 */
export function inferCalorieGoalTone(primaryGoal: string | null | undefined): InferredPrimaryGoalTone {
  const raw = String(primaryGoal ?? '').trim();
  if (!raw) return 'maintenance';

  const slug = raw.toLowerCase().replace(/\s+/g, '_');
  if (
    slug === 'fat_loss' ||
    slug === 'light_deficit' ||
    slug === 'maintenance' ||
    slug === 'muscle_gain' ||
    slug === 'strength'
  ) {
    return slug as InferredPrimaryGoalTone;
  }

  const n = raw.toLowerCase();
  const hasMaintain =
    /\butrzym|\bmaintenance\b|\butrzymać\b/.test(n) || n.includes('utrzymanie');
  const hasDeficit =
    /\bdeficyt\b|\bredukcj|\bodchudz|\bschud|\bcut\b|\bfat[\s-]*loss\b|\bweight[\s-]*loss\b/.test(n);
  const hasSurplus =
    /\bnadwyżk|\bsurplus\b|\bbulk\b|\bmasa\b|\bmuscle[\s-]*gain\b|\bprzyrost\b/.test(n);
  const hasStrength = /\bsił(a|ę)\b|\bstrength\b|\bciężar(y)?\b/.test(n);

  if (hasStrength && !hasSurplus && !hasDeficit) return 'strength';
  if (hasSurplus) return 'muscle_gain';
  /** Recomposition / “maintain weight with a small cut” — between maintenance and fat_loss. */
  if (hasMaintain && hasDeficit) return 'light_deficit';
  if (hasDeficit) return 'fat_loss';
  return 'maintenance';
}

export function calorieDeltaForInferredTone(tone: InferredPrimaryGoalTone): number {
  if (tone === 'fat_loss') return -300;
  if (tone === 'light_deficit') return -150;
  if (tone === 'muscle_gain') return 300;
  if (tone === 'strength') return 150;
  return 0;
}

/** Uppercase preset-style mode used by coach quick prompts (FAT_LOSS, …). */
export function coachPromptModeFromPrimaryGoal(primaryGoal: string | null | undefined): string {
  const tone = inferCalorieGoalTone(primaryGoal);
  const map: Record<InferredPrimaryGoalTone, string> = {
    fat_loss: 'FAT_LOSS',
    light_deficit: 'FAT_LOSS',
    muscle_gain: 'MUSCLE_GAIN',
    strength: 'STRENGTH',
    maintenance: 'MAINTENANCE',
  };
  return map[tone];
}
