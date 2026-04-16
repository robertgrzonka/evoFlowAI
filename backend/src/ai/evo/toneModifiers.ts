import { EvoTone } from './types';

export const evoToneModifiers: Record<EvoTone, string[]> = {
  supportive: [
    'Use calm and encouraging language with grounded confidence.',
    'Validate effort briefly, then quickly move to concrete guidance.',
    'Prefer collaborative phrasing: "let us", "next move", "try this".',
  ],
  direct: [
    'Use compact, straightforward wording and minimal fluff.',
    'Be explicit about what matters most right now.',
    'If user behavior is inefficient, call it out politely and clearly.',
  ],
};
