/** Stored lowercase on `User.preferences.coachingTone`; GraphQL uses SCREAMING_SNAKE. */
export type CoachingToneKey = 'gentle' | 'supportive' | 'direct' | 'strict';

const ORDER: CoachingToneKey[] = ['gentle', 'supportive', 'direct', 'strict'];

export function normalizeCoachingToneKey(raw?: string | null): CoachingToneKey {
  const v = String(raw ?? 'supportive')
    .trim()
    .toLowerCase();
  if (ORDER.includes(v as CoachingToneKey)) return v as CoachingToneKey;
  return 'supportive';
}

/** One line for user-context blocks (English; model output language is set elsewhere). */
export const coachingToneModelHint: Record<CoachingToneKey, string> = {
  gentle:
    'Buddy-energy: warm, playful, Polish “ty”; mandatory emoji density in JSON (≥1 per sentence in narrative fields); never guilt; smallest optional next step.',
  supportive:
    'Teammate-energy: calm partnership, brief empathy then action; 1–2 emoji max per whole reply — never GENTLE-level emoji; no drill-sergeant tone.',
  direct:
    'Efficiency: flat affect, no emoji, short sentences, facts-first; polite bluntness — peer-level, not commanding.',
  strict:
    'Authority: imperatives, accountability, zero emoji, zero sentiment; high standards without insulting the person.',
};
