/**
 * Mock household data for the static screens (Phase 2).
 *
 * One object per thing the real Supabase rows will hold, so swapping mock for
 * live data later is a matter of replacing the import — not reshaping the
 * screens. The store (`src/store/budget-store.tsx`) is the only reader.
 *
 * Money is always integer PKR. Ids are UUID v4 strings, same as the server will
 * use, so seeded rows and device-created rows look identical.
 */

import { ENVELOPES, type EnvelopeId } from '@/constants/envelopes';
import type { DreamGoal, Expense, Household, Member, MonthPlan } from '@/domain/types';

export const MOCK_HOUSEHOLD: Household = {
  id: 'd3f2e4a6-7b8c-4d9e-8f0a-2b3c4d5e6f70',
  name: 'Moneymoon',
  code: 'MNY-4821',
};

/** Exactly two partners, in household order: husband first, wife second. */
export const MOCK_MEMBERS: readonly Member[] = [
  {
    id: 'b1f0c2d4-5e6a-4b7c-8d9e-0f1a2b3c4d5e',
    householdId: MOCK_HOUSEHOLD.id,
    userId: 'a0e9d8c7-b6a5-4c4d-8e3f-1a2b3c4d5e6f',
    displayName: 'Husband',
    colorKey: 'ink',
  },
  {
    id: 'c2e1d3f5-6a7b-4c8d-9e0f-1a2b3c4d5e6f',
    householdId: MOCK_HOUSEHOLD.id,
    userId: 'd3c2b1a0-9f8e-4d7c-8b6a-5f4e3d2c1b0a',
    displayName: 'Wife',
    colorKey: 'rose',
  },
];

const HUSBAND = MOCK_MEMBERS[0].id;
const WIFE = MOCK_MEMBERS[1].id;

/** Default limits, keyed by envelope id — these are the values the plan starts from. */
export const DEFAULT_LIMITS: Record<EnvelopeId, number> = ENVELOPES.reduce(
  (limits, envelope) => ({ ...limits, [envelope.id]: envelope.limit }),
  {} as Record<EnvelopeId, number>,
);

/**
 * November's plan. Income is per partner — 38,000 + 22,000 — and the household
 * total (60,000) is always derived, never stored.
 */
export const MOCK_MONTH: MonthPlan = {
  id: '2026-11',
  incomes: {
    [HUSBAND]: 38_000,
    [WIFE]: 22_000,
  },
  locked: false,
  limits: DEFAULT_LIMITS,
};

/** Fixed "now" for the mock so relative times never drift between renders. */
export const MOCK_NOW = new Date('2026-11-24T19:30:00');

const minutesAgo = (minutes: number) =>
  new Date(MOCK_NOW.getTime() - minutes * 60_000).toISOString();

/**
 * Spend adds up to exactly 27,530 — the figure the brief derives "Rs 32,470
 * left" from (income 60,000 − spent 27,530).
 */
export const MOCK_EXPENSES: Expense[] = [
  {
    id: '1e4b7a20-9c3d-4f5a-8b6c-0d1e2f3a4b5c',
    amount: 1_730,
    paidBy: HUSBAND,
    envelopeId: 'groceries',
    note: 'Weekly groceries',
    createdAt: minutesAgo(120),
    createdBy: HUSBAND,
  },
  {
    id: '2f5c8b31-0d4e-4a6b-9c7d-1e2f3a4b5c6d',
    amount: 300,
    paidBy: WIFE,
    envelopeId: 'medicine',
    note: 'Pharmacy',
    createdAt: minutesAgo(60 * 26),
    createdBy: WIFE,
  },
  {
    id: '3a6d9c42-1e5f-4b7c-8d9e-2f3a4b5c6d7e',
    amount: 600,
    paidBy: HUSBAND,
    envelopeId: 'commute',
    note: 'Rickshaw to office',
    createdAt: minutesAgo(60 * 24 * 3),
    createdBy: HUSBAND,
  },
  {
    id: '4b7e0d53-2f6a-4c8d-9e0f-3a4b5c6d7e8f',
    amount: 5_030,
    paidBy: WIFE,
    envelopeId: 'internet',
    note: 'Internet & mobile bill',
    createdAt: minutesAgo(60 * 24 * 4),
    createdBy: WIFE,
  },
  {
    id: '5c8f1e64-3a7b-4d9e-8f0a-4b5c6d7e8f90',
    amount: 900,
    paidBy: WIFE,
    envelopeId: 'her-kharcha',
    note: 'Salon',
    createdAt: minutesAgo(60 * 24 * 5),
    createdBy: WIFE,
  },
  {
    id: '6d902f75-4b8c-4e0f-9a1b-5c6d7e8f9012',
    amount: 18_000,
    paidBy: HUSBAND,
    envelopeId: 'room-rent',
    note: 'Room rent',
    createdAt: minutesAgo(60 * 24 * 6),
    createdBy: HUSBAND,
  },
  {
    id: '7e013086-5c9d-4f1a-8b2c-6d7e8f901234',
    amount: 970,
    paidBy: HUSBAND,
    envelopeId: 'utilities',
    note: 'Electricity bill',
    createdAt: minutesAgo(60 * 24 * 8),
    createdBy: HUSBAND,
  },
];

/**
 * The emergency buffer is not part of the brief's data model — the dashboard
 * card is designed with a fixed goal, so it lives here until real dream-goal
 * contributions exist.
 */
export const BUFFER_GOAL: DreamGoal = {
  target: 50_000,
  byLabel: 'Jun 2027',
};
