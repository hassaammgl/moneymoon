/**
 * In-memory repository adapter — the app's fake backend.
 *
 * It holds a private copy of the seed, applies the exact same reducer the store
 * uses (so the two can never disagree), and answers with promises so swapping in
 * a Supabase adapter later changes the adapter only, never the store or screens.
 *
 * No persistence on purpose: a reload starts from the mock seed, just like the
 * current build. Persistence and offline queues are the sync phase.
 */
import {
  BUFFER_GOAL,
  MOCK_EXPENSES,
  MOCK_HOUSEHOLD,
  MOCK_MEMBERS,
  MOCK_MONTH,
} from '@/data/mock';
import type { BudgetSnapshot, MonthPlan } from '@/domain/types';
import type { Repositories } from '@/repositories/types';
import { budgetReducer, wholePkr, type BudgetAction } from '@/store/budget-reducer';

/** Deep enough copies: every nested object in the snapshot is replaced on change. */
function cloneMonth(month: MonthPlan): MonthPlan {
  return {
    ...month,
    incomes: { ...month.incomes },
    limits: { ...month.limits },
  };
}

function cloneSnapshot(snapshot: BudgetSnapshot): BudgetSnapshot {
  return {
    household: { ...snapshot.household },
    members: snapshot.members.map((member) => ({ ...member })),
    month: cloneMonth(snapshot.month),
    expenses: snapshot.expenses.map((expense) => ({ ...expense })),
  };
}

/**
 * The starting point until real data arrives. The store and the mock adapter
 * both begin here; the reducer always returns new objects, so they can share it.
 */
export const INITIAL_BUDGET_STATE: BudgetSnapshot = {
  household: { ...MOCK_HOUSEHOLD },
  members: MOCK_MEMBERS.map((member) => ({ ...member })),
  month: cloneMonth(MOCK_MONTH),
  expenses: MOCK_EXPENSES.map((expense) => ({ ...expense })),
};

export function createMockRepositories(seed: BudgetSnapshot): Repositories {
  let state = cloneSnapshot(seed);

  const apply = (action: BudgetAction) => {
    state = budgetReducer(state, action);
  };

  return {
    household: {
      get: async () => ({ ...state.household }),
      listMembers: async () => state.members.map((member) => ({ ...member })),
    },

    income: {
      listForMonth: async () => ({ ...state.month.incomes }),
      set: async (memberId, _monthId, amountPkr) => {
        apply({ type: 'setMemberIncome', memberId, income: amountPkr });
        return state.month.incomes[memberId] ?? 0;
      },
    },

    budget: {
      getMonth: async () => cloneMonth(state.month),
      setLimit: async (_monthId, envelopeId, amountPkr) => {
        apply({ type: 'setLimit', envelopeId, amount: amountPkr });
        return state.month.limits[envelopeId];
      },
      lock: async () => {
        apply({ type: 'lockPlan' });
        return state.month.locked;
      },
      unlock: async () => {
        apply({ type: 'unlockPlan' });
        return state.month.locked;
      },
    },

    expenses: {
      list: async () => state.expenses.map((expense) => ({ ...expense })),
      create: async (expense) => {
        apply({ type: 'addExpense', expense });
        const stored = state.expenses.find((row) => row.id === expense.id);
        return stored ? { ...stored } : { ...expense, amount: wholePkr(expense.amount) };
      },
      update: async (id, patch) => {
        apply({ type: 'updateExpense', id, patch });
        const stored = state.expenses.find((row) => row.id === id);
        return stored ? { ...stored } : null;
      },
      remove: async (id) => {
        apply({ type: 'deleteExpense', id });
      },
    },

    dreamGoal: {
      get: async () => ({ ...BUFFER_GOAL }),
    },
  };
}

/** The app's default adapter until Supabase lands. */
export const mockRepositories: Repositories = createMockRepositories(INITIAL_BUDGET_STATE);
