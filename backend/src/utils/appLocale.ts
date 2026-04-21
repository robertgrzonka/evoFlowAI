/** Stored on user preferences as lowercase; GraphQL exposes EN | PL. */
export const normalizeAppLocale = (raw?: string | null): 'en' | 'pl' => {
  const v = String(raw || 'en').toLowerCase();
  return v === 'pl' ? 'pl' : 'en';
};
