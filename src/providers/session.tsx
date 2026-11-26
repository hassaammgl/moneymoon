/**
 * SessionProvider — who is signed in and which household they belong to.
 *
 * Supabase owns the session; this provider only mirrors it for React and resolves
 * the active household membership (a user can be active in one household). The
 * root layout uses it to gate login, onboarding and the app.
 *
 * `status` stays `loading` until both the session and the membership lookup are
 * settled, so the gate never flashes onboarding at a partner who already has a
 * household.
 */
import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { supabase } from '@/lib/supabase';

export type SessionStatus = 'loading' | 'signedOut' | 'signedIn';

export interface SessionHousehold {
  id: string;
  name: string;
}

export interface SessionContextValue {
  status: SessionStatus;
  session: Session | null;
  /** `null` while signed in without a household, or while signed out. */
  household: SessionHousehold | null;
  /** Re-reads the membership after create/join. Throws on a lookup failure. */
  refreshHousehold: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

interface MembershipRow {
  household_id: string;
  households:
    | { id: string; name: string }
    | { id: string; name: string }[]
    | null;
}

async function fetchHousehold(userId: string): Promise<SessionHousehold | null> {
  const { data, error } = await supabase
    .from('household_members')
    .select('household_id, households(id, name)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as MembershipRow;
  const joined = Array.isArray(row.households) ? row.households[0] : row.households;

  if (!joined) return { id: row.household_id, name: 'Our household' };
  return { id: joined.id, name: joined.name };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [household, setHousehold] = useState<SessionHousehold | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        if (!data.session) setStatus('signedOut');
      })
      .catch(() => {
        if (active) setStatus('signedOut');
      });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setHousehold(null);
        setStatus('signedOut');
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) return;

    let active = true;

    fetchHousehold(userId)
      .then((next) => {
        if (!active) return;
        setHousehold(next);
        setStatus('signedIn');
      })
      .catch(() => {
        if (!active) return;
        // Still signed in; onboarding will surface the real error if creation or
        // joining fails. A transient read failure must not sign the user out.
        setHousehold(null);
        setStatus('signedIn');
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const refreshHousehold = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const currentUserId = data.session?.user.id;

    if (!currentUserId) {
      setHousehold(null);
      setStatus('signedOut');
      return;
    }

    const next = await fetchHousehold(currentUserId);
    setHousehold(next);
    setStatus('signedIn');
  }, []);

  const signOut = useCallback(async () => {
    setHousehold(null);
    setStatus('signedOut');
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({ status, session, household, refreshHousehold, signOut }),
    [status, session, household, refreshHousehold, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);

  if (!value) {
    throw new Error('useSession must be used inside <SessionProvider>');
  }

  return value;
}
