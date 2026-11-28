/**
 * Month helpers.
 *
 * A month is identified by the string `yyyy-mm` because that is the primary key
 * of a row in the `months` table. All maths uses local dates so the "days left"
 * pill matches the user's calendar.
 */

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/** `'2026-11'` for the given date. */
export function monthIdOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** `'2026-11'` -> `'November 2026'`. */
export function monthLabelOf(id: string): string {
  const [year, month] = id.split('-').map(Number);
  const name = MONTH_NAMES[month - 1] ?? '';
  return `${name} ${year}`;
}

/** `'2026-11'` -> `'2026-11-01'`, the `month_start` date the database stores. */
export function monthStartOf(id: string): string {
  const [year, month] = id.split('-');
  return `${year}-${month}-01`;
}

/** `'2026-11'` shifted by whole months: `-1` -> `'2026-10'`, `2` -> `'2027-01'`. */
export function shiftMonth(id: string, delta: number): string {
  const [year, month] = id.split('-').map(Number);
  return monthIdOf(new Date(year, month - 1 + delta, 1));
}

/** Whole days remaining in the month, excluding today — 24 Nov -> 6. */
export function daysLeftInMonth(date: Date): number {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return Math.max(0, lastDay - date.getDate());
}

/** The `yyyy-mm` document id for "now", or for a fixed date in mock mode. */
export function currentMonthId(date: Date = new Date()): string {
  return monthIdOf(date);
}
