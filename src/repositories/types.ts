/**
 * Backend-independent repository contracts.
 *
 * The store talks to these; screens never do, and nothing here imports Supabase.
 * Every method is async so the mock adapter and the Supabase adapter are
 * interchangeable without touching `useBudget()` or any screen.
 *
 * Scope: one household per signed-in session, so reads are month-scoped. Once
 * auth exists the household is implied by the session; an explicit
 * `householdId` can be added without changing call sites (the store owns it).
 *
 * Realtime subscriptions and version checks are deliberately absent: they
 * belong to the sync phase, and adding unused seams now would only rot.
 *
 * Reads and writes share these contracts: the store loads through the read
 * half (`ReadRepositories`) and sends each change through the matching write
 * method, rolling the optimistic state back when one throws.
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

/**
 * The month's budget row plus its envelope limits.
 *
 * `id` is `null` when the household has no budget row for that month yet, which
 * is the normal state for a household that has never saved a plan. Callers must
 * treat that as "no plan", never as zero saved values.
 */
export interface MonthBudget {
  id: string | null;
  locked: boolean;
  limits: Record<EnvelopeId, number>;
}

export interface BudgetRepository {
  getMonth(monthId: MonthId): Promise<MonthBudget>;
  /** Resolves with the stored limit (whole PKR, >= 0). */
  setLimit(monthId: MonthId, envelopeId: EnvelopeId, amountPkr: number): Promise<number>;
  /** Returns whether the plan is locked afterwards; refuses while over income. */
  lock(monthId: MonthId): Promise<boolean>;
  unlock(monthId: MonthId): Promise<boolean>;
}

export interface ExpenseRepository {
  /** Expenses of the budget row that owns `monthId`; other months never leak. */
  list(monthId: MonthId): Promise<Expense[]>;
  /**
   * `expense.id` is the idempotency key, minted on the device. `monthId` picks
   * (or creates) the budget row the expense belongs to.
   */
  create(monthId: MonthId, expense: Expense): Promise<Expense>;
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

/**
 * The read half of each repository — what Step 5A loads through. A backend that
 * only supports reads (this step) can implement this without stubbing writes.
 */
export interface ReadRepositories {
  household: Pick<HouseholdRepository, 'get' | 'listMembers'>;
  income: Pick<IncomeRepository, 'listForMonth'>;
  budget: Pick<BudgetRepository, 'getMonth'>;
  expenses: Pick<ExpenseRepository, 'list'>;
  dreamGoal: Pick<DreamGoalRepository, 'get'>;
}
