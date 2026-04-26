'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
import { ME_QUERY } from '@/lib/graphql/queries';
import { SET_GOALS_WITH_AI_MUTATION, UPDATE_PREFERENCES_MUTATION } from '@/lib/graphql/mutations';
import { clearAuthToken } from '@/lib/auth-token';
import { clearApolloClientCache } from '@/lib/apollo-client';
import AppShell from '@/components/AppShell';
import PageTopBar from '@/components/ui/molecules/PageTopBar';
import { ButtonSpinner, PageLoader, Skeleton } from '@/components/ui/loading';
import { appToast } from '@/lib/app-toast';
import { buildDayRefetchQueries } from '@/lib/day-data';
import { formatPrimaryGoal } from '@/lib/formatters';
import { AISectionHeader, SmartSuggestionChips } from '@/components/evo';
import { AccentSectionCard, AccentStatTile } from '@/components/ui/accent-cards';
import { graphqlAppLocaleToUi } from '@/lib/i18n/ui-locale';
import { getGoalMicrocopyLocalized, goalsPageCopy, inferredStrategyLabel } from '@/lib/i18n/copy/goals-page';
import { calorieDeltaForInferredTone, inferCalorieGoalTone } from '@evoflowai/shared';
import { useClientCalendarToday } from '@/hooks/useClientCalendarToday';
import { NumericInput } from '@/components/ui/atoms/NumericInput';

export default function GoalsPage() {
  const router = useRouter();
  const { dateKey: today, timeZone } = useClientCalendarToday();
  const [dailyCalorieGoal, setDailyCalorieGoal] = useState('2000');
  const [weeklyWorkoutsGoal, setWeeklyWorkoutsGoal] = useState('4');
  const [weeklyActiveMinutesGoal, setWeeklyActiveMinutesGoal] = useState('180');
  const [activityLevel, setActivityLevel] = useState('MODERATE');
  const [primaryGoal, setPrimaryGoal] = useState('maintenance');
  const [proteinGoal, setProteinGoal] = useState('120');
  const [carbsGoal, setCarbsGoal] = useState('200');
  const [fatGoal, setFatGoal] = useState('65');
  const [aiGoalPrompt, setAiGoalPrompt] = useState('');
  const [lastAiMessage, setLastAiMessage] = useState('');

  const { data, loading, error } = useQuery(ME_QUERY);

  const [updatePreferences, { loading: savingGoals }] = useMutation(UPDATE_PREFERENCES_MUTATION, {
    refetchQueries: [{ query: ME_QUERY }, ...buildDayRefetchQueries(today, timeZone)],
    awaitRefetchQueries: true,
  });

  const [setGoalsWithAI, { loading: applyingAiGoals }] = useMutation(SET_GOALS_WITH_AI_MUTATION, {
    refetchQueries: [{ query: ME_QUERY }, ...buildDayRefetchQueries(today, timeZone)],
    awaitRefetchQueries: true,
  });

  useEffect(() => {
    if (!data?.me?.preferences) return;
    const p = data.me.preferences;
    setDailyCalorieGoal(String(p.dailyCalorieGoal || 2000));
    setWeeklyWorkoutsGoal(String(p.weeklyWorkoutsGoal ?? 4));
    setWeeklyActiveMinutesGoal(String(p.weeklyActiveMinutesGoal ?? 180));
    setActivityLevel(String(p.activityLevel || 'MODERATE').toUpperCase());
    setPrimaryGoal(String(p.primaryGoal ?? 'maintenance'));
    setProteinGoal(String(p.proteinGoal ?? 120));
    setCarbsGoal(String(p.carbsGoal ?? 200));
    setFatGoal(String(p.fatGoal ?? 65));
  }, [data]);

  useEffect(() => {
    if (!error) return;
    const loc = graphqlAppLocaleToUi(data?.me?.preferences?.appLocale);
    const copy = goalsPageCopy[loc];
    appToast.error(copy.sessionExpiredTitle, copy.sessionExpiredBody);
    void (async () => {
      clearAuthToken();
      await clearApolloClientCache();
      router.push('/login');
    })();
  }, [error, router, data?.me?.preferences?.appLocale]);

  const saved = data?.me?.preferences;

  const isDirty = useMemo(() => {
    if (!saved) return false;
    const pg = primaryGoal.trim() || 'maintenance';
    const sg = String(saved.primaryGoal ?? 'maintenance').trim();
    return (
      String(saved.dailyCalorieGoal ?? '') !== dailyCalorieGoal ||
      String(saved.weeklyWorkoutsGoal ?? '') !== weeklyWorkoutsGoal ||
      String(saved.weeklyActiveMinutesGoal ?? '') !== weeklyActiveMinutesGoal ||
      String(saved.activityLevel || 'MODERATE').toUpperCase() !== activityLevel ||
      pg !== sg ||
      String(saved.proteinGoal ?? '') !== proteinGoal ||
      String(saved.carbsGoal ?? '') !== carbsGoal ||
      String(saved.fatGoal ?? '') !== fatGoal
    );
  }, [
    saved,
    dailyCalorieGoal,
    weeklyWorkoutsGoal,
    weeklyActiveMinutesGoal,
    activityLevel,
    primaryGoal,
    proteinGoal,
    carbsGoal,
    fatGoal,
  ]);

  const budgetPreview = useMemo(() => {
    const base = Math.round(Number(dailyCalorieGoal) || 0);
    if (!Number.isFinite(base) || base < 800 || base > 5000) return null;
    const delta = calorieDeltaForInferredTone(inferCalorieGoalTone(primaryGoal));
    const total = Math.max(800, Math.round(base + delta));
    return { base, delta, total };
  }, [dailyCalorieGoal, primaryGoal]);

  if (loading) {
    return <PageLoader />;
  }

  const locale = graphqlAppLocaleToUi(data?.me?.preferences?.appLocale);
  const g = goalsPageCopy[locale];

  const validateForm = (calorieGoal: number): boolean => {
    if (!Number.isFinite(calorieGoal) || calorieGoal < 800 || calorieGoal > 5000) {
      appToast.warning(g.invalidCalorieTargetTitle, g.invalidCalories);
      return false;
    }
    const parsedWeeklyWorkouts = Number(weeklyWorkoutsGoal);
    if (!Number.isFinite(parsedWeeklyWorkouts) || parsedWeeklyWorkouts < 0 || parsedWeeklyWorkouts > 14) {
      appToast.warning(g.invalidWorkoutsTargetTitle, g.invalidWorkouts);
      return false;
    }
    const parsedWeeklyMinutes = Number(weeklyActiveMinutesGoal);
    if (!Number.isFinite(parsedWeeklyMinutes) || parsedWeeklyMinutes < 0 || parsedWeeklyMinutes > 2000) {
      appToast.warning(g.invalidActiveMinutesTargetTitle, g.invalidMinutes);
      return false;
    }
    const goalStr = primaryGoal.trim() || 'maintenance';
    if (goalStr.length > 400) {
      appToast.warning(g.invalidPrimaryGoalTitle, g.invalidPrimaryGoal);
      return false;
    }
    const p = Math.round(Number(proteinGoal));
    const c = Math.round(Number(carbsGoal));
    const f = Math.round(Number(fatGoal));
    if (!Number.isFinite(p) || p < 30 || p > 500) {
      appToast.warning(g.invalidProteinTitle, g.invalidProtein);
      return false;
    }
    if (!Number.isFinite(c) || c < 20 || c > 900) {
      appToast.warning(g.invalidCarbsTitle, g.invalidCarbs);
      return false;
    }
    if (!Number.isFinite(f) || f < 15 || f > 400) {
      appToast.warning(g.invalidFatTitle, g.invalidFat);
      return false;
    }
    return true;
  };

  const buildPreferencesInput = (calorieGoal: number) => ({
    dailyCalorieGoal: Math.round(calorieGoal),
    weeklyWorkoutsGoal: Math.round(Number(weeklyWorkoutsGoal)),
    weeklyActiveMinutesGoal: Math.round(Number(weeklyActiveMinutesGoal)),
    activityLevel,
    primaryGoal: primaryGoal.trim() || 'maintenance',
    proteinGoal: Math.round(Number(proteinGoal)),
    carbsGoal: Math.round(Number(carbsGoal)),
    fatGoal: Math.round(Number(fatGoal)),
  });

  const handleSaveGoals = async () => {
    const parsedGoal = Number(dailyCalorieGoal);
    if (!validateForm(parsedGoal)) return;

    try {
      await updatePreferences({
        variables: { input: buildPreferencesInput(parsedGoal) },
      });
      appToast.success(g.goalsSavedTitle, g.goalsSavedBody);
    } catch (mutationError: unknown) {
      const message = mutationError instanceof Error ? mutationError.message : g.goalsSaveFailedBody;
      appToast.error(g.goalsSaveFailedTitle, message || g.goalsSaveFailedBody);
    }
  };

  const handleApplySuggestedAndSave = async () => {
    const nextCal = suggestDailyCaloriesByGoal(Number(dailyCalorieGoal || 0), primaryGoal);
    if (!validateForm(nextCal)) return;

    try {
      await updatePreferences({
        variables: { input: buildPreferencesInput(nextCal) },
      });
      setDailyCalorieGoal(String(nextCal));
      appToast.success(g.goalsSavedTitle, g.goalsSavedBody);
    } catch (mutationError: unknown) {
      const message = mutationError instanceof Error ? mutationError.message : g.goalsSaveFailedBody;
      appToast.error(g.goalsSaveFailedTitle, message || g.goalsSaveFailedBody);
    }
  };

  const suggestedDailyCalories = suggestDailyCaloriesByGoal(Number(dailyCalorieGoal || 0), primaryGoal);

  const handleSetGoalsWithAI = async () => {
    const prompt = aiGoalPrompt.trim();
    if (!prompt) {
      appToast.info(g.addContextTitle, g.addContext);
      return;
    }

    try {
      const result = await setGoalsWithAI({
        variables: { input: { prompt } },
      });
      const message = result.data?.setGoalsWithAI?.message;
      setAiGoalPrompt('');
      setLastAiMessage(message || g.aiDefaultSuccessMessage);
      appToast.success(g.aiGoalsSavedTitle, message || g.aiGoalsSavedBody);
    } catch (mutationError: unknown) {
      const message = mutationError instanceof Error ? mutationError.message : g.aiGoalsSaveFailedBody;
      appToast.error(g.aiGoalsSaveFailedTitle, message || g.aiGoalsSaveFailedBody);
    }
  };

  const applyChip = (label: string) => {
    const trimmed = label.slice(0, 400);
    setPrimaryGoal(trimmed);
    setAiGoalPrompt(label);
  };

  const strategyLabel = inferredStrategyLabel(inferCalorieGoalTone(primaryGoal), locale);

  return (
    <AppShell>
      <div className="mb-6">
        <PageTopBar />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-8 space-y-5">
          <header className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-text-primary">{g.pageTitle}</h1>
            <p className="text-sm text-text-secondary">{g.pageSubtitle}</p>
          </header>

          {isDirty ? (
            <div className="rounded-lg border border-primary-500/35 bg-primary-500/10 px-3 py-2 text-sm text-text-primary">
              {g.draftChangesBanner}
            </div>
          ) : null}

          <AccentSectionCard
            accent="primary"
            title={g.sectionDirection}
            titleId="goals-direction-heading"
            padding="lg"
            className="space-y-3"
          >
            <div>
              <label htmlFor="primary-goal" className="mb-2 block text-sm font-medium text-text-primary">
                {g.primaryGoal}
              </label>
              <textarea
                id="primary-goal"
                value={primaryGoal}
                onChange={(event) => setPrimaryGoal(event.target.value)}
                maxLength={400}
                rows={3}
                placeholder={g.primaryGoalPlaceholder}
                className="input-field w-full min-h-[5.25rem] resize-y"
              />
              <p className="mt-2 text-sm text-text-muted">{getGoalMicrocopyLocalized(primaryGoal, locale)}</p>
            </div>
          </AccentSectionCard>

          <AccentSectionCard
            accent="info"
            title={g.sectionTargets}
            titleId="goals-targets-heading"
            padding="lg"
            className="space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="daily-goal" className="mb-2 block text-sm text-text-secondary">
                  {g.restingCalories}
                </label>
                <NumericInput
                  id="daily-goal"
                  min={800}
                  max={5000}
                  value={dailyCalorieGoal}
                  onChange={(event) => setDailyCalorieGoal(event.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="weekly-workouts-goal" className="mb-2 block text-sm text-text-secondary">
                  {g.weeklyWorkouts}
                </label>
                <NumericInput
                  id="weekly-workouts-goal"
                  min={0}
                  max={14}
                  value={weeklyWorkoutsGoal}
                  onChange={(event) => setWeeklyWorkoutsGoal(event.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="weekly-active-minutes-goal" className="mb-2 block text-sm text-text-secondary">
                  {g.weeklyActiveMinutes}
                </label>
                <NumericInput
                  id="weekly-active-minutes-goal"
                  min={0}
                  max={2000}
                  value={weeklyActiveMinutesGoal}
                  onChange={(event) => setWeeklyActiveMinutesGoal(event.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="activity-level" className="mb-2 block text-sm text-text-secondary">
                  {g.activityLevel}
                </label>
                <select
                  id="activity-level"
                  value={activityLevel}
                  onChange={(event) => setActivityLevel(event.target.value)}
                  className="input-field w-full"
                >
                  <option value="SEDENTARY">{g.activitySedentary}</option>
                  <option value="LIGHT">{g.activityLight}</option>
                  <option value="MODERATE">{g.activityModerate}</option>
                  <option value="ACTIVE">{g.activityActive}</option>
                  <option value="VERY_ACTIVE">{g.activityVeryActive}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label htmlFor="protein-goal" className="mb-2 block text-sm text-text-secondary">
                  {g.proteinGoal} (g)
                </label>
                <NumericInput
                  id="protein-goal"
                  min={30}
                  max={500}
                  value={proteinGoal}
                  onChange={(event) => setProteinGoal(event.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="carbs-goal" className="mb-2 block text-sm text-text-secondary">
                  {g.carbsGoal} (g)
                </label>
                <NumericInput
                  id="carbs-goal"
                  min={20}
                  max={900}
                  value={carbsGoal}
                  onChange={(event) => setCarbsGoal(event.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="fat-goal" className="mb-2 block text-sm text-text-secondary">
                  {g.fatGoal} (g)
                </label>
                <NumericInput
                  id="fat-goal"
                  min={15}
                  max={400}
                  value={fatGoal}
                  onChange={(event) => setFatGoal(event.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </AccentSectionCard>

          {budgetPreview ? (
            <AccentSectionCard
              accent="success"
              title={g.sectionCalorieAssist}
              titleId="goals-calorie-assist-heading"
              padding="lg"
              className="space-y-4"
            >
              <p className="text-sm text-text-secondary leading-snug">
                {g.startingBudgetLine(budgetPreview.base, budgetPreview.delta, budgetPreview.total)}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <p className="text-sm text-text-primary">
                  {g.suggestedBaselineLine(suggestedDailyCalories, strategyLabel)}
                </p>
                <button
                  type="button"
                  onClick={() => void handleApplySuggestedAndSave()}
                  disabled={savingGoals || applyingAiGoals}
                  className="btn-info shrink-0"
                >
                  {savingGoals ? (
                    <span className="inline-flex items-center gap-2">
                      <ButtonSpinner />
                      {g.savingGoals}
                    </span>
                  ) : (
                    g.applySuggested
                  )}
                </button>
              </div>
            </AccentSectionCard>
          ) : null}

          <button
            type="button"
            onClick={() => void handleSaveGoals()}
            disabled={savingGoals || applyingAiGoals}
            className="btn-primary w-full inline-flex items-center justify-center gap-2 h-10"
          >
            {savingGoals ? (
              <>
                <ButtonSpinner />
                {g.savingGoals}
              </>
            ) : (
              g.saveGoals
            )}
          </button>
        </div>

        <AccentSectionCard
          as="aside"
          accent="primary"
          emphasis="top"
          padding="lg"
          className="xl:col-span-4 h-fit space-y-4"
        >
          <AISectionHeader eyebrow={g.eyebrow} title={g.aiTitle} subtitle={g.aiSubtitle} />

          <SmartSuggestionChips
            title={g.chipsTitle}
            suggestions={[
              { id: 'goal-1', label: g.chip1 },
              { id: 'goal-2', label: g.chip2 },
              { id: 'goal-3', label: g.chip3 },
            ]}
            onSelect={(value) => applyChip(value)}
          />

          <div>
            <label htmlFor="ai-goal-prompt" className="mb-2 block text-sm font-medium text-text-primary">
              {g.yourContext}
            </label>
            <textarea
              id="ai-goal-prompt"
              value={aiGoalPrompt}
              onChange={(event) => setAiGoalPrompt(event.target.value)}
              className="input-field w-full min-h-28 resize-y"
              placeholder={g.aiPlaceholder}
            />
          </div>
          <button
            type="button"
            onClick={() => void handleSetGoalsWithAI()}
            disabled={savingGoals || applyingAiGoals}
            className="btn-secondary w-full inline-flex items-center justify-center gap-2 h-10 border-info-500/25 hover:border-info-500/40"
          >
            {applyingAiGoals ? (
              <>
                <ButtonSpinner />
                {g.evoSetting}
              </>
            ) : (
              g.setWithEvo
            )}
          </button>

          {lastAiMessage ? (
            <div className="rounded-lg border border-info-500/30 bg-info-500/10 p-3.5">
              <p className="text-[11px] uppercase tracking-[0.12em] text-info-300/90 mb-1">{g.latestEvo}</p>
              <p className="text-sm text-text-primary leading-snug">{lastAiMessage}</p>
            </div>
          ) : applyingAiGoals ? (
            <div className="bg-surface-elevated border border-border rounded-lg p-3 space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-[92%]" />
            </div>
          ) : null}
        </AccentSectionCard>
      </div>

      <AccentSectionCard
        accent="info"
        title={g.snapshotTitle}
        titleId="goals-snapshot-heading"
        padding="lg"
        titleClassName="text-text-muted mb-4"
        className="mt-6 w-full"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <AccentStatTile label={g.proteinGoal} value={data?.me?.preferences?.proteinGoal || 0} accent="primary" />
          <AccentStatTile label={g.carbsGoal} value={data?.me?.preferences?.carbsGoal || 0} accent="info" />
          <AccentStatTile label={g.fatGoal} value={data?.me?.preferences?.fatGoal || 0} accent="success" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
          <AccentStatTile
            label={g.primaryGoalCard}
            value={formatPrimaryGoal(String(data?.me?.preferences?.primaryGoal || primaryGoal), locale)}
            unit=""
            accent="primary"
          />
          <AccentStatTile label={g.workoutsPerWeek} value={data?.me?.preferences?.weeklyWorkoutsGoal ?? 0} unit="" accent="info" />
          <AccentStatTile
            label={g.activeMinPerWeek}
            value={data?.me?.preferences?.weeklyActiveMinutesGoal ?? 0}
            unit="min"
            accent="success"
          />
        </div>
        <div className="mt-3">
          <AccentStatTile
            label={g.restingCalories}
            value={`${data?.me?.preferences?.dailyCalorieGoal ?? '—'} kcal`}
            unit=""
            accent="default"
          />
        </div>
      </AccentSectionCard>
    </AppShell>
  );
}

function suggestDailyCaloriesByGoal(currentBase: number, goal: string) {
  const safeCurrent = Number.isFinite(currentBase) && currentBase > 0 ? currentBase : 2000;
  const delta = calorieDeltaForInferredTone(inferCalorieGoalTone(goal));
  return Math.max(800, Math.round(safeCurrent + delta));
}
