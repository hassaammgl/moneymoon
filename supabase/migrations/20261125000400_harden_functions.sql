-- Moneymoon — least-privilege pass over database functions.
--
-- 1. The two timestamp triggers pin `search_path` (Supabase advisor 0011).
-- 2. Internal helpers — trigger bodies and code generators — are not RPC
--    endpoints, so clients lose EXECUTE. The owner keeps it: triggers call them
--    as the system, and the SECURITY DEFINER RPCs call them as `postgres`.
--
-- Helpers referenced from RLS policies (`is_household_member`, `my_member_id`,
-- `shares_household_with`, `is_budget_locked`, `is_month_locked`) must stay
-- executable: policy expressions run as the calling role.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.touch_versioned()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  new.version = coalesce(old.version, 0) + 1;
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.touch_versioned() from public, anon, authenticated;
revoke execute on function public.enforce_two_members() from public, anon, authenticated;
revoke execute on function public.enforce_unlocked_envelope() from public, anon, authenticated;
revoke execute on function public.enforce_unlocked_income() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.generate_join_code() from public, anon, authenticated;
revoke execute on function public.generate_invite_code() from public, anon, authenticated;
