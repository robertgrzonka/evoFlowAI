'use client';

import { useEffect, useState } from 'react';
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
import { AISectionHeader, EvoHintCard, SmartSuggestionChips } from '@/components/evo';
import { graphqlAppLocaleToUi } from '@/lib/i18n/ui-locale';
import {
  getGoalMicrocopyLocalized,
  goalsPageCopy,
  primaryGoalOptionLabels,
} from '@/lib/i18n/copy/goals-page';

export default function GoalsPage() {
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];
  const [dailyCalorieGoal, setDailyCalorieGoal] = useState('2000');
  const [weeklyWorkoutsGoal, setWeeklyWorkoutsGoal] = useState('4');
  const [weeklyActiveMinutesGoal, setWeeklyActiveMinutesGoal] = useState('180');
  const [activityLevel, setActivityLevel] = useState('MODERATE');
  const [primaryGoal, setPrimaryGoal] = useState('MAINTENANCE');
  const [aiGoalPrompt, setAiGoalPrompt] = useState('');
  const [lastAiMessage, setLastAiMessage] = useState('');

  const { data, loading, error } = useQuery(ME_QUERY);

  const [updatePreferences, { loading: savingGoals }] = useMutation(UPDATE_PREFERENCES_MUTATION, {
    refetchQueries: [{ query: ME_QUERY }, ...buildDayRefetchQueries(today)],
    awaitRefetchQueries: true,
  });

  const [setGoalsWithAI, { loading: applyingAiGoals }] = useMutation(SET_GOALS_WITH_AI_MUTATION, {
    refetchQueries: [{ query: ME_QUERY }, ...buildDayRefetchQueries(today)],
    awaitRefetchQueries: true,
  });

  useEffect(() => {
    if (!data?.me?.preferences) return;
    setDailyCalorieGoal(String(data.me.preferences.dailyCalorieGoal || 2000));
    setWeeklyWorkoutsGoal(String(data.me.preferences.weeklyWorkoutsGoal ?? 4));
    setWeeklyActiveMinutesGoal(String(data.me.preferences.weeklyActiveMinutesGoal ?? 180));
    setActivityLevel(String(data.me.preferences.activityLevel || 'MODERATE').toUpperCase());
    setPrimaryGoal(String(data.me.preferences.primaryGoal || 'MAINTENANCE').toUpperCase());
  }, [data]);

  useEffect(() => {
    if (!error) return;
    appToast.error('Session expired', 'Please login again.');
    void (async () => {
      clearAuthToken();
      await clearApolloClientCache();
      router.push('/login');
    })();
  }, [error, router]);

  const handleSaveGoals = async () => {
    const parsedGoal = Number(dailyCalorieGoal);
    const parsedWeeklyWorkouts = Number(weeklyWorkoutsGoal);
    const parsedWeeklyMinutes = Number(weeklyActiveMinutesGoal);
    if (!Number.isFinite(parsedGoal) || parsedGoal < 800 || parsedGoal > 5000) {
      appToast.warning('Invalid calorie target', g.invalidCalories);
      return;
    }
    if (!Number.isFinite(parsedWeeklyWorkouts) || parsedWeeklyWorkouts < 0 || parsedWeeklyWorkouts > 14) {
      appToast.warning('Invalid workouts target', g.invalidWorkouts);
      return;
    }
    if (!Number.isFinite(parsedWeeklyMinutes) || parsedWeeklyMinutes < 0 || parsedWeeklyMinutes > 2000) {
      appToast.warning('Invalid active minutes', g.invalidMinutes);
      return;
    }

    try {
      await updatePreferences({
        variables: {
          input: {
            dailyCalorieGoal: Math.round(parsedGoal),
            weeklyWorkoutsGoal: Math.round(parsedWeeklyWorkouts),
            weeklyActiveMinutesGoal: Math.round(parsedWeeklyMinutes),
            activityLevel,
            primaryGoal,
          },
        },
      });
      appToast.success('Goals updated', 'Your target strategy and limits are saved.');
    } catch (mutationError: any) {
      appToast.error('Update failed', mutationError.message || 'Failed to update goals.');
    }
  };

  const suggestedDailyCalories = suggestDailyCaloriesByGoal(Number(dailyCalorieGoal || 0), primaryGoal);

  const handleSetGoalsWithAI = async () => {
    const prompt = aiGoalPrompt.trim();
    if (!prompt) {
      appToast.info('Add some context', g.addContext);
      return;
    }

    try {
      const result = await setGoalsWithAI({
        variables: { input: { prompt } },
      });
      const message = result.data?.setGoalsWithAI?.message;
      setAiGoalPrompt('');
      setLastAiMessage(message || 'AI updated your goals');
      appToast.success('AI goals updated', message || 'Evo adjusted your goals based on your prompt.');
    } catch (mutationError: any) {
      appToast.error('AI update failed', mutationError.message || 'AI could not update goals.');
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  const locale = graphqlAppLocaleToUi(data?.me?.preferences?.appLocale);
  const g = goalsPageCopy[locale];
  const goalOpts = primaryGoalOptionLabels[locale];

  return (
    <AppShell>
        <div className="mb-6">
          <PageTopBar />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <section className="xl:col-span-8 bg-surface rounded-xl border border-border p-5 space-y-5">
            <h1 className="text-xl font-semibold tracking-tight text-text-primary">{g.pageTitle}</h1>
            <p className="text-text-secondary text-sm">{g.pageSubtitle}</p>
            <div className="rounded-lg border border-border bg-surface-elevated p-3.5">
              <p className="text-xs uppercase tracking-[0.12em] text-text-muted mb-1.5">{g.strategyNote}</p>
              <p className="text-sm text-text-secondary">{getGoalMicrocopyLocalized(primaryGoal, locale)}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label htmlFor="daily-goal" className="mb-2 flex h-10 items-end text-sm text-text-secondary leading-tight">
                  {g.restingCalories}
                </label>
                <input
                  id="daily-goal"
                  type="number"
                  min={800}
                  max={5000}
                  value={dailyCalorieGoal}
                  onChange={(event) => setDailyCalorieGoal(event.target.value)}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label htmlFor="weekly-workouts-goal" className="mb-2 flex h-10 items-end text-sm text-text-secondary leading-tight">
                  {g.weeklyWorkouts}
                </label>
                <input
                  id="weekly-workouts-goal"
                  type="number"
                  min={0}
                  max={14}
                  value={weeklyWorkoutsGoal}
                  onChange={(event) => setWeeklyWorkoutsGoal(event.target.value)}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label htmlFor="weekly-active-minutes-goal" className="mb-2 flex h-10 items-end text-sm text-text-secondary leading-tight">
                  {g.weeklyActiveMinutes}
                </label>
                <input
                  id="weekly-active-minutes-goal"
                  type="number"
                  min={0}
                  max={2000}
                  value={weeklyActiveMinutesGoal}
                  onChange={(event) => setWeeklyActiveMinutesGoal(event.target.value)}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label htmlFor="activity-level" className="mb-2 flex h-10 items-end text-sm text-text-secondary leading-tight">
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
              <div>
                <label htmlFor="primary-goal" className="mb-2 flex h-10 items-end text-sm text-text-secondary leading-tight">
                  {g.primaryGoal}
                </label>
                <select
                  id="primary-goal"
                  value={primaryGoal}
                  onChange={(event) => setPrimaryGoal(event.target.value)}
                  className="input-field w-full"
                >
                  <option value="FAT_LOSS">{goalOpts.FAT_LOSS}</option>
                  <option value="MAINTENANCE">{goalOpts.MAINTENANCE}</option>
                  <option value="MUSCLE_GAIN">{goalOpts.MUSCLE_GAIN}</option>
                  <option value="STRENGTH">{goalOpts.STRENGTH}</option>
                </select>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-surface-elevated p-3.5">
              <p className="text-xs uppercase tracking-[0.12em] text-text-muted mb-1">{g.goalBasedTitle}</p>
              <p className="text-sm text-text-secondary mb-2">
                {g.goalBasedLine(formatPrimaryGoal(primaryGoal), suggestedDailyCalories, renderGoalDeltaText(primaryGoal))}
              </p>
              <button
                type="button"
                onClick={() => setDailyCalorieGoal(String(suggestedDailyCalories))}
                className="btn-secondary"
              >
                {g.applySuggested}
              </button>
              <p className="text-xs text-text-muted mt-2">{g.evoNoteCalories}</p>
            </div>

            <button
              onClick={handleSaveGoals}
              disabled={savingGoals}
              className="btn-secondary w-full inline-flex items-center justify-center gap-2"
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <MacroGoalCard
                label={g.proteinGoal}
                value={data?.me?.preferences?.proteinGoal || 0}
              />
              <MacroGoalCard
                label={g.carbsGoal}
                value={data?.me?.preferences?.carbsGoal || 0}
              />
              <MacroGoalCard
                label={g.fatGoal}
                value={data?.me?.preferences?.fatGoal || 0}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <MacroGoalCard
                label={g.primaryGoalCard}
                value={formatPrimaryGoal(String(data?.me?.preferences?.primaryGoal || primaryGoal))}
                unit=""
              />
              <MacroGoalCard
                label={g.workoutsPerWeek}
                value={data?.me?.preferences?.weeklyWorkoutsGoal || 0}
                unit=""
              />
              <MacroGoalCard
                label={g.activeMinPerWeek}
                value={data?.me?.preferences?.weeklyActiveMinutesGoal || 0}
                unit="min"
              />
            </div>
          </section>

          <aside className="xl:col-span-4 bg-surface rounded-xl border border-border p-5 space-y-4 h-fit">
            <AISectionHeader eyebrow={g.eyebrow} title={g.aiTitle} subtitle={g.aiSubtitle} />

            <SmartSuggestionChips
              title={g.chipsTitle}
              suggestions={[
                { id: 'goal-1', label: g.chip1 },
                { id: 'goal-2', label: g.chip2 },
                { id: 'goal-3', label: g.chip3 },
              ]}
              onSelect={(value) => setAiGoalPrompt(value)}
            />

            <label htmlFor="ai-goal-prompt" className="block text-sm text-text-secondary">
              {g.yourContext}
            </label>
            <textarea
              id="ai-goal-prompt"
              value={aiGoalPrompt}
              onChange={(event) => setAiGoalPrompt(event.target.value)}
              className="input-field w-full min-h-28 resize-y"
              placeholder={g.aiPlaceholder}
            />
            <button
              onClick={handleSetGoalsWithAI}
              disabled={applyingAiGoals}
              className="btn-primary w-full inline-flex items-center justify-center gap-2"
            >
              {applyingAiGoals ? (
                <>
                  <ButtonSpinner />
                  {g.aiSetting}
                </>
              ) : (
                g.setWithAi
              )}
            </button>

            {lastAiMessage ? (
              <EvoHintCard
                title={g.latestEvo}
                tone="notice"
                content={lastAiMessage}
              />
            ) : applyingAiGoals ? (
              <div className="bg-surface-elevated border border-border rounded-lg p-3 space-y-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-[92%]" />
              </div>
            ) : null}
          </aside>
        </div>
    </AppShell>
  );
}

function MacroGoalCard({ label, value, unit = 'g' }: { label: string; value: number | string; unit?: string }) {
  return (
    <div className="bg-surface-elevated border border-border rounded-lg p-3.5">
      <p className="text-[11px] uppercase tracking-[0.14em] text-text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight text-text-primary">
        {value}{unit ? ` ${unit}` : ''}
      </p>
    </div>
  );
}

function goalDeltaByType(goal: string) {
  const normalized = String(goal || '').toUpperCase();
  if (normalized === 'FAT_LOSS') return -300;
  if (normalized === 'MUSCLE_GAIN') return 300;
  if (normalized === 'STRENGTH') return 150;
  return 0;
}

function suggestDailyCaloriesByGoal(currentBase: number, goal: string) {
  const safeCurrent = Number.isFinite(currentBase) && currentBase > 0 ? currentBase : 2000;
  const delta = goalDeltaByType(goal);
  return Math.max(800, Math.round(safeCurrent + delta));
}

function renderGoalDeltaText(goal: string) {
  const delta = goalDeltaByType(goal);
  if (delta > 0) return `+${delta} kcal`;
  if (delta < 0) return `${delta} kcal`;
  return '0 kcal';
}
