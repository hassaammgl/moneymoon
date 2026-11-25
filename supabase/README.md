# Supabase backend

SQL for the Moneymoon shared budget. The app is **not wired to it yet**: the
store still uses the in-memory mock adapter, and no Supabase client or keys have
been added.

## Migrations (apply in order)

1. `20261125000100_schema.sql` — ten tables, constraints, indexes.
2. `20261125000200_functions.sql` — helpers, RPCs, trigger functions.
3. `20261125000300_policies.sql` — triggers, RLS policies, grants.

## Apply

Either paste each file into the Supabase dashboard SQL editor in order, or link
the project and push:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

`supabase init` is only needed if the CLI has not been initialised in this repo.

## What is enforced in the database

- Exactly **two active members** per household: advisory-locked trigger plus a
  partial unique index; membership changes only through RPCs.
- `create_household`, `create_household_invite`, `accept_invite`,
  `leave_household`, `get_or_create_budget`, `lock_budget`, `unlock_budget`.
- Income is one row per partner per month (`monthly_incomes`); combined income
  is never stored.
- Locked plans reject envelope and income writes by policy **and** trigger.
- Expenses are soft-deleted, UUID-keyed (client idempotency), and only visible to
  the household.
- RLS enabled on every table; `anon` has no table or function access.

## Still to do

- Create the Supabase project, set Auth (email OTP) and copy the URL + anon key
  into the app environment.
- Add `@supabase/supabase-js` and a Supabase repository adapter behind the
  existing interfaces (`src/repositories/types.ts`).
- Realtime channels, offline outbox, storage and edge-function rate limits.
