'use client';

import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import { Camera, Dumbbell, Flame, Pencil, Trash2 } from 'lucide-react';
import {
  ME_QUERY,
  WEEKLY_EVO_REVIEW_QUERY,
} from '@/lib/graphql/queries';
import { clearAuthToken } from '@/lib/auth-token';
import { clearApolloClientCache } from '@/lib/apollo-client';
import AppShell from '@/components/AppShell';
import PageTopBar from '@/components/ui/molecules/PageTopBar';
import ContextAICoach from '@/components/ContextAICoach';
import { ListRowSkeleton, PageLoader, Skeleton, StatCardSkeleton } from '@/components/ui/loading';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { getDestructiveConfirmLabels } from '@/lib/i18n/destructive-confirm';
import {
  DELETE_FOOD_ITEM_MUTATION,
  DELETE_WORKOUT_MUTATION,
  UPDATE_FOOD_ITEM_MUTATION,
  UPDATE_WORKOUT_MUTATION,
  UPSERT_DAILY_ACTIVITY_MUTATION,
} from '@/lib/graphql/mutations';
import { appToast } from '@/lib/app-toast';
import {
  buildDayRefetchQueriesAfterLog,
  buildRollingSevenDayAverageStepsRefetch,
  kickDeferredAfterMealLog,
  kickDeferredAfterWorkoutLog,
  kickDeferredDashboardAndWeeklyEvo,
} from '@/lib/day-data';
import { useDaySnapshot } from '@/hooks/useDaySnapshot';
import { useClientCalendarToday } from '@/hooks/useClientCalendarToday';
import { formatPrimaryGoal } from '@/lib/formatters';
import {
  AiTransparencyNotice,
  AISectionHeader,
  EvoHintCard,
  InsightEmptyState,
} from '@/components/evo';
import { graphqlAppLocaleToUi } from '@/lib/i18n/ui-locale';
import { statsPageCopy } from '@/lib/i18n/copy/stats-page';
import { getAiTransparencyStrings } from '@/lib/i18n/copy/ai-transparency';
import { accentEdgeClasses } from '@/components/ui/accent-cards';
import { NumericInput } from '@/components/ui/atoms/NumericInput';
import { MealMacroConfidenceBlock } from '@/components/meals/MealMacroConfidenceBlock';
import EditMealDialog from '@/components/meals/EditMealDialog';
import EditWorkoutDialog, {
  type EditableWorkoutPayload,
} from '@/components/workouts/EditWorkoutDialog';
import { workoutsPageCopy } from '@/lib/i18n/copy/workouts-page';
import { mealsPageCopy, mealTypeLabels } from '@/lib/i18n/copy/meals-page';
import type { StatsDayMeal } from '@/lib/types/stats-day-meal';
import { GoalRingCard } from '@/components/dashboard';
import { buildDashboardGoalHoverHint, getDashboardStrings } from '@/lib/i18n/copy/dashboard';

type AnalysisMode = 'combined' | 'nutrition' | 'training';

export default function StatsPage() {
  const client = useApolloClient();
  const router = useRouter();
  const { dateKey: today, timeZone } = useClientCalendarToday();
  const [selectedDate, setSelectedDate] = useState(today);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('combined');
  const [stepsInput, setStepsInput] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ kind: 'meal' | 'workout'; id: string } | null>(null);
  const [mealToEditId, setMealToEditId] = useState<string | null>(null);
  const [workoutToEditId, setWorkoutToEditId] = useState<string | null>(null);

  const { data: userData, loading: userLoading, error: userError } = useQuery(ME_QUERY);
  const daySnapshot = useDaySnapshot({
    date: selectedDate,
    clientTimeZone: timeZone,
    enabled: Boolean(userData?.me),
    includeInsight: true,
  });
  const { data: weeklyReviewData } = useQuery(WEEKLY_EVO_REVIEW_QUERY, {
    variables: { endDate: selectedDate },
    skip: !userData?.me,
  });

  const [deleteFoodItem, { loading: deletingMeal }] = useMutation(DELETE_FOOD_ITEM_MUTATION, {
    onCompleted: () => {
      kickDeferredAfterMealLog(client);
    },
    onError: (error) => {
      appToast.error('Delete failed', error.message || 'Could not delete meal.');
    },
    refetchQueries: [...buildDayRefetchQueriesAfterLog(selectedDate, timeZone)],
    awaitRefetchQueries: true,
  });

  const [deleteWorkout, { loading: deletingWorkout }] = useMutation(DELETE_WORKOUT_MUTATION, {
    onCompleted: () => {
      kickDeferredAfterWorkoutLog(client);
    },
    onError: (error) => {
      appToast.error('Delete failed', error.message || 'Could not delete workout.');
    },
    refetchQueries: [...buildDayRefetchQueriesAfterLog(selectedDate, timeZone)],
    awaitRefetchQueries: true,
  });

  const [updateFoodItemMutation, { loading: savingMealEdits }] = useMutation(UPDATE_FOOD_ITEM_MUTATION, {
    onCompleted: () => kickDeferredAfterMealLog(client),
    onError: (error) => {
      appToast.error('Update failed', error.message || 'Could not save meal.');
    },
    refetchQueries: [...buildDayRefetchQueriesAfterLog(selectedDate, timeZone)],
    awaitRefetchQueries: true,
  });

  const [updateWorkoutMutation, { loading: savingWorkoutEdits }] = useMutation(UPDATE_WORKOUT_MUTATION, {
    onCompleted: () => kickDeferredAfterWorkoutLog(client),
    onError: (error) => {
      appToast.error('Update failed', error.message || 'Could not save workout.');
    },
    refetchQueries: [...buildDayRefetchQueriesAfterLog(selectedDate, timeZone)],
    awaitRefetchQueries: true,
  });

  const [upsertDailyActivity, { loading: savingSteps }] = useMutation(UPSERT_DAILY_ACTIVITY_MUTATION, {
    onCompleted: () => {
      kickDeferredDashboardAndWeeklyEvo(client);
      appToast.success('Steps updated', 'Daily activity has been saved.');
    },
    onError: (error) => {
      appToast.error('Save failed', error.message || 'Could not update steps.');
    },
    refetchQueries: [
      ...buildDayRefetchQueriesAfterLog(selectedDate, timeZone),
      buildRollingSevenDayAverageStepsRefetch(today, timeZone),
    ],
    awaitRefetchQueries: true,
  });

  useEffect(() => {
    if (!userError) return;
    appToast.error('Session expired', 'Please login again.');
    void (async () => {
      clearAuthToken();
      await clearApolloClientCache();
      router.push('/login');
    })();
  }, [userError, router]);

  useEffect(() => {
    setStepsInput(String(Math.round(Number(daySnapshot.activity?.steps ?? 0))));
  }, [daySnapshot.activity?.steps, selectedDate]);

  if (userLoading) {
    return <PageLoader />;
  }

  const user = userData?.me;
  const locale = graphqlAppLocaleToUi(user?.preferences?.appLocale);
  const sc = statsPageCopy[locale];
  const dDash = getDashboardStrings(locale);
  const mealsUi = mealsPageCopy[locale];
  const aiTransparency = getAiTransparencyStrings(locale);
  const stats = daySnapshot.stats;
  const workouts = daySnapshot.workouts || [];
  const workoutSummary = daySnapshot.summary;
  const dayMeals: StatsDayMeal[] = (stats?.meals ?? []) as StatsDayMeal[];
  const weeklyReview = weeklyReviewData?.weeklyEvoReview;
  const activity = daySnapshot.activity;

  const calGoalNum = Number(stats?.dynamicGoals?.calories || user?.preferences?.dailyCalorieGoal || 2000);
  const proteinGoalNum = Number(stats?.dynamicGoals?.protein || user?.preferences?.proteinGoal || 0);
  const carbsGoalNum = Number(stats?.dynamicGoals?.carbs || user?.preferences?.carbsGoal || 0);
  const fatGoalNum = Number(stats?.dynamicGoals?.fat || user?.preferences?.fatGoal || 0);
  const calConsumed = Number(stats?.totalCalories || 0);
  const proteinConsumed = Number(stats?.totalProtein || 0);
  const carbsConsumed = Number(stats?.totalCarbs || 0);
  const fatConsumed = Number(stats?.totalFat || 0);
  const analysisModeLabel =
    analysisMode === 'combined' ? sc.modeCombined : analysisMode === 'nutrition' ? sc.modeNutrition : sc.modeTraining;
  const delLabels = getDestructiveConfirmLabels(locale);
  const deleteDialogTitle =
    deleteConfirm?.kind === 'workout' ? sc.deleteWorkoutTitle : sc.deleteMealTitle;
  const deleteDialogDescription =
    deleteConfirm?.kind === 'workout' ? sc.confirmDeleteWorkout : sc.confirmDeleteMeal;

  const wEdit = workoutsPageCopy[locale];
  const mealEditOptions = (['breakfast', 'lunch', 'dinner', 'snack'] as const).map((o) => ({
    value: o,
    label: mealTypeLabels[locale][o] || o,
  }));

  const statsMealForEdit = mealToEditId ? dayMeals.find((m) => m.id === mealToEditId) ?? null : null;
  const statsMealEditPayload = statsMealForEdit
    ? {
        id: statsMealForEdit.id,
        name: statsMealForEdit.name,
        description: statsMealForEdit.description,
        imageUrl: statsMealForEdit.imageUrl,
        mealType: statsMealForEdit.mealType,
        nutrition: {
          calories: Number(statsMealForEdit.nutrition?.calories ?? 0),
          protein: Number(statsMealForEdit.nutrition?.protein ?? 0),
          carbs: Number(statsMealForEdit.nutrition?.carbs ?? 0),
          fat: Number(statsMealForEdit.nutrition?.fat ?? 0),
          confidence: statsMealForEdit.nutrition?.confidence ?? null,
        },
      }
    : null;

  const statsWorkoutForEdit: EditableWorkoutPayload | null = workoutToEditId
    ? (workouts.find((w: { id: string }) => w.id === workoutToEditId) as EditableWorkoutPayload | undefined) ?? null
    : null;

  const handleStatsMealSave = async (input: {
    id: string;
    name: string;
    description: string | null;
    mealType: string;
    nutrition: { calories: number; protein: number; carbs: number; fat: number; confidence: number };
  }) => {
    await updateFoodItemMutation({
      variables: {
        input: {
          id: input.id,
          name: input.name,
          description: input.description,
          mealType: input.mealType,
          nutrition: {
            calories: input.nutrition.calories,
            protein: input.nutrition.protein,
            carbs: input.nutrition.carbs,
            fat: input.nutrition.fat,
            confidence: input.nutrition.confidence,
          },
        },
      },
    });
    appToast.success(mealsUi.toastMealUpdatedTitle, mealsUi.toastMealUpdatedBody);
  };

  const handleStatsWorkoutSave = async (input: {
    id: string;
    title: string;
    notes: string | null;
    durationMinutes: number;
    caloriesBurned: number;
    intensity: string;
    performedAt: string;
  }) => {
    await updateWorkoutMutation({
      variables: {
        input: {
          id: input.id,
          title: input.title,
          notes: input.notes,
          durationMinutes: input.durationMinutes,
          caloriesBurned: input.caloriesBurned,
          intensity: input.intensity,
          performedAt: input.performedAt,
        },
      },
    });
    appToast.success(wEdit.toastWorkoutUpdatedTitle, wEdit.toastWorkoutUpdatedBody);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    const { kind, id } = deleteConfirm;
    setDeleteConfirm(null);
    if (kind === 'meal') {
      const result = await deleteFoodItem({ variables: { id } });
      if (result.data?.deleteFoodItem) {
        appToast.success('Meal deleted', 'Entry removed for selected day.');
      } else {
        appToast.error('Delete failed', 'Could not delete meal.');
      }
    } else {
      const result = await deleteWorkout({ variables: { id } });
      if (result.data?.deleteWorkout) {
        appToast.success('Workout deleted', 'Workout removed for selected day.');
      } else {
        appToast.error('Delete failed', 'Could not delete workout.');
      }
    }
  };

  const handleSaveSteps = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = stepsInput.trim();
    if (trimmed === '') {
      appToast.info('Invalid steps', locale === 'pl' ? 'Podaj liczbę kroków.' : 'Enter a step count.');
      return;
    }
    const n = Number(trimmed);
    if (!Number.isFinite(n) || n < 0 || n > 120000) {
      appToast.info('Invalid steps', locale === 'pl' ? 'Kroki: 0–120000.' : 'Steps must be between 0 and 120000.');
      return;
    }

    await upsertDailyActivity({
      variables: {
        input: {
          date: selectedDate,
          steps: Math.round(n),
        },
      },
    });
  };

  return (
      <AppShell>
        <EditMealDialog
          open={Boolean(mealToEditId && statsMealEditPayload)}
          meal={statsMealEditPayload}
          onClose={() => setMealToEditId(null)}
          saving={savingMealEdits}
          mealOptions={mealEditOptions}
          copy={{
            editMealTitle: mealsUi.editMealTitle,
            saveMealChanges: mealsUi.saveMealChanges,
            cancelEdit: mealsUi.cancelEdit,
            mealType: mealsUi.mealType,
            mealNameLabel: mealsUi.mealNameLabel,
            mealDescription: mealsUi.mealDescription,
            editConfidenceLabel: mealsUi.editConfidenceLabel,
          }}
          onSave={handleStatsMealSave}
        />
        <EditWorkoutDialog
          open={Boolean(workoutToEditId && statsWorkoutForEdit)}
          workout={statsWorkoutForEdit}
          onClose={() => setWorkoutToEditId(null)}
          saving={savingWorkoutEdits}
          copy={{
            editWorkoutTitle: wEdit.editWorkoutTitle,
            saveWorkoutChanges: wEdit.saveWorkoutChanges,
            cancelEditWorkout: wEdit.cancelEditWorkout,
            workoutTitle: wEdit.workoutTitle,
            titlePlaceholder: wEdit.titlePlaceholder,
            duration: wEdit.duration,
            kcalBurned: wEdit.kcalBurned,
            intensity: wEdit.intensity,
            sessionNotes: wEdit.sessionNotes,
            notesPlaceholder: wEdit.notesPlaceholder,
            intensityLow: wEdit.intensityLow,
            intensityMedium: wEdit.intensityMedium,
            intensityHigh: wEdit.intensityHigh,
            performedAtLabel: wEdit.performedAtLabel,
          }}
          onSave={handleStatsWorkoutSave}
        />
        <ConfirmDialog
          open={deleteConfirm !== null}
          title={deleteDialogTitle}
          description={deleteDialogDescription}
          confirmLabel={delLabels.confirm}
          cancelLabel={delLabels.cancel}
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={() => void handleConfirmDelete()}
          confirmBusy={
            deleteConfirm?.kind === 'workout' ? deletingWorkout : deleteConfirm?.kind === 'meal' ? deletingMeal : false
          }
          variant="danger"
        />
        <div className="mb-5">
          <PageTopBar
            rightContent={
              <span className="text-sm text-text-secondary">
                {sc.goalModePrefix} {formatPrimaryGoal(String(user?.preferences?.primaryGoal || 'maintenance'), locale)}
              </span>
            }
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <div className="xl:col-span-8">
            <div
              className={clsx(
                'bg-surface rounded-xl border border-border p-5 mb-6 shadow-sm shadow-black/5',
                accentEdgeClasses('primary', 'left'),
              )}
            >
              <AISectionHeader eyebrow={sc.eyebrow} title={sc.pickDayTitle} subtitle={sc.pickDaySubtitle} />
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="inline-flex rounded-lg border border-border bg-surface-elevated p-1 gap-1">
                  <ModeButton label={sc.modeCombined} active={analysisMode === 'combined'} onClick={() => setAnalysisMode('combined')} />
                  <ModeButton label={sc.modeNutrition} active={analysisMode === 'nutrition'} onClick={() => setAnalysisMode('nutrition')} />
                  <ModeButton label={sc.modeTraining} active={analysisMode === 'training'} onClick={() => setAnalysisMode('training')} />
                </div>
              </div>
              <label htmlFor="stats-date" className="block text-sm text-text-secondary mb-2">
                {sc.analysisDate}
              </label>
              <input
                id="stats-date"
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="input-field w-full max-w-sm"
              />
              <form onSubmit={handleSaveSteps} className="mt-3 grid grid-cols-1 sm:grid-cols-[200px_auto] gap-2 max-w-md">
                <NumericInput
                  min={0}
                  max={120000}
                  value={stepsInput}
                  onChange={(event) => setStepsInput(event.target.value)}
                  className="w-full"
                  placeholder={sc.stepsPlaceholder}
                />
                <button type="submit" className="btn-secondary" disabled={savingSteps}>
                  {savingSteps ? sc.saving : sc.saveSteps}
                </button>
              </form>
              <p className="text-xs text-text-muted mt-2">
                {daySnapshot.loading ? sc.loadingActivity : sc.stepsTracked(Math.round(activity?.steps || 0))}
              </p>
            </div>

            {analysisMode === 'combined' && daySnapshot.insight ? (
              <div className="mb-6">
                <EvoHintCard
                  title={sc.mainInsightTitle}
                  tone="notice"
                  content={daySnapshot.insight.summary?.trim() ? daySnapshot.insight.summary : sc.mainInsightPending}
                />
              </div>
            ) : null}

            {(analysisMode === 'combined' || analysisMode === 'nutrition') ? (
            <section className="mb-6 rounded-2xl bg-surface/70 p-3 md:p-4 ring-1 ring-white/[0.06]">
              <div className="mb-2.5 flex flex-wrap items-center gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold tracking-tight text-text-primary">{dDash.todayGoals}</h3>
                  <p className="text-xs text-text-muted line-clamp-1">{dDash.todayGoalsSub(selectedDate)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/goals')}
                  className="btn-info text-xs h-8 px-3 shrink-0"
                >
                  {dDash.setGoals}
                </button>
              </div>
              <div className="grid items-start grid-cols-1 gap-2.5 sm:grid-cols-2">
                {daySnapshot.loading ? (
                  <>
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                  </>
                ) : (
                  <>
                    <GoalRingCard
                      ui={dDash}
                      title={dDash.statCalories}
                      kind="calories"
                      consumed={calConsumed}
                      target={calGoalNum}
                      unit="kcal"
                      tone="brand"
                      hoverHint={buildDashboardGoalHoverHint(locale, {
                        title: 'Calories',
                        value: calConsumed,
                        goal: calGoalNum,
                        unit: 'kcal',
                      })}
                    />
                    <GoalRingCard
                      ui={dDash}
                      title={dDash.statProtein}
                      kind="protein"
                      consumed={proteinConsumed}
                      target={proteinGoalNum}
                      unit="g"
                      tone="info"
                      hoverHint={buildDashboardGoalHoverHint(locale, {
                        title: 'Protein',
                        value: proteinConsumed,
                        goal: proteinGoalNum,
                        unit: 'g',
                      })}
                    />
                    <GoalRingCard
                      ui={dDash}
                      title={dDash.statCarbs}
                      kind="carbs"
                      consumed={carbsConsumed}
                      target={carbsGoalNum}
                      unit="g"
                      tone="success"
                      hoverHint={buildDashboardGoalHoverHint(locale, {
                        title: 'Carbs',
                        value: carbsConsumed,
                        goal: carbsGoalNum,
                        unit: 'g',
                      })}
                    />
                    <GoalRingCard
                      ui={dDash}
                      title={dDash.statFat}
                      kind="fat"
                      consumed={fatConsumed}
                      target={fatGoalNum}
                      unit="g"
                      tone="brandSoft"
                      hoverHint={buildDashboardGoalHoverHint(locale, {
                        title: 'Fat',
                        value: fatConsumed,
                        goal: fatGoalNum,
                        unit: 'g',
                      })}
                    />
                  </>
                )}
              </div>
            </section>
            ) : null}

            {(analysisMode === 'combined' || analysisMode === 'nutrition') ? (
            <section
              className={clsx(
                'bg-surface rounded-xl border border-border p-5 shadow-sm shadow-black/5',
                accentEdgeClasses('info', 'left'),
              )}
            >
              <h3 className="text-xl font-semibold tracking-tight text-text-primary mb-5">
                {sc.mealsFor} {selectedDate}
              </h3>
              {daySnapshot.loading ? (
                <div className="space-y-3">
                  <ListRowSkeleton />
                  <ListRowSkeleton />
                  <ListRowSkeleton />
                </div>
              ) : dayMeals.length > 0 ? (
                <div className="space-y-3">
                  {dayMeals.map((meal) => (
                    <div
                      key={meal.id}
                      className="relative flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between p-3.5 pr-[4.25rem] pt-10 sm:pt-3.5 bg-surface-elevated rounded-lg border border-border"
                    >
                      <div className="absolute right-3 top-3 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setMealToEditId(meal.id)}
                          disabled={deletingMeal || savingMealEdits}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-secondary hover:border-info-400/40 hover:text-info-400 transition-colors"
                          title={mealsUi.editMealTitle}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm({ kind: 'meal', id: meal.id })}
                          disabled={deletingMeal || savingMealEdits}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-secondary hover:text-red-400 hover:border-red-400/40 transition-colors"
                          title={sc.deleteMealTitle}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-text-primary">{meal.name}</h4>
                        <p className="text-sm text-text-secondary capitalize">{meal.mealType.toLowerCase()}</p>
                        <MealMacroConfidenceBlock
                          imageUrl={meal.imageUrl}
                          confidence={meal.nutrition.confidence}
                          locale={locale}
                          copy={{
                            detailsMore: mealsUi.detailsMore,
                            estimateChipUnknown: mealsUi.estimateChipUnknown,
                            confidenceTooltipExplain: mealsUi.confidenceTooltipExplain,
                            confidenceTooltipUnavailable: mealsUi.confidenceTooltipUnavailable,
                          }}
                          className="mt-1.5"
                        />
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <p className="font-semibold text-text-primary">
                          {meal.nutrition.calories.toFixed(0)} kcal
                        </p>
                        <p className="text-sm text-text-secondary">
                          P: {meal.nutrition.protein.toFixed(0)}g • C: {meal.nutrition.carbs.toFixed(0)}g • F: {meal.nutrition.fat.toFixed(0)}g
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Camera className="h-16 w-16 text-text-muted mx-auto mb-4" />
                  <p className="text-text-secondary mb-4">{sc.noMeals(selectedDate)}</p>
                  <button
                    onClick={() => router.push('/meals')}
                    className="btn-primary inline-flex items-center space-x-2 px-4"
                  >
                    <Camera className="h-4 w-4 stroke-[1.9]" />
                    <span>{sc.addMeal}</span>
                  </button>
                </div>
              )}
            </section>
            ) : null}

            {(analysisMode === 'combined' || analysisMode === 'training') ? (
            <section
              className={clsx(
                'bg-surface rounded-xl border border-border p-5 mt-4 shadow-sm shadow-black/5',
                accentEdgeClasses('success', 'left'),
              )}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-semibold tracking-tight text-text-primary">
                  {sc.workoutsFor} {selectedDate}
                </h3>
                <button type="button" onClick={() => router.push('/workouts')} className="btn-info">
                  {sc.openWorkoutCoach}
                </button>
              </div>

              {daySnapshot.loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                  <WorkoutSummaryCard
                    icon={<Dumbbell className="h-4 w-4 text-amber-400" />}
                    label={sc.sessions}
                    value={`${workouts.length}`}
                    accent="primary"
                  />
                  <WorkoutSummaryCard
                    icon={<Flame className="h-4 w-4 text-info-500" />}
                    label={sc.burned}
                    value={`${workoutSummary?.caloriesBurned?.toFixed(0) || '0'} kcal`}
                    accent="info"
                  />
                  <WorkoutSummaryCard
                    icon={<Camera className="h-4 w-4 text-primary-400" />}
                    label={sc.netCalories}
                    value={`${workoutSummary?.netCalories?.toFixed(0) || '0'} kcal`}
                    accent="success"
                  />
                </div>
              )}

              {analysisMode === 'training' && !daySnapshot.loading ? (
                <div className="mb-5">
                  <EvoHintCard
                    title={sc.trainingCoachEyebrow}
                    tone="notice"
                    content={
                      workoutSummary?.message?.trim()
                        ? `${sc.trainingCoachPreamble}\n\n${String(workoutSummary.message).trim()}`
                        : sc.trainingCoachEmpty
                    }
                  />
                </div>
              ) : null}

              {daySnapshot.loading ? (
                <div className="space-y-3">
                  <ListRowSkeleton />
                  <ListRowSkeleton />
                </div>
              ) : workouts.length > 0 ? (
                <div className="space-y-3">
                  {workouts.map((workout) => (
                    <div
                      key={workout.id}
                      className="relative flex items-center justify-between p-3.5 pr-[4.25rem] bg-surface-elevated rounded-lg border border-border"
                    >
                      <div className="absolute right-3 top-3 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setWorkoutToEditId(workout.id)}
                          disabled={deletingWorkout || savingWorkoutEdits}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-secondary hover:border-info-400/40 hover:text-info-400 transition-colors"
                          title={wEdit.editWorkoutTitle}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm({ kind: 'workout', id: workout.id })}
                          disabled={deletingWorkout || savingWorkoutEdits}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-secondary hover:text-red-400 hover:border-red-400/40 transition-colors"
                          title={sc.deleteWorkoutTitle}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div>
                        <h4 className="font-semibold text-text-primary">{workout.title}</h4>
                        <p className="text-sm text-text-secondary">
                          {workout.durationMinutes} min • {workout.caloriesBurned} kcal • {String(workout.intensity || '').toLowerCase()}
                        </p>
                        {workout.notes ? <p className="text-sm text-text-secondary mt-1">{workout.notes}</p> : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Dumbbell className="h-16 w-16 text-text-muted mx-auto mb-4" />
                  <p className="text-text-secondary mb-4">{sc.noWorkouts(selectedDate)}</p>
                  <button
                    onClick={() => router.push('/workouts')}
                    className="btn-primary inline-flex items-center space-x-2 px-4"
                  >
                    <Dumbbell className="h-4 w-4 stroke-[1.9]" />
                    <span>{sc.logWorkout}</span>
                  </button>
                </div>
              )}
            </section>
            ) : null}
          </div>

          <div className="xl:col-span-4">
            <div className="space-y-4">
              <AiTransparencyNotice strings={aiTransparency} variant="compact" showLearnMore={false} />
              {weeklyReview ? (
                <section
                  className={clsx(
                    'bg-surface rounded-xl border border-border p-4 shadow-sm shadow-black/5',
                    accentEdgeClasses('info', 'left'),
                  )}
                >
                  <h4 className="text-sm font-semibold tracking-tight text-text-primary mb-2">Weekly trend snapshot</h4>
                  {!weeklyReview.isCompleteWeek ? (
                    <div className="rounded-lg border border-dashed border-primary-500/30 bg-primary-500/5 px-3 py-2 mb-3">
                      <p className="text-xs text-primary-200">
                        Partial weekly review for <span className="font-semibold text-primary-100">{weeklyReview.availableDays}/7</span> available days
                        (<span className="font-semibold text-primary-100">{weeklyReview.trackedDays}</span> tracked).
                      </p>
                    </div>
                  ) : null}
                  {weeklyReview.summary?.trim() ? (
                    <p className="text-sm text-text-secondary mb-3 leading-relaxed whitespace-pre-wrap">{weeklyReview.summary}</p>
                  ) : (
                    <p className="text-sm text-text-muted mb-3">{sc.weeklyNarrativePending}</p>
                  )}
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <WorkoutSummaryCard
                      icon={<Camera className="h-4 w-4 text-info-400" />}
                      label={locale === 'pl' ? 'Odżywianie' : 'Nutrition'}
                      value={`${weeklyReview.nutritionScore}/100`}
                      accent="primary"
                    />
                    <WorkoutSummaryCard
                      icon={<Dumbbell className="h-4 w-4 text-amber-300" />}
                      label={locale === 'pl' ? 'Trening' : 'Training'}
                      value={`${weeklyReview.trainingScore}/100`}
                      accent="info"
                    />
                    <WorkoutSummaryCard
                      icon={<Flame className="h-4 w-4 text-success-400" />}
                      label={locale === 'pl' ? 'Konsekwencja' : 'Consistency'}
                      value={`${weeklyReview.consistencyScore}/100`}
                      accent="success"
                    />
                  </div>
                  {weeklyReview.proTip?.trim() ? (
                    <div className="rounded-lg border border-primary-500/25 bg-primary-500/5 px-3 py-2.5 mb-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-200 mb-1">{sc.proTip}</p>
                      <p className="text-xs text-text-primary leading-snug">{weeklyReview.proTip}</p>
                    </div>
                  ) : null}
                </section>
              ) : (
                <section
                  className={clsx(
                    'bg-surface rounded-xl border border-border p-4 shadow-sm shadow-black/5',
                    accentEdgeClasses('info', 'left'),
                  )}
                >
                  <InsightEmptyState title={sc.weeklyEmptyTitle} description={sc.weeklyEmptyDescription} />
                </section>
              )}
              <ContextAICoach
                title={sc.aiCoachTitle}
                description={sc.aiCoachDescription(analysisModeLabel)}
                quickPrompts={[
                  sc.quick1(selectedDate),
                  sc.quick2(selectedDate),
                  sc.quick3(selectedDate),
                  sc.quick4(selectedDate),
                ]}
                statsReference={selectedDate}
              />
            </div>
          </div>
        </div>
    </AppShell>
  );
}

function WorkoutSummaryCard({
  icon,
  label,
  value,
  accent = 'info',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: 'primary' | 'info' | 'success';
}) {
  return (
    <div
      className={clsx(
        'rounded-lg border border-border bg-surface-elevated p-3 shadow-sm shadow-black/5',
        accentEdgeClasses(accent, 'left'),
      )}
    >
      <div className="inline-flex items-center gap-1.5 text-xs text-text-muted">
        {icon}
        {label}
      </div>
      <p className="text-sm font-semibold text-text-primary mt-1">{value}</p>
    </div>
  );
}

function ModeButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-2.5 py-1.5 text-xs transition-colors ${
        active
          ? 'bg-primary-500/15 border border-primary-500/30 text-text-primary'
          : 'text-text-secondary border border-transparent hover:text-text-primary'
      }`}
    >
      {label}
    </button>
  );
}
