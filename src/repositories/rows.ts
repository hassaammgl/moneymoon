/**
 * Postgres row shapes for the tables the app reads.
 *
 * Column names come from the live schema (project `qavulpyzsldgkzmxlqps`,
 * generated with `supabase gen types typescript` on 2026-11-26), not from
 * memory. Only the columns the read repositories select are listed; regenerate
 * the full set with:
 *
 *   bunx supabase gen types typescript --linked > src/types/database.ts
 *
 * until that file exists, these narrow rows keep the read boundary honest.
 */

export interface HouseholdRow {
  id: string;
  name: string;
  join_code: string;
}

/** `household_members` joined to the partner's `profiles` row. */
export interface MemberRow {
  id: string;
  household_id: string;
  user_id: string;
  joined_at: string | null;
  /** Embedded to-one relationship: PostgREST returns an object or an array. */
  profiles: { display_name: string } | { display_name: string }[] | null;
}

export interface IncomeRow {
  member_id: string;
  amount_pkr: number;
}

export interface BudgetRow {
  id: string;
  locked: boolean;
  month_start: string;
}

export interface EnvelopeRow {
  envelope_id: string;
  limit_pkr: number;
}

export interface CustomEnvelopeRow {
  id: string;
  name: string;
  icon: string;
  tone: string;
}

export interface ExpenseRow {
  id: string;
  amount_pkr: number;
  envelope_id: string;
  paid_by_member_id: string;
  created_by_member_id: string;
  note: string;
  spent_at: string;
}

export interface DreamGoalRow {
  target_pkr: number;
  target_date: string | null;
}
