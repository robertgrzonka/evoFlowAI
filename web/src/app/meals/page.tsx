'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import { clsx } from 'clsx';
import { ChevronDown, ImagePlus } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { ButtonSpinner, ListRowSkeleton, PageLoader } from '@/components/ui/loading';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { getDestructiveConfirmLabels } from '@/lib/i18n/destructive-confirm';
import PageTopBar from '@/components/ui/molecules/PageTopBar';
import { DAILY_STATS_QUERY } from '@/lib/graphql/queries';
import { DELETE_FOOD_ITEM_MUTATION, LOG_MEAL_WITH_AI_MUTATION, UPDATE_FOOD_ITEM_MUTATION } from '@/lib/graphql/mutations';
import { appToast } from '@/lib/app-toast';
import ChatMarkdown from '@/components/ChatMarkdown';
import { buildDayRefetchQueriesAfterLog, kickDeferredAfterMealLog } from '@/lib/day-data';
import {
  AiTransparencyNotice,
  AISectionHeader,
  EvoThinkingOverlay,
  InsightEmptyState,
  SmartSuggestionChips,
} from '@/components/evo';
import WeeklyMealsNutritionSection from '@/components/meals/WeeklyMealsNutritionSection';
import { accentEdgeClasses } from '@/components/ui/accent-cards';
import { addDaysToDateKey } from '@/lib/calendar-date-key';
import { useClientCalendarToday } from '@/hooks/useClientCalendarToday';
import { useAppUiLocale } from '@/lib/i18n/use-app-ui-locale';
import { mealTypeLabels, mealsPageCopy } from '@/lib/i18n/copy/meals-page';
import { getAiTransparencyStrings } from '@/lib/i18n/copy/ai-transparency';
import EditMealDialog from '@/components/meals/EditMealDialog';
import { MealMacroConfidenceBlock } from '@/components/meals/MealMacroConfidenceBlock';
import { MealTimeline, type MealTimelineItem } from '@/components/dashboard';
import { getDashboardStrings } from '@/lib/i18n/copy/dashboard';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
type MealEntry = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl: string;
  mealType: string;
  createdAt?: string | null;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    confidence: number;
  };
};

const mealOptions: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function MealsPage() {
  const client = useApolloClient();
  const locale = useAppUiLocale();
  const m = mealsPageCopy[locale];
  const aiTransparency = getAiTransparencyStrings(locale);
  const mealTypes = mealTypeLabels[locale];
  const router = useRouter();
  const { dateKey: today, timeZone } = useClientCalendarToday();
  /** Weekly strip: 7 completed days ending yesterday (today still in progress). */
  const weeklyStatsEndDate = useMemo(() => addDaysToDateKey(today, -1), [today]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [content, setContent] = useState('');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [imageBase64, setImageBase64] = useState('');
  const [imageMimeType, setImageMimeType] = useState('image/jpeg');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [readingImage, setReadingImage] = useState(false);
  const [lastInsight, setLastInsight] = useState('');
  const [todayListOpen, setTodayListOpen] = useState(true);
  const [deleteMealId, setDeleteMealId] = useState<string | null>(null);
  const [mealToEdit, setMealToEdit] = useState<MealEntry | null>(null);
  const [addMealOpen, setAddMealOpen] = useState(true);

  const { data, loading } = useQuery(DAILY_STATS_QUERY, {
    variables: { date: selectedDate, clientTimeZone: timeZone },
    fetchPolicy: 'cache-and-network',
  });

  const [logMealWithAI, { loading: savingMeal }] = useMutation(LOG_MEAL_WITH_AI_MUTATION, {
    onCompleted: (result) => {
      setContent('');
      setImageBase64('');
      setImagePreview(null);
      const message = String(result?.logMealWithAI?.message?.content || '').trim();
      if (message) {
        setLastInsight(message);
      }
      kickDeferredAfterMealLog(client);
      appToast.success(m.toastMealSavedTitle, m.toastMealSavedBody);
    },
    onError: (error) => {
      appToast.error(m.toastSaveFailTitle, error.message || m.toastSaveFailBody);
    },
    refetchQueries: [...buildDayRefetchQueriesAfterLog(selectedDate, timeZone)],
    awaitRefetchQueries: true,
  });

  const [deleteFoodItem, { loading: deletingMeal }] = useMutation(DELETE_FOOD_ITEM_MUTATION, {
    onCompleted: () => {
      kickDeferredAfterMealLog(client);
    },
    onError: (error) => {
      appToast.error(m.toastDeleteFailTitle, error.message || m.toastDeleteFailBody);
    },
    refetchQueries: [...buildDayRefetchQueriesAfterLog(selectedDate, timeZone)],
    awaitRefetchQueries: true,
  });

  const [updateFoodItem, { loading: updatingMeal }] = useMutation(UPDATE_FOOD_ITEM_MUTATION, {
    onCompleted: () => {
      kickDeferredAfterMealLog(client);
      appToast.success(m.toastMealUpdatedTitle, m.toastMealUpdatedBody);
    },
    onError: (error) => {
      appToast.error(m.toastSaveFailTitle, error.message || m.toastSaveFailBody);
    },
    refetchQueries: [...buildDayRefetchQueriesAfterLog(selectedDate, timeZone)],
    awaitRefetchQueries: true,
  });

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      appToast.info(m.toastInvalidFileTitle, m.toastInvalidFileBody);
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
        appToast.error(m.toastImageReadTitle, m.toastImageReadBody);
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
      appToast.info(m.toastMissingInputTitle, m.toastMissingInputBody);
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
          clientTimeZone: timeZone,
        },
      },
    });
  };

  const handleConfirmDeleteMeal = async () => {
    if (!deleteMealId) return;
    const id = deleteMealId;
    setDeleteMealId(null);
    const result = await deleteFoodItem({ variables: { id } });
    if (result.data?.deleteFoodItem) {
      appToast.success('Meal deleted', 'Entry removed from your day.');
    }
  };

  if (loading && !data) {
    return <PageLoader />;
  }

  const meals: MealEntry[] = data?.dailyStats?.meals || [];
  const delLabels = getDestructiveConfirmLabels(locale);
  const mealTimelineUi = getDashboardStrings(locale);
  const mealTimelineItems: MealTimelineItem[] = meals.map((meal) => ({
    id: meal.id,
    name: meal.name,
    description: meal.description ?? undefined,
    imageUrl: meal.imageUrl ?? undefined,
    mealType: meal.mealType,
    createdAt: meal.createdAt ?? null,
    nutrition: {
      calories: Number(meal.nutrition?.calories ?? 0),
      protein: Number(meal.nutrition?.protein ?? 0),
      carbs: Number(meal.nutrition?.carbs ?? 0),
      fat: Number(meal.nutrition?.fat ?? 0),
      confidence:
        typeof meal.nutrition?.confidence === 'number' ? meal.nutrition.confidence : undefined,
    },
  }));

  const mealSuggestionChips = [
    { id: 'meal-chip-1', label: m.chip1 },
    { id: 'meal-chip-2', label: m.chip2 },
    { id: 'meal-chip-3', label: m.chip3 },
  ];

  const mealEditOptions = mealOptions.map((o) => ({
    value: o,
    label: mealTypes[o] || o,
  }));

  const handleSaveMealEdit = async (input: {
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
  }) => {
    await updateFoodItem({
      variables: {
        input: {
          id: input.id,
          name: input.name,
          description: input.description,
          mealType: input.mealType,
          nutrition: {
            calories: input.nutrition.calories,
            protein: input.nutrition.protein,
            carbs: input.nutrition.carbs,
            fat: input.nutrition.fat,
            confidence: input.nutrition.confidence,
          },
        },
      },
    });
  };

  return (
    <AppShell>
      <EditMealDialog
        open={mealToEdit !== null}
        meal={mealToEdit}
        onClose={() => setMealToEdit(null)}
        saving={updatingMeal}
        mealOptions={mealEditOptions}
        copy={{
          editMealTitle: m.editMealTitle,
          saveMealChanges: m.saveMealChanges,
          cancelEdit: m.cancelEdit,
          mealType: m.mealType,
          mealNameLabel: m.mealNameLabel,
          mealDescription: m.mealDescription,
          editConfidenceLabel: m.editConfidenceLabel,
        }}
        onSave={handleSaveMealEdit}
      />
      <ConfirmDialog
        open={deleteMealId !== null}
        title={m.deleteMealTitle}
        description={m.confirmDelete}
        confirmLabel={delLabels.confirm}
        cancelLabel={delLabels.cancel}
        onCancel={() => setDeleteMealId(null)}
        onConfirm={() => void handleConfirmDeleteMeal()}
        confirmBusy={deletingMeal}
        variant="danger"
      />
      <EvoThinkingOverlay
        open={savingMeal}
        locale={locale}
        intent={imageBase64 ? 'mealImage' : 'meal'}
      />
      <div className="space-y-5">
        <PageTopBar
          rightContent={
            <button type="button" onClick={() => router.push('/chat?channel=COACH')} className="btn-info">
              {m.openEvoChat}
            </button>
          }
        />

        <h1 className="text-xl font-semibold tracking-tight text-text-primary">{m.pageTitle}</h1>
        <p className="text-sm text-text-secondary max-w-3xl leading-relaxed">{m.pageIntro}</p>
        <AiTransparencyNotice strings={aiTransparency} variant="compact" className="w-full max-w-none mt-4" />

        <div className="space-y-6 xl:space-y-8">
          <div className="grid gap-6 xl:gap-8 lg:grid-cols-2 items-start">
            <section
              className={clsx(
                'bg-surface border border-border rounded-xl p-4 md:p-5 min-w-0 shadow-sm shadow-black/5',
                accentEdgeClasses('primary', 'left'),
              )}
            >
              <div className="flex items-start justify-between gap-3 min-h-[3.5rem] md:min-h-[3.75rem]">
                <div className="min-w-0 flex-1">
                  <AISectionHeader
                    className="!mb-0"
                    eyebrow={m.mealsListEyebrow}
                    title={`${m.mealsFor} ${selectedDate}${selectedDate === today ? m.todaySuffix : ''}`}
                  />
                </div>
                <button
                  type="button"
                  className="btn-ghost mt-0.5 h-9 w-9 shrink-0 self-start rounded-lg border border-border/80 px-0"
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
                <div id="meals-today-panel" className="mt-4 space-y-4">
                  {lastInsight ? (
                    <div
                      className={clsx(
                        'rounded-lg border border-border bg-surface-elevated p-3 shadow-sm shadow-black/5',
                        accentEdgeClasses('info', 'left'),
                      )}
                    >
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
                    <MealTimeline
                      ui={mealTimelineUi}
                      meals={mealTimelineItems}
                      locale={locale}
                      onDelete={(id) => setDeleteMealId(id)}
                      onEditMeal={(id) => {
                        const meal = meals.find((x) => x.id === id);
                        if (meal) setMealToEdit(meal);
                      }}
                      editBusy={updatingMeal}
                      deleteBusy={deletingMeal}
                      renderAfterMacros={(timelineMeal) => {
                        const meal = meals.find((x) => x.id === timelineMeal.id);
                        if (!meal) return null;
                        return (
                          <MealMacroConfidenceBlock
                            imageUrl={meal.imageUrl}
                            confidence={meal.nutrition.confidence}
                            locale={locale}
                            copy={{
                              detailsMore: m.detailsMore,
                              estimateChipUnknown: m.estimateChipUnknown,
                              confidenceTooltipExplain: m.confidenceTooltipExplain,
                              confidenceTooltipUnavailable: m.confidenceTooltipUnavailable,
                            }}
                            className="mt-2"
                          />
                        );
                      }}
                    />
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

            <section
              id="add-meal"
              className={clsx(
                'scroll-mt-6 bg-surface border border-border rounded-xl p-4 md:p-5 min-w-0 shadow-sm shadow-black/5',
                accentEdgeClasses('success', 'left'),
              )}
            >
              <div className="flex items-start justify-between gap-3 min-h-[3.5rem] md:min-h-[3.75rem]">
                <div className="min-w-0 flex-1">
                  <AISectionHeader
                    className="!mb-0"
                    eyebrow={m.eyebrow}
                    title={m.logTitle}
                    subtitle={addMealOpen ? m.logSubtitle : undefined}
                  />
                </div>
                <button
                  type="button"
                  className="btn-ghost mt-0.5 h-9 w-9 shrink-0 self-start rounded-lg border border-border/80 px-0"
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
                  <form onSubmit={handleSubmit} className="mt-4 space-y-5">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="meals-date" className="flex flex-wrap items-baseline gap-x-1.5 text-sm font-medium text-text-primary">
                          <span>{m.dayLabel}</span>
                          <span className="text-xs font-normal text-text-muted">{m.dayOptional}</span>
                        </label>
                        <input
                          id="meals-date"
                          type="date"
                          value={selectedDate}
                          max={today}
                          onChange={(event) => setSelectedDate(event.target.value)}
                          className="input-field w-full py-2"
                        />
                        <p className="text-[11px] leading-snug text-text-muted">{m.dayHint}</p>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="mealType" className="block text-sm font-medium text-text-primary">
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
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="mealDescription" className="block text-sm font-medium text-text-primary">
                        {m.mealDescription}
                      </label>
                      <textarea
                        id="mealDescription"
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                        placeholder={m.mealPlaceholder}
                        className="input-field w-full min-h-[5.5rem] resize-y leading-relaxed"
                      />
                    </div>

                    <div className="rounded-xl border border-border bg-surface-elevated/25 p-4 space-y-3">
                      <p className="text-sm font-medium text-text-primary">{m.uploadImage}</p>
                      <label
                        htmlFor="imageUpload"
                        className="w-full rounded-lg border border-dashed border-border/90 bg-surface/80 px-3 py-4 flex flex-col sm:flex-row sm:items-center justify-center gap-2 text-text-secondary hover:text-text-primary hover:border-info-500/25 cursor-pointer transition-colors duration-150 ease-out"
                      >
                        <span className="inline-flex items-center justify-center gap-2">
                          <ImagePlus className="h-4 w-4 shrink-0 stroke-[1.9]" />
                          <span className="text-sm">{m.chooseImage}</span>
                        </span>
                        <input id="imageUpload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                      </label>

                      {(imagePreview || imageBase64) && !readingImage ? (
                        <p className="text-xs text-text-muted leading-relaxed">{m.imageLogHint}</p>
                      ) : (
                        <p className="text-[11px] text-text-muted leading-snug">{m.photoEmptyHint}</p>
                      )}

                      {readingImage ? (
                        <div
                          className="h-32 w-full rounded-lg border border-border bg-surface-elevated animate-pulse flex items-center justify-center"
                          role="status"
                        >
                          <span className="text-xs text-text-muted">{m.readingImageLabel}</span>
                        </div>
                      ) : imagePreview ? (
                        <img src={imagePreview} alt={m.previewAlt} className="h-36 w-full object-cover rounded-lg border border-border" />
                      ) : null}
                    </div>

                    <SmartSuggestionChips
                      density="compact"
                      title={m.chipsTitle}
                      suggestions={mealSuggestionChips}
                      onSelect={(value) => setContent(value)}
                    />

                    <button
                      type="submit"
                      disabled={savingMeal}
                      className="btn-primary w-full inline-flex items-center justify-center gap-2 min-h-10"
                    >
                      {savingMeal ? (
                        <>
                          <ButtonSpinner />
                          {m.analyzing}
                        </>
                      ) : (
                        m.saveMeal
                      )}
                    </button>
                  </form>
                </div>
              ) : null}
            </section>
          </div>

          <div className="min-w-0">
            <WeeklyMealsNutritionSection weekEndDate={weeklyStatsEndDate} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
