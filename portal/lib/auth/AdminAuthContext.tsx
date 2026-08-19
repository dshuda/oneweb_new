'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { User } from '@/types';
import {  getAdminToken, getAdminId, clearAdminTokens } from '@/lib/adminAuth';
interface AdminAuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  userId: number | null;
  logout: () => void;
  isAuthenticated: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const _API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, _setUser] = useState<User | null>(null);
  const [userId, setuserId] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    const storedToken = getAdminToken();
    const cust_id = getAdminId();

    if (storedToken && cust_id) {
      setToken(storedToken);
      setuserId(cust_id ?? 0);
    }
    setIsLoading(false);
  }, []);

  
const logout=()=> {
  clearAdminTokens();
}


  const isAuthenticated = useMemo(() => {
    return !!token;
  }, [token]);

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        userId,
        // login,
        // register,
        logout,
        isAuthenticated: isAuthenticated,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}