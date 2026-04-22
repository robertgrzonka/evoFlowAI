import type { UiLocale } from '../ui-locale';

export const goalsPageCopy: Record<
  UiLocale,
  {
    pageTitle: string;
    pageSubtitle: string;
    strategyNote: string;
    restingCalories: string;
    weeklyWorkouts: string;
    weeklyActiveMinutes: string;
    activityLevel: string;
    primaryGoal: string;
    goalBasedTitle: string;
    goalBasedLine: (goalLabel: string, suggested: number, deltaText: string) => string;
    applySuggested: string;
    evoNoteCalories: string;
    savingGoals: string;
    saveGoals: string;
    proteinGoal: string;
    carbsGoal: string;
    fatGoal: string;
    primaryGoalCard: string;
    workoutsPerWeek: string;
    activeMinPerWeek: string;
    eyebrow: string;
    aiTitle: string;
    aiSubtitle: string;
    chipsTitle: string;
    yourContext: string;
    aiPlaceholder: string;
    aiSetting: string;
    setWithAi: string;
    latestEvo: string;
    invalidCalories: string;
    invalidWorkouts: string;
    invalidMinutes: string;
    addContext: string;
    chip1: string;
    chip2: string;
    chip3: string;
    activitySedentary: string;
    activityLight: string;
    activityModerate: string;
    activityActive: string;
    activityVeryActive: string;
  }
> = {
  en: {
    pageTitle: 'Goal Settings',
    pageSubtitle:
      'Set your resting calorie baseline and activity goals manually. Daily calorie budget scales dynamically with logged workouts.',
    strategyNote: 'Strategy note',
    restingCalories: 'Resting calories (base)',
    weeklyWorkouts: 'Weekly workouts',
    weeklyActiveMinutes: 'Weekly active minutes',
    activityLevel: 'Activity level',
    primaryGoal: 'Primary goal',
    goalBasedTitle: 'Goal-based suggestion',
    goalBasedLine: (goalLabel, suggested, deltaText) =>
      `For ${goalLabel}, suggested base is ${suggested} kcal (${deltaText} vs maintenance baseline).`,
    applySuggested: 'Apply suggested base calories',
    evoNoteCalories: 'Evo note: calories can be dynamic by day, but your macro goals below stay stable.',
    savingGoals: 'Saving goals...',
    saveGoals: 'Save goals',
    proteinGoal: 'Protein Goal',
    carbsGoal: 'Carbs Goal',
    fatGoal: 'Fat Goal',
    primaryGoalCard: 'Primary Goal',
    workoutsPerWeek: 'Workouts / Week',
    activeMinPerWeek: 'Active Minutes / Week',
    eyebrow: 'Evo guidance',
    aiTitle: 'Evo Goal Coach',
    aiSubtitle: 'Set direction manually, then let Evo shape details around your routine.',
    chipsTitle: 'Try one of these contexts',
    yourContext: 'Your context',
    aiPlaceholder: 'Example: I train 4 times a week and want to lose fat slowly while keeping muscle.',
    aiSetting: 'AI is setting goals...',
    setWithAi: 'Set goals with AI coach',
    latestEvo: 'Latest Evo update',
    invalidCalories: 'Daily calorie goal must be between 800 and 5000.',
    invalidWorkouts: 'Weekly workouts goal must be between 0 and 14.',
    invalidMinutes: 'Weekly active minutes goal must be between 0 and 2000.',
    addContext: 'Describe your routine so Evo can suggest better goals.',
    chip1: 'I work at a desk and walk around 6k steps daily. I want gradual fat loss.',
    chip2: 'I train strength 4 times per week and want to build muscle with minimal fat gain.',
    chip3: 'I do cardio 5x weekly and need goals that keep energy high.',
    activitySedentary: 'Sedentary',
    activityLight: 'Light',
    activityModerate: 'Moderate',
    activityActive: 'Active',
    activityVeryActive: 'Very Active',
  },
  pl: {
    pageTitle: 'Cele',
    pageSubtitle:
      'Ustaw bazę kcal spoczynkową i cele aktywności ręcznie. Dzienny budżet kalorii skaluje się z zalogowanymi treningami.',
    strategyNote: 'Notatka strategiczna',
    restingCalories: 'Kalorie spoczynkowe (baza)',
    weeklyWorkouts: 'Treningi w tygodniu',
    weeklyActiveMinutes: 'Aktywne minuty / tydzień',
    activityLevel: 'Poziom aktywności',
    primaryGoal: 'Główny cel',
    goalBasedTitle: 'Sugestia wg celu',
    goalBasedLine: (goalLabel, suggested, deltaText) =>
      `Dla ${goalLabel} sugerowana baza to ${suggested} kcal (${deltaText} względem utrzymania).`,
    applySuggested: 'Zastosuj sugerowaną bazę kcal',
    evoNoteCalories: 'Evo: kcal mogą być dynamiczne z dnia na dzień, makra poniżej zostają stabilne.',
    savingGoals: 'Zapisywanie…',
    saveGoals: 'Zapisz cele',
    proteinGoal: 'Cel białka',
    carbsGoal: 'Cel węglowodanów',
    fatGoal: 'Cel tłuszczów',
    primaryGoalCard: 'Główny cel',
    workoutsPerWeek: 'Treningi / tydzień',
    activeMinPerWeek: 'Aktywne minuty / tydzień',
    eyebrow: 'Wskazówki Evo',
    aiTitle: 'Evo — cele',
    aiSubtitle: 'Ustal kierunek ręcznie, potem Evo dopasuje szczegóły do Twojej rutyny.',
    chipsTitle: 'Gotowe konteksty',
    yourContext: 'Twój kontekst',
    aiPlaceholder: 'Np. trenuję 4× w tygodniu i chcę spalać tłuszcz wolno, zachowując mięśnie.',
    aiSetting: 'AI ustawia cele…',
    setWithAi: 'Ustaw cele z AI',
    latestEvo: 'Ostatnia wiadomość Evo',
    invalidCalories: 'Dzienny cel kalorii: 800–5000 kcal.',
    invalidWorkouts: 'Cel treningów w tygodniu: 0–14.',
    invalidMinutes: 'Cel aktywnych minut: 0–2000.',
    addContext: 'Opisz rutynę, żeby Evo mógł zasugerować lepsze cele.',
    chip1: 'Praca przy biurku, ok. 6k kroków dziennie. Chcę stopniową redukcję tkanki tłuszczowej.',
    chip2: 'Siła 4× w tygodniu, chcę masę z minimalnym przyrostem tłuszczu.',
    chip3: 'Cardio 5× w tygodniu, potrzebuję celów pod wysoką energię.',
    activitySedentary: 'Siedzący',
    activityLight: 'Lekka',
    activityModerate: 'Umiarkowana',
    activityActive: 'Wysoka',
    activityVeryActive: 'Bardzo wysoka',
  },
};

export const primaryGoalOptionLabels: Record<UiLocale, Record<string, string>> = {
  en: {
    FAT_LOSS: 'Fat loss',
    MAINTENANCE: 'Maintenance',
    MUSCLE_GAIN: 'Muscle gain',
    STRENGTH: 'Strength',
  },
  pl: {
    FAT_LOSS: 'Redukcja',
    MAINTENANCE: 'Utrzymanie',
    MUSCLE_GAIN: 'Masa',
    STRENGTH: 'Siła',
  },
};

export function getGoalMicrocopyLocalized(goal: string, locale: UiLocale): string {
  const g = String(goal || '').toUpperCase();
  if (locale === 'pl') {
    switch (g) {
      case 'FAT_LOSS':
        return 'Umiarkowany deficyt, priorytet białka i sytości — żeby nie ucierpiała forma.';
      case 'MUSCLE_GAIN':
        return 'Kontrolowana nadwyżka, stabilne białko i progres treningowy.';
      case 'STRENGTH':
        return 'Energia wokół ciężkich sesji, węgle przy mocnych treningach, pilnuj regeneracji.';
      default:
        return 'Stabilny bilans i rytm treningów — utrzymanie składu i wydolności.';
    }
  }
  switch (g) {
    case 'FAT_LOSS':
      return 'Keep a moderate deficit and prioritize protein + satiety meals to preserve performance.';
    case 'MUSCLE_GAIN':
      return 'Use a controlled surplus, hit protein targets daily, and keep training progression consistent.';
    case 'STRENGTH':
      return 'Fuel around sessions, keep carbs around harder workouts, and monitor recovery quality.';
    default:
      return 'Aim for stable intake and consistent training rhythm to maintain composition and performance.';
  }
}
