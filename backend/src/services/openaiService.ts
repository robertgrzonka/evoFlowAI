import OpenAI from 'openai';
import { AnalyzeImageResponse, MealType } from '@evoflowai/shared';

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

  private createCompletionOptions(messages: any[], maxOutputTokens: number): any {
    const isGpt5Family = this.model.startsWith('gpt-5');

    if (isGpt5Family) {
      return {
        model: this.model,
        messages,
        max_completion_tokens: maxOutputTokens,
      };
    }

    return {
      model: this.model,
      messages,
      max_tokens: maxOutputTokens,
      temperature: this.temperature,
    };
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

      const analysis = this.parseJsonResponse(content);
      
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

      const analysis = this.parseJsonResponse(content);

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

  async generateNutritionAdvice(userStats: any, context?: string): Promise<string> {
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
      const aiPrompt = `
        You are a friendly nutrition coach. Propose updated user goals based on request.

        Current dailyCalorieGoal: ${userContext.dailyCalorieGoal || 2000}
        Current activityLevel: ${userContext.activityLevel || 'moderate'}
        User request: ${prompt}

        Return ONLY valid JSON:
        {
          "dailyCalorieGoal": number between 800 and 5000,
          "activityLevel": one of ["sedentary","light","moderate","active","very_active"],
          "message": "short friendly explanation in the user's language"
        }
      `;

      const response = await this.openai!.chat.completions.create(
        this.createCompletionOptions([{ role: 'user', content: aiPrompt }], 300)
      );

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const parsed = this.parseJsonResponse(content);
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

  async chat(messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>, userContext?: any): Promise<string> {
    this.ensureInitialized();
    
    try {
      // Add system message with nutrition context if available
      const systemMessage = {
        role: 'system' as const,
        content: `You are evoFlowAI, an expert nutrition assistant with the tone of a kind personal trainer and dietitian.
        You help users track meals, understand their habits, and improve health step by step.
        Your tone is warm, practical, motivating, and never judgmental.
        Use short, actionable advice and celebrate small wins.
        Prefer the user's language when possible.
        
        ${userContext ? `
        User Context:
        - Daily calorie goal: ${userContext.dailyCalorieGoal || 'Not set'}
        - Activity level: ${userContext.activityLevel || 'Unknown'}
        - Dietary restrictions: ${userContext.dietaryRestrictions?.join(', ') || 'None'}
        ${userContext.todayStats ? `
        - Today's intake: ${userContext.todayStats.calories} kcal (${userContext.todayStats.protein}g protein, ${userContext.todayStats.carbs}g carbs, ${userContext.todayStats.fat}g fat)
        ` : ''}
        ` : ''}
        
        Keep responses concise (2-3 short paragraphs max) unless the user asks for detailed information.
        Every answer should include at least one concrete next step.`
      };

      const response = await this.openai!.chat.completions.create(
        this.createCompletionOptions([systemMessage, ...messages], 500)
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
    consumedCalories: number;
    consumedProtein: number;
    caloriesBurned: number;
    remainingCalories: number;
    remainingProtein: number;
  }): Promise<{ summary: string; tips: string[] }> {
    this.ensureInitialized();

    const prompt = `
      You are evoFlowAI, a supportive nutrition and training coach.
      Build short dashboard insights for one day.

      Day: ${input.date}
      Calorie goal: ${input.calorieGoal}
      Protein goal: ${input.proteinGoal}g
      Consumed calories: ${input.consumedCalories}
      Consumed protein: ${input.consumedProtein}g
      Burned calories (training): ${input.caloriesBurned}
      Remaining calories (net): ${input.remainingCalories}
      Remaining protein: ${input.remainingProtein}g

      Return JSON only:
      {
        "summary": "1 short motivating paragraph, max 2 sentences",
        "tips": ["tip 1", "tip 2", "tip 3"]
      }

      Rules:
      - 2 to 3 tips only
      - each tip max 1 sentence
      - practical next steps, no generic fluff
      - mention protein and recovery when relevant
      - sometimes add one relevant emoji (not always), max one emoji per sentence
    `;

    const response = await this.openai!.chat.completions.create(
      this.createCompletionOptions([{ role: 'user', content: prompt }], 350)
    );

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = this.parseJsonResponse(content);
    const summary = String(parsed.summary || '').trim();
    const rawTips = Array.isArray(parsed.tips) ? parsed.tips : [];
    const tips = rawTips.map((tip: unknown) => String(tip || '').trim()).filter(Boolean).slice(0, 3);

    if (!summary || tips.length === 0) {
      throw new Error('Invalid AI insight response');
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

  private parseJsonResponse(content: string): any {
    const cleaned = content
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    return JSON.parse(cleaned);
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
