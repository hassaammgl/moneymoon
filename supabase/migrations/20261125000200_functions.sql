-- Moneymoon — helpers, RPCs and triggers.
--
-- Security-definer functions run with the owner's rights (they bypass RLS), so
-- each one validates membership itself and pins `search_path`. Privileges are
-- revoked from anon and granted to authenticated in the policies migration.

-- Timestamps and optimistic versioning -------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.touch_versioned()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  new.version = coalesce(old.version, 0) + 1;
  return new;
end;
$$;

-- Household membership helpers ---------------------------------------------
create or replace function public.is_household_member(target_household uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from household_members
    where household_id = target_household
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function public.my_member_id(target_household uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from household_members
  where household_id = target_household
    and user_id = auth.uid()
    and status = 'active'
  limit 1;
$$;

create or replace function public.shares_household_with(target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from household_members me
    join household_members them
      on them.household_id = me.household_id
     and them.status = 'active'
    where me.user_id = auth.uid()
      and me.status = 'active'
      and them.user_id = target_user
  );
$$;

create or replace function public.is_budget_locked(target_budget uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from budgets where id = target_budget and locked
  );
$$;

create or replace function public.is_month_locked(target_household uuid, target_month date)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from budgets
    where household_id = target_household
      and month_start = target_month
      and locked
  );
$$;

-- Join / invite codes -------------------------------------------------------
create or replace function public.generate_join_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate text;
begin
  loop
    -- gen_random_uuid() is cryptographically random; eight hex chars is the
    -- short code the UI shows. Rate limiting lives in the auth/edges phase.
    candidate := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when char_length(candidate) = 8
      and not exists (select 1 from households where join_code = candidate);
  end loop;
  return candidate;
end;
$$;

create or replace function public.generate_invite_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate text;
begin
  loop
    candidate := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when char_length(candidate) = 8
      and not exists (select 1 from household_invites where code = candidate);
  end loop;
  return candidate;
end;
$$;

-- New auth user -> profile --------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(
      coalesce(
        nullif(new.raw_user_meta_data ->> 'display_name', ''),
        nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
        'Partner'
      ),
      60
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Exactly two active members ------------------------------------------------
-- Runs before insert/update and serialises concurrent joins with an advisory
-- lock. The RPCs also count, but the trigger is the invariant: no path can put
-- a third active member into a household.
create or replace function public.enforce_two_members()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  active_count integer;
  was_active boolean := false;
begin
  if tg_op = 'UPDATE' then
    was_active := old.status = 'active';
  end if;

  if new.status = 'active' and not was_active then
    perform pg_advisory_xact_lock(hashtext(new.household_id::text));

    select count(*)
      into active_count
      from household_members
     where household_id = new.household_id
       and status = 'active'
       and id <> new.id;

    if active_count >= 2 then
      raise exception 'household_full';
    end if;
  end if;

  return new;
end;
$$;

-- Locked plans are immutable at the database, not only in the UI.
create or replace function public.enforce_unlocked_envelope()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.is_budget_locked(new.budget_id) then
    raise exception 'plan_locked';
  end if;
  return new;
end;
$$;

create or replace function public.enforce_unlocked_income()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.is_month_locked(new.household_id, new.month_start) then
    raise exception 'plan_locked';
  end if;
  return new;
end;
$$;

-- Household RPCs ------------------------------------------------------------
create or replace function public.create_household(household_name text)
returns public.households
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_name text := btrim(household_name);
  household_row public.households;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if clean_name is null or char_length(clean_name) < 1 or char_length(clean_name) > 60 then
    raise exception 'invalid_household_name';
  end if;

  if exists (
    select 1 from household_members
    where user_id = auth.uid() and status = 'active'
  ) then
    raise exception 'already_in_household';
  end if;

  insert into households (name, join_code, status, created_by)
  values (clean_name, generate_join_code(), 'forming', auth.uid())
  returning * into household_row;

  insert into household_members (household_id, user_id, role, status, joined_at)
  values (household_row.id, auth.uid(), 'partner', 'active', now());

  return household_row;
end;
$$;

create or replace function public.create_household_invite()
returns public.household_invites
language plpgsql
security definer
set search_path = public
as $$
declare
  member_household uuid;
  invite_row public.household_invites;
begin
  select household_id
    into member_household
    from household_members
   where user_id = auth.uid() and status = 'active'
   limit 1;

  if member_household is null then
    raise exception 'no_household';
  end if;

  update household_invites
     set revoked_at = now()
   where household_id = member_household
     and accepted_at is null
     and revoked_at is null;

  insert into household_invites (household_id, code, created_by)
  values (member_household, generate_invite_code(), auth.uid())
  returning * into invite_row;

  return invite_row;
end;
$$;

create or replace function public.accept_invite(invite_code text)
returns public.households
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_row public.household_invites;
  household_row public.households;
  active_count integer;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if exists (
    select 1 from household_members
    where user_id = auth.uid() and status = 'active'
  ) then
    raise exception 'already_in_household';
  end if;

  select *
    into invite_row
    from household_invites
   where code = upper(btrim(invite_code))
     and accepted_at is null
     and revoked_at is null
     and expires_at > now()
   for update;

  if not found then
    raise exception 'invite_invalid';
  end if;

  select *
    into household_row
    from households
   where id = invite_row.household_id
   for update;

  if household_row.status = 'archived' then
    raise exception 'household_archived';
  end if;

  perform pg_advisory_xact_lock(hashtext(household_row.id::text));

  select count(*)
    into active_count
    from household_members
   where household_id = household_row.id
     and status = 'active';

  if active_count >= 2 then
    raise exception 'household_full';
  end if;

  insert into household_members (household_id, user_id, role, status, joined_at)
  values (household_row.id, auth.uid(), 'partner', 'active', now());

  update household_invites
     set accepted_by = auth.uid(), accepted_at = now()
   where id = invite_row.id;

  update households
     set status = 'active'
   where id = household_row.id
  returning * into household_row;

  return household_row;
end;
$$;

create or replace function public.leave_household()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  membership public.household_members;
begin
  select *
    into membership
    from household_members
   where user_id = auth.uid() and status = 'active'
   for update;

  if not found then
    raise exception 'not_a_member';
  end if;

  update household_members
     set status = 'left'
   where id = membership.id;

  update households
     set status = 'archived'
   where id = membership.household_id;

  update household_invites
     set revoked_at = now()
   where household_id = membership.household_id
     and accepted_at is null
     and revoked_at is null;
end;
$$;

-- Budget RPCs ---------------------------------------------------------------
create or replace function public.get_or_create_budget(p_month_start date)
returns public.budgets
language plpgsql
security definer
set search_path = public
as $$
declare
  member_household uuid;
  budget_row public.budgets;
begin
  select household_id
    into member_household
    from household_members
   where user_id = auth.uid() and status = 'active'
   limit 1;

  if member_household is null then
    raise exception 'no_household';
  end if;

  if p_month_start is null or p_month_start <> date_trunc('month', p_month_start)::date then
    raise exception 'month_not_normalized';
  end if;

  insert into budgets (household_id, month_start)
  values (member_household, p_month_start)
  on conflict (household_id, month_start) do nothing
  returning * into budget_row;

  if budget_row is null then
    select *
      into budget_row
      from budgets
     where household_id = member_household
       and month_start = p_month_start;
  end if;

  return budget_row;
end;
$$;

create or replace function public.lock_budget(p_budget_id uuid)
returns public.budgets
language plpgsql
security definer
set search_path = public
as $$
declare
  budget_row public.budgets;
  total_limits bigint;
  total_income bigint;
  acting_member uuid;
begin
  select *
    into budget_row
    from budgets
   where id = p_budget_id
   for update;

  if not found then
    raise exception 'budget_not_found';
  end if;

  if not is_household_member(budget_row.household_id) then
    raise exception 'not_a_member';
  end if;

  if budget_row.locked then
    return budget_row;
  end if;

  select coalesce(sum(limit_pkr), 0)
    into total_limits
    from budget_envelopes
   where budget_id = budget_row.id;

  select coalesce(sum(amount_pkr), 0)
    into total_income
    from monthly_incomes
   where household_id = budget_row.household_id
     and month_start = budget_row.month_start;

  if total_limits > total_income then
    raise exception 'limits_over_income';
  end if;

  acting_member := my_member_id(budget_row.household_id);

  update budgets
     set locked = true,
         locked_at = now(),
         locked_by = acting_member
   where id = budget_row.id
  returning * into budget_row;

  return budget_row;
end;
$$;

create or replace function public.unlock_budget(p_budget_id uuid)
returns public.budgets
language plpgsql
security definer
set search_path = public
as $$
declare
  budget_row public.budgets;
begin
  select *
    into budget_row
    from budgets
   where id = p_budget_id
   for update;

  if not found then
    raise exception 'budget_not_found';
  end if;

  if not is_household_member(budget_row.household_id) then
    raise exception 'not_a_member';
  end if;

  if budget_row.locked then
    update budgets
       set locked = false,
           locked_at = null,
           locked_by = null
     where id = budget_row.id
    returning * into budget_row;
  end if;

  return budget_row;
end;
$$;
