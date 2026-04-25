const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** UTC calendar math for `YYYY-MM-DD` keys (same pattern as backend `weekRange`). */
export function addDaysToDateKey(dateKey: string, deltaDays: number): string {
  const raw = String(dateKey).trim();
  if (!DATE_KEY_RE.test(raw)) {
    throw new Error(`Invalid date key: ${dateKey}`);
  }
  const [y, mo, d] = raw.split('-').map(Number);
  const ms = Date.UTC(y, mo - 1, d + deltaDays);
  return new Date(ms).toISOString().slice(0, 10);
}

/** UTC “today” key (matches legacy API day bucketing when no client timezone is sent). */
export function utcTodayDateKey(): string {
  return new Date().toISOString().split('T')[0];
}

/** Local calendar `YYYY-MM-DD` in the user's browser (for coach + daily stats with `clientTimeZone`). */
export function formatLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** IANA timezone from the runtime (e.g. `Europe/Warsaw`). */
export function getBrowserIanaTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Last fully completed calendar day relative to UTC “today”.
 * Use as the end of rolling weekly stats so averages are not skewed by an open day.
 */
export function utcYesterdayDateKey(): string {
  return addDaysToDateKey(utcTodayDateKey(), -1);
}
