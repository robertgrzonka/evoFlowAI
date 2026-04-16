import { evoCoreIdentity, evoHumorPolicy, evoNonNegotiables } from './coreIdentity';
import { buildProactivityInstruction, evoGuardrails, shouldDisableHumor } from './guardrails';
import { evoResponseModeInstructions } from './responseModes';
import { evoToneModifiers } from './toneModifiers';
import {
  EvoChatMessage,
  EvoPromptComposeInput,
  EvoProactivity,
  EvoResponseMode,
  EvoTone,
  EvoUserContext,
} from './types';

const normalizeTone = (value: string | undefined): EvoTone =>
  String(value || 'supportive').toLowerCase() === 'direct' ? 'direct' : 'supportive';

const normalizeProactivity = (value: string | undefined): EvoProactivity => {
  const normalized = String(value || 'medium').toLowerCase();
  if (normalized === 'low' || normalized === 'high') {
    return normalized;
  }

  return 'medium';
};

const formatUserContext = (userContext?: EvoUserContext): string => {
  if (!userContext) {
    return 'User context: unavailable.';
  }

  const sections = [
    `User name: ${userContext.userName || 'unknown'}`,
    `Body metrics: weight ${userContext.weightKg ?? 'n/a'} kg, height ${userContext.heightCm ?? 'n/a'} cm`,
    `Primary goal: ${userContext.primaryGoal || 'maintenance'}`,
    `Coaching tone preference: ${normalizeTone(userContext.coachingTone)}`,
    `Proactivity preference: ${normalizeProactivity(userContext.proactivityLevel)}`,
    `Daily calorie goal: ${userContext.dailyCalorieGoal ?? 'n/a'}`,
    `Macro goals: protein ${userContext.proteinGoal ?? 'n/a'}g, carbs ${userContext.carbsGoal ?? 'n/a'}g, fat ${userContext.fatGoal ?? 'n/a'}g`,
    `Weekly training goals: ${userContext.weeklyWorkoutsGoal ?? 'n/a'} workouts, ${userContext.weeklyActiveMinutesGoal ?? 'n/a'} active minutes`,
    `Activity level: ${userContext.activityLevel || 'unknown'}`,
    `Dietary restrictions: ${userContext.dietaryRestrictions?.join(', ') || 'none'}`,
  ];

  if (typeof userContext.suggestedProteinGoal === 'number' && Number.isFinite(userContext.suggestedProteinGoal)) {
    sections.push(
      `Body-weight protein suggestion baseline: ${Math.round(userContext.suggestedProteinGoal)} g/day (2.0 g/kg of body weight)`
    );
  }

  if (userContext.todayStats) {
    sections.push(
      `Today intake: ${userContext.todayStats.calories} kcal; protein ${userContext.todayStats.protein}g; carbs ${userContext.todayStats.carbs}g; fat ${userContext.todayStats.fat}g`
    );
  }

  if (userContext.todayWorkouts) {
    sections.push(
      `Today workouts: ${userContext.todayWorkouts.sessions} sessions; ${userContext.todayWorkouts.minutes} min; ${userContext.todayWorkouts.caloriesBurned} kcal burned`
    );
  }

  if (userContext.todayActivity) {
    sections.push(
      `Today steps/activity: ${userContext.todayActivity.steps} steps tracked; dynamic daily calorie budget ${Math.round(userContext.todayActivity.calorieBudget)} kcal`
    );
  }

  return sections.join('\n');
};

const detectTurnLanguage = (latestUserMessage?: string): 'Polish' | 'English' => {
  const text = String(latestUserMessage || '').trim().toLowerCase();
  if (!text) {
    return 'English';
  }

  if (/[ąćęłńóśźż]/i.test(text)) {
    return 'Polish';
  }

  const polishSignals = [
    'chce',
    'chcę',
    'jest',
    'dzis',
    'dzisiaj',
    'trening',
    'posilek',
    'posiłek',
    'kalorie',
    'białko',
    'kroki',
    'nie',
    'tak',
    'moze',
    'może',
  ];
  const englishSignals = [
    'today',
    'calories',
    'protein',
    'workout',
    'meal',
    'please',
    'help',
    'what',
    'how',
  ];

  const polishScore = polishSignals.reduce((acc, token) => (text.includes(token) ? acc + 1 : acc), 0);
  const englishScore = englishSignals.reduce((acc, token) => (text.includes(token) ? acc + 1 : acc), 0);
  return polishScore >= englishScore ? 'Polish' : 'English';
};

export const composeEvoSystemPrompt = (input: EvoPromptComposeInput): string => {
  const modeInstructions = evoResponseModeInstructions[input.mode];
  const toneInstructions = evoToneModifiers[input.tone];
  const humorDisabled = shouldDisableHumor(input.mode, input.latestUserMessage);
  const turnLanguage = detectTurnLanguage(input.latestUserMessage);
  const humorInstruction = humorDisabled
    ? 'Humor disabled for this response due to sensitivity/safety context.'
    : input.includeHumor
      ? 'Humor is allowed, but keep it subtle, warm, and sparse.'
      : 'Do not force humor.';
  const conversationBehavior =
    input.channel === 'chat' && input.conversationChannel === 'coach'
      ? [
          'Conversation behavior (coach channel):',
          '- Prioritize today context (calories, macros, workouts, budget).',
          '- Act like an attentive performance companion who knows current numbers.',
          '- End with one concrete next move for the next 2-4 hours.',
        ].join('\n')
      : input.channel === 'chat' && input.conversationChannel === 'general'
        ? [
            'Conversation behavior (general channel):',
            '- Keep it practical and human; wider topics are allowed.',
            '- Still provide useful actions, but do not pretend to know missing health data.',
            '- Keep the same Evo personality and warmth, just less dashboard-heavy.',
          ].join('\n')
        : '';

  return `
You are ${evoCoreIdentity.name}, ${evoCoreIdentity.role}.
Identity: ${evoCoreIdentity.description}
Mission: ${evoCoreIdentity.productMission}
Voice traits: ${evoCoreIdentity.voice.join('; ')}.

Non-negotiable rules:
- ${evoNonNegotiables.join('\n- ')}

Humor and irony policy:
- ${evoHumorPolicy.join('\n- ')}
- ${humorInstruction}

Global response guardrails:
- ${evoGuardrails.antiGeneric.join('\n- ')}
- ${evoGuardrails.brevity.join('\n- ')}
- ${evoGuardrails.repetitionControl.join('\n- ')}
- ${evoGuardrails.structure.join('\n- ')}

Tone modifier (${input.tone}):
- ${toneInstructions.join('\n- ')}

Response mode (${input.mode}):
- ${modeInstructions.join('\n- ')}

Proactivity:
- ${buildProactivityInstruction(input.proactivity)}

Product channel:
- ${input.channel || 'chat'}
${conversationBehavior ? `\n${conversationBehavior}` : ''}

Language policy (mandatory):
- Response language for this turn: ${turnLanguage}.
- Reply only in ${turnLanguage} unless the user explicitly asks for a different language.
- Do not mix English and Polish in one response unless the user explicitly requests bilingual output.

User context:
${formatUserContext(input.userContext)}

Output quality contract:
- Keep response concise unless user asks for deeper detail.
- If data is missing, say it explicitly and ask one focused question.
- Insight first, action second.
- If user behavior is counterproductive, call it out politely and concretely.
- Avoid repeated templates and generic filler.
- Use Markdown formatting for readability.
- Bold key section labels with **double asterisks** when useful (for example: **Key Insight**, **Next Step**).
- Use valid markdown only (no orphan list markers like "1." on a standalone line).
- If using lists, keep marker and content on the same line.
- Numeric fidelity:
  - Use user context numbers as the source of truth.
  - If older chat messages contain different numbers, trust the latest user context snapshot.
  - If both base calorie goal and dynamic daily budget are present, use dynamic daily budget for today's calculations.
  - Do not invent consumed/burned totals not present in context.
  - If you present a projection for a planned meal, clearly label it as a projection.
- Protein guidance:
  - If body-weight protein suggestion baseline is available in user context, use it when suggesting protein intake.
  `.trim();
};

export const detectEvoResponseMode = (
  messages: EvoChatMessage[],
  fallback: EvoResponseMode = 'coach'
): EvoResponseMode => {
  const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user')?.content || '';
  const text = latestUserMessage.toLowerCase();

  if (/(pain|injury|hurt|dizzy|burnout|panic|overwhelmed|anxious)/.test(text)) return 'warning';
  if (/(why|how does|explain|difference|what is|teach)/.test(text)) return 'education';
  if (/(stuck|motivation|cant|can't|hard|struggle|demotivated)/.test(text)) return 'motivation';
  if (/(check[- ]?in|today|status|where am i|summary)/.test(text)) return 'check_in';
  if (/(analyze|analysis|compare|trend|data)/.test(text)) return 'analysis';

  return fallback;
};

export const resolveToneAndProactivity = (
  userContext?: EvoUserContext
): { tone: EvoTone; proactivity: EvoProactivity } => ({
  tone: normalizeTone(userContext?.coachingTone),
  proactivity: normalizeProactivity(userContext?.proactivityLevel),
});
