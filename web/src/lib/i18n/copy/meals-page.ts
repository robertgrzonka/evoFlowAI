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
    mealNameLabel: string;
    mealDescription: string;
    mealPlaceholder: string;
    chipsTitle: string;
    uploadImage: string;
    chooseImage: string;
    previewAlt: string;
    previewPlaceholder: string;
    /** Shown when no photo yet — replaces a large empty preview box. */
    photoEmptyHint: string;
    saveMeal: string;
    analyzing: string;
    mealsFor: string;
    todaySuffix: string;
    latestAnalysis: string;
    deleteMealTitle: string;
    emptyTitle: string;
    emptyDescription: string;
    emptyAction: string;
    /** Uppercase-style eyebrow; main line = mealsFor + date (collapsible “meal list” card). */
    mealsListEyebrow: string;
    chip1: string;
    chip2: string;
    chip3: string;
    confirmDelete: string;
    macroEstimateHint: string;
    /** Tooltip on “high” confidence chip: user-supplied / trusted breakdown vs generic estimate. */
    macroEstimateHintHigh: string;
    imageLogHint: string;
    imageLogDetail: string;
    detailsMore: string;
    /** Shown next to the help icon when confidence is missing (same row as the ? affordance). */
    estimateChipUnknown: string;
    /** Help icon tooltip: explains what Evo’s 0–100% model score means (shown under the live value). */
    confidenceTooltipExplain: string;
    /** Help icon tooltip when numeric confidence is missing. */
    confidenceTooltipUnavailable: string;
    toastMealSavedTitle: string;
    toastMealSavedBody: string;
    toastSaveFailTitle: string;
    toastSaveFailBody: string;
    toastDeleteFailTitle: string;
    toastDeleteFailBody: string;
    toastInvalidFileTitle: string;
    toastInvalidFileBody: string;
    toastImageReadTitle: string;
    toastImageReadBody: string;
    toastMissingInputTitle: string;
    toastMissingInputBody: string;
    readingImageLabel: string;
    editMealTitle: string;
    saveMealChanges: string;
    cancelEdit: string;
    editConfidenceLabel: string;
    toastMealUpdatedTitle: string;
    toastMealUpdatedBody: string;
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
    logSubtitle: 'Describe or upload a photo — one tap sends it to Evo and saves the meal to your day.',
    dayLabel: 'Day for this log',
    dayOptional: ' — optional',
    dayHint: 'Defaults to today. Change only if you are logging a meal for an earlier day.',
    mealType: 'Meal type',
    mealNameLabel: 'Meal name',
    mealDescription: 'Meal description',
    mealPlaceholder: 'Example: grilled chicken with rice and salad, around 350g total',
    chipsTitle: 'Quick input ideas',
    uploadImage: 'Upload meal image',
    chooseImage: 'Choose image',
    previewAlt: 'Meal preview',
    previewPlaceholder: 'Image preview appears here',
    photoEmptyHint: 'A short description alone is fine — add a photo if you want help with portions.',
    saveMeal: 'Add meal',
    analyzing: 'Evo is analyzing your meal...',
    mealsFor: 'Meals for',
    todaySuffix: ' (today)',
    latestAnalysis: 'Latest Evo analysis',
    deleteMealTitle: 'Delete meal',
    emptyTitle: 'No meals logged yet',
    emptyDescription: 'Start with one meal entry. Evo will begin spotting patterns and giving smarter suggestions.',
    emptyAction: 'Open coach chat',
    mealsListEyebrow: 'Day at a glance',
    chip1: 'Chicken + rice + vegetables (post-workout meal)',
    chip2: 'Skyr + berries + oats (quick high-protein snack)',
    chip3: 'Egg omelette + toast + salad (balanced breakfast)',
    confirmDelete: 'Delete this meal entry?',
    macroEstimateHint:
      'Macros are an Evo estimate — double-check sauces, added fats, and portion size if it matters to you.',
    macroEstimateHintHigh:
      'High confidence: these macros are grounded in the description and values you provided for this log. You can still edit the entry if something looks off.',
    imageLogHint:
      'Evo will guess ingredients and portion from the photo. Sauces, fats, and exact grams are often the shakiest bits.',
    imageLogDetail: 'Visual logging tends to be less certain than a clear text description — worth a second look.',
    detailsMore: 'Why this label?',
    estimateChipUnknown: 'Evo macro estimate',
    confidenceTooltipExplain:
      'This is Evo’s internal confidence (0–100%) that the calories and macros match your description or photo. Higher means the model’s signals agreed more strongly; it is not a clinical guarantee — double-check sauces, fats, and portions when precision matters.',
    confidenceTooltipUnavailable: 'No confidence score is stored for this entry.',
    toastMealSavedTitle: 'Meal saved',
    toastMealSavedBody: 'Added to your day.',
    toastSaveFailTitle: 'Save failed',
    toastSaveFailBody: 'Could not save meal.',
    toastDeleteFailTitle: 'Delete failed',
    toastDeleteFailBody: 'Could not delete meal.',
    toastInvalidFileTitle: 'Not an image',
    toastInvalidFileBody: 'Please select an image file.',
    toastImageReadTitle: 'Image read failed',
    toastImageReadBody: 'Failed to read image.',
    toastMissingInputTitle: 'Need input',
    toastMissingInputBody: 'Add a short description or a photo.',
    readingImageLabel: 'Reading your photo…',
    editMealTitle: 'Edit meal',
    saveMealChanges: 'Save changes',
    cancelEdit: 'Cancel',
    editConfidenceLabel: 'Confidence (0–1)',
    toastMealUpdatedTitle: 'Meal updated',
    toastMealUpdatedBody: 'Your changes were saved.',
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
    logSubtitle: 'Opisz posiłek lub wgraj zdjęcie — jedno kliknięcie wysyła do Evo i zapisuje wpis w dniu.',
    dayLabel: 'Dzień wpisu',
    dayOptional: ' — opcjonalnie',
    dayHint: 'Domyślnie dziś. Zmień tylko, jeśli logujesz posiłek z wcześniejszego dnia.',
    mealType: 'Typ posiłku',
    mealNameLabel: 'Nazwa posiłku',
    mealDescription: 'Opis posiłku',
    mealPlaceholder: 'Np. grillowany kurczak z ryżem i sałatką, ok. 350 g razem',
    chipsTitle: 'Szybkie pomysły',
    uploadImage: 'Zdjęcie posiłku',
    chooseImage: 'Wybierz zdjęcie',
    previewAlt: 'Podgląd posiłku',
    previewPlaceholder: 'Tu pojawi się podgląd',
    photoEmptyHint:
      'Możesz wysłać sam opis — zdjęcie dodaj, jeśli chcesz, żeby Evo lepiej ocenił porcję.',
    saveMeal: 'Dodaj posiłek',
    analyzing: 'Evo analizuje posiłek…',
    mealsFor: 'Posiłki na',
    todaySuffix: ' (dziś)',
    latestAnalysis: 'Ostatnia analiza Evo',
    deleteMealTitle: 'Usuń posiłek',
    emptyTitle: 'Brak zalogowanych posiłków',
    emptyDescription: 'Zacznij od jednego wpisu. Evo zacznie widzieć wzorce i dawać lepsze sugestie.',
    emptyAction: 'Czat z coachem',
    mealsListEyebrow: 'Podgląd dnia',
    chip1: 'Kurczak + ryż + warzywa (posiłek po treningu)',
    chip2: 'Skyr + owoce + płatki (szybka przekąska z białkiem)',
    chip3: 'Omlet + tost + sałatka (zbalansowane śniadanie)',
    confirmDelete: 'Usunąć ten wpis posiłku?',
    macroEstimateHint:
      'Makro to szacunek Evo — sprawdź szczególnie sosy, tłuszcze i porcję, jeśli zależy Ci na precyzji.',
    macroEstimateHintHigh:
      'Wysoka pewność: makra opierają się na tym, co sam podałeś w opisie i wartościach tego posiłku. W razie wątpliwości zawsze możesz poprawić wpis w edycji.',
    imageLogHint:
      'Evo spróbuje rozpoznać składniki i porcję ze zdjęcia. Najbardziej niepewne bywają sosy, tłuszcze i dokładna gramatura.',
    imageLogDetail: 'Z samego zdjęcia bywa mniej pewnie niż z dobrego opisu — warto podejrzeć liczby.',
    detailsMore: 'Co oznacza ten znacznik?',
    estimateChipUnknown: 'Makro — szacunek Evo',
    confidenceTooltipExplain:
      'To wewnętrzna pewność modelu Evo (0–100%), że kcal i makra pasują do Twojego opisu lub zdjęcia. Wyższa wartość = większa zgodność sygnałów w modelu; to nie jest gwarancja kliniczna — przy precyzji sprawdź sosy, tłuszcze i porcję.',
    confidenceTooltipUnavailable: 'Dla tego wpisu nie zapisano wartości pewności.',
    toastMealSavedTitle: 'Zapisano posiłek',
    toastMealSavedBody: 'Dodany do wybranego dnia.',
    toastSaveFailTitle: 'Nie zapisano',
    toastSaveFailBody: 'Nie udało się zapisać posiłku.',
    toastDeleteFailTitle: 'Nie usunięto',
    toastDeleteFailBody: 'Nie udało się usunąć posiłku.',
    toastInvalidFileTitle: 'Zły plik',
    toastInvalidFileBody: 'Wybierz plik obrazu.',
    toastImageReadTitle: 'Błąd odczytu',
    toastImageReadBody: 'Nie udało się odczytać zdjęcia.',
    toastMissingInputTitle: 'Brak danych',
    toastMissingInputBody: 'Dodaj krótki opis albo zdjęcie.',
    readingImageLabel: 'Wczytuję zdjęcie…',
    editMealTitle: 'Edytuj posiłek',
    saveMealChanges: 'Zapisz zmiany',
    cancelEdit: 'Anuluj',
    editConfidenceLabel: 'Pewność szacunku (0–1)',
    toastMealUpdatedTitle: 'Zaktualizowano posiłek',
    toastMealUpdatedBody: 'Zmiany zostały zapisane.',
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
