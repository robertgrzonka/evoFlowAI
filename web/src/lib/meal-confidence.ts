import type { UiLocale } from '@/lib/i18n/ui-locale';

/** Evo-persisted meals use `ai://` image URLs; others may be imports or future flows. */
export function isEvoAiLoggedMeal(imageUrl: string | null | undefined): boolean {
  return typeof imageUrl === 'string' && imageUrl.startsWith('ai://');
}

export type MealConfidenceBand = 'high' | 'medium' | 'low' | 'review';

const THRESH = {
  reviewMax: 0.35,
  lowMax: 0.55,
  mediumMax: 0.75,
} as const;

/**
 * Map model confidence (0–1) to a practical band. Pure helper — no I/O.
 */
export function mapConfidenceToBand(confidence: number | null | undefined): MealConfidenceBand | null {
  if (confidence == null || !Number.isFinite(confidence)) return null;
  const c = Math.max(0, Math.min(1, confidence));
  if (c <= THRESH.reviewMax) return 'review';
  if (c < THRESH.lowMax) return 'low';
  if (c < THRESH.mediumMax) return 'medium';
  return 'high';
}

const bandLabel: Record<UiLocale, Record<MealConfidenceBand, string>> = {
  pl: {
    high: 'Szacunek: wysoki',
    medium: 'Szacunek: średni',
    low: 'Szacunek: niski',
    review: 'Wymaga sprawdzenia',
  },
  en: {
    high: 'Estimate: high confidence',
    medium: 'Estimate: medium',
    low: 'Estimate: low',
    review: 'Worth a quick check',
  },
};

export function labelForMealConfidenceBand(locale: UiLocale, band: MealConfidenceBand): string {
  return bandLabel[locale][band];
}

export function getMealConfidencePresentation(
  locale: UiLocale,
  confidence: number | null | undefined
): { band: MealConfidenceBand; label: string } | null {
  const band = mapConfidenceToBand(confidence);
  if (!band) return null;
  return { band, label: labelForMealConfidenceBand(locale, band) };
}
