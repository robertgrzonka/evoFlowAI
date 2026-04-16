'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { ME_QUERY } from '@/lib/graphql/queries';
import { SET_GOALS_WITH_AI_MUTATION, UPDATE_PREFERENCES_MUTATION } from '@/lib/graphql/mutations';
import { clearAuthToken } from '@/lib/auth-token';
import AppShell from '@/components/AppShell';
import { ButtonSpinner, PageLoader, Skeleton } from '@/components/ui/loading';

export default function GoalsPage() {
  const router = useRouter();
  const [dailyCalorieGoal, setDailyCalorieGoal] = useState('2000');
  const [weeklyWorkoutsGoal, setWeeklyWorkoutsGoal] = useState('4');
  const [weeklyActiveMinutesGoal, setWeeklyActiveMinutesGoal] = useState('180');
  const [activityLevel, setActivityLevel] = useState('MODERATE');
  const [aiGoalPrompt, setAiGoalPrompt] = useState('');
  const [lastAiMessage, setLastAiMessage] = useState('');

  const { data, loading, error } = useQuery(ME_QUERY);

  const [updatePreferences, { loading: savingGoals }] = useMutation(UPDATE_PREFERENCES_MUTATION, {
    refetchQueries: [{ query: ME_QUERY }],
    awaitRefetchQueries: true,
  });

  const [setGoalsWithAI, { loading: applyingAiGoals }] = useMutation(SET_GOALS_WITH_AI_MUTATION, {
    refetchQueries: [{ query: ME_QUERY }],
    awaitRefetchQueries: true,
  });

  useEffect(() => {
    if (!data?.me?.preferences) return;
    setDailyCalorieGoal(String(data.me.preferences.dailyCalorieGoal || 2000));
    setWeeklyWorkoutsGoal(String(data.me.preferences.weeklyWorkoutsGoal ?? 4));
    setWeeklyActiveMinutesGoal(String(data.me.preferences.weeklyActiveMinutesGoal ?? 180));
    setActivityLevel(String(data.me.preferences.activityLevel || 'MODERATE').toUpperCase());
  }, [data]);

  useEffect(() => {
    if (!error) return;
    toast.error('Session expired. Please login again.');
    clearAuthToken();
    router.push('/login');
  }, [error, router]);

  const handleSaveGoals = async () => {
    const parsedGoal = Number(dailyCalorieGoal);
    const parsedWeeklyWorkouts = Number(weeklyWorkoutsGoal);
    const parsedWeeklyMinutes = Number(weeklyActiveMinutesGoal);
    if (!Number.isFinite(parsedGoal) || parsedGoal < 800 || parsedGoal > 5000) {
      toast.error('Daily calorie goal must be between 800 and 5000');
      return;
    }
    if (!Number.isFinite(parsedWeeklyWorkouts) || parsedWeeklyWorkouts < 0 || parsedWeeklyWorkouts > 14) {
      toast.error('Weekly workouts goal must be between 0 and 14');
      return;
    }
    if (!Number.isFinite(parsedWeeklyMinutes) || parsedWeeklyMinutes < 0 || parsedWeeklyMinutes > 2000) {
      toast.error('Weekly active minutes goal must be between 0 and 2000');
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
          },
        },
      });
      toast.success('Goals updated');
    } catch (mutationError: any) {
      toast.error(mutationError.message || 'Failed to update goals');
    }
  };

  const handleSetGoalsWithAI = async () => {
    const prompt = aiGoalPrompt.trim();
    if (!prompt) {
      toast.error('Describe your goal first');
      return;
    }

    try {
      const result = await setGoalsWithAI({
        variables: { input: { prompt } },
      });
      const message = result.data?.setGoalsWithAI?.message;
      setAiGoalPrompt('');
      setLastAiMessage(message || 'AI updated your goals');
      toast.success(message || 'AI updated your goals');
    } catch (mutationError: any) {
      toast.error(mutationError.message || 'AI could not update goals');
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <AppShell>
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center text-text-secondary hover:text-text-primary transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4 stroke-[1.9]" />
            Back to dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <section className="xl:col-span-8 bg-surface rounded-xl border border-border p-5 space-y-5">
            <h1 className="text-xl font-semibold tracking-tight text-text-primary">Goal Settings</h1>
            <p className="text-text-secondary text-sm">
              Set calorie and activity goals manually.
              Macro goals are set automatically to stay consistent with your plan.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="daily-goal" className="block text-sm text-text-secondary mb-2">
                  Daily calories
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
                <label htmlFor="weekly-workouts-goal" className="block text-sm text-text-secondary mb-2">
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
                <label htmlFor="weekly-active-minutes-goal" className="block text-sm text-text-secondary mb-2">
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
                <label htmlFor="activity-level" className="block text-sm text-text-secondary mb-2">
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
            <h2 className="text-lg font-semibold tracking-tight text-text-primary">AI Goal Coach</h2>
            <p className="text-sm text-text-secondary">
              Ask AI to suggest goals based on your lifestyle, training routine and daily habits.
            </p>

            <div className="space-y-2">
              {[
                'I work at a desk and walk around 6k steps daily. I want gradual fat loss.',
                'I train strength 4 times per week and want to build muscle with minimal fat gain.',
                'I do cardio 5x weekly and need goals that keep energy high.',
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setAiGoalPrompt(prompt)}
                  className="w-full text-left bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:border-primary-500/30 transition-colors duration-150 ease-out"
                >
                  {prompt}
                </button>
              ))}
            </div>

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
              <div className="bg-surface-elevated border border-border rounded-lg p-3">
                <p className="text-xs uppercase tracking-[0.14em] text-text-muted mb-2">Latest AI update</p>
                <p className="text-sm text-text-primary whitespace-pre-wrap">{lastAiMessage}</p>
              </div>
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

function MacroGoalCard({ label, value, unit = 'g' }: { label: string; value: number; unit?: string }) {
  return (
    <div className="bg-surface-elevated border border-border rounded-lg p-3.5">
      <p className="text-[11px] uppercase tracking-[0.14em] text-text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight text-text-primary">
        {value}{unit ? ` ${unit}` : ''}
      </p>
    </div>
  );
}
