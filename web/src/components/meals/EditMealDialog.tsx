'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { ButtonSpinner } from '@/components/ui/loading';
import { NumericInputNumber } from '@/components/ui/atoms/NumericInput';

export type EditableFoodItemPayload = {
  id: string;
  name: string;
  description?: string | null;
  mealType: string;
  imageUrl?: string | null;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    confidence?: number | null;
  };
};

type Copy = {
  editMealTitle: string;
  saveMealChanges: string;
  cancelEdit: string;
  mealType: string;
  mealNameLabel: string;
  mealDescription: string;
  editConfidenceLabel: string;
};

type EditMealDialogProps = {
  open: boolean;
  meal: EditableFoodItemPayload | null;
  onClose: () => void;
  saving: boolean;
  copy: Copy;
  mealOptions: { value: string; label: string }[];
  onSave: (input: {
    id: string;
    name: string;
    description: string | null;
    mealType: string;
    nutrition: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      confidence: number;
    };
  }) => Promise<void>;
};

export default function EditMealDialog({
  open,
  meal,
  onClose,
  saving,
  copy,
  mealOptions,
  onSave,
}: EditMealDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mealType, setMealType] = useState('lunch');
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [confidence, setConfidence] = useState(0.65);

  useEffect(() => {
    if (!open || !meal) return;
    setName(meal.name);
    setDescription(meal.description?.trim() || '');
    setMealType((meal.mealType || 'lunch').toLowerCase());
    setCalories(Math.round(Number(meal.nutrition.calories) || 0));
    setProtein(Number(meal.nutrition.protein) || 0);
    setCarbs(Number(meal.nutrition.carbs) || 0);
    setFat(Number(meal.nutrition.fat) || 0);
    const c = meal.nutrition.confidence;
    setConfidence(
      typeof c === 'number' && Number.isFinite(c) ? Math.min(1, Math.max(0, c)) : 0.65
    );
  }, [open, meal?.id, meal]);

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined' || !meal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = name.trim();
    if (!t) return;
    try {
      await onSave({
        id: meal.id,
        name: t,
        description: description.trim() || null,
        mealType,
        nutrition: {
          calories,
          protein,
          carbs,
          fat,
          confidence: Math.min(1, Math.max(0, confidence)),
        },
      });
      onClose();
    } catch {
      /* errors surfaced by parent mutation */
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="presentation">
      <button type="button" className="absolute inset-0 bg-black/60" aria-label={copy.cancelEdit} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-meal-title"
        className="relative w-full max-w-lg max-h-[min(90vh,800px)] overflow-y-auto rounded-xl border border-border bg-surface p-5 shadow-xl"
      >
        <h2 id="edit-meal-title" className="text-base font-semibold tracking-tight text-text-primary">
          {copy.editMealTitle}
        </h2>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
          <div>
            <label htmlFor="edit-meal-name" className="block text-sm font-medium text-text-primary mb-2">
              {copy.mealNameLabel}
            </label>
            <input
              id="edit-meal-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field w-full"
              required
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor="edit-meal-type" className="block text-sm font-medium text-text-primary mb-2">
              {copy.mealType}
            </label>
            <select
              id="edit-meal-type"
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="input-field w-full"
            >
              {mealOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="edit-meal-description" className="block text-sm font-medium text-text-primary mb-2">
              {copy.mealDescription}
            </label>
            <textarea
              id="edit-meal-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field w-full min-h-20 resize-y"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <span className="block text-[11px] font-medium text-text-muted mb-1">kcal</span>
              <NumericInputNumber min={0} value={calories} onValueChange={(v) => setCalories(v)} className="w-full" />
            </div>
            <div>
              <span className="block text-[11px] font-medium text-text-muted mb-1">P (g)</span>
              <NumericInputNumber
                min={0}
                step={0.1}
                value={protein}
                onValueChange={(v) => setProtein(v)}
                className="w-full"
              />
            </div>
            <div>
              <span className="block text-[11px] font-medium text-text-muted mb-1">C (g)</span>
              <NumericInputNumber min={0} step={0.1} value={carbs} onValueChange={(v) => setCarbs(v)} className="w-full" />
            </div>
            <div>
              <span className="block text-[11px] font-medium text-text-muted mb-1">F (g)</span>
              <NumericInputNumber min={0} step={0.1} value={fat} onValueChange={(v) => setFat(v)} className="w-full" />
            </div>
          </div>

          <div>
            <label htmlFor="edit-meal-confidence" className="block text-sm font-medium text-text-primary mb-2">
              {copy.editConfidenceLabel}
            </label>
            <NumericInputNumber
              id="edit-meal-confidence"
              min={0}
              max={1}
              step={0.01}
              value={confidence}
              onValueChange={(v) => setConfidence(Math.min(1, Math.max(0, v)))}
              className="w-full"
            />
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={saving} className="btn-secondary w-full sm:w-auto">
              {copy.cancelEdit}
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className={clsx('btn-primary w-full inline-flex items-center justify-center gap-2 sm:w-auto')}
            >
              {saving ? (
                <>
                  <ButtonSpinner />
                  {copy.saveMealChanges}
                </>
              ) : (
                copy.saveMealChanges
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
