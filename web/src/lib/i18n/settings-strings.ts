import type { UiLocale } from './ui-locale';

export const settingsPageStrings: Record<
  UiLocale,
  {
    backToDashboard: string;
    save: string;
    saving: string;
    pageTitle: string;
    pageSubtitle: string;
    experienceTitle: string;
    experienceSubtitle: string;
    appLanguageTitle: string;
    appLanguageSubtitle: string;
    appLanguageBeta: string;
    betaTag: string;
    langEn: string;
    langPl: string;
  }
> = {
  en: {
    backToDashboard: 'Back to dashboard',
    save: 'Save settings',
    saving: 'Saving...',
    pageTitle: 'Settings',
    pageSubtitle: 'Configure account experience, Evo assistant behavior, and quick access tools.',
    experienceTitle: 'Experience settings',
    experienceSubtitle: 'Control how Evo sounds and how visible it is across the product.',
    appLanguageTitle: 'App language (beta)',
    appLanguageSubtitle: 'Navigation and key labels follow this choice. Evo insights and chat follow it when Polish is selected; in English, chat still adapts if you write in Polish.',
    appLanguageBeta: 'Beta: we are expanding translated screens. Report rough edges in feedback.',
    betaTag: 'Beta',
    langEn: 'English',
    langPl: 'Polish',
  },
  pl: {
    backToDashboard: 'Wróć do pulpitu',
    save: 'Zapisz ustawienia',
    saving: 'Zapisywanie…',
    pageTitle: 'Ustawienia',
    pageSubtitle: 'Konto, zachowanie Evo oraz szybkie integracje.',
    experienceTitle: 'Doświadczenie',
    experienceSubtitle: 'Jak brzmi Evo i jak bardzo jest widoczny w aplikacji.',
    appLanguageTitle: 'Język aplikacji (beta)',
    appLanguageSubtitle:
      'Nawigacja i wybrane etykiety podążają za tym wyborem. Insighty Evo i czat — po polsku, gdy wybierzesz polski; przy angielskim czat nadal dopasuje się, jeśli piszesz po polsku.',
    appLanguageBeta: 'Beta: tłumaczenia będą rosły. Daj znać, jeśli coś brzmi nienaturalnie.',
    betaTag: 'Beta',
    langEn: 'Angielski',
    langPl: 'Polski',
  },
};
