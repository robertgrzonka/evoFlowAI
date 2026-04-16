'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
import { Camera, ImagePlus, Trash2 } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { ButtonSpinner, ListRowSkeleton, PageLoader } from '@/components/ui/loading';
import PageTopBar from '@/components/ui/molecules/PageTopBar';
import { DAILY_STATS_QUERY } from '@/lib/graphql/queries';
import { DELETE_FOOD_ITEM_MUTATION, LOG_MEAL_WITH_AI_MUTATION } from '@/lib/graphql/mutations';
import { appToast } from '@/lib/app-toast';
import ChatMarkdown from '@/components/ChatMarkdown';
import { buildDayRefetchQueries } from '@/lib/day-data';
import {
  AISectionHeader,
  EvoHintCard,
  InsightEmptyState,
  SmartSuggestionChips,
} from '@/components/evo';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
type MealEntry = {
  id: string;
  name: string;
  mealType: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
};

const mealOptions: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function MealsPage() {
  const router = useRouter();
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [content, setContent] = useState('');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [imageBase64, setImageBase64] = useState('');
  const [imageMimeType, setImageMimeType] = useState('image/jpeg');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [readingImage, setReadingImage] = useState(false);
  const [lastInsight, setLastInsight] = useState('');
  const [pendingReview, setPendingReview] = useState(false);

  const { data, loading, refetch } = useQuery(DAILY_STATS_QUERY, {
    variables: { date: today },
    fetchPolicy: 'cache-and-network',
  });

  const [logMealWithAI, { loading: savingMeal }] = useMutation(LOG_MEAL_WITH_AI_MUTATION, {
    onCompleted: async (result) => {
      setContent('');
      setImageBase64('');
      setImagePreview(null);
      setPendingReview(false);
      const message = String(result?.logMealWithAI?.message?.content || '').trim();
      if (message) {
        setLastInsight(message);
      }
      await refetch({ date: today });
      appToast.success('Meal saved', 'Meal entry was added to your day.');
    },
    onError: (error) => {
      appToast.error('Save failed', error.message || 'Could not save meal.');
    },
    refetchQueries: buildDayRefetchQueries(today),
    awaitRefetchQueries: true,
  });

  const [deleteFoodItem, { loading: deletingMeal }] = useMutation(DELETE_FOOD_ITEM_MUTATION, {
    onError: (error) => {
      appToast.error('Delete failed', error.message || 'Could not delete meal.');
    },
    refetchQueries: buildDayRefetchQueries(today),
  });

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      appToast.info('Invalid file', 'Please select an image file.');
      return;
    }

    try {
      setReadingImage(true);
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const [meta, payload] = base64.split(',');
      if (!payload) {
        appToast.error('Image read failed', 'Failed to read image.');
        return;
      }

      const mime = meta.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
      setImageBase64(payload);
      setImageMimeType(mime);
      setImagePreview(base64);
    } finally {
      setReadingImage(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!content.trim() && !imageBase64) {
      appToast.info('Missing meal input', 'Add a meal description or upload an image.');
      return;
    }

    if (!pendingReview) {
      setPendingReview(true);
      return;
    }

    await logMealWithAI({
      variables: {
        input: {
          content: content.trim() || null,
          imageBase64: imageBase64 || null,
          imageMimeType: imageBase64 ? imageMimeType : null,
          mealType,
        },
      },
    });
  };

  const handleDeleteMeal = async (mealId: string) => {
    const confirmed = window.confirm('Delete this meal entry?');
    if (!confirmed) return;
    const result = await deleteFoodItem({ variables: { id: mealId } });
    if (result.data?.deleteFoodItem) {
      appToast.success('Meal deleted', 'Entry removed from your day.');
    }
  };

  if (loading && !data) {
    return <PageLoader />;
  }

  const meals: MealEntry[] = data?.dailyStats?.meals || [];
  const mealSuggestionChips = [
    { id: 'meal-chip-1', label: 'Chicken + rice + vegetables (post-workout meal)' },
    { id: 'meal-chip-2', label: 'Skyr + berries + oats (quick high-protein snack)' },
    { id: 'meal-chip-3', label: 'Egg omelette + toast + salad (balanced breakfast)' },
  ];

  return (
    <AppShell>
      <div className="space-y-5">
        <PageTopBar
          rightContent={
            <button onClick={() => router.push('/chat?channel=COACH')} className="btn-secondary">
              Open Evo chat
            </button>
          }
        />

        <h1 className="text-xl font-semibold tracking-tight text-text-primary">Meals</h1>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <section className="xl:col-span-5 bg-surface border border-border rounded-xl p-4 md:p-5">
            <AISectionHeader
              eyebrow="Meal flow"
              title="Log meal"
              subtitle="Describe or upload. Evo will analyze, then you can save with confidence."
            />
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="mealType" className="block text-sm font-medium text-text-primary mb-2">
                  Meal type
                </label>
                <select
                  id="mealType"
                  value={mealType}
                  onChange={(event) => setMealType(event.target.value as MealType)}
                  className="input-field w-full"
                >
                  {mealOptions.map((option) => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="mealDescription" className="block text-sm font-medium text-text-primary mb-2">
                  Meal description
                </label>
                <textarea
                  id="mealDescription"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Example: grilled chicken with rice and salad, around 350g total"
                  className="input-field w-full min-h-28 resize-y"
                />
              </div>

              <SmartSuggestionChips
                title="Quick input ideas"
                suggestions={mealSuggestionChips}
                onSelect={(value) => setContent(value)}
              />

              <div>
                <label htmlFor="imageUpload" className="block text-sm font-medium text-text-primary mb-2">
                  Upload meal image
                </label>
                <label className="w-full border border-dashed border-border rounded-lg p-3.5 flex items-center justify-center gap-2 text-text-secondary hover:text-text-primary cursor-pointer transition-colors duration-150 ease-out">
                  <ImagePlus className="h-4 w-4 stroke-[1.9]" />
                  <span>Choose image</span>
                  <input id="imageUpload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>

                {readingImage ? (
                  <div className="mt-3 h-36 w-full rounded-lg border border-border bg-surface-elevated animate-pulse" />
                ) : imagePreview ? (
                  <img src={imagePreview} alt="Meal preview" className="mt-3 h-36 w-full object-cover rounded-lg border border-border" />
                ) : (
                  <div className="mt-3 h-20 w-full rounded-lg border border-border bg-surface-elevated flex items-center justify-center text-xs text-text-muted">
                    Image preview appears here
                  </div>
                )}
              </div>

              {pendingReview ? (
                <EvoHintCard
                  title="Ready to analyze?"
                  tone="notice"
                  content="Quick review: if description and meal type look right, save. If not, edit before sending."
                  action={
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setPendingReview(false)}
                      >
                        Edit details
                      </button>
                      <button
                        type="submit"
                        disabled={savingMeal}
                        className="btn-primary"
                      >
                        Confirm & analyze
                      </button>
                    </div>
                  }
                />
              ) : null}

              <button type="submit" disabled={savingMeal} className="btn-primary w-full inline-flex items-center justify-center gap-2">
                {savingMeal ? (
                  <>
                    <ButtonSpinner />
                    Evo is analyzing your meal...
                  </>
                ) : (
                  pendingReview ? 'Analyze now' : 'Review before save'
                )}
              </button>
            </form>
          </section>

          <section className="xl:col-span-7 bg-surface border border-border rounded-xl p-4 md:p-5 space-y-4">
            <h2 className="text-lg font-semibold tracking-tight text-text-primary">Today meals</h2>

            {lastInsight ? (
              <div className="rounded-lg border border-border bg-surface-elevated p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-text-muted mb-2">Latest Evo analysis</p>
                <ChatMarkdown content={lastInsight} />
              </div>
            ) : null}

            {loading && !data ? (
              <div className="space-y-3">
                <ListRowSkeleton />
                <ListRowSkeleton />
              </div>
            ) : meals.length > 0 ? (
              <div className="space-y-3">
                {meals.map((meal) => (
                  <div key={meal.id} className="relative flex items-center justify-between p-3.5 pr-12 bg-surface-elevated rounded-lg border border-border">
                    <button
                      type="button"
                      onClick={() => handleDeleteMeal(meal.id)}
                      disabled={deletingMeal}
                      className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-secondary hover:text-red-400 hover:border-red-400/40 transition-colors"
                      title="Delete meal"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <div>
                      <h4 className="font-semibold text-text-primary">{meal.name}</h4>
                      <p className="text-sm text-text-secondary capitalize">{meal.mealType.toLowerCase()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-text-primary">{meal.nutrition.calories.toFixed(0)} kcal</p>
                      <p className="text-sm text-text-secondary">
                        P: {meal.nutrition.protein.toFixed(0)}g • C: {meal.nutrition.carbs.toFixed(0)}g • F: {meal.nutrition.fat.toFixed(0)}g
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <InsightEmptyState
                title="No meals logged yet"
                description="Start with one meal entry. Evo will begin spotting patterns and giving smarter suggestions."
                actionLabel="Open coach chat"
                onAction={() => router.push('/chat?channel=COACH')}
              />
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
