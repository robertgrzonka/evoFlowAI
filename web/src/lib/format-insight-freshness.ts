import type { UiLocale } from '@/lib/i18n/ui-locale';

type FreshnessCopy = { justNow: string; todayPrefix: (time: string) => string; dayAndTime: (d: string) => string };

/**
 * User-facing “when was this written” from cache `insightUpdatedAt` (ISO). No raw prompts.
 */
export function formatInsightFreshness(
  iso: string,
  nowMs: number,
  locale: UiLocale,
  copy: FreshnessCopy
): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const diffMin = (nowMs - t) / 60_000;
  if (diffMin >= 0 && diffMin < 2) return copy.justNow;

  const d = new Date(t);
  const now = new Date(nowMs);
  const sameCalDay =
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();

  const timeOnly = new Intl.DateTimeFormat(locale === 'pl' ? 'pl-PL' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);

  if (sameCalDay) return copy.todayPrefix(timeOnly);
  return copy.dayAndTime(
    new Intl.DateTimeFormat(locale === 'pl' ? 'pl-PL' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  );
}
