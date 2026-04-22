import type { UiLocale } from './ui-locale';

export function formatDayLabelUi(dateKey: string, locale: UiLocale): string {
  const d = new Date(`${dateKey}T12:00:00.000Z`);
  return new Intl.DateTimeFormat(locale === 'pl' ? 'pl-PL' : 'en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(d);
}

/** One-line heading for narrow week cards (avoids stacking + duplicate ISO row). */
export function formatDayWeekCardHeading(dateKey: string, locale: UiLocale): string {
  const d = new Date(`${dateKey}T12:00:00.000Z`);
  return new Intl.DateTimeFormat(locale === 'pl' ? 'pl-PL' : 'en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
  }).format(d);
}
