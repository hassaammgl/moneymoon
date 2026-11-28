/**
 * Supabase adapter.
 *
 * Every read goes to Postgres through PostgREST, and the session's household is
 * implied by RLS — the queries never take a household id from the client, so a
 * modified app cannot ask for someone else's rows.
 *
 * Every query names its columns explicitly instead of `select('*')` so a schema
 * change fails loudly at one typed boundary (`repositories/rows.ts`).
 *
 * Writes are optimistic at the store and land here as single row changes:
 * expenses are inserted with the device-minted id, edits touch only the given
 * fields, and deletes are soft. A month's budget row is created through
 * `get_or_create_budget` because clients have no insert policy on `budgets`.
 *
 * There is no offline queue yet: a failed write throws, and the store rolls the
 * optimistic change back and shows the message. Nothing here falls back to mock
 * data.
 */
import {
  emptyLimits,
  type EnvelopeId,
} from '@/constants/envelopes';
import type {
  CustomEnvelope,
  DreamGoal,
  EnvelopeIcon,
  EnvelopeLimits,
  EnvelopeTone,
  Expense,
  ExpensePatch,
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
  CustomEnvelopeRow,
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

/** The only columns an expense row needs, read and write share this list. */
const EXPENSE_COLUMNS =
  'id, amount_pkr, envelope_id, paid_by_member_id, created_by_member_id, note, spent_at';

/** Whole PKR, never negative — the database bigint columns are integers. */
function wholePkr(value: number): number {
  return Math.max(0, Math.round(Number.isFinite(value) ? value : 0));
}

function toExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    amount: row.amount_pkr,
    paidBy: row.paid_by_member_id,
    createdBy: row.created_by_member_id,
    envelopeId: row.envelope_id as EnvelopeId,
    note: row.note,
    createdAt: row.spent_at,
  };
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
      userId: row.user_id,
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
  const limits: EnvelopeLimits = emptyLimits();

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
    // Built-in and custom ids share the column; nothing is dropped.
    limits[row.envelope_id] = row.limit_pkr;
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
    .select(EXPENSE_COLUMNS)
    .eq('budget_id', budgetId)
    .is('deleted_at', null)
    .order('spent_at', { ascending: false });

  if (error) throw error;

  // Every row is kept: a custom envelope id is as valid as a built-in one.
  return ((data ?? []) as unknown as ExpenseRow[]).map(toExpense);
}

async function readCustomEnvelopes(): Promise<CustomEnvelope[]> {
  const { data, error } = await supabase
    .from('household_envelopes')
    .select('id, name, icon, tone')
    .order('created_at', { ascending: true });

  if (error) throw error;

  return ((data ?? []) as unknown as CustomEnvelopeRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    icon: row.icon as EnvelopeIcon,
    tone: row.tone as EnvelopeTone,
  }));
}

/**
 * Creates the category and its first monthly limit in one RPC, so a failure
 * cannot leave a category behind with no plan row.
 */
async function createEnvelope(
  envelope: CustomEnvelope,
  monthId: MonthId,
  limitPkr: number,
): Promise<CustomEnvelope> {
  const { data, error } = await supabase.rpc('create_household_envelope', {
    p_id: envelope.id,
    p_name: envelope.name,
    p_icon: envelope.icon,
    p_tone: envelope.tone,
    p_month_start: monthStartOf(monthId),
    p_limit: wholePkr(limitPkr),
  });

  if (error) throw error;

  const row = (Array.isArray(data) ? data[0] : data) as CustomEnvelopeRow | null;
  if (!row) throw new Error('envelope_not_found');

  return {
    id: row.id,
    name: row.name,
    icon: row.icon as EnvelopeIcon,
    tone: row.tone as EnvelopeTone,
  };
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

/**
 * The budget row for a month, created on first write.
 *
 * `budgets` has no client insert policy; the security-definer RPC is the only
 * way in, and it refuses a month that is not the first day of a month.
 */
async function ensureBudget(
  monthId: MonthId,
): Promise<{ householdId: string; budget: BudgetRow }> {
  const household = await readHousehold();

  const { data, error } = await supabase.rpc('get_or_create_budget', {
    p_month_start: monthStartOf(monthId),
  });

  if (error) throw error;

  const row = (Array.isArray(data) ? data[0] : data) as BudgetRow | null;
  if (!row?.id) throw new Error('budget_not_found');

  return { householdId: household.id, budget: row };
}

/** The signed-in user's own member row inside this household. */
async function myMemberId(householdId: string): Promise<string> {
  const { data, error } = await supabase.rpc('my_member_id', {
    target_household: householdId,
  });

  if (error) throw error;
  if (!data) throw new Error('not_a_member');

  return data as string;
}

async function saveIncome(
  memberId: string,
  monthId: MonthId,
  amountPkr: number,
): Promise<number> {
  const household = await readHousehold();
  const mine = await myMemberId(household.id);

  if (mine !== memberId) {
    // RLS would refuse this too; failing here keeps the message clear.
    throw new Error('not_your_income');
  }

  // A locked month refuses income writes in the database too; checking first
  // turns an opaque RLS violation into the same `plan_locked` message as limits.
  const month = await readMonth(monthId);
  if (month.locked) throw new Error('plan_locked');

  const amount = wholePkr(amountPkr);

  const { data, error } = await supabase
    .from('monthly_incomes')
    .upsert(
      {
        household_id: household.id,
        member_id: memberId,
        month_start: monthStartOf(monthId),
        amount_pkr: amount,
      },
      { onConflict: 'member_id,month_start' },
    )
    .select('amount_pkr')
    .single();

  if (error) throw error;
  return (data as unknown as { amount_pkr: number }).amount_pkr;
}

async function saveLimit(
  monthId: MonthId,
  envelopeId: EnvelopeId,
  amountPkr: number,
): Promise<number> {
  const { householdId, budget } = await ensureBudget(monthId);

  if (budget.locked) throw new Error('plan_locked');

  const amount = wholePkr(amountPkr);

  const { error } = await supabase.from('budget_envelopes').upsert(
    {
      budget_id: budget.id,
      household_id: householdId,
      envelope_id: envelopeId,
      limit_pkr: amount,
    },
    { onConflict: 'budget_id,envelope_id' },
  );

  if (error) throw error;
  return amount;
}

async function lockPlan(monthId: MonthId): Promise<boolean> {
  const { budget } = await ensureBudget(monthId);

  const { data, error } = await supabase.rpc('lock_budget', {
    p_budget_id: budget.id,
  });

  if (error) throw error;

  const row = (Array.isArray(data) ? data[0] : data) as BudgetRow | null;
  return row?.locked ?? true;
}

async function unlockPlan(monthId: MonthId): Promise<boolean> {
  const { budget } = await ensureBudget(monthId);

  const { data, error } = await supabase.rpc('unlock_budget', {
    p_budget_id: budget.id,
  });

  if (error) throw error;

  const row = (Array.isArray(data) ? data[0] : data) as BudgetRow | null;
  return row?.locked ?? false;
}

async function createExpense(monthId: MonthId, expense: Expense): Promise<Expense> {
  const { householdId, budget } = await ensureBudget(monthId);
  const createdBy = await myMemberId(householdId);

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      id: expense.id,
      household_id: householdId,
      budget_id: budget.id,
      envelope_id: expense.envelopeId,
      paid_by_member_id: expense.paidBy,
      created_by_member_id: createdBy,
      amount_pkr: wholePkr(expense.amount),
      note: expense.note,
      spent_at: expense.createdAt,
    })
    .select(EXPENSE_COLUMNS)
    .single();

  if (error) throw error;
  return toExpense(data as unknown as ExpenseRow);
}

async function updateExpense(
  id: string,
  patch: ExpensePatch,
): Promise<Expense | null> {
  const row: Record<string, unknown> = {};

  if (patch.amount !== undefined) row.amount_pkr = wholePkr(patch.amount);
  if (patch.paidBy !== undefined) row.paid_by_member_id = patch.paidBy;
  if (patch.envelopeId !== undefined) row.envelope_id = patch.envelopeId;
  if (patch.note !== undefined) row.note = patch.note;
  if (patch.createdAt !== undefined) row.spent_at = patch.createdAt;

  if (Object.keys(row).length === 0) return null;

  const { data, error } = await supabase
    .from('expenses')
    .update(row)
    .eq('id', id)
    .is('deleted_at', null)
    .select(EXPENSE_COLUMNS)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return toExpense(data as unknown as ExpenseRow);
}

async function removeExpense(id: string): Promise<void> {
  // Soft delete: the row stays so the partner's sync can see the tombstone.
  const { error } = await supabase
    .from('expenses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null);

  if (error) throw error;
}

export function createSupabaseRepositories(): Repositories {
  return {
    household: {
      get: readHousehold,
      listMembers: readMembers,
    },

    income: {
      listForMonth: readIncomes,
      set: saveIncome,
    },

    budget: {
      getMonth: readMonth,
      setLimit: saveLimit,
      lock: lockPlan,
      unlock: unlockPlan,
    },

    expenses: {
      list: readExpenses,
      create: createExpense,
      update: updateExpense,
      remove: removeExpense,
    },

    envelopes: {
      list: readCustomEnvelopes,
      create: createEnvelope,
    },

    dreamGoal: {
      get: readDreamGoal,
    },
  };
}

/** The app's live adapter. */
export const supabaseRepositories: Repositories = createSupabaseRepositories();
