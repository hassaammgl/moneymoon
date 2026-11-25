/**
 * Derived budget maths.
 *
 * Nothing here is stored: spent, left, buffer and per-envelope remainders are
 * all computed from the month's income, limits and expenses every render.
 */

import {
  ENVELOPES,
  ENVELOPE_GROUPS,
  type EnvelopeGroupId,
  type EnvelopeId,
} from '@/constants/envelopes';
import type { Expense } from '@/data/mock';

export type EnvelopeStatus = 'ok' | 'tight' | 'over';

/** Spent share of a limit at which the card starts warning. */
export const TIGHT_AT = 0.8;

/** Total logged spend for the month. */
export function totalSpent(expenses: readonly Expense[]): number {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

/** Spend per envelope, with every envelope present. */
export function spentByEnvelope(expenses: readonly Expense[]): Record<EnvelopeId, number> {
  const totals = Object.fromEntries(
    ENVELOPES.map((envelope) => [envelope.id, 0]),
  ) as Record<EnvelopeId, number>;

  for (const expense of expenses) {
    // An expense saved under an envelope that no longer exists must not poison
    // the totals with NaN.
    if (!(expense.envelopeId in totals)) continue;
    totals[expense.envelopeId] += expense.amount;
  }
  return totals;
}

/** Spend per dashboard group — the four cards. */
export function spentByGroup(expenses: readonly Expense[]): Record<EnvelopeGroupId, number> {
  const perEnvelope = spentByEnvelope(expenses);

  return Object.fromEntries(
    ENVELOPE_GROUPS.map((group) => [
      group.id,
      group.envelopeIds.reduce((sum, id) => sum + perEnvelope[id], 0),
    ]),
  ) as Record<EnvelopeGroupId, number>;
}

/** Limit per dashboard group, summed from its envelopes. */
export function limitsByGroup(limits: Record<EnvelopeId, number>): Record<EnvelopeGroupId, number> {
  return Object.fromEntries(
    ENVELOPE_GROUPS.map((group) => [
      group.id,
      group.envelopeIds.reduce((sum, id) => sum + limits[id], 0),
    ]),
  ) as Record<EnvelopeGroupId, number>;
}

/** Sum of every envelope limit. */
export function totalLimits(limits: Record<EnvelopeId, number>): number {
  return ENVELOPES.reduce((sum, envelope) => sum + limits[envelope.id], 0);
}

/** Income − sum of limits: the money that never entered an envelope. */
export function bufferOf(income: number, limits: Record<EnvelopeId, number>): number {
  return income - totalLimits(limits);
}

/** Income − spend: the headline "remaining balance". */
export function leftOf(income: number, expenses: readonly Expense[]): number {
  return income - totalSpent(expenses);
}

/** Card state for a spent/limit pair. */
export function statusOf(spent: number, limit: number): EnvelopeStatus {
  if (limit <= 0) return 'ok';
  if (spent > limit) return 'over';
  return spent / limit >= TIGHT_AT ? 'tight' : 'ok';
}
