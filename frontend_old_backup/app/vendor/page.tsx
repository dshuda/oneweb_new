'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function VendorDashboardPage() {
  const [stats, setStats] = useState({ pending: 0, ongoing: 0, balance: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const resp = await api.get('/api/v1/vendor/dashboard');
        setStats(resp.data || {});
      } catch (e) {
        // fallback mock
        setStats({ pending: 3, ongoing: 2, balance: 1200 });
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Vendor Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow">Pending Requests<div className="text-3xl font-semibold mt-2">{stats.pending}</div></div>
        <div className="bg-white p-4 rounded-xl shadow">Ongoing<div className="text-3xl font-semibold mt-2">{stats.ongoing}</div></div>
        <div className="bg-white p-4 rounded-xl shadow">Balance<div className="text-3xl font-semibold mt-2">{stats.balance}</div></div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-3">Quick Links</h2>
        <div className="flex gap-3">
          <a href="/vendor/pending" className="px-4 py-2 rounded-xl bg-gray-100">View Pending</a>
          <a href="/vendor/my-works" className="px-4 py-2 rounded-xl bg-gray-100">My Works</a>
          <a href="/vendor/profile" className="px-4 py-2 rounded-xl bg-gray-100">Profile & Payments</a>
        </div>
      </div>
    </div>
  );
}
