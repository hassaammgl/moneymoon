-- Moneymoon — initial schema.
--
-- Ten tables: profiles, households, household_members, household_invites,
-- monthly_incomes, budgets, budget_envelopes, expenses, dream_goals,
-- dream_contributions.
--
-- Conventions:
--   * uuid primary keys (gen_random_uuid)
--   * bigint money in whole PKR
--   * timestamptz in UTC
--   * mutable rows carry `version` (optimistic concurrency) + `updated_at`
--   * `month_start` is always the first day of the month
--   * rows that both partners may edit are soft-deleted (`deleted_at`)

-- 1. profiles ---------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. households -------------------------------------------------------------
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  join_code text not null unique,
  status text not null default 'forming'
    check (status in ('forming', 'active', 'archived')),
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index households_status_idx on public.households (status);

-- 3. household_members ------------------------------------------------------
-- Exactly two *active* members per household: enforced by a trigger that takes
-- an advisory lock, plus this partial unique index as a second safety net. A
-- user can be active in one household only.
create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'partner' check (role in ('partner')),
  status text not null default 'active'
    check (status in ('invited', 'active', 'left')),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create index household_members_household_status_idx
  on public.household_members (household_id, status);

create unique index household_members_one_active_per_user_idx
  on public.household_members (user_id)
  where status = 'active';

-- 4. household_invites ------------------------------------------------------
-- One open (unaccepted, unrevoked) invite per household at a time.
create table public.household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  code text not null unique,
  created_by uuid not null references public.profiles (id) on delete restrict,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_by uuid references public.profiles (id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index household_invites_one_open_idx
  on public.household_invites (household_id)
  where accepted_at is null and revoked_at is null;

-- 5. monthly_incomes --------------------------------------------------------
-- One row per partner per month. Combined income is never stored.
create table public.monthly_incomes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  member_id uuid not null references public.household_members (id) on delete cascade,
  month_start date not null,
  amount_pkr bigint not null check (amount_pkr >= 0),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint monthly_incomes_month_start_check
    check (month_start = date_trunc('month', month_start)::date),
  unique (member_id, month_start)
);

create index monthly_incomes_household_month_idx
  on public.monthly_incomes (household_id, month_start);

-- 6. budgets ----------------------------------------------------------------
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  month_start date not null,
  locked boolean not null default false,
  locked_at timestamptz,
  locked_by uuid references public.household_members (id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budgets_month_start_check
    check (month_start = date_trunc('month', month_start)::date),
  unique (household_id, month_start)
);

create index budgets_household_month_idx on public.budgets (household_id, month_start);

-- 7. budget_envelopes -------------------------------------------------------
-- Seven rows per budget, one per app envelope id.
create table public.budget_envelopes (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets (id) on delete cascade,
  household_id uuid not null references public.households (id) on delete cascade,
  envelope_id text not null
    check (envelope_id in (
      'room-rent', 'utilities', 'internet', 'groceries',
      'commute', 'her-kharcha', 'medicine'
    )),
  limit_pkr bigint not null check (limit_pkr >= 0),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (budget_id, envelope_id)
);

create index budget_envelopes_household_budget_idx
  on public.budget_envelopes (household_id, budget_id);

-- 8. expenses ---------------------------------------------------------------
-- The primary key is minted on the device, so an offline retry can never
-- duplicate a row. Deletes are soft so a peer can sync the tombstone.
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  budget_id uuid not null references public.budgets (id) on delete cascade,
  envelope_id text not null
    check (envelope_id in (
      'room-rent', 'utilities', 'internet', 'groceries',
      'commute', 'her-kharcha', 'medicine'
    )),
  paid_by_member_id uuid not null
    references public.household_members (id) on delete restrict,
  created_by_member_id uuid not null
    references public.household_members (id) on delete restrict,
  amount_pkr bigint not null check (amount_pkr > 0),
  note text not null default '' check (char_length(note) <= 200),
  spent_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index expenses_household_spent_idx
  on public.expenses (household_id, spent_at desc)
  where deleted_at is null;

create index expenses_budget_envelope_idx
  on public.expenses (budget_id, envelope_id);

-- Sync cursor: "everything changed since T".
create index expenses_household_updated_idx
  on public.expenses (household_id, updated_at);

-- 9. dream_goals ------------------------------------------------------------
create table public.dream_goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  target_pkr bigint not null check (target_pkr > 0),
  target_date date,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index dream_goals_household_idx on public.dream_goals (household_id);

-- 10. dream_contributions ---------------------------------------------------
create table public.dream_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.dream_goals (id) on delete cascade,
  household_id uuid not null references public.households (id) on delete cascade,
  member_id uuid not null references public.household_members (id) on delete restrict,
  amount_pkr bigint not null check (amount_pkr > 0),
  note text check (note is null or char_length(note) <= 200),
  contributed_at timestamptz not null default now(),
  deleted_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index dream_contributions_goal_time_idx
  on public.dream_contributions (goal_id, contributed_at desc);

create index dream_contributions_household_updated_idx
  on public.dream_contributions (household_id, updated_at);
