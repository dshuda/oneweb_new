'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { useAdminAuth } from '@/lib/auth/AdminAuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

// Define route patterns and their protection requirements


export function AdminProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
        router.push(`/admin/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
    // If authenticated and trying to access login page
    if (isAuthenticated && isLoginPage) {
      router.push('/admin');
    }



  }, [ 
    isAuthenticated,
    isLoading,
    pathname,
    router,
    isLoginPage]);

  // Show loading spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
 // Prevent flash before redirect
  if (!isAuthenticated && !isLoginPage) {
    return null;
  }

  // Prevent showing login page when authenticated
  if (isAuthenticated && isLoginPage) {
    return null;
  }

  // Authenticated users can access admin pages
  return <>{children}</>;
}