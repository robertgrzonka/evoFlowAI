'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
import { clsx } from 'clsx';
import { ChevronDown, ImagePlus, Trash2 } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { ButtonSpinner, ListRowSkeleton, PageLoader } from '@/components/ui/loading';
import PageTopBar from '@/components/ui/molecules/PageTopBar';
import { DAILY_STATS_QUERY, WEEKLY_MEALS_COACH_QUERY, WEEKLY_MEALS_NUTRITION_QUERY } from '@/lib/graphql/queries';
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
import WeeklyMealsNutritionSection from '@/components/meals/WeeklyMealsNutritionSection';
import { useAppUiLocale } from '@/lib/i18n/use-app-ui-locale';
import { mealTypeLabels, mealsPageCopy } from '@/lib/i18n/copy/meals-page';

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
  const locale = useAppUiLocale();
  const m = mealsPageCopy[locale];
  const mealTypes = mealTypeLabels[locale];
  const router = useRouter();
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [content, setContent] = useState('');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [imageBase64, setImageBase64] = useState('');
  const [imageMimeType, setImageMimeType] = useState('image/jpeg');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [readingImage, setReadingImage] = useState(false);
  const [lastInsight, setLastInsight] = useState('');
  const [pendingReview, setPendingReview] = useState(false);
  const [todayListOpen, setTodayListOpen] = useState(true);
  const [addMealOpen, setAddMealOpen] = useState(true);

  const { data, loading, refetch } = useQuery(DAILY_STATS_QUERY, {
    variables: { date: selectedDate },
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
      await refetch({ date: selectedDate });
      appToast.success('Meal saved', 'Meal entry was added to your day.');
    },
    onError: (error) => {
      appToast.error('Save failed', error.message || 'Could not save meal.');
    },
    refetchQueries: [
      ...buildDayRefetchQueries(selectedDate),
      { query: WEEKLY_MEALS_NUTRITION_QUERY, variables: { endDate: today } },
      { query: WEEKLY_MEALS_COACH_QUERY, variables: { endDate: today } },
    ],
    awaitRefetchQueries: true,
  });

  const [deleteFoodItem, { loading: deletingMeal }] = useMutation(DELETE_FOOD_ITEM_MUTATION, {
    onError: (error) => {
      appToast.error('Delete failed', error.message || 'Could not delete meal.');
    },
    refetchQueries: [
      ...buildDayRefetchQueries(selectedDate),
      { query: WEEKLY_MEALS_NUTRITION_QUERY, variables: { endDate: today } },
      { query: WEEKLY_MEALS_COACH_QUERY, variables: { endDate: today } },
    ],
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
          loggedDate: selectedDate,
        },
      },
    });
  };

  const handleDeleteMeal = async (mealId: string) => {
    const confirmed = window.confirm(m.confirmDelete);
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
    { id: 'meal-chip-1', label: m.chip1 },
    { id: 'meal-chip-2', label: m.chip2 },
    { id: 'meal-chip-3', label: m.chip3 },
  ];

  return (
    <AppShell>
      <div className="space-y-5">
        <PageTopBar
          rightContent={
            <button onClick={() => router.push('/chat?channel=COACH')} className="btn-secondary">
              {m.openEvoChat}
            </button>
          }
        />

        <h1 className="text-xl font-semibold tracking-tight text-text-primary">{m.pageTitle}</h1>
        <p className="text-sm text-text-secondary max-w-3xl leading-relaxed">{m.pageIntro}</p>

        <div className="space-y-6 xl:space-y-8">
          <div className="grid gap-6 xl:gap-8 lg:grid-cols-2 items-start">
            <section className="bg-surface border border-border rounded-xl p-4 md:p-5 min-w-0">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-semibold tracking-tight text-text-primary min-w-0">
                  {m.mealsFor} {selectedDate}
                  {selectedDate === today ? m.todaySuffix : ''}
                </h2>
                <button
                  type="button"
                  className="btn-ghost h-9 w-9 shrink-0 rounded-lg border border-border/80 px-0"
                  aria-expanded={todayListOpen}
                  aria-controls="meals-today-panel"
                  onClick={() => setTodayListOpen((v) => !v)}
                >
                  <ChevronDown
                    className={clsx('mx-auto h-4 w-4 transition-transform duration-200', todayListOpen && 'rotate-180')}
                  />
                  <span className="sr-only">{todayListOpen ? m.collapseTodayList : m.expandTodayList}</span>
                </button>
              </div>
              {todayListOpen ? (
                <div id="meals-today-panel" className="space-y-4">
                  {lastInsight ? (
                    <div className="rounded-lg border border-border bg-surface-elevated p-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-text-muted mb-2">{m.latestAnalysis}</p>
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
                        <div
                          key={meal.id}
                          className="relative flex flex-col gap-2 p-3.5 pt-11 sm:flex-row sm:items-center sm:justify-between sm:pt-3.5 sm:pr-12 bg-surface-elevated rounded-lg border border-border"
                        >
                          <button
                            type="button"
                            onClick={() => handleDeleteMeal(meal.id)}
                            disabled={deletingMeal}
                            className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-secondary hover:text-red-400 hover:border-red-400/40 transition-colors"
                            title={m.deleteMealTitle}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <div className="min-w-0 flex-1 pr-1">
                            <h4 className="font-semibold text-text-primary break-words">{meal.name}</h4>
                            <p className="text-sm text-text-secondary capitalize">{meal.mealType.toLowerCase()}</p>
                          </div>
                          <div className="shrink-0 text-left sm:text-right">
                            <p className="font-semibold text-text-primary tabular-nums">{meal.nutrition.calories.toFixed(0)} kcal</p>
                            <p className="text-sm text-text-secondary tabular-nums">
                              P: {meal.nutrition.protein.toFixed(0)}g • C: {meal.nutrition.carbs.toFixed(0)}g • F:{' '}
                              {meal.nutrition.fat.toFixed(0)}g
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <InsightEmptyState
                      title={m.emptyTitle}
                      description={m.emptyDescription}
                      actionLabel={m.emptyAction}
                      onAction={() => router.push('/chat?channel=COACH')}
                    />
                  )}
                </div>
              ) : null}
            </section>

            <section id="add-meal" className="scroll-mt-6 bg-surface border border-border rounded-xl p-4 md:p-5 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <AISectionHeader eyebrow={m.eyebrow} title={m.logTitle} subtitle={m.logSubtitle} />
                </div>
                <button
                  type="button"
                  className="btn-ghost mt-0.5 h-9 w-9 shrink-0 rounded-lg border border-border/80 px-0"
                  aria-expanded={addMealOpen}
                  aria-controls="add-meal-panel"
                  onClick={() => setAddMealOpen((v) => !v)}
                >
                  <ChevronDown
                    className={clsx('mx-auto h-4 w-4 transition-transform duration-200', addMealOpen && 'rotate-180')}
                  />
                  <span className="sr-only">{addMealOpen ? m.collapseAddMeal : m.expandAddMeal}</span>
                </button>
              </div>
              {addMealOpen ? (
                <div id="add-meal-panel">
                  <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="rounded-lg border border-border bg-surface-elevated p-3.5 space-y-2">
                      <label htmlFor="meals-date" className="block text-sm font-medium text-text-primary">
                        {m.dayLabel}
                        <span className="text-text-muted font-normal">{m.dayOptional}</span>
                      </label>
                      <input
                        id="meals-date"
                        type="date"
                        value={selectedDate}
                        max={today}
                        onChange={(event) => setSelectedDate(event.target.value)}
                        className="input-field w-full"
                      />
                      <p className="text-xs text-text-muted">{m.dayHint}</p>
                    </div>

                    <div>
                      <label htmlFor="mealType" className="block text-sm font-medium text-text-primary mb-2">
                        {m.mealType}
                      </label>
                      <select
                        id="mealType"
                        value={mealType}
                        onChange={(event) => setMealType(event.target.value as MealType)}
                        className="input-field w-full"
                      >
                        {mealOptions.map((option) => (
                          <option key={option} value={option}>
                            {mealTypes[option] || option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="mealDescription" className="block text-sm font-medium text-text-primary mb-2">
                        {m.mealDescription}
                      </label>
                      <textarea
                        id="mealDescription"
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                        placeholder={m.mealPlaceholder}
                        className="input-field w-full min-h-28 resize-y"
                      />
                    </div>

                    <SmartSuggestionChips
                      title={m.chipsTitle}
                      suggestions={mealSuggestionChips}
                      onSelect={(value) => setContent(value)}
                    />

                    <div>
                      <label htmlFor="imageUpload" className="block text-sm font-medium text-text-primary mb-2">
                        {m.uploadImage}
                      </label>
                      <label className="w-full border border-dashed border-border rounded-lg p-3.5 flex items-center justify-center gap-2 text-text-secondary hover:text-text-primary cursor-pointer transition-colors duration-150 ease-out">
                        <ImagePlus className="h-4 w-4 stroke-[1.9]" />
                        <span>{m.chooseImage}</span>
                        <input id="imageUpload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                      </label>

                      {readingImage ? (
                        <div className="mt-3 h-36 w-full rounded-lg border border-border bg-surface-elevated animate-pulse" />
                      ) : imagePreview ? (
                        <img src={imagePreview} alt={m.previewAlt} className="mt-3 h-36 w-full object-cover rounded-lg border border-border" />
                      ) : (
                        <div className="mt-3 h-20 w-full rounded-lg border border-border bg-surface-elevated flex items-center justify-center text-xs text-text-muted">
                          {m.previewPlaceholder}
                        </div>
                      )}
                    </div>

                    {pendingReview ? (
                      <EvoHintCard
                        title={m.readyTitle}
                        tone="notice"
                        content={m.readyContent}
                        action={
                          <div className="grid grid-cols-2 gap-2">
                            <button type="button" className="btn-secondary" onClick={() => setPendingReview(false)}>
                              {m.editDetails}
                            </button>
                            <button type="submit" disabled={savingMeal} className="btn-primary">
                              {m.confirmAnalyze}
                            </button>
                          </div>
                        }
                      />
                    ) : null}

                    <button type="submit" disabled={savingMeal} className="btn-primary w-full inline-flex items-center justify-center gap-2">
                      {savingMeal ? (
                        <>
                          <ButtonSpinner />
                          {m.analyzing}
                        </>
                      ) : (
                        pendingReview ? m.analyzeNow : m.reviewBeforeSave
                      )}
                    </button>
                  </form>
                </div>
              ) : null}
            </section>
          </div>

          <div className="min-w-0">
            <WeeklyMealsNutritionSection weekEndDate={today} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
