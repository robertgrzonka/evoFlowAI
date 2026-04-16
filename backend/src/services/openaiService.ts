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
    maxOutputTokens: number
  ): OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming {
    const isGpt5Family = this.model.startsWith('gpt-5');

    if (isGpt5Family) {
      return {
        model: this.model,
        messages,
        max_completion_tokens: maxOutputTokens,
      } as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming;
    }

    return {
      model: this.model,
      messages,
      max_tokens: maxOutputTokens,
      temperature: this.temperature,
    } as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming;
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

  async chat(messages: EvoChatMessage[], userContext?: EvoUserContext): Promise<string> {
    this.ensureInitialized();
    
    try {
      const mode = detectEvoResponseMode(messages, 'coach');
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
    coachingTone?: string;
    proactivityLevel?: string;
    consumedCalories: number;
    consumedProtein: number;
    caloriesBurned: number;
    remainingCalories: number;
    remainingProtein: number;
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
          carbs: 0,
          fat: 0,
        },
        todayActivity: {
          steps: 0,
          stepsCalories: 0,
          calorieBudget: input.calorieGoal,
        },
      },
    });
    const prompt = `
Day: ${input.date}
Primary goal: ${input.primaryGoal || 'maintenance'}
Calorie goal: ${input.calorieGoal}
Protein goal: ${input.proteinGoal}g
Consumed calories: ${input.consumedCalories}
Consumed protein: ${input.consumedProtein}g
Burned calories (training only): ${input.caloriesBurned}
Tracked steps are informational only and must not be counted as burned calories.
Remaining calories (budget - consumed): ${input.remainingCalories}
Remaining protein: ${input.remainingProtein}g

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

    return JSON.parse(cleaned) as T;
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
