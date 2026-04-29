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
    eyebrow: string;
    logTitle: string;
    logSubtitle: string;
    repeatLastTitle: string;
    repeatLastContent: (title: string, min: number | string, kcal: number | string) => string;
    useAsTemplate: string;
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
    tplUpper: string;
    tplLower: string;
    tplCardio: string;
    intensityLow: string;
    intensityMedium: string;
    intensityHigh: string;
    netCaloriesLabel: string;
    burnedTodayLabel: string;
    burnedOnDateLabel: (date: string) => string;
    proteinLeftLabel: string;
    dayWorkoutsHeading: (date: string, isToday: boolean) => string;
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
    eyebrow: 'Workout flow',
    logTitle: 'Log your training',
    logSubtitle: 'Track the session, then let Evo evaluate what to do with nutrition and recovery.',
    repeatLastTitle: 'Repeat last workout',
    repeatLastContent: (title, min, kcal) => `Last session: ${title} · ${min} min · ${kcal} kcal.`,
    useAsTemplate: 'Use as template',
    dayLabel: 'Day for this log',
    dayOptional: ' — optional',
    dayHint: 'Defaults to today. Change only if you are logging or importing a session for an earlier day.',
    importTitle: 'Import from device file',
    importSubtitle: 'Upload Garmin/fitness export file (GPX, TCX, FIT). Evo will parse and log it automatically.',
    importNotesPlaceholder: 'Optional note for imported workout',
    importing: 'Importing...',
    importFile: 'Import workout file',
    workoutTitle: 'Workout title',
    titlePlaceholder: 'e.g. Upper body strength + core',
    chipsTitle: 'Smart workout templates',
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
    tplUpper: 'Upper body strength · 45 min · medium',
    tplLower: 'Lower body strength · 50 min · high',
    tplCardio: 'Cardio intervals · 30 min · high',
    intensityLow: 'Low',
    intensityMedium: 'Medium',
    intensityHigh: 'High',
    netCaloriesLabel: 'Net calories',
    burnedTodayLabel: 'Burned today',
    burnedOnDateLabel: (date) => `Burned (${date})`,
    proteinLeftLabel: 'Protein left',
    dayWorkoutsHeading: (date, isToday) => (isToday ? "Today's workouts" : `Workouts on ${date}`),
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
    eyebrow: 'Logowanie treningu',
    logTitle: 'Zapisz trening',
    logSubtitle: 'Dodaj sesję — Evo oceni wpływ na odżywianie i regenerację.',
    repeatLastTitle: 'Powtórz ostatni trening',
    repeatLastContent: (title, min, kcal) => `Ostatnia sesja: ${title} · ${min} min · ${kcal} kcal.`,
    useAsTemplate: 'Użyj jako szablon',
    dayLabel: 'Dzień wpisu',
    dayOptional: ' — opcjonalnie',
    dayHint: 'Domyślnie dziś. Zmień tylko przy imporcie lub logu z wcześniejszego dnia.',
    importTitle: 'Import z pliku',
    importSubtitle: 'Wgraj eksport Garmin/fitness (GPX, TCX, FIT). Evo sparsuje i zapisze sesję.',
    importNotesPlaceholder: 'Opcjonalna notatka do importu',
    importing: 'Importowanie…',
    importFile: 'Importuj plik treningu',
    workoutTitle: 'Nazwa treningu',
    titlePlaceholder: 'Np. siła góry + core',
    chipsTitle: 'Szablony treningów',
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
    tplUpper: 'Siła góry · 45 min · średnia',
    tplLower: 'Siła nóg · 50 min · wysoka',
    tplCardio: 'Interwały cardio · 30 min · wysoka',
    intensityLow: 'Niska',
    intensityMedium: 'Średnia',
    intensityHigh: 'Wysoka',
    netCaloriesLabel: 'Kalorie netto',
    burnedTodayLabel: 'Spalone dziś',
    burnedOnDateLabel: (date) => `Spalone (${date})`,
    proteinLeftLabel: 'Pozostałe białko',
    dayWorkoutsHeading: (date, isToday) => (isToday ? 'Treningi z dzisiejszego dnia' : `Treningi z dnia ${date}`),
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
