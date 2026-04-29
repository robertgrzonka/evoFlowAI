import type { UiLocale } from '../ui-locale';

export const evoChatDockCopy: Record<
  UiLocale,
  {
    title: string;
    subtitle: string;
    tabChat: string;
    tabMeal: string;
    tabWorkout: string;
    tabGeneral: string;
    tabCoach: string;
    loadingHistory: string;
    emptyThread: string;
    minimize: string;
    close: string;
    statusAnalyzing: string;
    statusCoach: string;
    statusGeneral: string;
    proteinLeft: (g: number) => string;
    fullChat: string;
    openMealLog: string;
    mealTypes: Record<'breakfast' | 'lunch' | 'dinner' | 'snack', string>;
    describeMeal: string;
    chooseImage: string;
    addMealBusy: string;
    addMeal: string;
    workoutTitle: string;
    minutesPh: string;
    kcalPh: string;
    low: string;
    medium: string;
    high: string;
    addWorkoutBusy: string;
    addWorkout: string;
    inputPlaceholder: string;
    inputPlaceholderCoach: string;
    inputPlaceholderGeneral: string;
    toastMessageFailTitle: string;
    toastMessageFailBody: string;
    toastMealFailTitle: string;
    toastMealFailBody: string;
    toastMealOkTitle: string;
    toastMealOkBody: string;
    toastWorkoutOkTitle: string;
    toastWorkoutOkBody: string;
    toastWorkoutFailTitle: string;
    toastWorkoutFailBody: string;
    toastMealNeedInputTitle: string;
    toastMealNeedInputBody: string;
    toastWorkoutNeedTitle: string;
    toastWorkoutNeedBody: string;
    toastImageInvalidTitle: string;
    toastImageInvalidBody: string;
    toastImageReadTitle: string;
    toastImageReadBody: string;
    insightsForToday: (n: number) => string;
    evo: string;
    you: string;
    launcherCalm: string;
  }
> = {
  en: {
    title: 'Evo chat',
    subtitle: 'Live coach for goals, meals, and training.',
    tabChat: 'Chat',
    tabMeal: 'Add meal',
    tabWorkout: 'Add workout',
    tabGeneral: 'General',
    tabCoach: 'Coach',
    loadingHistory: 'Loading your conversation with Evo…',
    emptyThread: 'Message Evo if you want to dig into meals, training, or your plan.',
    minimize: 'Minimize',
    close: 'Close',
    statusAnalyzing: 'Analyzing',
    statusCoach: 'Coach',
    statusGeneral: 'General',
    proteinLeft: (g) => `~${Math.round(g)}g protein left`,
    fullChat: 'Open full chat',
    openMealLog: 'Open meal log',
    mealTypes: {
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
      snack: 'Snack',
    },
    describeMeal: 'Describe your meal…',
    chooseImage: 'Upload image',
    addMealBusy: 'Adding meal…',
    addMeal: 'Add meal with Evo',
    workoutTitle: 'Workout title',
    minutesPh: 'Minutes',
    kcalPh: 'kcal burned',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    addWorkoutBusy: 'Adding workout…',
    addWorkout: 'Add workout with Evo',
    inputPlaceholder: 'Ask Evo…',
    inputPlaceholderCoach: 'Ask Evo about today’s numbers…',
    inputPlaceholderGeneral: 'Ask Evo anything…',
    toastMessageFailTitle: 'Message failed',
    toastMessageFailBody: 'Could not send message.',
    toastMealFailTitle: 'Meal save failed',
    toastMealFailBody: 'Could not add meal.',
    toastMealOkTitle: 'Meal added',
    toastMealOkBody: 'Evo logged it for today in your day view.',
    toastWorkoutOkTitle: 'Workout added',
    toastWorkoutOkBody: 'Evo updated your training for today.',
    toastWorkoutFailTitle: 'Workout save failed',
    toastWorkoutFailBody: 'Could not add workout.',
    toastMealNeedInputTitle: 'Need input',
    toastMealNeedInputBody: 'Add a short description or an image.',
    toastWorkoutNeedTitle: 'Need title',
    toastWorkoutNeedBody: 'Add a workout name before saving.',
    toastImageInvalidTitle: 'Not an image',
    toastImageInvalidBody: 'Please choose an image file.',
    toastImageReadTitle: 'Image read failed',
    toastImageReadBody: 'Could not read the file.',
    insightsForToday: (n) => `${n} tip${n > 1 ? 's' : ''} for today`,
    evo: 'Evo',
    you: 'You',
    launcherCalm: 'All calm — I can still help you tune the day.',
  },
  pl: {
    title: 'Czat z Evo',
    subtitle: 'Coach na cele, posiłki i trening — z tego panelu.',
    tabChat: 'Czat',
    tabMeal: 'Posiłek',
    tabWorkout: 'Trening',
    tabGeneral: 'Ogólny',
    tabCoach: 'Coach',
    loadingHistory: 'Ładuję rozmowę z Evo…',
    emptyThread: 'Napisz do Evo, jeśli chcesz dopytać o posiłki, trening albo plan.',
    minimize: 'Zwiń',
    close: 'Zamknij',
    statusAnalyzing: 'Liczę dane',
    statusCoach: 'Coach',
    statusGeneral: 'Ogólny',
    proteinLeft: (g) => `~${Math.round(g)} g białka zostaje`,
    fullChat: 'Pełny czat',
    openMealLog: 'Widok posiłków',
    mealTypes: {
      breakfast: 'Śniadanie',
      lunch: 'Obiad',
      dinner: 'Kolacja',
      snack: 'Przekąska',
    },
    describeMeal: 'Opisz posiłek…',
    chooseImage: 'Dodaj zdjęcie',
    addMealBusy: 'Zapisuję posiłek…',
    addMeal: 'Dodaj posiłek z Evo',
    workoutTitle: 'Nazwa treningu',
    minutesPh: 'Minuty',
    kcalPh: 'kcal spalonych',
    low: 'Niska',
    medium: 'Średnia',
    high: 'Wysoka',
    addWorkoutBusy: 'Zapisuję trening…',
    addWorkout: 'Dodaj trening z Evo',
    inputPlaceholder: 'Napisz do Evo…',
    inputPlaceholderCoach: 'Zapytaj Evo o dziś i liczby…',
    inputPlaceholderGeneral: 'Zapytaj Evo o cokolwiek…',
    toastMessageFailTitle: 'Błąd wysyłki',
    toastMessageFailBody: 'Nie udało się wysłać wiadomości.',
    toastMealFailTitle: 'Nie zapisano posiłku',
    toastMealFailBody: 'Nie udało się dodać posiłku.',
    toastMealOkTitle: 'Dodano posiłek',
    toastMealOkBody: 'Evo zapisuje go w widoku dnia.',
    toastWorkoutOkTitle: 'Dodano trening',
    toastWorkoutOkBody: 'Evo uzupełnił treningi na dziś.',
    toastWorkoutFailTitle: 'Nie zapisano treningu',
    toastWorkoutFailBody: 'Nie udało się dodać treningu.',
    toastMealNeedInputTitle: 'Brak danych',
    toastMealNeedInputBody: 'Dodaj krótki opis albo zdjęcie.',
    toastWorkoutNeedTitle: 'Brak nazwy',
    toastWorkoutNeedBody: 'Dodaj nazwę treningu przed zapisem.',
    toastImageInvalidTitle: 'Zły plik',
    toastImageInvalidBody: 'Wybierz plik obrazu.',
    toastImageReadTitle: 'Błąd odczytu',
    toastImageReadBody: 'Nie udało się odczytać pliku.',
    insightsForToday: (n) => (n === 1 ? 'Jedna wskazówka na dziś' : `${n} wskazówki na dziś`),
    evo: 'Evo',
    you: 'Ty',
    launcherCalm: 'Spokojnie — i tak możesz dopracować dzień z Evo.',
  },
};

export function getEvoChatDockLauncherHint(locale: UiLocale, insightCount: number): string {
  const c = evoChatDockCopy[locale];
  if (insightCount > 0) {
    return c.insightsForToday(insightCount);
  }
  return c.launcherCalm;
}
