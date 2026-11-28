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
import type {
  EnvelopeLimits,
  Expense,
  IncomeByMember,
  Member,
  MemberId,
} from '@/domain/types';

export type EnvelopeStatus = 'ok' | 'tight' | 'over';

/** Spent share of a limit at which the card starts warning. */
export const TIGHT_AT = 0.8;

/** One member's money, ready for a screen. */
export interface MemberAmount {
  memberId: MemberId;
  displayName: string;
  /** Avatar tint inherited from the member. */
  colorKey: Member['colorKey'];
  amount: number;
}

/** Household income = the sum of both partners' month incomes. Never stored. */
export function combinedIncome(incomes: IncomeByMember): number {
  return Object.values(incomes).reduce((sum, amount) => sum + amount, 0);
}

/** Per-partner income, in household order. */
export function incomeByMember(
  members: readonly Member[],
  incomes: IncomeByMember,
): MemberAmount[] {
  return members.map((member) => ({
    memberId: member.id,
    displayName: member.displayName,
    colorKey: member.colorKey,
    amount: incomes[member.id] ?? 0,
  }));
}

/** Per-partner spend — who actually paid, in household order. */
export function spentByMember(
  members: readonly Member[],
  expenses: readonly Expense[],
): MemberAmount[] {
  const totals: Record<MemberId, number> = {};

  for (const expense of expenses) {
    totals[expense.paidBy] = (totals[expense.paidBy] ?? 0) + expense.amount;
  }

  return members.map((member) => ({
    memberId: member.id,
    displayName: member.displayName,
    colorKey: member.colorKey,
    amount: totals[member.id] ?? 0,
  }));
}

/** Total logged spend for the month. */
export function totalSpent(expenses: readonly Expense[]): number {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

/** Spend per envelope, with every built-in present and custom ids added. */
export function spentByEnvelope(expenses: readonly Expense[]): Record<EnvelopeId, number> {
  const totals: Record<string, number> = Object.fromEntries(
    ENVELOPES.map((envelope) => [envelope.id, 0]),
  );

  for (const expense of expenses) {
    // Unknown ids are kept rather than dropped: a custom envelope removed on
    // another device must not hide money that was already spent.
    totals[expense.envelopeId] = (totals[expense.envelopeId] ?? 0) + expense.amount;
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
export function limitsByGroup(limits: EnvelopeLimits): Record<EnvelopeGroupId, number> {
  return Object.fromEntries(
    ENVELOPE_GROUPS.map((group) => [
      group.id,
      group.envelopeIds.reduce((sum, id) => sum + (limits[id] ?? 0), 0),
    ]),
  ) as Record<EnvelopeGroupId, number>;
}

/** Sum of every envelope limit — built-in and custom. */
export function totalLimits(limits: EnvelopeLimits): number {
  return Object.values(limits).reduce((sum, amount) => sum + amount, 0);
}

/** Income − sum of limits: the money that never entered an envelope. */
export function bufferOf(income: number, limits: EnvelopeLimits): number {
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
