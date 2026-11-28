-- Moneymoon — create a household envelope and its first monthly limit.
--
-- The client mints the envelope uuid so a retry is idempotent. Doing both rows
-- in one security-definer function keeps them atomic: a failure never leaves a
-- category behind with no plan row, and a locked month refuses the whole call.
create or replace function public.create_household_envelope(
  p_id uuid,
  p_name text,
  p_icon text,
  p_tone text,
  p_month_start date,
  p_limit bigint default 0
)
returns public.household_envelopes
language plpgsql
security definer
set search_path = public
as $$
declare
  member_household uuid;
  acting_member uuid;
  envelope_row public.household_envelopes;
  budget_row public.budgets;
begin
  select household_id, id
    into member_household, acting_member
    from household_members
   where user_id = auth.uid() and status = 'active'
   limit 1;

  if member_household is null then
    raise exception 'no_household';
  end if;

  insert into household_envelopes (id, household_id, name, icon, tone, created_by)
  values (p_id, member_household, btrim(p_name), p_icon, p_tone, acting_member)
  returning * into envelope_row;

  if p_limit is not null and p_limit > 0 then
    if p_month_start is null
       or p_month_start <> date_trunc('month', p_month_start)::date then
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

    if budget_row.locked then
      raise exception 'plan_locked';
    end if;

    insert into budget_envelopes (budget_id, household_id, envelope_id, limit_pkr)
    values (budget_row.id, member_household, p_id::text, p_limit)
    on conflict (budget_id, envelope_id)
    do update set limit_pkr = excluded.limit_pkr;
  end if;

  return envelope_row;
end;
$$;

revoke execute on function public.create_household_envelope(
  uuid, text, text, text, date, bigint
) from public, anon;

grant execute on function public.create_household_envelope(
  uuid, text, text, text, date, bigint
) to authenticated;
