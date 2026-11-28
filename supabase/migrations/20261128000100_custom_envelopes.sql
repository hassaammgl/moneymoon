-- Moneymoon — custom envelopes.
--
-- The seven built-in envelopes stay app constants and need no rows. A household
-- can add its own categories; the custom row's uuid is stored as text in
-- `budget_envelopes.envelope_id` and `expenses.envelope_id`, so every money row
-- keeps its shape and no data has to be migrated.
--
-- The fixed-id checks are therefore replaced by a trigger that accepts a
-- built-in id or a custom envelope belonging to the same household.

create table public.household_envelopes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  icon text not null default 'wallet'
    check (icon in (
      'wallet', 'piggy-bank', 'graduation-cap', 'gift',
      'plane', 'briefcase', 'paw-print', 'shopping-bag'
    )),
  tone text not null default 'lilac'
    check (tone in ('lilac', 'amber', 'mint', 'rose')),
  created_by uuid references public.household_members (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One envelope per name in a household, case-insensitively.
create unique index household_envelopes_name_key
  on public.household_envelopes (household_id, lower(name));

alter table public.household_envelopes enable row level security;

create policy household_envelopes_select_member
  on public.household_envelopes for select to authenticated
  using (public.is_household_member(household_id));

create policy household_envelopes_insert_member
  on public.household_envelopes for insert to authenticated
  with check (
    public.is_household_member(household_id)
    and created_by = public.my_member_id(household_id)
  );

revoke all on public.household_envelopes from anon;
grant select, insert on public.household_envelopes to authenticated;

-- Envelope ids are now open-ended; the trigger below validates them.
alter table public.budget_envelopes
  drop constraint if exists budget_envelopes_envelope_id_check;

alter table public.expenses
  drop constraint if exists expenses_envelope_id_check;

create or replace function public.enforce_known_envelope()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.envelope_id in (
    'room-rent', 'utilities', 'internet', 'groceries',
    'commute', 'her-kharcha', 'medicine'
  ) then
    return new;
  end if;

  if exists (
    select 1
      from public.household_envelopes e
     where e.id::text = new.envelope_id
       and e.household_id = new.household_id
  ) then
    return new;
  end if;

  raise exception 'unknown_envelope';
end;
$$;

revoke execute on function public.enforce_known_envelope() from public, anon, authenticated;

create trigger budget_envelopes_known_envelope
  before insert or update of envelope_id on public.budget_envelopes
  for each row execute function public.enforce_known_envelope();

create trigger expenses_known_envelope
  before insert or update of envelope_id on public.expenses
  for each row execute function public.enforce_known_envelope();
