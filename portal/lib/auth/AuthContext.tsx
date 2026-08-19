'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  userId: number | null;
  saveToken: (tok: tokenProps) => void;
  clearToken: () => void;
  logout: () => void;
  saveName: ()=> void;
  isAuthenticated: boolean;
  isNameRequired: boolean,
  userType:  string | 'vendor' | 'customer' | undefined | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const _API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, _setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [nameRequired, setnameRequired] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [type, setType] = useState<string | 'vendor' | 'customer' | undefined | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const cus_token = "cust_token";
  const cus_id = "cust_id"
  const cus_name_required = "cust_name_required";
  const expire_at = "cus_expire_at"
  const cust_type = "cust_type"
  useEffect(() => {
    const storedToken = localStorage.getItem(cus_token);
    const cust_id = localStorage.getItem(cus_id);
    const time = localStorage.getItem(expire_at);
    const uType = localStorage.getItem(cust_type);
    const nameRequre = localStorage.getItem(cus_name_required);
    if (storedToken && cust_id) {
      setToken(storedToken);
      setUserId(parseInt(cust_id));
      
      setnameRequired( nameRequre && parseInt(nameRequre) == 1 ? true : false)
      const currentTime = new Date().getTime();
      if (!time || Number(time) < currentTime) {
        setToken(null);
        setUserId(null);
      }
    }
    setIsLoading(false);
    if(uType){
      setType(uType)
    }
  }, [token, userId, nameRequired]);

  const logout = () => {
    localStorage.removeItem(cus_token);
    localStorage.removeItem(cus_id);
    localStorage.removeItem(cust_type);
    localStorage.removeItem(cus_name_required)
    setToken(null);
    setUserId(null);
  };
  const saveToken = (tok: tokenProps) => {

    if (typeof window !== 'undefined') {
      var timeSpan = new Date().getTime();
      timeSpan += 60 * 15 * 1000;

      localStorage.setItem(cus_token, tok.accessToken);
      localStorage.setItem(expire_at, timeSpan.toString());
      localStorage.setItem('cust_refresh', tok.refreshToken);
      localStorage.setItem(cus_id, tok.userId.toString());
      localStorage.setItem(cust_type, tok.userType);
      localStorage.setItem(cus_name_required, tok.nameRequired.toString());
    }
    setToken(tok.accessToken);
    setType(tok.userType)
    setUserId(tok.userId);
  };



  const clearToken = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(cus_token);
      localStorage.removeItem('cust_refresh');
      localStorage.removeItem(cus_id);
      localStorage.removeItem(cust_type);
      localStorage.removeItem(cus_name_required);

  
    }
    setToken(null);
    setType(null)
    setUserId(null);
  };


  const saveName=()=>{
    localStorage.removeItem(cus_name_required)
    setnameRequired (false);
  }


  const isAuthenticated = useMemo(() => {
    return !!token;
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        userId,
        saveToken,
        clearToken,
        logout,
        saveName,
        isAuthenticated: isAuthenticated,
        isNameRequired: nameRequired,
        userType : type
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}





export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface tokenProps {
  accessToken: string,
  refreshToken: string,
  userId: number,
  userType: string,
  nameRequired: number
}