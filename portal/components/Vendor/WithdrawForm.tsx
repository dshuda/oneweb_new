'use client';

import { useState } from 'react';

export default function WithdrawForm({ balance = 0, onRequest }: { balance?: number; onRequest?: () => void }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('mfs');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount || '0');
    if (num <= 0) return alert('Enter a valid amount');
    if (num > balance) return alert('Amount exceeds balance');
    // In real app: call API to request withdrawal
    alert(`Withdrawal requested: ${num} via ${method}`);
    onRequest?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Available Balance</label>
        <div className="mt-1 text-lg font-semibold">{balance}</div>
      </div>
      <div>
        <label className="block text-sm font-medium">Amount</label>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 w-full rounded-xl border-gray-300 bg-gray-50 p-3" placeholder="0.00" />
      </div>
      <div>
        <label className="block text-sm font-medium">Withdraw Method</label>
        <select value={method} onChange={(e) => setMethod(e.target.value)} className="mt-1 w-full rounded-xl border-gray-300 bg-gray-50 p-3">
          <option value="mfs">MFS</option>
          <option value="bank">Bank</option>
        </select>
      </div>
      <div className="flex justify-end">
        <button type="submit" className="rounded-xl bg-[#64399C] px-4 py-2 text-white">Request</button>
      </div>
    </form>
  );
}
