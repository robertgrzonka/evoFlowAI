'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { ButtonSpinner } from '@/components/ui/loading';
import { NumericInputNumber } from '@/components/ui/atoms/NumericInput';

type WorkoutIntensity = 'LOW' | 'MEDIUM' | 'HIGH';

export type EditableWorkoutPayload = {
  id: string;
  title: string;
  notes?: string | null;
  durationMinutes: number;
  caloriesBurned: number;
  intensity: WorkoutIntensity | string;
  performedAt?: string | null;
};

function toDatetimeLocalValue(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type Copy = {
  editWorkoutTitle: string;
  saveWorkoutChanges: string;
  cancelEditWorkout: string;
  workoutTitle: string;
  titlePlaceholder: string;
  duration: string;
  kcalBurned: string;
  intensity: string;
  sessionNotes: string;
  notesPlaceholder: string;
  intensityLow: string;
  intensityMedium: string;
  intensityHigh: string;
  performedAtLabel: string;
};

type EditWorkoutDialogProps = {
  open: boolean;
  workout: EditableWorkoutPayload | null;
  onClose: () => void;
  saving: boolean;
  copy: Copy;
  onSave: (input: {
    id: string;
    title: string;
    notes: string | null;
    durationMinutes: number;
    caloriesBurned: number;
    intensity: WorkoutIntensity;
    performedAt: string;
  }) => Promise<void>;
};

export default function EditWorkoutDialog({
  open,
  workout,
  onClose,
  saving,
  copy,
  onSave,
}: EditWorkoutDialogProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [intensity, setIntensity] = useState<WorkoutIntensity>('MEDIUM');
  const [performedAtLocal, setPerformedAtLocal] = useState('');

  useEffect(() => {
    if (!open || !workout) return;
    setTitle(workout.title || '');
    setNotes(workout.notes?.trim() || '');
    setDurationMinutes(Number(workout.durationMinutes) || 1);
    setCaloriesBurned(Number(workout.caloriesBurned) || 0);
    const int = String(workout.intensity || 'MEDIUM').toUpperCase();
    setIntensity(int === 'HIGH' || int === 'LOW' ? int : 'MEDIUM');
    setPerformedAtLocal(toDatetimeLocalValue(workout.performedAt));
  }, [open, workout?.id, workout]);

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined' || !workout) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    const performedAt =
      performedAtLocal.trim().length > 0
        ? new Date(performedAtLocal).toISOString()
        : new Date().toISOString();
    try {
      await onSave({
        id: workout.id,
        title: t,
        notes: notes.trim() || null,
        durationMinutes: Math.max(1, Math.round(durationMinutes)),
        caloriesBurned: Math.max(0, Math.round(caloriesBurned)),
        intensity,
        performedAt,
      });
      onClose();
    } catch {
      /* parent handles toast */
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label={copy.cancelEditWorkout}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-labelledby="edit-workout-title"
        className="relative w-full max-w-lg max-h-[min(90vh,800px)] overflow-y-auto rounded-xl border border-border bg-surface p-5 shadow-xl"
      >
        <h2 id="edit-workout-title" className="text-base font-semibold tracking-tight text-text-primary">
          {copy.editWorkoutTitle}
        </h2>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
          <div>
            <label htmlFor="edit-w-title" className="block text-sm font-medium text-text-primary mb-2">
              {copy.workoutTitle}
            </label>
            <input
              id="edit-w-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field w-full"
              placeholder={copy.titlePlaceholder}
              required
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor="edit-w-performed" className="block text-sm font-medium text-text-primary mb-2">
              {copy.performedAtLabel}
            </label>
            <input
              id="edit-w-performed"
              type="datetime-local"
              value={performedAtLocal}
              onChange={(e) => setPerformedAtLocal(e.target.value)}
              className="input-field w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-w-duration" className="block text-sm font-medium text-text-primary mb-2">
                {copy.duration}
              </label>
              <NumericInputNumber
                id="edit-w-duration"
                min={1}
                value={durationMinutes}
                onValueChange={setDurationMinutes}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="edit-w-kcal" className="block text-sm font-medium text-text-primary mb-2">
                {copy.kcalBurned}
              </label>
              <NumericInputNumber
                id="edit-w-kcal"
                min={0}
                value={caloriesBurned}
                onValueChange={setCaloriesBurned}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-w-intensity" className="block text-sm font-medium text-text-primary mb-2">
              {copy.intensity}
            </label>
            <select
              id="edit-w-intensity"
              value={intensity}
              onChange={(e) => setIntensity(e.target.value as WorkoutIntensity)}
              className="input-field w-full"
            >
              <option value="LOW">{copy.intensityLow}</option>
              <option value="MEDIUM">{copy.intensityMedium}</option>
              <option value="HIGH">{copy.intensityHigh}</option>
            </select>
          </div>

          <div>
            <label htmlFor="edit-w-notes" className="block text-sm font-medium text-text-primary mb-2">
              {copy.sessionNotes}
            </label>
            <textarea
              id="edit-w-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field w-full min-h-20 resize-y"
              placeholder={copy.notesPlaceholder}
            />
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={saving} className="btn-secondary w-full sm:w-auto">
              {copy.cancelEditWorkout}
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className={clsx('btn-primary w-full inline-flex items-center justify-center gap-2 sm:w-auto')}
            >
              {saving ? (
                <>
                  <ButtonSpinner />
                  {copy.saveWorkoutChanges}
                </>
              ) : (
                copy.saveWorkoutChanges
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
