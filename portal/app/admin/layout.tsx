'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ShoppingBag, Users, Settings, FileText, Tag, LogOut,
  FolderTree, Image as ImageIcon, CalendarClock, LifeBuoy, BellRing, Menu, X
} from 'lucide-react';
import { clearAdminTokens } from '@/lib/adminAuth';
import Image from 'next/image';
import { AdminAuthProvider } from '@/lib/auth/AdminAuthContext';
import { AdminProtectedRoute } from '@/components/auth/AdminProtectedRoute';
import { asset } from "@/lib/assets";
import { appPath } from '@/lib/navigation';

const menuItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Services', href: '/admin/services', icon: ShoppingBag },
  { name: 'Categories', href: '/admin/categories', icon: FolderTree },
  { name: 'Orders', href: '/admin/orders', icon: FileText },
  { name: 'Vendors', href: '/admin/vendors', icon: Users },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Availability', href: '/admin/schedules', icon: CalendarClock },
  { name: 'Support Tickets', href: '/admin/tickets', icon: LifeBuoy },
  { name: 'Announcements', href: '/admin/broadcast', icon: BellRing },
  { name: 'Coupons', href: '/admin/coupons', icon: Tag },
  { name: 'Offers / Sliders', href: '/admin/sliders', icon: FileText },
  { name: 'CDN Assets', href: '/admin/assets', icon: ImageIcon },
  { name: 'Blog', href: '/admin/blogs', icon: FileText },
  { name: 'Content Pages', href: '/admin/pages', icon: FileText },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    clearAdminTokens();
    window.location.href = appPath('/admin/login');
  };

  const isLoginPage = pathname.startsWith('/admin/login');

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <AdminAuthProvider>
      <div className="flex h-screen overflow-hidden bg-gray-100">
        {/* Mobile Backdrop Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gray-900 text-white transition-transform duration-300 ease-in-out lg:static lg:w-60 lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-gray-800 p-5 lg:justify-center lg:p-6">
            <div className="flex flex-col items-center justify-center text-center w-full">
              <Image
                src={asset("/img/logo.svg")}
                alt="OneWeb Logo"
                width={100}
                height={100}
                className="mx-auto mb-2"
              />
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Admin Panel</p>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="size-6" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1.5 px-3">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-[#64399C] text-white shadow-sm'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <item.icon className="size-4 shrink-0" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-t border-gray-800 p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
            >
              <LogOut className="size-4 shrink-0" />
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3.5 shadow-sm sm:px-6 sm:py-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 lg:hidden"
                aria-label="Open sidebar"
              >
                <Menu className="size-6" />
              </button>
              <h2 className="text-lg font-bold text-gray-800 sm:text-xl">
                {menuItems.find((item) => item.href === pathname)?.name || 'Dashboard'}
              </h2>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <AdminProtectedRoute>
              {children}
            </AdminProtectedRoute>
          </main>
        </div>
      </div>
    </AdminAuthProvider>
  );
}
