'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalUsers: number;
  totalVendors: number;
  totalRevenue: number;
  todayRevenue: number;
  totalServices: number;
  recentOrders: {
    id: number;
    trackingCode: string | null;
    deliveryStatus: string;
    grandTotal: number | null;
    createdAt: string | null;
  }[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/api/v1/admin/dashboard/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!stats) {
    return <div className="text-center py-12 text-red-600">Failed to load dashboard</div>;
  }

  const statCards = [
    { label: 'Total Orders', value: stats.totalOrders, color: 'blue' },
    { label: 'Pending Orders', value: stats.pendingOrders, color: 'yellow' },
    { label: 'Completed Orders', value: stats.completedOrders, color: 'green' },
    { label: 'Cancelled Orders', value: stats.cancelledOrders, color: 'red' },
    { label: 'Total Revenue', value: `৳${stats.totalRevenue.toFixed(2)}`, color: 'purple' },
    { label: "Today's Revenue", value: `৳${stats.todayRevenue.toFixed(2)}`, color: 'indigo' },
    { label: 'Total Users', value: stats.totalUsers, color: 'pink' },
    { label: 'Total Vendors', value: stats.totalVendors, color: 'orange' },
    { label: 'Total Services', value: stats.totalServices, color: 'teal' },
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      assigned: 'bg-indigo-100 text-indigo-800',
      on_the_way: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-md p-6">
            <p className="text-sm text-gray-600 mb-2">{card.label}</p>
            <p className="text-3xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tracking Code</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((order) => (
                <tr key={order.id} className="border-t">
                  <td className="px-4 py-3">{order.id}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="text-blue-600 hover:underline">
                      {order.trackingCode || '-'}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.deliveryStatus)}`}>
                      {order.deliveryStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">৳{order.grandTotal?.toFixed(2) || '0.00'}</td>
                  <td className="px-4 py-3">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
