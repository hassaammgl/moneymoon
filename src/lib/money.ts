/**
 * Money helpers.
 *
 * Amounts are integer PKR everywhere — never floats, never paisa. Formatting is
 * done by hand instead of `Intl.NumberFormat` so the thousands separators are
 * identical on Hermes, JSC and web.
 */

const GROUPING = /\B(?=(\d{3})+(?!\d))/g;

/** `32470` -> `"32,470"`. */
export function formatAmount(amount: number): string {
  const rounded = Math.round(amount);
  const absolute = Math.abs(rounded).toString().replace(GROUPING, ',');
  return rounded < 0 ? `-${absolute}` : absolute;
}

/** `32470` -> `"Rs 32,470"`. */
export function formatRs(amount: number): string {
  return `Rs ${formatAmount(amount)}`;
}

/** An expense shown as a debit: `1250` -> `"- Rs 1,250"`. */
export function formatDebit(amount: number): string {
  return `- ${formatRs(amount)}`;
}

/** Trims a typed amount down to integer PKR: `"1,5o0"` -> `1500`. */
export function parseAmountInput(input: string): number {
  const digits = input.replace(/[^\d]/g, '');
  if (!digits) return 0;
  return Number.parseInt(digits, 10);
}

/**
 * Safe percentage for progress bars and "x% used" labels. Guards against a zero
 * or negative limit, and clamps the visual fill to 100%.
 */
export function progressOf(spent: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(1, Math.max(0, spent / limit));
}
