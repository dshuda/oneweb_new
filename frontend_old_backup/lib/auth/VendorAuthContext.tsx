'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { getVendorToken, getVendorId, clearVendorTokens, setVendorTokens } from '@/lib/vendorAuth';

interface VendorAuthContextType {
  token: string | null;
  isLoading: boolean;
  userId: number | null;
  saveToken: (accessToken: string,
    refreshToken: string,
    userId: number,
    userType: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const VendorAuthContext = createContext<VendorAuthContextType | undefined>(undefined);

export function VendorAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = getVendorToken();
    const vid = getVendorId();
    if (storedToken && vid) {
      setToken(storedToken);
      setUserId(vid ?? 0);
    }
    setIsLoading(false);
  }, []);

  const logout = () => {
    clearVendorTokens();
    setToken(null);
    setUserId(null);
  };

  const saveToken = (accessToken: string,
    refreshToken: string,
    userId: number,
    userType: string) => {
    setVendorTokens(accessToken, refreshToken, userId, userType);
    setToken(accessToken);
    setUserId(userId)
  }

  const isAuthenticated = useMemo(() => !!token, [token]);

  return (
    <VendorAuthContext.Provider value={{ token, isLoading, userId, saveToken, logout, isAuthenticated }}>
      {children}
    </VendorAuthContext.Provider>
  );
}

export function useVendorAuth() {
  const context = useContext(VendorAuthContext);
  if (context === undefined) {
    throw new Error('useVendorAuth must be used within a VendorAuthProvider');
  }
  return context;
}
