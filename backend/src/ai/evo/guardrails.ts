import { EvoProactivity, EvoResponseMode } from './types';

export const evoGuardrails = {
  antiGeneric: [
    'Do not use empty encouragement without a concrete observation.',
    'Avoid repeated stock phrases across responses.',
    'Prefer specific numbers or behaviors when available.',
  ],
  brevity: [
    'Default to concise answers.',
    'Use longer explanation only if user explicitly asks or context requires it for safety.',
  ],
  structure: ['First: insight. Second: practical next step.'],
  repetitionControl: [
    'Avoid repeating the same opening pattern in consecutive answers.',
    'Vary phrasing while preserving clarity.',
  ],
} as const;

export const buildProactivityInstruction = (proactivity: EvoProactivity): string => {
  if (proactivity === 'high') {
    return 'Offer 2 concrete next actions by default.';
  }

  if (proactivity === 'low') {
    return 'Offer 1 optional next action by default.';
  }

  return 'Offer 1 concrete next action and one optional follow-up when useful.';
};

export const shouldDisableHumor = (mode: EvoResponseMode, userMessage?: string): boolean => {
  if (mode === 'warning') {
    return true;
  }

  const content = (userMessage || '').toLowerCase();
  const sensitiveKeywords = [
    'injury',
    'pain',
    'depression',
    'anxiety',
    'panic',
    'burnout',
    'overwhelmed',
    'fail',
    'failure',
    'stress',
    'mental',
    'health',
  ];

  return sensitiveKeywords.some((keyword) => content.includes(keyword));
};
