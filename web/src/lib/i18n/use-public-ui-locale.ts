'use client';

import { useEffect, useState } from 'react';
import type { UiLocale } from './ui-locale';

const STORAGE_KEY = 'evoflowai_public_locale';

function readLocale(): UiLocale {
  if (typeof window === 'undefined') return 'en';
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'pl' || raw === 'en') return raw;
  } catch {
    /* ignore */
  }
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('pl')) {
    return 'pl';
  }
  return 'en';
}

/** For pages without `ME_QUERY` (login/register/reset). Synced when user saves Settings. */
export function usePublicUiLocale(): UiLocale {
  const [locale, setLocale] = useState<UiLocale>('en');

  useEffect(() => {
    setLocale(readLocale());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setLocale(readLocale());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return locale;
}

export function persistPublicUiLocale(locale: UiLocale): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: locale }));
  } catch {
    /* ignore */
  }
}
