-- Moneymoon — index coverage and RLS init-plan clean-up.
--
-- 1. Every foreign key gets a covering index, so lookups by member, creator or
--    invitation code stay cheap as the households grow.
-- 2. Policies evaluate `auth.uid()` once per query instead of once per row
--    (Supabase advisor `auth_rls_initplan`).

-- Foreign-key indexes -------------------------------------------------------
create index budgets_locked_by_idx
  on public.budgets (locked_by);

create index dream_contributions_member_idx
  on public.dream_contributions (member_id);

create index expenses_created_by_member_idx
  on public.expenses (created_by_member_id);

create index expenses_paid_by_member_idx
  on public.expenses (paid_by_member_id);

create index household_invites_accepted_by_idx
  on public.household_invites (accepted_by);

create index household_invites_created_by_idx
  on public.household_invites (created_by);

create index households_created_by_idx
  on public.households (created_by);

-- Policies: one auth.uid() per query ---------------------------------------
drop policy profiles_select_self_or_household on public.profiles;
create policy profiles_select_self_or_household
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.shares_household_with(id));

drop policy profiles_update_self on public.profiles;
create policy profiles_update_self
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy household_members_select_member on public.household_members;
create policy household_members_select_member
  on public.household_members for select to authenticated
  using (user_id = (select auth.uid()) or public.is_household_member(household_id));
