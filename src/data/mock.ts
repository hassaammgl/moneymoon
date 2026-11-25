/**
 * Mock household data for the static screens (Phase 2).
 *
 * One object per thing the real Firestore documents will hold, so swapping mock
 * for live data in Phase 3 is a matter of replacing the import — not reshaping
 * the screens.
 *
 * Money is always integer PKR.
 */

import { ENVELOPES, type EnvelopeId } from '@/constants/envelopes';

export type Payer = 'husband' | 'wife';

/** `households/{id}/months/{yyyy-mm}/expenses/{id}` */
export interface Expense {
  id: string;
  /** Whole PKR. */
  amount: number;
  paidBy: Payer;
  envelopeId: EnvelopeId;
  note: string;
  /** ISO 8601 timestamp. */
  createdAt: string;
  createdByUid: string;
}

/** `households/{id}` */
export interface Household {
  id: string;
  name: string;
  /** Short code the partner types to join. */
  code: string;
}

/** `households/{id}/months/{yyyy-mm}` */
export interface MonthPlan {
  id: string;
  income: number;
  locked: boolean;
  /** One limit per envelope. */
  limits: Record<EnvelopeId, number>;
}

export const MOCK_HOUSEHOLD: Household = {
  id: 'demo-household',
  name: 'Moneymoon',
  code: 'MNY-4821',
};

/** Default limits, keyed by envelope id — these are the values the plan starts from. */
export const DEFAULT_LIMITS: Record<EnvelopeId, number> = ENVELOPES.reduce(
  (limits, envelope) => ({ ...limits, [envelope.id]: envelope.limit }),
  {} as Record<EnvelopeId, number>,
);

export const MOCK_MONTH: MonthPlan = {
  id: '2026-11',
  income: 60_000,
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
    id: 'exp-1',
    amount: 1_730,
    paidBy: 'husband',
    envelopeId: 'groceries',
    note: 'Weekly groceries',
    createdAt: minutesAgo(120),
    createdByUid: 'uid-husband',
  },
  {
    id: 'exp-2',
    amount: 300,
    paidBy: 'wife',
    envelopeId: 'medicine',
    note: 'Pharmacy',
    createdAt: minutesAgo(60 * 26),
    createdByUid: 'uid-wife',
  },
  {
    id: 'exp-3',
    amount: 600,
    paidBy: 'husband',
    envelopeId: 'commute',
    note: 'Rickshaw to office',
    createdAt: minutesAgo(60 * 24 * 3),
    createdByUid: 'uid-husband',
  },
  {
    id: 'exp-4',
    amount: 5_030,
    paidBy: 'wife',
    envelopeId: 'internet',
    note: 'Internet & mobile bill',
    createdAt: minutesAgo(60 * 24 * 4),
    createdByUid: 'uid-wife',
  },
  {
    id: 'exp-5',
    amount: 900,
    paidBy: 'wife',
    envelopeId: 'her-kharcha',
    note: 'Salon',
    createdAt: minutesAgo(60 * 24 * 5),
    createdByUid: 'uid-wife',
  },
  {
    id: 'exp-6',
    amount: 18_000,
    paidBy: 'husband',
    envelopeId: 'room-rent',
    note: 'Room rent',
    createdAt: minutesAgo(60 * 24 * 6),
    createdByUid: 'uid-husband',
  },
  {
    id: 'exp-7',
    amount: 970,
    paidBy: 'husband',
    envelopeId: 'utilities',
    note: 'Electricity bill',
    createdAt: minutesAgo(60 * 24 * 8),
    createdByUid: 'uid-husband',
  },
];

/**
 * The emergency buffer is not part of the brief's data model — the dashboard
 * card is designed with a fixed goal, so it lives here until we decide whether
 * it becomes real household data.
 */
export const BUFFER_GOAL = {
  target: 50_000,
  byLabel: 'Jun 2027',
};
