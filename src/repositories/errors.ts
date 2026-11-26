/**
 * Read-path errors.
 *
 * The store must never show a blank screen with no explanation, and must never
 * pretend a failed read is an empty household. These helpers classify whatever
 * Supabase throws into one short sentence the UI can show, plus the two
 * conditions the app reacts to (expired session, no household).
 */

/** The signed-in user has no active household (RLS returns no row). */
export class NoHouseholdError extends Error {
  constructor() {
    super('No household found for this account.');
    this.name = 'NoHouseholdError';
  }
}

interface PostgrestLike {
  message?: unknown;
  code?: unknown;
  details?: unknown;
}

function rawMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as PostgrestLike).message ?? '');
  }
  return '';
}

function rawCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as PostgrestLike).code;
    return typeof code === 'string' || typeof code === 'number' ? String(code) : '';
  }
  return '';
}

/** True when the request failed because the JWT is missing or stale. */
export function isAuthError(error: unknown): boolean {
  const message = rawMessage(error);
  return /jwt|token is expired|invalid claim|not authenticated/i.test(message);
}

/** True when RLS refused the read rather than the network failing. */
export function isPermissionError(error: unknown): boolean {
  const message = rawMessage(error);
  return rawCode(error) === '42501' || /permission denied|row-level security/i.test(message);
}

/**
 * One short sentence for a failed read. Network, session and policy failures
 * each get their own wording; anything else falls back to the backend message
 * so an unexpected error is never swallowed.
 */
export function describeDataError(error: unknown): string {
  if (error instanceof NoHouseholdError) return error.message;

  const message = rawMessage(error);

  if (/network request failed|failed to fetch|timeout|timed out|econn/i.test(message)) {
    return 'No internet connection. Check your network and try again.';
  }

  if (isAuthError(error)) {
    return 'Your session expired. Sign in again.';
  }

  if (isPermissionError(error)) {
    return 'This account cannot read the household data.';
  }

  return message.trim() || 'Could not load your budget. Try again.';
}
