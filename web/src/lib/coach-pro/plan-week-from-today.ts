/**
 * Map Coach Pro `dayLabel` strings to ISO weekday index Monday=0 … Sunday=6,
 * matching `getMondayBasedTodayIndex()` used for "week starts Monday" UX.
 *
 * Supports English (Mon / Monday) and Polish full names (Poniedziałek, …).
 */
export function mondayWeekIndexFromDayLabel(dayLabel: string): number | null {
  const s = dayLabel.trim().toLowerCase();
  if (!s) return null;

  // Polish — check before short English where useful
  if (s.startsWith('pon')) return 0;
  if (s.startsWith('wto')) return 1;
  if (s.startsWith('śro') || s.startsWith('sro')) return 2;
  if (s.startsWith('czw')) return 3;
  if (s.startsWith('pią') || s.startsWith('pia') || s.startsWith('piątek') || s.startsWith('piatek')) return 4;
  if (s.startsWith('sob')) return 5;
  if (s.startsWith('niedz')) return 6;

  // English
  if (s.startsWith('mon')) return 0;
  if (s.startsWith('tue')) return 1;
  if (s.startsWith('wed')) return 2;
  if (s.startsWith('thu')) return 3;
  if (s.startsWith('fri')) return 4;
  if (s.startsWith('sat')) return 5;
  if (s.startsWith('sun')) return 6;

  return null;
}

/** Local Monday=0 … Sunday=6 from browser calendar (Sunday maps to 6). */
export function getMondayBasedTodayIndex(): number {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

/** Sort Mon→Sun, then rotate so the first row is today's weekday. */
export function rotateWeekFromToday<T extends { dayLabel: string }>(items: T[]): T[] {
  if (items.length === 0) return items;

  const sorted = [...items].sort((a, b) => {
    const ia = mondayWeekIndexFromDayLabel(a.dayLabel);
    const ib = mondayWeekIndexFromDayLabel(b.dayLabel);
    if (ia === null && ib === null) return 0;
    if (ia === null) return 1;
    if (ib === null) return -1;
    return ia - ib;
  });

  const todayIdx = getMondayBasedTodayIndex();
  const startAt = sorted.findIndex((d) => mondayWeekIndexFromDayLabel(d.dayLabel) === todayIdx);
  const start = startAt >= 0 ? startAt : 0;
  return [...sorted.slice(start), ...sorted.slice(0, start)];
}
