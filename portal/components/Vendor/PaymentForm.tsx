'use client';

import { useState } from 'react';

export default function PaymentForm({ onSave }: { onSave?: () => void }) {
  const [method, setMethod] = useState('cash');
  const [mfsNumber, setMfsNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In real app: call API to save payment info
    alert(`Payment method saved: ${method}${method === 'mfs' ? ' (' + mfsNumber + ')' : ''}`);
    onSave?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Payment Method</label>
        <select value={method} onChange={(e) => setMethod(e.target.value)} className="mt-1 w-full rounded-xl border-gray-300 bg-gray-50 p-3">
          <option value="cash">Cash</option>
          <option value="mfs">MFS (Mobile Financial Service)</option>
        </select>
      </div>

      {method === 'mfs' && (
        <div>
          <label className="block text-sm font-medium">MFS Number</label>
          <input value={mfsNumber} onChange={(e) => setMfsNumber(e.target.value)} placeholder="e.g. 017XXXXXXXX" className="mt-1 w-full rounded-xl border-gray-300 bg-gray-50 p-3" />
        </div>
      )}

      <div className="flex justify-end">
        <button type="submit" className="rounded-xl bg-[#64399C] px-4 py-2 text-white">Save</button>
      </div>
    </form>
  );
}
