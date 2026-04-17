import { AuthenticationError, UserInputError } from 'apollo-server-express';
import { Context } from '../context';
import { OpenAIService } from '../../services/openaiService';
import { FoodItem } from '../../models/FoodItem';
import { Workout } from '../../models/Workout';
import { DailyActivity } from '../../models/DailyActivity';
import { CoachProPlan } from '../../models/CoachProPlan';
import { getDailyMetrics, normalizeDateKey } from '../../utils/dailyMetrics';

const openAIService = new OpenAIService();

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const AI_ONLY_COACH_PRO_MODE = true;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const toInt = (value: unknown, fallback = 0) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.round(numeric);
};
const genericMealNamePattern =
  /(performance\s*bowl|balanced\s*meal|meal\s*\d+|protein\s*carb\s*dinner\s*set|performance\s*dish|cuisine|generic)/i;
const metaDescriptionPattern =
  /(includes user staples|when practical|built around|cookable in real life|real-food|real world adherence|practical ingredients)/gi;

const titleCase = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase())
    .join(' ');

const normalizeDishNameFromDescription = (description: string, mealType: string) => {
  const cleaned = String(description || '')
    .replace(/balanced|performance|generic|ideal|optimized/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned && cleaned.length >= 12) {
    const firstSentence = cleaned.split('.')[0]?.trim() || cleaned;
    if (firstSentence.length >= 12 && !genericMealNamePattern.test(firstSentence)) {
      return titleCase(firstSentence);
    }
  }

  const fallbackByMealType: Record<string, string> = {
    breakfast: 'Scrambled eggs with spinach, feta and whole grain toast',
    lunch: 'Grilled chicken breast with rice and roasted vegetables',
    dinner: 'Salmon with potatoes and green beans',
    snack: 'Greek yogurt with berries and chopped nuts',
  };
  const normalizedType = String(mealType || '').toLowerCase();
  return fallbackByMealType[normalizedType] || 'Chicken, rice and roasted vegetables bowl';
};

const removeDiacritics = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const sanitizeTextToken = (value: string) =>
  removeDiacritics(String(value || '').toLowerCase()).replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

const translationHints: Record<string, string> = {
  'kuchnia wloska': 'italian cuisine',
  'kuchnia włoska': 'italian cuisine',
  'placek po wegiersku': 'hungarian-style potato pancake',
  'placki po wegiersku': 'hungarian-style potato pancakes',
};

type NormalizedFoodPreferences = {
  favoriteCuisines: string[];
  favoriteDishes: string[];
  favoriteIngredients: string[];
  preferredMealStyles: string[];
  softDislikes: string[];
  hardExclusions: string[];
  mealPrepStaples: string[];
  forbiddenUiPhrases: string[];
};

const cuisineKeywords: Record<string, string> = {
  italian: 'Italian',
  mediterranean: 'Mediterranean',
  polish: 'Polish',
  mexican: 'Mexican',
  asian: 'Asian',
  japanese: 'Japanese',
  thai: 'Thai',
  indian: 'Indian',
};

const ingredientKeywords = new Set([
  'chicken',
  'turkey',
  'beef',
  'salmon',
  'tuna',
  'tofu',
  'eggs',
  'rice',
  'potatoes',
  'oats',
  'pasta',
  'yogurt',
  'spinach',
  'broccoli',
  'tomato',
  'avocado',
  'wrap',
]);

const styleKeywords = new Set(['high protein', 'quick', 'budget', 'low carb', 'meal prep', 'comfort', 'balanced']);

const normalizePreferenceInput = (token: string) => {
  const raw = String(token || '').trim();
  if (!raw) return '';
  const lower = raw.toLowerCase();
  const mapped = translationHints[lower] || translationHints[sanitizeTextToken(raw)] || raw;
  return mapped.trim();
};

const categorizePreferenceToken = (token: string) => {
  const normalized = normalizePreferenceInput(token);
  const key = sanitizeTextToken(normalized);
  if (!key) return { type: 'unknown' as const, value: '' };

  if (/^(no|without|avoid|exclude)\s+/.test(key)) {
    return { type: 'hardExclusion' as const, value: key.replace(/^(no|without|avoid|exclude)\s+/, '').trim() };
  }

  if (key.includes('cuisine')) {
    return { type: 'cuisine' as const, value: titleCase(normalized.replace(/cuisine/i, '').trim()) };
  }

  for (const [keyword, label] of Object.entries(cuisineKeywords)) {
    if (key.includes(keyword)) {
      return { type: 'cuisine' as const, value: label };
    }
  }

  for (const style of styleKeywords) {
    if (key.includes(style)) {
      return { type: 'style' as const, value: titleCase(style) };
    }
  }

  for (const ingredient of ingredientKeywords) {
    if (key.includes(ingredient)) {
      return { type: 'ingredient' as const, value: titleCase(ingredient) };
    }
  }

  if (key.split(' ').length >= 2) {
    return { type: 'dish' as const, value: titleCase(normalized) };
  }

  return { type: 'ingredient' as const, value: titleCase(normalized) };
};

const buildNormalizedFoodPreferences = (setup: any): NormalizedFoodPreferences => {
  const hardExclusions = [...(setup?.nutrition?.hardExclusions || []), ...(setup?.nutrition?.allergies || [])]
    .map((token) => normalizePreferenceInput(token))
    .filter(Boolean);
  const softDislikes = (setup?.nutrition?.softDislikes || []).map((token: string) => normalizePreferenceInput(token)).filter(Boolean);
  const favoriteFoods = (setup?.nutrition?.favoriteFoods || []).map((token: string) => normalizePreferenceInput(token)).filter(Boolean);
  const staples = (setup?.nutrition?.stapleFoods || []).map((token: string) => normalizePreferenceInput(token)).filter(Boolean);
  const preferredMealStyles = (setup?.nutrition?.preferredStyles || [])
    .map((entry: string) => titleCase(String(entry).replace(/_/g, ' ').toLowerCase()))
    .filter(Boolean);

  const cuisines = new Set<string>();
  const dishes = new Set<string>();
  const ingredients = new Set<string>();
  const forbiddenUiPhrases = new Set<string>([
    ...hardExclusions,
    ...softDislikes,
    ...favoriteFoods,
    ...staples,
  ]);

  [...favoriteFoods, ...staples].forEach((token) => {
    const parsed = categorizePreferenceToken(token);
    if (!parsed.value) return;
    if (parsed.type === 'cuisine') cuisines.add(parsed.value);
    else if (parsed.type === 'dish') dishes.add(parsed.value);
    else if (parsed.type === 'ingredient') ingredients.add(parsed.value);
  });

  return {
    favoriteCuisines: Array.from(cuisines).slice(0, 4),
    favoriteDishes: Array.from(dishes).slice(0, 5),
    favoriteIngredients: Array.from(ingredients).slice(0, 8),
    preferredMealStyles,
    softDislikes,
    hardExclusions,
    mealPrepStaples: staples.slice(0, 8),
    forbiddenUiPhrases: Array.from(forbiddenUiPhrases).slice(0, 16),
  };
};

type MealNormalizationOptions = {
  forbiddenUiPhrases?: string[];
};

const sanitizeMealDescription = (description: string, fallbackDishName: string, options?: MealNormalizationOptions) => {
  const cleaned = String(description || '')
    .replace(metaDescriptionPattern, '')
    .replace(/\blike\s+[^.;]+/gi, '')
    .replace(/\bpractical and\b/gi, '')
    .replace(/\s*\.\s*/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
  const forbidden = (options?.forbiddenUiPhrases || [])
    .filter(Boolean)
    .map((entry) => sanitizeTextToken(entry));
  const containsForbidden = forbidden.some((phrase) => phrase.length > 2 && sanitizeTextToken(cleaned).includes(phrase));
  const hasPolishLeak = /(placek|placki|kuchnia|wegiersk|wlosk|włoska|po\s+wegiersku)/i.test(cleaned);
  const hasNonAsciiLeak = /[^\x00-\x7F]/.test(cleaned);

  if (cleaned.length >= 24 && !containsForbidden && !hasPolishLeak && !hasNonAsciiLeak) return cleaned;
  return `${fallbackDishName} with simple preparation, satisfying texture, and balanced macros for the day.`;
};

const sanitizeMealType = (mealType: string, indexHint: number = 0) => {
  const raw = String(mealType || '').trim().toLowerCase();
  if (raw.includes('breakfast')) return 'Breakfast';
  if (raw.includes('lunch')) return 'Lunch';
  if (raw.includes('dinner')) return 'Dinner';
  if (raw.includes('snack')) return 'Snack';
  if (indexHint === 0) return 'Breakfast';
  if (indexHint >= 2) return 'Dinner';
  return 'Lunch';
};

const deriveTagsForMeal = (meal: any) => {
  const tags = new Set<string>();
  const prepTime = Number(meal?.prepTimeMinutes || 0);
  const protein = Number(meal?.estimatedProtein || 0);
  const calories = Number(meal?.estimatedCalories || 0);
  const type = sanitizeMealType(String(meal?.mealType || ''));
  if (protein >= 30) tags.add('high protein');
  if (prepTime > 0 && prepTime <= 20) tags.add('quick');
  if (String(meal?.mealPrepNote || '').trim()) tags.add('meal prep');
  if (calories <= 520) tags.add('budget-friendly');
  if (type === 'Dinner' && protein >= 28) tags.add('recovery meal');
  if (type === 'Breakfast') tags.add('pre-workout');
  if (type === 'Lunch' || type === 'Dinner') tags.add('post-workout');
  return Array.from(tags).slice(0, 5);
};

const fallbackIngredientsForMeal = (meal: any, fallbackName: string) => {
  const protein = Math.max(20, Number(meal?.estimatedProtein || 30));
  const carbs = Math.max(20, Number(meal?.estimatedCarbs || 40));
  const fat = Math.max(8, Number(meal?.estimatedFat || 14));
  return [
    { item: fallbackName.split(' with ')[0] || 'Main protein source', quantity: `${Math.round(protein * 3.8)} g` },
    { item: 'Dry rice / oats / potatoes', quantity: `${Math.round(carbs * 1.5)} g` },
    { item: 'Seasonal vegetables', quantity: '150 g' },
    { item: 'Olive oil', quantity: `${Math.max(1, Math.round(fat / 5))} tsp` },
    { item: 'Salt, pepper, lemon juice', quantity: 'to taste' },
  ];
};

const normalizeIngredients = (meal: any, fallbackName: string) => {
  const raw = Array.isArray(meal?.ingredients) ? meal.ingredients : [];
  const normalized = raw
    .map((entry: any) => ({
      item: String(entry?.item || entry?.name || '').trim(),
      quantity: String(entry?.quantity || '').trim(),
    }))
    .filter((entry: any) => entry.item.length > 0 && entry.quantity.length > 0);
  return normalized.length >= 3 ? normalized : fallbackIngredientsForMeal(meal, fallbackName);
};

const fallbackRecipeStepsForMeal = (meal: any, dishName: string) => {
  const prep = Math.max(10, Number(meal?.prepTimeMinutes || 20));
  const shortDishName = String(dishName || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90);
  return [
    `Prepare ingredients and preheat the pan or oven for ${shortDishName || 'this meal'}.`,
    'Cook the carb base according to package instructions.',
    'Season the protein and vegetables with salt, pepper, and herbs.',
    `Cook the protein and vegetables until done (${Math.max(8, Math.round(prep * 0.55))}-${Math.max(12, Math.round(prep * 0.8))} minutes).`,
    'Plate everything together, adjust seasoning and serve warm.',
  ];
};

const normalizeRecipeSteps = (meal: any, dishName: string) => {
  const steps = Array.isArray(meal?.recipeSteps) ? meal.recipeSteps : [];
  const normalized = steps.map((step: any) => String(step || '').trim()).filter(Boolean);
  return normalized.length >= 3 ? normalized.slice(0, 8) : fallbackRecipeStepsForMeal(meal, dishName);
};

const normalizeSatietyLabel = (meal: any) => {
  const protein = Number(meal?.estimatedProtein || 0);
  const fiber = Number(meal?.fiberGrams || 0);
  if (protein >= 35 || fiber >= 9) return 'High';
  if (protein >= 22 || fiber >= 5) return 'Medium';
  return 'Light';
};

const normalizeTags = (meal: any) => {
  const rawTags = Array.isArray(meal?.tags) ? meal.tags : [];
  const sanitized = rawTags.map((tag: any) => String(tag || '').trim()).filter(Boolean);
  const fallback = deriveTagsForMeal(meal);
  return (sanitized.length > 0 ? sanitized : fallback).slice(0, 7);
};

const containsForbiddenPhrase = (value: string, options?: MealNormalizationOptions) => {
  const normalizedValue = sanitizeTextToken(value);
  const forbidden = (options?.forbiddenUiPhrases || [])
    .map((entry) => sanitizeTextToken(entry))
    .filter((entry) => entry.length > 2);
  return forbidden.some((phrase) => normalizedValue.includes(phrase));
};

const enforceMealRealism = (plan: any, options?: MealNormalizationOptions) => {
  if (!plan || !Array.isArray(plan.weeklyNutrition)) return plan;

  const normalizedWeeklyNutrition = plan.weeklyNutrition.map((day: any) => {
    const normalizedMeals = (Array.isArray(day?.meals) ? day.meals : []).map((meal: any, index: number) => {
      const rawName = String(meal?.name || '').trim();
      const rawDescription = String(meal?.description || '').trim();
      const shouldReplaceName =
        !rawName || rawName.length < 6 || genericMealNamePattern.test(rawName) || containsForbiddenPhrase(rawName, options);
      const realisticName = shouldReplaceName
        ? normalizeDishNameFromDescription(rawDescription, String(meal?.mealType || ''))
        : rawName;
      const normalizedMealType = sanitizeMealType(String(meal?.mealType || ''), index);

      const normalizedDescription = sanitizeMealDescription(rawDescription, realisticName, options);

      const ingredients = normalizeIngredients(meal, realisticName);
      const recipeSteps = normalizeRecipeSteps(meal, realisticName);
      const tags = normalizeTags(meal);
      const fiberGrams = Number.isFinite(Number(meal?.fiberGrams))
        ? Math.max(0, Math.round(Number(meal?.fiberGrams)))
        : Math.max(4, Math.round(Number(meal?.estimatedCarbs || 0) / 11));
      const suggestedUse =
        String(meal?.suggestedUse || '').trim() ||
        (normalizedMealType === 'Breakfast'
          ? 'Pre-workout'
          : Number(meal?.estimatedProtein || 0) >= 30
            ? 'Post-workout'
            : 'Rest day');

      return {
        ...meal,
        mealType: normalizedMealType,
        name: realisticName,
        description: normalizedDescription,
        tags,
        ingredients,
        recipeSteps,
        fiberGrams,
        estimatedSatiety: String(meal?.estimatedSatiety || '').trim() || normalizeSatietyLabel({ ...meal, fiberGrams }),
        suggestedUse,
        rationale:
          String(meal?.rationale || '').trim() ||
          `Fits your weekly targets while keeping prep time realistic and adherence high.`,
      };
    });

    return {
      ...day,
      meals: normalizedMeals,
    };
  });

  return {
    ...plan,
    weeklyNutrition: normalizedWeeklyNutrition,
  };
};

const buildFallbackCoachProPlan = (input: {
  setup: any;
  userContext: any;
}) => {
  const normalizedPreferences = buildNormalizedFoodPreferences(input.setup);
  const dailyCalories = Number(input.userContext?.preferences?.dailyCalorieGoal || 2200);
  const proteinGoal = Number(input.userContext?.preferences?.proteinGoal || 150);
  const carbsGoal = Number(input.userContext?.preferences?.carbsGoal || 220);
  const fatGoal = Number(input.userContext?.preferences?.fatGoal || 70);
  const trainingDays = clamp(Number(input.setup?.training?.realisticDaysPerWeek || 4), 2, 7);
  const mealsPerDay = clamp(Number(input.setup?.nutrition?.mealsPerDay || 3), 2, 6);
  const exclusions = new Set(normalizedPreferences.hardExclusions.map((entry) => sanitizeTextToken(entry)));
  const softDislikes = new Set(normalizedPreferences.softDislikes.map((entry) => sanitizeTextToken(entry)));

  const shouldAvoid = (value: string) => {
    const token = sanitizeTextToken(value);
    if (!token) return false;
    if (Array.from(exclusions).some((entry) => token.includes(entry) || entry.includes(token))) return true;
    return false;
  };

  const canUseIfPossible = (value: string) => {
    const token = sanitizeTextToken(value);
    if (!token) return true;
    return !Array.from(softDislikes).some((entry) => token.includes(entry) || entry.includes(token));
  };

  const proteinsBase = ['Chicken Breast', 'Turkey', 'Eggs', 'Greek Yogurt', 'Tofu', 'Salmon'];
  const carbsBase = ['Rice', 'Oats', 'Potatoes', 'Whole Grain Wrap', 'Tagliatelle'];
  const veggiesBase = ['Spinach', 'Broccoli', 'Tomatoes', 'Bell Peppers', 'Cucumber', 'Zucchini'];
  const fats = ['olive oil', 'avocado', 'nuts'];
  const saucesBase = ['yogurt herb sauce', 'light tomato sauce', 'lemon-garlic dressing', 'olive oil and herbs'];

  const proteins = [...normalizedPreferences.favoriteIngredients, ...proteinsBase]
    .map((entry) => titleCase(entry))
    .filter((entry, index, array) => array.indexOf(entry) === index)
    .filter((entry) => !shouldAvoid(entry));
  const carbs = [...carbsBase].filter((entry) => !shouldAvoid(entry));
  const veggies = [...veggiesBase].filter((entry) => !shouldAvoid(entry));
  const sauces = [...saucesBase].filter((entry) => !shouldAvoid(entry));
  const cuisines = normalizedPreferences.favoriteCuisines.length > 0 ? normalizedPreferences.favoriteCuisines : ['Mediterranean', 'Italian'];

  const proteinPool = proteins.length > 0 ? proteins : ['Chicken Breast', 'Salmon', 'Eggs'];
  const carbPool = carbs.length > 0 ? carbs : ['Rice', 'Potatoes', 'Whole Grain Wrap'];
  const veggiePool = veggies.length > 0 ? veggies : ['Spinach', 'Broccoli', 'Tomatoes'];
  const saucePool = sauces.length > 0 ? sauces : ['yogurt herb sauce', 'light tomato sauce'];

  const breakfastCandidates = [
    {
      name: 'Scrambled eggs with spinach and whole grain toast',
      description: 'A savory high-protein breakfast with fluffy eggs, spinach, and crispy whole grain toast.',
      prepTimeMinutes: 18,
      tags: ['high protein', 'quick', 'meal prep'],
      ingredients: [
        { item: 'eggs', quantity: '3 medium' },
        { item: 'spinach', quantity: '80 g' },
        { item: 'whole grain bread', quantity: '2 slices' },
        { item: 'olive oil', quantity: '1 tsp' },
      ],
    },
    {
      name: 'Greek yogurt bowl with oats, berries and chopped nuts',
      description: 'Creamy yogurt, rolled oats, and berries for a filling breakfast with steady energy.',
      prepTimeMinutes: 10,
      tags: ['high protein', 'quick'],
      ingredients: [
        { item: 'greek yogurt', quantity: '250 g' },
        { item: 'rolled oats', quantity: '45 g' },
        { item: 'berries', quantity: '100 g' },
        { item: 'chopped nuts', quantity: '15 g' },
      ],
    },
    {
      name: 'Protein pancakes with skyr and fruit',
      description: 'Light protein pancakes served with skyr and fresh fruit for a sweet but balanced start.',
      prepTimeMinutes: 20,
      tags: ['high protein', 'meal prep'],
      ingredients: [
        { item: 'oat flour', quantity: '60 g' },
        { item: 'eggs', quantity: '2 medium' },
        { item: 'skyr', quantity: '120 g' },
        { item: 'seasonal fruit', quantity: '120 g' },
      ],
    },
    {
      name: 'Cottage cheese toast with tomatoes and herbs',
      description: 'Crisp toast topped with cottage cheese, juicy tomatoes, and fresh herbs.',
      prepTimeMinutes: 12,
      tags: ['quick', 'budget-friendly'],
      ingredients: [
        { item: 'whole grain bread', quantity: '2 slices' },
        { item: 'cottage cheese', quantity: '180 g' },
        { item: 'tomatoes', quantity: '120 g' },
        { item: 'fresh herbs', quantity: '1 tbsp' },
      ],
    },
  ].filter((candidate) => candidate.ingredients.every((ingredient) => !shouldAvoid(ingredient.item)));

  const lunchCandidates = Array.from({ length: 12 }).map((_, index) => {
    const protein = proteinPool[index % proteinPool.length];
    const carb = carbPool[(index + 1) % carbPool.length];
    const veggie = veggiePool[(index + 2) % veggiePool.length];
    const sauce = saucePool[index % saucePool.length];
    const cuisine = cuisines[index % cuisines.length];
    const format = index % 2 === 0 ? 'bowl' : index % 3 === 0 ? 'wrap' : 'plate';

    const name =
      format === 'wrap'
        ? `${protein} wrap with ${veggie} and ${sauce}`
        : `${protein} ${format} with ${carb} and ${veggie}`;
    const description =
      format === 'wrap'
        ? `Tender ${protein.toLowerCase()} with crisp vegetables and a ${sauce} in a warm whole grain wrap.`
        : `${cuisine}-inspired ${protein.toLowerCase()} served with ${carb.toLowerCase()} and ${veggie.toLowerCase()} for a balanced lunch.`;

    return {
      name,
      description,
      prepTimeMinutes: format === 'wrap' ? 16 : 22,
      tags: ['high protein', 'meal prep', canUseIfPossible(carb) ? 'balanced' : 'quick'],
      ingredients: [
        { item: protein.toLowerCase(), quantity: '160 g' },
        { item: carb.toLowerCase(), quantity: format === 'wrap' ? '1 medium wrap' : '75 g dry' },
        { item: veggie.toLowerCase(), quantity: '150 g' },
        { item: sauce, quantity: '2 tbsp' },
      ],
    };
  });

  const dinnerCandidates = Array.from({ length: 12 }).map((_, index) => {
    const protein = proteinPool[(index + 2) % proteinPool.length];
    const carb = carbPool[index % carbPool.length];
    const veggie = veggiePool[(index + 3) % veggiePool.length];
    const sauce = saucePool[(index + 1) % saucePool.length];
    const cuisine = cuisines[(index + 1) % cuisines.length];
    const plating = index % 2 === 0 ? 'tray bake' : 'skillet';

    return {
      name: `${cuisine}-style ${protein} with ${carb} and ${veggie}`,
      description: `${protein} cooked as a ${plating} dish, served with ${carb.toLowerCase()} and ${veggie.toLowerCase()} for a satisfying evening meal.`,
      prepTimeMinutes: 24,
      tags: ['high protein', 'recovery meal', 'meal prep'],
      ingredients: [
        { item: protein.toLowerCase(), quantity: '170 g' },
        { item: carb.toLowerCase(), quantity: '80 g dry' },
        { item: veggie.toLowerCase(), quantity: '180 g' },
        { item: sauce, quantity: '2 tbsp' },
      ],
    };
  });

  normalizedPreferences.favoriteDishes.slice(0, 2).forEach((dish, index) => {
    const title = dish.toLowerCase().includes('hungarian') ? 'Hungarian-style potato pancake with beef and peppers' : dish;
    lunchCandidates.unshift({
      name: title,
      description: `A favorite-inspired dish adapted to your weekly targets with practical portions and balanced macros.`,
      prepTimeMinutes: 25 + index * 2,
      tags: ['favorite', 'balanced'],
      ingredients: [
        { item: 'lean protein source', quantity: '150 g' },
        { item: 'carb base', quantity: '70 g dry' },
        { item: 'seasonal vegetables', quantity: '150 g' },
        { item: 'light sauce', quantity: '2 tbsp' },
      ],
    });
  });

  const snackCandidates = [
    {
      name: 'Skyr with berries and almonds',
      description: 'A quick protein-rich snack with berries and crunchy almonds.',
      prepTimeMinutes: 5,
      tags: ['high protein', 'quick'],
      ingredients: [
        { item: 'skyr', quantity: '200 g' },
        { item: 'berries', quantity: '80 g' },
        { item: 'almonds', quantity: '12 g' },
      ],
    },
    {
      name: 'Cottage cheese with cucumber and herbs',
      description: 'Savory cottage cheese snack with cucumber and fresh herbs.',
      prepTimeMinutes: 6,
      tags: ['high protein', 'quick', 'budget-friendly'],
      ingredients: [
        { item: 'cottage cheese', quantity: '180 g' },
        { item: 'cucumber', quantity: '100 g' },
        { item: 'fresh herbs', quantity: '1 tbsp' },
      ],
    },
  ];

  const chooseCandidate = (
    candidates: Array<{ name: string } & Record<string, any>>,
    usageMap: Map<string, number>,
    recent: string[],
    maxRepeats: number,
    dayIndex: number
  ) => {
    const sorted = [...candidates].sort((a, b) => {
      const aCount = usageMap.get(a.name) || 0;
      const bCount = usageMap.get(b.name) || 0;
      if (aCount !== bCount) return aCount - bCount;
      return a.name.localeCompare(b.name);
    });
    const rotated = sorted.slice(dayIndex % sorted.length).concat(sorted.slice(0, dayIndex % sorted.length));
    const selected =
      rotated.find((candidate) => (usageMap.get(candidate.name) || 0) < maxRepeats && !recent.includes(candidate.name)) ||
      rotated.find((candidate) => (usageMap.get(candidate.name) || 0) < maxRepeats) ||
      rotated[0];
    usageMap.set(selected.name, (usageMap.get(selected.name) || 0) + 1);
    return selected;
  };

  const mealTypeSlots = Array.from({ length: mealsPerDay }).map((_, index) => {
    if (index === 0) return 'Breakfast';
    if (index === mealsPerDay - 1) return 'Dinner';
    if (mealsPerDay >= 4 && index === mealsPerDay - 2) return 'Snack';
    return 'Lunch';
  });

  const slotUsage = new Map<string, Map<string, number>>();
  const slotRecent = new Map<string, string[]>();
  mealTypeSlots.forEach((slot) => {
    slotUsage.set(slot, new Map());
    slotRecent.set(slot, []);
  });

  const weeklyNutrition = DAYS.map((dayLabel, dayIndex) => {
    const meals = Array.from({ length: mealsPerDay }).map((_, mealIndex) => {
      const mealCalories = Math.round(dailyCalories / mealsPerDay);
      const mealProtein = Math.round(proteinGoal / mealsPerDay);
      const mealCarbs = Math.round(carbsGoal / mealsPerDay);
      const mealFat = Math.round(fatGoal / mealsPerDay);
      const mealType = mealTypeSlots[mealIndex];
      const usageMap = slotUsage.get(mealType) || new Map<string, number>();
      const recent = slotRecent.get(mealType) || [];
      const maxRepeats = mealType === 'Breakfast' ? 3 : 2;
      const candidatePool =
        mealType === 'Breakfast'
          ? breakfastCandidates
          : mealType === 'Lunch'
            ? lunchCandidates
            : mealType === 'Snack'
              ? snackCandidates
              : dinnerCandidates;
      const selectedCandidate = chooseCandidate(candidatePool, usageMap, recent, maxRepeats, dayIndex + mealIndex);
      slotRecent.set(mealType, [...recent.slice(-1), selectedCandidate.name]);
      const recipeProteinHint =
        mealType === 'Breakfast'
          ? 'eggs or dairy base'
          : selectedCandidate.ingredients?.[0]?.item || 'protein source';

      return {
        mealType,
        name: selectedCandidate.name,
        description: selectedCandidate.description,
        estimatedCalories: mealCalories,
        estimatedProtein: mealProtein,
        estimatedCarbs: mealCarbs,
        estimatedFat: mealFat,
        fiberGrams: Math.max(4, Math.round(mealCarbs / 11)),
        estimatedSatiety: mealProtein >= 30 ? 'High' : 'Medium',
        suggestedUse: mealType === 'Breakfast' ? 'Pre-workout' : mealType === 'Dinner' ? 'Recovery meal' : 'Post-workout',
        prepTimeMinutes: selectedCandidate.prepTimeMinutes,
        tags: Array.from(new Set([...(selectedCandidate.tags || []), input.setup?.nutrition?.wantsMealPrep ? 'meal prep' : 'quick'])).slice(0, 5),
        ingredients: selectedCandidate.ingredients,
        recipeSteps: [
          'Prepare all ingredients and start the carb base first if needed.',
          `Season and cook the ${recipeProteinHint} until fully done and lightly golden.`,
          'Cook vegetables until tender-crisp and keep the texture fresh.',
          'Combine components with sauce and adjust seasoning.',
          'Plate and serve warm.',
        ],
        substitutions: [`Swap the main protein or carb with a similar option while keeping portions close.`],
        mealPrepNote: 'Batch-cook key ingredients on Sunday and Wednesday.',
        rationale: 'Chosen to match your targets with practical prep and strong adherence potential.',
      };
    });

    return {
      dayLabel,
      calorieTarget: dailyCalories,
      proteinTarget: proteinGoal,
      carbsTarget: carbsGoal,
      fatTarget: fatGoal,
      meals,
    };
  });

  const weeklyTraining = DAYS.map((dayLabel, index) => {
    const isTrainingDay = index < trainingDays;
    if (!isTrainingDay) {
      return {
        dayLabel,
        sessionGoal: 'Recovery mobility and trunk control',
        workoutType: 'Recovery mobility',
        durationMinutes: 25,
        intensity: 'Low',
        structure: [
          { name: 'Joint prep flow', sets: '1', reps: '12 min', durationMinutes: 12, notes: 'Hips, thoracic, ankles' },
          { name: 'Core stability block', sets: '2', reps: '30-40 sec', durationMinutes: 8, notes: 'Dead bug + side plank' },
          { name: 'Easy walk cooldown', sets: '1', reps: '5 min', durationMinutes: 5, notes: 'Nasal breathing pace' },
        ],
        fallbackVersion: 'Do 12 minutes of mobility and skip the core block.',
        minimumViableVersion: 'Run one 6-minute mobility sequence.',
      };
    }

    const strengthDay = index % 2 === 0;
    return {
      dayLabel,
      sessionGoal: strengthDay
        ? 'Lower body strength + core stability'
        : 'Upper body hypertrophy + shoulder-friendly accessories',
      workoutType: strengthDay ? 'Strength progression' : 'Hypertrophy + conditioning',
      durationMinutes: clamp(Number(input.setup?.training?.preferredDurationMinutes || 45), 30, 90),
      intensity: input.setup?.training?.preferredIntensity || 'Moderate',
      structure: [
        { name: 'Warm-up ramp', sets: '1', reps: '8 min', durationMinutes: 8, notes: 'Dynamic movement + activation' },
        {
          name: strengthDay ? 'Main lift and support superset' : 'Press + pull hypertrophy block',
          sets: '4',
          reps: strengthDay ? '5-8' : '8-12',
          durationMinutes: 28,
          notes: strengthDay ? 'Progressive overload with stable tempo' : 'Controlled tempo, shoulder-friendly range',
        },
        { name: 'Accessory finisher', sets: '2-3', reps: '10-15', durationMinutes: 12, notes: 'Core or carries based on energy' },
        { name: 'Cooldown reset', sets: '1', reps: '5 min', durationMinutes: 5, notes: 'Breathing and mobility' },
      ],
      fallbackVersion: strengthDay
        ? 'Skip the accessory finisher and keep the main lift + one support exercise.'
        : 'Keep only press + pull main block and drop conditioning.',
      minimumViableVersion: strengthDay
        ? 'Do two top sets of the main lift plus one core movement.'
        : 'Do one press movement and one pull movement for two rounds.',
    };
  });

  return {
    generatedAt: new Date(),
    overview: {
      calorieTargetRange: `${Math.round(dailyCalories - 120)}-${Math.round(dailyCalories + 120)} kcal`,
      trainingFrequency: `${trainingDays} sessions / week`,
      planDifficulty: input.setup?.goals?.aggressiveness || 'BALANCED',
      expectedPace: 'Steady 1-2% weekly progress markers',
      flexibilityLevel: input.setup?.training?.strictOrFlexible || 'Flexible',
    },
    weeklyNutrition,
    weeklyTraining,
    rationale: [
      'Calorie and macro targets follow your current profile and preferences.',
      'Training split reflects realistic availability and recovery constraints.',
      'Meals are structured to maximize adherence with repeated core ingredients.',
    ],
    smartWarnings: [],
    shoppingList: {
      proteins,
      carbs,
      fats,
      vegetables: veggies,
      dairy: ['greek yogurt', 'cottage cheese'],
      extras: ['spices', 'lemon', 'frozen berries'],
      optionalItems: ['whey protein', 'electrolytes'],
    },
    substitutions: {
      ingredientSubstitutions: ['Chicken ↔ turkey ↔ tofu', 'Rice ↔ potatoes ↔ wraps'],
      mealSwaps: ['Swap lunch and dinner on busy days'],
      exerciseSubstitutions: ['Squat ↔ leg press', 'Bench press ↔ push-ups'],
      lowEnergyAlternatives: ['Reduce set count by 1 and keep form strict'],
      shortOnTimeAlternatives: ['Run minimum viable session (20-25 min)'],
    },
    coachNotes: [
      'Consistency this week matters more than perfect execution.',
      'Use meal prep anchors to reduce weekday decision fatigue.',
    ],
    hardestPartThisWeek: 'Maintaining protein timing during busy mid-week windows.',
    focusForBestResults: 'Hit protein floor daily and complete minimum viable sessions.',
    executionTips: ['Prepare 2 protein meal bases in advance', 'Schedule training times in calendar'],
    mealPrepTips: ['Batch-cook proteins twice weekly', 'Pre-cut vegetables for 3 days'],
    recoveryNote: 'Protect sleep quality and hydration, especially after higher-intensity days.',
    bestCasePlan: 'Complete full training schedule and all planned meal targets.',
    realisticPlan: 'Complete minimum viable training sessions and maintain protein consistency.',
  };
};

const applyAdaptiveActionFallback = (plan: any, action: string, note?: string) => {
  const nextPlan = { ...plan };
  const normalizedAction = String(action || '').toUpperCase();

  if (normalizedAction === 'SLEPT_BADLY' || normalizedAction === 'NEED_EASIER_DAY') {
    nextPlan.coachNotes = [
      ...(nextPlan.coachNotes || []),
      'Adaptive update: today session shifted to easier effort with mobility-first emphasis.',
    ];
    nextPlan.recoveryNote = 'Keep low-stress movement, hydrate early, and protect tonight sleep window.';
  }
  if (normalizedAction === 'ONLY_30_MINUTES') {
    nextPlan.executionTips = [
      ...(nextPlan.executionTips || []),
      'Adaptive update: keep warm-up + main block, skip final accessory block to fit 30 minutes.',
    ];
  }
  if (normalizedAction === 'ATE_MORE_THAN_PLANNED') {
    nextPlan.executionTips = [
      ...(nextPlan.executionTips || []),
      'Adaptive update: keep calories stable by using a lighter high-protein dinner and lower-fat add-ons.',
    ];
  }
  if (normalizedAction === 'SHOULDER_KNEE_ISSUE') {
    nextPlan.smartWarnings = [
      ...(nextPlan.smartWarnings || []),
      'Adaptive safety note: replace aggravating patterns and keep pain-free range with reduced load today.',
    ];
  }
  if (note) {
    nextPlan.coachNotes = [...(nextPlan.coachNotes || []), `User note: ${note}`];
  }

  return nextPlan;
};

const buildSignalSnapshot = (dayMetrics: any) => ({
  dateKey: String(dayMetrics.dateKey),
  consumedCalories: Math.round(Number(dayMetrics.totals?.calories || 0)),
  consumedProtein: Math.round(Number(dayMetrics.totals?.protein || 0)),
  workoutSessions: Number(dayMetrics.workoutTotals?.sessions || 0),
  steps: Number(dayMetrics.steps || 0),
  remainingCalories: Math.round(Number(dayMetrics.remainingCalories || 0)),
  remainingProtein: Math.round(Number(dayMetrics.remainingProtein || 0)),
});

const applyTodaySignalMutations = (plan: any, previous: any, next: any) => {
  const mutated = { ...plan };
  const coachNotes = Array.isArray(mutated.coachNotes) ? [...mutated.coachNotes] : [];
  const executionTips = Array.isArray(mutated.executionTips) ? [...mutated.executionTips] : [];
  const smartWarnings = Array.isArray(mutated.smartWarnings) ? [...mutated.smartWarnings] : [];

  if (previous?.workoutSessions !== undefined && next.workoutSessions > previous.workoutSessions) {
    coachNotes.push(`Live update: great consistency — you logged +${next.workoutSessions - previous.workoutSessions} workout session(s) today.`);
  }
  if (previous?.consumedProtein !== undefined && next.consumedProtein - previous.consumedProtein >= 20) {
    coachNotes.push(`Live update: protein intake improved by +${next.consumedProtein - previous.consumedProtein}g since last sync.`);
  }
  if (next.remainingProtein <= 25) {
    executionTips.push('Live cue: protein gap is now small — close the day with a light, balanced meal.');
  }
  if (next.remainingCalories < -150) {
    smartWarnings.push(`Live conflict: you are over today calorie budget by ${Math.abs(next.remainingCalories)} kcal. Use lighter meals for the rest of the day.`);
  }
  if (previous?.steps !== undefined && next.steps - previous.steps >= 3000) {
    coachNotes.push(`Live update: activity increased by +${next.steps - previous.steps} steps since last check.`);
  }

  mutated.coachNotes = [...new Set(coachNotes)].slice(-8);
  mutated.executionTips = [...new Set(executionTips)].slice(-8);
  mutated.smartWarnings = [...new Set(smartWarnings)].slice(0, 6);
  mutated.generatedAt = new Date().toISOString();

  return mutated;
};

const ensureCoachProPlanShape = (plan: any) => {
  const safePlan = plan && typeof plan === 'object' ? plan : {};
  const safeOverview = safePlan.overview && typeof safePlan.overview === 'object' ? safePlan.overview : {};
  const weeklyNutrition = Array.isArray(safePlan.weeklyNutrition) ? safePlan.weeklyNutrition : [];
  const weeklyTraining = Array.isArray(safePlan.weeklyTraining) ? safePlan.weeklyTraining : [];
  const safeShoppingList = safePlan.shoppingList && typeof safePlan.shoppingList === 'object' ? safePlan.shoppingList : {};
  const safeSubstitutions = safePlan.substitutions && typeof safePlan.substitutions === 'object' ? safePlan.substitutions : {};

  return {
    ...safePlan,
    overview: {
      calorieTargetRange: String(safeOverview.calorieTargetRange || ''),
      trainingFrequency: String(safeOverview.trainingFrequency || ''),
      planDifficulty: String(safeOverview.planDifficulty || ''),
      expectedPace: String(safeOverview.expectedPace || ''),
      flexibilityLevel: String(safeOverview.flexibilityLevel || ''),
    },
    weeklyNutrition: weeklyNutrition.map((day: any) => ({
      dayLabel: String(day?.dayLabel || ''),
      calorieTarget: toInt(day?.calorieTarget, 0),
      proteinTarget: toInt(day?.proteinTarget, 0),
      carbsTarget: toInt(day?.carbsTarget, 0),
      fatTarget: toInt(day?.fatTarget, 0),
      meals: (Array.isArray(day?.meals) ? day.meals : []).map((meal: any) => ({
        mealType: String(meal?.mealType || ''),
        name: String(meal?.name || ''),
        description: String(meal?.description || ''),
        estimatedCalories: toInt(meal?.estimatedCalories, 0),
        estimatedProtein: toInt(meal?.estimatedProtein, 0),
        estimatedCarbs: toInt(meal?.estimatedCarbs, 0),
        estimatedFat: toInt(meal?.estimatedFat, 0),
        fiberGrams: Number.isFinite(Number(meal?.fiberGrams)) ? toInt(meal?.fiberGrams, 0) : null,
        estimatedSatiety: meal?.estimatedSatiety ? String(meal.estimatedSatiety) : null,
        suggestedUse: meal?.suggestedUse ? String(meal.suggestedUse) : null,
        prepTimeMinutes: toInt(meal?.prepTimeMinutes, 0),
        tags: Array.isArray(meal?.tags) ? meal.tags.map((tag: any) => String(tag || '')).filter(Boolean) : [],
        ingredients: (Array.isArray(meal?.ingredients) ? meal.ingredients : []).map((entry: any) => ({
          item: String(entry?.item || ''),
          quantity: String(entry?.quantity || ''),
        })),
        recipeSteps: Array.isArray(meal?.recipeSteps) ? meal.recipeSteps.map((step: any) => String(step || '')).filter(Boolean) : [],
        substitutions: Array.isArray(meal?.substitutions) ? meal.substitutions.map((entry: any) => String(entry || '')).filter(Boolean) : [],
        mealPrepNote: meal?.mealPrepNote ? String(meal.mealPrepNote) : null,
        rationale: meal?.rationale ? String(meal.rationale) : null,
      })),
    })),
    weeklyTraining: weeklyTraining.map((session: any) => ({
      dayLabel: String(session?.dayLabel || ''),
      sessionGoal: String(session?.sessionGoal || ''),
      workoutType: String(session?.workoutType || ''),
      durationMinutes: toInt(session?.durationMinutes, 0),
      intensity: String(session?.intensity || ''),
      structure: (Array.isArray(session?.structure) ? session.structure : [])
        .map((block: any) => ({
          name: String(block?.name || '').trim(),
          sets: block?.sets ? String(block.sets) : null,
          reps: block?.reps ? String(block.reps) : null,
          durationMinutes: Number.isFinite(Number(block?.durationMinutes)) ? toInt(block?.durationMinutes, 0) : null,
          notes: block?.notes ? String(block.notes) : null,
        }))
        .filter((block: any) => block.name.length > 0),
      fallbackVersion: String(session?.fallbackVersion || ''),
      minimumViableVersion: String(session?.minimumViableVersion || ''),
    })),
    rationale: Array.isArray(safePlan.rationale) ? safePlan.rationale.map((entry: any) => String(entry || '')).filter(Boolean) : [],
    smartWarnings: Array.isArray(safePlan.smartWarnings) ? safePlan.smartWarnings.map((entry: any) => String(entry || '')).filter(Boolean) : [],
    shoppingList: {
      proteins: Array.isArray(safeShoppingList.proteins) ? safeShoppingList.proteins.map((entry: any) => String(entry || '')).filter(Boolean) : [],
      carbs: Array.isArray(safeShoppingList.carbs) ? safeShoppingList.carbs.map((entry: any) => String(entry || '')).filter(Boolean) : [],
      fats: Array.isArray(safeShoppingList.fats) ? safeShoppingList.fats.map((entry: any) => String(entry || '')).filter(Boolean) : [],
      vegetables: Array.isArray(safeShoppingList.vegetables)
        ? safeShoppingList.vegetables.map((entry: any) => String(entry || '')).filter(Boolean)
        : [],
      dairy: Array.isArray(safeShoppingList.dairy) ? safeShoppingList.dairy.map((entry: any) => String(entry || '')).filter(Boolean) : [],
      extras: Array.isArray(safeShoppingList.extras) ? safeShoppingList.extras.map((entry: any) => String(entry || '')).filter(Boolean) : [],
      optionalItems: Array.isArray(safeShoppingList.optionalItems)
        ? safeShoppingList.optionalItems.map((entry: any) => String(entry || '')).filter(Boolean)
        : [],
    },
    substitutions: {
      ingredientSubstitutions: Array.isArray(safeSubstitutions.ingredientSubstitutions)
        ? safeSubstitutions.ingredientSubstitutions.map((entry: any) => String(entry || '')).filter(Boolean)
        : [],
      mealSwaps: Array.isArray(safeSubstitutions.mealSwaps) ? safeSubstitutions.mealSwaps.map((entry: any) => String(entry || '')).filter(Boolean) : [],
      exerciseSubstitutions: Array.isArray(safeSubstitutions.exerciseSubstitutions)
        ? safeSubstitutions.exerciseSubstitutions.map((entry: any) => String(entry || '')).filter(Boolean)
        : [],
      lowEnergyAlternatives: Array.isArray(safeSubstitutions.lowEnergyAlternatives)
        ? safeSubstitutions.lowEnergyAlternatives.map((entry: any) => String(entry || '')).filter(Boolean)
        : [],
      shortOnTimeAlternatives: Array.isArray(safeSubstitutions.shortOnTimeAlternatives)
        ? safeSubstitutions.shortOnTimeAlternatives.map((entry: any) => String(entry || '')).filter(Boolean)
        : [],
    },
    coachNotes: Array.isArray(safePlan.coachNotes) ? safePlan.coachNotes.map((entry: any) => String(entry || '')).filter(Boolean) : [],
    hardestPartThisWeek: String(safePlan.hardestPartThisWeek || ''),
    focusForBestResults: String(safePlan.focusForBestResults || ''),
    executionTips: Array.isArray(safePlan.executionTips) ? safePlan.executionTips.map((entry: any) => String(entry || '')).filter(Boolean) : [],
    mealPrepTips: Array.isArray(safePlan.mealPrepTips) ? safePlan.mealPrepTips.map((entry: any) => String(entry || '')).filter(Boolean) : [],
    recoveryNote: String(safePlan.recoveryNote || ''),
    bestCasePlan: String(safePlan.bestCasePlan || ''),
    realisticPlan: String(safePlan.realisticPlan || ''),
  };
};

type NormalizationTrace = {
  applied: boolean;
  summary: string[];
  normalizedFields: string[];
};

type GenerationMeta = {
  generationSource: 'ai' | 'fallback' | 'unknown';
  fallbackReason: string | null;
  generationWarnings: string[];
  normalizationApplied: boolean;
  normalizationSummary: string[];
  normalizedFields: string[];
  shoppingListSource: 'ai' | 'fallback' | 'derived-from-fallback-bases' | 'derived-from-plan' | 'unknown';
  shoppingListWarnings: string[];
  sectionSources: string[];
  fallbackSections: string[];
  generationDebug?: {
    resolver: string;
    aiAttempted: boolean;
    aiSucceeded: boolean;
    fallbackTriggered: boolean;
  };
};

const DEFAULT_GENERATION_META: GenerationMeta = {
  generationSource: 'unknown',
  fallbackReason: null,
  generationWarnings: [],
  normalizationApplied: false,
  normalizationSummary: [],
  normalizedFields: [],
  shoppingListSource: 'unknown',
  shoppingListWarnings: [],
  sectionSources: [],
  fallbackSections: [],
};

const safeErrorMessage = (error: unknown): string => {
  const raw = error instanceof Error ? error.message : String(error || 'Unknown error');
  return raw.replace(/\s+/g, ' ').slice(0, 1200);
};

const textKey = (value: unknown) => sanitizeTextToken(String(value || ''));

const isMealDrawerDetailsReady = (meal: any) =>
  Array.isArray(meal?.ingredients) &&
  meal.ingredients.length >= 3 &&
  Array.isArray(meal?.recipeSteps) &&
  meal.recipeSteps.length >= 3;

const buildMealDrawerCacheKey = (input: { dayLabel: string; mealType: string; name: string }) =>
  `${textKey(input.dayLabel)}|${textKey(input.mealType)}|${textKey(input.name)}`;

const hasCoachProCriticalContent = (plan: any) => {
  const substitutions = plan?.substitutions || {};
  const hasArrayItems = (value: any) => Array.isArray(value) && value.length > 0;
  return (
    hasArrayItems(plan?.coachNotes) &&
    hasArrayItems(plan?.executionTips) &&
    hasArrayItems(plan?.mealPrepTips) &&
    hasArrayItems(plan?.rationale) &&
    typeof plan?.hardestPartThisWeek === 'string' &&
    plan.hardestPartThisWeek.trim().length > 0 &&
    typeof plan?.focusForBestResults === 'string' &&
    plan.focusForBestResults.trim().length > 0 &&
    typeof plan?.bestCasePlan === 'string' &&
    plan.bestCasePlan.trim().length > 0 &&
    typeof plan?.realisticPlan === 'string' &&
    plan.realisticPlan.trim().length > 0 &&
    hasArrayItems(substitutions?.ingredientSubstitutions) &&
    hasArrayItems(substitutions?.mealSwaps) &&
    hasArrayItems(substitutions?.exerciseSubstitutions) &&
    hasArrayItems(substitutions?.lowEnergyAlternatives) &&
    hasArrayItems(substitutions?.shortOnTimeAlternatives)
  );
};

const findCachedMealFromPlan = (plan: any, mealInput: { dayLabel: string; mealType: string; name: string }) => {
  const cache = plan?._mealDrawerCache && typeof plan._mealDrawerCache === 'object' ? plan._mealDrawerCache : {};
  const exactKey = buildMealDrawerCacheKey(mealInput);
  const exact = cache[exactKey];
  if (exact?.source === 'ai-drawer' && isMealDrawerDetailsReady(exact.details)) {
    return exact.details;
  }
  const loosePrefix = `${textKey(mealInput.dayLabel)}|`;
  const looseSuffix = `|${textKey(mealInput.name)}`;
  const matchKey = Object.keys(cache).find(
    (key) => key.startsWith(loosePrefix) && key.endsWith(looseSuffix) && cache[key]?.source === 'ai-drawer'
  );
  if (!matchKey) return null;
  const candidate = cache[matchKey]?.details;
  return isMealDrawerDetailsReady(candidate) ? candidate : null;
};

const persistMealDrawerDetailsInPlan = (
  plan: any,
  mealInput: { dayLabel: string; mealType: string; name: string },
  mealDetails: any
) => {
  const nextPlan = { ...(plan || {}) };
  const weeklyNutrition = Array.isArray(nextPlan?.weeklyNutrition) ? [...nextPlan.weeklyNutrition] : [];
  const dayKey = textKey(mealInput.dayLabel);
  const mealTypeKey = textKey(mealInput.mealType);
  const nameKey = textKey(mealInput.name);

  let updated = false;
  const tryMatch = (strictDay: boolean) => {
    for (let dayIndex = 0; dayIndex < weeklyNutrition.length; dayIndex += 1) {
      const day = weeklyNutrition[dayIndex];
      const dayMeals = Array.isArray(day?.meals) ? [...day.meals] : [];
      for (let mealIndex = 0; mealIndex < dayMeals.length; mealIndex += 1) {
        const meal = dayMeals[mealIndex];
        const dayMatches = !strictDay || textKey(day?.dayLabel) === dayKey;
        const mealMatches = textKey(meal?.mealType) === mealTypeKey && textKey(meal?.name) === nameKey;
        if (!dayMatches || !mealMatches) continue;
        dayMeals[mealIndex] = { ...meal, ...mealDetails };
        weeklyNutrition[dayIndex] = { ...day, meals: dayMeals };
        updated = true;
        return;
      }
    }
  };

  tryMatch(true);
  if (!updated) tryMatch(false);

  if (!updated) {
    const nextCache = {
      ...(nextPlan?._mealDrawerCache && typeof nextPlan._mealDrawerCache === 'object' ? nextPlan._mealDrawerCache : {}),
      [buildMealDrawerCacheKey(mealInput)]: {
        source: 'ai-drawer',
        cachedAt: new Date().toISOString(),
        details: mealDetails,
      },
    };
    return {
      plan: {
        ...nextPlan,
        _mealDrawerCache: nextCache,
      },
      updated: true,
    };
  }
  const nextCache = {
    ...(nextPlan?._mealDrawerCache && typeof nextPlan._mealDrawerCache === 'object' ? nextPlan._mealDrawerCache : {}),
    [buildMealDrawerCacheKey(mealInput)]: {
      source: 'ai-drawer',
      cachedAt: new Date().toISOString(),
      details: mealDetails,
    },
  };
  return {
    plan: {
      ...nextPlan,
      weeklyNutrition,
      _mealDrawerCache: nextCache,
    },
    updated: true,
  };
};

const flattenShoppingListItems = (shoppingList: any): string[] => {
  if (!shoppingList || typeof shoppingList !== 'object') return [];
  return Object.values(shoppingList)
    .flatMap((entry) => (Array.isArray(entry) ? entry : []))
    .map((item) => String(item || '').trim().toLowerCase())
    .filter(Boolean);
};

const extractMealIngredientItems = (plan: any): string[] => {
  if (!Array.isArray(plan?.weeklyNutrition)) return [];
  return plan.weeklyNutrition
    .flatMap((day: any) => (Array.isArray(day?.meals) ? day.meals : []))
    .flatMap((meal: any) => (Array.isArray(meal?.ingredients) ? meal.ingredients : []))
    .map((entry: any) => String(entry?.item || '').trim().toLowerCase())
    .filter(Boolean);
};

const detectFallbackLikeShoppingList = (plan: any) => {
  const warnings: string[] = [];
  const shopping = flattenShoppingListItems(plan?.shoppingList);
  const shoppingSet = new Set(shopping);
  const proteinsFallback = new Set(['chicken breast', 'eggs', 'greek yogurt', 'tofu', 'salmon']);
  const carbsFallback = new Set(['rice', 'oats', 'potatoes', 'whole grain wrap', 'tagliatelle']);
  const dairyFallback = new Set(['greek yogurt', 'cottage cheese']);

  const proteinsHits = [...proteinsFallback].filter((item) => shoppingSet.has(item)).length;
  const carbsHits = [...carbsFallback].filter((item) => shoppingSet.has(item)).length;
  const dairyHits = [...dairyFallback].filter((item) => shoppingSet.has(item)).length;

  if (proteinsHits >= 4 && carbsHits >= 3) {
    warnings.push('Shopping list appears to be derived from fallback ingredient bases');
  }
  if (dairyHits === dairyFallback.size) {
    warnings.push('Shopping list dairy section matches fallback defaults');
  }

  const mealIngredients = extractMealIngredientItems(plan);
  const mealSet = new Set(mealIngredients);
  const overlap = shopping.filter((item) => mealSet.has(item)).length;
  const coverage = shopping.length > 0 ? overlap / shopping.length : 0;

  const repeatedMealNames = (() => {
    const names = (plan?.weeklyNutrition || [])
      .flatMap((day: any) => (Array.isArray(day?.meals) ? day.meals : []))
      .map((meal: any) => String(meal?.name || '').trim().toLowerCase())
      .filter(Boolean);
    const unique = new Set(names);
    if (names.length < 6) return false;
    return unique.size / names.length < 0.58;
  })();

  if (repeatedMealNames) {
    warnings.push('Weekly menu shows high similarity to fallback candidate templates');
  }

  let source: GenerationMeta['shoppingListSource'] = 'unknown';
  if (coverage >= 0.45) source = 'derived-from-plan';
  else if (warnings.some((warning) => /fallback/i.test(warning))) source = 'derived-from-fallback-bases';

  return { source, warnings };
};

const deriveShoppingListFromPlan = (plan: any) => {
  const ingredients = extractMealIngredientItems(plan);
  const unique = Array.from(new Set(ingredients.map((item) => item.toLowerCase().trim()).filter(Boolean)));
  const buckets = {
    proteins: [] as string[],
    carbs: [] as string[],
    fats: [] as string[],
    vegetables: [] as string[],
    dairy: [] as string[],
    extras: [] as string[],
    optionalItems: [] as string[],
  };

  const hasAny = (value: string, entries: string[]) => entries.some((entry) => value.includes(entry));
  unique.forEach((item) => {
    if (hasAny(item, ['salt', 'pepper', 'spice', 'lemon juice', 'vinegar', 'mustard', 'sauce', 'herb'])) {
      buckets.extras.push(item);
    } else
    if (hasAny(item, ['chicken', 'turkey', 'beef', 'salmon', 'tuna', 'tofu', 'egg', 'yogurt', 'skyr', 'cottage'])) {
      buckets.proteins.push(item);
    } else if (hasAny(item, ['rice', 'oat', 'potato', 'wrap', 'bread', 'pasta', 'quinoa'])) {
      buckets.carbs.push(item);
    } else if (hasAny(item, ['olive oil', 'avocado', 'almond', 'nut', 'seed', 'peanut'])) {
      buckets.fats.push(item);
    } else if (hasAny(item, ['spinach', 'broccoli', 'tomato', 'cucumber', 'pepper', 'zucchini', 'lettuce', 'onion'])) {
      buckets.vegetables.push(item);
    } else if (hasAny(item, ['milk', 'cheese', 'yogurt', 'skyr', 'cottage'])) {
      buckets.dairy.push(item);
    } else {
      buckets.extras.push(item);
    }
  });

  const toTitle = (entry: string) =>
    entry
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

  return {
    proteins: buckets.proteins.map(toTitle),
    carbs: buckets.carbs.map(toTitle),
    fats: buckets.fats.map(toTitle),
    vegetables: buckets.vegetables.map(toTitle),
    dairy: buckets.dairy.map(toTitle),
    extras: buckets.extras.slice(0, 20).map(toTitle),
    optionalItems: buckets.optionalItems.map(toTitle),
  };
};

const enrichCoachProPlanDerivedFields = (plan: any) => {
  const next = { ...(plan || {}) };
  const safeShoppingList = next.shoppingList && typeof next.shoppingList === 'object' ? next.shoppingList : {};
  next.shoppingList = {
    proteins: Array.isArray(safeShoppingList.proteins) ? safeShoppingList.proteins : [],
    carbs: Array.isArray(safeShoppingList.carbs) ? safeShoppingList.carbs : [],
    fats: Array.isArray(safeShoppingList.fats) ? safeShoppingList.fats : [],
    vegetables: Array.isArray(safeShoppingList.vegetables) ? safeShoppingList.vegetables : [],
    dairy: Array.isArray(safeShoppingList.dairy) ? safeShoppingList.dairy : [],
    extras: Array.isArray(safeShoppingList.extras) ? safeShoppingList.extras : [],
    optionalItems: Array.isArray(safeShoppingList.optionalItems) ? safeShoppingList.optionalItems : [],
  };
  if (!Array.isArray(next.rationale)) next.rationale = [];
  if (!Array.isArray(next.smartWarnings)) next.smartWarnings = [];
  if (!Array.isArray(next.coachNotes)) next.coachNotes = [];
  if (!Array.isArray(next.executionTips)) next.executionTips = [];
  if (!Array.isArray(next.mealPrepTips)) next.mealPrepTips = [];
  if (!next.substitutions || typeof next.substitutions !== 'object') {
    next.substitutions = {
      ingredientSubstitutions: [],
      mealSwaps: [],
      exerciseSubstitutions: [],
      lowEnergyAlternatives: [],
      shortOnTimeAlternatives: [],
    };
  }

  return next;
};

const normalizePlanWithTrace = (rawPlan: any, options?: MealNormalizationOptions) => {
  if (AI_ONLY_COACH_PRO_MODE) {
    return {
      plan: ensureCoachProPlanShape(rawPlan),
      trace: {
        applied: false,
        summary: [],
        normalizedFields: [],
      } as NormalizationTrace,
    };
  }
  const beforeShape = ensureCoachProPlanShape(rawPlan);
  const before = JSON.parse(JSON.stringify(beforeShape));
  const after = enforceMealRealism(before, options);
  const counters = {
    name: 0,
    description: 0,
    tags: 0,
    ingredients: 0,
    steps: 0,
  };

  const beforeDays = Array.isArray(rawPlan?.weeklyNutrition) ? rawPlan.weeklyNutrition : [];
  const afterDays = Array.isArray(after?.weeklyNutrition) ? after.weeklyNutrition : [];
  afterDays.forEach((day: any, dayIndex: number) => {
    const beforeMeals = Array.isArray(beforeDays?.[dayIndex]?.meals) ? beforeDays[dayIndex].meals : [];
    const afterMeals = Array.isArray(day?.meals) ? day.meals : [];
    afterMeals.forEach((meal: any, mealIndex: number) => {
      const prevMeal = beforeMeals[mealIndex] || {};
      if (String(prevMeal?.name || '') !== String(meal?.name || '')) counters.name += 1;
      if (String(prevMeal?.description || '') !== String(meal?.description || '')) counters.description += 1;
      if (JSON.stringify(prevMeal?.tags || []) !== JSON.stringify(meal?.tags || [])) counters.tags += 1;
      if (JSON.stringify(prevMeal?.ingredients || []) !== JSON.stringify(meal?.ingredients || [])) counters.ingredients += 1;
      if (JSON.stringify(prevMeal?.recipeSteps || []) !== JSON.stringify(meal?.recipeSteps || [])) counters.steps += 1;
    });
  });

  const normalizedFields: string[] = [];
  const summary: string[] = [];
  if (counters.name > 0) {
    normalizedFields.push('meal names');
    summary.push(`Meal names normalized: ${counters.name}`);
  }
  if (counters.description > 0) {
    normalizedFields.push('descriptions');
    summary.push(`Meal descriptions sanitized: ${counters.description}`);
  }
  if (counters.tags > 0) {
    normalizedFields.push('tags');
    summary.push(`Tags normalized: ${counters.tags}`);
  }
  if (counters.ingredients > 0) {
    normalizedFields.push('ingredients');
    summary.push(`Ingredients backfilled/normalized: ${counters.ingredients}`);
  }
  if (counters.steps > 0) {
    normalizedFields.push('recipe steps');
    summary.push(`Recipe steps backfilled/normalized: ${counters.steps}`);
  }

  return {
    plan: after,
    trace: {
      applied: normalizedFields.length > 0,
      summary,
      normalizedFields,
    } as NormalizationTrace,
  };
};

const applyGenerationMetaToPlan = (plan: any, meta: GenerationMeta) => ({
  ...(() => {
    const { generatedAt: _ignoredGeneratedAt, ...rest } = plan || {};
    return rest;
  })(),
  generationSource: meta.generationSource,
  fallbackReason: meta.fallbackReason,
  generationWarnings: meta.generationWarnings,
  normalizationApplied: meta.normalizationApplied,
  normalizationSummary: meta.normalizationSummary,
  normalizedFields: meta.normalizedFields,
  shoppingListSource: meta.shoppingListSource,
  shoppingListWarnings: meta.shoppingListWarnings,
  sectionSources: meta.sectionSources,
  fallbackSections: meta.fallbackSections,
});

const countShoppingListItems = (shoppingList: any) =>
  ['proteins', 'carbs', 'fats', 'vegetables', 'dairy', 'extras', 'optionalItems'].reduce(
    (acc, key) => acc + (Array.isArray(shoppingList?.[key]) ? shoppingList[key].length : 0),
    0
  );

const validateCoachProPlanCompleteness = (plan: any, expectedMealsPerDay: number) => {
  const issues: string[] = [];
  const weeklyNutrition = Array.isArray(plan?.weeklyNutrition) ? plan.weeklyNutrition : [];
  const weeklyTraining = Array.isArray(plan?.weeklyTraining) ? plan.weeklyTraining : [];
  const minMealsPerDay = Math.max(2, Number(expectedMealsPerDay || 3));

  if (weeklyNutrition.length < 7) {
    issues.push(`weeklyNutrition has ${weeklyNutrition.length}/7 days`);
  }
  if (weeklyTraining.length < 7) {
    issues.push(`weeklyTraining has ${weeklyTraining.length}/7 days`);
  }

  weeklyNutrition.forEach((day: any, index: number) => {
    const meals = Array.isArray(day?.meals) ? day.meals : [];
    if (meals.length < minMealsPerDay) {
      issues.push(`day ${index + 1} has ${meals.length}/${minMealsPerDay} meals`);
    }
  });

  return {
    complete: issues.length === 0,
    issues,
  };
};

const mergeCoachProPlanWithFallbackScaffold = (aiPlan: any, fallbackPlan: any, expectedMealsPerDay: number) => {
  const merged = { ...fallbackPlan, ...aiPlan };
  const aiNutrition = Array.isArray(aiPlan?.weeklyNutrition) ? aiPlan.weeklyNutrition : [];
  const fallbackNutrition = Array.isArray(fallbackPlan?.weeklyNutrition) ? fallbackPlan.weeklyNutrition : [];
  const aiTraining = Array.isArray(aiPlan?.weeklyTraining) ? aiPlan.weeklyTraining : [];
  const fallbackTraining = Array.isArray(fallbackPlan?.weeklyTraining) ? fallbackPlan.weeklyTraining : [];
  const minMealsPerDay = Math.max(2, Number(expectedMealsPerDay || 3));

  merged.weeklyNutrition = fallbackNutrition.map((fallbackDay: any, index: number) => {
    const aiDay = aiNutrition[index];
    if (!aiDay) return fallbackDay;
    const aiMeals = Array.isArray(aiDay?.meals) ? aiDay.meals : [];
    const fallbackMeals = Array.isArray(fallbackDay?.meals) ? fallbackDay.meals : [];
    const paddedMeals =
      aiMeals.length >= minMealsPerDay ? aiMeals : [...aiMeals, ...fallbackMeals.slice(aiMeals.length, minMealsPerDay)];
    return {
      ...fallbackDay,
      ...aiDay,
      meals: paddedMeals,
    };
  });

  merged.weeklyTraining = fallbackTraining.map((fallbackSession: any, index: number) => {
    const aiSession = aiTraining[index];
    return aiSession ? { ...fallbackSession, ...aiSession } : fallbackSession;
  });

  merged.shoppingList = countShoppingListItems(aiPlan?.shoppingList) > 0 ? aiPlan.shoppingList : fallbackPlan.shoppingList;
  merged.rationale = Array.isArray(aiPlan?.rationale) && aiPlan.rationale.length > 0 ? aiPlan.rationale : fallbackPlan.rationale;
  merged.smartWarnings =
    Array.isArray(aiPlan?.smartWarnings) && aiPlan.smartWarnings.length > 0
      ? aiPlan.smartWarnings
      : fallbackPlan.smartWarnings;

  return merged;
};

const mergeCoachProPlanWithAiDetails = (basePlan: any, details: any) => {
  const baseNutrition = Array.isArray(basePlan?.weeklyNutrition) ? basePlan.weeklyNutrition : [];
  const detailsNutrition = Array.isArray(details?.weeklyNutrition) ? details.weeklyNutrition : [];

  const mergedNutrition = baseNutrition.map((baseDay: any, dayIndex: number) => {
    const detailsDay = detailsNutrition[dayIndex];
    const baseMeals = Array.isArray(baseDay?.meals) ? baseDay.meals : [];
    const detailsMeals = Array.isArray(detailsDay?.meals) ? detailsDay.meals : [];
    const meals = baseMeals.map((baseMeal: any, mealIndex: number) => {
      const detailsMeal = detailsMeals[mealIndex];
      if (!detailsMeal) return baseMeal;
      return {
        ...baseMeal,
        fiberGrams: detailsMeal?.fiberGrams ?? baseMeal?.fiberGrams,
        estimatedSatiety: detailsMeal?.estimatedSatiety || baseMeal?.estimatedSatiety,
        suggestedUse: detailsMeal?.suggestedUse || baseMeal?.suggestedUse,
        tags: Array.isArray(detailsMeal?.tags) ? detailsMeal.tags : baseMeal?.tags,
        ingredients: Array.isArray(detailsMeal?.ingredients) ? detailsMeal.ingredients : baseMeal?.ingredients,
        recipeSteps: Array.isArray(detailsMeal?.recipeSteps) ? detailsMeal.recipeSteps : baseMeal?.recipeSteps,
        substitutions: Array.isArray(detailsMeal?.substitutions) ? detailsMeal.substitutions : baseMeal?.substitutions,
        mealPrepNote: detailsMeal?.mealPrepNote || baseMeal?.mealPrepNote,
        rationale: detailsMeal?.rationale || baseMeal?.rationale,
      };
    });
    return {
      ...baseDay,
      meals,
    };
  });

  return {
    ...basePlan,
    weeklyNutrition: mergedNutrition,
    rationale: Array.isArray(details?.rationale) ? details.rationale : basePlan?.rationale,
    smartWarnings: Array.isArray(details?.smartWarnings) ? details.smartWarnings : basePlan?.smartWarnings,
    shoppingList: details?.shoppingList || basePlan?.shoppingList,
    substitutions: details?.substitutions || basePlan?.substitutions,
    mealPrepTips: Array.isArray(details?.mealPrepTips) ? details.mealPrepTips : basePlan?.mealPrepTips,
    recoveryNote: details?.recoveryNote || basePlan?.recoveryNote,
    bestCasePlan: details?.bestCasePlan || basePlan?.bestCasePlan,
    realisticPlan: details?.realisticPlan || basePlan?.realisticPlan,
  };
};

const reduceRecentMealEcho = (input: {
  plan: any;
  fallbackPlan: any;
  recentMealNames: string[];
  maxAllowedMatches: number;
}) => {
  const recentNameKeys = new Set(
    (input.recentMealNames || [])
      .map((name) => sanitizeTextToken(name))
      .filter((name) => name.length > 2)
  );
  if (recentNameKeys.size === 0) {
    return { plan: input.plan, replacedCount: 0 };
  }

  const weeklyNutrition = Array.isArray(input.plan?.weeklyNutrition) ? input.plan.weeklyNutrition : [];
  const fallbackNutrition = Array.isArray(input.fallbackPlan?.weeklyNutrition) ? input.fallbackPlan.weeklyNutrition : [];
  let seenMatches = 0;
  let replacedCount = 0;

  const nextWeeklyNutrition = weeklyNutrition.map((day: any, dayIndex: number) => {
    const meals = Array.isArray(day?.meals) ? day.meals : [];
    const fallbackMeals = Array.isArray(fallbackNutrition?.[dayIndex]?.meals) ? fallbackNutrition[dayIndex].meals : [];
    const nextMeals = meals.map((meal: any, mealIndex: number) => {
      const mealKey = sanitizeTextToken(String(meal?.name || ''));
      const isRecentLike = mealKey.length > 2 && recentNameKeys.has(mealKey);
      if (!isRecentLike) return meal;

      seenMatches += 1;
      if (seenMatches <= input.maxAllowedMatches) return meal;

      const fallbackMeal = fallbackMeals[mealIndex];
      if (!fallbackMeal) return meal;
      const fallbackKey = sanitizeTextToken(String(fallbackMeal?.name || ''));
      if (!fallbackKey || recentNameKeys.has(fallbackKey)) return meal;

      replacedCount += 1;
      return {
        ...meal,
        ...fallbackMeal,
        description:
          String(fallbackMeal?.description || '').trim() ||
          String(meal?.description || '').trim(),
      };
    });
    return {
      ...day,
      meals: nextMeals,
    };
  });

  return {
    plan: {
      ...input.plan,
      weeklyNutrition: nextWeeklyNutrition,
    },
    replacedCount,
  };
};

const buildSectionMetaForGenerate = (input: {
  generationSource: GenerationMeta['generationSource'];
  usedFallbackScaffold: boolean;
  detailEnrichmentSucceeded: boolean;
  shoppingListSource: GenerationMeta['shoppingListSource'];
}) => {
  const sectionSources: string[] = [];
  const fallbackSections: string[] = [];
  const push = (section: string, source: string) => {
    sectionSources.push(`${section}:${source}`);
    if (source.includes('fallback')) {
      fallbackSections.push(section);
    }
  };

  if (input.generationSource === 'fallback') {
    push('overview', 'fallback-generator');
    push('weeklyNutrition', 'fallback-generator');
    push('weeklyTraining', 'fallback-generator');
    push('coachGuidance', 'fallback-generator');
    push('rationale', 'fallback-generator');
    push('shoppingList', 'derived-from-fallback');
    push('substitutions', 'derived-from-fallback');
    push('mealPrepAndRecovery', 'derived-from-fallback');
    return { sectionSources, fallbackSections: Array.from(new Set(fallbackSections)) };
  }

  push('overview', 'ai-core');
  push('weeklyNutrition', input.usedFallbackScaffold ? 'mixed(ai-core+fallback-scaffold)' : 'ai-core');
  push('weeklyTraining', input.usedFallbackScaffold ? 'mixed(ai-core+fallback-scaffold)' : 'ai-core');
  push('coachGuidance', 'ai-core');
  push('rationale', input.detailEnrichmentSucceeded ? 'ai-details' : 'derived-from-ai');
  push('substitutions', input.detailEnrichmentSucceeded ? 'ai-details' : 'derived-from-ai');
  push('mealPrepAndRecovery', input.detailEnrichmentSucceeded ? 'ai-details' : 'derived-from-ai');
  push(
    'shoppingList',
    input.shoppingListSource === 'derived-from-fallback-bases'
      ? 'derived-from-fallback'
      : input.shoppingListSource === 'derived-from-plan'
        ? 'derived-from-ai-plan'
        : 'ai'
  );

  if (input.usedFallbackScaffold) {
    fallbackSections.push('weeklyNutrition', 'weeklyTraining');
  }
  if (input.shoppingListSource === 'derived-from-fallback-bases') {
    fallbackSections.push('shoppingList');
  }

  return {
    sectionSources,
    fallbackSections: Array.from(new Set(fallbackSections)),
  };
};

const distributeTargetAcrossMeals = (target: number, currentValues: number[]) => {
  const safeTarget = Math.max(0, toInt(target, 0));
  if (!Array.isArray(currentValues) || currentValues.length === 0) return [];
  const normalizedCurrent = currentValues.map((value) => Math.max(1, toInt(value, 1)));
  const weightSum = normalizedCurrent.reduce((acc, value) => acc + value, 0) || normalizedCurrent.length;
  const raw = normalizedCurrent.map((value) => (safeTarget * value) / weightSum);
  const floored = raw.map((value) => Math.floor(value));
  let remainder = safeTarget - floored.reduce((acc, value) => acc + value, 0);
  const fractionalOrder = raw
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac);
  for (let i = 0; i < fractionalOrder.length && remainder > 0; i += 1) {
    floored[fractionalOrder[i].index] += 1;
    remainder -= 1;
  }
  return floored;
};

/** After rebalance, align stored day targets with actual meal sums (single source of truth for UI and APIs). */
const syncNutritionDayTargetsFromMeals = (plan: any) => {
  const weekly = Array.isArray(plan?.weeklyNutrition) ? plan.weeklyNutrition : [];
  return {
    ...plan,
    weeklyNutrition: weekly.map((day: any) => {
      const meals = Array.isArray(day?.meals) ? day.meals : [];
      let calories = 0;
      let protein = 0;
      let carbs = 0;
      let fat = 0;
      meals.forEach((meal: any) => {
        calories += toInt(meal?.estimatedCalories, 0);
        protein += toInt(meal?.estimatedProtein, 0);
        carbs += toInt(meal?.estimatedCarbs, 0);
        fat += toInt(meal?.estimatedFat, 0);
      });
      return {
        ...day,
        calorieTarget: calories,
        proteinTarget: protein,
        carbsTarget: carbs,
        fatTarget: fat,
      };
    }),
  };
};

const rebalanceNutritionPlanToTargets = (input: {
  plan: any;
  preferredDailyTargets?: { calories?: number; protein?: number; carbs?: number; fat?: number };
}) => {
  const plan = { ...(input.plan || {}) };
  const weeklyNutrition = Array.isArray(plan?.weeklyNutrition) ? plan.weeklyNutrition : [];
  let adjustedDays = 0;
  const nextWeeklyNutrition = weeklyNutrition.map((day: any) => {
    const meals = Array.isArray(day?.meals) ? day.meals : [];
    if (meals.length === 0) return day;

    const currentCalories = meals.map((meal: any) => toInt(meal?.estimatedCalories, 0));
    const currentProtein = meals.map((meal: any) => toInt(meal?.estimatedProtein, 0));
    const currentCarbs = meals.map((meal: any) => toInt(meal?.estimatedCarbs, 0));
    const currentFat = meals.map((meal: any) => toInt(meal?.estimatedFat, 0));

    const currentCaloriesSum = currentCalories.reduce((acc, value) => acc + value, 0);
    const currentProteinSum = currentProtein.reduce((acc, value) => acc + value, 0);
    const currentCarbsSum = currentCarbs.reduce((acc, value) => acc + value, 0);
    const currentFatSum = currentFat.reduce((acc, value) => acc + value, 0);

    // Default targets = sums of planned meals for that day (not day.calorieTarget from AI, which is often the same profile goal every day and forced all headers to match).
    const targetCalories = toInt(input.preferredDailyTargets?.calories ?? currentCaloriesSum, currentCaloriesSum);
    const targetProtein = toInt(input.preferredDailyTargets?.protein ?? currentProteinSum, currentProteinSum);
    const targetCarbs = toInt(input.preferredDailyTargets?.carbs ?? currentCarbsSum, currentCarbsSum);
    const targetFat = toInt(input.preferredDailyTargets?.fat ?? currentFatSum, currentFatSum);
    const withinTolerance =
      Math.abs(currentCaloriesSum - targetCalories) <= 120 &&
      Math.abs(currentProteinSum - targetProtein) <= 10 &&
      Math.abs(currentCarbsSum - targetCarbs) <= 15 &&
      Math.abs(currentFatSum - targetFat) <= 7;
    if (withinTolerance) {
      return {
        ...day,
        calorieTarget: targetCalories,
        proteinTarget: targetProtein,
        carbsTarget: targetCarbs,
        fatTarget: targetFat,
      };
    }

    const distributedCalories = distributeTargetAcrossMeals(targetCalories, currentCalories);
    const distributedProtein = distributeTargetAcrossMeals(targetProtein, currentProtein);
    const distributedCarbs = distributeTargetAcrossMeals(targetCarbs, currentCarbs);
    const distributedFat = distributeTargetAcrossMeals(targetFat, currentFat);

    const nextMeals = meals.map((meal: any, index: number) => ({
      ...meal,
      estimatedCalories: distributedCalories[index] ?? toInt(meal?.estimatedCalories, 0),
      estimatedProtein: distributedProtein[index] ?? toInt(meal?.estimatedProtein, 0),
      estimatedCarbs: distributedCarbs[index] ?? toInt(meal?.estimatedCarbs, 0),
      estimatedFat: distributedFat[index] ?? toInt(meal?.estimatedFat, 0),
    }));

    const beforeSignature = JSON.stringify({
      calories: currentCalories,
      protein: currentProtein,
      carbs: currentCarbs,
      fat: currentFat,
    });
    const afterSignature = JSON.stringify({
      calories: distributedCalories,
      protein: distributedProtein,
      carbs: distributedCarbs,
      fat: distributedFat,
    });
    if (beforeSignature !== afterSignature) {
      adjustedDays += 1;
    }

    return {
      ...day,
      calorieTarget: targetCalories,
      proteinTarget: targetProtein,
      carbsTarget: targetCarbs,
      fatTarget: targetFat,
      meals: nextMeals,
    };
  });

  return {
    plan: {
      ...plan,
      weeklyNutrition: nextWeeklyNutrition,
    },
    adjustedDays,
  };
};

export const coachProResolvers = {
  Query: {
    generateEvoCoachProPlan: async (_: any, { input }: { input: any }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 6);
      const [recentMeals, recentWorkouts, recentActivity] = await Promise.all([
        FoodItem.find({ userId: context.user.id, createdAt: { $gte: startDate, $lte: endDate } }).limit(30),
        Workout.find({ userId: context.user.id, performedAt: { $gte: startDate, $lte: endDate } }).limit(20),
        DailyActivity.find({
          userId: context.user.id,
          date: { $gte: startDate.toISOString().slice(0, 10), $lte: endDate.toISOString().slice(0, 10) },
        }).limit(7),
      ]);
      const normalizedFoodPreferences = buildNormalizedFoodPreferences(input);
      const recentMealNames = recentMeals.map((meal) => String(meal.name || '').trim()).filter(Boolean);

      const userContext = {
        userName: context.user.name,
        preferences: context.user.preferences,
        normalizedFoodPreferences,
        foodPreferenceSummary: {
          cuisines: normalizedFoodPreferences.favoriteCuisines,
          anchorDishes: normalizedFoodPreferences.favoriteDishes,
          anchorIngredients: normalizedFoodPreferences.favoriteIngredients,
          staples: normalizedFoodPreferences.mealPrepStaples,
          mealStyles: normalizedFoodPreferences.preferredMealStyles,
        },
        recentMeals: recentMeals.map((meal) => ({
          name: meal.name,
          mealType: meal.mealType,
          calories: meal.nutrition?.calories,
          protein: meal.nutrition?.protein,
        })),
        recentWorkouts: recentWorkouts.map((workout) => ({
          title: workout.title,
          durationMinutes: workout.durationMinutes,
          caloriesBurned: workout.caloriesBurned,
          intensity: workout.intensity,
        })),
        recentActivity: recentActivity.map((activity) => ({ date: activity.date, steps: activity.steps })),
      };
      const normalizationOptions: MealNormalizationOptions = {
        forbiddenUiPhrases: normalizedFoodPreferences.forbiddenUiPhrases,
      };

      try {
        const aiPlan = await openAIService.generateCoachProPlan({
          userContext,
          setup: input,
        });
        const expectedMealsPerDay = clamp(Number(input?.nutrition?.mealsPerDay || 3), 2, 6);
        const quality = validateCoachProPlanCompleteness(aiPlan, expectedMealsPerDay);
        if (AI_ONLY_COACH_PRO_MODE && !quality.complete) {
          throw new UserInputError(`AI plan incomplete: ${quality.issues.join('; ')}`);
        }
        const aiCoreCandidate = aiPlan;
        let aiCandidate = aiCoreCandidate;
        const detailWarnings: string[] = [];
        try {
          const aiDetails = await openAIService.generateCoachProPlanDetails({
            corePlanJson: JSON.stringify(aiCoreCandidate),
            userContext,
            setup: input,
          });
          aiCandidate = mergeCoachProPlanWithAiDetails(aiCoreCandidate, aiDetails);
        } catch (detailsError) {
          const detailsFailure = safeErrorMessage(detailsError);
          if (AI_ONLY_COACH_PRO_MODE) {
            throw new UserInputError(`AI detail enrichment failed. ${detailsFailure}`);
          }
          detailWarnings.push(`AI detail enrichment failed: ${detailsFailure}`);
        }
        const noveltyGuard = AI_ONLY_COACH_PRO_MODE
          ? { plan: aiCandidate, replacedCount: 0 }
          : reduceRecentMealEcho({
              plan: aiCandidate,
              fallbackPlan: buildFallbackCoachProPlan({
                setup: input,
                userContext,
              }),
              recentMealNames,
              maxAllowedMatches: 4,
            });
        aiCandidate = noveltyGuard.plan;

        const { plan: normalizedPlan, trace } = normalizePlanWithTrace(aiCandidate, normalizationOptions);
        const nutritionRebalance = rebalanceNutritionPlanToTargets({ plan: normalizedPlan });
        const enrichedPlan = enrichCoachProPlanDerivedFields(syncNutritionDayTargetsFromMeals(nutritionRebalance.plan));
        const shoppingDebug = detectFallbackLikeShoppingList(enrichedPlan);
        const generationWarnings = [
          ...(nutritionRebalance.adjustedDays > 0
            ? [`Rebalanced meal macros/calories to match daily targets for ${nutritionRebalance.adjustedDays} day(s)`]
            : []),
          ...(noveltyGuard.replacedCount > 0
            ? [`Reduced meal-history echo by replacing ${noveltyGuard.replacedCount} repeated meal(s) with new proposals`]
            : []),
          ...detailWarnings,
          ...shoppingDebug.warnings,
          ...(trace.applied ? ['Meal realism normalization adjusted generated meal output'] : []),
          ...(trace.summary.some((entry) => /sanitized/i.test(entry))
            ? ['Meal descriptions were sanitized to remove leaked raw user preferences']
            : []),
        ];
        const sectionMeta = buildSectionMetaForGenerate({
          generationSource: 'ai',
          usedFallbackScaffold: false,
          detailEnrichmentSucceeded: detailWarnings.length === 0,
          shoppingListSource: shoppingDebug.source === 'unknown' ? 'ai' : shoppingDebug.source,
        });
        const generationMeta: GenerationMeta = {
          generationSource: 'ai',
          fallbackReason: null,
          generationWarnings: Array.from(new Set(generationWarnings)),
          normalizationApplied: trace.applied,
          normalizationSummary: trace.summary,
          normalizedFields: trace.normalizedFields,
          shoppingListSource: shoppingDebug.source === 'unknown' ? 'ai' : shoppingDebug.source,
          shoppingListWarnings: shoppingDebug.warnings,
          sectionSources: sectionMeta.sectionSources,
          fallbackSections: sectionMeta.fallbackSections,
          generationDebug: {
            resolver: 'generateEvoCoachProPlan',
            aiAttempted: true,
            aiSucceeded: true,
            fallbackTriggered: false,
          },
        };
        const responsePlan = applyGenerationMetaToPlan(enrichedPlan, generationMeta);
        await CoachProPlan.findOneAndUpdate(
          { userId: context.user.id },
          {
            $set: {
              setup: input,
              plan: responsePlan,
              generationMeta,
              generatedAt: new Date(),
            },
          },
          { upsert: true, new: true }
        );
        return {
          ...responsePlan,
          generatedAt: new Date(),
        };
      } catch (error) {
        const failureMessage = safeErrorMessage(error);
        console.error('[CoachPro][generateEvoCoachProPlan] AI generation failed (AI-only mode)', {
          resolver: 'generateEvoCoachProPlan',
          userId: context.user.id,
          error: failureMessage,
          fallbackTriggered: false,
        });
        throw new UserInputError(`AI generation failed. ${failureMessage}`);
      }
    },
    myEvoCoachProPlan: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }
      const record = await CoachProPlan.findOne({ userId: context.user.id });
      if (!record?.plan) return null;
      const normalizationOptions: MealNormalizationOptions = {
        forbiddenUiPhrases: buildNormalizedFoodPreferences(record.setup).forbiddenUiPhrases,
      };
      const { plan: normalizedPlan, trace } = normalizePlanWithTrace(record.plan, normalizationOptions);
      const nutritionRebalance = rebalanceNutritionPlanToTargets({ plan: normalizedPlan });
      const enrichedPlan = enrichCoachProPlanDerivedFields(syncNutritionDayTargetsFromMeals(nutritionRebalance.plan));
      const existingMeta: GenerationMeta = {
        ...DEFAULT_GENERATION_META,
        ...(record.generationMeta || {}),
      };
      if (AI_ONLY_COACH_PRO_MODE && (existingMeta.generationSource === 'fallback' || (existingMeta.fallbackSections || []).length > 0)) {
        return null;
      }
      if (AI_ONLY_COACH_PRO_MODE && !hasCoachProCriticalContent(enrichedPlan)) {
        return null;
      }
      const shoppingDebug = detectFallbackLikeShoppingList(enrichedPlan);
      const mergedMeta: GenerationMeta = {
        ...existingMeta,
        generationSource: existingMeta.generationSource !== 'unknown' ? existingMeta.generationSource : 'ai',
        fallbackReason: existingMeta.fallbackReason,
        normalizationApplied: existingMeta.normalizationApplied || trace.applied,
        normalizationSummary: Array.from(new Set([...(existingMeta.normalizationSummary || []), ...trace.summary])),
        normalizedFields: Array.from(new Set([...(existingMeta.normalizedFields || []), ...trace.normalizedFields])),
        generationWarnings: Array.from(
          new Set([
            ...(nutritionRebalance.adjustedDays > 0
              ? [`Rebalanced meal macros/calories to match daily targets for ${nutritionRebalance.adjustedDays} day(s)`]
              : []),
            ...(existingMeta.generationWarnings || []),
            ...shoppingDebug.warnings,
          ])
        ),
        shoppingListSource:
          existingMeta.shoppingListSource !== 'unknown'
            ? existingMeta.shoppingListSource
            : shoppingDebug.source === 'unknown'
              ? 'unknown'
              : shoppingDebug.source,
        shoppingListWarnings: Array.from(new Set([...(existingMeta.shoppingListWarnings || []), ...shoppingDebug.warnings])),
      };
      const responsePlan = applyGenerationMetaToPlan(enrichedPlan, mergedMeta);
      record.plan = responsePlan;
      record.generationMeta = mergedMeta;
      await record.save();
      return {
        ...responsePlan,
        generatedAt: record.generatedAt,
      };
    },
    coachProMealDrawerDetails: async (_: any, { input }: { input: any }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }
      const record = await CoachProPlan.findOne({ userId: context.user.id });
      const mealInput = {
        dayLabel: String(input?.dayLabel || ''),
        mealType: String(input?.mealType || 'Meal'),
        name: String(input?.name || 'Meal'),
        description: String(input?.description || 'No description'),
        estimatedCalories: toInt(input?.estimatedCalories, 0),
        estimatedProtein: toInt(input?.estimatedProtein, 0),
        estimatedCarbs: toInt(input?.estimatedCarbs, 0),
        estimatedFat: toInt(input?.estimatedFat, 0),
        prepTimeMinutes: toInt(input?.prepTimeMinutes, 20),
      };
      const dayTarget = {
        calories: toInt(input?.dayTargetCalories, 0),
        protein: toInt(input?.dayTargetProtein, 0),
        carbs: toInt(input?.dayTargetCarbs, 0),
        fat: toInt(input?.dayTargetFat, 0),
      };
      const cachedMeal = findCachedMealFromPlan(record?.plan, mealInput);
      if (cachedMeal && isMealDrawerDetailsReady(cachedMeal)) {
        return ensureCoachProPlanShape({
          weeklyNutrition: [
            {
              dayLabel: mealInput.dayLabel,
              calorieTarget: dayTarget.calories,
              proteinTarget: dayTarget.protein,
              carbsTarget: dayTarget.carbs,
              fatTarget: dayTarget.fat,
              meals: [cachedMeal],
            },
          ],
        }).weeklyNutrition[0].meals[0];
      }

      try {
        const normalizedFoodPreferences = buildNormalizedFoodPreferences(record?.setup || {});
        const details = await openAIService.generateCoachProMealDrawerDetails({
          meal: mealInput,
          dayTarget,
          userContext: {
            preferences: context.user.preferences,
            normalizedFoodPreferences,
            foodPreferenceSummary: {
              cuisines: normalizedFoodPreferences.favoriteCuisines,
              anchorDishes: normalizedFoodPreferences.favoriteDishes,
              anchorIngredients: normalizedFoodPreferences.favoriteIngredients,
              staples: normalizedFoodPreferences.mealPrepStaples,
              mealStyles: normalizedFoodPreferences.preferredMealStyles,
            },
          },
        });
        const normalizedMeal = ensureCoachProPlanShape({
          weeklyNutrition: [
            {
              dayLabel: mealInput.dayLabel,
              calorieTarget: dayTarget.calories,
              proteinTarget: dayTarget.protein,
              carbsTarget: dayTarget.carbs,
              fatTarget: dayTarget.fat,
              meals: [details],
            },
          ],
        }).weeklyNutrition[0].meals[0];
        if (record?.plan) {
          const persisted = persistMealDrawerDetailsInPlan(record.plan, mealInput, normalizedMeal);
          if (persisted.updated) {
            record.plan = persisted.plan;
            await record.save();
          }
        }
        return normalizedMeal;
      } catch (error) {
        const failureMessage = safeErrorMessage(error);
        throw new UserInputError(`AI meal drawer generation failed. ${failureMessage}`);
      }
    },
    coachProTrainingDrawerDetails: async (_: any, { input }: { input: any }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }
      const sessionInput = {
        dayLabel: String(input?.dayLabel || 'Day'),
        sessionGoal: String(input?.sessionGoal || 'Training session'),
        workoutType: String(input?.workoutType || 'General'),
        durationMinutes: toInt(input?.durationMinutes, 40),
        intensity: String(input?.intensity || 'Moderate'),
        structure: Array.isArray(input?.structure)
          ? input.structure.map((block: any) => ({
              name: String(block?.name || ''),
              sets: block?.sets ? String(block.sets) : null,
              reps: block?.reps ? String(block.reps) : null,
              durationMinutes: Number.isFinite(Number(block?.durationMinutes)) ? toInt(block.durationMinutes, 0) : null,
              notes: block?.notes ? String(block.notes) : null,
            }))
          : [],
        fallbackVersion: String(input?.fallbackVersion || 'Reduce volume and keep one main block'),
        minimumViableVersion: String(input?.minimumViableVersion || 'Complete one main block plus cooldown'),
      };

      try {
        const details = await openAIService.generateCoachProTrainingDrawerDetails({
          session: sessionInput,
          userContext: { preferences: context.user.preferences },
        });
        const normalizedSession = ensureCoachProPlanShape({ weeklyTraining: [details.session] }).weeklyTraining[0];
        return {
          session: normalizedSession,
          whyThisSession: String(details.whyThisSession || ''),
          painSubstitution: String(details.painSubstitution || ''),
        };
      } catch (error) {
        const failureMessage = safeErrorMessage(error);
        throw new UserInputError(`AI training drawer generation failed. ${failureMessage}`);
      }
    },
  },
  Mutation: {
    adaptEvoCoachProPlan: async (
      _: any,
      { input }: { input: { currentPlanJson: string; action: string; note?: string } },
      context: Context
    ) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }

      const planJson = String(input.currentPlanJson || '').trim();
      if (!planJson) {
        throw new UserInputError('Current plan is required for adaptation.');
      }
      const baseSetup = (await CoachProPlan.findOne({ userId: context.user.id }))?.setup || {};
      const normalizationOptions: MealNormalizationOptions = {
        forbiddenUiPhrases: buildNormalizedFoodPreferences(baseSetup).forbiddenUiPhrases,
      };

      try {
        const adapted = await openAIService.adaptCoachProPlan({
          currentPlanJson: planJson,
          action: input.action,
          note: input.note,
        });
        const { plan: normalizedPlan, trace } = normalizePlanWithTrace(adapted, normalizationOptions);
        const nutritionRebalance = rebalanceNutritionPlanToTargets({ plan: normalizedPlan });
        const enrichedPlan = enrichCoachProPlanDerivedFields(syncNutritionDayTargetsFromMeals(nutritionRebalance.plan));
        const shoppingDebug = detectFallbackLikeShoppingList(enrichedPlan);
        const generationMeta: GenerationMeta = {
          generationSource: 'ai',
          fallbackReason: null,
          generationWarnings: Array.from(
            new Set([
              ...(nutritionRebalance.adjustedDays > 0
                ? [`Rebalanced meal macros/calories to match daily targets for ${nutritionRebalance.adjustedDays} day(s)`]
                : []),
              ...shoppingDebug.warnings,
            ])
          ),
          normalizationApplied: trace.applied,
          normalizationSummary: trace.summary,
          normalizedFields: trace.normalizedFields,
          shoppingListSource: shoppingDebug.source === 'unknown' ? 'ai' : shoppingDebug.source,
          shoppingListWarnings: shoppingDebug.warnings,
          sectionSources: [
            'overview:ai-adaptation',
            'weeklyNutrition:ai-adaptation',
            'weeklyTraining:ai-adaptation',
            'shoppingList:ai',
          ],
          fallbackSections: [],
          generationDebug: {
            resolver: 'adaptEvoCoachProPlan',
            aiAttempted: true,
            aiSucceeded: true,
            fallbackTriggered: false,
          },
        };
        const responsePlan = applyGenerationMetaToPlan(enrichedPlan, generationMeta);
        await CoachProPlan.findOneAndUpdate(
          { userId: context.user.id },
          {
            $set: {
              plan: responsePlan,
              generationMeta,
              generatedAt: new Date(),
            },
          },
          { upsert: true, new: true }
        );
        return {
          ...responsePlan,
          generatedAt: new Date(),
        };
      } catch (error) {
        const failureMessage = safeErrorMessage(error);
        console.error('[CoachPro][adaptEvoCoachProPlan] AI adaptation failed (AI-only mode)', {
          resolver: 'adaptEvoCoachProPlan',
          userId: context.user.id,
          error: failureMessage,
          fallbackTriggered: false,
        });
        throw new UserInputError(`AI adaptation failed. ${failureMessage}`);
      }
    },
    refreshEvoCoachProPlanByTodaySignals: async (_: any, { date }: { date: string }, context: Context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in');
      }
      const record = await CoachProPlan.findOne({ userId: context.user.id });
      if (!record?.plan) {
        throw new UserInputError('No Evo Coach Pro plan found. Generate a plan first.');
      }

      const dateKey = normalizeDateKey(date);
      const dayMetrics = await getDailyMetrics({
        userId: context.user.id,
        dateKey,
        preferences: context.user.preferences,
      });
      const nextSnapshot = buildSignalSnapshot(dayMetrics);
      const prevSnapshot = record.lastSignalSnapshot;

      const shouldMutate =
        !prevSnapshot ||
        prevSnapshot.dateKey !== nextSnapshot.dateKey ||
        Math.abs(nextSnapshot.consumedCalories - prevSnapshot.consumedCalories) >= 80 ||
        Math.abs(nextSnapshot.consumedProtein - prevSnapshot.consumedProtein) >= 12 ||
        Math.abs(nextSnapshot.steps - prevSnapshot.steps) >= 1500 ||
        nextSnapshot.workoutSessions !== prevSnapshot.workoutSessions;

      const normalizationOptions: MealNormalizationOptions = {
        forbiddenUiPhrases: buildNormalizedFoodPreferences(record.setup).forbiddenUiPhrases,
      };
      const { plan: nextPlanRaw, trace } = normalizePlanWithTrace(
        shouldMutate ? applyTodaySignalMutations(record.plan, prevSnapshot, nextSnapshot) : record.plan,
        normalizationOptions
      );
      const nutritionRebalance = rebalanceNutritionPlanToTargets({ plan: nextPlanRaw });
      const enrichedNextPlanRaw = enrichCoachProPlanDerivedFields(syncNutritionDayTargetsFromMeals(nutritionRebalance.plan));
      const existingMeta: GenerationMeta = {
        ...DEFAULT_GENERATION_META,
        ...(record.generationMeta || {}),
      };
      const shoppingDebug = detectFallbackLikeShoppingList(enrichedNextPlanRaw);
      const mergedMeta: GenerationMeta = {
        ...existingMeta,
        normalizationApplied: existingMeta.normalizationApplied || trace.applied,
        normalizationSummary: Array.from(new Set([...(existingMeta.normalizationSummary || []), ...trace.summary])),
        normalizedFields: Array.from(new Set([...(existingMeta.normalizedFields || []), ...trace.normalizedFields])),
        generationWarnings: Array.from(
          new Set([
            ...(nutritionRebalance.adjustedDays > 0
              ? [`Rebalanced meal macros/calories to match daily targets for ${nutritionRebalance.adjustedDays} day(s)`]
              : []),
            ...(existingMeta.generationWarnings || []),
            ...shoppingDebug.warnings,
          ])
        ),
        shoppingListSource:
          existingMeta.shoppingListSource !== 'unknown'
            ? existingMeta.shoppingListSource
            : shoppingDebug.source === 'unknown'
              ? existingMeta.generationSource === 'fallback'
                ? 'fallback'
                : 'ai'
              : shoppingDebug.source,
        shoppingListWarnings: Array.from(new Set([...(existingMeta.shoppingListWarnings || []), ...shoppingDebug.warnings])),
      };
      const nextPlan = applyGenerationMetaToPlan(enrichedNextPlanRaw, mergedMeta);

      record.plan = nextPlan;
      record.generationMeta = mergedMeta;
      record.generatedAt = new Date();
      record.lastSignalSnapshot = nextSnapshot;
      await record.save();

      return {
        ...record.plan,
        generatedAt: record.generatedAt,
      };
    },
  },
};
