'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function VendorMyWorksPage() {
  const [works, setWorks] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const resp = await api.get('/api/v1/vendor/my-works');
        setWorks(resp.data || []);
      } catch {
        setWorks([
          { id: 1, title: 'AC Repair', status: 'ongoing' },
          { id: 2, title: 'Phone Screen', status: 'completed' },
        ]);
      }
    };
    fetch();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Works</h1>
      <div className="space-y-3">
        {works.map((w) => (
          <div key={w.orderId} className="bg-white p-4 rounded-xl shadow flex justify-between items-center">
            <div>
              <div className="font-semibold">{w.service}</div>
              <div className="text-sm text-gray-500">Status: {w.status}</div>
              <div className="text-sm text-gray-500">Date: {w.date}</div>
            </div>
            <div>
                            <div className="text-sm text-gray-500">Address: {w.address}</div>
              <div className="text-sm text-gray-500">Info: {w.additionalInfo}</div>
              <div className="text-sm text-gray-500">Time: {w.time}</div>

              </div>
            <div className="text-sm text-gray-600">#{w.orderId}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
