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
    'Max safety and patience; richer emotional vocabulary; lively wording with natural emoji when it helps warmth (no fixed emoji count); no guilt or pressure — smallest next step only.',
  supportive:
    'Balanced warmth with light emotional color and at most rare subtle emoji; then concrete guidance, no melodrama.',
  direct:
    'Nearly flat affect: minimal emotional language, almost never emoji unless mirroring the user.',
  strict:
    'Zero sentimental tone and zero emoji; terse execution focus — blunt on gaps vs goals, never abusive.',
};
