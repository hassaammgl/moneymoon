# Supabase backend

SQL for the Moneymoon shared budget. Auth, households and invites are live; the
budget store (plans, incomes, expenses) still runs on the in-memory mock adapter,
so the app has no real budget reads or writes yet.

## Migrations (apply in order)

1. `20261125000100_schema.sql` — ten tables, constraints, indexes.
2. `20261125000200_functions.sql` — helpers, RPCs, trigger functions.
3. `20261125000300_policies.sql` — triggers, RLS policies, grants.
4. `20261125000400_harden_functions.sql` — pinned `search_path`; internal
   functions are no longer RPC endpoints.
5. `20261125000500_indexes_and_initplan.sql` — covering indexes; policies call
   `auth.uid()` once per query.

Applied to project `qavulpyzsldgkzmxlqps` on 2026-11-26 with the Supabase MCP
server. Migration history versions match the file prefixes, so a later CLI
`db push` does not replay them.

## Apply to a fresh project

```bash
bunx supabase login
bunx supabase link --project-ref <project-ref>
bunx supabase db push
```

Or paste the files into the dashboard SQL editor in order.

## Auth

The app signs in with an emailed one-time code (`signInWithOtp` + `verifyOtp`),
whose length comes from **Authentication → Providers → Email → Email OTP
length** (6–10 digits; the app accepts any).
not a magic link. In the dashboard:

1. **Authentication → Providers → Email** must be enabled (it is by default).
2. **Authentication → Emails → Magic Link** must contain `{{ .Token }}` so the
   code is visible in the email. Without it the email only carries a link, which
   a native app cannot open.
3. The built-in SMTP server is heavily rate limited. For two people testing on
   two phones, connect custom SMTP or use a test address per partner.

Environment variables (in `.env.local`, git-ignored; see `.env.example`):

```bash
EXPO_PUBLIC_SUPABASE_URL=https://qavulpyzsldgkzmxlqps.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

EAS builds do not read `.env.local`; set both variables in the EAS environment
used by the build profile (`eas env:create`) before building.

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
- Only the five policy helpers and the seven RPCs remain executable by signed-in
  users. Trigger bodies and code generators are owner-only.

## Still to do

- Add a Supabase repository adapter behind the existing interfaces
  (`src/repositories/types.ts`) — reads, realtime channels, offline outbox.
- Storage for avatars and edge-function rate limits for invite codes.

## App wiring (this step)

- `src/lib/supabase.ts` — client; session in `expo-sqlite` localStorage.
- `src/providers/session.tsx` — signed-in user + active household.
- `src/app/_layout.tsx` — gate: login → onboarding → budget.
- `src/screens/login.tsx` — email code sign-in.
- `src/screens/onboarding.tsx` — create a household or join with a code.
- `src/screens/household.tsx` — partner invite code and sign out, reachable from
  the people button in Our Plan.
- `src/lib/household.ts` — RPC wrappers with friendly error messages.

The budget itself still runs on the in-memory mock adapter.
