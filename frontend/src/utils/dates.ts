/**
 * Returns an ISO date string (YYYY-MM-DD) offset by a given number of days from today.
 */
export function getOffsetIsoDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/**
 * Returns human-readable relative or formatted date.
 * e.g., "Today", "Tomorrow", "Yesterday", "Overdue by 5 days", or "22 Oct 2026"
 */
export function formatLoanDate(isoDate: string, isOverdue = false, daysOverdue = 0): string {
  if (isOverdue && daysOverdue > 0) {
    return `Overdue · ${daysOverdue}d ago`;
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  const tomorrowIso = getOffsetIsoDate(1);
  const yesterdayIso = getOffsetIsoDate(-1);

  if (isoDate === todayIso) return 'Due Today';
  if (isoDate === tomorrowIso) return 'Due Tomorrow';
  if (isoDate === yesterdayIso) return 'Due Yesterday';

  const dateObj = new Date(`${isoDate}T00:00:00`);
  return dateObj.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
