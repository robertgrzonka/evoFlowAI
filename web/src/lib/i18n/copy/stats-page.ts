import type { UiLocale } from '../ui-locale';

export const statsPageCopy: Record<
  UiLocale,
  {
    goalModePrefix: string;
    eyebrow: string;
    pickDayTitle: string;
    pickDaySubtitle: string;
    modeCombined: string;
    modeNutrition: string;
    modeTraining: string;
    analysisDate: string;
    saveSteps: string;
    saving: string;
    stepsPlaceholder: string;
    loadingActivity: string;
    stepsTracked: (n: number) => string;
    mainInsightTitle: string;
    mainInsightPending: string;
    mealsFor: string;
    deleteMealTitle: string;
    noMeals: (date: string) => string;
    addMeal: string;
    workoutsFor: string;
    openWorkoutCoach: string;
    sessions: string;
    burned: string;
    netCalories: string;
    deleteWorkoutTitle: string;
    noWorkouts: (date: string) => string;
    logWorkout: string;
    weeklyTrendTitle: string;
    partialWeekly: (avail: number, tracked: number) => string;
    proTip: string;
    weeklyNarrativePending: string;
    weeklyEmptyTitle: string;
    weeklyEmptyDescription: string;
    aiCoachTitle: string;
    aiCoachDescription: (modeLabel: string) => string;
    quick1: (date: string) => string;
    quick2: (date: string) => string;
    quick3: (date: string) => string;
    quick4: (date: string) => string;
    statGoal: string;
    statPercentOfGoal: (n: string) => string;
    confirmDeleteMeal: string;
    confirmDeleteWorkout: string;
  }
> = {
  en: {
    goalModePrefix: 'Goal mode:',
    eyebrow: 'Day analyzer',
    pickDayTitle: 'Pick day',
    pickDaySubtitle: 'Use a single day view to see what drifts, what works, and what to do next.',
    modeCombined: 'Combined',
    modeNutrition: 'Nutrition',
    modeTraining: 'Training',
    analysisDate: 'Analysis date',
    saveSteps: 'Save steps',
    saving: 'Saving...',
    stepsPlaceholder: 'Steps',
    loadingActivity: 'Loading activity...',
    stepsTracked: (n) => `Steps tracked: ${n}`,
    mainInsightTitle: 'Main insight for selected day',
    mainInsightPending: 'Evo has not loaded an insight for this day yet — try refreshing or open chat.',
    mealsFor: 'Meals for',
    deleteMealTitle: 'Delete meal',
    noMeals: (date) => `No meals logged for ${date}`,
    addMeal: 'Add meal',
    workoutsFor: 'Workouts for',
    openWorkoutCoach: 'Open Workout Coach',
    sessions: 'Sessions',
    burned: 'Burned',
    netCalories: 'Net calories',
    deleteWorkoutTitle: 'Delete workout',
    noWorkouts: (date) => `No workouts logged for ${date}`,
    logWorkout: 'Log workout',
    weeklyTrendTitle: 'Weekly trend snapshot',
    partialWeekly: (avail, tracked) =>
      `Partial weekly review for ${avail}/7 available days (${tracked} tracked).`,
    proTip: 'Focus for the week ahead',
    weeklyNarrativePending: 'Weekly story from Evo will show here once it is ready.',
    weeklyEmptyTitle: 'Weekly trend is not ready yet',
    weeklyEmptyDescription: 'Evo needs more day snapshots to build a reliable weekly pattern.',
    aiCoachTitle: 'AI Coach',
    aiCoachDescription: (modeLabel) => `Mode: ${modeLabel}. Ask Evo for focused suggestions based on selected date.`,
    quick1: (date) => `Review my nutrition for ${date}.`,
    quick2: (date) => `Combine my meals and workouts for ${date} and tell me what to do next.`,
    quick3: (date) => `What macro is most off target on ${date}?`,
    quick4: (date) => `Suggest one dinner idea for ${date} for better balance.`,
    statGoal: 'Goal:',
    statPercentOfGoal: (n) => `${n}% of goal`,
    confirmDeleteMeal: 'Delete this meal entry?',
    confirmDeleteWorkout: 'Delete this workout entry?',
  },
  pl: {
    goalModePrefix: 'Tryb celu:',
    eyebrow: 'Analiza dnia',
    pickDayTitle: 'Wybierz dzień',
    pickDaySubtitle: 'Jeden dzień — co odjeżdża, co działa i co zrobić dalej.',
    modeCombined: 'Razem',
    modeNutrition: 'Odżywianie',
    modeTraining: 'Trening',
    analysisDate: 'Data analizy',
    saveSteps: 'Zapisz kroki',
    saving: 'Zapisywanie…',
    stepsPlaceholder: 'Kroki',
    loadingActivity: 'Ładowanie aktywności…',
    stepsTracked: (n) => `Kroki: ${n}`,
    mainInsightTitle: 'Główny insight dla wybranego dnia',
    mainInsightPending: 'Brak insightu Evo dla tego dnia — odśwież lub otwórz czat.',
    mealsFor: 'Posiłki na',
    deleteMealTitle: 'Usuń posiłek',
    noMeals: (date) => `Brak posiłków na ${date}`,
    addMeal: 'Dodaj posiłek',
    workoutsFor: 'Treningi na',
    openWorkoutCoach: 'Otwórz trening',
    sessions: 'Sesje',
    burned: 'Spalone',
    netCalories: 'Kalorie netto',
    deleteWorkoutTitle: 'Usuń trening',
    noWorkouts: (date) => `Brak treningów na ${date}`,
    logWorkout: 'Zaloguj trening',
    weeklyTrendTitle: 'Tygodniowy trend',
    partialWeekly: (avail, tracked) =>
      `Częściowy przegląd tygodnia: ${avail}/7 dostępnych dni (${tracked} z logami).`,
    proTip: 'Skupienie na nadchodzący tydzień',
    weeklyNarrativePending: 'Tygodniowa narracja Evo pojawi się tu, gdy będzie gotowa.',
    weeklyEmptyTitle: 'Trend tygodniowy jeszcze niedostępny',
    weeklyEmptyDescription: 'Evo potrzebuje więcej dni z danymi, żeby zbudować wiarygodny wzorzec.',
    aiCoachTitle: 'Coach AI',
    aiCoachDescription: (modeLabel) => `Tryb: ${modeLabel}. Zapytaj Evo o sugestie dla wybranej daty.`,
    quick1: (date) => `Oceń moje odżywianie w dniu ${date}.`,
    quick2: (date) => `Połącz posiłki i trening z ${date} i powiedz, co robić dalej.`,
    quick3: (date) => `Które makro najbardziej od celu w dniu ${date}?`,
    quick4: (date) => `Jedna propozycja kolacji na ${date} dla lepszej równowagi.`,
    statGoal: 'Cel:',
    statPercentOfGoal: (n) => `${n}% celu`,
    confirmDeleteMeal: 'Usunąć ten wpis posiłku?',
    confirmDeleteWorkout: 'Usunąć ten wpis treningu?',
  },
};
