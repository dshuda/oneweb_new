'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CircleDollarSign, MapPin, Package, RefreshCw, UserRound, Users } from 'lucide-react';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogBody, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DataTable, ErrorBanner, PageHeader, StatTile, type Column,
} from '@/components/ui/data-table';
import { unwrapList } from '@/lib/unwrap';

interface Customer {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: boolean;
  createdAt: string | null;
  orders: number;
  spent: number;
  lastOrderAt: string | null;
}

interface CustomerOrder {
  id: number;
  trackingCode: string | null;
  grandTotal: number | null;
  deliveryStatus: string | null;
  paymentStatus: string | null;
  createdAt: string | null;
  locationName: string | null;
  shippingAddress: string | null;
}

const money = (n?: number | null) => `৳${(n ?? 0).toLocaleString()}`;
const shortDate = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/v1/admin/customers');
      setCustomers(unwrapList<Customer>(response.data));
    } catch {
      setError('Could not load customers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((c) =>
      [c.name, c.phone, c.email, c.address].some((v) => (v ?? '').toLowerCase().includes(term)),
    );
  }, [customers, search]);

  const openCustomer = async (c: Customer) => {
    setViewing(c);
    setOrders([]);
    setLoadingOrders(true);
    try {
      const response = await api.get(`/api/v1/admin/customers/${c.id}`);
      const payload = (response.data?.data ?? response.data) as { orders?: CustomerOrder[] };
      setOrders(payload?.orders ?? []);
    } catch {
      setError('Could not load that customer’s bookings.');
    } finally {
      setLoadingOrders(false);
    }
  };

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: 'Customer',
      cell: (c) => (
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <UserRound className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900">{c.name || 'Unnamed'}</p>
            <p className="truncate text-xs text-slate-500">{c.phone || c.email || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'orders',
      header: 'Bookings',
      align: 'center',
      cell: (c) =>
        c.orders > 0 ? (
          <span className="font-medium text-slate-900">{c.orders}</span>
        ) : (
          <span className="text-xs text-slate-400">None</span>
        ),
    },
    {
      key: 'spent',
      header: 'Paid to date',
      align: 'right',
      cell: (c) => <span className="font-medium text-slate-900">{money(c.spent)}</span>,
    },
    {
      key: 'lastOrderAt',
      header: 'Last booking',
      align: 'right',
      cell: (c) => <span className="text-xs text-slate-500">{shortDate(c.lastOrderAt)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (c) => (
        <Badge variant={c.status ? 'success' : 'danger'}>{c.status ? 'Active' : 'Disabled'}</Badge>
      ),
    },
  ];

  const totalSpent = customers.reduce((sum, c) => sum + (c.spent ?? 0), 0);
  const repeat = customers.filter((c) => c.orders > 1).length;

  return (
    <div className="min-h-screen bg-slate-50/60 p-6">
      <div className="mx-auto max-w-6xl">
        <PageHeader title="Customers" description="Everyone who has signed up to book a service.">
          <Button variant="outline" onClick={() => void load()}>
            <RefreshCw /> Refresh
          </Button>
        </PageHeader>

        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile icon={Users} label="Customers" value={customers.length} />
          <StatTile
            icon={Package}
            label="Have booked"
            value={customers.filter((c) => c.orders > 0).length}
            tone="success"
          />
          <StatTile icon={Users} label="Repeat customers" value={repeat} tone="warning" />
          <StatTile icon={CircleDollarSign} label="Lifetime paid" value={money(totalSpent)} tone="success" />
        </div>

        <ErrorBanner message={error} onDismiss={() => setError('')} />

        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search name, phone, email or address"
          onRowClick={openCustomer}
          emptyTitle={search ? 'No customers match that search' : 'No customers yet'}
          footer={<span className="text-xs text-slate-500">{rows.length} of {customers.length} shown</span>}
        />
      </div>

      <Dialog open={viewing !== null} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>{viewing?.name || 'Customer'}</DialogTitle>
            <DialogDescription>
              {viewing?.phone || viewing?.email || 'No contact details'} · joined{' '}
              {shortDate(viewing?.createdAt)}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 p-3 text-center">
                <p className="text-lg font-bold text-slate-900">{viewing?.orders ?? 0}</p>
                <p className="text-xs text-slate-500">Bookings</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3 text-center">
                <p className="text-lg font-bold text-slate-900">{money(viewing?.spent)}</p>
                <p className="text-xs text-slate-500">Paid</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3 text-center">
                <p className="text-sm font-semibold text-slate-900">{shortDate(viewing?.lastOrderAt)}</p>
                <p className="text-xs text-slate-500">Last booking</p>
              </div>
            </div>

            {viewing?.address && (
              <p className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <MapPin className="mt-0.5 size-4 shrink-0 text-orange-500" />
                {viewing.address}
              </p>
            )}

            <div>
              <p className="mb-2 text-sm font-semibold text-slate-800">Recent bookings</p>
              {loadingOrders ? (
                <p className="py-6 text-center text-sm text-slate-500">Loading…</p>
              ) : orders.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-500">
                  No bookings yet.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                  {orders.map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate font-mono text-xs font-semibold text-slate-900">
                          {o.trackingCode ?? `#${o.id}`}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {o.locationName || o.shippingAddress || '—'}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-medium text-slate-900">{money(o.grandTotal)}</p>
                        <p className="text-[11px] text-slate-400">{shortDate(o.createdAt)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </DialogBody>

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
