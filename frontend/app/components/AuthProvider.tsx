'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AuthDrawer from './AuthDrawer';
import {
  clearAuthUser,
  loadAuthUser,
  saveAuthUser,
  DEMO_PHONE,
  type AuthUser,
} from '@/app/lib/auth';
import { loadUserProfile } from '@/app/lib/storage';

export type AuthMode = 'account' | 'checkout' | 'schedule';

interface AuthContextValue {
  user: AuthUser | null;
  authLoaded: boolean;
  authOpen: boolean;
  openAuth: (mode?: AuthMode) => void;
  closeAuth: () => void;
  login: (phone: string, name?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('account');
  const [authLoaded, setAuthLoaded] = useState(false);

  // Restore the persisted session after mount (deferred to avoid SSR
  // mismatches), mirroring the cart provider pattern.
  useEffect(() => {
    setUser(loadAuthUser());
    setAuthLoaded(true);
  }, []);

  const openAuth = useCallback((mode: AuthMode = 'account') => {
    setAuthMode(mode);
    setAuthOpen(true);
  }, []);
  const closeAuth = useCallback(() => setAuthOpen(false), []);

  const login = useCallback((phone: string, name?: string) => {
    const stored = loadUserProfile();
    const nextUser: AuthUser = {
      phone,
      name: name || stored.name || (phone === DEMO_PHONE ? 'Demo User' : undefined),
    };
    saveAuthUser(nextUser);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    clearAuthUser();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, authLoaded, authOpen, openAuth, closeAuth, login, logout }),
    [user, authLoaded, authOpen, openAuth, closeAuth, login, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* Shared right-side login drawer */}
      <AuthDrawer
        open={authOpen}
        onOpenChange={setAuthOpen}
        onLogin={login}
        mode={authMode}
      />
    </AuthContext.Provider>
  );
}
