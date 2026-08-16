'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, FolderTree, Users, Settings, FileText, Tag, LogOut } from 'lucide-react';
import { clearAdminTokens } from '@/lib/adminAuth';
import Image from 'next/image';
import { AdminAuthProvider } from '@/lib/auth/AdminAuthContext';
import { AdminProtectedRoute } from '@/components/auth/AdminProtectedRoute';

const menuItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Categories', href: '/admin/categories', icon: FolderTree },
  { name: 'Services', href: '/admin/services', icon: ShoppingBag },
  { name: 'Orders', href: '/admin/orders', icon: FileText },
  { name: 'Vendors', href: '/admin/vendors', icon: Users },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Coupons', href: '/admin/coupons', icon: Tag },
  { name: 'Sliders', href: '/admin/sliders', icon: FileText },
  // { name: 'Blogs', href: '/admin/blogs', icon: FileText },
  // { name: 'Pages', href: '/admin/pages', icon: FileText },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const handleLogout = () => {
    clearAdminTokens();
    window.location.href = '/admin/login';
  };

  const isLoginPage = pathname.startsWith('/admin/login');

  if (isLoginPage) {
    return <>{children}</>;
  }

  else {
    return (
      <AdminAuthProvider>
        <div className="flex h-screen">
          {/* Sidebar */}
          <div className="w-60 bg-gray-900 text-white flex flex-col">
            <div className="p-6 border-b border-gray-800">
              <Image
                src="/img/logo.svg"
                alt="OneWeb Logo"
                width={100}
                height={100}
                className="mx-auto mb-4"
              />
              <p className="text-sm text-gray-400">Admin Panel</p>
            </div>

            <nav className="flex-1 py-6 overflow-y-auto">
              <ul className="space-y-2 px-4">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                            ? 'bg-[#64399C] text-white'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                          }`}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="p-6 border-t border-gray-800">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto bg-gray-100">
            <header className="bg-white shadow-sm px-8 py-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {menuItems.find((item) => item.href === pathname)?.name || 'Dashboard'}
              </h2>
            </header>
            <main className="p-8">
              <AdminProtectedRoute>
              {children}
              </AdminProtectedRoute>
              </main>
          </div>
        </div>
      </AdminAuthProvider>
    );
  }
}
