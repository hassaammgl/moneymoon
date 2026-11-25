/**
 * BudgetStore — the single source of truth for the household, the month plan
 * and the expenses.
 *
 * Screens never import `data/mock.ts`: they read state and call actions on
 * `useBudget()`. The reducer (`store/budget-reducer.ts`) applies every change
 * optimistically; the same change is handed to the repository adapter, which is
 * an in-memory mock today and Supabase later. The action signatures are the seam
 * the data layer plugs into: screens call them and never learn whether the state
 * came from a reducer or the network.
 *
 * Derived values (spent, left, buffer, per-envelope and per-group totals) are
 * never stored — they are computed from `lib/budget.ts` selectors at render.
 *
 * Money is always integer PKR. Inputs are clamped to whole PKR >= 0, so a
 * slider drag or a typed amount can never put a float or a negative into state.
 */
import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';

import type { EnvelopeId } from '@/constants/envelopes';
import type { BudgetSnapshot, Expense, ExpensePatch, MemberId } from '@/domain/types';
import { INITIAL_BUDGET_STATE, mockRepositories } from '@/repositories/mock';
import { budgetReducer } from '@/store/budget-reducer';

export type BudgetState = BudgetSnapshot;

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

export type BudgetContextValue = BudgetState & BudgetActions;

const BudgetContext = createContext<BudgetContextValue | null>(null);

/** The month every action targets; month switching arrives with the sync phase. */
const MONTH_ID = INITIAL_BUDGET_STATE.month.id;

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(budgetReducer, INITIAL_BUDGET_STATE);

  const actions = useMemo<BudgetActions>(
    () => ({
      addExpense: (expense) => {
        dispatch({ type: 'addExpense', expense });
        void mockRepositories.expenses.create(expense);
      },
      updateExpense: (id, patch) => {
        dispatch({ type: 'updateExpense', id, patch });
        void mockRepositories.expenses.update(id, patch);
      },
      deleteExpense: (id) => {
        dispatch({ type: 'deleteExpense', id });
        void mockRepositories.expenses.remove(id);
      },
      setMemberIncome: (memberId, income) => {
        dispatch({ type: 'setMemberIncome', memberId, income });
        void mockRepositories.income.set(memberId, MONTH_ID, income);
      },
      setLimit: (envelopeId, amount) => {
        dispatch({ type: 'setLimit', envelopeId, amount });
        void mockRepositories.budget.setLimit(MONTH_ID, envelopeId, amount);
      },
      lockPlan: () => {
        dispatch({ type: 'lockPlan' });
        void mockRepositories.budget.lock(MONTH_ID);
      },
      unlockPlan: () => {
        dispatch({ type: 'unlockPlan' });
        void mockRepositories.budget.unlock(MONTH_ID);
      },
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
