import type { UiLocale } from '../ui-locale';
import { inferCalorieGoalTone, type InferredPrimaryGoalTone } from '@evoflowai/shared';

export const goalsPageCopy: Record<
  UiLocale,
  {
    pageTitle: string;
    pageSubtitle: string;
    sectionDirection: string;
    sectionTargets: string;
    sectionCalorieAssist: string;
    restingCalories: string;
    weeklyWorkouts: string;
    weeklyActiveMinutes: string;
    activityLevel: string;
    primaryGoal: string;
    primaryGoalPlaceholder: string;
    startingBudgetLine: (base: number, delta: number, total: number) => string;
    suggestedBaselineLine: (suggested: number, strategyLabel: string) => string;
    applySuggested: string;
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
    evoSetting: string;
    setWithEvo: string;
    latestEvo: string;
    draftChangesBanner: string;
    invalidCalories: string;
    invalidWorkouts: string;
    invalidMinutes: string;
    invalidPrimaryGoal: string;
    invalidProteinTitle: string;
    invalidCarbsTitle: string;
    invalidFatTitle: string;
    invalidProtein: string;
    invalidCarbs: string;
    invalidFat: string;
    addContext: string;
    chip1: string;
    chip2: string;
    chip3: string;
    activitySedentary: string;
    activityLight: string;
    activityModerate: string;
    activityActive: string;
    activityVeryActive: string;
    snapshotTitle: string;
    sessionExpiredTitle: string;
    sessionExpiredBody: string;
    invalidCalorieTargetTitle: string;
    invalidWorkoutsTargetTitle: string;
    invalidActiveMinutesTargetTitle: string;
    invalidPrimaryGoalTitle: string;
    addContextTitle: string;
    goalsSavedTitle: string;
    goalsSavedBody: string;
    goalsSaveFailedTitle: string;
    goalsSaveFailedBody: string;
    aiGoalsSavedTitle: string;
    aiGoalsSavedBody: string;
    aiGoalsSaveFailedTitle: string;
    aiGoalsSaveFailedBody: string;
    aiDefaultSuccessMessage: string;
  }
> = {
  en: {
    pageTitle: 'Goals',
    pageSubtitle: 'Set your direction and numbers, then save. Evo on the right can rebuild everything from a short description.',
    sectionDirection: 'Direction',
    sectionTargets: 'Targets',
    sectionCalorieAssist: 'Calories from your wording',
    restingCalories: 'Baseline calories',
    weeklyWorkouts: 'Workouts / week',
    weeklyActiveMinutes: 'Active min / week',
    activityLevel: 'Activity level',
    primaryGoal: 'Primary goal',
    primaryGoalPlaceholder: 'e.g. slow fat loss, desk job, training 3× week',
    startingBudgetLine: (base, delta, total) =>
      `~${total} kcal starting budget (${base} baseline ${delta >= 0 ? '+' : ''}${delta} from goal) — before today’s activity.`,
    suggestedBaselineLine: (suggested, strategyLabel) =>
      `${strategyLabel} · suggested resting ${suggested} kcal`,
    applySuggested: 'Apply & save',
    savingGoals: 'Saving…',
    saveGoals: 'Save goals',
    proteinGoal: 'Protein',
    carbsGoal: 'Carbs',
    fatGoal: 'Fat',
    primaryGoalCard: 'Primary goal',
    workoutsPerWeek: 'Workouts / week',
    activeMinPerWeek: 'Active min / week',
    eyebrow: 'Coach',
    aiTitle: 'Evo',
    aiSubtitle: 'Uses your last saved profile — save the form first if you changed numbers.',
    chipsTitle: 'Examples',
    yourContext: 'Describe your situation',
    aiPlaceholder: 'Training schedule, job, what you want to change…',
    evoSetting: 'Updating…',
    setWithEvo: 'Update with Evo',
    latestEvo: 'Note from Evo',
    draftChangesBanner: 'Unsaved changes — snapshot shows last saved plan.',
    invalidCalories: 'Daily calories: 800–5000.',
    invalidWorkouts: 'Weekly workouts: 0–14.',
    invalidMinutes: 'Active minutes: 0–2000.',
    invalidPrimaryGoal: 'Primary goal: max 400 characters.',
    invalidProteinTitle: 'Protein',
    invalidCarbsTitle: 'Carbs',
    invalidFatTitle: 'Fat',
    invalidProtein: 'Protein: 30–500 g.',
    invalidCarbs: 'Carbs: 20–900 g.',
    invalidFat: 'Fat: 15–400 g.',
    addContext: 'Add a short description for Evo.',
    chip1: 'Desk job, ~6k steps, gradual fat loss.',
    chip2: 'Strength 4×/week, lean muscle gain.',
    chip3: 'Cardio 5×/week, high energy.',
    activitySedentary: 'Sedentary',
    activityLight: 'Light',
    activityModerate: 'Moderate',
    activityActive: 'Active',
    activityVeryActive: 'Very active',
    snapshotTitle: 'Last saved',
    sessionExpiredTitle: 'Session expired',
    sessionExpiredBody: 'Please sign in again.',
    invalidCalorieTargetTitle: 'Calories',
    invalidWorkoutsTargetTitle: 'Workouts',
    invalidActiveMinutesTargetTitle: 'Active minutes',
    invalidPrimaryGoalTitle: 'Primary goal',
    addContextTitle: 'Context',
    goalsSavedTitle: 'Saved',
    goalsSavedBody: 'Your goals are stored.',
    goalsSaveFailedTitle: 'Could not save',
    goalsSaveFailedBody: 'Try again.',
    aiGoalsSavedTitle: 'Updated',
    aiGoalsSavedBody: 'Goals match your description.',
    aiGoalsSaveFailedTitle: 'Update failed',
    aiGoalsSaveFailedBody: 'Check connection or shorten text.',
    aiDefaultSuccessMessage: 'Goals updated.',
  },
  pl: {
    pageTitle: 'Cele',
    pageSubtitle: 'Ustal kierunek i liczby, potem zapisz. Evo po prawej może ustawić wszystko z krótkiego opisu.',
    sectionDirection: 'Kierunek',
    sectionTargets: 'Liczby',
    sectionCalorieAssist: 'Kalorie z brzmienia celu',
    restingCalories: 'Baza kcal',
    weeklyWorkouts: 'Treningi / tydzień',
    weeklyActiveMinutes: 'Aktywne min / tydzień',
    activityLevel: 'Poziom aktywności',
    primaryGoal: 'Główny cel',
    primaryGoalPlaceholder: 'np. wolna redukcja, praca biurowa, trening 3× w tyg.',
    startingBudgetLine: (base, delta, total) =>
      `Ok. ${total} kcal na start (${base} baza ${delta >= 0 ? '+' : ''}${delta} z celu) — bez dzisiejszej aktywności.`,
    suggestedBaselineLine: (suggested, strategyLabel) =>
      `${strategyLabel} · sugerowana baza ${suggested} kcal`,
    applySuggested: 'Zastosuj i zapisz',
    savingGoals: 'Zapisywanie…',
    saveGoals: 'Zapisz cele',
    proteinGoal: 'Białko',
    carbsGoal: 'Węglowodany',
    fatGoal: 'Tłuszcze',
    primaryGoalCard: 'Główny cel',
    workoutsPerWeek: 'Treningi / tydzień',
    activeMinPerWeek: 'Aktywne min / tydzień',
    eyebrow: 'Coach',
    aiTitle: 'Evo',
    aiSubtitle: 'Korzysta z ostatniego zapisanego profilu — po zmianach liczb najpierw zapisz formularz.',
    chipsTitle: 'Przykłady',
    yourContext: 'Opisz sytuację',
    aiPlaceholder: 'Plan treningów, praca, co chcesz zmienić…',
    evoSetting: 'Aktualizacja…',
    setWithEvo: 'Ustaw z Evo',
    latestEvo: 'Wiadomość od Evo',
    draftChangesBanner: 'Niezapisane zmiany — podgląd to ostatni zapis.',
    invalidCalories: 'Kalorie dziennie: 800–5000.',
    invalidWorkouts: 'Treningi w tygodniu: 0–14.',
    invalidMinutes: 'Aktywne minuty: 0–2000.',
    invalidPrimaryGoal: 'Główny cel: maks. 400 znaków.',
    invalidProteinTitle: 'Białko',
    invalidCarbsTitle: 'Węglowodany',
    invalidFatTitle: 'Tłuszcze',
    invalidProtein: 'Białko: 30–500 g.',
    invalidCarbs: 'Węglowodany: 20–900 g.',
    invalidFat: 'Tłuszcze: 15–400 g.',
    addContext: 'Dodaj krótki opis dla Evo.',
    chip1: 'Biurko, ~6k kroków, spokojna redukcja.',
    chip2: 'Siła 4×/tydz., masa bez zbędnego tłuszczu.',
    chip3: 'Cardio 5×/tydz., dużo energii.',
    activitySedentary: 'Siedzący',
    activityLight: 'Lekka',
    activityModerate: 'Umiarkowana',
    activityActive: 'Wysoka',
    activityVeryActive: 'Bardzo wysoka',
    snapshotTitle: 'Ostatni zapis',
    sessionExpiredTitle: 'Sesja wygasła',
    sessionExpiredBody: 'Zaloguj się ponownie.',
    invalidCalorieTargetTitle: 'Kalorie',
    invalidWorkoutsTargetTitle: 'Treningi',
    invalidActiveMinutesTargetTitle: 'Aktywne minuty',
    invalidPrimaryGoalTitle: 'Główny cel',
    addContextTitle: 'Kontekst',
    goalsSavedTitle: 'Zapisano',
    goalsSavedBody: 'Cele są zapisane.',
    goalsSaveFailedTitle: 'Błąd zapisu',
    goalsSaveFailedBody: 'Spróbuj ponownie.',
    aiGoalsSavedTitle: 'Zaktualizowano',
    aiGoalsSavedBody: 'Cele dopasowano do opisu.',
    aiGoalsSaveFailedTitle: 'Nie udało się',
    aiGoalsSaveFailedBody: 'Sprawdź połączenie lub skróć tekst.',
    aiDefaultSuccessMessage: 'Cele zaktualizowane.',
  },
};

export function inferredStrategyLabel(tone: InferredPrimaryGoalTone, locale: UiLocale): string {
  if (locale === 'pl') {
    switch (tone) {
      case 'fat_loss':
        return 'Redukcja';
      case 'light_deficit':
        return 'Lekki deficyt';
      case 'muscle_gain':
        return 'Masa';
      case 'strength':
        return 'Siła';
      default:
        return 'Utrzymanie';
    }
  }
  switch (tone) {
    case 'fat_loss':
      return 'Fat loss';
    case 'light_deficit':
      return 'Mild deficit';
    case 'muscle_gain':
      return 'Muscle gain';
    case 'strength':
      return 'Strength';
    default:
      return 'Maintenance';
  }
}

function microcopyForInferredTone(tone: InferredPrimaryGoalTone, locale: UiLocale): string {
  if (locale === 'pl') {
    switch (tone) {
      case 'fat_loss':
        return 'Priorytet: białko i umiarkowany deficyt.';
      case 'light_deficit':
        return 'Mały deficyt — pilnuj białka i rutyny.';
      case 'muscle_gain':
        return 'Nadwyżka pod progres w treningu.';
      case 'strength':
        return 'Więcej paliwa wokół ciężkich sesji.';
      default:
        return 'Stabilny rytm i bilans.';
    }
  }
  switch (tone) {
    case 'fat_loss':
      return 'Prioritize protein and a steady deficit.';
    case 'light_deficit':
      return 'Small deficit — keep protein and habits consistent.';
    case 'muscle_gain':
      return 'Controlled surplus for training progression.';
    case 'strength':
      return 'Extra fuel around hard sessions.';
    default:
      return 'Steady rhythm and balance.';
  }
}

export function getGoalMicrocopyLocalized(goal: string, locale: UiLocale): string {
  const raw = String(goal || '').trim();
  const slug = raw.toLowerCase().replace(/\s+/g, '_');
  const isPresetSlug = ['fat_loss', 'maintenance', 'muscle_gain', 'strength'].includes(slug);
  if (!isPresetSlug && raw.length > 0) {
    return locale === 'pl' ? 'Evo dopasuje coaching do tego opisu.' : 'Evo will align coaching with this.';
  }
  return microcopyForInferredTone(inferCalorieGoalTone(goal), locale);
}
