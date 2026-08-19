'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AuthProvider } from '@/lib/auth/AuthContext';

const ROUTE_CONFIG = {
  adminPatterns: [/^\/admin(\/.*)?$/,      // /admin
  ],
};

export function Providers({ children }: { children: React.ReactNode }) {
    return (
      <AuthProvider>
        <ProtectedRoute>
          {children}
        </ProtectedRoute>
      </AuthProvider>
    );
  }

