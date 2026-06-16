'use client';

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { AuthContext, useAuth, type Profile } from '@/lib/auth/auth-context';
import { isDevAccount } from '@/lib/auth/dev-accounts';

const STORAGE_KEY = 'phsport:view-as';

interface ViewAsState {
  mode: 'real' | 'designer';
  designerId: string | null;
  designerName: string | null;
}

interface ViewAsContextValue {
  /** La cuenta real es dev (email en allowlist) y su rol real es ADMIN. */
  isDev: boolean;
  /** Hay una simulación de diseñador activa. */
  simulating: boolean;
  simulatedDesignerId: string | null;
  simulatedDesignerName: string | null;
  enterDesignerView: (designerId: string, designerName: string) => void;
  exitToManager: () => void;
  /** Identidad REAL (para el menú de cuenta y la píldora). */
  realName: string | null;
  realEmail: string | null;
  realRole: Profile['role'] | null;
}

const ViewAsContext = createContext<ViewAsContextValue>({
  isDev: false,
  simulating: false,
  simulatedDesignerId: null,
  simulatedDesignerName: null,
  enterDesignerView: () => {},
  exitToManager: () => {},
  realName: null,
  realEmail: null,
  realRole: null,
});

export function ViewAsProvider({ children }: { children: React.ReactNode }) {
  // useAuth() aquí resuelve al AuthProvider de la raíz => identidad REAL.
  const auth = useAuth();
  const realUser = auth.user;
  const realProfile = auth.profile;

  const isDev = isDevAccount(realUser?.email) && realProfile?.role === 'ADMIN';

  const [state, setState] = useState<ViewAsState>({
    mode: 'real',
    designerId: null,
    designerName: null,
  });

  // Cargar estado persistido (solo cliente, tras montar para evitar mismatch SSR).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ViewAsState;
      if (parsed && (parsed.mode === 'real' || parsed.mode === 'designer')) {
        setState(parsed);
      }
    } catch {
      // storage corrupto: ignorar
    }
  }, []);

  // Persistir cambios — solo para cuentas dev (no ensuciar el storage del resto).
  useEffect(() => {
    if (typeof window === 'undefined' || !isDev) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, isDev]);

  const enterDesignerView = useCallback((designerId: string, designerName: string) => {
    setState({ mode: 'designer', designerId, designerName });
  }, []);

  const exitToManager = useCallback(() => {
    setState({ mode: 'real', designerId: null, designerName: null });
  }, []);

  // Solo dev+admin puede simular; en cualquier otro caso, identidad real.
  const simulating = isDev && state.mode === 'designer' && !!state.designerId;

  // Identidad EFECTIVA inyectada en el AuthContext para todos los consumidores.
  const effectiveAuth = useMemo(() => {
    if (!simulating || !realUser) return auth;
    return {
      ...auth,
      user: { ...realUser, id: state.designerId! },
      profile: {
        id: state.designerId!,
        full_name: state.designerName ?? 'Diseñador',
        role: 'DESIGNER' as const,
        avatar_url: undefined,
      } satisfies Profile,
    };
  }, [auth, simulating, realUser, state.designerId, state.designerName]);

  const viewAsValue = useMemo<ViewAsContextValue>(
    () => ({
      isDev,
      simulating,
      simulatedDesignerId: simulating ? state.designerId : null,
      simulatedDesignerName: simulating ? state.designerName : null,
      enterDesignerView,
      exitToManager,
      realName: realProfile?.full_name ?? null,
      realEmail: realUser?.email ?? null,
      realRole: realProfile?.role ?? null,
    }),
    [
      isDev,
      simulating,
      state.designerId,
      state.designerName,
      enterDesignerView,
      exitToManager,
      realProfile?.full_name,
      realProfile?.role,
      realUser?.email,
    ]
  );

  return (
    <AuthContext.Provider value={effectiveAuth}>
      <ViewAsContext.Provider value={viewAsValue}>{children}</ViewAsContext.Provider>
    </AuthContext.Provider>
  );
}

export const useViewAs = () => useContext(ViewAsContext);
