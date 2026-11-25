-- Moneymoon — triggers, RLS policies and grants.
--
-- Every table has RLS enabled and is readable only by the two active members of
-- the household. Membership, invites and plan locking are write-only through the
-- security-definer RPCs from the previous migration, so no policy allows direct
-- inserts into those tables.

-- Updated-at / version triggers --------------------------------------------
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger households_touch_updated_at
  before update on public.households
  for each row execute function public.set_updated_at();

create trigger household_members_touch_updated_at
  before update on public.household_members
  for each row execute function public.set_updated_at();

create trigger monthly_incomes_touch_versioned
  before update on public.monthly_incomes
  for each row execute function public.touch_versioned();

create trigger budgets_touch_versioned
  before update on public.budgets
  for each row execute function public.touch_versioned();

create trigger budget_envelopes_touch_versioned
  before update on public.budget_envelopes
  for each row execute function public.touch_versioned();

create trigger expenses_touch_versioned
  before update on public.expenses
  for each row execute function public.touch_versioned();

create trigger dream_goals_touch_versioned
  before update on public.dream_goals
  for each row execute function public.touch_versioned();

create trigger dream_contributions_touch_versioned
  before update on public.dream_contributions
  for each row execute function public.touch_versioned();

-- The hard two-member invariant --------------------------------------------
create trigger household_members_two_max
  before insert or update of status, household_id on public.household_members
  for each row execute function public.enforce_two_members();

-- Locked plans cannot be changed through any path --------------------------
create trigger budget_envelopes_locked_guard
  before insert or update on public.budget_envelopes
  for each row execute function public.enforce_unlocked_envelope();

create trigger monthly_incomes_locked_guard
  before insert or update on public.monthly_incomes
  for each row execute function public.enforce_unlocked_income();

-- New auth users get a profile ---------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row level security --------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invites enable row level security;
alter table public.monthly_incomes enable row level security;
alter table public.budgets enable row level security;
alter table public.budget_envelopes enable row level security;
alter table public.expenses enable row level security;
alter table public.dream_goals enable row level security;
alter table public.dream_contributions enable row level security;

-- profiles ------------------------------------------------------------------
create policy profiles_select_self_or_household
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.shares_household_with(id));

create policy profiles_update_self
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- households ----------------------------------------------------------------
create policy households_select_member
  on public.households for select to authenticated
  using (public.is_household_member(id));

-- household_members ---------------------------------------------------------
create policy household_members_select_member
  on public.household_members for select to authenticated
  using (user_id = auth.uid() or public.is_household_member(household_id));

-- household_invites ---------------------------------------------------------
create policy household_invites_select_member
  on public.household_invites for select to authenticated
  using (public.is_household_member(household_id));

-- monthly_incomes -----------------------------------------------------------
create policy monthly_incomes_select_member
  on public.monthly_incomes for select to authenticated
  using (public.is_household_member(household_id));

create policy monthly_incomes_insert_own_unlocked
  on public.monthly_incomes for insert to authenticated
  with check (
    member_id = public.my_member_id(household_id)
    and not public.is_month_locked(household_id, month_start)
  );

create policy monthly_incomes_update_own_unlocked
  on public.monthly_incomes for update to authenticated
  using (
    member_id = public.my_member_id(household_id)
    and not public.is_month_locked(household_id, month_start)
  )
  with check (
    member_id = public.my_member_id(household_id)
    and not public.is_month_locked(household_id, month_start)
  );

-- budgets -------------------------------------------------------------------
create policy budgets_select_member
  on public.budgets for select to authenticated
  using (public.is_household_member(household_id));

-- budget_envelopes ----------------------------------------------------------
create policy budget_envelopes_select_member
  on public.budget_envelopes for select to authenticated
  using (public.is_household_member(household_id));

create policy budget_envelopes_insert_member_unlocked
  on public.budget_envelopes for insert to authenticated
  with check (
    public.is_household_member(household_id)
    and not public.is_budget_locked(budget_id)
    and exists (
      select 1 from public.budgets b
      where b.id = budget_envelopes.budget_id
        and b.household_id = budget_envelopes.household_id
    )
  );

create policy budget_envelopes_update_member_unlocked
  on public.budget_envelopes for update to authenticated
  using (
    public.is_household_member(household_id)
    and not public.is_budget_locked(budget_id)
  )
  with check (
    public.is_household_member(household_id)
    and not public.is_budget_locked(budget_id)
    and exists (
      select 1 from public.budgets b
      where b.id = budget_envelopes.budget_id
        and b.household_id = budget_envelopes.household_id
    )
  );

-- expenses ------------------------------------------------------------------
create policy expenses_select_member
  on public.expenses for select to authenticated
  using (public.is_household_member(household_id));

create policy expenses_insert_member
  on public.expenses for insert to authenticated
  with check (
    public.is_household_member(household_id)
    and created_by_member_id = public.my_member_id(household_id)
    and exists (
      select 1 from public.budgets b
      where b.id = expenses.budget_id
        and b.household_id = expenses.household_id
    )
    and exists (
      select 1 from public.household_members m
      where m.id = expenses.paid_by_member_id
        and m.household_id = expenses.household_id
    )
  );

create policy expenses_update_member
  on public.expenses for update to authenticated
  using (public.is_household_member(household_id))
  with check (
    public.is_household_member(household_id)
    and exists (
      select 1 from public.budgets b
      where b.id = expenses.budget_id
        and b.household_id = expenses.household_id
    )
    and exists (
      select 1 from public.household_members m
      where m.id = expenses.paid_by_member_id
        and m.household_id = expenses.household_id
    )
  );

-- No delete policy: expenses are soft-deleted by updating `deleted_at`.

-- dream_goals ---------------------------------------------------------------
create policy dream_goals_select_member
  on public.dream_goals for select to authenticated
  using (public.is_household_member(household_id));

create policy dream_goals_insert_member
  on public.dream_goals for insert to authenticated
  with check (public.is_household_member(household_id));

create policy dream_goals_update_member
  on public.dream_goals for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

-- dream_contributions -------------------------------------------------------
create policy dream_contributions_select_member
  on public.dream_contributions for select to authenticated
  using (public.is_household_member(household_id));

create policy dream_contributions_insert_member
  on public.dream_contributions for insert to authenticated
  with check (
    member_id = public.my_member_id(household_id)
    and exists (
      select 1 from public.dream_goals g
      where g.id = dream_contributions.goal_id
        and g.household_id = dream_contributions.household_id
    )
  );

create policy dream_contributions_update_member
  on public.dream_contributions for update to authenticated
  using (public.is_household_member(household_id))
  with check (
    public.is_household_member(household_id)
    and exists (
      select 1 from public.dream_goals g
      where g.id = dream_contributions.goal_id
        and g.household_id = dream_contributions.household_id
    )
  );

-- Privileges ----------------------------------------------------------------
-- RLS decides rows; these grants decide whether the role may touch the table at
-- all. anon gets nothing, public function execution is revoked so the
-- security-definer RPCs cannot be called by signed-out clients.
revoke all on all tables in schema public from anon;
revoke all on all functions in schema public from anon;
revoke all on all functions in schema public from public;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;
