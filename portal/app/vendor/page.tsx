'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CircleDollarSign, ClipboardList, Hourglass, RefreshCw, Wallet } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ErrorBanner, PageHeader, StatTile } from '@/components/ui/data-table';
import { unwrapList } from '@/lib/unwrap';
import { appPath } from '@/lib/navigation';

interface Commission {
  orderId: number;
  vendorAmount: number;
  commissionAmount: number;
  createdAt: string | null;
}

interface Earnings {
  balance: number;
  pendingBalance: number;
  totalEarnings: number;
  recentCommissions: Commission[];
}

const money = (n?: number | null) => `৳${(n ?? 0).toLocaleString()}`;

/** The earnings payload arrives either bare or inside the standard envelope. */
function unwrapObject<T>(payload: unknown): T | null {
  let node: unknown = payload;
  for (let i = 0; i < 4 && node && typeof node === 'object' && !Array.isArray(node); i += 1) {
    const record = node as Record<string, unknown>;
    if ('balance' in record || 'totalEarnings' in record) return record as T;
    node = record.data ?? null;
  }
  return null;
}

export default function VendorDashboardPage() {
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const [ongoing, setOngoing] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    // Each figure comes from the endpoint that actually owns it — no invented numbers.
    const [earningsRes, pendingRes, worksRes] = await Promise.allSettled([
      api.get('/api/v1/vendor/earnings'),
      api.get('/api/v1/vendor/pendings'),
      api.get('/api/v1/vendor/my-works'),
    ]);

    if (earningsRes.status === 'fulfilled') {
      setEarnings(unwrapObject<Earnings>(earningsRes.value.data));
    }
    if (pendingRes.status === 'fulfilled') {
      setPending(unwrapList(pendingRes.value.data).length);
    }
    if (worksRes.status === 'fulfilled') {
      const works = unwrapList<{ deliveryStatus?: string | null }>(worksRes.value.data);
      setOngoing(works.filter((w) => (w.deliveryStatus ?? '') !== 'completed').length);
    }

    if ([earningsRes, pendingRes, worksRes].some((r) => r.status === 'rejected')) {
      setError('Some figures could not be loaded — they are shown as “—” rather than guessed.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const show = (v: number | null | undefined) => (loading ? '…' : v == null ? '—' : v);

  return (
    <div>
      <PageHeader title="Vendor dashboard" description="Your work queue and earnings at a glance.">
        <Button variant="outline" onClick={() => void load()}>
          <RefreshCw /> Refresh
        </Button>
      </PageHeader>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Hourglass} label="Pending requests" value={show(pending)} tone="warning" />
        <StatTile icon={ClipboardList} label="Ongoing jobs" value={show(ongoing)} />
        <StatTile
          icon={Wallet}
          label="Available balance"
          value={loading ? '…' : earnings ? money(earnings.balance) : '—'}
          tone="success"
        />
        <StatTile
          icon={CircleDollarSign}
          label="Total earned"
          value={loading ? '…' : earnings ? money(earnings.totalEarnings) : '—'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Recent commissions</h2>
          {!earnings || earnings.recentCommissions?.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">
              {loading ? 'Loading…' : 'No commission history yet.'}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {earnings.recentCommissions.map((c) => (
                <li key={c.orderId} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">Order #{c.orderId}</p>
                    {c.createdAt && (
                      <p className="text-xs text-slate-500">
                        {new Date(c.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{money(c.vendorAmount)}</p>
                    <p className="text-xs text-slate-500">fee {money(c.commissionAmount)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Quick links</h2>
          <div className="flex flex-col gap-2">
            <Link href={appPath('/vendor/pending')}>
              <Button variant="outline" className="w-full justify-start">
                <Hourglass /> Pending requests
              </Button>
            </Link>
            <Link href={appPath('/vendor/my-works')}>
              <Button variant="outline" className="w-full justify-start">
                <ClipboardList /> My works
              </Button>
            </Link>
          </div>
          {earnings && earnings.pendingBalance > 0 && (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {money(earnings.pendingBalance)} is held pending job completion.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
