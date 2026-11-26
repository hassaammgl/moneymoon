/**
 * Snapshot loading — one household, one month, from any read adapter.
 *
 * The store calls this and receives either a complete snapshot or a throw; it
 * never assembles half a household from different sources. Missing budgets and
 * missing income rows are data, not failures: the month simply comes back
 * empty so screens show zeros instead of fake seed values.
 */
import { emptyLimits } from '@/constants/envelopes';
import type { BudgetSnapshot, MonthId } from '@/domain/types';
import type { ReadRepositories } from '@/repositories/types';

export interface LoadedBudget {
  snapshot: BudgetSnapshot;
  /** False when the household has no saved budget row for the month. */
  hasBudget: boolean;
}

/** The state before (or without) a load: no household, no money, no rows. */
export function emptySnapshot(monthId: MonthId): BudgetSnapshot {
  return {
    household: { id: '', name: '', code: '' },
    members: [],
    month: { id: monthId, incomes: {}, locked: false, limits: emptyLimits() },
    expenses: [],
  };
}

export async function loadBudgetSnapshot(
  repositories: ReadRepositories,
  monthId: MonthId,
): Promise<LoadedBudget> {
  const household = await repositories.household.get();

  const [members, incomes, budget, expenses] = await Promise.all([
    repositories.household.listMembers(),
    repositories.income.listForMonth(monthId),
    repositories.budget.getMonth(monthId),
    repositories.expenses.list(monthId),
  ]);

  return {
    snapshot: {
      household,
      members,
      month: {
        id: monthId,
        // Per-partner only; the household total is derived by the selectors.
        incomes,
        locked: budget.locked,
        limits: budget.limits,
      },
      expenses,
    },
    hasBudget: budget.id !== null,
  };
}
