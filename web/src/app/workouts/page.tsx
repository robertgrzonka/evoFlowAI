'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApolloClient, useMutation, useQuery, useSubscription } from '@apollo/client';
import { clsx } from 'clsx';
import { ChevronDown, Dumbbell, FileUp, Flame, Pencil, Timer, Trash2 } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { accentEdgeClasses } from '@/components/ui/accent-cards';
import { NumericInput, NumericInputNumber } from '@/components/ui/atoms/NumericInput';
import PageTopBar from '@/components/ui/molecules/PageTopBar';
import { ButtonSpinner, Skeleton } from '@/components/ui/loading';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { getDestructiveConfirmLabels } from '@/lib/i18n/destructive-confirm';
import {
  DELETE_WORKOUT_MUTATION,
  IMPORT_WORKOUT_FILE_MUTATION,
  LOG_WORKOUT_MUTATION,
  UPDATE_WORKOUT_MUTATION,
  UPSERT_DAILY_ACTIVITY_MUTATION,
} from '@/lib/graphql/mutations';
import { ME_QUERY, NEW_WORKOUT_SUBSCRIPTION } from '@/lib/graphql/queries';
import { appToast } from '@/lib/app-toast';
import {
  buildDayRefetchQueriesAfterLog,
  buildRollingSevenDayAverageStepsRefetch,
  dateKeyToNoonUtcIso,
  kickDeferredAfterWorkoutLog,
  kickDeferredDashboardAndWeeklyEvo,
} from '@/lib/day-data';
import { useDaySnapshot } from '@/hooks/useDaySnapshot';
import { useClientCalendarToday } from '@/hooks/useClientCalendarToday';
import {
  AISectionHeader,
  EvoHintCard,
  EvoThinkingOverlay,
  InsightEmptyState,
  SmartSuggestionChips,
} from '@/components/evo';
import WeeklyWorkoutsTrainingSection from '@/components/workouts/WeeklyWorkoutsTrainingSection';
import EditWorkoutDialog, { type EditableWorkoutPayload } from '@/components/workouts/EditWorkoutDialog';
import { addDaysToDateKey } from '@/lib/calendar-date-key';
import { useAppUiLocale } from '@/lib/i18n/use-app-ui-locale';
import { workoutsPageCopy } from '@/lib/i18n/copy/workouts-page';

type WorkoutIntensity = 'LOW' | 'MEDIUM' | 'HIGH';

export default function WorkoutsPage() {
  const client = useApolloClient();
  const locale = useAppUiLocale();
  const w = workoutsPageCopy[locale];
  const router = useRouter();
  const { dateKey: today, timeZone } = useClientCalendarToday();
  const weeklyStatsEndDate = useMemo(() => addDaysToDateKey(today, -1), [today]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [deleteWorkoutId, setDeleteWorkoutId] = useState<string | null>(null);
  const [editWorkoutId, setEditWorkoutId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [caloriesBurned, setCaloriesBurned] = useState(300);
  const [intensity, setIntensity] = useState<WorkoutIntensity>('MEDIUM');
  const [importNotes, setImportNotes] = useState('');
  const [dayPanelOpen, setDayPanelOpen] = useState(true);
  const [logPanelOpen, setLogPanelOpen] = useState(true);
  const [activityBonusDraft, setActivityBonusDraft] = useState('0');
  const [stepsDraft, setStepsDraft] = useState('0');

  const { data: meData } = useQuery(ME_QUERY);
  const daySnapshot = useDaySnapshot({
    date: selectedDate,
    clientTimeZone: timeZone,
    enabled: true,
    includeInsight: false,
  });

  useEffect(() => {
    const raw = daySnapshot.stats?.activityBonusKcal;
    if (raw === undefined || raw === null) return;
    setActivityBonusDraft(String(Math.max(0, Math.round(Number(raw)))));
  }, [daySnapshot.stats?.activityBonusKcal, selectedDate]);

  useEffect(() => {
    const raw = daySnapshot.activity?.steps ?? daySnapshot.stats?.steps;
    if (raw === undefined || raw === null) return;
    setStepsDraft(String(Math.max(0, Math.round(Number(raw)))));
  }, [daySnapshot.activity?.steps, daySnapshot.stats?.steps, selectedDate]);

  useSubscription(NEW_WORKOUT_SUBSCRIPTION, {
    variables: { userId: meData?.me?.id },
    skip: !meData?.me?.id,
    onData: () => {
      daySnapshot.refetchDay();
    },
  });

  const [logWorkout, { loading: loggingWorkout }] = useMutation(LOG_WORKOUT_MUTATION, {
    onCompleted: () => {
      setTitle('');
      setNotes('');
      kickDeferredAfterWorkoutLog(client);
      appToast.success(
        'Workout saved',
        selectedDate === today ? 'Session was added to today.' : `Session was added to ${selectedDate}.`
      );
    },
    onError: (error) => {
      appToast.error('Save failed', error.message || 'Could not save workout.');
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
  const [updateWorkoutMutation, { loading: savingWorkoutEdits }] = useMutation(UPDATE_WORKOUT_MUTATION, {
    onCompleted: () => kickDeferredAfterWorkoutLog(client),
    onError: (error) => {
      appToast.error('Save failed', error.message || 'Could not update workout.');
    },
    refetchQueries: [...buildDayRefetchQueriesAfterLog(selectedDate, timeZone)],
    awaitRefetchQueries: true,
  });
  const [upsertDailyActivity, { loading: savingActivityBonus }] = useMutation(UPSERT_DAILY_ACTIVITY_MUTATION, {
    onCompleted: () => {
      kickDeferredDashboardAndWeeklyEvo(client);
      appToast.success(w.activityBonusSaved, w.activityBudgetHint);
    },
    onError: (error) => {
      appToast.error('Save failed', error.message || 'Could not save.');
    },
    refetchQueries: [
      ...buildDayRefetchQueriesAfterLog(selectedDate, timeZone),
      buildRollingSevenDayAverageStepsRefetch(today, timeZone),
    ],
    awaitRefetchQueries: true,
  });
  const [upsertDailySteps, { loading: savingSteps }] = useMutation(UPSERT_DAILY_ACTIVITY_MUTATION, {
    onCompleted: () => {
      kickDeferredDashboardAndWeeklyEvo(client);
      appToast.success(w.dailyStepsSaved, w.dailyStepsHint(Math.round(Number(stepsDraft) || 0)));
    },
    onError: (error) => {
      appToast.error('Save failed', error.message || 'Could not save steps.');
    },
    refetchQueries: [
      ...buildDayRefetchQueriesAfterLog(selectedDate, timeZone),
      buildRollingSevenDayAverageStepsRefetch(today, timeZone),
    ],
    awaitRefetchQueries: true,
  });

  const [importWorkoutFile, { loading: importingWorkoutFile }] = useMutation(IMPORT_WORKOUT_FILE_MUTATION, {
    onCompleted: () => {
      setImportNotes('');
      kickDeferredAfterWorkoutLog(client);
      appToast.success(
        'Workout imported',
        selectedDate === today ? 'File was parsed and added to today.' : `File was parsed and added to ${selectedDate}.`
      );
    },
    onError: (error) => {
      appToast.error('Import failed', error.message || 'Could not import workout file.');
    },
    refetchQueries: [...buildDayRefetchQueriesAfterLog(selectedDate, timeZone)],
    awaitRefetchQueries: true,
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      appToast.info('Workout title missing', w.titlePlaceholder);
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
          performedAt: dateKeyToNoonUtcIso(selectedDate),
        },
      },
    });
  };

  const summary = daySnapshot.summary;
  const workouts = daySnapshot.workouts || [];

  const handleSaveActivityBonus = async () => {
    const n = Number(String(activityBonusDraft).replace(',', '.'));
    const bonus = Math.max(0, Math.min(1500, Number.isFinite(n) ? Math.round(n) : 0));
    const steps = Math.max(0, Math.round(Number(daySnapshot.activity?.steps ?? daySnapshot.stats?.steps ?? 0)));
    await upsertDailyActivity({
      variables: {
        input: {
          date: selectedDate,
          steps,
          activityBonusKcal: bonus,
        },
      },
    });
  };

  const handleSaveSteps = async () => {
    const n = Number(String(stepsDraft).replace(',', '.'));
    if (!Number.isFinite(n) || n < 0 || n > 120000) {
      appToast.info(w.invalidStepsTitle, w.invalidStepsBody);
      return;
    }
    const steps = Math.round(n);
    const activityBonusKcal = Math.max(0, Math.round(Number(daySnapshot.stats?.activityBonusKcal ?? 0)));
    await upsertDailySteps({
      variables: {
        input: {
          date: selectedDate,
          steps,
          activityBonusKcal,
        },
      },
    });
  };
  const weeklyWorkoutsGoal = Number(meData?.me?.preferences?.weeklyWorkoutsGoal || 4);
  const weeklyActiveMinutesGoal = Number(meData?.me?.preferences?.weeklyActiveMinutesGoal || 180);
  const minutesOnDay = workouts.reduce((acc: number, workout: any) => acc + Number(workout.durationMinutes || 0), 0);
  const dayLabel = selectedDate === today ? w.todayWord : selectedDate;

  const handleConfirmDeleteWorkout = async () => {
    if (!deleteWorkoutId) return;
    const id = deleteWorkoutId;
    setDeleteWorkoutId(null);
    const result = await deleteWorkout({ variables: { id } });
    if (result.data?.deleteWorkout) {
      appToast.success('Workout deleted', 'Entry was removed from your timeline.');
    } else {
      appToast.error('Delete failed', 'Could not delete workout.');
    }
  };
  const handleImportWorkout = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.toLowerCase().split('.').pop();
    if (!extension || !['gpx', 'tcx', 'fit'].includes(extension)) {
      appToast.warning('Unsupported format', 'Use GPX, TCX, or FIT file.');
      event.target.value = '';
      return;
    }

    const base64Content = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || '');
        const payload = result.includes(',') ? result.split(',')[1] : result;
        resolve(payload);
      };
      reader.onerror = () => reject(new Error('Could not read file.'));
      reader.readAsDataURL(file);
    });

    await importWorkoutFile({
      variables: {
        input: {
          fileName: file.name,
          fileContentBase64: base64Content,
          performedAt: dateKeyToNoonUtcIso(selectedDate),
          notes: importNotes.trim() || null,
          intensity,
        },
      },
    });
    event.target.value = '';
  };

  const workoutForEditPayload: EditableWorkoutPayload | null = editWorkoutId
    ? (workouts.find((x: { id: string }) => x.id === editWorkoutId) as EditableWorkoutPayload | undefined) ??
      null
    : null;

  const handleSaveWorkoutEdit = async (input: {
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
    appToast.success(w.toastWorkoutUpdatedTitle, w.toastWorkoutUpdatedBody);
  };

  const lastWorkout = workouts[0];
  const workoutTemplates = [
    { id: 'tpl-upper', label: w.tplUpper },
    { id: 'tpl-lower', label: w.tplLower },
    { id: 'tpl-cardio', label: w.tplCardio },
  ];
  const delLabels = getDestructiveConfirmLabels(locale);

  return (
    <AppShell>
      <EditWorkoutDialog
        open={Boolean(editWorkoutId && workoutForEditPayload)}
        workout={workoutForEditPayload}
        onClose={() => setEditWorkoutId(null)}
        saving={savingWorkoutEdits}
        copy={{
          editWorkoutTitle: w.editWorkoutTitle,
          saveWorkoutChanges: w.saveWorkoutChanges,
          cancelEditWorkout: w.cancelEditWorkout,
          workoutTitle: w.workoutTitle,
          titlePlaceholder: w.titlePlaceholder,
          duration: w.duration,
          kcalBurned: w.kcalBurned,
          intensity: w.intensity,
          sessionNotes: w.sessionNotes,
          notesPlaceholder: w.notesPlaceholder,
          intensityLow: w.intensityLow,
          intensityMedium: w.intensityMedium,
          intensityHigh: w.intensityHigh,
          performedAtLabel: w.performedAtLabel,
        }}
        onSave={handleSaveWorkoutEdit}
      />
      <ConfirmDialog
        open={deleteWorkoutId !== null}
        title={w.deleteWorkoutTitle}
        description={w.confirmDelete}
        confirmLabel={delLabels.confirm}
        cancelLabel={delLabels.cancel}
        onCancel={() => setDeleteWorkoutId(null)}
        onConfirm={() => void handleConfirmDeleteWorkout()}
        confirmBusy={deletingWorkout}
        variant="danger"
      />
      <EvoThinkingOverlay
        open={loggingWorkout || importingWorkoutFile}
        locale={locale}
        intent="workout"
      />
      <div className="space-y-5">
        <PageTopBar
          rightContent={
            <button type="button" onClick={() => router.push('/chat?channel=COACH')} className="btn-info">
              {w.openEvoChat}
            </button>
          }
        />

        <h1 className="text-xl font-semibold tracking-tight text-text-primary">{w.pageTitle}</h1>
        <p className="text-sm text-text-secondary max-w-3xl leading-relaxed">{w.pageIntro}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <MetricCard icon={<Dumbbell className="h-4 w-4" />} label={`${w.sessionsLabel} (${dayLabel})`} value={`${workouts.length}`} />
          <MetricCard icon={<Timer className="h-4 w-4" />} label={`${w.minutesLabel} (${dayLabel})`} value={`${minutesOnDay} min`} />
          <MetricCard icon={<Flame className="h-4 w-4" />} label={w.weeklySessionsGoal} value={`${weeklyWorkoutsGoal}`} />
          <MetricCard icon={<Flame className="h-4 w-4" />} label={w.weeklyMinutesGoal} value={`${weeklyActiveMinutesGoal} min`} />
        </div>

        <div className="space-y-6 xl:space-y-8">
          <div className="grid gap-6 xl:gap-8 lg:grid-cols-2 items-start">
            <section
              className={clsx(
                'bg-surface border border-border rounded-xl p-4 md:p-5 min-w-0 shadow-sm shadow-black/5',
                accentEdgeClasses('primary', 'left'),
              )}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="min-w-0 text-lg font-semibold tracking-tight text-text-primary">
                  {w.workoutsFor} {selectedDate}
                  {selectedDate === today ? w.todaySuffix : ''}
                </h2>
                <button
                  type="button"
                  className="btn-ghost h-9 w-9 shrink-0 rounded-lg border border-border/80 px-0"
                  aria-expanded={dayPanelOpen}
                  aria-controls="workouts-day-panel"
                  onClick={() => setDayPanelOpen((v) => !v)}
                >
                  <ChevronDown
                    className={clsx('mx-auto h-4 w-4 transition-transform duration-200', dayPanelOpen && 'rotate-180')}
                  />
                  <span className="sr-only">{dayPanelOpen ? w.collapseWorkoutsDay : w.expandWorkoutsDay}</span>
                </button>
              </div>
              {dayPanelOpen ? (
                <div id="workouts-day-panel" className="space-y-4">
                  <div
                    className={clsx(
                      'rounded-xl border border-border bg-surface p-4 md:p-5 shadow-sm shadow-black/5',
                      accentEdgeClasses('info', 'left'),
                    )}
                  >
                    <h3 className="mb-4 text-base font-semibold tracking-tight text-text-primary">
                      {w.daySummaryTitle(selectedDate, selectedDate === today)}
                    </h3>
                    {daySnapshot.loading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-16 w-full rounded-lg" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                        <Skeleton className="h-20 w-full rounded-lg" />
                      </div>
                    ) : summary ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                          <MetricCard
                            icon={<Flame className="h-4 w-4" />}
                            label={w.netCaloriesLabel}
                            value={`${summary.netCalories.toFixed(0)} kcal`}
                          />
                          <MetricCard
                            icon={<Timer className="h-4 w-4" />}
                            label={selectedDate === today ? w.burnedTodayLabel : w.burnedOnDateLabel(selectedDate)}
                            value={`${summary.caloriesBurned.toFixed(0)} kcal`}
                          />
                          <MetricCard
                            icon={<Dumbbell className="h-4 w-4" />}
                            label={w.proteinLeftLabel}
                            value={`${Math.max(0, summary.remainingProtein).toFixed(0)} g`}
                          />
                        </div>
                        <div className="space-y-3 rounded-lg border border-border bg-surface-elevated p-3.5">
                          <p className="text-xs uppercase tracking-[0.12em] text-text-muted">{w.coachSuggestion}</p>
                          {summary.message?.trim() ? (
                            <p className="whitespace-pre-wrap break-words text-sm text-text-primary">{summary.message}</p>
                          ) : (
                            <p className="text-sm text-text-muted">{w.coachInsightEmpty}</p>
                          )}
                          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
                            <button
                              type="button"
                              className="btn-info w-full shrink-0 sm:min-w-[10rem] sm:flex-1"
                              onClick={() => window.location.assign('/chat?channel=COACH')}
                            >
                              {w.explainScore}
                            </button>
                            <button
                              type="button"
                              className="btn-info w-full shrink-0 sm:min-w-[10rem] sm:flex-1"
                              onClick={() => window.location.assign('/chat?channel=COACH')}
                            >
                              {w.suggestPostMeal}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <InsightEmptyState title={w.noInsightTitle} description={w.noInsightDescription} />
                    )}
                  </div>

                  <div
                    className={clsx(
                      'rounded-xl border border-border bg-surface p-4 md:p-5 space-y-4 shadow-sm shadow-black/5',
                      accentEdgeClasses('success', 'left'),
                    )}
                  >
                    <h3 className="text-base font-semibold tracking-tight text-text-primary">
                      {w.dayWorkoutsHeading(selectedDate, selectedDate === today)}
                    </h3>
                    {daySnapshot.loading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-14 w-full rounded-lg" />
                        <Skeleton className="h-14 w-full rounded-lg" />
                      </div>
                    ) : workouts.length > 0 ? (
                      <div className="space-y-2.5">
                        {workouts.map((workout: any) => (
                          <div key={workout.id} className="rounded-lg border border-border bg-surface-elevated p-3.5">
                            <div className="flex items-center justify-between gap-2">
                              <p className="min-w-0 flex-1 break-words pr-1 text-sm font-semibold text-text-primary">
                                {workout.title}
                              </p>
                              <div className="flex shrink-0 items-center gap-2">
                                <span className="text-xs uppercase tracking-[0.12em] text-text-muted">
                                  {workout.intensity.toLowerCase()}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setEditWorkoutId(workout.id)}
                                  disabled={deletingWorkout || savingWorkoutEdits}
                                  className="inline-flex items-center justify-center rounded-md border border-border px-2 py-1 text-xs text-text-secondary transition-colors hover:border-info-400/40 hover:text-info-400"
                                  title={w.editWorkoutTitle}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteWorkoutId(workout.id)}
                                  disabled={deletingWorkout || savingWorkoutEdits}
                                  className="inline-flex items-center justify-center rounded-md border border-border px-2 py-1 text-xs text-text-secondary transition-colors hover:border-red-400/40 hover:text-red-400"
                                  title={w.deleteWorkoutTitle}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                            <p className="mt-1 text-xs text-text-secondary">
                              {workout.durationMinutes} min • {workout.caloriesBurned} kcal burned
                            </p>
                            {workout.notes ? <p className="mt-2 text-sm text-text-secondary">{workout.notes}</p> : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-text-secondary">{w.noWorkoutsLine(selectedDate, selectedDate === today)}</p>
                    )}

                    <div className="border-t border-border/80 pt-4 space-y-2">
                      <p className="text-sm font-medium text-text-primary">{w.dailyStepsTitle}</p>
                      <p className="text-xs text-text-secondary leading-relaxed">{w.dailyStepsDescription}</p>
                      <div className="flex flex-wrap items-end gap-2 pt-1">
                        <label className="block min-w-[10rem] flex-1">
                          <span className="text-xs text-text-muted">{w.dailyStepsLabel}</span>
                          <NumericInput
                            min={0}
                            max={120000}
                            step={1}
                            value={stepsDraft}
                            onChange={(e) => setStepsDraft(e.target.value)}
                            className="mt-1 w-full tabular-nums"
                            aria-label={w.dailyStepsLabel}
                          />
                        </label>
                        <button
                          type="button"
                          className="btn-secondary shrink-0 h-10 px-3"
                          disabled={savingSteps || daySnapshot.loading}
                          onClick={() => void handleSaveSteps()}
                        >
                          {savingSteps ? <ButtonSpinner /> : w.dailyStepsSave}
                        </button>
                      </div>
                      <p className="text-[11px] text-text-muted leading-snug">
                        {w.dailyStepsHint(Math.round(Number(daySnapshot.activity?.steps ?? daySnapshot.stats?.steps ?? 0)))}
                      </p>
                    </div>

                    <div className="border-t border-border/80 pt-4 space-y-2">
                      <p className="text-sm font-medium text-text-primary">{w.activityBonusTitle}</p>
                      <p className="text-xs text-text-secondary leading-relaxed">{w.activityBonusDescription}</p>
                      <div className="flex flex-wrap items-end gap-2 pt-1">
                        <label className="block min-w-[10rem] flex-1">
                          <span className="text-xs text-text-muted">{w.activityBonusLabel}</span>
                          <NumericInput
                            min={0}
                            max={1500}
                            step={25}
                            value={activityBonusDraft}
                            onChange={(e) => setActivityBonusDraft(e.target.value)}
                            className="mt-1 w-full tabular-nums"
                            aria-label={w.activityBonusLabel}
                          />
                        </label>
                        <button
                          type="button"
                          className="btn-secondary shrink-0 h-10 px-3"
                          disabled={savingActivityBonus || daySnapshot.loading}
                          onClick={() => void handleSaveActivityBonus()}
                        >
                          {savingActivityBonus ? <ButtonSpinner /> : w.activityBonusSave}
                        </button>
                      </div>
                      <p className="text-[11px] text-text-muted leading-snug">{w.activityBudgetHint}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </section>

            <section
              id="log-workout"
              className={clsx(
                'scroll-mt-6 min-w-0 rounded-xl border border-border bg-surface p-4 md:p-5 shadow-sm shadow-black/5',
                accentEdgeClasses('info', 'left'),
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <AISectionHeader
                    eyebrow={w.eyebrow}
                    title={w.logTitle}
                    subtitle={w.logSubtitle}
                    rightAction={
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10">
                        <Dumbbell className="h-5 w-5 text-amber-400 stroke-[1.9]" />
                      </div>
                    }
                  />
                </div>
                <button
                  type="button"
                  className="btn-ghost mt-0.5 h-9 w-9 shrink-0 rounded-lg border border-border/80 px-0"
                  aria-expanded={logPanelOpen}
                  aria-controls="log-workout-panel"
                  onClick={() => setLogPanelOpen((v) => !v)}
                >
                  <ChevronDown
                    className={clsx('mx-auto h-4 w-4 transition-transform duration-200', logPanelOpen && 'rotate-180')}
                  />
                  <span className="sr-only">{logPanelOpen ? w.collapseLogWorkout : w.expandLogWorkout}</span>
                </button>
              </div>
              {logPanelOpen ? (
                <div id="log-workout-panel" className="space-y-4">
                  {lastWorkout ? (
                    <EvoHintCard
                      title={w.repeatLastTitle}
                      tone="notice"
                      content={w.repeatLastContent(
                        String(lastWorkout.title || ''),
                        lastWorkout.durationMinutes,
                        lastWorkout.caloriesBurned
                      )}
                      action={
                        <button
                          type="button"
                          className="btn-secondary w-full"
                          onClick={() => {
                            setTitle(String(lastWorkout.title || ''));
                            setDurationMinutes(Number(lastWorkout.durationMinutes || 45));
                            setCaloriesBurned(Number(lastWorkout.caloriesBurned || 300));
                            setIntensity(String(lastWorkout.intensity || 'MEDIUM').toUpperCase() as WorkoutIntensity);
                          }}
                        >
                          {w.useAsTemplate}
                        </button>
                      }
                    />
                  ) : null}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2 rounded-lg border border-border bg-surface-elevated p-3.5">
                <label htmlFor="workouts-date" className="block text-sm font-medium text-text-primary">
                  {w.dayLabel}
                  <span className="text-text-muted font-normal">{w.dayOptional}</span>
                </label>
                <input
                  id="workouts-date"
                  type="date"
                  value={selectedDate}
                  max={today}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="input-field w-full"
                />
                <p className="text-xs text-text-muted">{w.dayHint}</p>
              </div>

              <div className="rounded-lg border border-border bg-surface-elevated p-3.5">
                <p className="text-sm font-semibold text-text-primary mb-1">{w.importTitle}</p>
                <p className="text-xs text-text-secondary mb-3">{w.importSubtitle}</p>
                <div className="space-y-2.5">
                  <input
                    value={importNotes}
                    onChange={(event) => setImportNotes(event.target.value)}
                    className="input-field w-full"
                    placeholder={w.importNotesPlaceholder}
                  />
                  <label className="btn-secondary w-full cursor-pointer">
                    <input type="file" accept=".gpx,.tcx,.fit" className="hidden" onChange={handleImportWorkout} />
                    <span className="inline-flex items-center gap-2">
                      <FileUp className="h-4 w-4" />
                      {importingWorkoutFile ? w.importing : w.importFile}
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="workoutTitle" className="block text-sm font-medium text-text-primary mb-2">
                  {w.workoutTitle}
                </label>
                <input
                  id="workoutTitle"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="input-field w-full"
                  placeholder={w.titlePlaceholder}
                />
              </div>
              <SmartSuggestionChips
                title={w.chipsTitle}
                suggestions={workoutTemplates}
                onSelect={(value) => {
                  const [name, durationPart, intensityPart] = value.split('·').map((chunk) => chunk.trim());
                  setTitle(name);
                  const parsedDuration = Number(durationPart?.replace(/[^\d]/g, '') || 45);
                  setDurationMinutes(parsedDuration);
                  if (intensityPart?.toLowerCase().includes('high')) setIntensity('HIGH');
                  if (intensityPart?.toLowerCase().includes('medium')) setIntensity('MEDIUM');
                  if (intensityPart?.toLowerCase().includes('low')) setIntensity('LOW');
                }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="durationMinutes" className="block text-sm font-medium text-text-primary mb-2">
                    {w.duration}
                  </label>
                  <NumericInputNumber
                    id="durationMinutes"
                    min={1}
                    value={durationMinutes}
                    onValueChange={setDurationMinutes}
                    className="w-full"
                  />
                </div>
                <div>
                  <label htmlFor="caloriesBurned" className="block text-sm font-medium text-text-primary mb-2">
                    {w.kcalBurned}
                  </label>
                  <NumericInputNumber
                    id="caloriesBurned"
                    min={0}
                    value={caloriesBurned}
                    onValueChange={setCaloriesBurned}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="intensity" className="block text-sm font-medium text-text-primary mb-2">
                  {w.intensity}
                </label>
                <select
                  id="intensity"
                  value={intensity}
                  onChange={(event) => setIntensity(event.target.value as WorkoutIntensity)}
                  className="input-field w-full"
                >
                  <option value="LOW">{w.intensityLow}</option>
                  <option value="MEDIUM">{w.intensityMedium}</option>
                  <option value="HIGH">{w.intensityHigh}</option>
                </select>
              </div>

              <div>
                <label htmlFor="workoutNotes" className="block text-sm font-medium text-text-primary mb-2">
                  {w.sessionNotes}
                </label>
                <textarea
                  id="workoutNotes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="input-field w-full min-h-24 resize-y"
                  placeholder={w.notesPlaceholder}
                />
              </div>

              <button type="submit" disabled={loggingWorkout} className="btn-primary w-full inline-flex items-center justify-center gap-2">
                {loggingWorkout ? (
                  <>
                    <ButtonSpinner />
                    {w.savingEvaluating}
                  </>
                ) : (
                  w.saveAndSync
                )}
              </button>
                  </form>
                </div>
              ) : null}
            </section>
          </div>

          <div className="min-w-0">
            <WeeklyWorkoutsTrainingSection weekEndDate={weeklyStatsEndDate} />
          </div>
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
