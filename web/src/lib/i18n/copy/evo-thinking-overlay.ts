import type { UiLocale } from '@/lib/i18n/ui-locale';

export type EvoThinkingOverlayStrings = {
  title: string;
  subtitle: string;
  rotating: string[];
  /** One extra beat if the request runs longer than expected (shown instead of looping). */
  longWaitHint: string;
};

/** `default` = dashboard insight / chat; `meal` / `mealImage` / `workout` = quick log flows. */
export type EvoThinkingIntent = 'default' | 'meal' | 'mealImage' | 'workout';

const enDefault: EvoThinkingOverlayStrings = {
  title: 'Evo is thinking',
  subtitle: 'Your coach model may take a few extra seconds — worth the sharper read.',
  rotating: [
    'Cross-checking your numbers with today’s plan…',
    'Skipping generic pep talk…',
    'Tuning the tone you picked in settings…',
    'Connecting meals, training, and what’s left in the day…',
    'Almost there — tightening the takeaway…',
  ],
  longWaitHint:
    'Still on it — the model is being thorough. Nothing’s wrong; you can keep this tab open.',
};

const plDefault: EvoThinkingOverlayStrings = {
  title: 'Evo myśli',
  subtitle: 'Prostszy model bywa szybszy — ten dokłada chwilę, ale czyta dzień głębiej.',
  rotating: [
    'Sprawdzam liczby względem Twojego planu na dziś…',
    'Odrzucam pusty motywacyjny szum…',
    'Trzymam ton z ustawień (supportive / direct)…',
    'Spinam posiłki, trening i to, co zostało z dnia…',
    'Już prawie — dociągam konkretną myśl…',
  ],
  longWaitHint:
    'Nadal pracuję — model dokłada szczegóły. Wszystko OK, możesz spokojnie poczekać w tej karcie.',
};

const enMeal: EvoThinkingOverlayStrings = {
  title: 'Evo is thinking',
  subtitle: 'Reading your meal (text or photo) and turning it into clean macros.',
  rotating: [
    'Parsing ingredients and portion cues…',
    'Estimating calories, protein, carbs, fat…',
    'Sanity-checking against your day so far…',
    'Almost ready to log this to your timeline…',
  ],
  longWaitHint:
    'Vision + macros can take a bit on a busy day — hang tight, your meal is still in the queue.',
};

const plMeal: EvoThinkingOverlayStrings = {
  title: 'Evo myśli',
  subtitle: 'Czytam posiłek (tekst lub zdjęcie) i zamieniam go w sensowne makra.',
  rotating: [
    'Wyciągam składniki i wielkość porcji…',
    'Szacuję kalorie, białko, węgle i tłuszcz…',
    'Porównuję z resztą Twojego dnia…',
    'Już prawie — zapisuję wpis w timeline…',
  ],
  longWaitHint:
    'Analiza zdjęcia i makr bywa chwilę dłuższa — nic się nie zepsuło, dokończę za moment.',
};

const enMealImage: EvoThinkingOverlayStrings = {
  title: 'Evo is thinking',
  subtitle: 'Image logging estimates ingredients and portions — worth a second look at sauces, fats, and size.',
  rotating: [
    'Reading the meal photo…',
    'Spotting main ingredients…',
    'Estimating portion and macros…',
    'Flagging what may need a human check…',
  ],
  longWaitHint: 'Photo + vision can take a bit longer on busy days — your meal is still in progress.',
};

const plMealImage: EvoThinkingOverlayStrings = {
  title: 'Evo myśli',
  subtitle:
    'Z logowania ze zdjęcia wychodzi szacunek składników i porcji — warto dopracować sosy, tłuszcze i wielkość porcji.',
  rotating: [
    'Odczytuję zdjęcie posiłku…',
    'Rozpoznaję główne składniki…',
    'Szacuję porcję i makro…',
    'Zaznaczam elementy wymagające sprawdzenia…',
  ],
  longWaitHint:
    'Wizja + makra potrafią chwilę dłużej — wszystko w porządku, Twój wpis wciąż jest przetwarzany.',
};

const enWorkout: EvoThinkingOverlayStrings = {
  title: 'Evo is thinking',
  subtitle: 'Saving your session and refreshing today’s training picture.',
  rotating: [
    'Locking in duration, burn, and intensity…',
    'Syncing with your weekly training stats…',
    'Updating what’s left in the day…',
    'Almost there…',
  ],
  longWaitHint:
    'Sync is slower than usual — your workout is still saving; no need to tap again.',
};

const plWorkout: EvoThinkingOverlayStrings = {
  title: 'Evo myśli',
  subtitle: 'Zapisuję trening i odświeżam obraz Twojego dnia sportowego.',
  rotating: [
    'Zapisuję czas, spalenie i intensywność…',
    'Spinam to z tygodniowym podsumowaniem…',
    'Już prawie gotowe…',
  ],
  longWaitHint:
    'Synchronizacja trwa dłużej niż zwykle — trening się zapisuje, nie trzeba klikać drugi raz.',
};

export function getEvoThinkingOverlayStrings(
  locale: UiLocale,
  intent: EvoThinkingIntent = 'default'
): EvoThinkingOverlayStrings {
  if (intent === 'mealImage') return locale === 'pl' ? plMealImage : enMealImage;
  if (intent === 'meal') return locale === 'pl' ? plMeal : enMeal;
  if (intent === 'workout') return locale === 'pl' ? plWorkout : enWorkout;
  return locale === 'pl' ? plDefault : enDefault;
}
