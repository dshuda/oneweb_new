'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Ban, CheckCircle2, RefreshCw, ShieldCheck, Trash2, UserRound, Users as UsersIcon } from 'lucide-react';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DataTable,
  ErrorBanner,
  PageHeader,
  StatTile,
  SuccessBanner,
  type Column,
} from '@/components/ui/data-table';

interface User {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  userType: string | null;
  status: boolean;
  createdAt: string | null;
}

/** The API has wrapped this list in different envelopes over time. */
function unwrap(payload: unknown): User[] {
  const seen = new Set<unknown>();
  let node: unknown = payload;
  while (node && typeof node === 'object' && !Array.isArray(node) && !seen.has(node)) {
    seen.add(node);
    const record = node as Record<string, unknown>;
    node = record.items ?? record.data ?? null;
  }
  return Array.isArray(node) ? (node as User[]) : [];
}

const ROLE_TONE: Record<string, 'info' | 'success' | 'warning' | 'default'> = {
  admin: 'warning',
  staff: 'info',
  vendor: 'info',
  customer: 'success',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/v1/admin/users');
      setUsers(unwrap(response.data));
    } catch {
      setError('Could not load users. Check that the API is reachable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) =>
      [u.name, u.email, u.phone].some((v) => (v ?? '').toLowerCase().includes(term)),
    );
  }, [users, search]);

  const toggleStatus = async (u: User) => {
    const next = !u.status;
    if (!confirm(`${next ? 'Enable' : 'Disable'} ${u.name || 'this user'}?`)) return;
    try {
      await api.put(`/api/v1/admin/users/${u.id}/status`, { isBanned: !next });
      setStatus(next ? 'User enabled.' : 'User disabled.');
      await load();
    } catch {
      setError('Could not change the user status.');
    }
  };

  const remove = async (u: User) => {
    if (!confirm(`Permanently delete ${u.name || 'this user'}? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/v1/admin/users/${u.id}`);
      setStatus('User deleted.');
      await load();
    } catch {
      setError('Delete failed — the user may have existing orders.');
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'User',
      cell: (u) => (
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <UserRound className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900">{u.name || 'Unnamed'}</p>
            <p className="truncate text-xs text-slate-500">{u.email || u.phone || '—'}</p>
          </div>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone', cell: (u) => u.phone || '—' },
    {
      key: 'userType',
      header: 'Role',
      cell: (u) => (
        <Badge variant={ROLE_TONE[(u.userType ?? '').toLowerCase()] ?? 'default'}>
          {u.userType || 'unknown'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (u) => (
        <Badge variant={u.status ? 'success' : 'danger'}>{u.status ? 'Active' : 'Disabled'}</Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      align: 'right',
      cell: (u) =>
        u.createdAt ? (
          <span className="text-xs text-slate-500">
            {new Date(u.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (u) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            size="sm"
            variant={u.status ? 'destructiveGhost' : 'outline'}
            onClick={() => void toggleStatus(u)}
          >
            {u.status ? <Ban /> : <CheckCircle2 />}
            {u.status ? 'Disable' : 'Enable'}
          </Button>
          <Button size="icon" variant="destructiveGhost" title="Delete user" onClick={() => void remove(u)}>
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ];

  const admins = users.filter((u) => ['admin', 'staff'].includes((u.userType ?? '').toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50/60 p-6">
      <div className="mx-auto max-w-6xl">
        <PageHeader title="Users" description="Everyone with an account — customers, vendors and staff.">
          <Button variant="outline" onClick={() => void load()}>
            <RefreshCw /> Refresh
          </Button>
        </PageHeader>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <StatTile icon={UsersIcon} label="Total users" value={users.length} />
          <StatTile
            icon={UserRound}
            label="Customers"
            value={users.filter((u) => (u.userType ?? '').toLowerCase() === 'customer').length}
            tone="success"
          />
          <StatTile icon={ShieldCheck} label="Admins & staff" value={admins.length} tone="warning" />
        </div>

        <ErrorBanner message={error} onDismiss={() => setError('')} />
        <SuccessBanner message={status} />

        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name, email or phone"
          emptyTitle={search ? 'No users match that search' : 'No users yet'}
          footer={<span className="text-xs text-slate-500">{rows.length} of {users.length} shown</span>}
        />
      </div>
    </div>
  );
}
