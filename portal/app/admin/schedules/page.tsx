'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarClock, CalendarX, Clock, RefreshCw, ShoppingBag } from 'lucide-react';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DataTable, ErrorBanner, PageHeader, StatTile, type Column,
} from '@/components/ui/data-table';
import { ScheduleDialog } from '@/components/services/ScheduleDialog';
import type { Service } from '@/components/services/ServiceRow';

interface Slot {
  id: number;
  day: string | null;
  startTime: string | null;
  endTime: string | null;
  status: boolean;
}

interface Row extends Service {
  slots: Slot[];
}

const DAY_SHORT: Record<string, string> = {
  Saturday: 'Sat',
  Sunday: 'Sun',
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
};

function asArray(value: unknown): Service[] {
  if (Array.isArray(value)) return value as Service[];
  if (value && typeof value === 'object') {
    const wrapped = (value as { items?: unknown; data?: unknown }).items ?? (value as { data?: unknown }).data;
    if (Array.isArray(wrapped)) return wrapped as Service[];
  }
  return [];
}

function flatten(nodes: unknown): Service[] {
  return asArray(nodes).flatMap((n) => [n, ...flatten(n.children)]);
}

export default function AdminSchedulesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [managing, setManaging] = useState<Service | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/v1/admin/services/categories');
      // Only leaf services are bookable, so only they can carry availability.
      const bookable = flatten(response.data).filter((s) => s.level === 2);

      const withSlots = await Promise.all(
        bookable.map(async (s) => {
          try {
            const r = await api.get(`/api/v1/admin/services/${s.id}/schedules`);
            const list = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
            return { ...s, slots: (list as Slot[]) ?? [] };
          } catch {
            return { ...s, slots: [] as Slot[] };
          }
        }),
      );
      setRows(withSlots);
    } catch {
      setError('Could not load service availability.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(term));
  }, [rows, search]);

  const columns: Column<Row>[] = [
    {
      key: 'name',
      header: 'Service',
      cell: (r) => (
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <ShoppingBag className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900">{r.name}</p>
            {r.slug && <p className="truncate font-mono text-xs text-slate-400">{r.slug}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'slots',
      header: 'Availability',
      cell: (r) =>
        r.slots.length === 0 ? (
          <span className="text-xs text-slate-500">Any time — no windows set</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {r.slots.slice(0, 4).map((s) => (
              <Badge key={s.id} variant={s.status ? 'info' : 'default'}>
                {DAY_SHORT[s.day ?? ''] ?? s.day} {s.startTime}–{s.endTime}
              </Badge>
            ))}
            {r.slots.length > 4 && (
              <span className="text-xs text-slate-500">+{r.slots.length - 4} more</span>
            )}
          </div>
        ),
    },
    {
      key: 'active',
      header: 'Active slots',
      align: 'center',
      cell: (r) => (
        <span className="text-sm text-slate-700">
          {r.slots.filter((s) => s.status).length}/{r.slots.length}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (r) => (
        <Button size="sm" variant="outline" onClick={() => setManaging(r)}>
          <CalendarClock /> Manage
        </Button>
      ),
    },
  ];

  const configured = rows.filter((r) => r.slots.length > 0).length;

  return (
    <div className="min-h-screen bg-slate-50/60 p-6">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          title="Availability"
          description="Booking windows per service. A service with no windows can be booked at any time."
        >
          <Button variant="outline" onClick={() => void load()}>
            <RefreshCw /> Refresh
          </Button>
        </PageHeader>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <StatTile icon={ShoppingBag} label="Bookable services" value={rows.length} />
          <StatTile icon={Clock} label="With set windows" value={configured} tone="success" />
          <StatTile
            icon={CalendarX}
            label="Open any time"
            value={rows.length - configured}
            tone="warning"
          />
        </div>

        <ErrorBanner message={error} onDismiss={() => setError('')} />

        <DataTable
          columns={columns}
          rows={visible}
          loading={loading}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search services"
          emptyTitle={search ? 'No services match that search' : 'No bookable services yet'}
          footer={<span className="text-xs text-slate-500">{visible.length} of {rows.length} shown</span>}
        />
      </div>

      <ScheduleDialog
        open={managing !== null}
        onOpenChange={(o) => {
          if (!o) {
            setManaging(null);
            // Slot counts in the table are stale once the dialog edits them.
            void load();
          }
        }}
        service={managing}
      />
    </div>
  );
}
