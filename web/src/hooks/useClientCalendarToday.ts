'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatLocalDateKey, getBrowserIanaTimeZone } from '@/lib/calendar-date-key';

/**
 * Local calendar day + device IANA zone. Refreshes on focus/visibility and on an interval
 * so `/chat` and day queries stay aligned with “today” after midnight.
 */
export function useClientCalendarToday(): { dateKey: string; timeZone: string; syncNow: () => void } {
  const [timeZone] = useState(getBrowserIanaTimeZone);
  const [dateKey, setDateKey] = useState(() => formatLocalDateKey(new Date()));

  const syncNow = useCallback(() => {
    setDateKey(formatLocalDateKey(new Date()));
  }, []);

  useEffect(() => {
    syncNow();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') syncNow();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', syncNow);
    const id = window.setInterval(syncNow, 15_000);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', syncNow);
      window.clearInterval(id);
    };
  }, [syncNow]);

  return { dateKey, timeZone, syncNow };
}
