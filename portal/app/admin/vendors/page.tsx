'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Ban, CheckCircle2, Loader2, Pencil, Plus, RefreshCw, UserRound, Wallet } from 'lucide-react';
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

interface Vendor {
  id: number;
  userId: number;
  userName: string | null;
  phone: string | null;
  balance: number;
  pendingBalance: number;
  totalEarnings: number;
  status: boolean;
  createdAt: string | null;
  commissionRate?: number;
  serviceIds?: number[];
}

interface RootService {
  id: number;
  name: string;
}

const money = (n: number | null | undefined) => `৳${(n ?? 0).toLocaleString()}`;

const EMPTY_FORM = {
  id: 0,
  userName: '',
  phone: '',
  current: false,
  serviceIds: [] as number[],
  commissionRate: 0,
};

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [services, setServices] = useState<RootService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/v1/admin/vendors');
      setVendors(unwrapList<Vendor>(response.data));
    } catch {
      setError('Could not load vendors.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    // Root services are the categories a vendor can be assigned work from.
    api
      .get('/api/v1/admin/services/services-root')
      .then((r) => setServices(unwrapList<RootService>(r.data)))
      .catch(() => setServices([]));
  }, [load]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return vendors;
    return vendors.filter((v) =>
      [v.userName, v.phone].some((x) => (x ?? '').toLowerCase().includes(term)),
    );
  }, [vendors, search]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  };

  const openEdit = (v: Vendor) => {
    setForm({
      id: v.id,
      userName: v.userName ?? '',
      phone: v.phone ?? '',
      current: Boolean(v.status),
      serviceIds: v.serviceIds ?? [],
      commissionRate: v.commissionRate ?? 0,
    });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      userName: form.userName,
      phone: form.phone,
      current: form.current,
      serviceIds: form.serviceIds,
      commissionRate: form.commissionRate,
    };
    try {
      if (form.id > 0) await api.put(`/api/v1/admin/vendors/${form.id}`, payload);
      else await api.post('/api/v1/admin/vendors', payload);
      setStatus(form.id > 0 ? 'Vendor updated.' : 'Vendor created.');
      setShowForm(false);
      await load();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Saving the vendor failed.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const toggleService = (id: number) =>
    setForm((f) => ({
      ...f,
      serviceIds: f.serviceIds.includes(id)
        ? f.serviceIds.filter((x) => x !== id)
        : [...f.serviceIds, id],
    }));

  const toggleStatus = async (v: Vendor) => {
    const next = !v.status;
    if (!confirm(`${next ? 'Enable' : 'Disable'} ${v.userName || 'this vendor'}?`)) return;
    try {
      await api.put(`/api/v1/admin/vendors/${v.id}/status`, { isBanned: !next });
      setStatus(next ? 'Vendor enabled.' : 'Vendor disabled.');
      await load();
    } catch {
      setError('Could not change the vendor status.');
    }
  };

  const columns: Column<Vendor>[] = [
    {
      key: 'userName',
      header: 'Vendor',
      cell: (v) => (
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <UserRound className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900">{v.userName || 'Unnamed vendor'}</p>
            <p className="truncate text-xs text-slate-500">{v.phone || '—'}</p>
          </div>
        </div>
      ),
    },
    { key: 'balance', header: 'Balance', align: 'right', cell: (v) => money(v.balance) },
    {
      key: 'pendingBalance',
      header: 'Pending',
      align: 'right',
      cell: (v) => <span className="text-amber-600">{money(v.pendingBalance)}</span>,
    },
    {
      key: 'totalEarnings',
      header: 'Earned',
      align: 'right',
      cell: (v) => <span className="font-medium text-slate-900">{money(v.totalEarnings)}</span>,
    },
    {
      key: 'commissionRate',
      header: 'Commission',
      align: 'center',
      cell: (v) => (v.commissionRate ? `${v.commissionRate}%` : '—'),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (v) => (
        <Badge variant={v.status ? 'success' : 'danger'}>{v.status ? 'Active' : 'Disabled'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (v) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="icon" variant="ghost" title="Edit vendor" onClick={() => openEdit(v)}>
            <Pencil />
          </Button>
          <Button
            size="sm"
            variant={v.status ? 'destructiveGhost' : 'outline'}
            onClick={() => void toggleStatus(v)}
          >
            {v.status ? <Ban /> : <CheckCircle2 />}
            {v.status ? 'Disable' : 'Enable'}
          </Button>
        </div>
      ),
    },
  ];

  const owed = vendors.reduce((sum, v) => sum + (v.pendingBalance ?? 0), 0);

  return (
    <div className="min-h-screen bg-slate-50/60 p-6">
      <div className="mx-auto max-w-6xl">
        <PageHeader title="Vendors" description="Service providers, their balances and payout status.">
          <Button variant="outline" onClick={() => void load()}>
            <RefreshCw /> Refresh
          </Button>
          <Button onClick={openCreate}>
            <Plus /> New vendor
          </Button>
        </PageHeader>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <StatTile icon={UserRound} label="Total vendors" value={vendors.length} />
          <StatTile
            icon={CheckCircle2}
            label="Active"
            value={vendors.filter((v) => v.status).length}
            tone="success"
          />
          <StatTile icon={Wallet} label="Pending payouts" value={money(owed)} tone="warning" />
        </div>

        <ErrorBanner message={error} onDismiss={() => setError('')} />
        <SuccessBanner message={status} />

        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name or phone"
          emptyTitle={search ? 'No vendors match that search' : 'No vendors yet'}
          emptyAction={
            !search ? (
              <Button onClick={openCreate}>
                <Plus /> Add the first vendor
              </Button>
            ) : undefined
          }
          footer={<span className="text-xs text-slate-500">{rows.length} of {vendors.length} shown</span>}
        />
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent size="lg">
          <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
            <DialogHeader>
              <DialogTitle>{form.id ? 'Edit vendor' : 'New vendor'}</DialogTitle>
              <DialogDescription>
                Contact details, commission, and the services this vendor can be assigned.
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" required>
                  <Input
                    required
                    value={form.userName}
                    onChange={(e) => setForm({ ...form, userName: e.target.value })}
                    placeholder="Quick Fix Services"
                  />
                </Field>
                <Field label="Phone" required>
                  <Input
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="01XXXXXXXXX"
                  />
                </Field>
              </div>

              <Field label="Commission rate (%)" hint="Share retained by the platform.">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.commissionRate}
                  onChange={(e) => setForm({ ...form, commissionRate: Number(e.target.value) })}
                />
              </Field>

              <Field label="Services" hint="Categories this vendor can be assigned work from.">
                {services.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-200 py-4 text-center text-xs text-slate-500">
                    No services available.
                  </p>
                ) : (
                  <div className="grid max-h-48 gap-1.5 overflow-y-auto rounded-xl border border-slate-200 p-3 sm:grid-cols-2">
                    {services.map((service) => (
                      <label
                        key={service.id}
                        className="flex items-center gap-2 text-sm text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={form.serviceIds.includes(service.id)}
                          onChange={() => toggleService(service.id)}
                          className="size-4 accent-orange-500"
                        />
                        <span className="truncate">{service.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </Field>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">Active</p>
                  <p className="text-xs text-slate-500">Inactive vendors receive no new work.</p>
                </div>
                <Switch
                  checked={form.current}
                  onCheckedChange={(v) => setForm({ ...form, current: v })}
                />
              </div>
            </DialogBody>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="animate-spin" />}
                {form.id ? 'Save changes' : 'Create vendor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
