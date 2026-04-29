import type { UiLocale } from '../ui-locale';

/** Short, friendly copy for AI-generated surfaces (EN/PL). */
export type AiTransparencyStrings = {
  defaultTitle: string;
  defaultBody: string;
  /** Shown on `<summary>` when details are collapsed. */
  learnMoreLabel: string;
  /** Shown on `<summary>` when details are open. */
  learnLessLabel: string;
  learnMoreDetails: string;
};

const STRINGS: Record<UiLocale, AiTransparencyStrings> = {
  en: {
    defaultTitle: 'How Evo uses AI',
    defaultBody:
      'Evo looks at the logs and data available in the app to suggest next steps. Suggestions can be incomplete or off — this is support, not medical advice. You can review, adjust, or ignore any recommendation.',
    learnMoreLabel: 'More',
    learnLessLabel: 'Less',
    learnMoreDetails:
      'Macro and meal estimates are based on what you log (including photos) and are not lab measurements. If something does not look right, edit the entry, log again, or ask Evo in chat.',
  },
  pl: {
    defaultTitle: 'Jak Evo korzysta z AI',
    defaultBody:
      'Evo analizuje Twoje logi i dane dostępne w aplikacji, żeby zaproponować kolejne kroki. Sugestie bywają niepełne lub mylne — to wsparcie, nie porada medyczna. Możesz każdą rekomendację sprawdzić, poprawić albo odrzucić.',
    learnMoreLabel: 'Więcej',
    learnLessLabel: 'Mniej',
    learnMoreDetails:
      'Szacunki makro i posiłków opierają się na tym, co zalogujesz (także ze zdjęć), a nie na badaniach laboratoryjnych. Gdy coś wygląda nie tak — popraw wpis, zaloguj ponownie albo dopytaj Evo na czacie.',
  },
};

export function getAiTransparencyStrings(locale: UiLocale): AiTransparencyStrings {
  return STRINGS[locale];
}
