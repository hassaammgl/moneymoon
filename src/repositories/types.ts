/**
 * Backend-independent repository contracts.
 *
 * The store talks to these; screens never do, and nothing here imports Supabase.
 * Every method is async so the mock adapter and a future Supabase adapter are
 * interchangeable without touching `useBudget()` or any screen.
 *
 * Scope: one household per signed-in session, so reads are month-scoped. Once
 * auth exists the household is implied by the session; an explicit
 * `householdId` can be added without changing call sites (the store owns it).
 *
 * Realtime subscriptions and version checks are deliberately absent: they
 * belong to the sync phase, and adding unused seams now would only rot.
 */
import type { EnvelopeId } from '@/constants/envelopes';
import type {
  DreamGoal,
  Expense,
  ExpensePatch,
  Household,
  IncomeByMember,
  Member,
  MemberId,
  MonthId,
  MonthPlan,
} from '@/domain/types';

export interface HouseholdRepository {
  get(): Promise<Household>;
  listMembers(): Promise<Member[]>;
}

export interface IncomeRepository {
  /** One amount per partner for the month. */
  listForMonth(monthId: MonthId): Promise<IncomeByMember>;
  /** Writes one partner's row only; resolves with the stored amount. */
  set(memberId: MemberId, monthId: MonthId, amountPkr: number): Promise<number>;
}

export interface BudgetRepository {
  getMonth(monthId: MonthId): Promise<MonthPlan>;
  /** Resolves with the stored limit (whole PKR, >= 0). */
  setLimit(monthId: MonthId, envelopeId: EnvelopeId, amountPkr: number): Promise<number>;
  /** Returns whether the plan is locked afterwards; refuses while over income. */
  lock(monthId: MonthId): Promise<boolean>;
  unlock(monthId: MonthId): Promise<boolean>;
}

export interface ExpenseRepository {
  list(monthId: MonthId): Promise<Expense[]>;
  /** `expense.id` is the idempotency key, minted on the device. */
  create(expense: Expense): Promise<Expense>;
  /** Resolves with the stored row, or `null` if the id is unknown. */
  update(id: string, patch: ExpensePatch): Promise<Expense | null>;
  remove(id: string): Promise<void>;
}

export interface DreamGoalRepository {
  get(): Promise<DreamGoal>;
}

/** The five repositories the store composes. */
export interface Repositories {
  household: HouseholdRepository;
  income: IncomeRepository;
  budget: BudgetRepository;
  expenses: ExpenseRepository;
  dreamGoal: DreamGoalRepository;
}
