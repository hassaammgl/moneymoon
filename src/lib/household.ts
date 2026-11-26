/**
 * Household RPCs — create, invite, join.
 *
 * Thin wrappers over the security-definer functions in
 * `supabase/migrations/*_functions.sql`. Screens never build SQL: they call
 * these and get either data or a message they can show.
 *
 * The database raises stable machine codes (`household_full`, `invite_invalid`,
 * …). This module maps them to one short sentence so no screen has to know the
 * backend's vocabulary.
 */
import { supabase } from './supabase';

export interface HouseholdRow {
  id: string;
  name: string;
  join_code: string;
}

export interface InviteRow {
  code: string;
  expires_at: string;
}

const MESSAGES: Record<string, string> = {
  already_in_household: 'You already belong to a household.',
  household_full: 'This household already has two partners.',
  household_archived: 'That household is no longer active.',
  invite_invalid: 'That code is wrong or has expired.',
  invalid_household_name: 'Give your household a name of up to 60 characters.',
  no_household: 'Join a household first.',
  not_authenticated: 'Your session expired. Sign in again.',
  not_a_member: 'You are not part of this household.',
  plan_locked: 'This month is locked.',
};

export function householdErrorMessage(error: unknown): string {
  const raw =
    typeof error === 'string'
      ? error
      : error && typeof error === 'object' && 'message' in error
        ? String((error as { message: unknown }).message)
        : '';

  for (const [code, message] of Object.entries(MESSAGES)) {
    if (raw.includes(code)) return message;
  }

  return raw.trim() || 'Something went wrong. Try again.';
}

export async function createHousehold(name: string): Promise<HouseholdRow> {
  const { data, error } = await supabase.rpc('create_household', {
    household_name: name.trim(),
  });

  if (error) throw error;
  return data as HouseholdRow;
}

export async function createPartnerInvite(): Promise<InviteRow> {
  const { data, error } = await supabase.rpc('create_household_invite');

  if (error) throw error;
  return data as InviteRow;
}

export async function joinHousehold(code: string): Promise<HouseholdRow> {
  const { data, error } = await supabase.rpc('accept_invite', {
    invite_code: code.trim().toUpperCase(),
  });

  if (error) throw error;
  return data as HouseholdRow;
}
