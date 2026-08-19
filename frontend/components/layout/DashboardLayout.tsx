import Link from 'next/link';
import { 
  Package, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Settings, 
  FileText,
  LayoutDashboard,
  Bell,
  LogOut,
  Menu
} from 'lucide-react';

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const sidebarItems: SidebarItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
  { title: 'Orders', href: '/dashboard/orders', icon: <ShoppingCart size={20} /> },
  { title: 'Services', href: '/dashboard/services', icon: <Package size={20} /> },
  { title: 'Users', href: '/dashboard/users', icon: <Users size={20} /> },
  { title: 'Vendors', href: '/dashboard/vendors', icon: <Users size={20} /> },
  { title: 'Coupons', href: '/dashboard/coupons', icon: <DollarSign size={20} /> },
  { title: 'Blogs', href: '/dashboard/blogs', icon: <FileText size={20} /> },
  { title: 'Pages', href: '/dashboard/pages', icon: <FileText size={20} /> },
  { title: 'Settings', href: '/dashboard/settings', icon: <Settings size={20} /> },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg hidden md:flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-blue-600">OneWeb</h1>
          <p className="text-sm text-gray-500">Admin Panel</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              {item.icon}
              <span className="font-medium">{item.title}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          <button className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg w-full transition-colors">
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 hover:bg-gray-100 rounded-lg">
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">
              {/* Dynamic title could go here */}
              Dashboard
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                A
              </div>
              <span className="text-sm font-medium text-gray-700">Admin</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}