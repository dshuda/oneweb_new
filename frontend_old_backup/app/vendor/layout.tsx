'use client';

import Link from 'next/link';
import VendorProtectedRoute from '@/components/auth/VendorProtectedRoute';
import { AuthProvider } from '@/lib/auth/AuthContext';

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
          <VendorProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
            <Link href="/" className="text-lg font-bold">OneWeb - Vendor</Link>
            <nav className="flex gap-3">
              <Link href="/vendor/pending" className="px-3 py-2 rounded-md hover:bg-gray-100">Pending</Link>
              <Link href="/vendor/my-works" className="px-3 py-2 rounded-md hover:bg-gray-100">My Works</Link>
              <Link href="/vendor/profile" className="px-3 py-2 rounded-md hover:bg-gray-100">Profile</Link>
            </nav>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8">
          {/* wrap inner pages with protected route except login */}
            {children}
        </main>
      </div>
          </VendorProtectedRoute>
    </AuthProvider>
  );
}
