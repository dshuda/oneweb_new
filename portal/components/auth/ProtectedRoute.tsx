import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, ReactNode, useMemo, Suspense } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

// Define route patterns and their protection requirements
const ROUTE_CONFIG = {
  //public: ['/', '/about', '/contact', '/services'],
  auth: ['/auth/login', '/auth/register'],
 // protected: ['/dashboard', '/profile', '/bookings', '/orders', '/checkout'],
  // Support dynamic routes with patterns
  protectedPatterns: [
    /^\/dashboard\/.*/,      // /dashboard/anything
    /^\/profile\/.*/,        // /profile/anything
    /^\/bookings\/.*/,       // /bookings/anything
    /^\/orders(\/.*)?$/,         // /orders/anything
    /^\/checkout\/.*/,       // /checkout/anything
  ],
};


export function ProtectedRoute(props: ProtectedRouteProps) {
  return (
    <Suspense fallback={null}>
      <ProtectedRouteInner {...props} />
    </Suspense>
  );
}


export function ProtectedRouteInner({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();


const searchParams = useSearchParams();
  // Determine if current route requires protection
  const redirect = searchParams.get('redirect') || '/';


  const fullPath =
  pathname +
  (searchParams.toString()
    ? `?${searchParams.toString()}`
    : '');
  const routeType = useMemo(() => {
    // Check exact matches

    if (ROUTE_CONFIG.auth.includes(pathname)) return 'auth';
   // if (ROUTE_CONFIG.protected.includes(pathname)) return 'protected';
    
    // Check patterns for protected routes
    if (ROUTE_CONFIG.protectedPatterns.some(pattern => pattern.test(pathname))) {
      return 'protected';
    }
    else{
      return 'public';
    }
  }, [pathname]);

  useEffect(() => {
    if (!isLoading) {
      // Redirect authenticated users away from auth pages
      if (isAuthenticated && routeType === 'auth') {
        router.replace(redirect);
        return;
      }

      // Redirect unauthenticated users away from protected pages
      if (!isAuthenticated && routeType === 'protected') {
        router.push(`/auth/login?redirect=${encodeURIComponent(fullPath)}`);
        return;
      }
    }
  }, [isAuthenticated, isLoading, router, pathname, routeType]);

  // Show loading spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Render public routes for everyone
  if (routeType === 'public') {
    return <>{children}</>;
  }

  // Render auth routes only for non-authenticated users
  if (routeType === 'auth' && !isAuthenticated) {
    return <>{children}</>;
  }

  // Render protected routes only for authenticated users
  if (routeType === 'protected' && isAuthenticated) {
    return <>{children}</>;
  }

  // Return null while redirecting
  return null;
}