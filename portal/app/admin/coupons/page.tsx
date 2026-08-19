'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Percent, Plus, RefreshCw, Tag, Trash2, Pencil } from 'lucide-react';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, Switch } from '@/components/ui/form-bits';
import {
  Dialog, DialogBody, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DataTable, ErrorBanner, PageHeader, StatTile, SuccessBanner, type Column,
} from '@/components/ui/data-table';
import { unwrapList } from '@/lib/unwrap';

interface Coupon {
  id: number;
  code: string;
  discountType: string;
  discount: number;
  maxDiscount: number | null;
  minimumPurchase: number | null;
  usageLimit?: number | null;
  usedCount?: number;
  startDate?: string | null;
  endDate: string | null;
  status: boolean;
}

const EMPTY = {
  id: 0,
  code: '',
  discountType: 'percentage',
  discount: 0,
  maxDiscount: '' as number | '',
  minimumPurchase: '' as number | '',
  usageLimit: '' as number | '',
  endDate: '',
  status: true,
};

const isExpired = (c: Coupon) => Boolean(c.endDate && new Date(c.endDate) < new Date());

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/v1/admin/coupons');
      setCoupons(unwrapList<Coupon>(response.data));
    } catch {
      setError('Could not load coupons.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? coupons.filter((c) => (c.code ?? '').toLowerCase().includes(term)) : coupons;
  }, [coupons, search]);

  const openCreate = () => {
    setForm({ ...EMPTY });
    setShowForm(true);
  };

  const openEdit = (c: Coupon) => {
    setForm({
      id: c.id,
      code: c.code,
      discountType: c.discountType || 'percentage',
      discount: c.discount,
      maxDiscount: c.maxDiscount ?? '',
      minimumPurchase: c.minimumPurchase ?? '',
      usageLimit: c.usageLimit ?? '',
      endDate: c.endDate ? c.endDate.slice(0, 10) : '',
      status: c.status,
    });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setStatus('');
    const payload = {
      ...form,
      code: form.code.trim().toUpperCase(),
      maxDiscount: form.maxDiscount === '' ? null : Number(form.maxDiscount),
      minimumPurchase: form.minimumPurchase === '' ? null : Number(form.minimumPurchase),
      usageLimit: form.usageLimit === '' ? null : Number(form.usageLimit),
      endDate: form.endDate || null,
    };
    try {
      if (form.id > 0) await api.put(`/api/v1/admin/coupons/${form.id}`, payload);
      else await api.post('/api/v1/admin/coupons', payload);
      setStatus(form.id > 0 ? 'Coupon updated.' : 'Coupon created.');
      setShowForm(false);
      await load();
    } catch {
      setError('Saving the coupon failed.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: Coupon) => {
    if (!confirm(`Delete coupon "${c.code}"?`)) return;
    try {
      await api.delete(`/api/v1/admin/coupons/${c.id}`);
      setStatus('Coupon deleted.');
      await load();
    } catch {
      setError('Delete failed.');
    }
  };

  const columns: Column<Coupon>[] = [
    {
      key: 'code',
      header: 'Code',
      cell: (c) => (
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-800">
            {c.code}
          </span>
        </div>
      ),
    },
    {
      key: 'discount',
      header: 'Discount',
      cell: (c) => (
        <span className="font-medium text-slate-900">
          {c.discountType === 'percentage' ? `${c.discount}%` : `৳${c.discount.toLocaleString()}`}
          {c.maxDiscount ? (
            <span className="ml-1 text-xs font-normal text-slate-500">max ৳{c.maxDiscount}</span>
          ) : null}
        </span>
      ),
    },
    {
      key: 'minimumPurchase',
      header: 'Min spend',
      cell: (c) => (c.minimumPurchase ? `৳${c.minimumPurchase.toLocaleString()}` : '—'),
    },
    {
      key: 'usage',
      header: 'Used',
      align: 'center',
      cell: (c) => (
        <span className="text-xs text-slate-600">
          {c.usedCount ?? 0}
          {c.usageLimit ? ` / ${c.usageLimit}` : ''}
        </span>
      ),
    },
    {
      key: 'endDate',
      header: 'Expires',
      cell: (c) =>
        c.endDate ? (
          <span className={isExpired(c) ? 'text-xs font-medium text-red-600' : 'text-xs text-slate-500'}>
            {new Date(c.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        ) : (
          <span className="text-xs text-slate-400">No expiry</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (c) =>
        isExpired(c) ? (
          <Badge variant="warning">Expired</Badge>
        ) : (
          <Badge variant={c.status ? 'success' : 'danger'}>{c.status ? 'Active' : 'Disabled'}</Badge>
        ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (c) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" title="Edit" onClick={() => openEdit(c)}>
            <Pencil />
          </Button>
          <Button size="icon" variant="destructiveGhost" title="Delete" onClick={() => void remove(c)}>
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 p-6">
      <div className="mx-auto max-w-6xl">
        <PageHeader title="Coupons" description="Discount codes customers can apply at checkout.">
          <Button variant="outline" onClick={() => void load()}>
            <RefreshCw /> Refresh
          </Button>
          <Button onClick={openCreate}>
            <Plus /> New coupon
          </Button>
        </PageHeader>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <StatTile icon={Tag} label="Total coupons" value={coupons.length} />
          <StatTile
            icon={Percent}
            label="Active"
            value={coupons.filter((c) => c.status && !isExpired(c)).length}
            tone="success"
          />
          <StatTile icon={Tag} label="Expired" value={coupons.filter(isExpired).length} tone="warning" />
        </div>

        <ErrorBanner message={error} onDismiss={() => setError('')} />
        <SuccessBanner message={status} />

        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by code"
          emptyTitle={search ? 'No coupons match that search' : 'No coupons yet'}
          emptyAction={
            !search ? (
              <Button onClick={openCreate}>
                <Plus /> Create the first coupon
              </Button>
            ) : undefined
          }
        />
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent size="lg">
          <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
            <DialogHeader>
              <DialogTitle>{form.id ? 'Edit coupon' : 'New coupon'}</DialogTitle>
              <DialogDescription>Codes are matched case-insensitively at checkout.</DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Code" required>
                  <Input
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="SAVE40"
                    className="font-mono uppercase"
                  />
                </Field>
                <Field label="Discount type">
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm focus-visible:border-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed amount</option>
                  </select>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={form.discountType === 'percentage' ? 'Discount (%)' : 'Discount (৳)'} required>
                  <Input
                    required
                    type="number"
                    min={0}
                    value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Max discount (৳)" hint="Caps a percentage discount. Optional.">
                  <Input
                    type="number"
                    min={0}
                    value={form.maxDiscount}
                    onChange={(e) =>
                      setForm({ ...form, maxDiscount: e.target.value === '' ? '' : Number(e.target.value) })
                    }
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Minimum spend (৳)">
                  <Input
                    type="number"
                    min={0}
                    value={form.minimumPurchase}
                    onChange={(e) =>
                      setForm({ ...form, minimumPurchase: e.target.value === '' ? '' : Number(e.target.value) })
                    }
                  />
                </Field>
                <Field label="Usage limit" hint="Total uses across all customers.">
                  <Input
                    type="number"
                    min={0}
                    value={form.usageLimit}
                    onChange={(e) =>
                      setForm({ ...form, usageLimit: e.target.value === '' ? '' : Number(e.target.value) })
                    }
                  />
                </Field>
                <Field label="Expires on">
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  />
                </Field>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">Active</p>
                  <p className="text-xs text-slate-500">Inactive coupons are rejected at checkout.</p>
                </div>
                <Switch checked={form.status} onCheckedChange={(v) => setForm({ ...form, status: v })} />
              </div>
            </DialogBody>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="animate-spin" />}
                {form.id ? 'Save changes' : 'Create coupon'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
