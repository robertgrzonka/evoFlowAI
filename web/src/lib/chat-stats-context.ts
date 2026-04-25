import { formatLocalDateKey, getBrowserIanaTimeZone } from '@/lib/calendar-date-key';

/**
 * Context for `sendMessage` so coach buckets match the device calendar + clock.
 * When `statsReference` is omitted or blank, uses **current local calendar day at call time**
 * (avoids stale React state around midnight or before interval ticks).
 */
export function buildChatStatsContext(statsReference?: string | null) {
  const trimmed = statsReference != null ? String(statsReference).trim() : '';
  return {
    statsReference: trimmed !== '' ? trimmed : formatLocalDateKey(new Date()),
    clientTimeZone: getBrowserIanaTimeZone(),
    clientNowMs: Date.now(),
  };
}
