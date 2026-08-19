'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CircleDollarSign, Loader2, Package, Pencil, RefreshCw, Truck } from 'lucide-react';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/form-bits';
import {
  Dialog, DialogBody, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DataTable, ErrorBanner, PageHeader, StatTile, SuccessBanner, type Column,
} from '@/components/ui/data-table';
import { unwrapList } from '@/lib/unwrap';

interface Order {
  id: number;
  trackingCode: string | null;
  customer: string | null;
  paymentType: string | null;
  paymentStatus: string | null;
  deliveryStatus: string | null;
  grandTotal: number | null;
  createdAt: string | null;
  priceId?: number;
  vendorId?: number | null;
  service?: { id: number; name: string; slug?: string | null } | null;
  shippingAddress?: string | null;
  additionalInfo?: string | null;
  vendor?: string | null;
  vendorContact?: string | null;
}

interface VendorOption {
  id: number;
  name?: string | null;
  userName?: string | null;
  text?: string | null;
  phone?: string | null;
  email?: string | null;
}

const DELIVERY_TONE: Record<string, 'default' | 'info' | 'success' | 'warning' | 'danger'> = {
  pending: 'warning',
  confirmed: 'info',
  assigned: 'info',
  on_the_way: 'info',
  in_progress: 'info',
  completed: 'success',
  cancelled: 'danger',
};

const STATUSES = ['pending', 'confirmed', 'assigned', 'on_the_way', 'in_progress', 'completed', 'cancelled'];

/**
 * The API only accepts these moves from an admin — on_the_way, in_progress and
 * completed belong to the vendor app. Offering the rest would just produce
 * "invalid status transition" errors, so the dropdown lists what will work.
 */
function allowedStatuses(current: string): string[] {
  const next = new Set<string>([current]);
  if (current === 'pending') next.add('confirmed');
  if (current === 'confirmed') next.add('assigned');
  if (current !== 'completed') next.add('cancelled');
  return STATUSES.filter((s) => next.has(s));
}
const PAYMENT_STATUSES = ['unpaid', 'pending', 'paid', 'refunded'];
const PAYMENT_TYPES = ['cod', 'sslcommerz', 'bkash'];

const titleCase = (v?: string | null) =>
  v ? v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, ' ') : '—';

const money = (n?: number | null) => `৳${(n ?? 0).toLocaleString()}`;

const selectClass =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm focus-visible:border-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [viewing, setViewing] = useState<Order | null>(null);
  const [editing, setEditing] = useState<Order | null>(null);
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    id: 0,
    priceId: 0,
    deliveryStatus: 'pending',
    paymentStatus: 'unpaid',
    paymentType: 'cod',
    grandTotal: 0,
    vendorId: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/v1/admin/orders');
      setOrders(unwrapList<Order>(response.data));
    } catch {
      setError('Could not load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesFilter = filter === 'all' || (o.deliveryStatus ?? '') === filter;
      const matchesTerm =
        !term ||
        [o.trackingCode, o.customer, o.service?.name].some((v) =>
          (v ?? '').toLowerCase().includes(term),
        );
      return matchesFilter && matchesTerm;
    });
  }, [orders, search, filter]);

  const openEdit = async (order: Order) => {
    setViewing(null);
    setEditing(order);
    setVendors([]);
    setForm({
      id: order.id,
      priceId: order.priceId ?? 0,
      deliveryStatus: order.deliveryStatus ?? 'pending',
      paymentStatus: order.paymentStatus ?? 'unpaid',
      paymentType: order.paymentType ?? 'cod',
      grandTotal: order.grandTotal ?? 0,
      vendorId: order.vendorId ?? 0,
    });
    // Only vendors that serve this order's service can be assigned to it.
    if (order.service?.id) {
      try {
        const response = await api.get(
          `/api/v1/admin/vendors/dropdown?serviceId=${order.service.id}`,
        );
        setVendors(unwrapList<VendorOption>(response.data));
      } catch {
        setVendors([]);
      }
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    // The API rejects this combination, so catch it before the round trip.
    if (form.deliveryStatus === 'assigned' && !form.vendorId) {
      setError('Pick a vendor before setting the status to Assigned.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.put(`/api/v1/admin/orders/${form.id}`, {
        id: form.id,
        priceId: form.priceId,
        deliveryStatus: form.deliveryStatus,
        paymentStatus: form.paymentStatus,
        paymentType: form.paymentType,
        grandTotal: form.grandTotal,
        vendorId: form.vendorId,
      });
      setStatus(`Order ${editing?.trackingCode ?? form.id} updated.`);
      setEditing(null);
      await load();
    } catch {
      setError('Could not update the order. The status transition may not be allowed.');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Order>[] = [
    {
      key: 'trackingCode',
      header: 'Order',
      cell: (o) => (
        <div className="min-w-0">
          <p className="truncate font-mono text-xs font-semibold text-slate-900">
            {o.trackingCode ?? `#${o.id}`}
          </p>
          <p className="truncate text-xs text-slate-500">{o.service?.name ?? 'Service'}</p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      cell: (o) => <span className="truncate text-slate-700">{o.customer ?? '—'}</span>,
    },
    {
      key: 'vendor',
      header: 'Vendor',
      cell: (o) =>
        o.vendor ? (
          <span className="truncate text-slate-700">{o.vendor}</span>
        ) : (
          <span className="text-xs text-slate-400">Unassigned</span>
        ),
    },
    {
      key: 'grandTotal',
      header: 'Total',
      align: 'right',
      cell: (o) => <span className="font-medium text-slate-900">{money(o.grandTotal)}</span>,
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      cell: (o) => (
        <div className="flex flex-col gap-0.5">
          <Badge variant={o.paymentStatus === 'paid' ? 'success' : 'warning'}>
            {titleCase(o.paymentStatus)}
          </Badge>
          <span className="text-[11px] text-slate-400">{titleCase(o.paymentType)}</span>
        </div>
      ),
    },
    {
      key: 'deliveryStatus',
      header: 'Status',
      cell: (o) => (
        <Badge variant={DELIVERY_TONE[o.deliveryStatus ?? ''] ?? 'default'}>
          {titleCase(o.deliveryStatus)}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Placed',
      align: 'right',
      cell: (o) =>
        o.createdAt ? (
          <span className="text-xs text-slate-500">
            {new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (o) => (
        <Button
          size="icon"
          variant="ghost"
          title="Edit order"
          onClick={(e) => {
            e.stopPropagation();
            void openEdit(o);
          }}
        >
          <Pencil />
        </Button>
      ),
    },
  ];

  const revenue = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + (o.grandTotal ?? 0), 0);

  return (
    <div className="min-h-screen bg-slate-50/60 p-6">
      <div className="mx-auto max-w-7xl">
        <PageHeader title="Orders" description="Every booking placed through the storefront and app.">
          <Button variant="outline" onClick={() => void load()}>
            <RefreshCw /> Refresh
          </Button>
        </PageHeader>

        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile icon={Package} label="Total orders" value={orders.length} />
          <StatTile
            icon={Truck}
            label="Pending"
            value={orders.filter((o) => o.deliveryStatus === 'pending').length}
            tone="warning"
          />
          <StatTile
            icon={Package}
            label="Completed"
            value={orders.filter((o) => o.deliveryStatus === 'completed').length}
            tone="success"
          />
          <StatTile icon={CircleDollarSign} label="Paid revenue" value={money(revenue)} tone="success" />
        </div>

        <ErrorBanner message={error} onDismiss={() => setError('')} />
        <SuccessBanner message={status} />

        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search tracking code, customer or service"
          onRowClick={setViewing}
          toolbar={
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className={selectClass}>
              <option value="all">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {titleCase(s)}
                </option>
              ))}
            </select>
          }
          emptyTitle={search || filter !== 'all' ? 'No orders match those filters' : 'No orders yet'}
          footer={<span className="text-xs text-slate-500">{rows.length} of {orders.length} shown</span>}
        />
      </div>

      {/* Read-only detail sheet — opened by clicking a row. */}
      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>{viewing?.trackingCode ?? `Order #${viewing?.id}`}</DialogTitle>
            <DialogDescription>{viewing?.service?.name ?? 'Service booking'}</DialogDescription>
          </DialogHeader>

          <DialogBody>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Customer</dt>
                <dd className="font-medium text-slate-900">{viewing?.customer ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Total</dt>
                <dd className="font-medium text-slate-900">{money(viewing?.grandTotal)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Payment</dt>
                <dd>
                  <Badge variant={viewing?.paymentStatus === 'paid' ? 'success' : 'warning'}>
                    {titleCase(viewing?.paymentStatus)}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Delivery</dt>
                <dd>
                  <Badge variant={DELIVERY_TONE[viewing?.deliveryStatus ?? ''] ?? 'default'}>
                    {titleCase(viewing?.deliveryStatus)}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Vendor</dt>
                <dd className="text-slate-700">{viewing?.vendor ?? 'Unassigned'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Vendor contact</dt>
                <dd className="text-slate-700">{viewing?.vendorContact ?? '—'}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-slate-500">Address</dt>
                <dd className="text-slate-700">{viewing?.shippingAddress ?? '—'}</dd>
              </div>
              {viewing?.additionalInfo && (
                <div className="col-span-2">
                  <dt className="text-xs text-slate-500">Notes</dt>
                  <dd className="text-slate-700">{viewing.additionalInfo}</dd>
                </div>
              )}
            </dl>
          </DialogBody>

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>
              Close
            </Button>
            <Button onClick={() => viewing && void openEdit(viewing)}>
              <Pencil /> Edit order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent size="lg">
          <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
            <DialogHeader>
              <DialogTitle>Edit {editing?.trackingCode ?? `order #${editing?.id}`}</DialogTitle>
              <DialogDescription>
                {editing?.customer ?? 'Customer'} — {editing?.service?.name ?? 'service booking'}
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Delivery status"
                  hint="Later stages are advanced by the vendor from their app."
                >
                  <select
                    value={form.deliveryStatus}
                    onChange={(e) => setForm({ ...form, deliveryStatus: e.target.value })}
                    className={selectClass}
                  >
                    {allowedStatuses(editing?.deliveryStatus ?? 'pending').map((s) => (
                      <option key={s} value={s}>
                        {titleCase(s)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label="Assigned vendor"
                  required={form.deliveryStatus === 'assigned'}
                  hint={
                    vendors.length === 0
                      ? 'No vendors are registered for this service.'
                      : 'Only vendors covering this service are listed.'
                  }
                >
                  <select
                    value={form.vendorId}
                    onChange={(e) => setForm({ ...form, vendorId: Number(e.target.value) })}
                    className={selectClass}
                  >
                    <option value={0}>Unassigned</option>
                    {vendors.map((v) => {
                      const vendorName = v.name || v.userName || v.text || `Vendor #${v.id}`;
                      return (
                        <option key={v.id} value={v.id}>
                          {vendorName}
                          {v.phone ? ` — ${v.phone}` : ''}
                        </option>
                      );
                    })}
                  </select>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Payment status">
                  <select
                    value={form.paymentStatus}
                    onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}
                    className={selectClass}
                  >
                    {PAYMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {titleCase(s)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Payment method">
                  <select
                    value={form.paymentType}
                    onChange={(e) => setForm({ ...form, paymentType: e.target.value })}
                    className={selectClass}
                  >
                    {PAYMENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t === 'cod' ? 'Cash on delivery' : titleCase(t)}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Grand total (৳)" hint="Adjust for negotiated or partial work.">
                <Input
                  type="number"
                  min={0}
                  value={form.grandTotal}
                  onChange={(e) => setForm({ ...form, grandTotal: Number(e.target.value) })}
                />
              </Field>
            </DialogBody>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="animate-spin" />}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
