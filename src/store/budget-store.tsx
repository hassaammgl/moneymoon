/**
 * BudgetStore — the single source of truth for the household, the month plan
 * and the expenses.
 *
 * Screens never import `data/mock.ts`: they read state and call actions on
 * `useBudget()`. Every mutation lives here, in one reducer, so swapping the
 * mock for Supabase later touches this file only. The action signatures are the
 * seam the future data layer plugs into: screens call them and never learn
 * whether the state came from the reducer or the network.
 *
 * Derived values (spent, left, buffer, per-envelope and per-group totals) are
 * never stored — they are computed from `lib/budget.ts` selectors at render.
 *
 * Money is always integer PKR. Inputs are clamped to whole PKR >= 0, so a
 * slider drag or a typed amount can never put a float or a negative into state.
 */
import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';

import type { EnvelopeId } from '@/constants/envelopes';
import { MOCK_EXPENSES, MOCK_HOUSEHOLD, MOCK_MEMBERS, MOCK_MONTH } from '@/data/mock';
import type { Expense, Household, Member, MemberId, MonthPlan } from '@/domain/types';
import { combinedIncome, totalLimits } from '@/lib/budget';

export interface BudgetState {
  household: Household;
  /** Exactly two partners. */
  members: Member[];
  month: MonthPlan;
  expenses: Expense[];
}

/** Fields an expense edit may change; `id` is fixed. */
export type ExpensePatch = Partial<Omit<Expense, 'id'>>;

export interface BudgetActions {
  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, patch: ExpensePatch) => void;
  deleteExpense: (id: string) => void;
  /** Changes one partner's income only; the other one is untouched. */
  setMemberIncome: (memberId: MemberId, income: number) => void;
  setLimit: (envelopeId: EnvelopeId, amount: number) => void;
  lockPlan: () => void;
  unlockPlan: () => void;
}

type BudgetAction =
  | { type: 'addExpense'; expense: Expense }
  | { type: 'updateExpense'; id: string; patch: ExpensePatch }
  | { type: 'deleteExpense'; id: string }
  | { type: 'setMemberIncome'; memberId: MemberId; income: number }
  | { type: 'setLimit'; envelopeId: EnvelopeId; amount: number }
  | { type: 'lockPlan' }
  | { type: 'unlockPlan' };

/** The starting point until real data arrives. */
export const INITIAL_BUDGET_STATE: BudgetState = {
  household: MOCK_HOUSEHOLD,
  members: [...MOCK_MEMBERS],
  month: {
    ...MOCK_MONTH,
    incomes: { ...MOCK_MONTH.incomes },
    limits: { ...MOCK_MONTH.limits },
  },
  expenses: MOCK_EXPENSES,
};

/** Integer PKR, never negative, never NaN. */
function wholePkr(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

function withWholePkr(expense: Expense): Expense {
  return { ...expense, amount: wholePkr(expense.amount) };
}

function budgetReducer(state: BudgetState, action: BudgetAction): BudgetState {
  switch (action.type) {
    case 'addExpense': {
      const expense = withWholePkr(action.expense);
      if (expense.amount <= 0) return state;
      return { ...state, expenses: [expense, ...state.expenses] };
    }

    case 'updateExpense': {
      return {
        ...state,
        expenses: state.expenses.map((expense) =>
          expense.id === action.id
            ? withWholePkr({ ...expense, ...action.patch, id: expense.id })
            : expense,
        ),
      };
    }

    case 'deleteExpense': {
      return {
        ...state,
        expenses: state.expenses.filter((expense) => expense.id !== action.id),
      };
    }

    case 'setMemberIncome': {
      // Only an existing member can be updated, and only their own row: the
      // other partner's income is a separate entry and is never touched.
      if (!state.members.some((member) => member.id === action.memberId)) return state;
      return {
        ...state,
        month: {
          ...state.month,
          incomes: {
            ...state.month.incomes,
            [action.memberId]: wholePkr(action.income),
          },
        },
      };
    }

    case 'setLimit': {
      return {
        ...state,
        month: {
          ...state.month,
          limits: { ...state.month.limits, [action.envelopeId]: wholePkr(action.amount) },
        },
      };
    }

    case 'lockPlan': {
      // A plan can never be locked while the envelopes add up to more than the
      // combined income — the screen disables the button, the reducer enforces
      // it against the derived total.
      if (totalLimits(state.month.limits) > combinedIncome(state.month.incomes)) return state;
      return { ...state, month: { ...state.month, locked: true } };
    }

    case 'unlockPlan': {
      return { ...state, month: { ...state.month, locked: false } };
    }

    default: {
      return state;
    }
  }
}

export type BudgetContextValue = BudgetState & BudgetActions;

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(budgetReducer, INITIAL_BUDGET_STATE);

  const actions = useMemo<BudgetActions>(
    () => ({
      addExpense: (expense) => dispatch({ type: 'addExpense', expense }),
      updateExpense: (id, patch) => dispatch({ type: 'updateExpense', id, patch }),
      deleteExpense: (id) => dispatch({ type: 'deleteExpense', id }),
      setMemberIncome: (memberId, income) =>
        dispatch({ type: 'setMemberIncome', memberId, income }),
      setLimit: (envelopeId, amount) => dispatch({ type: 'setLimit', envelopeId, amount }),
      lockPlan: () => dispatch({ type: 'lockPlan' }),
      unlockPlan: () => dispatch({ type: 'unlockPlan' }),
    }),
    [],
  );

  const value = useMemo<BudgetContextValue>(
    () => ({ ...state, ...actions }),
    [state, actions],
  );

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudget(): BudgetContextValue {
  const value = useContext(BudgetContext);

  if (!value) {
    throw new Error('useBudget must be used inside <BudgetProvider>');
  }

  return value;
}
