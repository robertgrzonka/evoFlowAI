'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useSubscription } from '@apollo/client';
import Link from 'next/link';
import { ArrowLeft, Dumbbell, Flame, Timer, Trash2 } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { ButtonSpinner, Skeleton } from '@/components/ui/loading';
import { DELETE_WORKOUT_MUTATION, LOG_WORKOUT_MUTATION } from '@/lib/graphql/mutations';
import {
  DAILY_STATS_QUERY,
  ME_QUERY,
  MY_WORKOUTS_QUERY,
  NEW_WORKOUT_SUBSCRIPTION,
  WORKOUT_COACH_SUMMARY_QUERY,
} from '@/lib/graphql/queries';
import { appToast } from '@/lib/app-toast';

type WorkoutIntensity = 'LOW' | 'MEDIUM' | 'HIGH';

const intensityOptions: WorkoutIntensity[] = ['LOW', 'MEDIUM', 'HIGH'];

export default function WorkoutsPage() {
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [caloriesBurned, setCaloriesBurned] = useState(300);
  const [intensity, setIntensity] = useState<WorkoutIntensity>('MEDIUM');

  const { data: meData } = useQuery(ME_QUERY);
  const { data: workoutsData, loading: workoutsLoading, refetch: refetchWorkouts } = useQuery(MY_WORKOUTS_QUERY, {
    variables: { date: today, limit: 20, offset: 0 },
    fetchPolicy: 'cache-and-network',
  });
  const { data: summaryData, loading: summaryLoading, refetch: refetchSummary } = useQuery(WORKOUT_COACH_SUMMARY_QUERY, {
    variables: { date: today },
    fetchPolicy: 'cache-and-network',
  });

  useSubscription(NEW_WORKOUT_SUBSCRIPTION, {
    variables: { userId: meData?.me?.id },
    skip: !meData?.me?.id,
    onData: () => {
      refetchWorkouts({ date: today, limit: 20, offset: 0 });
      refetchSummary({ date: today });
    },
  });

  const [logWorkout, { loading: loggingWorkout }] = useMutation(LOG_WORKOUT_MUTATION, {
    onCompleted: () => {
      setTitle('');
      setNotes('');
      appToast.success('Workout saved', 'Session was added to today.');
    },
    onError: (error) => {
      appToast.error('Save failed', error.message || 'Could not save workout.');
    },
    refetchQueries: [
      { query: MY_WORKOUTS_QUERY, variables: { date: today, limit: 20, offset: 0 } },
      { query: WORKOUT_COACH_SUMMARY_QUERY, variables: { date: today } },
      { query: DAILY_STATS_QUERY, variables: { date: today } },
    ],
  });

  const [deleteWorkout, { loading: deletingWorkout }] = useMutation(DELETE_WORKOUT_MUTATION, {
    onError: (error) => {
      appToast.error('Delete failed', error.message || 'Could not delete workout.');
    },
    refetchQueries: [
      { query: MY_WORKOUTS_QUERY, variables: { date: today, limit: 20, offset: 0 } },
      { query: WORKOUT_COACH_SUMMARY_QUERY, variables: { date: today } },
      { query: DAILY_STATS_QUERY, variables: { date: today } },
    ],
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      appToast.info('Workout title missing', 'Add workout name before saving.');
      return;
    }

    await logWorkout({
      variables: {
        input: {
          title: title.trim(),
          notes: notes.trim() || null,
          durationMinutes: Number(durationMinutes),
          caloriesBurned: Number(caloriesBurned),
          intensity,
          performedAt: new Date().toISOString(),
        },
      },
    });
  };

  const summary = summaryData?.workoutCoachSummary;
  const workouts = workoutsData?.myWorkouts || [];

  const handleDeleteWorkout = async (workoutId: string) => {
    const confirmed = window.confirm('Delete this workout entry?');
    if (!confirmed) return;

    const result = await deleteWorkout({ variables: { id: workoutId } });
    if (result.data?.deleteWorkout) {
      appToast.success('Workout deleted', 'Entry was removed from your timeline.');
    } else {
      appToast.error('Delete failed', 'Could not delete workout.');
    }
  };

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center text-text-secondary hover:text-text-primary transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4 stroke-[1.9]" />
            Back to dashboard
          </Link>
          <h1 className="text-lg font-semibold tracking-tight text-text-primary">Workout Coach</h1>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <section className="xl:col-span-5 bg-surface border border-border rounded-xl p-4 md:p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
                <Dumbbell className="h-5 w-5 text-amber-400 stroke-[1.9]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-text-primary">Log your training</h2>
                <p className="text-xs text-text-muted">Add session details and keep energy balance in sync</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="workoutTitle" className="block text-sm font-medium text-text-primary mb-2">
                  Workout title
                </label>
                <input
                  id="workoutTitle"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="input-field w-full"
                  placeholder="e.g. Upper body strength + core"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="durationMinutes" className="block text-sm font-medium text-text-primary mb-2">
                    Duration (min)
                  </label>
                  <input
                    id="durationMinutes"
                    type="number"
                    min={1}
                    value={durationMinutes}
                    onChange={(event) => setDurationMinutes(Number(event.target.value))}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label htmlFor="caloriesBurned" className="block text-sm font-medium text-text-primary mb-2">
                    Estimated kcal burned
                  </label>
                  <input
                    id="caloriesBurned"
                    type="number"
                    min={0}
                    value={caloriesBurned}
                    onChange={(event) => setCaloriesBurned(Number(event.target.value))}
                    className="input-field w-full"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="intensity" className="block text-sm font-medium text-text-primary mb-2">
                  Intensity
                </label>
                <select
                  id="intensity"
                  value={intensity}
                  onChange={(event) => setIntensity(event.target.value as WorkoutIntensity)}
                  className="input-field w-full"
                >
                  {intensityOptions.map((item) => (
                    <option key={item} value={item}>
                      {item.charAt(0) + item.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="workoutNotes" className="block text-sm font-medium text-text-primary mb-2">
                  Session notes
                </label>
                <textarea
                  id="workoutNotes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="input-field w-full min-h-24 resize-y"
                  placeholder="How it felt, sets/reps, what to improve next time..."
                />
              </div>

              <button type="submit" disabled={loggingWorkout} className="btn-primary w-full inline-flex items-center justify-center gap-2">
                {loggingWorkout ? (
                  <>
                    <ButtonSpinner />
                    Saving workout...
                  </>
                ) : (
                  'Save workout'
                )}
              </button>
            </form>
          </section>

          <section className="xl:col-span-7 space-y-4">
            <div className="bg-surface border border-border rounded-xl p-4 md:p-5">
              <h2 className="text-lg font-semibold tracking-tight text-text-primary mb-4">Today summary (food + training)</h2>
              {summaryLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-20 w-full rounded-lg" />
                </div>
              ) : summary ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <MetricCard icon={<Flame className="h-4 w-4" />} label="Net calories" value={`${summary.netCalories.toFixed(0)} kcal`} />
                    <MetricCard icon={<Timer className="h-4 w-4" />} label="Burned today" value={`${summary.caloriesBurned.toFixed(0)} kcal`} />
                    <MetricCard icon={<Dumbbell className="h-4 w-4" />} label="Protein left" value={`${Math.max(0, summary.remainingProtein).toFixed(0)} g`} />
                  </div>
                  <div className="rounded-lg border border-border bg-surface-elevated p-3.5">
                    <p className="text-xs uppercase tracking-[0.12em] text-text-muted mb-2">Coach suggestion</p>
                    <p className="text-sm text-text-primary whitespace-pre-wrap">{summary.message}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-text-secondary">No summary yet for today.</p>
              )}
            </div>

            <div className="bg-surface border border-border rounded-xl p-4 md:p-5">
              <h3 className="text-base font-semibold tracking-tight text-text-primary mb-3">Today workouts</h3>
              {workoutsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-14 w-full rounded-lg" />
                  <Skeleton className="h-14 w-full rounded-lg" />
                </div>
              ) : workouts.length > 0 ? (
                <div className="space-y-2.5">
                  {workouts.map((workout: any) => (
                    <div key={workout.id} className="rounded-lg border border-border bg-surface-elevated p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-text-primary">{workout.title}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase tracking-[0.12em] text-text-muted">{workout.intensity.toLowerCase()}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteWorkout(workout.id)}
                            disabled={deletingWorkout}
                            className="inline-flex items-center justify-center rounded-md border border-border px-2 py-1 text-xs text-text-secondary hover:text-red-400 hover:border-red-400/40 transition-colors"
                            title="Delete workout"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-text-secondary mt-1">
                        {workout.durationMinutes} min • {workout.caloriesBurned} kcal burned
                      </p>
                      {workout.notes ? <p className="text-sm text-text-secondary mt-2">{workout.notes}</p> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-secondary">No workouts logged yet today.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-elevated p-3">
      <div className="inline-flex items-center gap-1.5 text-xs text-text-muted">
        {icon}
        {label}
      </div>
      <p className="text-sm font-semibold text-text-primary mt-1">{value}</p>
    </div>
  );
}
