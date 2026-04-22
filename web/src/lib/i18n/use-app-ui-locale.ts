'use client';

import { useQuery } from '@apollo/client';
import { ME_QUERY } from '@/lib/graphql/queries';
import { graphqlAppLocaleToUi, type UiLocale } from './ui-locale';

/** Reads `preferences.appLocale` from Apollo cache (shared with AppShell / pages using ME_QUERY). */
export function useAppUiLocale(): UiLocale {
  const { data } = useQuery(ME_QUERY, { fetchPolicy: 'cache-first' });
  return graphqlAppLocaleToUi(data?.me?.preferences?.appLocale);
}
