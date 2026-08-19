'use client';

import { useCallback, useEffect, useState } from 'react';
import { BellRing, Loader2, RefreshCw, Send, Smartphone, Users } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/form-bits';
import { ErrorBanner, PageHeader, StatTile, SuccessBanner } from '@/components/ui/data-table';
import { unwrapList } from '@/lib/unwrap';

interface Audience {
  customers: number;
  vendors: number;
  all: number;
  devices: number;
}

interface SentItem {
  title: string | null;
  description: string | null;
  createdAt: string | null;
  recipients: number;
  read: number;
}

const selectClass =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm focus-visible:border-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30';

export default function AdminBroadcastPage() {
  const [audience, setAudience] = useState<Audience | null>(null);
  const [history, setHistory] = useState<SentItem[]>([]);
  const [target, setTarget] = useState('customers');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [a, h] = await Promise.all([
        api.get('/api/v1/admin/broadcast/audience'),
        api.get('/api/v1/admin/broadcast/history'),
      ]);
      setAudience((a.data?.data ?? a.data) as Audience);
      setHistory(unwrapList<SentItem>(h.data));
    } catch {
      setError('Could not load broadcast details.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const reach =
    target === 'customers'
      ? audience?.customers
      : target === 'vendors'
        ? audience?.vendors
        : audience?.all;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError('A title and message are both required.');
      return;
    }
    if (!confirm(`Send "${title.trim()}" to ${reach ?? 0} user(s)? This cannot be undone.`)) return;

    setSending(true);
    setError('');
    setStatus('');
    try {
      const response = await api.post('/api/v1/admin/broadcast', {
        title: title.trim(),
        message: message.trim(),
        audience: target,
      });
      const payload = (response.data?.data ?? response.data) as { message?: string };
      setStatus(payload?.message ?? 'Announcement sent.');
      setTitle('');
      setMessage('');
      await load();
    } catch {
      setError('Sending failed. Nothing was delivered.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 p-6">
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title="Announcements"
          description="Send a message to customers or vendors. It appears in their in-app notification feed."
        >
          <Button variant="outline" onClick={() => void load()}>
            <RefreshCw /> Refresh
          </Button>
        </PageHeader>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <StatTile icon={Users} label="Customers" value={audience?.customers ?? '—'} />
          <StatTile icon={Users} label="Vendors" value={audience?.vendors ?? '—'} />
          <StatTile
            icon={Smartphone}
            label="Registered devices"
            value={audience?.devices ?? '—'}
            tone="success"
          />
        </div>

        <ErrorBanner message={error} onDismiss={() => setError('')} />
        <SuccessBanner message={status} />

        <form onSubmit={send} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <BellRing className="size-4 text-orange-500" /> Compose
          </h2>

          <div className="space-y-4">
            <Field label="Audience" hint={reach == null ? undefined : `Reaches ${reach} user(s).`}>
              <select value={target} onChange={(e) => setTarget(e.target.value)} className={selectClass}>
                <option value="customers">Customers</option>
                <option value="vendors">Vendors</option>
                <option value="all">Everyone</option>
              </select>
            </Field>

            <Field label="Title" required>
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Eid offer — 30% off deep cleaning"
                maxLength={120}
              />
            </Field>

            <Field label="Message" required>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                maxLength={500}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:border-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30"
                placeholder="Book before Friday to claim the discount."
              />
            </Field>

            <div className="flex justify-end">
              <Button type="submit" disabled={sending}>
                {sending ? <Loader2 className="animate-spin" /> : <Send />}
                Send to {reach ?? 0}
              </Button>
            </div>
          </div>
        </form>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Recently sent</h2>
          {history.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">
              Nothing sent yet.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {history.map((h, i) => (
                <li key={`${h.title}-${h.createdAt}-${i}`} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{h.title}</p>
                      <p className="truncate text-xs text-slate-500">{h.description}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-medium text-slate-700">{h.recipients} sent</p>
                      <p className="text-[11px] text-slate-400">{h.read} read</p>
                    </div>
                  </div>
                  {h.createdAt && (
                    <p className="mt-1 text-[11px] text-slate-400">
                      {new Date(h.createdAt).toLocaleString('en-GB')}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
