import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

// ─── Public types ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  profileCompleted: boolean;
  /** Returns true if the user needs to confirm their email before proceeding. */
  signUp: (email: string, password: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshProfileStatus: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert a Supabase auth user to our slim User shape. */
function toUser(su: SupabaseUser): User {
  return { id: su.id, email: su.email ?? '' };
}

/** Fetch `profile_completed` from the public `users` table. */
async function fetchProfileCompleted(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('profile_completed')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch profile_completed:', error.message);
    return false;
  }

  return data?.profile_completed ?? false;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // true until first session check

  // ── Bootstrap: read the current session once, then subscribe ──
  useEffect(() => {
    // 1. Get the session that may already exist (e.g. page refresh).
    // Wait for the full profile check before clearing isLoading, otherwise
    // route guards briefly see profileCompleted=false and misroute.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await handleSession(session);
      setIsLoading(false);
    });

    // 2. React to future auth changes (sign-in, sign-out, token refresh).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /** Shared logic for processing a session (or lack of one). */
  async function handleSession(session: Session | null) {
    if (session?.user) {
      setUser(toUser(session.user));
      const completed = await fetchProfileCompleted(session.user.id);
      setProfileCompleted(completed);
    } else {
      setUser(null);
      setProfileCompleted(false);
    }
  }

  // ── Auth actions ──

  // Same as signIn: must not touch isLoading, or the page unmounts mid-request.
  const signUp = useCallback(async (email: string, password: string): Promise<boolean> => {
    {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      // Supabase deliberately doesn't error when the email is already taken —
      // that would let anyone probe for registered addresses. It signals it by
      // returning a user with no identities instead. Without this check the UI
      // would cheerfully say "account created" for an existing account.
      if (data.user && (data.user.identities?.length ?? 0) === 0) {
        throw new Error('An account with this email already exists — try signing in instead.');
      }

      // If Supabase requires email confirmation, data.session will be null.
      // The database trigger `on_auth_user_created` handles creating the
      // public.users row automatically — no client-side INSERT needed.

      if (data.session && data.user) {
        // Email confirmation is OFF — user is immediately authenticated
        setUser(toUser(data.user));
        setProfileCompleted(false);
        return false; // no confirmation needed
      }

      // Email confirmation is ON — user must verify email first
      return true;
    }
  }, []);

  // Note: this deliberately does NOT touch isLoading. Route guards hide their
  // children while isLoading is true, so flipping it here unmounted the sign-in
  // page mid-request — taking the form contents and the error message with it,
  // which looked like the page silently reloading. Callers track their own
  // in-flight state instead.
  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    if (data.user) {
      const completed = await fetchProfileCompleted(data.user.id);
      setUser(toUser(data.user));
      setProfileCompleted(completed);
      return completed;
    }

    return false;
  }, []);

  const refreshProfileStatus = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser) {
      const completed = await fetchProfileCompleted(authUser.id);
      setProfileCompleted(completed);
    }
  }, []);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        profileCompleted,
        signUp,
        signIn,
        signOut,
        refreshProfileStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
