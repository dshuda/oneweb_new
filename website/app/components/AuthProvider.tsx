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
  type AuthUser,
} from '@/app/lib/auth';
import { loadTokens, logout as apiLogout } from '@/app/lib/api';

export type AuthMode = 'account' | 'checkout' | 'schedule';

interface AuthContextValue {
  user: AuthUser | null;
  authLoaded: boolean;
  authOpen: boolean;
  openAuth: (mode?: AuthMode) => void;
  closeAuth: () => void;
  login: (user: AuthUser) => void;
  setUserName: (name: string) => void;
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
  // mismatches), mirroring the cart provider pattern. A stored profile with no
  // matching API tokens is a leftover from an older build — drop it so the user
  // logs in again and gets a real session.
  useEffect(() => {
    const stored = loadAuthUser();
    if (stored && !loadTokens()) {
      clearAuthUser();
      setUser(null);
    } else {
      setUser(stored);
    }
    setAuthLoaded(true);
  }, []);

  const openAuth = useCallback((mode: AuthMode = 'account') => {
    setAuthMode(mode);
    setAuthOpen(true);
  }, []);
  const closeAuth = useCallback(() => setAuthOpen(false), []);

  // Called by the drawer once the API has verified the OTP and stored tokens.
  const login = useCallback((nextUser: AuthUser) => {
    saveAuthUser(nextUser);
    setUser(nextUser);
  }, []);

  const setUserName = useCallback((name: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, name };
      saveAuthUser(next);
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    clearAuthUser();
    setUser(null);
    // Revokes the refresh tokens server-side and clears them locally either
    // way; failure here is not user-visible.
    void apiLogout();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      authLoaded,
      authOpen,
      openAuth,
      closeAuth,
      login,
      setUserName,
      logout,
    }),
    [user, authLoaded, authOpen, openAuth, closeAuth, login, setUserName, logout],
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
