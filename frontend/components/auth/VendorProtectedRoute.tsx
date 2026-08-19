'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';

export default function VendorProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, userType } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/vendor');
    }
    else if (userType && userType !== 'vendor') {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router,   userType]);



  return <>{children}</>;
}
