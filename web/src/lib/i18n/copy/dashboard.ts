import type { UiLocale } from '../ui-locale';

type MacroTitle = 'Calories' | 'Protein' | 'Carbs' | 'Fat';

const C = {
  en: {
    welcomeSub: 'One place for meals, training, and next steps from Evo.',
    welcomeName: (name: string) => `Welcome back, ${name}!`,
    missionEyebrow: 'Mission control',
    dailyBriefTitle: 'Evo daily brief',
    dailyBriefSubtitle: 'How you are doing, what is drifting, and what to do right now.',
    progressOnTrack: 'On track',
    progressWatch: 'Watch intake',
    progressInProgress: 'In progress',
    mainInsight: 'Main insight',
    quickReadTitle: 'Quick read from Evo',
    tipNutrition: 'Nutrition notice',
    tipTraining: 'Training notice',
    tipRecovery: 'Recovery notice',
    tipNutritionFallback: 'Prioritize protein and balanced carbs in your next meal.',
    tipTrainingFallback: 'Keep training quality high and avoid overdoing volume late in the day.',
    tipRecoveryFallback: 'Hydrate and support recovery with micronutrient-dense foods.',
    emptyTitle: 'Evo is waiting for enough context',
    emptyDesc: 'Log at least one meal or workout and Evo will build a focused daily brief.',
    emptyAction: 'Open meals',
    weeklyTitle: 'Weekly Evo review',
    weeklyLast7: 'Last 7 days',
    weeklyPartial: (avail: number, tracked: number) =>
      `Partial weekly review for ${avail}/7 available days (${tracked} tracked).`,
    weeklyEmpty: 'Weekly review will appear after more logs.',
    proTip: 'Pro tip',
    todayGoals: 'Today goals',
    todayGoalsSub: (date: string) => `Dynamic daily target and progress for ${date}`,
    setGoals: 'Set Goals',
    statCalories: 'Calories',
    statProtein: 'Protein',
    statCarbs: 'Carbs',
    statFat: 'Fat',
    quickActions: 'Quick actions',
    actionMealsTitle: 'Meals',
    actionMealsDesc: 'Describe meal or add photo',
    actionStatsTitle: 'View Stats',
    actionStatsDesc: 'Review history by day',
    actionGoalsTitle: 'Goal Settings',
    actionGoalsDesc: 'Adjust kcal and macros',
    todayMeals: 'Today meals',
    openMeals: 'Open Meals',
    deleteMeal: 'Delete meal',
    noMealsToday: 'No meals logged today',
    logFirstMeal: 'Log first meal',
    quickWorkout: 'Quick add workout',
    fullPage: 'Full page',
    workoutPlaceholder: 'e.g. Running or Push workout',
    minutesPh: 'minutes',
    kcalPh: 'kcal',
    intensityLow: 'Low',
    intensityMedium: 'Medium',
    intensityHigh: 'High',
    adding: 'Adding...',
    addWorkout: 'Add workout',
    dailySteps: 'Daily steps',
    trackedOnly: 'Tracked only',
    stepsPlaceholder: 'Steps today',
    savingSteps: 'Saving steps...',
    saveSteps: 'Save steps',
    todayTraining: 'Today training',
    seeAll: 'See all',
    noWorkoutsToday: 'No workouts yet today.',
    noGuidance: 'Log meals and workouts to unlock daily guidance.',
    evoWaiting: 'Evo status: Waiting for enough data.',
    evoTight: 'Evo status: Tight control mode.',
    evoProtein: 'Evo status: Protein-first mode.',
    evoRefuel: 'Evo status: Refuel and recover mode.',
    evoHighActivity: 'Evo status: High-activity day mode.',
    evoMomentum: 'Evo status: Keep the momentum.',
    sessionsOne: 'session',
    sessionsMany: 'sessions',
    noSessions: 'No sessions',
    metricGoal: 'Goal mode',
    metricMealsToday: 'Meals today',
    mealsLoggedWord: 'meals',
    metricTrainingToday: 'Training today',
    metricNetKcal: 'Net calories (food - workouts)',
    metricKcalLeft: 'Calories left for today',
    metricProteinLeft: 'Protein left for today',
    statGoalLine: 'Goal:',
    statPercentGoal: (n: string) => `${n}% of goal`,
    evoHintPrefix: 'Evo hint:',
    confirmDeleteMeal: 'Delete this meal entry?',
    workoutTitleMissing: 'Enter workout name before saving.',
    invalidSteps: 'Steps must be between 0 and 120000.',
    scoreNutrition: 'Nutrition',
    scoreTraining: 'Training',
    scoreConsistency: 'Consistency',
    nextStepEyebrow: 'Suggested next step',
  },
  pl: {
    welcomeSub: 'Posiłki, trening i kolejne kroki od Evo w jednym miejscu.',
    welcomeName: (name: string) => `Witaj ponownie, ${name}!`,
    missionEyebrow: 'Pulpit misji',
    dailyBriefTitle: 'Dzienny brief Evo',
    dailyBriefSubtitle: 'Jak idzie dzień, co odjeżdża i co zrobić teraz.',
    progressOnTrack: 'W normie',
    progressWatch: 'Uważaj na spożycie',
    progressInProgress: 'W toku',
    mainInsight: 'Główny insight',
    quickReadTitle: 'Szybki odczyt Evo',
    tipNutrition: 'Odżywianie',
    tipTraining: 'Trening',
    tipRecovery: 'Regeneracja',
    tipNutritionFallback: 'W następnym posiłku postaw na białko i zbalansowane węgle.',
    tipTrainingFallback: 'Utrzymaj jakość treningu, unikaj dokładania dużej objętości późnym wieczorem.',
    tipRecoveryFallback: 'Nawodnienie i mikroskładniki wspierające regenerację.',
    emptyTitle: 'Evo czeka na więcej danych',
    emptyDesc: 'Zaloguj choć jeden posiłek lub trening — Evo złoży dzienny brief.',
    emptyAction: 'Otwórz posiłki',
    weeklyTitle: 'Tygodniowy przegląd Evo',
    weeklyLast7: 'Ostatnie 7 dni',
    weeklyPartial: (avail: number, tracked: number) =>
      `Częściowy przegląd: ${avail}/7 dostępnych dni (${tracked} z logami).`,
    weeklyEmpty: 'Przegląd pojawi się po większej liczbie wpisów.',
    proTip: 'Pro tip',
    todayGoals: 'Cele na dziś',
    todayGoalsSub: (date: string) => `Dynamiczny cel i postęp na ${date}`,
    setGoals: 'Ustaw cele',
    statCalories: 'Kalorie',
    statProtein: 'Białko',
    statCarbs: 'Węglowodany',
    statFat: 'Tłuszcze',
    quickActions: 'Szybkie akcje',
    actionMealsTitle: 'Posiłki',
    actionMealsDesc: 'Opisz posiłek lub dodaj zdjęcie',
    actionStatsTitle: 'Statystyki',
    actionStatsDesc: 'Historia dnia po dniu',
    actionGoalsTitle: 'Cele',
    actionGoalsDesc: 'Kcal i makra',
    todayMeals: 'Dzisiejsze posiłki',
    openMeals: 'Otwórz posiłki',
    deleteMeal: 'Usuń posiłek',
    noMealsToday: 'Brak posiłków na dziś',
    logFirstMeal: 'Dodaj pierwszy posiłek',
    quickWorkout: 'Szybki trening',
    fullPage: 'Pełna strona',
    workoutPlaceholder: 'Np. bieg lub push',
    minutesPh: 'minuty',
    kcalPh: 'kcal',
    intensityLow: 'Niska',
    intensityMedium: 'Średnia',
    intensityHigh: 'Wysoka',
    adding: 'Dodawanie…',
    addWorkout: 'Dodaj trening',
    dailySteps: 'Kroki dziś',
    trackedOnly: 'Tylko śledzone',
    stepsPlaceholder: 'Kroki na dziś',
    savingSteps: 'Zapisywanie kroków…',
    saveSteps: 'Zapisz kroki',
    todayTraining: 'Trening dziś',
    seeAll: 'Zobacz wszystko',
    noWorkoutsToday: 'Brak treningów na dziś.',
    noGuidance: 'Zaloguj posiłki i trening, żeby odblokować dzienne wskazówki.',
    evoWaiting: 'Evo: czekam na więcej danych.',
    evoTight: 'Evo: tryb ścisłej kontroli.',
    evoProtein: 'Evo: priorytet białka.',
    evoRefuel: 'Evo: uzupełnij i regeneruj.',
    evoHighActivity: 'Evo: duża aktywność dziś.',
    evoMomentum: 'Evo: utrzymaj tempo.',
    sessionsOne: 'sesja',
    sessionsMany: 'sesje',
    noSessions: 'Brak sesji',
    metricGoal: 'Tryb celu',
    metricMealsToday: 'Posiłki dziś',
    mealsLoggedWord: 'posiłków',
    metricTrainingToday: 'Trening dziś',
    metricNetKcal: 'Kalorie netto (jedzenie − trening)',
    metricKcalLeft: 'Pozostałe kcal',
    metricProteinLeft: 'Pozostałe białko',
    statGoalLine: 'Cel:',
    statPercentGoal: (n: string) => `${n}% celu`,
    evoHintPrefix: 'Podpowiedź Evo:',
    confirmDeleteMeal: 'Usunąć ten wpis posiłku?',
    workoutTitleMissing: 'Podaj nazwę treningu przed zapisem.',
    invalidSteps: 'Kroki muszą być między 0 a 120000.',
    scoreNutrition: 'Odżywianie',
    scoreTraining: 'Trening',
    scoreConsistency: 'Konsekwencja',
    nextStepEyebrow: 'Sugerowany następny krok',
  },
} as const;

export type DashboardStrings = (typeof C)['en'];

export function getDashboardStrings(locale: UiLocale): DashboardStrings {
  return (locale === 'pl' ? C.pl : C.en) as DashboardStrings;
}

export function buildDashboardDynamicGuidance(
  locale: UiLocale,
  input: {
    remainingCalories: number;
    remainingProtein: number;
    workoutCount: number;
    steps: number;
    tips?: string[];
  }
): string {
  const { remainingCalories, remainingProtein, workoutCount, steps, tips = [] } = input;
  const nutritionTip = tips[0];
  const trainingTip = tips[1];
  const recoveryTip = tips[2];
  const pl = locale === 'pl';

  if (remainingCalories < -150) {
    if (remainingProtein > 20) {
      return (
        nutritionTip ||
        (pl
          ? 'Jesteś ponad budżetem kcal, ale nadal brakuje białka. Następny posiłek: mały i białkowy.'
          : 'You are over calorie budget, but still short on protein. Keep the next meal small and protein-focused.')
      );
    }
    return (
      recoveryTip ||
      (pl
        ? 'Jesteś ponad limitem kcal. Reszta dnia lekko, nawodnienie i regeneracja.'
        : 'You are over calorie budget today. Keep the rest of the day light and prioritize hydration plus recovery.')
    );
  }
  if (remainingProtein > 35) {
    if (remainingCalories < 250) {
      return (
        nutritionTip ||
        (pl
          ? 'Mało kcal w zapasie — szczupłe białko, że domknąć lukę bez przekroczenia.'
          : 'Calories are limited, so use a lean protein meal to close the protein gap without overshooting.')
      );
    }
    return (
      nutritionTip ||
      (pl
        ? 'Priorytet: białko. Następny posiłek ok. 30–40 g białka, potem dołóż węgle wg potrzeby.'
        : 'Main priority now is protein. Build your next meal around 30-40g protein, then fill with carbs as needed.')
    );
  }
  if (remainingCalories > 500) {
    if (workoutCount > 0) {
      return (
        trainingTip ||
        (pl
          ? 'Masz jeszcze spory zapas — zbalansowany posiłek po treningu pasuje teraz dobrze.'
          : 'You still have solid room today. A balanced post-training meal with protein and carbs fits well now.')
      );
    }
    return (
      nutritionTip ||
      (pl
        ? 'Duży zapas kcal — zbalansuj posiłkiem, żeby nie zjeść za mało do końca dnia.'
        : 'You have a lot of budget left. Go for a balanced meal now so you do not under-eat by the end of day.')
    );
  }
  if (steps > 12000 && remainingCalories > 150) {
    return (
      recoveryTip ||
      (pl
        ? 'Wysoka aktywność dziś — umiarkowany, zbalansowany posiłek to dobry następny ruch.'
        : 'Your activity is high today, so a moderate balanced meal is a good next move.')
    );
  }
  if (remainingCalories > 150) {
    return (
      nutritionTip ||
      (pl
        ? 'Umiarkowany, zbalansowany posiłek — kontrola porcji i domknięcie białka.'
        : 'A moderate balanced meal fits well now. Keep portions controlled and finish protein target.')
    );
  }
  return (
    recoveryTip ||
    (pl
      ? 'Koniec dnia blisko — lekko, z głową przy białku, focus na regenerację.'
      : 'Day is nearly closed. Keep the next intake light, protein-aware, and focus on recovery.')
  );
}

export function buildDashboardEvoPresence(
  locale: UiLocale,
  input: { remainingCalories: number; remainingProtein: number; workoutCount: number; steps: number }
): string {
  const t = getDashboardStrings(locale);
  const { remainingCalories, remainingProtein, workoutCount, steps } = input;
  if (remainingCalories < -150) return t.evoTight;
  if (remainingProtein > 30) return t.evoProtein;
  if (workoutCount > 0 && remainingCalories > 250) return t.evoRefuel;
  if (steps > 12000) return t.evoHighActivity;
  return t.evoMomentum;
}

export function buildDashboardNextAction(
  locale: UiLocale,
  input: {
    remainingCalories: number;
    remainingProtein: number;
    mealsCount: number;
    workoutCount: number;
  }
): { title: string; description: string; targetPath: string; actionLabel: string } {
  const { remainingCalories, remainingProtein, mealsCount, workoutCount } = input;
  const pl = locale === 'pl';
  if (remainingProtein > 35) {
    return {
      title: pl ? 'Najpierw domknij białko' : 'Close your protein gap first',
      description: pl
        ? `Zostało ok. ${Math.round(remainingProtein)} g białka. Jeden posiłek „białkowy” teraz.`
        : `You still have around ${Math.round(remainingProtein)}g protein to hit. Build one protein-first meal now.`,
      targetPath: '/meals',
      actionLabel: pl ? 'Zaloguj posiłek pod białko' : 'Log protein-focused meal',
    };
  }
  if (remainingCalories < -150) {
    return {
      title: pl ? 'Uspokój spożycie do końca dnia' : 'Stabilize intake for the rest of today',
      description: pl
        ? 'Jesteś ponad budżetem. Następny posiłek lekki, bez losowych przekąsek.'
        : 'You are above today budget. Keep the next meal light and avoid random snacking.',
      targetPath: '/chat?channel=COACH',
      actionLabel: pl ? 'Poproś Evo o plan korekty' : 'Ask Evo for correction plan',
    };
  }
  if (workoutCount === 0 && mealsCount >= 2 && remainingCalories > 350) {
    return {
      title: pl ? 'Jeszcze miejsce na sensowny ruch' : 'You still have room for useful movement',
      description: pl
        ? 'Krótki trening poprawi bilans i jakość regeneracji na jutro.'
        : 'A short workout can improve energy balance and recovery quality for tomorrow.',
      targetPath: '/workouts',
      actionLabel: pl ? 'Zaloguj szybki trening' : 'Log quick workout',
    };
  }
  return {
    title: pl ? 'Utrzymaj rytm' : 'Keep your current rhythm',
    description: pl
      ? 'Jesteś w niezłym miejscu. Jeden zbalansowany posiłek i czysta regeneracja domkną dzień.'
      : 'You are in a decent place. One balanced meal and clean recovery will close the day well.',
    targetPath: '/chat?channel=COACH',
    actionLabel: pl ? 'Plan Evo na koniec dnia' : 'Get Evo end-of-day plan',
  };
}

export function buildDashboardGoalHoverHint(
  locale: UiLocale,
  input: { title: MacroTitle; value: number; goal: number; unit: 'kcal' | 'g' }
): string {
  const { title, value, goal, unit } = input;
  const pl = locale === 'pl';
  if (!goal || goal <= 0) {
    return pl ? 'Dodaj więcej danych z dnia — wtedy dam precyzyjną rekomendację.' : 'Add more day data and I will provide a precise recommendation.';
  }
  const ratio = value / goal;
  const remaining = Math.max(0, goal - value);

  if (title === 'Calories') {
    if (ratio > 1.05)
      return pl
        ? `Powyżej celu o ok. ${Math.round(value - goal)} ${unit}. Następny posiłek lżejszy i białkowy.`
        : `You are over by ${Math.round(value - goal)} ${unit}. Keep next meal lighter and protein-focused.`;
    if (ratio < 0.65)
      return pl
        ? `Zostało ok. ${Math.round(remaining)} ${unit}. Dodaj zbalansowany posiłek, żeby nie niedożywiać.`
        : `You still have around ${Math.round(remaining)} ${unit}. Add a balanced meal to avoid underfueling.`;
    return pl ? 'Tempo kalorii OK. Kontroluj porcje i domknij dzień czysto.' : 'Calorie pace is solid. Keep portions controlled and close the day clean.';
  }
  if (title === 'Protein') {
    if (ratio < 0.7)
      return pl
        ? `Zostało ok. ${Math.round(remaining)} ${unit} białka. Postaw na chude źródła (kurczak, ryby, jogurt).`
        : `Around ${Math.round(remaining)} ${unit} left. Prioritize lean protein now (skyr, chicken, fish).`;
    if (ratio > 1.15)
      return pl
        ? 'Białko już ponad cel — następny posiłek: więcej warzyw i jakościowych węgli.'
        : 'Protein is already above target. Shift next meal toward vegetables and quality carbs.';
    return pl ? 'Białko w dobrym tempie. Jedna umiarkowana porcja powinna domknąć cel.' : 'Protein pace looks good. One moderate protein portion should close the target.';
  }
  if (title === 'Carbs') {
    if (ratio < 0.7)
      return pl
        ? `Zostało ok. ${Math.round(remaining)} ${unit} węgli. Dobre źródła wokół aktywności (ryż, płatki, ziemniaki).`
        : `About ${Math.round(remaining)} ${unit} left. Use quality carbs around activity (rice, oats, potatoes).`;
    if (ratio > 1.1)
      return pl
        ? 'Węgle wysoko — następny posiłek niżej w węglach, wyżej w białku i błonniku.'
        : 'Carbs are running high. Keep next meal lower-carb and higher in protein/fiber.';
    return pl ? 'Węgle w normie. Trzymaj się głównie pełnych produktów.' : 'Carbs are on track. Keep sources mostly whole-food and easy to digest.';
  }
  if (title === 'Fat') {
    if (ratio < 0.7)
      return pl
        ? `Zostało ok. ${Math.round(remaining)} ${unit} tłuszczu. Zdrowe tłuszcze: oliwa, orzechy, ryby tłuste.`
        : `About ${Math.round(remaining)} ${unit} left. Prefer healthy fats like olive oil, nuts, seeds, or fatty fish.`;
    if (ratio > 1.1)
      return pl
        ? 'Tłuszcz ponad cel — następny posiłek chudszy, uważaj na ukryte oleje i sosy.'
        : 'Fat is above target. Keep next meal leaner and watch hidden oils/sauces.';
    return pl ? 'Tłuszcze wyglądają OK. Stabilne porcje i dobre źródła.' : 'Fat looks balanced. Keep quality sources and stable portions.';
  }
  return pl ? 'Brak danych do podpowiedzi.' : 'No hint for this metric.';
}
