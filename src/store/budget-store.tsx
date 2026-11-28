/**
 * BudgetStore — the single source of truth for the household, the month plan
 * and the expenses.
 *
 * Reads load one month from Supabase and replace the state with the result.
 * Writes are optimistic: the reducer applies the change immediately, the same
 * change goes to Postgres, and a failure rolls the UI back and surfaces one
 * sentence in `mutationError`. Screens keep calling `useBudget()` and never
 * touch a repository.
 *
 * The open month can be switched from Our Plan; every read and write follows
 * the month of the snapshot on screen, and the current calendar month is the
 * upper bound.
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
  useRef,
  useState,
  type ReactNode,
} from 'react';

import type { EnvelopeId } from '@/constants/envelopes';
import type {
  BudgetSnapshot,
  Expense,
  ExpensePatch,
  MemberId,
  MonthId,
  NewEnvelope,
} from '@/domain/types';
import { createId } from '@/lib/id';
import { currentMonthId } from '@/lib/month';
import { useSession } from '@/providers/session';
import { describeDataError, describeWriteError, isAuthError } from '@/repositories/errors';
import { emptySnapshot, loadBudgetSnapshot } from '@/repositories/load';
import { supabaseRepositories } from '@/repositories/supabase';
import { budgetReducer, wholePkr } from '@/store/budget-reducer';

export type BudgetState = BudgetSnapshot;

/** `idle` = signed out or still onboarding, so there is nothing to load. */
export type BudgetStatus = 'idle' | 'loading' | 'ready' | 'error';

interface LoadState {
  status: BudgetStatus;
  error: string | null;
  hasBudget: boolean;
  /** A month change keeps the old numbers on screen while the new one loads. */
  switching: boolean;
}

type LoadAction =
  | { type: 'reset' }
  | { type: 'start' }
  | { type: 'success'; hasBudget: boolean }
  | { type: 'saved' }
  | { type: 'failure'; error: string };

const INITIAL_LOAD_STATE: LoadState = {
  status: 'idle',
  error: null,
  hasBudget: false,
  switching: false,
};

/**
 * The load lifecycle lives in a reducer rather than three `useState`s so the
 * effect only dispatches — never sets state synchronously, which would render
 * twice on every mount.
 */
function loadReducer(state: LoadState, action: LoadAction): LoadState {
  switch (action.type) {
    case 'reset':
      return state.status === 'idle' &&
        !state.hasBudget &&
        state.error === null &&
        !state.switching
        ? state
        : INITIAL_LOAD_STATE;
    case 'start':
      // A switch keeps `ready` so the screens stay mounted; the plain loading
      // screen is only for the first load and for retries after an error.
      return state.status === 'ready'
        ? { ...state, error: null, switching: true }
        : { status: 'loading', error: null, hasBudget: state.hasBudget, switching: false };
    case 'success':
      return { status: 'ready', error: null, hasBudget: action.hasBudget, switching: false };
    case 'saved':
      // A write created the month's budget row, so the no-plan note can go.
      return state.hasBudget ? state : { ...state, hasBudget: true };
    case 'failure':
      return { status: 'error', error: action.error, hasBudget: false, switching: false };
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
  /** Moves the slider locally; nothing is written yet. */
  setLimit: (envelopeId: EnvelopeId, amount: number) => void;
  /** Writes the value the slider settled on. */
  commitLimit: (envelopeId: EnvelopeId, amount: number) => void;
  /** Adds a household category and its first limit for the open month. */
  addEnvelope: (input: NewEnvelope) => void;
  lockPlan: () => void;
  unlockPlan: () => void;
  /** Loads another month. The current month is the upper bound. */
  setMonth: (monthId: MonthId) => void;
}

export interface BudgetContextValue extends BudgetState, BudgetActions {
  status: BudgetStatus;
  /** One sentence for the gate when `status` is `error`. */
  error: string | null;
  /** False when this month has no saved plan (the month loads as zeros). */
  hasBudget: boolean;
  /** True while another month is loading; the previous one stays visible. */
  switching: boolean;
  /** Re-runs the read for the open month. */
  reload: () => void;
  /** The last write that failed, cleared by the banner. */
  mutationError: string | null;
  dismissMutationError: () => void;
}

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const { status: sessionStatus, household, signOut } = useSession();

  const [attempt, setAttempt] = useState(0);
  // The month on screen. Starts at today's month; Our Plan can switch it back
  // or forward up to the current month, and every screen follows this value.
  const [monthId, setMonthId] = useState(() => currentMonthId());

  const [state, dispatch] = useReducer(budgetReducer, monthId, emptySnapshot);
  const [load, dispatchLoad] = useReducer(loadReducer, INITIAL_LOAD_STATE);
  const [mutationError, setMutationError] = useState<string | null>(null);

  // The optimistic rollback needs the snapshot as it was when the write began.
  // A ref keeps that read out of the action callbacks' dependency lists.
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

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
        setMutationError(null);
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
    setAttempt((current) => current + 1);
  }, []);

  /**
   * Switches the month every screen reads. The current calendar month is the
   * upper bound: there is nothing to plan in the future yet, and a past month
   * is only ever reached by stepping back.
   */
  const setMonth = useCallback((next: MonthId) => {
    if (next > currentMonthId()) return;
    setMutationError(null);
    setMonthId(next);
  }, []);

  const dismissMutationError = useCallback(() => {
    setMutationError(null);
  }, []);

  const failWrite = useCallback(
    (cause: unknown) => {
      setMutationError(describeWriteError(cause));
      if (isAuthError(cause)) void signOut();
    },
    [signOut],
  );

  /** The month of the snapshot on screen; writes always follow what is visible. */
  const openMonthId = useCallback(() => stateRef.current.month.id, []);

  /**
   * Re-reads the month without showing the full-screen loader. Used when a
   * limit write fails: the slider already moved, so the honest value comes from
   * the database rather than from a possibly stale rollback snapshot.
   */
  const refreshSilently = useCallback(async () => {
    try {
      const { snapshot, hasBudget: monthSaved } = await loadBudgetSnapshot(
        supabaseRepositories,
        openMonthId(),
      );
      dispatch({ type: 'replace', snapshot });
      dispatchLoad({ type: 'success', hasBudget: monthSaved });
    } catch (cause: unknown) {
      failWrite(cause);
    }
  }, [openMonthId, failWrite]);

  const addExpense = useCallback(
    (expense: Expense) => {
      const before = stateRef.current;
      setMutationError(null);
      dispatch({ type: 'addExpense', expense });

      void supabaseRepositories.expenses
        .create(openMonthId(), expense)
        .then((stored) => {
          dispatch({ type: 'updateExpense', id: stored.id, patch: stored });
          dispatchLoad({ type: 'saved' });
        })
        .catch((cause: unknown) => {
          dispatch({ type: 'replace', snapshot: before });
          failWrite(cause);
        });
    },
    [openMonthId, failWrite],
  );

  const updateExpense = useCallback(
    (id: string, patch: ExpensePatch) => {
      const before = stateRef.current;
      setMutationError(null);
      dispatch({ type: 'updateExpense', id, patch });

      void supabaseRepositories.expenses
        .update(id, patch)
        .then((stored) => {
          if (!stored) {
            dispatch({ type: 'replace', snapshot: before });
            setMutationError('This expense no longer exists.');
            return;
          }
          dispatch({ type: 'updateExpense', id: stored.id, patch: stored });
        })
        .catch((cause: unknown) => {
          dispatch({ type: 'replace', snapshot: before });
          failWrite(cause);
        });
    },
    [failWrite],
  );

  const deleteExpense = useCallback(
    (id: string) => {
      const before = stateRef.current;
      setMutationError(null);
      dispatch({ type: 'deleteExpense', id });

      void supabaseRepositories.expenses.remove(id).catch((cause: unknown) => {
        dispatch({ type: 'replace', snapshot: before });
        failWrite(cause);
      });
    },
    [failWrite],
  );

  const setMemberIncome = useCallback(
    (memberId: MemberId, income: number) => {
      const before = stateRef.current;
      setMutationError(null);
      dispatch({ type: 'setMemberIncome', memberId, income });

      void supabaseRepositories.income
        .set(memberId, openMonthId(), income)
        .then((stored) => {
          dispatch({ type: 'setMemberIncome', memberId, income: stored });
        })
        .catch((cause: unknown) => {
          dispatch({ type: 'replace', snapshot: before });
          failWrite(cause);
        });
    },
    [openMonthId, failWrite],
  );

  const commitLimit = useCallback(
    (envelopeId: EnvelopeId, amount: number) => {
      setMutationError(null);

      void supabaseRepositories.budget
        .setLimit(openMonthId(), envelopeId, amount)
        .then(() => dispatchLoad({ type: 'saved' }))
        .catch((cause: unknown) => {
          failWrite(cause);
          void refreshSilently();
        });
    },
    [openMonthId, failWrite, refreshSilently],
  );

  const addEnvelope = useCallback(
    (input: NewEnvelope) => {
      const name = input.name.trim();
      if (!name) return;

      const before = stateRef.current;
      const envelope = {
        id: createId(),
        name,
        icon: input.icon,
        tone: input.tone,
      };
      const limit = wholePkr(input.limit);

      setMutationError(null);
      dispatch({ type: 'addEnvelope', envelope, limit });

      void supabaseRepositories.envelopes
        .create(envelope, openMonthId(), limit)
        .catch((cause: unknown) => {
          dispatch({ type: 'replace', snapshot: before });
          failWrite(cause);
        });
    },
    [openMonthId, failWrite],
  );

  const lockPlan = useCallback(() => {
    const before = stateRef.current;
    setMutationError(null);
    dispatch({ type: 'lockPlan' });

    void supabaseRepositories.budget
      .lock(openMonthId())
      .then((locked) => {
        if (!locked) dispatch({ type: 'unlockPlan' });
      })
      .catch((cause: unknown) => {
        dispatch({ type: 'replace', snapshot: before });
        failWrite(cause);
      });
  }, [openMonthId, failWrite]);

  const unlockPlan = useCallback(() => {
    const before = stateRef.current;
    setMutationError(null);
    dispatch({ type: 'unlockPlan' });

    void supabaseRepositories.budget
      .unlock(openMonthId())
      .then((locked) => {
        if (locked) dispatch({ type: 'lockPlan' });
      })
      .catch((cause: unknown) => {
        dispatch({ type: 'replace', snapshot: before });
        failWrite(cause);
      });
  }, [openMonthId, failWrite]);

  const actions = useMemo<BudgetActions>(
    () => ({
      addExpense,
      updateExpense,
      deleteExpense,
      setMemberIncome,
      setLimit: (envelopeId, amount) => dispatch({ type: 'setLimit', envelopeId, amount }),
      commitLimit,
      addEnvelope,
      lockPlan,
      unlockPlan,
      setMonth,
    }),
    [
      addExpense,
      updateExpense,
      deleteExpense,
      setMemberIncome,
      commitLimit,
      addEnvelope,
      lockPlan,
      unlockPlan,
      setMonth,
    ],
  );

  const value = useMemo<BudgetContextValue>(
    () => ({
      ...state,
      ...actions,
      status: load.status,
      error: load.error,
      hasBudget: load.hasBudget,
      switching: load.switching,
      reload,
      mutationError,
      dismissMutationError,
    }),
    [state, actions, load, reload, mutationError, dismissMutationError],
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
