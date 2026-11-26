/**
 * BudgetStore — the single source of truth for the household, the month plan
 * and the expenses.
 *
 * Step 5A: the store now loads one month from Supabase through the read
 * repositories and replaces its state with the result. Screens keep reading
 * `useBudget()` and learn nothing about the backend; the extra fields below
 * (`status`, `error`, `hasBudget`, `reload`) only exist so the gate can show a
 * loading or error screen instead of flashing empty numbers.
 *
 * Writes are still local to the session: the reducer applies them so the UI is
 * instant, but nothing is sent to Postgres yet. The sync phase routes the same
 * actions through real repository methods with optimistic rollback.
 *
 * Never stored, always derived: spent, left, buffer and per-envelope totals are
 * computed by `lib/budget.ts` at render time, and combined income is summed
 * from the two per-partner rows.
 *
 * Money is always integer PKR. Inputs are clamped to whole PKR >= 0, so a
 * slider drag or a typed amount can never put a float or a negative into state.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react';

import type { EnvelopeId } from '@/constants/envelopes';
import type { BudgetSnapshot, Expense, ExpensePatch, MemberId } from '@/domain/types';
import { currentMonthId } from '@/lib/month';
import { useSession } from '@/providers/session';
import { describeDataError, isAuthError } from '@/repositories/errors';
import { emptySnapshot, loadBudgetSnapshot } from '@/repositories/load';
import { supabaseRepositories } from '@/repositories/supabase';
import { budgetReducer } from '@/store/budget-reducer';

export type BudgetState = BudgetSnapshot;

/** `idle` = signed out or still onboarding, so there is nothing to load. */
export type BudgetStatus = 'idle' | 'loading' | 'ready' | 'error';

interface LoadState {
  status: BudgetStatus;
  error: string | null;
  hasBudget: boolean;
}

type LoadAction =
  | { type: 'reset' }
  | { type: 'start' }
  | { type: 'success'; hasBudget: boolean }
  | { type: 'failure'; error: string };

const INITIAL_LOAD_STATE: LoadState = { status: 'idle', error: null, hasBudget: false };

/**
 * The load lifecycle lives in a reducer rather than three `useState`s so the
 * effect only dispatches — never sets state synchronously, which would render
 * twice on every mount.
 */
function loadReducer(state: LoadState, action: LoadAction): LoadState {
  switch (action.type) {
    case 'reset':
      return state.status === 'idle' && !state.hasBudget && state.error === null
        ? state
        : INITIAL_LOAD_STATE;
    case 'start':
      return { status: 'loading', error: null, hasBudget: state.hasBudget };
    case 'success':
      return { status: 'ready', error: null, hasBudget: action.hasBudget };
    case 'failure':
      return { status: 'error', error: action.error, hasBudget: false };
    default:
      return state;
  }
}

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

export interface BudgetContextValue extends BudgetState, BudgetActions {
  status: BudgetStatus;
  /** One sentence for the gate when `status` is `error`. */
  error: string | null;
  /** False when this month has no saved plan (the month loads as zeros). */
  hasBudget: boolean;
  /** Re-runs the read for the current month. */
  reload: () => void;
}

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const { status: sessionStatus, household, signOut } = useSession();

  const [attempt, setAttempt] = useState(0);
  // Captured at mount and re-read on reload, so an app left open past midnight
  // picks up a new month. Month switching itself arrives with the sync phase.
  const [monthId, setMonthId] = useState(() => currentMonthId());

  const [state, dispatch] = useReducer(budgetReducer, monthId, emptySnapshot);
  const [load, dispatchLoad] = useReducer(loadReducer, INITIAL_LOAD_STATE);

  const householdId = household?.id ?? null;

  useEffect(() => {
    // Signed out, or signed in without a household: no rows to read and no mock
    // values to show. The gate sends the user to login or onboarding.
    if (sessionStatus !== 'signedIn' || !householdId) {
      dispatch({ type: 'replace', snapshot: emptySnapshot(monthId) });
      dispatchLoad({ type: 'reset' });
      return;
    }

    let active = true;

    dispatchLoad({ type: 'start' });

    loadBudgetSnapshot(supabaseRepositories, monthId)
      .then(({ snapshot, hasBudget: monthSaved }) => {
        if (!active) return;
        dispatch({ type: 'replace', snapshot });
        dispatchLoad({ type: 'success', hasBudget: monthSaved });
      })
      .catch((cause: unknown) => {
        if (!active) return;
        // No silent fallback: the previous snapshot is not shown as if it were
        // fresh, and the gate shows this message with a retry button.
        dispatchLoad({ type: 'failure', error: describeDataError(cause) });

        if (isAuthError(cause)) {
          // The session cannot be recovered by retrying; drop it so the gate
          // returns to login and the user can request a new code.
          void signOut();
        }
      });

    return () => {
      active = false;
    };
  }, [sessionStatus, householdId, monthId, attempt, signOut]);

  const reload = useCallback(() => {
    setMonthId(currentMonthId());
    setAttempt((current) => current + 1);
  }, []);

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
    () => ({
      ...state,
      ...actions,
      status: load.status,
      error: load.error,
      hasBudget: load.hasBudget,
      reload,
    }),
    [state, actions, load, reload],
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
