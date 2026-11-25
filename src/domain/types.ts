/**
 * Shared domain types.
 *
 * One vocabulary for the whole app: the store, the mock seed and (later) the
 * Supabase repositories all speak these shapes. Nothing here performs I/O or
 * imports UI code.
 *
 * Money is always integer PKR. IDs are UUID strings so a client can create a
 * row offline and keep the same id when it finally reaches the server.
 */
import type { EnvelopeId } from '@/constants/envelopes';

export type HouseholdId = string;
export type MemberId = string;
/** Calendar month, `yyyy-mm`. */
export type MonthId = string;

/** A household is the shared budget both partners belong to. */
export interface Household {
  id: HouseholdId;
  name: string;
  /** Short code the partner types to join. */
  code: string;
}

/**
 * One partner. A household has exactly two members.
 *
 * Income is not on the member: it is month-specific, so it lives in
 * `MonthPlan.incomes` keyed by member id.
 */
export interface Member {
  id: MemberId;
  householdId: HouseholdId;
  displayName: string;
  /** Avatar tint — the first partner is ink, the second rose. */
  colorKey: 'ink' | 'rose';
}

/** One amount per partner for a single month. */
export type IncomeByMember = Record<MemberId, number>;

/** The month's shared plan. Combined income is never stored here. */
export interface MonthPlan {
  id: MonthId;
  /** Month-scoped income per partner; the household total is derived. */
  incomes: IncomeByMember;
  locked: boolean;
  /** One limit per envelope. */
  limits: Record<EnvelopeId, number>;
}

/** One logged spend, attributed to the partner who paid. Identified by a UUID so
 * an offline retry cannot create the same row twice. */
export interface Expense {
  /** UUID v4, generated on the device so retries stay idempotent. */
  id: string;
  /** Whole PKR. */
  amount: number;
  paidBy: MemberId;
  envelopeId: EnvelopeId;
  note: string;
  /** ISO 8601 timestamp. */
  createdAt: string;
  createdBy: MemberId;
}

/** Fields an expense edit may change; `id` is fixed. */
export type ExpensePatch = Partial<Omit<Expense, 'id'>>;

/** Everything the app holds for one household and one month. */
export interface BudgetSnapshot {
  household: Household;
  /** Exactly two partners. */
  members: Member[];
  month: MonthPlan;
  expenses: Expense[];
}

/** The shared savings target behind the Dream Buffer card. */
export interface DreamGoal {
  target: number;
  byLabel: string;
}
