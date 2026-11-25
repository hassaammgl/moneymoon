/**
 * BudgetStore — the single source of truth for the household, the month plan
 * and the expenses.
 *
 * Screens never import `data/mock.ts`: they read state and call actions on
 * `useBudget()`. Every mutation lives here, in one reducer, so swapping the
 * mock for Firestore later touches this file only.
 *
 * Derived values (spent, left, buffer, per-envelope and per-group totals) are
 * never stored — they are computed from `lib/budget.ts` selectors at render.
 *
 * Money is always integer PKR. Inputs are clamped to whole PKR >= 0, so a
 * slider drag or a typed amount can never put a float or a negative into state.
 */
import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';

import type { EnvelopeId } from '@/constants/envelopes';
import {
  MOCK_EXPENSES,
  MOCK_HOUSEHOLD,
  MOCK_MONTH,
  type Expense,
  type Household,
  type MonthPlan,
} from '@/data/mock';

export interface BudgetState {
  household: Household;
  month: MonthPlan;
  expenses: Expense[];
}

/** Fields an expense edit may change; `id` is fixed. */
export type ExpensePatch = Partial<Omit<Expense, 'id'>>;

export interface BudgetActions {
  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, patch: ExpensePatch) => void;
  deleteExpense: (id: string) => void;
  setIncome: (income: number) => void;
  setLimit: (envelopeId: EnvelopeId, amount: number) => void;
  lockPlan: () => void;
  unlockPlan: () => void;
}

type BudgetAction =
  | { type: 'addExpense'; expense: Expense }
  | { type: 'updateExpense'; id: string; patch: ExpensePatch }
  | { type: 'deleteExpense'; id: string }
  | { type: 'setIncome'; income: number }
  | { type: 'setLimit'; envelopeId: EnvelopeId; amount: number }
  | { type: 'lockPlan' }
  | { type: 'unlockPlan' };

/** The starting point until real data arrives. */
export const INITIAL_BUDGET_STATE: BudgetState = {
  household: MOCK_HOUSEHOLD,
  month: { ...MOCK_MONTH, limits: { ...MOCK_MONTH.limits } },
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

    case 'setIncome': {
      return { ...state, month: { ...state.month, income: wholePkr(action.income) } };
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
      setIncome: (income) => dispatch({ type: 'setIncome', income }),
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
