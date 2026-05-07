import type { UiLocale } from '../ui-locale';

export const workoutsPageCopy: Record<
  UiLocale,
  {
    pageTitle: string;
    pageIntro: string;
    openEvoChat: string;
    expandWorkoutsDay: string;
    collapseWorkoutsDay: string;
    expandLogWorkout: string;
    collapseLogWorkout: string;
    sessionsLabel: string;
    minutesLabel: string;
    weeklySessionsGoal: string;
    weeklyMinutesGoal: string;
    todayWord: string;
    selectedDayTitle: string;
    selectedDaySubtitle: string;
    selectedDayLabel: string;
    useToday: string;
    useYesterday: string;
    eyebrow: string;
    logTitle: string;
    logSubtitle: string;
    dayLabel: string;
    dayOptional: string;
    dayHint: string;
    importTitle: string;
    importSubtitle: string;
    importNotesPlaceholder: string;
    importing: string;
    importFile: string;
    workoutTitle: string;
    titlePlaceholder: string;
    chipsTitle: string;
    duration: string;
    kcalBurned: string;
    intensity: string;
    sessionNotes: string;
    notesPlaceholder: string;
    savingEvaluating: string;
    saveAndSync: string;
    daySummaryTitle: (date: string, isToday: boolean) => string;
    coachSuggestion: string;
    coachInsightEmpty: string;
    explainScore: string;
    suggestPostMeal: string;
    noInsightTitle: string;
    noInsightDescription: string;
    workoutsFor: string;
    todaySuffix: string;
    deleteWorkoutTitle: string;
    noWorkoutsLine: (date: string, isToday: boolean) => string;
    confirmDelete: string;
    intensityLow: string;
    intensityMedium: string;
    intensityHigh: string;
    netCaloriesLabel: string;
    burnedTodayLabel: string;
    burnedOnDateLabel: (date: string) => string;
    proteinLeftLabel: string;
    dayWorkoutsHeading: (date: string, isToday: boolean) => string;
    dailyStepsTitle: string;
    dailyStepsDescription: string;
    dailyStepsLabel: string;
    dailyStepsSave: string;
    dailyStepsSaved: string;
    dailyStepsHint: (steps: number) => string;
    invalidStepsTitle: string;
    invalidStepsBody: string;
    activityBonusTitle: string;
    activityBonusDescription: string;
    activityBonusLabel: string;
    activityBonusSave: string;
    activityBonusSaved: string;
    activityBudgetHint: string;
    editWorkoutTitle: string;
    saveWorkoutChanges: string;
    cancelEditWorkout: string;
    performedAtLabel: string;
    toastWorkoutUpdatedTitle: string;
    toastWorkoutUpdatedBody: string;
  }
> = {
  en: {
    pageTitle: 'Workout Coach',
    pageIntro:
      'Log a session first — the weekly training view and day summary update as you save entries.',
    openEvoChat: 'Open Evo chat',
    expandWorkoutsDay: 'Expand day summary and list',
    collapseWorkoutsDay: 'Collapse day summary and list',
    expandLogWorkout: 'Expand log form',
    collapseLogWorkout: 'Collapse log form',
    sessionsLabel: 'Sessions',
    minutesLabel: 'Minutes',
    weeklySessionsGoal: 'Weekly sessions goal',
    weeklyMinutesGoal: 'Weekly minutes goal',
    todayWord: 'today',
    selectedDayTitle: 'Selected training day',
    selectedDaySubtitle: 'This date controls workouts, steps, and activity allowance on this page.',
    selectedDayLabel: 'Date',
    useToday: 'Today',
    useYesterday: 'Yesterday',
    eyebrow: 'Workout flow',
    logTitle: 'Log your training',
    logSubtitle: 'Pick the day, reuse a real recent session if helpful, then save the key training details.',
    dayLabel: 'Day for this log',
    dayOptional: ' — optional',
    dayHint: 'Defaults to today. Change only if you are logging or importing a session for an earlier day.',
    importTitle: 'Optional: import from device file',
    importSubtitle: 'Upload Garmin/fitness export file (GPX, TCX, FIT). Evo will parse and log it automatically.',
    importNotesPlaceholder: 'Optional note for imported workout',
    importing: 'Importing...',
    importFile: 'Import workout file',
    workoutTitle: 'Workout title',
    titlePlaceholder: 'e.g. Upper body strength + core',
    chipsTitle: 'Recent real workouts',
    duration: 'Duration (min)',
    kcalBurned: 'Estimated kcal burned',
    intensity: 'Intensity',
    sessionNotes: 'Session notes',
    notesPlaceholder: 'How it felt, sets/reps, what to improve next time...',
    savingEvaluating: 'Evo is evaluating the session...',
    saveAndSync: 'Save workout and sync with Evo',
    daySummaryTitle: (date, isToday) =>
      `Day summary for ${date}${isToday ? ' (today)' : ''} — food + training`,
    coachSuggestion: 'Coach suggestion',
    coachInsightEmpty: 'Full coaching note for this day is on your dashboard (Evo daily brief) or in chat.',
    explainScore: 'Explain this score',
    suggestPostMeal: 'Suggest post-workout meal',
    noInsightTitle: 'No workout insight yet',
    noInsightDescription: 'Log one training session and Evo will generate an instant post-workout read.',
    workoutsFor: 'Workouts for',
    todaySuffix: ' (today)',
    deleteWorkoutTitle: 'Delete workout',
    noWorkoutsLine: (date, isToday) =>
      `No workouts logged for ${date}${isToday ? ' yet' : ''}.`,
    confirmDelete: 'Delete this workout entry?',
    intensityLow: 'Low',
    intensityMedium: 'Medium',
    intensityHigh: 'High',
    netCaloriesLabel: 'Net calories',
    burnedTodayLabel: 'Burned today',
    burnedOnDateLabel: (date) => `Burned (${date})`,
    proteinLeftLabel: 'Protein left',
    dayWorkoutsHeading: (date, isToday) => (isToday ? "Today's workouts" : `Workouts on ${date}`),
    dailyStepsTitle: 'Steps for this day',
    dailyStepsDescription:
      'Add or correct steps for the selected date. Steps are used as context for Evo and weekly averages, but they do not increase the calorie budget.',
    dailyStepsLabel: 'Steps',
    dailyStepsSave: 'Save steps',
    dailyStepsSaved: 'Steps updated',
    dailyStepsHint: (steps) => `${steps.toLocaleString()} steps tracked for this day.`,
    invalidStepsTitle: 'Invalid steps',
    invalidStepsBody: 'Steps must be between 0 and 120000.',
    activityBonusTitle: 'Extra activity allowance',
    activityBonusDescription:
      'Add kcal you expect to burn today (long walk, hike, etc.). Your daily calorie budget increases by this amount so meal progress and coach tips stay fair. Logged workouts already add to the budget — use this for planned movement that is not in your workout list yet.',
    activityBonusLabel: 'Bonus kcal for this day',
    activityBonusSave: 'Save allowance',
    activityBonusSaved: 'Allowance updated',
    activityBudgetHint: 'Today’s calorie budget = goals + logged workouts + this bonus.',
    editWorkoutTitle: 'Edit workout',
    saveWorkoutChanges: 'Save changes',
    cancelEditWorkout: 'Cancel',
    performedAtLabel: 'Started at (local)',
    toastWorkoutUpdatedTitle: 'Workout updated',
    toastWorkoutUpdatedBody: 'Changes were saved.',
  },
  pl: {
    pageTitle: 'Trening',
    pageIntro:
      'Najpierw zapisz sesję — tygodniowy podgląd treningów i podsumowanie dnia uzupełniają się przy każdym wpisie.',
    openEvoChat: 'Otwórz czat Evo',
    expandWorkoutsDay: 'Rozwiń podsumowanie dnia i listę treningów',
    collapseWorkoutsDay: 'Zwiń podsumowanie dnia i listę treningów',
    expandLogWorkout: 'Rozwiń formularz zapisu',
    collapseLogWorkout: 'Zwiń formularz zapisu',
    sessionsLabel: 'Sesje',
    minutesLabel: 'Minuty',
    weeklySessionsGoal: 'Cel sesji / tydzień',
    weeklyMinutesGoal: 'Cel aktywnych minut / tydzień',
    todayWord: 'dziś',
    selectedDayTitle: 'Wybrany dzień treningowy',
    selectedDaySubtitle: 'Ta data steruje treningami, krokami i dodatkową pulą aktywności na tej stronie.',
    selectedDayLabel: 'Data',
    useToday: 'Dziś',
    useYesterday: 'Wczoraj',
    eyebrow: 'Logowanie treningu',
    logTitle: 'Zapisz trening',
    logSubtitle: 'Wybierz dzień, użyj prawdziwego ostatniego treningu jako skrótu i zapisz najważniejsze dane sesji.',
    dayLabel: 'Dzień wpisu',
    dayOptional: ' — opcjonalnie',
    dayHint: 'Domyślnie dziś. Zmień tylko przy imporcie lub logu z wcześniejszego dnia.',
    importTitle: 'Opcjonalnie: import z pliku',
    importSubtitle: 'Wgraj eksport Garmin/fitness (GPX, TCX, FIT). Evo sparsuje i zapisze sesję.',
    importNotesPlaceholder: 'Opcjonalna notatka do importu',
    importing: 'Importowanie…',
    importFile: 'Importuj plik treningu',
    workoutTitle: 'Nazwa treningu',
    titlePlaceholder: 'Np. siła góry + core',
    chipsTitle: 'Ostatnie prawdziwe treningi',
    duration: 'Czas trwania (min)',
    kcalBurned: 'Szacowane spalone kcal',
    intensity: 'Intensywność',
    sessionNotes: 'Notatki z sesji',
    notesPlaceholder: 'Odczucia, serie/powtórzenia, co poprawić następnym razem…',
    savingEvaluating: 'Evo ocenia sesję…',
    saveAndSync: 'Zapisz trening i zsynchronizuj z Evo',
    daySummaryTitle: (date, isToday) =>
      `Podsumowanie dnia ${date}${isToday ? ' (dziś)' : ''} — jedzenie + trening`,
    coachSuggestion: 'Sugestia coacha',
    coachInsightEmpty: 'Pełna notatka dla tego dnia jest na pulpicie (dzienny brief Evo) albo w czacie.',
    explainScore: 'Wyjaśnij ten wynik',
    suggestPostMeal: 'Propozycja posiłku po treningu',
    noInsightTitle: 'Brak insightu treningowego',
    noInsightDescription: 'Zaloguj jedną sesję — Evo wygeneruje szybki odczyt po treningu.',
    workoutsFor: 'Treningi na',
    todaySuffix: ' (dziś)',
    deleteWorkoutTitle: 'Usuń trening',
    noWorkoutsLine: (date, isToday) =>
      `Brak treningów na ${date}${isToday ? ' — na razie' : ''}.`,
    confirmDelete: 'Usunąć ten wpis treningu?',
    intensityLow: 'Niska',
    intensityMedium: 'Średnia',
    intensityHigh: 'Wysoka',
    netCaloriesLabel: 'Kalorie netto',
    burnedTodayLabel: 'Spalone dziś',
    burnedOnDateLabel: (date) => `Spalone (${date})`,
    proteinLeftLabel: 'Pozostałe białko',
    dayWorkoutsHeading: (date, isToday) => (isToday ? 'Treningi z dzisiejszego dnia' : `Treningi z dnia ${date}`),
    dailyStepsTitle: 'Kroki na ten dzień',
    dailyStepsDescription:
      'Dodaj albo popraw kroki dla wybranej daty. Kroki są kontekstem dla Evo i średnich tygodniowych, ale nie zwiększają budżetu kalorii.',
    dailyStepsLabel: 'Kroki',
    dailyStepsSave: 'Zapisz kroki',
    dailyStepsSaved: 'Kroki zapisane',
    dailyStepsHint: (steps) => `${steps.toLocaleString('pl-PL')} kroków zapisanych dla tego dnia.`,
    invalidStepsTitle: 'Nieprawidłowe kroki',
    invalidStepsBody: 'Kroki muszą być między 0 a 120000.',
    activityBonusTitle: 'Dodatkowa pula na ruch',
    activityBonusDescription:
      'Dodaj kcal, które dziś planujesz dodatkowo „wyrobić” (długi spacer, wycieczka itd.). Dzienny budżet kalorii wzrośnie o tę wartość, żeby pasek posiłków i podpowiedzi Evo były uczciwe. Spalona energia z zalogowanych treningów jest już w budżecie — tego pola używaj dla planowanego ruchu, którego jeszcze nie ma na liście treningów.',
    activityBonusLabel: 'Bonus kcal na ten dzień',
    activityBonusSave: 'Zapisz pulę',
    activityBonusSaved: 'Zapisano',
    activityBudgetHint: 'Budżet kcal = cele + zapisane treningi + ten bonus.',
    editWorkoutTitle: 'Edytuj trening',
    saveWorkoutChanges: 'Zapisz zmiany',
    cancelEditWorkout: 'Anuluj',
    performedAtLabel: 'Rozpoczęcie (czas lokalny)',
    toastWorkoutUpdatedTitle: 'Zaktualizowano trening',
    toastWorkoutUpdatedBody: 'Zmiany zostały zapisane.',
  },
};
