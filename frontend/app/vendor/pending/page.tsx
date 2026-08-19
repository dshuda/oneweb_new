'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function VendorPendingPage() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const resp = await api.get('/api/v1/vendor/pendings');
        console.log(resp.data)
        setItems(resp.data || []);
      } catch (e) {
        setItems([
          { id: 1, title: 'Fix AC', categoryId: 2 },
          { id: 2, title: 'Repair Phone', categoryId: 3 },
        ]);
      }
    };
    fetch();
  }, []);

  const handleAssign = async (id: number) => {
    try {
      await api.post(`/api/v1/vendor/assign-me`, {orderId : id});
   
      setItems(items.filter(i => i.orderId !== id));
    } catch (e) {
      // fallback simulate
      alert('Assigned (mock)');
      setItems(items.filter(i => i.id !== id));
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pending Requests</h1>
      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.orderId} className="bg-white p-4 rounded-xl shadow flex justify-between items-center">
            <div>
              <div className="font-semibold">{it.tracking}</div>
              <div className="text-sm text-gray-500">Service: {it.service}</div>
              <div className="text-sm text-gray-500">{it.address}</div>
            </div>
            <div>
                <div className="text-sm text-gray-500">Date: {it.date}</div>
                <div className="text-sm text-gray-500">Time: {it.time}</div>
                <div className="text-sm text-gray-500">Price: {it.price}</div>
              </div>
            <div className="flex gap-2">
              <button onClick={() => handleAssign(it.orderId)} className="px-3 py-2 rounded-xl bg-[#64399C] text-white">Assign To Me</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
