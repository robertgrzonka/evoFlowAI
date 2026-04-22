import type { UiLocale } from '../ui-locale';

export const mealsPageCopy: Record<
  UiLocale,
  {
    openEvoChat: string;
    pageTitle: string;
    pageIntro: string;
    expandTodayList: string;
    collapseTodayList: string;
    expandAddMeal: string;
    collapseAddMeal: string;
    eyebrow: string;
    logTitle: string;
    logSubtitle: string;
    dayLabel: string;
    dayOptional: string;
    dayHint: string;
    mealType: string;
    mealDescription: string;
    mealPlaceholder: string;
    chipsTitle: string;
    uploadImage: string;
    chooseImage: string;
    previewAlt: string;
    previewPlaceholder: string;
    readyTitle: string;
    readyContent: string;
    editDetails: string;
    confirmAnalyze: string;
    analyzing: string;
    analyzeNow: string;
    reviewBeforeSave: string;
    mealsFor: string;
    todaySuffix: string;
    latestAnalysis: string;
    deleteMealTitle: string;
    emptyTitle: string;
    emptyDescription: string;
    emptyAction: string;
    chip1: string;
    chip2: string;
    chip3: string;
    confirmDelete: string;
  }
> = {
  en: {
    openEvoChat: 'Open Evo chat',
    pageTitle: 'Meals',
    pageIntro:
      'Start by logging a meal — the 7-day view and today’s list update automatically as you save entries.',
    expandTodayList: 'Expand today’s meals',
    collapseTodayList: 'Collapse today’s meals',
    expandAddMeal: 'Expand add-meal form',
    collapseAddMeal: 'Collapse add-meal form',
    eyebrow: 'Meal flow',
    logTitle: 'Log meal',
    logSubtitle: 'Describe or upload. Evo will analyze, then you can save with confidence.',
    dayLabel: 'Day for this log',
    dayOptional: ' — optional',
    dayHint: 'Defaults to today. Change only if you are logging a meal for an earlier day.',
    mealType: 'Meal type',
    mealDescription: 'Meal description',
    mealPlaceholder: 'Example: grilled chicken with rice and salad, around 350g total',
    chipsTitle: 'Quick input ideas',
    uploadImage: 'Upload meal image',
    chooseImage: 'Choose image',
    previewAlt: 'Meal preview',
    previewPlaceholder: 'Image preview appears here',
    readyTitle: 'Ready to analyze?',
    readyContent: 'Quick review: if description and meal type look right, save. If not, edit before sending.',
    editDetails: 'Edit details',
    confirmAnalyze: 'Confirm & analyze',
    analyzing: 'Evo is analyzing your meal...',
    analyzeNow: 'Analyze now',
    reviewBeforeSave: 'Review before save',
    mealsFor: 'Meals for',
    todaySuffix: ' (today)',
    latestAnalysis: 'Latest Evo analysis',
    deleteMealTitle: 'Delete meal',
    emptyTitle: 'No meals logged yet',
    emptyDescription: 'Start with one meal entry. Evo will begin spotting patterns and giving smarter suggestions.',
    emptyAction: 'Open coach chat',
    chip1: 'Chicken + rice + vegetables (post-workout meal)',
    chip2: 'Skyr + berries + oats (quick high-protein snack)',
    chip3: 'Egg omelette + toast + salad (balanced breakfast)',
    confirmDelete: 'Delete this meal entry?',
  },
  pl: {
    openEvoChat: 'Otwórz czat Evo',
    pageTitle: 'Posiłki',
    pageIntro:
      'Najpierw dodaj posiłek — widok 7 dni i lista dnia uzupełniają się przy każdym zapisanym wpisie.',
    expandTodayList: 'Rozwiń listę posiłków',
    collapseTodayList: 'Zwiń listę posiłków',
    expandAddMeal: 'Rozwiń formularz dodawania',
    collapseAddMeal: 'Zwiń formularz dodawania',
    eyebrow: 'Logowanie posiłku',
    logTitle: 'Dodaj posiłek',
    logSubtitle: 'Opisz lub wgraj zdjęcie. Evo przeanalizuje, potem zapiszesz z pewnością siebie.',
    dayLabel: 'Dzień wpisu',
    dayOptional: ' — opcjonalnie',
    dayHint: 'Domyślnie dziś. Zmień tylko, jeśli logujesz posiłek z wcześniejszego dnia.',
    mealType: 'Typ posiłku',
    mealDescription: 'Opis posiłku',
    mealPlaceholder: 'Np. grillowany kurczak z ryżem i sałatką, ok. 350 g razem',
    chipsTitle: 'Szybkie pomysły',
    uploadImage: 'Zdjęcie posiłku',
    chooseImage: 'Wybierz zdjęcie',
    previewAlt: 'Podgląd posiłku',
    previewPlaceholder: 'Tu pojawi się podgląd',
    readyTitle: 'Gotowe do analizy?',
    readyContent: 'Sprawdź: typ i opis — jeśli OK, zapisz. Jeśli nie, popraw przed wysłaniem.',
    editDetails: 'Edytuj',
    confirmAnalyze: 'Potwierdź i analizuj',
    analyzing: 'Evo analizuje posiłek…',
    analyzeNow: 'Analizuj teraz',
    reviewBeforeSave: 'Sprawdź przed zapisem',
    mealsFor: 'Posiłki na',
    todaySuffix: ' (dziś)',
    latestAnalysis: 'Ostatnia analiza Evo',
    deleteMealTitle: 'Usuń posiłek',
    emptyTitle: 'Brak zalogowanych posiłków',
    emptyDescription: 'Zacznij od jednego wpisu. Evo zacznie widzieć wzorce i dawać lepsze sugestie.',
    emptyAction: 'Czat z coachem',
    chip1: 'Kurczak + ryż + warzywa (posiłek po treningu)',
    chip2: 'Skyr + owoce + płatki (szybka przekąska z białkiem)',
    chip3: 'Omlet + tost + sałatka (zbalansowane śniadanie)',
    confirmDelete: 'Usunąć ten wpis posiłku?',
  },
};

export const mealTypeLabels: Record<UiLocale, Record<string, string>> = {
  en: {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snack',
  },
  pl: {
    breakfast: 'Śniadanie',
    lunch: 'Obiad',
    dinner: 'Kolacja',
    snack: 'Przekąska',
  },
};
