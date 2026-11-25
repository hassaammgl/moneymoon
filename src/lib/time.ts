/**
 * Relative timestamps for the activity list — "2 hours ago", "Yesterday".
 *
 * Hand-rolled instead of `Intl.RelativeTimeFormat` so the wording is identical
 * on Hermes, JSC and web, and stays short enough for one line at 12px.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function timeAgo(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);

  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) {
    const minutes = Math.floor(diff / MINUTE);
    return minutes === 1 ? '1 min ago' : `${minutes} mins ago`;
  }
  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }
  if (diff < 2 * DAY) return 'Yesterday';
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} days ago`;

  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/** Local `yyyy-mm-dd` key — one per calendar day, used to group the history. */
export function dayKey(iso: string): string {
  const date = new Date(iso);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** "Today", "Yesterday", or "24 Nov 2026". */
export function dayLabel(iso: string, now: number = Date.now()): string {
  const key = dayKey(iso);
  if (key === dayKey(new Date(now).toISOString())) return 'Today';
  if (key === dayKey(new Date(now - DAY).toISOString())) return 'Yesterday';

  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
