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
      appToast.warning('Invalid calorie target', 'Daily calorie goal must be between 800 and 5000.');
      return;
    }
    if (!Number.isFinite(parsedWeeklyWorkouts) || parsedWeeklyWorkouts < 0 || parsedWeeklyWorkouts > 14) {
      appToast.warning('Invalid workouts target', 'Weekly workouts goal must be between 0 and 14.');
      return;
    }
    if (!Number.isFinite(parsedWeeklyMinutes) || parsedWeeklyMinutes < 0 || parsedWeeklyMinutes > 2000) {
      appToast.warning('Invalid active minutes', 'Weekly active minutes goal must be between 0 and 2000.');
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
      appToast.info('Add some context', 'Describe your routine so Evo can suggest better goals.');
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

  return (
    <AppShell>
        <div className="mb-6">
          <PageTopBar />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <section className="xl:col-span-8 bg-surface rounded-xl border border-border p-5 space-y-5">
            <h1 className="text-xl font-semibold tracking-tight text-text-primary">Goal Settings</h1>
            <p className="text-text-secondary text-sm">
              Set your resting calorie baseline and activity goals manually.
              Daily calorie budget scales dynamically with logged workouts.
            </p>
            <div className="rounded-lg border border-border bg-surface-elevated p-3.5">
              <p className="text-xs uppercase tracking-[0.12em] text-text-muted mb-1.5">Strategy note</p>
              <p className="text-sm text-text-secondary">{getGoalMicrocopy(primaryGoal)}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label htmlFor="daily-goal" className="mb-2 flex h-10 items-end text-sm text-text-secondary leading-tight">
                  Resting calories (base)
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
                  Weekly workouts
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
                  Weekly active minutes
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
                  Activity level
                </label>
                <select
                  id="activity-level"
                  value={activityLevel}
                  onChange={(event) => setActivityLevel(event.target.value)}
                  className="input-field w-full"
                >
                  <option value="SEDENTARY">Sedentary</option>
                  <option value="LIGHT">Light</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="ACTIVE">Active</option>
                  <option value="VERY_ACTIVE">Very Active</option>
                </select>
              </div>
              <div>
                <label htmlFor="primary-goal" className="mb-2 flex h-10 items-end text-sm text-text-secondary leading-tight">
                  Primary goal
                </label>
                <select
                  id="primary-goal"
                  value={primaryGoal}
                  onChange={(event) => setPrimaryGoal(event.target.value)}
                  className="input-field w-full"
                >
                  <option value="FAT_LOSS">Fat loss</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="MUSCLE_GAIN">Muscle gain</option>
                  <option value="STRENGTH">Strength</option>
                </select>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-surface-elevated p-3.5">
              <p className="text-xs uppercase tracking-[0.12em] text-text-muted mb-1">Goal-based suggestion</p>
              <p className="text-sm text-text-secondary mb-2">
                For <span className="font-semibold text-text-primary">{formatPrimaryGoal(primaryGoal)}</span>, suggested base is{' '}
                <span className="font-semibold text-text-primary">{suggestedDailyCalories} kcal</span>
                {' '}({renderGoalDeltaText(primaryGoal)} vs maintenance baseline).
              </p>
              <button
                type="button"
                onClick={() => setDailyCalorieGoal(String(suggestedDailyCalories))}
                className="btn-secondary"
              >
                Apply suggested base calories
              </button>
              <p className="text-xs text-text-muted mt-2">
                Evo note: calories can be dynamic by day, but your macro goals below stay stable.
              </p>
            </div>

            <button
              onClick={handleSaveGoals}
              disabled={savingGoals}
              className="btn-secondary w-full inline-flex items-center justify-center gap-2"
            >
              {savingGoals ? (
                <>
                  <ButtonSpinner />
                  Saving goals...
                </>
              ) : 'Save goals'}
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <MacroGoalCard
                label="Protein Goal"
                value={data?.me?.preferences?.proteinGoal || 0}
              />
              <MacroGoalCard
                label="Carbs Goal"
                value={data?.me?.preferences?.carbsGoal || 0}
              />
              <MacroGoalCard
                label="Fat Goal"
                value={data?.me?.preferences?.fatGoal || 0}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <MacroGoalCard
                label="Primary Goal"
                value={formatPrimaryGoal(String(data?.me?.preferences?.primaryGoal || primaryGoal))}
                unit=""
              />
              <MacroGoalCard
                label="Workouts / Week"
                value={data?.me?.preferences?.weeklyWorkoutsGoal || 0}
                unit=""
              />
              <MacroGoalCard
                label="Active Minutes / Week"
                value={data?.me?.preferences?.weeklyActiveMinutesGoal || 0}
                unit="min"
              />
            </div>
          </section>

          <aside className="xl:col-span-4 bg-surface rounded-xl border border-border p-5 space-y-4 h-fit">
            <AISectionHeader
              eyebrow="Evo guidance"
              title="Evo Goal Coach"
              subtitle="Set direction manually, then let Evo shape details around your routine."
            />

            <SmartSuggestionChips
              title="Try one of these contexts"
              suggestions={[
                { id: 'goal-1', label: 'I work at a desk and walk around 6k steps daily. I want gradual fat loss.' },
                { id: 'goal-2', label: 'I train strength 4 times per week and want to build muscle with minimal fat gain.' },
                { id: 'goal-3', label: 'I do cardio 5x weekly and need goals that keep energy high.' },
              ]}
              onSelect={(value) => setAiGoalPrompt(value)}
            />

            <label htmlFor="ai-goal-prompt" className="block text-sm text-text-secondary">
              Your context
            </label>
            <textarea
              id="ai-goal-prompt"
              value={aiGoalPrompt}
              onChange={(event) => setAiGoalPrompt(event.target.value)}
              className="input-field w-full min-h-28 resize-y"
              placeholder="Example: I train 4 times a week and want to lose fat slowly while keeping muscle."
            />
            <button
              onClick={handleSetGoalsWithAI}
              disabled={applyingAiGoals}
              className="btn-primary w-full inline-flex items-center justify-center gap-2"
            >
              {applyingAiGoals ? (
                <>
                  <ButtonSpinner />
                  AI is setting goals...
                </>
              ) : 'Set goals with AI coach'}
            </button>

            {lastAiMessage ? (
              <EvoHintCard
                title="Latest Evo update"
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

function getGoalMicrocopy(goal: string) {
  switch (String(goal || '').toUpperCase()) {
    case 'FAT_LOSS':
      return 'Keep a moderate deficit and prioritize protein + satiety meals to preserve performance.';
    case 'MUSCLE_GAIN':
      return 'Use a controlled surplus, hit protein targets daily, and keep training progression consistent.';
    case 'STRENGTH':
      return 'Fuel around sessions, keep carbs around harder workouts, and monitor recovery quality.';
    case 'MAINTENANCE':
    default:
      return 'Aim for stable intake and consistent training rhythm to maintain composition and performance.';
  }
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
