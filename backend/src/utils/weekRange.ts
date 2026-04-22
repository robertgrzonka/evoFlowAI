const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Calendar add in UTC for a `YYYY-MM-DD` key (DST-safe). */
export const addDaysToDateKey = (dateKey: string, deltaDays: number): string => {
  const [y, mo, d] = dateKey.split('-').map(Number);
  const ms = Date.UTC(y, mo - 1, d + deltaDays);
  return new Date(ms).toISOString().slice(0, 10);
};

/** Seven `YYYY-MM-DD` strings from week start through `endKey` inclusive (`endKey` is the last day). */
export const buildWeekDateKeys = (endKey: string): string[] => {
  const startKey = addDaysToDateKey(endKey, -6);
  return Array.from({ length: 7 }, (_, i) => addDaysToDateKey(startKey, i));
};

export type WeekRangeUtc = {
  /** UTC midnight of first calendar day (inclusive). */
  startDate: Date;
  /** UTC midnight of the day after the last calendar day (exclusive Mongo upper bound). */
  nextDay: Date;
  startKey: string;
  endKey: string;
  /** Last millisecond of `endKey` in UTC — for span calculations. */
  weekEndLastInstant: Date;
};

/**
 * Rolling 7-day window ending on `endKey` (inclusive), same semantics as workout weekly review.
 * All boundaries use UTC calendar dates so they match `createdAt.toISOString().slice(0,10)` bucketing.
 */
export const toWeekRange = (endDateInput?: string | null): WeekRangeUtc => {
  const raw = endDateInput != null ? String(endDateInput).trim() : '';
  const endKey = DATE_KEY_RE.test(raw) ? raw : new Date().toISOString().slice(0, 10);
  const startKey = addDaysToDateKey(endKey, -6);
  const nextAfterEnd = addDaysToDateKey(endKey, 1);

  const startDate = new Date(`${startKey}T00:00:00.000Z`);
  const nextDay = new Date(`${nextAfterEnd}T00:00:00.000Z`);
  const weekEndLastInstant = new Date(`${endKey}T23:59:59.999Z`);

  return { startDate, nextDay, startKey, endKey, weekEndLastInstant };
};
