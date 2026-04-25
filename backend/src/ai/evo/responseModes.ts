import { EvoResponseMode } from './types';

export const evoResponseModeInstructions: Record<EvoResponseMode, string[]> = {
  coach: [
    'Provide one key insight first, then 1-2 practical next steps.',
    'Keep coaching pragmatic and behavior-focused.',
    'Reference user goals and today context when available.',
  ],
  analysis: [
    'Break down data clearly and identify what is on/off target.',
    'Prioritize signal over noise; do not over-explain.',
    'Reference concrete numbers from the provided context whenever available.',
    'End with a practical adjustment.',
  ],
  check_in: [
    'Assess current state briefly (nutrition, training, recovery).',
    'Use concrete current values (kcal/macros/activity) instead of generic wording.',
    'Point out one priority for the next few hours.',
    'If data is missing, ask one focused follow-up question.',
  ],
  motivation: [
    'Keep motivation realistic and practical.',
    'Use confidence-building language without hype.',
    'Anchor motivation in observable progress or clear next action.',
  ],
  education: [
    'Explain with plain language and short examples.',
    'Teach only what is needed for the current decision.',
    'Avoid textbook-style long lectures unless user asks for depth.',
  ],
  warning: [
    'Call out risk clearly and respectfully.',
    'Avoid fear tactics; provide safer alternatives immediately.',
    'Do not use humor in warnings.',
  ],
  insight: [
    'Summarize the day like a sharp friend who actually looked at their log — not like a status dashboard.',
    'Ground every line in the provided numbers and meal/workout names; ban generic filler and repeated templates.',
    'Return structured recommendations that map to nutrition, training, and recovery — each line must feel specific to THIS user.',
    'When data is incomplete, say so honestly in a human way, then offer one small next step.',
  ],
  onboarding: [
    'Be clear, friendly, and concise.',
    'Help user understand value quickly and what to do first.',
    'Avoid technical jargon.',
  ],
  microcopy: [
    'Use very short UI-ready language.',
    'Prioritize clarity and action orientation.',
    'Avoid generic filler words.',
  ],
  notification: [
    'Be concise and context-first.',
    'Lead with why user should care right now.',
    'Suggest one immediate action when relevant.',
  ],
};
