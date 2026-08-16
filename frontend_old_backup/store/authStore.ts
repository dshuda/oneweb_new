import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  userType: string | null;
  userId: number | null;
  accessToken: string | null;
  refreshToken: string | null;
  
  login: (accessToken: string, refreshToken: string, userId: number, userType: string) => void;
  logout: () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      userType: null,
      userId: null,
      accessToken: null,
      refreshToken: null,
      
      login: (accessToken, refreshToken, userId, userType) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', accessToken);
          localStorage.setItem('refresh_token', refreshToken);
          localStorage.setItem('user_id', userId.toString());
          localStorage.setItem('user_type', userType);
        }
        set({
          isAuthenticated: true,
          accessToken,
          refreshToken,
          userId,
          userType,
        });
      },
      
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_id');
          localStorage.removeItem('user_type');
        }
        set({
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          userId: null,
          userType: null,
        });
      },
      
      setTokens: (accessToken, refreshToken) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', accessToken);
          localStorage.setItem('refresh_token', refreshToken);
        }
        set({ accessToken, refreshToken });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        userType: state.userType,
        userId: state.userId,
      }),
    }
  )
);
