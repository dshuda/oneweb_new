'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, LifeBuoy, Loader2, MessageSquare, RefreshCw, Trash2, UserRound } from 'lucide-react';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/form-bits';
import {
  Dialog, DialogBody, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DataTable, ErrorBanner, PageHeader, StatTile, SuccessBanner, type Column,
} from '@/components/ui/data-table';
import { unwrapList } from '@/lib/unwrap';

interface Ticket {
  id: number;
  subject: string | null;
  message: string | null;
  status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  userId: number | null;
  userName: string | null;
  userPhone: string | null;
  userEmail: string | null;
}

const TONE: Record<string, 'warning' | 'info' | 'success' | 'default'> = {
  open: 'warning',
  replied: 'info',
  closed: 'success',
};

const selectClass =
  'h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm focus-visible:border-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30';

const titleCase = (v?: string | null) => (v ? v.charAt(0).toUpperCase() + v.slice(1) : '—');

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [viewing, setViewing] = useState<Ticket | null>(null);
  const [reply, setReply] = useState('');
  const [nextStatus, setNextStatus] = useState('replied');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/v1/admin/support-tickets');
      setTickets(unwrapList<Ticket>(response.data));
    } catch {
      setError('Could not load support tickets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tickets.filter((t) => {
      const matchesFilter = filter === 'all' || (t.status ?? '') === filter;
      const matchesTerm =
        !term ||
        [t.subject, t.message, t.userName, t.userPhone].some((v) =>
          (v ?? '').toLowerCase().includes(term),
        );
      return matchesFilter && matchesTerm;
    });
  }, [tickets, search, filter]);

  const open = (t: Ticket) => {
    setViewing(t);
    setReply('');
    setNextStatus(t.status === 'closed' ? 'closed' : 'replied');
  };

  const respond = async () => {
    if (!viewing) return;
    setSaving(true);
    setError('');
    try {
      await api.put(`/api/v1/admin/support-tickets/${viewing.id}`, {
        reply: reply.trim() || null,
        status: nextStatus,
      });
      setStatus(reply.trim() ? 'Reply sent to the customer.' : 'Ticket updated.');
      setViewing(null);
      await load();
    } catch {
      setError('Could not update the ticket.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (t: Ticket) => {
    if (!confirm(`Delete the ticket "${t.subject}"?`)) return;
    try {
      await api.delete(`/api/v1/admin/support-tickets/${t.id}`);
      setStatus('Ticket deleted.');
      await load();
    } catch {
      setError('Delete failed.');
    }
  };

  const columns: Column<Ticket>[] = [
    {
      key: 'subject',
      header: 'Ticket',
      cell: (t) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{t.subject || 'No subject'}</p>
          <p className="truncate text-xs text-slate-500">{t.message}</p>
        </div>
      ),
    },
    {
      key: 'userName',
      header: 'Customer',
      cell: (t) => (
        <div className="flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <UserRound className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm text-slate-800">{t.userName || 'Unknown'}</p>
            <p className="truncate text-xs text-slate-500">{t.userPhone || t.userEmail || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (t) => <Badge variant={TONE[t.status ?? ''] ?? 'default'}>{titleCase(t.status)}</Badge>,
    },
    {
      key: 'createdAt',
      header: 'Raised',
      align: 'right',
      cell: (t) =>
        t.createdAt ? (
          <span className="text-xs text-slate-500">
            {new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (t) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="outline" onClick={() => open(t)}>
            <MessageSquare /> Reply
          </Button>
          <Button
            size="icon"
            variant="destructiveGhost"
            title="Delete ticket"
            onClick={(e) => {
              e.stopPropagation();
              void remove(t);
            }}
          >
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 p-6">
      <div className="mx-auto max-w-6xl">
        <PageHeader title="Support tickets" description="Questions and problems raised by customers.">
          <Button variant="outline" onClick={() => void load()}>
            <RefreshCw /> Refresh
          </Button>
        </PageHeader>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <StatTile icon={LifeBuoy} label="Total tickets" value={tickets.length} />
          <StatTile
            icon={MessageSquare}
            label="Awaiting reply"
            value={tickets.filter((t) => t.status === 'open').length}
            tone="warning"
          />
          <StatTile
            icon={CheckCircle2}
            label="Closed"
            value={tickets.filter((t) => t.status === 'closed').length}
            tone="success"
          />
        </div>

        <ErrorBanner message={error} onDismiss={() => setError('')} />
        <SuccessBanner message={status} />

        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search subject, message or customer"
          onRowClick={open}
          toolbar={
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className={selectClass}>
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="replied">Replied</option>
              <option value="closed">Closed</option>
            </select>
          }
          emptyTitle={search || filter !== 'all' ? 'No tickets match those filters' : 'No support tickets yet'}
          footer={<span className="text-xs text-slate-500">{rows.length} of {tickets.length} shown</span>}
        />
      </div>

      <Dialog open={viewing !== null} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>{viewing?.subject || 'Ticket'}</DialogTitle>
            <DialogDescription>
              {viewing?.userName || 'Customer'} · {viewing?.userPhone || viewing?.userEmail || '—'}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <p className="whitespace-pre-wrap text-sm text-slate-700">{viewing?.message}</p>
              {viewing?.createdAt && (
                <p className="mt-2 text-xs text-slate-400">
                  Raised {new Date(viewing.createdAt).toLocaleString('en-GB')}
                </p>
              )}
            </div>

            <Field label="Reply" hint="Delivered to the customer as an in-app notification.">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:border-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30"
                placeholder="Write your response…"
              />
            </Field>

            <Field label="Set status">
              <select
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value)}
                className={`${selectClass} w-full`}
              >
                <option value="open">Open</option>
                <option value="replied">Replied</option>
                <option value="closed">Closed</option>
              </select>
            </Field>
          </DialogBody>

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>
              Cancel
            </Button>
            <Button onClick={() => void respond()} disabled={saving}>
              {saving && <Loader2 className="animate-spin" />}
              {reply.trim() ? 'Send reply' : 'Update status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
