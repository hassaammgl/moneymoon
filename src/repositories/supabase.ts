/**
 * Supabase read adapter.
 *
 * Step 5A: every read goes to Postgres through PostgREST, and the session's
 * household is implied by RLS — the queries never take a household id from the
 * client, so a modified app cannot ask for someone else's rows.
 *
 * Every query names its columns explicitly instead of `select('*')` so a schema
 * change fails loudly at one typed boundary (`repositories/rows.ts`).
 *
 * Writes are deliberately unwired in this step: they throw, the store never
 * calls them, and the sync phase replaces them with real inserts plus an
 * outbox. Nothing here falls back to mock data.
 */
import {
  emptyLimits,
  isEnvelopeId,
  type EnvelopeId,
} from '@/constants/envelopes';
import type {
  DreamGoal,
  Expense,
  Household,
  IncomeByMember,
  Member,
  MonthId,
} from '@/domain/types';
import { supabase } from '@/lib/supabase';
import { monthStartOf } from '@/lib/month';
import { NoHouseholdError } from '@/repositories/errors';
import type {
  BudgetRow,
  DreamGoalRow,
  EnvelopeRow,
  ExpenseRow,
  HouseholdRow,
  IncomeRow,
  MemberRow,
} from '@/repositories/rows';
import type { MonthBudget, Repositories } from '@/repositories/types';
const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

function unwired(what: string): never {
  throw new Error(`${what} is not wired to Supabase yet.`);
}

/** RLS makes at most one household visible: the caller's. */
async function readHousehold(): Promise<Household> {
  const { data, error } = await supabase
    .from('households')
    .select('id, name, join_code')
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new NoHouseholdError();

  const row = data as unknown as HouseholdRow;
  return { id: row.id, name: row.name, code: row.join_code };
}

async function readMembers(): Promise<Member[]> {
  const household = await readHousehold();

  const { data, error } = await supabase
    .from('household_members')
    .select('id, household_id, user_id, joined_at, profiles(display_name)')
    .eq('household_id', household.id)
    .eq('status', 'active')
    .order('joined_at', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;

  return ((data ?? []) as unknown as MemberRow[]).map((row, index) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

    return {
      id: row.id,
      householdId: row.household_id,
      // The profile row is created by an auth trigger, so a name is always
      // there; the fallback only covers a profile RLS edge case.
      displayName: profile?.display_name?.trim() || 'Partner',
      // Household order, not auth order: the first partner to join is ink and
      // the second is rose, so avatar colours stay stable between sessions.
      colorKey: index === 0 ? 'ink' : 'rose',
    };
  });
}

async function readIncomes(monthId: MonthId): Promise<IncomeByMember> {
  const household = await readHousehold();

  const { data, error } = await supabase
    .from('monthly_incomes')
    .select('member_id, amount_pkr')
    .eq('household_id', household.id)
    .eq('month_start', monthStartOf(monthId));

  if (error) throw error;

  const incomes: IncomeByMember = {};
  for (const row of (data ?? []) as unknown as IncomeRow[]) {
    incomes[row.member_id] = row.amount_pkr;
  }
  return incomes;
}

async function readMonth(monthId: MonthId): Promise<MonthBudget> {
  const household = await readHousehold();
  const limits = emptyLimits();

  const { data, error } = await supabase
    .from('budgets')
    .select('id, locked, month_start')
    .eq('household_id', household.id)
    .eq('month_start', monthStartOf(monthId))
    .maybeSingle();

  if (error) throw error;

  // No saved plan for this month is a real state, not an error. The caller
  // shows zeros and knows (`hasBudget = false`) that nothing was stored.
  if (!data) return { id: null, locked: false, limits };

  const budget = data as unknown as BudgetRow;

  const { data: envelopeRows, error: envelopeError } = await supabase
    .from('budget_envelopes')
    .select('envelope_id, limit_pkr')
    .eq('budget_id', budget.id);

  if (envelopeError) throw envelopeError;

  for (const row of (envelopeRows ?? []) as unknown as EnvelopeRow[]) {
    if (isEnvelopeId(row.envelope_id)) {
      limits[row.envelope_id] = row.limit_pkr;
    }
  }

  return { id: budget.id, locked: budget.locked, limits };
}

async function readExpenses(monthId: MonthId): Promise<Expense[]> {
  const household = await readHousehold();

  // Expenses belong to their budget row, never to a month string: a November
  // budget id can never return December's rows.
  const { data: budgetData, error: budgetError } = await supabase
    .from('budgets')
    .select('id')
    .eq('household_id', household.id)
    .eq('month_start', monthStartOf(monthId))
    .maybeSingle();

  if (budgetError) throw budgetError;
  if (!budgetData) return [];

  const budgetId = (budgetData as unknown as { id: string }).id;

  const { data, error } = await supabase
    .from('expenses')
    .select(
      'id, amount_pkr, envelope_id, paid_by_member_id, created_by_member_id, note, spent_at',
    )
    .eq('budget_id', budgetId)
    .is('deleted_at', null)
    .order('spent_at', { ascending: false });

  if (error) throw error;

  // A row saved under an envelope id this build does not know (for example a
  // newer app version) is skipped instead of crashing every screen.
  return ((data ?? []) as unknown as ExpenseRow[])
    .filter((row) => isEnvelopeId(row.envelope_id))
    .map((row) => ({
      id: row.id,
      amount: row.amount_pkr,
      paidBy: row.paid_by_member_id,
      createdBy: row.created_by_member_id,
      envelopeId: row.envelope_id as EnvelopeId,
      note: row.note,
      createdAt: row.spent_at,
    }));
}

async function readDreamGoal(): Promise<DreamGoal> {
  const { data, error } = await supabase
    .from('dream_goals')
    .select('target_pkr, target_date')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { target: 0, byLabel: '' };

  const row = data as unknown as DreamGoalRow;
  const [year, month] = (row.target_date ?? '').split('-');

  return {
    target: row.target_pkr,
    byLabel: year && month ? `${MONTH_SHORT[Number(month) - 1] ?? ''} ${year}`.trim() : '',
  };
}

export function createSupabaseRepositories(): Repositories {
  return {
    household: {
      get: readHousehold,
      listMembers: readMembers,
    },

    income: {
      listForMonth: readIncomes,
      set: async () => unwired('Saving income'),
    },

    budget: {
      getMonth: readMonth,
      setLimit: async () => unwired('Saving a limit'),
      lock: async () => unwired('Locking a plan'),
      unlock: async () => unwired('Unlocking a plan'),
    },

    expenses: {
      list: readExpenses,
      create: async () => unwired('Adding an expense'),
      update: async () => unwired('Editing an expense'),
      remove: async () => unwired('Deleting an expense'),
    },

    dreamGoal: {
      get: readDreamGoal,
    },
  };
}

/** The app's live adapter; read methods only in Step 5A. */
export const supabaseRepositories: Repositories = createSupabaseRepositories();
