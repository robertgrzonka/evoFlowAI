'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import {
  Activity,
  BadgeCheck,
  Brain,
  CalendarRange,
  ChevronRight,
  Crown,
  Flame,
  Leaf,
  PanelRightOpen,
  ShieldCheck,
  ShieldAlert,
  ShoppingCart,
  Sparkles,
  Swords,
  Timer,
  Zap,
  WandSparkles,
  X,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import AICoachAvatar from '@/components/AICoachAvatar';
import PageTopBar from '@/components/ui/molecules/PageTopBar';
import Tooltip from '@/components/ui/atoms/Tooltip';
import { ButtonSpinner, PageLoader, Skeleton } from '@/components/ui/loading';
import { AISectionHeader, EvoHintCard, EvoStatusBadge, InsightEmptyState } from '@/components/evo';
import {
  APPLY_COACH_PRO_MEAL_SMART_ACTION_MUTATION,
  REFRESH_COACH_PRO_PLAN_BY_TODAY_SIGNALS_MUTATION,
} from '@/lib/graphql/mutations';
import {
  COACH_PRO_MEAL_DRAWER_DETAILS_QUERY,
  COACH_PRO_TRAINING_DRAWER_DETAILS_QUERY,
  GENERATE_COACH_PRO_PLAN_QUERY,
  ME_QUERY,
  MY_COACH_PRO_PLAN_QUERY,
} from '@/lib/graphql/queries';
import type { CoachProPlan, CoachProSetupInput } from '@/lib/coach-pro/types';
import { appToast } from '@/lib/app-toast';
import { useDaySnapshot } from '@/hooks/useDaySnapshot';
import { useAppUiLocale } from '@/lib/i18n/use-app-ui-locale';
import {
  aggressivenessSelectOptions,
  coachProPageCopy,
  coachingStyleSelectOptions,
  displayCoachingStyleLabel,
  mealSmartActionLabel,
  mealStyleOptions,
  MEAL_SMART_ACTION_KEYS,
  trainingTypeOptions,
  type CoachProPageCopy,
  type MealSmartActionKey,
} from '@/lib/i18n/copy/coach-pro-page';
import type { UiLocale } from '@/lib/i18n/ui-locale';

const splitCsv = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const toggleListValue = <T extends string>(list: T[], value: T) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

const defaultSetup: CoachProSetupInput = {
  nutrition: {
    hardExclusions: [],
    softDislikes: [],
    allergies: [],
    favoriteFoods: [],
    stapleFoods: [],
    preferredStyles: ['HIGH_PROTEIN', 'BALANCED'],
    mealsPerDay: 3,
    allowRepeatedBreakfasts: true,
    requireLunchDinnerVariety: true,
    cookingSkill: 'Intermediate',
    cookingEnjoyment: 'Medium',
    cookingTimeMinutes: 35,
    wantsMealPrep: true,
    weeklyFoodBudget: null,
    useUpIngredients: [],
  },
  training: {
    trainingTypes: ['GYM', 'WALKING'],
    realisticDaysPerWeek: 4,
    preferredDurationMinutes: 45,
    availableEquipment: [],
    favoriteExercises: [],
    dislikedExercises: [],
    injuriesOrLimitations: [],
    preferredIntensity: 'Moderate',
    strictOrFlexible: 'Flexible adaptive plan',
  },
  goals: {
    primaryGoal: 'Fat loss with muscle retention',
    secondaryGoal: 'Consistency',
    targetDate: null,
    priorityFocus: ['fat loss', 'consistency', 'energy'],
    coachingStyle: 'SUPPORTIVE',
    aggressiveness: 'BALANCED',
  },
  lifestyle: {
    workScheduleIntensity: 'Moderate',
    sleepQuality: 'Average',
    stressLevel: 'Medium',
    averageDailyActivity: 'Moderate',
    weekendsDiffer: true,
    eatsOutOften: false,
    practicalOverIdeal: true,
    extraContext: '',
  },
};

type PlanMeal = CoachProPlan['weeklyNutrition'][number]['meals'][number];
type SelectedPlanMeal = {
  dayLabel: string;
  dayTarget: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  meal: PlanMeal;
};

type PlanTrainingSession = CoachProPlan['weeklyTraining'][number];
type SelectedTrainingSession = {
  session: PlanTrainingSession;
};
type TrainingDrawerDetails = {
  session: PlanTrainingSession;
  whyThisSession: string;
  painSubstitution: string;
};

/** Mon=0 … Sun=6 — match dayLabel prefixes (Mon / Monday, etc.) */
function dayLabelToMondayIndex(dayLabel: string): number {
  const s = dayLabel.trim().toLowerCase();
  if (s.startsWith('mon')) return 0;
  if (s.startsWith('tue')) return 1;
  if (s.startsWith('wed')) return 2;
  if (s.startsWith('thu')) return 3;
  if (s.startsWith('fri')) return 4;
  if (s.startsWith('sat')) return 5;
  if (s.startsWith('sun')) return 6;
  return 0;
}

function getMondayBasedTodayIndex(): number {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

/** Order from today: sort Mon→Sun, then rotate so the first item is the current weekday. */
function rotateWeekFromToday<T extends { dayLabel: string }>(items: T[]): T[] {
  if (items.length === 0) return items;
  const sorted = [...items].sort((a, b) => dayLabelToMondayIndex(a.dayLabel) - dayLabelToMondayIndex(b.dayLabel));
  const todayIdx = getMondayBasedTodayIndex();
  const startAt = sorted.findIndex((d) => dayLabelToMondayIndex(d.dayLabel) === todayIdx);
  const start = startAt >= 0 ? startAt : 0;
  return [...sorted.slice(start), ...sorted.slice(0, start)];
}

export default function EvoCoachProPage() {
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [step, setStep] = useState(0);
  const [setup, setSetup] = useState<CoachProSetupInput>(defaultSetup);
  const [hardExclusionsText, setHardExclusionsText] = useState('');
  const [softDislikesText, setSoftDislikesText] = useState('');
  const [allergiesText, setAllergiesText] = useState('');
  const [favoriteFoodsText, setFavoriteFoodsText] = useState('');
  const [stapleFoodsText, setStapleFoodsText] = useState('');
  const [useUpIngredientsText, setUseUpIngredientsText] = useState('');
  const [equipmentText, setEquipmentText] = useState('');
  const [favoriteExercisesText, setFavoriteExercisesText] = useState('');
  const [dislikedExercisesText, setDislikedExercisesText] = useState('');
  const [injuriesText, setInjuriesText] = useState('');
  const [priorityFocusText, setPriorityFocusText] = useState('fat loss, consistency, health');
  const [plan, setPlan] = useState<CoachProPlan | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<SelectedPlanMeal | null>(null);
  const [selectedTraining, setSelectedTraining] = useState<SelectedTrainingSession | null>(null);
  const [mealDrawerDetails, setMealDrawerDetails] = useState<PlanMeal | null>(null);
  const [trainingDrawerDetails, setTrainingDrawerDetails] = useState<TrainingDrawerDetails | null>(null);
  const [showAllNutritionDays, setShowAllNutritionDays] = useState(false);
  const [showAllTrainingDays, setShowAllTrainingDays] = useState(false);
  const lastSignalSyncRef = useRef<string>('');
  const uiLocale = useAppUiLocale();
  const t = coachProPageCopy[uiLocale];
  const mealStyleOpts = useMemo(() => mealStyleOptions(uiLocale), [uiLocale]);
  const trainingTypeOpts = useMemo(() => trainingTypeOptions(uiLocale), [uiLocale]);
  const coachingStyleOpts = useMemo(() => coachingStyleSelectOptions(uiLocale), [uiLocale]);
  const aggressivenessOpts = useMemo(() => aggressivenessSelectOptions(uiLocale), [uiLocale]);

  const { data: meData, loading: meLoading } = useQuery(ME_QUERY);
  const { data: savedPlanData, loading: savedPlanLoading, refetch: refetchSavedPlan } = useQuery(MY_COACH_PRO_PLAN_QUERY, {
    fetchPolicy: 'cache-and-network',
  });
  const daySnapshot = useDaySnapshot({ date: today, enabled: Boolean(meData?.me), includeInsight: false });
  const [generatePlan, { loading: generatingPlan, error: generateError, data: generateData }] = useLazyQuery(
    GENERATE_COACH_PRO_PLAN_QUERY,
    { fetchPolicy: 'no-cache' }
  );
  const [loadMealDrawerDetails, { loading: mealDrawerLoading, data: mealDrawerData }] = useLazyQuery(
    COACH_PRO_MEAL_DRAWER_DETAILS_QUERY,
    { fetchPolicy: 'no-cache' }
  );
  const [loadTrainingDrawerDetails, { loading: trainingDrawerLoading, data: trainingDrawerData }] = useLazyQuery(
    COACH_PRO_TRAINING_DRAWER_DETAILS_QUERY,
    { fetchPolicy: 'no-cache' }
  );
  const [refreshPlanBySignals, { loading: refreshingPlanBySignals }] = useMutation(
    REFRESH_COACH_PRO_PLAN_BY_TODAY_SIGNALS_MUTATION,
    {
      onCompleted: (data) => {
        if (data?.refreshEvoCoachProPlanByTodaySignals) {
          setPlan(data.refreshEvoCoachProPlanByTodaySignals);
        }
      },
    }
  );
  const [applyMealSmartAction, { loading: mealActionLoading }] = useMutation(APPLY_COACH_PRO_MEAL_SMART_ACTION_MUTATION);

  useEffect(() => {
    const preferences = meData?.me?.preferences;
    if (!preferences) return;

    setSetup((previous) => ({
      ...previous,
      nutrition: {
        ...previous.nutrition,
        mealsPerDay: previous.nutrition.mealsPerDay || 3,
      },
      training: {
        ...previous.training,
        realisticDaysPerWeek: Number(preferences.weeklyWorkoutsGoal || 4),
      },
      goals: {
        ...previous.goals,
        primaryGoal: String(preferences.primaryGoal || 'maintenance').replaceAll('_', ' '),
      },
    }));
  }, [meData]);

  useEffect(() => {
    if (!generateData?.generateEvoCoachProPlan) return;
    setPlan(generateData.generateEvoCoachProPlan);
    const copy = coachProPageCopy[uiLocale];
    appToast.success(copy.toastReadyTitle, copy.toastReadyBody);
    refetchSavedPlan();
  }, [generateData, refetchSavedPlan, uiLocale]);

  useEffect(() => {
    if (!savedPlanData?.myEvoCoachProPlan) return;
    setPlan(savedPlanData.myEvoCoachProPlan);
  }, [savedPlanData]);

  useEffect(() => {
    setShowAllNutritionDays(false);
    setShowAllTrainingDays(false);
  }, [plan?.generatedAt]);

  useEffect(() => {
    if (plan) return;
    setSelectedMeal(null);
    setSelectedTraining(null);
    setMealDrawerDetails(null);
    setTrainingDrawerDetails(null);
  }, [plan]);

  useEffect(() => {
    if (!selectedMeal) {
      setMealDrawerDetails(null);
      return;
    }
    setMealDrawerDetails(null);
    loadMealDrawerDetails({
      variables: {
        input: {
          dayLabel: selectedMeal.dayLabel,
          mealType: selectedMeal.meal.mealType,
          name: selectedMeal.meal.name,
          description: selectedMeal.meal.description,
          estimatedCalories: selectedMeal.meal.estimatedCalories,
          estimatedProtein: selectedMeal.meal.estimatedProtein,
          estimatedCarbs: selectedMeal.meal.estimatedCarbs,
          estimatedFat: selectedMeal.meal.estimatedFat,
          prepTimeMinutes: selectedMeal.meal.prepTimeMinutes,
          dayTargetCalories: selectedMeal.dayTarget.calories,
          dayTargetProtein: selectedMeal.dayTarget.protein,
          dayTargetCarbs: selectedMeal.dayTarget.carbs,
          dayTargetFat: selectedMeal.dayTarget.fat,
        },
      },
    }).catch(() => undefined);
  }, [selectedMeal, loadMealDrawerDetails]);

  useEffect(() => {
    if (mealDrawerData?.coachProMealDrawerDetails) {
      setMealDrawerDetails(mealDrawerData.coachProMealDrawerDetails);
    }
  }, [mealDrawerData]);

  useEffect(() => {
    if (!selectedTraining) {
      setTrainingDrawerDetails(null);
      return;
    }
    setTrainingDrawerDetails(null);
    loadTrainingDrawerDetails({
      variables: {
        input: {
          dayLabel: selectedTraining.session.dayLabel,
          sessionGoal: selectedTraining.session.sessionGoal,
          workoutType: selectedTraining.session.workoutType,
          durationMinutes: selectedTraining.session.durationMinutes,
          intensity: selectedTraining.session.intensity,
          structure: selectedTraining.session.structure.map((block) => ({
            name: block.name,
            sets: block.sets,
            reps: block.reps,
            durationMinutes: block.durationMinutes,
            notes: block.notes,
          })),
          fallbackVersion: selectedTraining.session.fallbackVersion,
          minimumViableVersion: selectedTraining.session.minimumViableVersion,
        },
      },
    }).catch(() => undefined);
  }, [selectedTraining, loadTrainingDrawerDetails]);

  useEffect(() => {
    if (trainingDrawerData?.coachProTrainingDrawerDetails) {
      setTrainingDrawerDetails(trainingDrawerData.coachProTrainingDrawerDetails);
    }
  }, [trainingDrawerData]);

  useEffect(() => {
    if (!plan || daySnapshot.loading) return;
    const snapshotKey = [
      today,
      daySnapshot.derived.consumedCalories,
      daySnapshot.derived.consumedProtein,
      daySnapshot.derived.workoutCount,
      daySnapshot.derived.steps,
    ].join('|');
    if (snapshotKey === lastSignalSyncRef.current) return;
    lastSignalSyncRef.current = snapshotKey;
    refreshPlanBySignals({ variables: { date: today } }).catch(() => undefined);
  }, [
    plan,
    today,
    daySnapshot.loading,
    daySnapshot.derived.consumedCalories,
    daySnapshot.derived.consumedProtein,
    daySnapshot.derived.workoutCount,
    daySnapshot.derived.steps,
    refreshPlanBySignals,
  ]);

  const prefilledContext = useMemo(() => {
    const preferences = meData?.me?.preferences;
    const copy = coachProPageCopy[uiLocale];
    if (!preferences) return copy.prefilledNone;
    return copy.prefilledActive(
      preferences.dailyCalorieGoal,
      preferences.proteinGoal,
      preferences.weeklyWorkoutsGoal
    );
  }, [meData, uiLocale]);

  const nutritionWeekFromToday = useMemo(
    () => (plan ? rotateWeekFromToday(plan.weeklyNutrition) : []),
    [plan]
  );
  const trainingWeekFromToday = useMemo(
    () => (plan ? rotateWeekFromToday(plan.weeklyTraining) : []),
    [plan]
  );
  const canExpandNutritionWeek = nutritionWeekFromToday.length > 3;
  const canExpandTrainingWeek = trainingWeekFromToday.length > 3;
  const nutritionDaysVisible =
    showAllNutritionDays || nutritionWeekFromToday.length <= 3
      ? nutritionWeekFromToday
      : nutritionWeekFromToday.slice(0, 3);
  const trainingDaysVisible =
    showAllTrainingDays || trainingWeekFromToday.length <= 3
      ? trainingWeekFromToday
      : trainingWeekFromToday.slice(0, 3);
  const remainingNutritionDaysCount = Math.max(0, nutritionWeekFromToday.length - 3);
  const remainingTrainingDaysCount = Math.max(0, trainingWeekFromToday.length - 3);

  if (meLoading || savedPlanLoading) {
    return <PageLoader />;
  }

  const syncTextFieldsIntoSetup = () => {
    setSetup((previous) => ({
      ...previous,
      nutrition: {
        ...previous.nutrition,
        hardExclusions: splitCsv(hardExclusionsText),
        softDislikes: splitCsv(softDislikesText),
        allergies: splitCsv(allergiesText),
        favoriteFoods: splitCsv(favoriteFoodsText),
        stapleFoods: splitCsv(stapleFoodsText),
        useUpIngredients: splitCsv(useUpIngredientsText),
      },
      training: {
        ...previous.training,
        availableEquipment: splitCsv(equipmentText),
        favoriteExercises: splitCsv(favoriteExercisesText),
        dislikedExercises: splitCsv(dislikedExercisesText),
        injuriesOrLimitations: splitCsv(injuriesText),
      },
      goals: {
        ...previous.goals,
        priorityFocus: splitCsv(priorityFocusText),
      },
    }));
  };

  const handleGeneratePlan = async () => {
    syncTextFieldsIntoSetup();
    const nextSetup: CoachProSetupInput = {
      ...setup,
      nutrition: {
        ...setup.nutrition,
        hardExclusions: splitCsv(hardExclusionsText),
        softDislikes: splitCsv(softDislikesText),
        allergies: splitCsv(allergiesText),
        favoriteFoods: splitCsv(favoriteFoodsText),
        stapleFoods: splitCsv(stapleFoodsText),
        useUpIngredients: splitCsv(useUpIngredientsText),
      },
      training: {
        ...setup.training,
        availableEquipment: splitCsv(equipmentText),
        favoriteExercises: splitCsv(favoriteExercisesText),
        dislikedExercises: splitCsv(dislikedExercisesText),
        injuriesOrLimitations: splitCsv(injuriesText),
      },
      goals: {
        ...setup.goals,
        priorityFocus: splitCsv(priorityFocusText),
      },
    };
    setSetup(nextSetup);
    await generatePlan({ variables: { input: nextSetup } });
  };

  const handleMealAction = async (action: MealSmartActionKey) => {
    if (!selectedMeal || mealActionLoading || mealDrawerLoading) return;
    const slot = selectedMeal.meal;
    const detail = mealDrawerDetails || slot;
    try {
      const { data } = await applyMealSmartAction({
        variables: {
          input: {
            action,
            dayLabel: selectedMeal.dayLabel,
            mealType: slot.mealType,
            name: slot.name,
            description: detail.description,
            estimatedCalories: detail.estimatedCalories,
            estimatedProtein: detail.estimatedProtein,
            estimatedCarbs: detail.estimatedCarbs,
            estimatedFat: detail.estimatedFat,
            prepTimeMinutes: detail.prepTimeMinutes,
            dayTargetCalories: selectedMeal.dayTarget.calories,
            dayTargetProtein: selectedMeal.dayTarget.protein,
            dayTargetCarbs: selectedMeal.dayTarget.carbs,
            dayTargetFat: selectedMeal.dayTarget.fat,
            ingredients: (detail.ingredients || []).map((i) => ({
              item: i.item,
              quantity: i.quantity,
            })),
            recipeSteps: detail.recipeSteps || [],
            substitutions: detail.substitutions || [],
          },
        },
      });
      const payload = data?.applyCoachProMealSmartAction;
      if (payload?.updatedPlan) {
        setPlan(payload.updatedPlan as CoachProPlan);
      }
      if (payload?.meal) {
        setMealDrawerDetails(payload.meal as PlanMeal);
      }
      if (payload?.notice) {
        appToast.success(t.toastSmartActionTitle, payload.notice);
      }
      void refetchSavedPlan();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t.toastActionFailBody;
      appToast.error(t.toastActionFailTitle, message);
    }
  };

  const mealDays = plan?.weeklyNutrition?.length || 0;
  const trainingDays = plan?.weeklyTraining?.length || 0;
  const hasHistorySignals = daySnapshot.derived.workoutCount > 0 || Number(daySnapshot.stats?.meals?.length || 0) > 0;
  const confidenceTier = mealDays >= 7 && trainingDays >= 7 && hasHistorySignals ? 'high' : mealDays >= 5 ? 'medium' : 'foundational';
  const confidenceDisplay =
    confidenceTier === 'high' ? t.confidenceHigh : confidenceTier === 'medium' ? t.confidenceMedium : t.confidenceFoundational;
  const weeklySuccessMarkers = plan
    ? t.weeklySuccessMarkers(Number(setup.training.realisticDaysPerWeek || 4))
    : [];

  const renderSetupStep = () => {
    if (step === 0) {
      return (
        <section className="bg-surface rounded-xl border border-border p-5 space-y-4">
          <AISectionHeader eyebrow={t.step1Eyebrow} title={t.step1Title} subtitle={t.step1Subtitle} />
          <TextAreaRow label={t.hardExclusions} value={hardExclusionsText} onChange={setHardExclusionsText} placeholder={t.textareaPlaceholder} />
          <TextAreaRow label={t.softDislikes} value={softDislikesText} onChange={setSoftDislikesText} placeholder={t.textareaPlaceholder} />
          <TextAreaRow label={t.allergies} value={allergiesText} onChange={setAllergiesText} placeholder={t.textareaPlaceholder} />
          <TextAreaRow label={t.favoriteFoods} value={favoriteFoodsText} onChange={setFavoriteFoodsText} placeholder={t.textareaPlaceholder} />
          <TextAreaRow label={t.stapleFoods} value={stapleFoodsText} onChange={setStapleFoodsText} placeholder={t.textareaPlaceholder} />
          <TextAreaRow label={t.useUpIngredients} value={useUpIngredientsText} onChange={setUseUpIngredientsText} placeholder={t.textareaPlaceholder} />
          <MultiSelectChips
            title={t.preferredEatingStyle}
            options={mealStyleOpts}
            values={setup.nutrition.preferredStyles}
            onToggle={(value) =>
              setSetup((previous) => ({
                ...previous,
                nutrition: {
                  ...previous.nutrition,
                  preferredStyles: toggleListValue(previous.nutrition.preferredStyles, value),
                },
              }))
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <NumberInput
              label={t.mealsPerDay}
              value={setup.nutrition.mealsPerDay}
              onChange={(value) =>
                setSetup((previous) => ({ ...previous, nutrition: { ...previous.nutrition, mealsPerDay: value } }))
              }
              min={2}
              max={6}
            />
            <NumberInput
              label={t.cookingTime}
              value={setup.nutrition.cookingTimeMinutes}
              onChange={(value) =>
                setSetup((previous) => ({ ...previous, nutrition: { ...previous.nutrition, cookingTimeMinutes: value } }))
              }
              min={10}
              max={120}
            />
            <NumberInput
              label={t.weeklyFoodBudget}
              value={Number(setup.nutrition.weeklyFoodBudget || 0)}
              onChange={(value) =>
                setSetup((previous) => ({ ...previous, nutrition: { ...previous.nutrition, weeklyFoodBudget: value } }))
              }
              min={0}
              max={3000}
            />
          </div>
          <BooleanRow
            label={t.allowRepeatedBreakfasts}
            value={setup.nutrition.allowRepeatedBreakfasts}
            onChange={(value) =>
              setSetup((previous) => ({ ...previous, nutrition: { ...previous.nutrition, allowRepeatedBreakfasts: value } }))
            }
          />
          <BooleanRow
            label={t.requireLunchDinnerVariety}
            value={setup.nutrition.requireLunchDinnerVariety}
            onChange={(value) =>
              setSetup((previous) => ({ ...previous, nutrition: { ...previous.nutrition, requireLunchDinnerVariety: value } }))
            }
          />
          <BooleanRow
            label={t.enableMealPrep}
            value={setup.nutrition.wantsMealPrep}
            onChange={(value) =>
              setSetup((previous) => ({ ...previous, nutrition: { ...previous.nutrition, wantsMealPrep: value } }))
            }
          />
        </section>
      );
    }

    if (step === 1) {
      return (
        <section className="bg-surface rounded-xl border border-border p-5 space-y-4">
          <AISectionHeader eyebrow={t.step2Eyebrow} title={t.step2Title} subtitle={t.step2Subtitle} />
          <MultiSelectChips
            title={t.trainingTypesTitle}
            options={trainingTypeOpts}
            values={setup.training.trainingTypes}
            onToggle={(value) =>
              setSetup((previous) => ({
                ...previous,
                training: {
                  ...previous.training,
                  trainingTypes: toggleListValue(previous.training.trainingTypes, value),
                },
              }))
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <NumberInput
              label={t.trainingDaysPerWeek}
              value={setup.training.realisticDaysPerWeek}
              onChange={(value) =>
                setSetup((previous) => ({ ...previous, training: { ...previous.training, realisticDaysPerWeek: value } }))
              }
              min={1}
              max={7}
            />
            <NumberInput
              label={t.preferredDuration}
              value={setup.training.preferredDurationMinutes}
              onChange={(value) =>
                setSetup((previous) => ({ ...previous, training: { ...previous.training, preferredDurationMinutes: value } }))
              }
              min={20}
              max={120}
            />
          </div>
          <TextAreaRow label={t.equipment} value={equipmentText} onChange={setEquipmentText} placeholder={t.textareaPlaceholder} />
          <TextAreaRow
            label={t.favoriteExercises}
            value={favoriteExercisesText}
            onChange={setFavoriteExercisesText}
            placeholder={t.textareaPlaceholder}
          />
          <TextAreaRow
            label={t.dislikedExercises}
            value={dislikedExercisesText}
            onChange={setDislikedExercisesText}
            placeholder={t.textareaPlaceholder}
          />
          <TextAreaRow label={t.injuries} value={injuriesText} onChange={setInjuriesText} placeholder={t.textareaPlaceholder} />
          <FieldSelect
            label={t.preferredIntensity}
            value={setup.training.preferredIntensity}
            options={t.intensityLowModHigh}
            onChange={(value) =>
              setSetup((previous) => ({ ...previous, training: { ...previous.training, preferredIntensity: value } }))
            }
          />
          <FieldSelect
            label={t.planStrictness}
            value={setup.training.strictOrFlexible}
            options={t.strictnessOptions}
            onChange={(value) =>
              setSetup((previous) => ({ ...previous, training: { ...previous.training, strictOrFlexible: value } }))
            }
          />
        </section>
      );
    }

    if (step === 2) {
      return (
        <section className="bg-surface rounded-xl border border-border p-5 space-y-4">
          <AISectionHeader eyebrow={t.step3Eyebrow} title={t.step3Title} subtitle={t.step3Subtitle} />
          <TextInput
            label={t.primaryGoal}
            value={setup.goals.primaryGoal}
            onChange={(value) => setSetup((previous) => ({ ...previous, goals: { ...previous.goals, primaryGoal: value } }))}
          />
          <TextInput
            label={t.secondaryGoal}
            value={setup.goals.secondaryGoal || ''}
            onChange={(value) => setSetup((previous) => ({ ...previous, goals: { ...previous.goals, secondaryGoal: value } }))}
          />
          <TextInput
            label={t.targetDate}
            value={setup.goals.targetDate || ''}
            onChange={(value) => setSetup((previous) => ({ ...previous, goals: { ...previous.goals, targetDate: value } }))}
            placeholder={t.targetDatePlaceholder}
          />
          <TextAreaRow
            label={t.priorityFocus}
            value={priorityFocusText}
            onChange={setPriorityFocusText}
            placeholder={t.textareaPlaceholder}
          />
          <FieldSelect
            label={t.expectedCoachingStyle}
            value={setup.goals.coachingStyle}
            options={coachingStyleOpts}
            onChange={(value) =>
              setSetup((previous) => ({
                ...previous,
                goals: {
                  ...previous.goals,
                  coachingStyle: value as CoachProSetupInput['goals']['coachingStyle'],
                },
              }))
            }
          />
          <FieldSelect
            label={t.planAggressiveness}
            value={setup.goals.aggressiveness}
            options={aggressivenessOpts}
            onChange={(value) =>
              setSetup((previous) => ({
                ...previous,
                goals: {
                  ...previous.goals,
                  aggressiveness: value as CoachProSetupInput['goals']['aggressiveness'],
                },
              }))
            }
          />
        </section>
      );
    }

    return (
      <section className="bg-surface rounded-xl border border-border p-5 space-y-4">
        <AISectionHeader eyebrow={t.step4Eyebrow} title={t.step4Title} subtitle={t.step4Subtitle} />
        <FieldSelect
          label={t.workScheduleIntensity}
          value={setup.lifestyle.workScheduleIntensity}
          options={t.lifestyleLowModHigh}
          onChange={(value) => setSetup((previous) => ({ ...previous, lifestyle: { ...previous.lifestyle, workScheduleIntensity: value } }))}
        />
        <FieldSelect
          label={t.sleepQuality}
          value={setup.lifestyle.sleepQuality}
          options={t.sleepOptions}
          onChange={(value) => setSetup((previous) => ({ ...previous, lifestyle: { ...previous.lifestyle, sleepQuality: value } }))}
        />
        <FieldSelect
          label={t.stressLevel}
          value={setup.lifestyle.stressLevel}
          options={t.stressOptions}
          onChange={(value) => setSetup((previous) => ({ ...previous, lifestyle: { ...previous.lifestyle, stressLevel: value } }))}
        />
        <FieldSelect
          label={t.averageDailyActivity}
          value={setup.lifestyle.averageDailyActivity}
          options={t.lifestyleLowModHigh}
          onChange={(value) => setSetup((previous) => ({ ...previous, lifestyle: { ...previous.lifestyle, averageDailyActivity: value } }))}
        />
        <BooleanRow
          label={t.weekendsDiffer}
          value={setup.lifestyle.weekendsDiffer}
          onChange={(value) => setSetup((previous) => ({ ...previous, lifestyle: { ...previous.lifestyle, weekendsDiffer: value } }))}
        />
        <BooleanRow
          label={t.booleanEatsOut}
          value={setup.lifestyle.eatsOutOften}
          onChange={(value) => setSetup((previous) => ({ ...previous, lifestyle: { ...previous.lifestyle, eatsOutOften: value } }))}
        />
        <BooleanRow
          label={t.practicalOverIdeal}
          value={setup.lifestyle.practicalOverIdeal}
          onChange={(value) => setSetup((previous) => ({ ...previous, lifestyle: { ...previous.lifestyle, practicalOverIdeal: value } }))}
        />
        <TextAreaRow
          label={t.extraContext}
          value={setup.lifestyle.extraContext || ''}
          onChange={(value) => setSetup((previous) => ({ ...previous, lifestyle: { ...previous.lifestyle, extraContext: value } }))}
          placeholder={t.textareaPlaceholder}
        />
      </section>
    );
  };

  return (
    <AppShell>
      <div className="space-y-5">
        <PageTopBar rightContent={<h1 className="text-lg font-semibold tracking-tight text-text-primary">{t.pageTitle}</h1>} />

        <section className="rounded-xl border border-amber-300/35 bg-gradient-to-r from-amber-300/10 via-background to-background p-5">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full border border-amber-300/45 bg-amber-300/10 inline-flex items-center justify-center shrink-0">
              <Crown className="h-5 w-5 text-amber-200" />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.12em] text-amber-200">{t.premiumStrategist}</p>
              <h2 className="text-xl font-semibold text-text-primary mt-1">{t.heroTitle}</h2>
              <p className="text-sm text-text-secondary mt-1">{t.heroSubtitle}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <MetaPill label={t.metaGoal} value={setup.goals.primaryGoal} />
                <MetaPill label={t.metaCoachingStyle} value={displayCoachingStyleLabel(uiLocale, setup.goals.coachingStyle)} />
                <MetaPill label={t.metaFlexibility} value={plan?.overview.flexibilityLevel || setup.training.strictOrFlexible} />
                <MetaPill label={t.metaConfidence} value={confidenceDisplay} />
                <MetaPill label={t.metaDataSources} value={t.metaDataSourcesValue} />
              </div>
              <p className="text-xs text-amber-100/90 mt-2">{prefilledContext}</p>
            </div>
          </div>
        </section>

        {!plan ? (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <section className="xl:col-span-8 space-y-4">
              {renderSetupStep()}
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setStep((current) => Math.max(0, current - 1))}
                  disabled={step === 0 || generatingPlan}
                >
                  {t.back}
                </button>
                {step < 3 ? (
                  <button type="button" className="btn-primary" onClick={() => setStep((current) => Math.min(3, current + 1))}>
                    {t.nextStep}
                  </button>
                ) : (
                  <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={handleGeneratePlan} disabled={generatingPlan}>
                    {generatingPlan ? (
                      <>
                        <ButtonSpinner />
                        {t.generating}
                      </>
                    ) : (
                      <>
                        <WandSparkles className="h-4 w-4" />
                        {t.generatePlan}
                      </>
                    )}
                  </button>
                )}
              </div>
              {generateError ? (
                <EvoHintCard title={t.generationIssue} tone="warning" content={generateError.message || t.generationFallback} />
              ) : null}
            </section>
            <aside className="xl:col-span-4 space-y-4">
              <section className="bg-surface rounded-xl border border-border p-4">
                <h3 className="text-sm font-semibold text-text-primary mb-2">{t.progressTitle}</h3>
                <div className="w-full rounded-full bg-surface-elevated h-2">
                  <div className="h-2 rounded-full bg-amber-300/70" style={{ width: `${((step + 1) / 4) * 100}%` }} />
                </div>
                <p className="text-xs text-text-secondary mt-2">{t.stepOf(step + 1)}</p>
              </section>
              <section className="bg-surface rounded-xl border border-border p-4 space-y-2">
                <h3 className="text-sm font-semibold text-text-primary">{t.sidebarGenerateTitle}</h3>
                <ul className="space-y-1 text-xs text-text-secondary">
                  {t.sidebarGenerateBullets.map((line) => (
                    <li key={line}>- {line}</li>
                  ))}
                </ul>
              </section>
            </aside>
          </div>
        ) : (
          <div className="space-y-4">
            <section className="bg-surface rounded-xl border border-border p-5">
              <AISectionHeader
                eyebrow={t.planOverviewEyebrow}
                title={t.dashboardTitle}
                subtitle={t.dashboardSubtitle}
                rightAction={
                  <button type="button" className="btn-secondary" onClick={() => setPlan(null)}>
                    {t.reconfigureSetup}
                  </button>
                }
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
                <OverviewPill
                  label={t.overviewCaloriesRange}
                  value={plan.overview.calorieTargetRange}
                  icon={<Sparkles className="h-4 w-4 text-amber-200" />}
                  emphasized
                />
                <OverviewPill
                  label={t.overviewTrainingFreq}
                  value={plan.overview.trainingFrequency}
                  icon={<Swords className="h-4 w-4 text-info-300" />}
                  emphasized
                />
                <OverviewPill label={t.overviewDifficulty} value={plan.overview.planDifficulty} icon={<ShieldAlert className="h-4 w-4 text-amber-300" />} />
                <OverviewPill label={t.overviewExpectedPace} value={plan.overview.expectedPace} icon={<CalendarRange className="h-4 w-4 text-success-300" />} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                <OverviewPill label={t.overviewFlexibility} value={plan.overview.flexibilityLevel} icon={<WandSparkles className="h-4 w-4 text-primary-300" />} />
                <OverviewPill label={t.overviewConfidence} value={confidenceDisplay} icon={<ShieldCheck className="h-4 w-4 text-success-300" />} />
              </div>
            </section>

            <section className="bg-surface rounded-xl border border-border p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-text-primary">{t.adaptTodayTitle}</h3>
                <EvoStatusBadge label={t.adaptInProgressBadge} tone="warning" />
              </div>
              <p className="mb-2 text-xs uppercase tracking-[0.12em] text-text-muted">{t.adaptOneTapEyebrow}</p>
              <p className="text-xs text-text-secondary">{t.adaptOneTapBody}</p>
              {refreshingPlanBySignals ? <p className="text-xs text-text-secondary mt-3">{t.syncingTodaySignals}</p> : null}
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
              <section className="xl:col-span-8 space-y-4">
                <section className="bg-surface rounded-xl border border-border p-5">
                  <div className="mb-3">
                    <h3 className="text-base font-semibold text-text-primary">{t.weeklyNutritionPlanTitle}</h3>
                    <p className="text-xs text-text-muted mt-1">
                      {canExpandNutritionWeek && !showAllNutritionDays
                        ? t.weekNutritionSubtitlePartial(3, nutritionWeekFromToday.length)
                        : t.weekNutritionSubtitleFull}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {nutritionDaysVisible.map((day) => {
                      const dayTotals = sumDayMealMacros(day.meals);
                      return (
                      <div key={day.dayLabel} className="rounded-lg border border-border bg-surface-elevated p-3.5">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <p className="text-sm font-semibold text-text-primary">{day.dayLabel}</p>
                          <p className="text-xs">
                            <span className={`tabular-nums font-medium ${MACRO_VALUE_TONE_CLASS.calories}`}>
                              {Math.round(dayTotals.calories)} kcal
                            </span>
                            <span className="text-text-muted"> • </span>
                            <span className="text-text-muted">P </span>
                            <span className={`tabular-nums font-medium ${MACRO_VALUE_TONE_CLASS.protein}`}>
                              {Math.round(dayTotals.protein)}g
                            </span>
                            <span className="text-text-muted"> • </span>
                            <span className="text-text-muted">C </span>
                            <span className={`tabular-nums font-medium ${MACRO_VALUE_TONE_CLASS.carbs}`}>
                              {Math.round(dayTotals.carbs)}g
                            </span>
                            <span className="text-text-muted"> • </span>
                            <span className="text-text-muted">F </span>
                            <span className={`tabular-nums font-medium ${MACRO_VALUE_TONE_CLASS.fat}`}>
                              {Math.round(dayTotals.fat)}g
                            </span>
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {day.meals.map((meal) => (
                            <button
                              key={`${day.dayLabel}-${meal.mealType}-${meal.name}`}
                              type="button"
                              onClick={() =>
                                {
                                  setSelectedTraining(null);
                                  setSelectedMeal({
                                    dayLabel: day.dayLabel,
                                    dayTarget: {
                                      calories: Math.round(dayTotals.calories),
                                      protein: Math.round(dayTotals.protein),
                                      carbs: Math.round(dayTotals.carbs),
                                      fat: Math.round(dayTotals.fat),
                                    },
                                    meal,
                                  });
                                }
                              }
                              className="h-full rounded-md border border-border/80 bg-background/35 p-2.5 text-left transition-all hover:border-amber-300/50 hover:bg-amber-300/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                              aria-label={t.mealOpenRecipeAria(meal.name)}
                            >
                              <div className="flex h-full flex-col">
                                <div className="flex items-start justify-between gap-2 shrink-0">
                                  <p className="text-xs uppercase tracking-[0.08em] text-text-muted">{meal.mealType}</p>
                                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-100/90">
                                    <PanelRightOpen className="h-3.5 w-3.5" />
                                    {t.mealCardDetails}
                                  </span>
                                </div>
                                <p className="text-sm font-semibold text-text-primary mt-3 leading-snug">{meal.name}</p>
                                <p className="text-xs text-text-secondary mt-3 mb-3 leading-relaxed">
                                  {truncateText(meal.description, 108)}
                                </p>
                                <p className="text-xs mt-auto leading-snug">
                                  <span className={`tabular-nums font-medium ${MACRO_VALUE_TONE_CLASS.calories}`}>
                                    {meal.estimatedCalories} kcal
                                  </span>
                                  <span className="text-text-muted"> • </span>
                                  <span className="text-text-muted">P </span>
                                  <span className={`tabular-nums font-medium ${MACRO_VALUE_TONE_CLASS.protein}`}>
                                    {meal.estimatedProtein}g
                                  </span>
                                  <span className="text-text-muted"> • </span>
                                  <span className="text-text-muted">C </span>
                                  <span className={`tabular-nums font-medium ${MACRO_VALUE_TONE_CLASS.carbs}`}>
                                    {meal.estimatedCarbs}g
                                  </span>
                                  <span className="text-text-muted"> • </span>
                                  <span className="text-text-muted">F </span>
                                  <span className={`tabular-nums font-medium ${MACRO_VALUE_TONE_CLASS.fat}`}>
                                    {meal.estimatedFat}g
                                  </span>
                                  <span className="text-text-muted"> • </span>
                                  <span className="text-text-secondary">{t.mealPrepSuffix(meal.prepTimeMinutes)}</span>
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                  {canExpandNutritionWeek ? (
                    <button
                      type="button"
                      onClick={() => setShowAllNutritionDays((previous) => !previous)}
                      className="mt-3 w-full rounded-lg border border-amber-300/35 bg-amber-300/5 px-3 py-2.5 text-sm text-amber-100/95 transition-colors hover:bg-amber-300/10"
                    >
                      {showAllNutritionDays ? t.showOnlyThreeNutritionDays : t.showRemainingNutritionDays(remainingNutritionDaysCount)}
                    </button>
                  ) : null}
                </section>

                <section className="bg-surface rounded-xl border border-border p-5">
                  <div className="mb-3">
                    <h3 className="text-base font-semibold text-text-primary">{t.weeklyTrainingPlanTitle}</h3>
                    <p className="text-xs text-text-muted mt-1">
                      {canExpandTrainingWeek && !showAllTrainingDays
                        ? t.weekTrainingSubtitlePartial(3, trainingWeekFromToday.length)
                        : t.weekTrainingSubtitleFull}
                    </p>
                  </div>
                  <div className="space-y-2.5">
                    {trainingDaysVisible.map((session) => (
                      <button
                        key={`${session.dayLabel}-${session.sessionGoal}`}
                        type="button"
                        onClick={() => {
                          setSelectedMeal(null);
                          setSelectedTraining({ session });
                        }}
                        className="w-full rounded-lg border border-border bg-surface-elevated p-3.5 text-left transition-all hover:border-info-300/45 hover:bg-info-300/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info-300/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        aria-label={`${t.drawerTrainingSession}: ${session.dayLabel}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-text-primary">
                            {session.dayLabel} • {session.workoutType}
                          </p>
                          <p className="text-xs text-text-secondary">{session.durationMinutes} min • {session.intensity}</p>
                        </div>
                        <p className="text-sm text-text-secondary mt-1">{truncateText(session.sessionGoal, 96)}</p>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="rounded-md border border-border/70 bg-background/35 p-2">
                            <p className="text-[11px] uppercase tracking-[0.09em] text-text-muted">{t.trainingFallbackLabel}</p>
                            <p className="text-xs text-text-secondary mt-1">{truncateText(session.fallbackVersion, 92)}</p>
                          </div>
                          <div className="rounded-md border border-border/70 bg-background/35 p-2">
                            <p className="text-[11px] uppercase tracking-[0.09em] text-text-muted">{t.trainingMinimumViableLabel}</p>
                            <p className="text-xs text-text-secondary mt-1">{truncateText(session.minimumViableVersion, 92)}</p>
                          </div>
                        </div>
                        <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-info-300">
                          <Activity className="h-3.5 w-3.5" />
                          {t.trainingViewSessionDetails}
                          <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </button>
                    ))}
                  </div>
                  {canExpandTrainingWeek ? (
                    <button
                      type="button"
                      onClick={() => setShowAllTrainingDays((previous) => !previous)}
                      className="mt-3 w-full rounded-lg border border-info-300/35 bg-info-300/5 px-3 py-2.5 text-sm text-info-200/95 transition-colors hover:bg-info-300/10"
                    >
                      {showAllTrainingDays ? t.showOnlyThreeTrainingDays : t.showRemainingTrainingDays(remainingTrainingDaysCount)}
                    </button>
                  ) : null}
                </section>
              </section>

              <aside className="xl:col-span-4 space-y-4">
                {plan.smartWarnings.length > 0 ? (
                  <section className="bg-surface rounded-xl border border-amber-300/35 p-4">
                    <h4 className="text-sm font-semibold text-amber-100 mb-2">{t.biggestRiskTitle}</h4>
                    <ul className="space-y-1 text-xs text-amber-100/90">
                      {plan.smartWarnings.map((warning) => (
                        <li key={warning}>- {warning}</li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-amber-100/90">
                      {t.bestMitigationPrefix} {plan.executionTips[0] || t.bestMitigationDefault}
                    </p>
                  </section>
                ) : null}

                <section className="bg-surface rounded-xl border border-border p-4">
                  <h4 className="text-sm font-semibold text-amber-100 mb-2">{t.whyWeekTitle}</h4>
                  <ul className="space-y-1 text-xs text-text-secondary">
                    {plan.rationale.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </section>

                <section className="bg-surface rounded-xl border border-border p-4">
                  <h4 className="text-sm font-semibold text-text-primary mb-2 inline-flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary-300" /> {t.weeklySuccessTitle}
                  </h4>
                  <ul className="space-y-1 text-xs text-text-secondary">
                    {weeklySuccessMarkers.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-success-300 inline-flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5" /> {t.nextBestActionPrefix}{' '}
                    {plan.executionTips[0] || t.nextBestActionFallback}
                  </p>
                </section>

                <section className="bg-surface rounded-xl border border-border p-4">
                  <h4 className="text-sm font-semibold text-text-primary mb-2 inline-flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" /> {t.shoppingListTitle}
                  </h4>
                  <div className="space-y-2 text-xs">
                    <ShoppingGroup label={t.shopProteins} emptyLabel={t.shoppingListEmpty} items={plan.shoppingList.proteins} />
                    <ShoppingGroup label={t.shopCarbs} emptyLabel={t.shoppingListEmpty} items={plan.shoppingList.carbs} />
                    <ShoppingGroup label={t.shopFats} emptyLabel={t.shoppingListEmpty} items={plan.shoppingList.fats} />
                    <ShoppingGroup label={t.shopVegetables} emptyLabel={t.shoppingListEmpty} items={plan.shoppingList.vegetables} />
                    <ShoppingGroup label={t.shopDairy} emptyLabel={t.shoppingListEmpty} items={plan.shoppingList.dairy} />
                    <ShoppingGroup label={t.shopExtras} emptyLabel={t.shoppingListEmpty} items={plan.shoppingList.extras} />
                    <ShoppingGroup label={t.shopOptional} emptyLabel={t.shoppingListEmpty} items={plan.shoppingList.optionalItems} />
                  </div>
                </section>

                <section className="bg-surface rounded-xl border border-border p-4">
                  <h4 className="text-sm font-semibold text-text-primary mb-2">{t.coachGuidanceTitle}</h4>
                  <EvoHintCard title={t.hardestPart} content={plan.hardestPartThisWeek} tone="warning" />
                  <EvoHintCard title={t.whereToFocus} content={plan.focusForBestResults} tone="positive" />
                </section>
              </aside>
            </div>

            <section className="bg-surface rounded-xl border border-border p-5">
              <h3 className="text-base font-semibold text-text-primary mb-2">{t.coachNotesTradeoffs}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <NotesList title={t.notesCoach} items={plan.coachNotes} />
                <NotesList title={t.notesExecution} items={plan.executionTips} />
                <NotesList title={t.notesMealPrep} items={plan.mealPrepTips} />
                <NotesList title={t.notesSubstitutions} items={plan.substitutions.ingredientSubstitutions} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div className="rounded-lg border border-success-300/35 bg-success-300/10 p-3">
                  <p className="text-xs uppercase tracking-[0.1em] text-text-muted">{t.bestCasePlan}</p>
                  <p className="text-sm text-text-primary mt-1">{plan.bestCasePlan}</p>
                </div>
                <div className="rounded-lg border border-primary-300/35 bg-primary-500/10 p-3">
                  <p className="text-xs uppercase tracking-[0.1em] text-text-muted">{t.realisticPlan}</p>
                  <p className="text-sm text-text-primary mt-1">{plan.realisticPlan}</p>
                </div>
              </div>
            </section>
          </div>
        )}

        {generatingPlan ? <CoachProGenerationOverlay copy={t} /> : null}

        {!plan && !generatingPlan && step > 3 ? (
          <InsightEmptyState title={t.emptySetupTitle} description={t.emptySetupDescription} />
        ) : null}

        <MealDetailsDrawer
          copy={t}
          locale={uiLocale}
          selectedMeal={selectedMeal}
          aiMealDetails={mealDrawerDetails}
          aiLoading={mealDrawerLoading}
          actionLoading={mealActionLoading}
          onClose={() => {
            setSelectedMeal(null);
            setMealDrawerDetails(null);
          }}
          onAction={handleMealAction}
        />
        <TrainingDetailsDrawer
          copy={t}
          selectedTraining={selectedTraining}
          aiDetails={trainingDrawerDetails}
          aiLoading={trainingDrawerLoading}
          onClose={() => {
            setSelectedTraining(null);
            setTrainingDrawerDetails(null);
          }}
        />
      </div>
    </AppShell>
  );
}

const truncateText = (value: string, maxChars: number) => {
  const text = String(value || '').trim();
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars - 1).trim()}…`;
};

/** Same tones as Dashboard `StatCard`: Calories / Protein / Carbs / Fat */
const MACRO_VALUE_TONE_CLASS = {
  calories: 'text-primary-500',
  protein: 'text-info-500',
  carbs: 'text-success-500',
  fat: 'text-primary-300',
} as const;

const sumDayMealMacros = (meals: PlanMeal[]) =>
  meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + Number(meal?.estimatedCalories || 0),
      protein: acc.protein + Number(meal?.estimatedProtein || 0),
      carbs: acc.carbs + Number(meal?.estimatedCarbs || 0),
      fat: acc.fat + Number(meal?.estimatedFat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

const META_PILL_VALUE_MAX_CHARS = 28;

function MetaPill({ label, value }: { label: string; value: string }) {
  const full = String(value || '').trim();
  const display = truncateText(full, META_PILL_VALUE_MAX_CHARS);
  const truncatedByLength = full.length > META_PILL_VALUE_MAX_CHARS;
  const valueRef = useRef<HTMLSpanElement>(null);
  const [truncatedByLayout, setTruncatedByLayout] = useState(false);

  useLayoutEffect(() => {
    const el = valueRef.current;
    if (!el) {
      setTruncatedByLayout(false);
      return;
    }
    const measure = () => {
      setTruncatedByLayout(el.scrollWidth > el.clientWidth + 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [display, label]);

  const showTooltip = truncatedByLength || truncatedByLayout;

  const pill = (
    <span className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-md border border-amber-300/35 bg-amber-300/10 px-2 py-1 text-[11px] text-amber-100/95">
      <span className="shrink-0 uppercase tracking-[0.1em] text-amber-200/90">{label}</span>
      <span ref={valueRef} className="min-w-0 truncate text-amber-100">
        {display}
      </span>
    </span>
  );

  if (!showTooltip) {
    return pill;
  }

  return (
    <Tooltip
      content={full}
      side="top"
      className="max-w-[min(20rem,90vw)] !whitespace-normal border-amber-300/45 text-left text-amber-100 leading-snug"
    >
      {pill}
    </Tooltip>
  );
}

function MealDetailsDrawer({
  copy,
  locale,
  selectedMeal,
  aiMealDetails,
  aiLoading,
  actionLoading,
  onClose,
  onAction,
}: {
  copy: CoachProPageCopy;
  locale: UiLocale;
  selectedMeal: SelectedPlanMeal | null;
  aiMealDetails: PlanMeal | null;
  aiLoading: boolean;
  actionLoading: boolean;
  onClose: () => void;
  onAction: (action: MealSmartActionKey) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [isRendered, setIsRendered] = useState(Boolean(selectedMeal));
  const [isOpen, setIsOpen] = useState(Boolean(selectedMeal));
  const [activeMeal, setActiveMeal] = useState<SelectedPlanMeal | null>(selectedMeal);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedMeal) {
      setActiveMeal(selectedMeal);
      setIsRendered(true);
      const frame = requestAnimationFrame(() => setIsOpen(true));
      return () => cancelAnimationFrame(frame);
    }
    if (!isRendered) return;
    setIsOpen(false);
    const timeout = window.setTimeout(() => {
      setIsRendered(false);
      setActiveMeal(null);
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [selectedMeal, isRendered]);

  useEffect(() => {
    if (!isRendered) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isRendered, onClose]);

  if (!mounted || !isRendered || !activeMeal) return null;

  const { dayLabel, meal, dayTarget } = activeMeal;
  const displayMeal = aiMealDetails || meal;
  const showLoadingSkeleton = aiLoading && !aiMealDetails;
  const tags = (displayMeal.tags || []).slice(0, 7);
  const ingredients = displayMeal.ingredients || [];
  const steps = displayMeal.recipeSteps || [];

  return createPortal(
    <div className="fixed inset-0 z-[120]">
      <button
        type="button"
        className={`absolute inset-0 bg-background/60 backdrop-blur-[1px] transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label={copy.drawerCloseMeal}
        onClick={onClose}
      />
      <section
        className={`absolute inset-y-0 right-0 left-auto h-full w-full max-w-2xl rounded-none border-l border-border bg-surface shadow-2xl overflow-hidden transition-transform duration-200 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.1em] text-text-muted">
                {dayLabel} • {displayMeal.mealType}
              </p>
              <h3 className="text-xl font-semibold text-text-primary mt-1">{displayMeal.name}</h3>
              {aiLoading ? <p className="text-xs text-amber-200 mt-1">{copy.drawerGeneratingMeal}</p> : null}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full border border-amber-300/35 bg-amber-300/10 px-2 py-[3px] text-[11px] text-amber-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-text-secondary hover:text-text-primary hover:border-amber-300/40"
              aria-label={copy.drawerClosePanel}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatBadge icon={<Flame className="h-3.5 w-3.5" />} label={copy.statCalories} value={`${displayMeal.estimatedCalories} kcal`} />
            <StatBadge icon={<BadgeCheck className="h-3.5 w-3.5" />} label={copy.statProtein} value={`${displayMeal.estimatedProtein} g`} />
            <StatBadge icon={<Leaf className="h-3.5 w-3.5" />} label={copy.statCarbsFat} value={`${displayMeal.estimatedCarbs} / ${displayMeal.estimatedFat} g`} />
            <StatBadge icon={<Timer className="h-3.5 w-3.5" />} label={copy.statPrepTime} value={`${displayMeal.prepTimeMinutes} min`} />
          </div>

          <div className="mt-5 space-y-5">
            {showLoadingSkeleton ? (
              <>
                <section className="rounded-lg border border-border bg-surface-elevated p-3.5 space-y-2">
                  <Skeleton className="h-3 w-24 rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-11/12 rounded" />
                </section>
                <section className="rounded-lg border border-border bg-surface-elevated p-3.5 space-y-2">
                  <Skeleton className="h-3 w-24 rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-10/12 rounded" />
                  <Skeleton className="h-4 w-9/12 rounded" />
                </section>
                <section className="rounded-lg border border-border bg-surface-elevated p-3.5 space-y-2">
                  <Skeleton className="h-3 w-24 rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-11/12 rounded" />
                  <Skeleton className="h-4 w-8/12 rounded" />
                </section>
              </>
            ) : (
              <>
                <section className="rounded-lg border border-border bg-surface-elevated p-3.5">
                  <p className="text-xs uppercase tracking-[0.1em] text-text-muted">{copy.sectionDescription}</p>
                  <p className="text-sm text-text-primary mt-2">{displayMeal.description}</p>
                  {displayMeal.rationale ? (
                    <p className="text-xs text-text-secondary mt-2">
                      {copy.whyInPlan} {displayMeal.rationale}
                    </p>
                  ) : null}
                </section>

                <section className="rounded-lg border border-border bg-surface-elevated p-3.5">
                  <p className="text-xs uppercase tracking-[0.1em] text-text-muted">{copy.sectionIngredients}</p>
                  {ingredients.length > 0 ? (
                    <ul className="mt-2 space-y-1.5">
                      {ingredients.map((ingredient) => (
                        <li key={`${ingredient.item}-${ingredient.quantity}`} className="text-sm text-text-primary">
                          - {ingredient.quantity} {ingredient.item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-text-secondary mt-2">{copy.noIngredients}</p>
                  )}
                </section>

                <section className="rounded-lg border border-border bg-surface-elevated p-3.5">
                  <p className="text-xs uppercase tracking-[0.1em] text-text-muted">{copy.sectionRecipe}</p>
                  {steps.length > 0 ? (
                    <ol className="mt-2 space-y-2 list-decimal pl-5">
                      {steps.map((step, index) => (
                        <li key={`${index}-${step}`} className="text-sm text-text-primary">
                          {step}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-text-secondary mt-2">{copy.noRecipeSteps}</p>
                  )}
                </section>

                <section className="rounded-lg border border-border bg-surface-elevated p-3.5">
                  <p className="text-xs uppercase tracking-[0.1em] text-text-muted">{copy.sectionNutritionDetails}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 text-sm">
                    <DetailRow label={copy.detailCalories} value={`${displayMeal.estimatedCalories} kcal`} />
                    <DetailRow label={copy.detailProtein} value={`${displayMeal.estimatedProtein} g`} />
                    <DetailRow label={copy.detailCarbs} value={`${displayMeal.estimatedCarbs} g`} />
                    <DetailRow label={copy.detailFats} value={`${displayMeal.estimatedFat} g`} />
                    <DetailRow label={copy.detailFiber} value={`${displayMeal.fiberGrams ?? '-'} g`} />
                    <DetailRow label={copy.detailSatiety} value={displayMeal.estimatedSatiety || '-'} />
                  </div>
                  <p className="text-xs text-text-secondary mt-2">
                    {copy.suggestedUseLine(displayMeal.suggestedUse || copy.generalMeal, dayTarget.calories, dayTarget.protein)}
                  </p>
                </section>

                <section className="rounded-lg border border-border bg-surface-elevated p-3.5">
                  <p className="text-xs uppercase tracking-[0.1em] text-text-muted">{copy.smartActionsTitle}</p>
                  {actionLoading ? <p className="mt-2 text-xs text-amber-200/90">{copy.applyingAction}</p> : null}
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {MEAL_SMART_ACTION_KEYS.map((actionKey) => (
                      <button
                        key={actionKey}
                        type="button"
                        disabled={actionLoading || aiLoading}
                        onClick={() => onAction(actionKey)}
                        className="rounded-md border border-border px-3 py-2 text-left text-sm text-text-secondary hover:text-text-primary hover:border-amber-300/45 hover:bg-amber-300/10 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {mealSmartActionLabel(locale, actionKey)}
                      </button>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
    ,
    document.body
  );
}

function TrainingDetailsDrawer({
  copy,
  selectedTraining,
  aiDetails,
  aiLoading,
  onClose,
}: {
  copy: CoachProPageCopy;
  selectedTraining: SelectedTrainingSession | null;
  aiDetails: TrainingDrawerDetails | null;
  aiLoading: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [isRendered, setIsRendered] = useState(Boolean(selectedTraining));
  const [isOpen, setIsOpen] = useState(Boolean(selectedTraining));
  const [activeTraining, setActiveTraining] = useState<SelectedTrainingSession | null>(selectedTraining);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedTraining) {
      setActiveTraining(selectedTraining);
      setIsRendered(true);
      const frame = requestAnimationFrame(() => setIsOpen(true));
      return () => cancelAnimationFrame(frame);
    }
    if (!isRendered) return;
    setIsOpen(false);
    const timeout = window.setTimeout(() => {
      setIsRendered(false);
      setActiveTraining(null);
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [selectedTraining, isRendered]);

  useEffect(() => {
    if (!isRendered) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isRendered, onClose]);

  if (!mounted || !isRendered || !activeTraining) return null;

  const session = aiDetails?.session || activeTraining.session;
  const showLoadingSkeleton = aiLoading && !aiDetails;
  const warmUp = session.structure.find((block) => /warm|prep/i.test(block.name));
  const mainWork = session.structure.filter((block) => !/warm|cool|reset/i.test(block.name)).slice(0, 4);
  const cooldown = session.structure.find((block) => /cool|reset/i.test(block.name));

  return createPortal(
    <div className="fixed inset-0 z-[120]">
      <button
        type="button"
        className={`absolute inset-0 bg-background/60 backdrop-blur-[1px] transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label={copy.drawerTrainingClose}
        onClick={onClose}
      />
      <section
        className={`absolute inset-y-0 right-0 left-auto h-full w-full max-w-2xl rounded-none border-l border-border bg-surface shadow-2xl overflow-hidden transition-transform duration-200 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.1em] text-text-muted">
                {session.dayLabel} • {copy.drawerTrainingSession}
              </p>
              <h3 className="text-xl font-semibold text-text-primary mt-1">{session.workoutType}</h3>
              <p className="text-sm text-text-secondary mt-1">{session.sessionGoal}</p>
              {aiLoading ? <p className="text-xs text-info-300 mt-1">{copy.drawerGeneratingTraining}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-text-secondary hover:text-text-primary hover:border-info-300/45"
              aria-label={copy.drawerClosePanel}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatBadge icon={<Timer className="h-3.5 w-3.5" />} label={copy.statDuration} value={`${session.durationMinutes} min`} />
            <StatBadge icon={<Activity className="h-3.5 w-3.5" />} label={copy.statIntensity} value={session.intensity} />
            <StatBadge icon={<Swords className="h-3.5 w-3.5" />} label={copy.statBlocks} value={`${session.structure.length}`} />
            <StatBadge icon={<ShieldCheck className="h-3.5 w-3.5" />} label={copy.statMode} value={copy.statModeAdaptive} />
          </div>

          <div className="mt-5 space-y-5">
            {showLoadingSkeleton ? (
              <>
                <section className="rounded-lg border border-border bg-surface-elevated p-3.5 space-y-2">
                  <Skeleton className="h-3 w-24 rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-10/12 rounded" />
                </section>
                <section className="rounded-lg border border-border bg-surface-elevated p-3.5 space-y-2">
                  <Skeleton className="h-3 w-24 rounded" />
                  <Skeleton className="h-10 w-full rounded-md" />
                  <Skeleton className="h-10 w-full rounded-md" />
                  <Skeleton className="h-10 w-11/12 rounded-md" />
                </section>
                <section className="rounded-lg border border-border bg-surface-elevated p-3.5 space-y-2">
                  <Skeleton className="h-3 w-24 rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-9/12 rounded" />
                </section>
              </>
            ) : (
              <>
                <section className="rounded-lg border border-border bg-surface-elevated p-3.5">
                  <p className="text-xs uppercase tracking-[0.1em] text-text-muted">{copy.warmUpTitle}</p>
                  <p className="text-sm text-text-primary mt-2">
                    {warmUp
                      ? `${warmUp.name} • ${warmUp.durationMinutes || '-'} min • ${warmUp.notes || copy.warmUpBlockNoteDefault}`
                      : copy.warmUpFallback}
                  </p>
                </section>

                <section className="rounded-lg border border-border bg-surface-elevated p-3.5">
                  <p className="text-xs uppercase tracking-[0.1em] text-text-muted">{copy.mainWorkTitle}</p>
                  <ul className="mt-2 space-y-2">
                    {mainWork.map((block) => (
                      <li key={block.name} className="rounded-md border border-border/80 bg-background/35 p-2">
                        <p className="text-sm font-medium text-text-primary">{block.name}</p>
                        <p className="text-xs text-text-secondary mt-1">
                          {copy.setsRepsMinLine(block.sets || '-', block.reps || '-', block.durationMinutes || '-')}
                        </p>
                        {block.notes ? <p className="text-xs text-text-secondary mt-1">{block.notes}</p> : null}
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="rounded-lg border border-border bg-surface-elevated p-3.5">
                  <p className="text-xs uppercase tracking-[0.1em] text-text-muted">{copy.cooldownTitle}</p>
                  <p className="text-sm text-text-primary mt-2">
                    {cooldown
                      ? `${cooldown.name} • ${cooldown.durationMinutes || '-'} min • ${cooldown.notes || copy.cooldownBlockNoteDefault}`
                      : copy.cooldownFallback}
                  </p>
                </section>

                <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-info-300/35 bg-info-300/10 p-3.5">
                    <p className="text-xs uppercase tracking-[0.1em] text-info-200">{copy.fallbackShortTitle}</p>
                    <p className="text-sm text-text-primary mt-1">{session.fallbackVersion}</p>
                  </div>
                  <div className="rounded-lg border border-primary-300/35 bg-primary-500/10 p-3.5">
                    <p className="text-xs uppercase tracking-[0.1em] text-primary-200">{copy.minViableTitle}</p>
                    <p className="text-sm text-text-primary mt-1">{session.minimumViableVersion}</p>
                  </div>
                </section>

                <section className="rounded-lg border border-border bg-surface-elevated p-3.5">
                  <p className="text-xs uppercase tracking-[0.1em] text-text-muted">{copy.whySessionTitle}</p>
                  <p className="text-sm text-text-primary mt-2">{copy.whySessionBody}</p>
                  <p className="text-xs text-text-secondary mt-2">
                    {aiDetails?.painSubstitution || copy.painSubstitutionFallback}
                  </p>
                  {aiDetails?.whyThisSession ? (
                    <p className="text-xs text-info-200 mt-2">
                      {copy.whySessionPrefix} {aiDetails.whyThisSession}
                    </p>
                  ) : null}
                </section>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
    ,
    document.body
  );
}

function StatBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-elevated px-2.5 py-2">
      <p className="inline-flex items-center gap-1 text-[11px] text-text-muted">
        {icon}
        {label}
      </p>
      <p className="text-sm text-text-primary mt-0.5">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/80 bg-background/40 p-2">
      <p className="text-[11px] text-text-muted uppercase tracking-[0.07em]">{label}</p>
      <p className="text-sm text-text-primary mt-1">{value}</p>
    </div>
  );
}

function TextAreaRow({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-xs text-text-secondary mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input-field w-full min-h-20 resize-y"
        placeholder={placeholder}
      />
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-text-secondary mb-1">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input-field w-full"
        placeholder={placeholder}
      />
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div>
      <label className="block text-xs text-text-secondary mb-1">{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="input-field w-full"
      />
    </div>
  );
}

function FieldSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-text-secondary mb-1">{label}</label>
      <select className="input-field w-full" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function BooleanRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
        value
          ? 'border-amber-300/45 bg-amber-300/10 text-amber-100'
          : 'border-border bg-surface-elevated text-text-secondary'
      }`}
      aria-pressed={value}
    >
      {label}
    </button>
  );
}

function MultiSelectChips<T extends string>({
  title,
  options,
  values,
  onToggle,
}: {
  title: string;
  options: Array<{ value: T; label: string }>;
  values: T[];
  onToggle: (value: T) => void;
}) {
  return (
    <div>
      <p className="text-xs text-text-secondary mb-2">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = values.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onToggle(option.value)}
              className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                active
                  ? 'border-amber-300/45 bg-amber-300/10 text-amber-100'
                  : 'border-border text-text-secondary hover:text-text-primary'
              }`}
              aria-pressed={active}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OverviewPill({
  label,
  value,
  icon,
  emphasized = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  emphasized?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        emphasized ? 'border-amber-300/40 bg-amber-300/10' : 'border-border bg-surface-elevated'
      }`}
    >
      <div className="inline-flex items-center gap-1.5 text-xs text-text-muted">
        {icon}
        {label}
      </div>
      <p className={`${emphasized ? 'text-base' : 'text-sm'} font-semibold text-text-primary mt-1`}>{value}</p>
    </div>
  );
}

function ShoppingGroup({ label, items, emptyLabel }: { label: string; items: string[]; emptyLabel: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-elevated p-2.5">
      <p className="text-[11px] uppercase tracking-[0.1em] text-text-muted">{label}</p>
      {items.length > 0 ? (
        <ul className="mt-1 list-disc pl-4 space-y-0.5">
          {items.map((item) => (
            <li key={`${label}-${item}`} className="text-xs text-text-primary">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-text-secondary mt-1">{emptyLabel}</p>
      )}
    </div>
  );
}

function NotesList({ title, items }: { title: string; items: string[] }) {
  const substitutionsMode = /substitutions/i.test(title);
  return (
    <div className="rounded-lg border border-border bg-surface-elevated p-3">
      <p className="text-xs uppercase tracking-[0.1em] text-text-muted">{title}</p>
      {substitutionsMode ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {items.slice(0, 6).map((item) => (
            <span key={item} className="inline-flex rounded-md border border-border px-2 py-1 text-xs text-text-primary">
              {item}
            </span>
          ))}
        </div>
      ) : (
        <ul className="mt-2 space-y-1">
          {items.slice(0, 5).map((item) => (
            <li key={item} className="text-sm text-text-primary">
              - {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CoachProGenerationOverlay({ copy }: { copy: CoachProPageCopy }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200]">
      <div className="absolute inset-0 bg-background/55 backdrop-blur-md" aria-hidden />
      <div className="relative z-[1] flex min-h-[100dvh] flex-col items-center overflow-y-auto p-4 sm:p-6">
        <section className="my-auto w-full max-w-2xl shrink-0 rounded-2xl border border-primary-300/25 bg-surface/95 p-5 sm:p-6 shadow-[0_24px_70px_rgba(0,0,0,0.5)]">
          <div className="flex items-start gap-3">
            <AICoachAvatar size="md" />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.12em] text-primary-200">{copy.generationOverlayEyebrow}</p>
              <h3 className="text-lg font-semibold text-text-primary mt-1">{copy.generationOverlayTitle}</h3>
              <p className="text-sm text-text-secondary mt-1">{copy.generationOverlayBody}</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-primary-300/30 bg-primary-500/10 px-3 py-1.5 text-xs text-primary-100">
                <ButtonSpinner />
                {copy.generationOverlayProcessing}
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-xl border border-border bg-surface-elevated p-3">
              <p className="text-[11px] uppercase tracking-[0.1em] text-text-muted mb-2">{copy.generationSkeletonOverview}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Skeleton className="h-12 w-full rounded-md" />
                <Skeleton className="h-12 w-full rounded-md" />
                <Skeleton className="h-12 w-full rounded-md" />
                <Skeleton className="h-12 w-full rounded-md" />
              </div>
            </div>
            <div className="rounded-xl border border-border bg-surface-elevated p-3">
              <p className="text-[11px] uppercase tracking-[0.1em] text-text-muted mb-2">{copy.generationSkeletonNutrition}</p>
              <div className="space-y-2">
                <Skeleton className="h-14 w-full rounded-md" />
                <Skeleton className="h-14 w-full rounded-md" />
                <Skeleton className="h-14 w-full rounded-md" />
              </div>
            </div>
            <div className="rounded-xl border border-border bg-surface-elevated p-3">
              <p className="text-[11px] uppercase tracking-[0.1em] text-text-muted mb-2">{copy.generationSkeletonTraining}</p>
              <div className="space-y-2">
                <Skeleton className="h-12 w-full rounded-md" />
                <Skeleton className="h-12 w-full rounded-md" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>,
    document.body
  );
}
