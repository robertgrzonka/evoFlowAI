/** Rolling 7-day window ending on `endDate` (inclusive). Same semantics as workout weekly review. */
export const toWeekRange = (endDateInput?: string) => {
  const endDate = endDateInput ? new Date(endDateInput) : new Date();
  endDate.setHours(0, 0, 0, 0);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 6);
  const nextDay = new Date(endDate);
  nextDay.setDate(nextDay.getDate() + 1);
  return { startDate, endDate, nextDay };
};
