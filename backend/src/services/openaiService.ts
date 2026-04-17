import OpenAI from 'openai';
import { AnalyzeImageResponse, MealType } from '@evoflowai/shared';
import {
  composeEvoSystemPrompt,
  detectEvoResponseMode,
  EvoChatMessage,
  EvoUserContext,
  resolveToneAndProactivity,
} from '../ai/evo';

type FoodAnalysisJson = {
  foodName: string;
  description: string;
  confidence: number;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  suggestions?: string[];
};

type GoalSuggestionJson = {
  dailyCalorieGoal: number;
  activityLevel: string;
  message: string;
};

type DashboardInsightJson = {
  summary: string;
  tips: unknown[];
};

type CoachProPlanJson = {
  overview: {
    calorieTargetRange: string;
    trainingFrequency: string;
    planDifficulty: string;
    expectedPace: string;
    flexibilityLevel: string;
  };
  weeklyNutrition: unknown[];
  weeklyTraining: unknown[];
  rationale: string[];
  smartWarnings: string[];
  shoppingList: {
    proteins: string[];
    carbs: string[];
    fats: string[];
    vegetables: string[];
    dairy: string[];
    extras: string[];
    optionalItems: string[];
  };
  substitutions: {
    ingredientSubstitutions: string[];
    mealSwaps: string[];
    exerciseSubstitutions: string[];
    lowEnergyAlternatives: string[];
    shortOnTimeAlternatives: string[];
  };
  coachNotes: string[];
  hardestPartThisWeek: string;
  focusForBestResults: string;
  executionTips: string[];
  mealPrepTips: string[];
  recoveryNote: string;
  bestCasePlan: string;
  realisticPlan: string;
};

type CoachProPlanDetailsJson = {
  weeklyNutrition: Array<{
    dayLabel: string;
    meals: Array<{
      mealType: string;
      name: string;
      fiberGrams?: number;
      estimatedSatiety?: string;
      suggestedUse?: string;
      tags: string[];
      ingredients: Array<{ item: string; quantity: string }>;
      recipeSteps: string[];
      substitutions: string[];
      mealPrepNote?: string;
      rationale?: string;
    }>;
  }>;
  rationale: string[];
  smartWarnings: string[];
  shoppingList: {
    proteins: string[];
    carbs: string[];
    fats: string[];
    vegetables: string[];
    dairy: string[];
    extras: string[];
    optionalItems: string[];
  };
  substitutions: {
    ingredientSubstitutions: string[];
    mealSwaps: string[];
    exerciseSubstitutions: string[];
    lowEnergyAlternatives: string[];
    shortOnTimeAlternatives: string[];
  };
  mealPrepTips: string[];
  recoveryNote: string;
  bestCasePlan: string;
  realisticPlan: string;
};

type CoachProMealDrawerJson = {
  mealType: string;
  name: string;
  description: string;
  estimatedCalories: number;
  estimatedProtein: number;
  estimatedCarbs: number;
  estimatedFat: number;
  fiberGrams?: number;
  estimatedSatiety?: string;
  suggestedUse?: string;
  prepTimeMinutes: number;
  tags: string[];
  ingredients: Array<{ item: string; quantity: string }>;
  recipeSteps: string[];
  substitutions: string[];
  mealPrepNote?: string;
  rationale?: string;
};

type CoachProTrainingDrawerJson = {
  session: {
    dayLabel: string;
    sessionGoal: string;
    workoutType: string;
    durationMinutes: number;
    intensity: string;
    structure: Array<{
      name: string;
      sets?: string;
      reps?: string;
      durationMinutes?: number;
      notes?: string;
    }>;
    fallbackVersion: string;
    minimumViableVersion: string;
  };
  whyThisSession: string;
  painSubstitution: string;
};

const COACH_PRO_PLAN_JSON_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: [
    'overview',
    'weeklyNutrition',
    'weeklyTraining',
    'coachNotes',
    'hardestPartThisWeek',
    'focusForBestResults',
    'executionTips',
    'bestCasePlan',
    'realisticPlan',
  ],
  properties: {
    overview: {
      type: 'object',
      additionalProperties: false,
      required: ['calorieTargetRange', 'trainingFrequency', 'planDifficulty', 'expectedPace', 'flexibilityLevel'],
      properties: {
        calorieTargetRange: { type: 'string' },
        trainingFrequency: { type: 'string' },
        planDifficulty: { type: 'string' },
        expectedPace: { type: 'string' },
        flexibilityLevel: { type: 'string' },
      },
    },
    weeklyNutrition: {
      type: 'array',
      minItems: 7,
      maxItems: 7,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['dayLabel', 'calorieTarget', 'proteinTarget', 'carbsTarget', 'fatTarget', 'meals'],
        properties: {
          dayLabel: { type: 'string' },
          calorieTarget: { type: 'number' },
          proteinTarget: { type: 'number' },
          carbsTarget: { type: 'number' },
          fatTarget: { type: 'number' },
          meals: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: [
                'mealType',
                'name',
                'description',
                'estimatedCalories',
                'estimatedProtein',
                'estimatedCarbs',
                'estimatedFat',
                'prepTimeMinutes',
              ],
              properties: {
                mealType: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                estimatedCalories: { type: 'number' },
                estimatedProtein: { type: 'number' },
                estimatedCarbs: { type: 'number' },
                estimatedFat: { type: 'number' },
                prepTimeMinutes: { type: 'number' },
              },
            },
          },
        },
      },
    },
    weeklyTraining: {
      type: 'array',
      minItems: 7,
      maxItems: 7,
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'dayLabel',
          'sessionGoal',
          'workoutType',
          'durationMinutes',
          'intensity',
          'structure',
          'fallbackVersion',
          'minimumViableVersion',
        ],
        properties: {
          dayLabel: { type: 'string' },
          sessionGoal: { type: 'string' },
          workoutType: { type: 'string' },
          durationMinutes: { type: 'number' },
          intensity: { type: 'string' },
          structure: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['name', 'sets', 'reps', 'durationMinutes', 'notes'],
              properties: {
                name: { type: 'string' },
                sets: { type: 'string' },
                reps: { type: 'string' },
                durationMinutes: { type: 'number' },
                notes: { type: 'string' },
              },
            },
          },
          fallbackVersion: { type: 'string' },
          minimumViableVersion: { type: 'string' },
        },
      },
    },
    coachNotes: { type: 'array', minItems: 2, items: { type: 'string' } },
    hardestPartThisWeek: { type: 'string', minLength: 12 },
    focusForBestResults: { type: 'string', minLength: 12 },
    executionTips: { type: 'array', minItems: 2, items: { type: 'string' } },
    bestCasePlan: { type: 'string', minLength: 12 },
    realisticPlan: { type: 'string', minLength: 12 },
  },
};

const COACH_PRO_DETAILS_JSON_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: [
    'weeklyNutrition',
    'rationale',
    'smartWarnings',
    'shoppingList',
    'substitutions',
    'mealPrepTips',
    'recoveryNote',
    'bestCasePlan',
    'realisticPlan',
  ],
  properties: {
    weeklyNutrition: {
      type: 'array',
      minItems: 7,
      maxItems: 7,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['dayLabel', 'meals'],
        properties: {
          dayLabel: { type: 'string' },
          meals: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: [
                'mealType',
                'name',
                'fiberGrams',
                'estimatedSatiety',
                'suggestedUse',
                'tags',
                'ingredients',
                'recipeSteps',
                'substitutions',
                'mealPrepNote',
                'rationale',
              ],
              properties: {
                mealType: { type: 'string' },
                name: { type: 'string' },
                fiberGrams: { type: 'number' },
                estimatedSatiety: { type: 'string' },
                suggestedUse: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
                ingredients: {
                  type: 'array',
                  minItems: 3,
                  maxItems: 6,
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['item', 'quantity'],
                    properties: {
                      item: { type: 'string' },
                      quantity: { type: 'string' },
                    },
                  },
                },
                recipeSteps: { type: 'array', minItems: 2, maxItems: 5, items: { type: 'string' } },
                substitutions: { type: 'array', items: { type: 'string' } },
                mealPrepNote: { type: 'string' },
                rationale: { type: 'string' },
              },
            },
          },
        },
      },
    },
    rationale: { type: 'array', minItems: 2, items: { type: 'string' } },
    smartWarnings: { type: 'array', items: { type: 'string' } },
    shoppingList: {
      type: 'object',
      additionalProperties: false,
      required: ['proteins', 'carbs', 'fats', 'vegetables', 'dairy', 'extras', 'optionalItems'],
      properties: {
        proteins: { type: 'array', items: { type: 'string' } },
        carbs: { type: 'array', items: { type: 'string' } },
        fats: { type: 'array', items: { type: 'string' } },
        vegetables: { type: 'array', items: { type: 'string' } },
        dairy: { type: 'array', items: { type: 'string' } },
        extras: { type: 'array', items: { type: 'string' } },
        optionalItems: { type: 'array', items: { type: 'string' } },
      },
    },
    substitutions: {
      type: 'object',
      additionalProperties: false,
      required: [
        'ingredientSubstitutions',
        'mealSwaps',
        'exerciseSubstitutions',
        'lowEnergyAlternatives',
        'shortOnTimeAlternatives',
      ],
      properties: {
        ingredientSubstitutions: { type: 'array', minItems: 1, items: { type: 'string' } },
        mealSwaps: { type: 'array', minItems: 1, items: { type: 'string' } },
        exerciseSubstitutions: { type: 'array', minItems: 1, items: { type: 'string' } },
        lowEnergyAlternatives: { type: 'array', minItems: 1, items: { type: 'string' } },
        shortOnTimeAlternatives: { type: 'array', minItems: 1, items: { type: 'string' } },
      },
    },
    mealPrepTips: { type: 'array', minItems: 2, items: { type: 'string' } },
    recoveryNote: { type: 'string', minLength: 12 },
    bestCasePlan: { type: 'string', minLength: 12 },
    realisticPlan: { type: 'string', minLength: 12 },
  },
};

const COACH_PRO_MEAL_DRAWER_JSON_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: [
    'mealType',
    'name',
    'description',
    'estimatedCalories',
    'estimatedProtein',
    'estimatedCarbs',
    'estimatedFat',
    'fiberGrams',
    'estimatedSatiety',
    'suggestedUse',
    'prepTimeMinutes',
    'tags',
    'ingredients',
    'recipeSteps',
    'substitutions',
    'mealPrepNote',
    'rationale',
  ],
  properties: {
    mealType: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
    estimatedCalories: { type: 'number' },
    estimatedProtein: { type: 'number' },
    estimatedCarbs: { type: 'number' },
    estimatedFat: { type: 'number' },
    fiberGrams: { type: 'number' },
    estimatedSatiety: { type: 'string' },
    suggestedUse: { type: 'string' },
    prepTimeMinutes: { type: 'number' },
    tags: { type: 'array', items: { type: 'string' } },
    ingredients: {
      type: 'array',
      minItems: 3,
      maxItems: 8,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['item', 'quantity'],
        properties: {
          item: { type: 'string' },
          quantity: { type: 'string' },
        },
      },
    },
    recipeSteps: { type: 'array', minItems: 3, maxItems: 8, items: { type: 'string' } },
    substitutions: { type: 'array', items: { type: 'string' } },
    mealPrepNote: { type: 'string' },
    rationale: { type: 'string' },
  },
};

const COACH_PRO_TRAINING_DRAWER_JSON_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['session', 'whyThisSession', 'painSubstitution'],
  properties: {
    session: {
      type: 'object',
      additionalProperties: false,
      required: [
        'dayLabel',
        'sessionGoal',
        'workoutType',
        'durationMinutes',
        'intensity',
        'structure',
        'fallbackVersion',
        'minimumViableVersion',
      ],
      properties: {
        dayLabel: { type: 'string' },
        sessionGoal: { type: 'string' },
        workoutType: { type: 'string' },
        durationMinutes: { type: 'number' },
        intensity: { type: 'string' },
        structure: {
          type: 'array',
          minItems: 2,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['name', 'sets', 'reps', 'durationMinutes', 'notes'],
            properties: {
              name: { type: 'string' },
              sets: { type: 'string' },
              reps: { type: 'string' },
              durationMinutes: { type: 'number' },
              notes: { type: 'string' },
            },
          },
        },
        fallbackVersion: { type: 'string' },
        minimumViableVersion: { type: 'string' },
      },
    },
    whyThisSession: { type: 'string' },
    painSubstitution: { type: 'string' },
  },
};

export class OpenAIService {
  private openai: OpenAI | null = null;
  private readonly model: string;
  private readonly temperature: number;

  constructor() {
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    this.temperature = Number(process.env.OPENAI_TEMPERATURE || '0.3');

    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } else {
      console.warn('⚠️  OPENAI_API_KEY not set. AI features will be disabled.');
    }
  }

  private ensureInitialized(): void {
    if (!this.openai) {
      throw new Error('OpenAI client is not initialized. Please set OPENAI_API_KEY environment variable.');
    }
  }

  private createCompletionOptions(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    maxOutputTokens: number,
    options?: {
      forceJsonObject?: boolean;
      jsonSchema?: {
        name: string;
        schema: Record<string, unknown>;
      };
    }
  ): OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming {
    const isGpt5Family = this.model.startsWith('gpt-5');
    const forceJsonObject = Boolean(options?.forceJsonObject);
    const jsonSchema = options?.jsonSchema;

    if (isGpt5Family) {
      const gpt5Payload = {
        model: this.model,
        messages,
        max_completion_tokens: maxOutputTokens,
      } as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming;
      if (jsonSchema) {
        (gpt5Payload as any).response_format = {
          type: 'json_schema',
          json_schema: {
            name: jsonSchema.name,
            strict: true,
            schema: jsonSchema.schema,
          },
        };
      } else if (forceJsonObject) {
        (gpt5Payload as any).response_format = { type: 'json_object' };
      }
      return gpt5Payload;
    }

    const payload: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
      model: this.model,
      messages,
      max_tokens: maxOutputTokens,
      temperature: this.temperature,
    } as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming;

    if (jsonSchema) {
      (payload as any).response_format = {
        type: 'json_schema',
        json_schema: {
          name: jsonSchema.name,
          strict: true,
          schema: jsonSchema.schema,
        },
      };
    } else if (forceJsonObject) {
      (payload as any).response_format = { type: 'json_object' };
    }

    return payload;
  }

  async analyzeFood(
    imageBase64: string,
    mealType: MealType,
    additionalContext?: string,
    imageMimeType: string = 'image/jpeg'
  ): Promise<AnalyzeImageResponse> {
    this.ensureInitialized();
    
    try {
      const prompt = this.buildAnalysisPrompt(mealType, additionalContext);
      
      const response = await this.openai!.chat.completions.create(this.createCompletionOptions([
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${imageMimeType};base64,${imageBase64}`
                }
              }
            ]
          }
        ], 1000));

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const analysis = this.parseJsonResponse<FoodAnalysisJson>(content);
      
      return {
        nutrition: {
          calories: analysis.nutrition.calories,
          protein: analysis.nutrition.protein,
          carbs: analysis.nutrition.carbs,
          fat: analysis.nutrition.fat,
          fiber: analysis.nutrition.fiber,
          sugar: analysis.nutrition.sugar,
          sodium: analysis.nutrition.sodium,
          confidence: analysis.confidence
        },
        foodName: analysis.foodName,
        description: analysis.description,
        suggestions: analysis.suggestions || []
      };

    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error('Failed to analyze image');
    }
  }

  async analyzeFoodFromDescription(
    description: string,
    mealType: MealType,
    additionalContext?: string
  ): Promise<AnalyzeImageResponse> {
    this.ensureInitialized();

    try {
      const prompt = `
        Analyze the meal described by the user and estimate macronutrients.

        Meal type: ${mealType}
        User description: ${description}
        ${additionalContext ? `Additional context: ${additionalContext}` : ''}

        Return JSON only in this format:
        {
          "foodName": "dish name",
          "description": "short summary of ingredients and portion",
          "nutrition": {
            "calories": number,
            "protein": number,
            "carbs": number,
            "fat": number,
            "fiber": number,
            "sugar": number,
            "sodium": number
          },
          "confidence": number,
          "suggestions": ["tip 1", "tip 2", "tip 3"]
        }
      `;

      const response = await this.openai!.chat.completions.create(
        this.createCompletionOptions([{ role: 'user', content: prompt }], 800)
      );

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const analysis = this.parseJsonResponse<FoodAnalysisJson>(content);

      return {
        nutrition: {
          calories: analysis.nutrition.calories,
          protein: analysis.nutrition.protein,
          carbs: analysis.nutrition.carbs,
          fat: analysis.nutrition.fat,
          fiber: analysis.nutrition.fiber,
          sugar: analysis.nutrition.sugar,
          sodium: analysis.nutrition.sodium,
          confidence: analysis.confidence
        },
        foodName: analysis.foodName,
        description: analysis.description,
        suggestions: analysis.suggestions || []
      };
    } catch (error) {
      console.error('OpenAI Text Analysis Error:', error);
      throw new Error('Failed to analyze meal description');
    }
  }

  async generateNutritionAdvice(
    userStats: { dailyCalories: number; protein: number; carbs: number; fat: number; goal: number },
    context?: string
  ): Promise<string> {
    this.ensureInitialized();
    
    try {
      const prompt = `
        You are an AI nutrition expert. Based on user data, generate enthusiastic, 
        encouraging, and specific nutrition advice.
        
        User data:
        - Daily calorie intake: ${userStats.dailyCalories}
        - Protein: ${userStats.protein}g
        - Carbs: ${userStats.carbs}g  
        - Fats: ${userStats.fat}g
        - Calorie goal: ${userStats.goal}
        
        ${context ? `Additional context: ${context}` : ''}
        
        Respond in JSON format:
        {
          "advice": "main advice",
          "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
          "motivation": "motivational message"
        }
      `;

      const response = await this.openai!.chat.completions.create(
        this.createCompletionOptions([{ role: "user", content: prompt }], 800)
      );

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return content;

    } catch (error) {
      console.error('OpenAI Advice Error:', error);
      throw new Error('Failed to generate advice');
    }
  }

  async suggestGoalsFromPrompt(
    prompt: string,
    userContext: { dailyCalorieGoal?: number; activityLevel?: string }
  ): Promise<{ dailyCalorieGoal: number; activityLevel: string; message: string }> {
    this.ensureInitialized();

    try {
      const systemPrompt = composeEvoSystemPrompt({
        mode: 'analysis',
        tone: 'supportive',
        proactivity: 'medium',
        channel: 'summary',
        includeHumor: false,
        userContext: {
          dailyCalorieGoal: userContext.dailyCalorieGoal,
          activityLevel: userContext.activityLevel,
        },
      });
      const aiPrompt = `
Current dailyCalorieGoal: ${userContext.dailyCalorieGoal || 2000}
Current activityLevel: ${userContext.activityLevel || 'moderate'}
User request: ${prompt}

Return ONLY valid JSON:
{
  "dailyCalorieGoal": number between 800 and 5000,
  "activityLevel": one of ["sedentary","light","moderate","active","very_active"],
  "message": "short explanation in the user's language with one practical reason"
}
      `.trim();

      const response = await this.openai!.chat.completions.create(
        this.createCompletionOptions(
          [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: aiPrompt },
          ],
          300
        )
      );

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const parsed = this.parseJsonResponse<GoalSuggestionJson>(content);
      const rawGoal = Number(parsed.dailyCalorieGoal);
      const normalizedGoal = Number.isFinite(rawGoal) ? Math.round(rawGoal) : 2000;
      const clampedGoal = Math.max(800, Math.min(5000, normalizedGoal));

      const rawActivityLevel = String(parsed.activityLevel || 'moderate').toLowerCase();
      const allowedLevels = new Set(['sedentary', 'light', 'moderate', 'active', 'very_active']);
      const activityLevel = allowedLevels.has(rawActivityLevel) ? rawActivityLevel : 'moderate';

      const message = String(parsed.message || 'Goals updated based on your request.');

      return {
        dailyCalorieGoal: clampedGoal,
        activityLevel,
        message,
      };
    } catch (error) {
      console.error('OpenAI Goal Suggestion Error:', error);
      throw new Error('Failed to suggest goals');
    }
  }

  async chat(
    messages: EvoChatMessage[],
    userContext?: EvoUserContext,
    conversationChannel: 'general' | 'coach' | 'log' = 'coach'
  ): Promise<string> {
    this.ensureInitialized();
    
    try {
      const fallbackMode = conversationChannel === 'general' ? 'education' : 'coach';
      const mode = detectEvoResponseMode(messages, fallbackMode);
      const { tone, proactivity } = resolveToneAndProactivity(userContext);
      const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user')?.content;
      const systemMessage = {
        role: 'system' as const,
        content: composeEvoSystemPrompt({
          mode,
          tone,
          proactivity,
          userContext,
          includeHumor: true,
          latestUserMessage,
          conversationChannel,
          channel: 'chat',
        }),
      };

      const response = await this.openai!.chat.completions.create(
        this.createCompletionOptions([systemMessage, ...messages], 900)
      );

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return content;

    } catch (error) {
      console.error('OpenAI Chat Error:', error);
      throw new Error('Failed to generate chat response');
    }
  }

  async generateDashboardInsights(input: {
    date: string;
    calorieGoal: number;
    proteinGoal: number;
    primaryGoal?: string;
    userName?: string;
    coachingTone?: string;
    proactivityLevel?: string;
    consumedCalories: number;
    consumedProtein: number;
    consumedCarbs?: number;
    consumedFat?: number;
    caloriesBurned: number;
    remainingCalories: number;
    remainingProtein: number;
    mealsCount?: number;
    workoutSessions?: number;
    steps?: number;
    currentHour?: number;
    remainingDayPercent?: number;
    estimatedMealsLeft?: number;
    mealDetails?: string[];
    workoutDetails?: string[];
  }): Promise<{ summary: string; tips: string[] }> {
    this.ensureInitialized();

    const { tone, proactivity } = resolveToneAndProactivity({
      coachingTone: input.coachingTone,
      proactivityLevel: input.proactivityLevel,
    });
    const systemPrompt = composeEvoSystemPrompt({
      mode: 'insight',
      tone,
      proactivity,
      includeHumor: true,
      channel: 'insight',
      userContext: {
        primaryGoal: input.primaryGoal,
        dailyCalorieGoal: input.calorieGoal,
        proteinGoal: input.proteinGoal,
        todayStats: {
          calories: input.consumedCalories,
          protein: input.consumedProtein,
          carbs: input.consumedCarbs || 0,
          fat: input.consumedFat || 0,
        },
        todayActivity: {
          steps: input.steps || 0,
          stepsCalories: 0,
          calorieBudget: input.calorieGoal,
        },
      },
    });
    const prompt = `
Day: ${input.date}
User: ${input.userName || 'User'}
Primary goal: ${input.primaryGoal || 'maintenance'}
Current local hour: ${input.currentHour ?? 'n/a'}
Remaining day estimate: ${input.remainingDayPercent ?? 'n/a'}%
Estimated meal opportunities left today: ${input.estimatedMealsLeft ?? 0}
Calorie goal: ${input.calorieGoal}
Protein goal: ${input.proteinGoal}g
Consumed calories: ${input.consumedCalories}
Consumed protein: ${input.consumedProtein}g
Burned calories (training only): ${input.caloriesBurned}
Meals logged: ${input.mealsCount ?? 0}
Workout sessions: ${input.workoutSessions ?? 0}
Steps tracked: ${input.steps ?? 0}
Tracked steps are informational only and must not be counted as burned calories.
Remaining calories (budget - consumed): ${input.remainingCalories}
Remaining protein: ${input.remainingProtein}g

Real meals logged today:
${(input.mealDetails && input.mealDetails.length > 0) ? input.mealDetails.map((line) => `- ${line}`).join('\n') : '- none logged'}

Real workouts logged today:
${(input.workoutDetails && input.workoutDetails.length > 0) ? input.workoutDetails.map((line) => `- ${line}`).join('\n') : '- none logged'}

Return JSON only:
{
  "summary": "max 2 concise sentences",
  "tips": ["nutrition tip", "training tip", "recovery tip"]
}

Rules:
- return exactly 3 tips
- tip[0] must be nutrition focused
- tip[1] must be training focused
- tip[2] must be recovery focused
- each tip max 1 sentence
- practical next steps, no generic fluff
- mention protein and recovery when relevant
- optional subtle emoji, max one emoji per sentence
- in summary, reference at least two concrete numbers from context
- avoid generic praise and stale templates; sound like a present, intelligent companion
- if data quality is weak, say it directly instead of guessing
- explicitly refer to at least one real logged meal or workout when available
- adapt advice to current time of day and how much of the day is left
- if protein pacing is good for this time, explicitly praise that pacing
- if protein pacing is poor for this time, call it out clearly and give a corrective next action
    `.trim();

    const response = await this.openai!.chat.completions.create(
      this.createCompletionOptions(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        350
      )
    );

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = this.parseJsonResponse<DashboardInsightJson>(content);
    const summary = String(parsed.summary || '').trim();
    const rawTips = Array.isArray(parsed.tips) ? parsed.tips : [];
    const tips = rawTips.map((tip: unknown) => String(tip || '').trim()).filter(Boolean).slice(0, 3);

    if (!summary || tips.length === 0) {
      throw new Error('Invalid AI insight response');
    }

    while (tips.length < 3) {
      if (tips.length === 0) tips.push('Plan a protein-rich meal to support your nutrition target.');
      else if (tips.length === 1) tips.push('Keep your training focused on quality movement and controlled effort.');
      else tips.push('Prioritize hydration and recovery to stay consistent tomorrow.');
    }

    const shouldDecorateWithEmoji = this.shouldUseDashboardEmoji(input.date);
    const normalized = this.decorateDashboardInsightWithEmoji({
      summary,
      tips,
      shouldDecorateWithEmoji,
      caloriesBurned: input.caloriesBurned,
      remainingProtein: input.remainingProtein,
      remainingCalories: input.remainingCalories,
    });

    return normalized;
  }

  async generateCoachProPlan(input: {
    userContext: Record<string, unknown>;
    setup: Record<string, unknown>;
  }): Promise<CoachProPlanJson> {
    this.ensureInitialized();

    const systemPrompt = composeEvoSystemPrompt({
      mode: 'analysis',
      tone: 'supportive',
      proactivity: 'high',
      includeHumor: false,
      channel: 'insight',
    });

    const prompt = `
You are creating Evo Coach Pro: a premium weekly nutrition + training strategy.

User context:
${JSON.stringify(input.userContext, null, 2)}

Setup input:
${JSON.stringify(input.setup, null, 2)}

Return ONLY valid JSON in the structured-output schema.
HARD RULES — NEVER VIOLATE
1. Return only schema-compliant JSON.
2. Do not include markdown, commentary, explanations, or text outside schema fields.
3. The app language is English. All meal names, descriptions, training labels, and helper text must be natural English.
4. Never paste raw user preference fragments into output text.
5. Never use generic placeholder meal names such as:
   - performance bowl
   - balanced meal
   - meal 1 / meal 2
   - protein carb dinner set
   - generic cuisine-based placeholders
6. Do not invent abstract or unnatural meal names.
7. Do not repeat entire day structures in obvious loops such as A/B/A/B.
8. Keep output compact and concise.

MEAL QUALITY RULES
1. Meal names must sound like real dishes people would actually cook or order.
2. Meal descriptions must be one short, natural, appetizing sentence.
3. Descriptions must describe the food, not the generation logic.
4. Never use phrases like:
   - built around
   - includes user staples
   - when practical
   - cookable in real life
   - practical ingredients
   - real-world adherence
5. Prefer realistic names such as:
   - Scrambled eggs with spinach and whole grain toast
   - Turkey meatballs in tomato sauce with tagliatelle
   - Chicken wrap with crunchy vegetables and yogurt sauce
6. If uncertain, generate a realistic ingredient-based dish name.

TRAINING QUALITY RULES
1. Training sessions must feel like they were written by a coach, not a template engine.
2. Avoid generic labels like:
   - Strength
   - Cardio
   - Conditioning
   - Build performance and consistency
3. Prefer specific naming such as:
   - Lower body strength + core stability
   - Upper body hypertrophy + shoulder-friendly accessories
   - Easy aerobic run + cadence focus
   - Recovery mobility and trunk control
4. fallbackVersion and minimumViableVersion must describe practical reductions, not vague percentages.

PERSONALIZATION RULES
1. Reflect at least 2-3 of the user's strongest food preferences across the week.
2. Interpret preferences semantically:
   - cuisine preference = flavor/style inspiration
   - dish preference = occasional anchor, not repeated literally
   - ingredient preference = recurring ingredient choice
3. Never quote multilingual raw inputs directly unless they are intentionally presented as a proper dish title in English context.
4. Use hard exclusions as strict never-use rules.
5. Use soft dislikes only if no strong alternative exists.

CULTURE / CUISINE / USER-STATED DISHES (high priority)
1. Use setup.nutrition.favoriteFoods, stapleFoods, and userContext.foodPreferenceSummary as primary inspiration—not optional decoration.
2. If the user names cuisines (e.g. Polish, Italian) or dishes (e.g. potato pancakes, pierogi-style preparations), at least half of lunches and dinners in the week MUST clearly match those cuisines or dish styles (recognizable techniques, typical sides, classic combinations). Do not substitute with generic "fitness bowl" templates when the user asked for specific cultures.
3. When multiple cuisines or dishes are listed, rotate across the week so the plan visibly varies by culture—not only by protein or carb source.
4. Staple foods should recur as ingredients or clearly named dishes, not as a vague "healthy plate."
5. Translate cultural anchors into natural English dish names; never paste raw non-English fragments into output.

REPETITION RULES
1. Breakfast may repeat up to 3 times per week.
2. Lunch and dinner should not repeat more than twice unless explicitly requested.
3. Repeated concepts must vary meaningfully by at least one of:
   - protein
   - carb base
   - vegetables
   - sauce
   - format
   - cuisine direction
4. Avoid repeated descriptions and repeated full-day meal patterns.
5. At least 60% of meals in the week should be new proposals rather than direct repeats of recent logged meals.

OUTPUT SIZE RULES
1. Keep strings short.
2. Keep descriptions to one short sentence.
3. Prefer concise, high-signal content over verbose explanations.
4. Do not generate optional detail fields in this pass.

Anti-leak rules (strict):
- Never echo raw user preference text fragments into descriptions or helper text.
- Never mention that a meal was generated from user preferences.
- Never say things like "includes user staples", "based on your favorites", or similar meta phrasing.
- Preference usage must be implicit in dish selection, not explicit in wording.
  `.trim();

    const setup = (input?.setup || {}) as Record<string, any>;
    const minMealsPerDay = Math.max(2, Number(setup?.nutrition?.mealsPerDay || 3));
    return this.generateCoachProPlanWithContract({
      systemPrompt,
      userPrompt: prompt,
      maxOutputTokens: 12000,
      context: 'generateCoachProPlan',
      requireFullWeek: true,
      minMealsPerDay,
    });
  }

  async adaptCoachProPlan(input: {
    currentPlanJson: string;
    action: string;
    note?: string;
  }): Promise<CoachProPlanJson> {
    this.ensureInitialized();

    const prompt = `
Adjust the existing Evo Coach Pro plan contextually without rebuilding from scratch.

Action: ${input.action}
Optional note: ${input.note || ''}
Current plan JSON:
${input.currentPlanJson}

Return ONLY updated JSON in the same schema as the original plan.
Rules:
- Keep overall strategy coherent.
- Apply minimal necessary changes.
- Preserve realistic, appetizing meal naming rules from Evo Coach Pro.
- Do not introduce placeholder meal names or abstract generic labels.
- Keep response compact and focused on core weekly plan fields.
- Keep language clean and in English; never leak raw user preference fragments into meal descriptions.
    `.trim();

    return this.generateCoachProPlanWithContract({
      userPrompt: prompt,
      maxOutputTokens: 2000,
      context: 'adaptCoachProPlan',
      requireFullWeek: false,
    });
  }

  async generateCoachProPlanDetails(input: {
    corePlanJson: string;
    userContext: Record<string, unknown>;
    setup: Record<string, unknown>;
  }): Promise<CoachProPlanDetailsJson> {
    this.ensureInitialized();

    const prompt = `
Enrich the provided Evo Coach Pro weekly plan with full details.

User context:
${JSON.stringify(input.userContext, null, 2)}

Setup input:
${JSON.stringify(input.setup, null, 2)}

Core plan JSON:
${input.corePlanJson}

Return ONLY valid JSON in the structured-output schema.
DETAIL RULES
0. Honor userContext.foodPreferenceSummary and setup.nutrition favorite/staple lists: ingredients and recipe style should align with stated cuisines and dishes (English output, no raw preference fragments in text).
1. Keep meal detail content practical and concise.
2. Ingredients must be realistic and measurable.
3. Recipe steps must be scannable and action-based.
4. Do not generate chef-style storytelling.
5. Steps should describe actual cooking actions only.
6. Ingredient quantities must match the dish type realistically.
7. Shopping list must be derived from weekly ingredients, not generic fallback food groups.
7a. Fill ALL shoppingList sections: proteins, carbs, fats, vegetables, dairy, extras, optionalItems.
7b. Use concise ingredient names (ingredient-level), not full meal titles.
7c. If a section has nothing relevant, return an empty array [] (never omit section keys).
8. Do not use generic substitutions like "swap protein with similar option" unless a concrete swap is provided.
9. Prefer substitutions such as:
   - chicken → turkey
   - rice → potatoes
   - greek yogurt → skyr

   - Anti-leak rules (strict):
  - Never echo raw user preference text fragments into descriptions or helper text.
  - Never mention that a meal was generated from user preferences.
  - Never say things like "includes user staples", "based on your favorites", or similar meta phrasing.
  - Preference usage must be implicit in dish selection, not explicit in wording.
    `.trim();

    return this.generateCoachProPlanDetailsWithContract({
      userPrompt: prompt,
      maxOutputTokens: 10000,
      requireFullWeek: true,
    });
  }

  async generateCoachProMealDrawerDetails(input: {
    meal: {
      dayLabel: string;
      mealType: string;
      name: string;
      description: string;
      estimatedCalories: number;
      estimatedProtein: number;
      estimatedCarbs: number;
      estimatedFat: number;
      prepTimeMinutes: number;
    };
    dayTarget: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    userContext?: Record<string, unknown>;
  }): Promise<CoachProMealDrawerJson> {
    this.ensureInitialized();

    const prompt = `
You are enriching ONE meal for an Evo Coach Pro drawer.

Meal context:
${JSON.stringify(input.meal, null, 2)}

Day target context:
${JSON.stringify(input.dayTarget, null, 2)}

User context:
${JSON.stringify(input.userContext || {}, null, 2)}

Return ONLY valid JSON in the structured-output schema.
Rules:
- Keep the same meal identity (mealType + dish direction).
- Align ingredients and cooking style with userContext.foodPreferenceSummary when relevant (English only).
- Ingredient quantities and preparation flow should support estimated macros.
- Keep recipe steps practical, concise, and executable.
- No meta language about generation logic.
- Use natural English.
    `.trim();

    return this.generateCoachProMealDrawerWithContract({
      userPrompt: prompt,
      maxOutputTokens: 2500,
    });
  }

  async generateCoachProTrainingDrawerDetails(input: {
    session: {
      dayLabel: string;
      sessionGoal: string;
      workoutType: string;
      durationMinutes: number;
      intensity: string;
      structure: Array<{
        name: string;
        sets?: string | null;
        reps?: string | null;
        durationMinutes?: number | null;
        notes?: string | null;
      }>;
      fallbackVersion: string;
      minimumViableVersion: string;
    };
    userContext?: Record<string, unknown>;
  }): Promise<CoachProTrainingDrawerJson> {
    this.ensureInitialized();
    const prompt = `
You are enriching ONE training session for an Evo Coach Pro drawer.

Session context:
${JSON.stringify(input.session, null, 2)}

User context:
${JSON.stringify(input.userContext || {}, null, 2)}

Return ONLY valid JSON in the structured-output schema.
Rules:
- Keep the same session identity and intent.
- Improve structure clarity for practical execution.
- whyThisSession should be concise and coaching-oriented.
- painSubstitution should be practical and safe.
- Every block in session.structure must include: name, sets, reps, durationMinutes, notes.
- Use natural English.
    `.trim();

    return this.generateCoachProTrainingDrawerWithContract({
      userPrompt: prompt,
      maxOutputTokens: 2200,
    });
  }

  private ensureCoachProPlanContract(
    plan: unknown,
    options?: { requireFullWeek?: boolean; minMealsPerDay?: number; context?: string }
  ): CoachProPlanJson {
    const issues: string[] = [];
    const candidate = (plan || {}) as Record<string, any>;
    const context = options?.context || 'coachPro';
    const requiredTopLevel = [
      'overview',
      'weeklyNutrition',
      'weeklyTraining',
    ];

    requiredTopLevel.forEach((field) => {
      if (candidate[field] === undefined || candidate[field] === null) {
        issues.push(`missing field: ${field}`);
      }
    });

    const weeklyNutrition = Array.isArray(candidate.weeklyNutrition) ? candidate.weeklyNutrition : [];
    const weeklyTraining = Array.isArray(candidate.weeklyTraining) ? candidate.weeklyTraining : [];
    const requireFullWeek = options?.requireFullWeek ?? false;
    const minMealsPerDay = Math.max(2, Number(options?.minMealsPerDay || 3));

    if (!Array.isArray(candidate.weeklyNutrition)) issues.push('weeklyNutrition is not an array');
    if (!Array.isArray(candidate.weeklyTraining)) issues.push('weeklyTraining is not an array');
    if (requireFullWeek && weeklyNutrition.length === 0) issues.push('weeklyNutrition has 0 days');
    if (requireFullWeek && weeklyTraining.length === 0) issues.push('weeklyTraining has 0 days');

    weeklyNutrition.forEach((day, index) => {
      const meals = Array.isArray(day?.meals) ? day.meals : [];
      if (!Array.isArray(day?.meals)) {
        issues.push(`weeklyNutrition[${index}].meals is not an array`);
        return;
      }
      if (meals.length === 0) {
        issues.push(`weeklyNutrition[${index}] has no meals`);
      }
      if (requireFullWeek && meals.length < minMealsPerDay) {
        issues.push(`weeklyNutrition[${index}] has ${meals.length}/${minMealsPerDay} meals`);
      }
    });

    if (issues.length > 0) {
      throw new Error(`[OpenAIService][${context}] schema validation failed: ${issues.slice(0, 8).join('; ')}`);
    }

    return candidate as CoachProPlanJson;
  }

  private ensureCoachProDetailsContract(
    details: unknown,
    options?: { requireFullWeek?: boolean; context?: string }
  ): CoachProPlanDetailsJson {
    const issues: string[] = [];
    const candidate = (details || {}) as Record<string, any>;
    const context = options?.context || 'coachProDetails';
    const requiredTopLevel = [
      'weeklyNutrition',
      'rationale',
      'smartWarnings',
      'shoppingList',
      'substitutions',
      'mealPrepTips',
      'recoveryNote',
      'bestCasePlan',
      'realisticPlan',
    ];
    requiredTopLevel.forEach((field) => {
      if (candidate[field] === undefined || candidate[field] === null) {
        issues.push(`missing field: ${field}`);
      }
    });

    const weeklyNutrition = Array.isArray(candidate.weeklyNutrition) ? candidate.weeklyNutrition : [];
    if (!Array.isArray(candidate.weeklyNutrition)) {
      issues.push('weeklyNutrition is not an array');
    }
    if ((options?.requireFullWeek ?? false) && weeklyNutrition.length !== 7) {
      issues.push(`weeklyNutrition length ${weeklyNutrition.length} != 7`);
    }

    weeklyNutrition.forEach((day, dayIndex) => {
      const meals = Array.isArray(day?.meals) ? day.meals : [];
      if (!Array.isArray(day?.meals)) {
        issues.push(`weeklyNutrition[${dayIndex}].meals is not an array`);
        return;
      }
      meals.forEach((meal: any, mealIndex: number) => {
        if (!Array.isArray(meal?.ingredients) || meal.ingredients.length < 2) {
          issues.push(`weeklyNutrition[${dayIndex}].meals[${mealIndex}] ingredients invalid`);
        }
        if (!Array.isArray(meal?.recipeSteps) || meal.recipeSteps.length < 2) {
          issues.push(`weeklyNutrition[${dayIndex}].meals[${mealIndex}] recipeSteps invalid`);
        }
      });
    });

    if (issues.length > 0) {
      throw new Error(`[OpenAIService][${context}] schema validation failed: ${issues.slice(0, 8).join('; ')}`);
    }
    return candidate as CoachProPlanDetailsJson;
  }

  private ensureCoachProMealDrawerContract(result: unknown): CoachProMealDrawerJson {
    const candidate = (result || {}) as Record<string, any>;
    const required = [
      'mealType',
      'name',
      'description',
      'estimatedCalories',
      'estimatedProtein',
      'estimatedCarbs',
      'estimatedFat',
      'prepTimeMinutes',
      'tags',
      'ingredients',
      'recipeSteps',
      'substitutions',
    ];
    const issues = required.filter((field) => candidate[field] === undefined || candidate[field] === null);
    if (issues.length > 0) {
      throw new Error(`[OpenAIService][coachProMealDrawer] schema validation failed: missing ${issues.join(', ')}`);
    }
    if (!Array.isArray(candidate.ingredients) || !Array.isArray(candidate.recipeSteps)) {
      throw new Error('[OpenAIService][coachProMealDrawer] schema validation failed: ingredients/recipeSteps must be arrays');
    }
    return candidate as CoachProMealDrawerJson;
  }

  private ensureCoachProTrainingDrawerContract(result: unknown): CoachProTrainingDrawerJson {
    const candidate = (result || {}) as Record<string, any>;
    if (!candidate.session || typeof candidate.session !== 'object') {
      throw new Error('[OpenAIService][coachProTrainingDrawer] schema validation failed: session is required');
    }
    if (!Array.isArray(candidate.session.structure)) {
      throw new Error('[OpenAIService][coachProTrainingDrawer] schema validation failed: session.structure must be array');
    }
    candidate.session.structure.forEach((block: any, index: number) => {
      if (
        !block ||
        typeof block !== 'object' ||
        typeof block.name !== 'string' ||
        typeof block.sets !== 'string' ||
        typeof block.reps !== 'string' ||
        typeof block.notes !== 'string' ||
        !Number.isFinite(Number(block.durationMinutes))
      ) {
        throw new Error(
          `[OpenAIService][coachProTrainingDrawer] schema validation failed: invalid structure block at index ${index}`
        );
      }
    });
    if (!candidate.whyThisSession || !candidate.painSubstitution) {
      throw new Error('[OpenAIService][coachProTrainingDrawer] schema validation failed: whyThisSession/painSubstitution required');
    }
    return candidate as CoachProTrainingDrawerJson;
  }

  private async generateCoachProPlanWithContract(input: {
    systemPrompt?: string;
    userPrompt: string;
    maxOutputTokens: number;
    context: 'generateCoachProPlan' | 'adaptCoachProPlan';
    requireFullWeek: boolean;
    minMealsPerDay?: number;
  }): Promise<CoachProPlanJson> {
    this.ensureInitialized();

    const runAttempt = async (attempt: 1 | 2, previousError?: string) => {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
      const usedMaxOutputTokens =
        attempt === 2 && input.context === 'generateCoachProPlan'
          ? Math.max(6000, Math.round(input.maxOutputTokens * 0.9))
          : input.maxOutputTokens;
      if (input.systemPrompt) {
        messages.push({ role: 'system', content: input.systemPrompt });
      }
      if (attempt === 2) {
        messages.push({
          role: 'system',
          content:
            'Previous output failed. Return a smaller schema-compliant JSON object: shorter descriptions, compact training structure, no extra verbosity.',
        });
      }

      const userPrompt =
        attempt === 2 && previousError
          ? `${input.userPrompt}\n\nValidation error from previous attempt:\n${previousError}\n\nReturn corrected JSON only.`
          : input.userPrompt;
      messages.push({ role: 'user', content: userPrompt });

      const response = await this.openai!.chat.completions.create(
        this.createCompletionOptions(messages, usedMaxOutputTokens, {
          jsonSchema: {
            name: 'coach_pro_plan',
            schema: COACH_PRO_PLAN_JSON_SCHEMA,
          },
        })
      );
      const content = response.choices[0]?.message?.content;
      const finishReason = response.choices[0]?.finish_reason || 'unknown';

      if (!content) {
        throw new Error(`[OpenAIService][${input.context}] empty response (finish_reason=${finishReason})`);
      }
      if (finishReason === 'length') {
        throw new Error(
          `[OpenAIService][${input.context}] response truncated by token limit (finish_reason=length)`
        );
      }

      const parsed = this.parseJsonResponse<CoachProPlanJson>(content);
      return this.ensureCoachProPlanContract(parsed, {
        requireFullWeek: input.requireFullWeek,
        minMealsPerDay: input.minMealsPerDay,
        context: `${input.context}:attempt${attempt}`,
      });
    };

    try {
      return await runAttempt(1);
    } catch (firstError: any) {
      const firstMessage = firstError?.message || 'unknown error';
      console.warn(`[OpenAIService][${input.context}] first attempt failed, running one retry`, {
        error: firstMessage,
        retry: 1,
      });

      try {
        return await runAttempt(2, firstMessage);
      } catch (secondError: any) {
        const secondMessage = secondError?.message || 'unknown error';
        throw new Error(
          `[OpenAIService][${input.context}] failed after single retry. First error: ${firstMessage}. Second error: ${secondMessage}`
        );
      }
    }
  }

  private async generateCoachProPlanDetailsWithContract(input: {
    userPrompt: string;
    maxOutputTokens: number;
    requireFullWeek: boolean;
  }): Promise<CoachProPlanDetailsJson> {
    this.ensureInitialized();
    const runAttempt = async (attempt: 1 | 2, previousError?: string) => {
      const usedMaxOutputTokens = attempt === 2 ? Math.max(5000, Math.round(input.maxOutputTokens * 0.9)) : input.maxOutputTokens;
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content:
            'You enrich weekly coach plans with realistic meal details. Return only schema-compliant JSON with no markdown and no commentary.',
        },
      ];
      const userPrompt =
        attempt === 2 && previousError
          ? `${input.userPrompt}\n\nPrevious output failed validation:\n${previousError}\n\nReturn corrected JSON only.`
          : input.userPrompt;
      messages.push({ role: 'user', content: userPrompt });

      const response = await this.openai!.chat.completions.create(
        this.createCompletionOptions(messages, usedMaxOutputTokens, {
          jsonSchema: {
            name: 'coach_pro_details',
            schema: COACH_PRO_DETAILS_JSON_SCHEMA,
          },
        })
      );
      const content = response.choices[0]?.message?.content;
      const finishReason = response.choices[0]?.finish_reason || 'unknown';
      if (!content) {
        throw new Error(`[OpenAIService][generateCoachProPlanDetails] empty response (finish_reason=${finishReason})`);
      }
      if (finishReason === 'length') {
        throw new Error('[OpenAIService][generateCoachProPlanDetails] response truncated by token limit (finish_reason=length)');
      }
      const parsed = this.parseJsonResponse<CoachProPlanDetailsJson>(content);
      return this.ensureCoachProDetailsContract(parsed, {
        requireFullWeek: input.requireFullWeek,
        context: `generateCoachProPlanDetails:attempt${attempt}`,
      });
    };

    try {
      return await runAttempt(1);
    } catch (firstError: any) {
      const firstMessage = firstError?.message || 'unknown error';
      console.warn('[OpenAIService][generateCoachProPlanDetails] first attempt failed, running one retry', {
        error: firstMessage,
        retry: 1,
      });
      try {
        return await runAttempt(2, firstMessage);
      } catch (secondError: any) {
        const secondMessage = secondError?.message || 'unknown error';
        throw new Error(
          `[OpenAIService][generateCoachProPlanDetails] failed after single retry. First error: ${firstMessage}. Second error: ${secondMessage}`
        );
      }
    }
  }

  private async generateCoachProMealDrawerWithContract(input: {
    userPrompt: string;
    maxOutputTokens: number;
  }): Promise<CoachProMealDrawerJson> {
    this.ensureInitialized();
    const response = await this.openai!.chat.completions.create(
      this.createCompletionOptions(
        [
          {
            role: 'system',
            content:
              'You generate meal drawer details for a nutrition app. Return only schema-compliant JSON with no markdown.',
          },
          { role: 'user', content: input.userPrompt },
        ],
        input.maxOutputTokens,
        {
          jsonSchema: {
            name: 'coach_pro_meal_drawer',
            schema: COACH_PRO_MEAL_DRAWER_JSON_SCHEMA,
          },
        }
      )
    );
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('[OpenAIService][coachProMealDrawer] empty response');
    return this.ensureCoachProMealDrawerContract(this.parseJsonResponse<CoachProMealDrawerJson>(content));
  }

  private async generateCoachProTrainingDrawerWithContract(input: {
    userPrompt: string;
    maxOutputTokens: number;
  }): Promise<CoachProTrainingDrawerJson> {
    this.ensureInitialized();
    const response = await this.openai!.chat.completions.create(
      this.createCompletionOptions(
        [
          {
            role: 'system',
            content:
              'You generate training drawer details for a fitness app. Return only schema-compliant JSON with no markdown.',
          },
          { role: 'user', content: input.userPrompt },
        ],
        input.maxOutputTokens,
        {
          jsonSchema: {
            name: 'coach_pro_training_drawer',
            schema: COACH_PRO_TRAINING_DRAWER_JSON_SCHEMA,
          },
        }
      )
    );
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('[OpenAIService][coachProTrainingDrawer] empty response');
    return this.ensureCoachProTrainingDrawerContract(this.parseJsonResponse<CoachProTrainingDrawerJson>(content));
  }

  private buildAnalysisPrompt(mealType: MealType, additionalContext?: string): string {
    return `
      Analyze this food image and return detailed macronutrient information.
      
      Meal type: ${mealType}
      ${additionalContext ? `Additional context: ${additionalContext}` : ''}
      
      Return response in JSON format:
      {
        "foodName": "dish name",
        "description": "description of dish and ingredients",
        "nutrition": {
          "calories": calorie_number,
          "protein": grams_of_protein,
          "carbs": grams_of_carbs,
          "fat": grams_of_fat,
          "fiber": grams_of_fiber,
          "sugar": grams_of_sugar,
          "sodium": milligrams_of_sodium
        },
        "confidence": confidence_score_from_0_to_1,
        "suggestions": ["tip 1", "tip 2", "tip 3"]
      }
      
      Be precise in estimating portions and ingredients. If you're not sure, 
      provide a lower confidence value.
    `;
  }

  private parseJsonResponse<T>(content: string): T {
    const cleaned = content
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    try {
      return JSON.parse(cleaned) as T;
    } catch {
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace >= 0 && lastBrace > firstBrace) {
        const candidate = cleaned.slice(firstBrace, lastBrace + 1);
        return JSON.parse(candidate) as T;
      }
      throw new Error(`Invalid JSON response from AI: ${cleaned.slice(0, 180)}`);
    }
  }

  private shouldUseDashboardEmoji(date: string): boolean {
    const dayOfMonth = new Date(date).getDate();
    return dayOfMonth % 2 === 0;
  }

  private decorateDashboardInsightWithEmoji(input: {
    summary: string;
    tips: string[];
    shouldDecorateWithEmoji: boolean;
    caloriesBurned: number;
    remainingProtein: number;
    remainingCalories: number;
  }): { summary: string; tips: string[] } {
    const hasEmoji = (text: string) => /[\u{1F300}-\u{1FAFF}]/u.test(text);
    if (!input.shouldDecorateWithEmoji) {
      return { summary: input.summary, tips: input.tips };
    }

    if (hasEmoji(input.summary) || input.tips.some((tip) => hasEmoji(tip))) {
      return { summary: input.summary, tips: input.tips };
    }

    const emoji =
      input.remainingProtein > 20
        ? '🍗'
        : input.remainingCalories < 0
          ? '⚖️'
          : input.caloriesBurned > 0
            ? '💪'
            : '✨';

    return {
      summary: `${emoji} ${input.summary}`,
      tips: input.tips,
    };
  }
}
