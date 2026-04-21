/** Matches GraphQL `AppLocale` (EN | PL) and stored preference. */
export type UiLocale = 'en' | 'pl';

export function graphqlAppLocaleToUi(raw?: string | null): UiLocale {
  return String(raw || 'EN').toUpperCase() === 'PL' ? 'pl' : 'en';
}
