'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { LogoutOverlay } from '@/components/ui/logout-overlay';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface Profile {
  id: string;
  full_name: string;
  role: 'ADMIN' | 'DESIGNER';
  avatar_url?: string;
}

type AuthStatus = 'INITIALIZING' | 'AUTHENTICATED' | 'UNAUTHENTICATED';

interface AuthState {
  status: AuthStatus;
  user: User | null;
  profile: Profile | null;
  loggingOut: boolean;
}

interface AuthContextType extends AuthState {
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

// ============================================================================
// Context Definition
// ============================================================================

const AuthContext = createContext<AuthContextType>({
  status: 'INITIALIZING',
  user: null,
  profile: null,
  loggingOut: false,
  logout: async () => {},
  refreshSession: async () => {},
});

// ============================================================================
// Provider Component
// ============================================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // Single source of truth for Auth State
  const [state, setState] = useState<AuthState>({
    status: 'INITIALIZING',
    user: null,
    profile: null,
    loggingOut: false,
  });

  // --------------------------------------------------------------------------
  // Core Logic: Atomic Initialization
  // --------------------------------------------------------------------------

  const initializeAuth = useCallback(async (isMount = false) => {
    try {
      if (!isMount) {
        logger.log('[Auth] Refreshing session...');
      }

      // 1. Get User
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        logger.log('[Auth] No active session found.');
        setState(prev => ({ ...prev, status: 'UNAUTHENTICATED', user: null, profile: null }));
        return;
      }

      // 2. Get Profile (Required for AUTHENTICATED state)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        logger.error('[Auth] Profile fetch failed:', profileError);
        // Decision: If profile fails, is it a retry-able network error?
        // For simplicity and robustness: Treat as invalid session for now.
        // Ideally, we could add an ERROR state here with a "Retry" button.
        throw new Error('Profile fetch failed');
      }

      if (!profile) {
        logger.warn('[Auth] User exists but has NO profile. Critical data error.');
        // User without profile -> Invalid state -> Force Logout
        await supabase.auth.signOut();
        setState(prev => ({ ...prev, status: 'UNAUTHENTICATED', user: null, profile: null }));
        return;
      }

      // 3. Success -> Fully Authenticated
      // Only update state if user/profile actually changed (prevents unnecessary re-renders)
      setState(prev => {
        const isSameUser = prev.user?.id === user.id;
        const isSameProfile =
          prev.profile?.id === profile.id &&
          prev.profile?.full_name === profile.full_name &&
          prev.profile?.role === profile.role &&
          prev.profile?.avatar_url === profile.avatar_url;

        // If nothing changed, return previous state to avoid re-render
        if (prev.status === 'AUTHENTICATED' && isSameUser && isSameProfile) {
          logger.log('[Auth] Session verified, no changes detected.');
          return prev;
        }

        logger.log('[Auth] Session & Profile verified. Access granted.');
        return {
          ...prev,
          status: 'AUTHENTICATED',
          user,
          profile: profile as Profile,
        };
      });

    } catch (error) {
      logger.error('[Auth] Initialization error:', error);
      // Fail-safe: Default to unauthenticated to prevent zombie UI
      setState(prev => ({ ...prev, status: 'UNAUTHENTICATED', user: null, profile: null }));
    }
  }, [supabase]);

  // --------------------------------------------------------------------------
  // Lifecycle & Effects
  // --------------------------------------------------------------------------

  // Initial Mount
  useEffect(() => {
    initializeAuth(true);

    // Supabase Auth Listener (Handles other tabs, token refreshes, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      logger.log(`[Auth] Event: ${event}`);

      if (event === 'SIGNED_OUT') {
        setState(prev => ({ ...prev, status: 'UNAUTHENTICATED', user: null, profile: null }));
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        // Re-run full check to ensure profile is consistent
        initializeAuth();
      } else if (event === 'TOKEN_REFRESHED') {
        // Just update token, state remains authenticated usually
        // But safe to do nothing if we trust the session is valid
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initializeAuth, supabase.auth]);

  // "Hotel Sensor": Reset loggingOut flag when we actually land on login page
  useEffect(() => {
    if (pathname === '/login' && state.loggingOut) {
      setState(prev => ({ ...prev, loggingOut: false }));
    }
  }, [pathname, state.loggingOut]);

  // --------------------------------------------------------------------------
  // Actions
  // --------------------------------------------------------------------------

  const logout = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loggingOut: true }));
      // Optimistic UI clear
      await supabase.auth.signOut();

      // Limpiar SOLO claves auth de Supabase (preservamos theme, sidebar-collapsed, etc.).
      if (typeof window !== 'undefined') {
        const clearSupabaseKeys = (storage: Storage) => {
          const keysToRemove: string[] = [];
          for (let i = 0; i < storage.length; i++) {
            const key = storage.key(i);
            if (key && key.startsWith('sb-')) keysToRemove.push(key);
          }
          keysToRemove.forEach((k) => storage.removeItem(k));
        };
        clearSupabaseKeys(window.localStorage);
        clearSupabaseKeys(window.sessionStorage);
      }

      router.push('/login');
      // State update happens via onAuthStateChange --> SIGNED_OUT
    } catch (error) {
      logger.error('Logout error:', error);
      setState(prev => ({ ...prev, status: 'UNAUTHENTICATED', user: null, profile: null }));
      router.push('/login');
    }
  }, [router, supabase.auth]);

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  const value = useMemo(() => ({
    ...state,
    logout,
    refreshSession: () => initializeAuth(),
  }), [state, initializeAuth, logout]);

  return (
    <AuthContext.Provider value={value}>
      <LogoutOverlay isVisible={state.loggingOut} />
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
