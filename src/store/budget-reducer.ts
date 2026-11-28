/**
 * The one place the budget's business rules live.
 *
 * Pure and React-free: the store runs it as its optimistic reducer, and the mock
 * repository runs the same function on its own copy so the two can never drift.
 * Supabase will enforce these rules server-side too; the client keeps them so
 * the UI is instant and offline-safe.
 */
import type { EnvelopeId } from '@/constants/envelopes';
import type {
  BudgetSnapshot,
  CustomEnvelope,
  Expense,
  ExpensePatch,
  MemberId,
} from '@/domain/types';
import { combinedIncome, totalLimits } from '@/lib/budget';

export type BudgetAction =
  | { type: 'replace'; snapshot: BudgetSnapshot }
  | { type: 'addExpense'; expense: Expense }
  | { type: 'updateExpense'; id: string; patch: ExpensePatch }
  | { type: 'deleteExpense'; id: string }
  | { type: 'setMemberIncome'; memberId: MemberId; income: number }
  | { type: 'setLimit'; envelopeId: EnvelopeId; amount: number }
  | { type: 'addEnvelope'; envelope: CustomEnvelope; limit: number }
  | { type: 'lockPlan' }
  | { type: 'unlockPlan' };

/** Integer PKR, never negative, never NaN. */
export function wholePkr(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

function withWholePkr(expense: Expense): Expense {
  return { ...expense, amount: wholePkr(expense.amount) };
}

export function budgetReducer(state: BudgetSnapshot, action: BudgetAction): BudgetSnapshot {
  switch (action.type) {
    case 'replace': {
      // A fresh read from the backend always wins: screens keep their own
      // optimistic edits until the next load, and there is no merging that
      // could resurrect a stale mock value.
      return action.snapshot;
    }

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

    case 'addEnvelope': {
      if (state.customEnvelopes.some((envelope) => envelope.id === action.envelope.id)) {
        return state;
      }

      const limit = wholePkr(action.limit);

      return {
        ...state,
        customEnvelopes: [...state.customEnvelopes, action.envelope],
        // Only a non-zero first limit touches the month; the category itself is
        // household-wide and shows on every month after this one.
        month:
          limit > 0
            ? {
                ...state.month,
                limits: { ...state.month.limits, [action.envelope.id]: limit },
              }
            : state.month,
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
