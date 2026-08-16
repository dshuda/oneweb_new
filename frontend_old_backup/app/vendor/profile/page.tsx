'use client';

import { useState } from 'react';
import PaymentForm from '@/components/Vendor/PaymentForm';
import WithdrawForm from '@/components/Vendor/WithdrawForm';

export default function VendorProfilePage() {
  const [balance] = useState(1200);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Vendor Profile</h1>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-3">Documents</h2>
        <p className="text-sm text-gray-500">You can upload documents like ID, trade license, bank docs here. (Upload UI not implemented in scaffold.)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="font-semibold mb-3">Payment Info</h3>
          <PaymentForm />
        </div>
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="font-semibold mb-3">Request Withdrawal</h3>
          <WithdrawForm balance={balance} />
        </div>
      </div>
    </div>
  );
}
