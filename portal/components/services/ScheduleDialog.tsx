'use client';

import React from 'react';
import { CalendarClock, Check, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import api from '@/lib/api';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/form-bits';
import { Badge } from '@/components/ui/badge';
import { unwrapList } from '@/lib/unwrap';
import type { Service } from './ServiceRow';

/** Local week order — Saturday is the first working day here. */
const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

interface Schedule {
  id: number;
  serviceId: number;
  day: string | null;
  startTime: string | null;
  endTime: string | null;
  status: boolean;
}

const selectClass =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm focus-visible:border-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30';

/**
 * Availability windows for a bookable service. These are the slots the
 * storefront offers at checkout, so a service with none is bookable at any time.
 */
export function ScheduleDialog({
  open,
  onOpenChange,
  service,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
}) {
  const [schedules, setSchedules] = React.useState<Schedule[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [draft, setDraft] = React.useState({ day: 'Saturday', startTime: '09:00', endTime: '18:00' });
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editDraft, setEditDraft] = React.useState({ day: '', startTime: '', endTime: '' });

  const load = React.useCallback(async (serviceId: number) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/api/v1/admin/services/${serviceId}/schedules`);
      setSchedules(unwrapList<Schedule>(response.data));
    } catch {
      setError('Could not load the schedule.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (open && service) {
      setEditingId(null);
      setDraft({ day: 'Saturday', startTime: '09:00', endTime: '18:00' });
      void load(service.id);
    }
  }, [open, service, load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;
    if (draft.endTime <= draft.startTime) {
      setError('The end time must be after the start time.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.post(`/api/v1/admin/services/${service.id}/schedules`, { ...draft, status: true });
      await load(service.id);
    } catch {
      setError('Could not add the slot.');
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (s: Schedule) => {
    setEditingId(s.id);
    setEditDraft({
      day: s.day ?? 'Saturday',
      startTime: s.startTime ?? '09:00',
      endTime: s.endTime ?? '18:00',
    });
  };

  const commitEdit = async (s: Schedule) => {
    if (!service) return;
    if (editDraft.endTime <= editDraft.startTime) {
      setError('The end time must be after the start time.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.put(`/api/v1/admin/services/schedules/${s.id}`, { ...editDraft, status: s.status });
      setEditingId(null);
      await load(service.id);
    } catch {
      setError('Could not update the slot.');
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (s: Schedule) => {
    if (!service) return;
    setBusy(true);
    try {
      await api.put(`/api/v1/admin/services/schedules/${s.id}`, {
        day: s.day,
        startTime: s.startTime,
        endTime: s.endTime,
        status: !s.status,
      });
      await load(service.id);
    } catch {
      setError('Could not change the slot status.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (s: Schedule) => {
    if (!service) return;
    if (!confirm(`Remove the ${s.day} ${s.startTime}–${s.endTime} slot?`)) return;
    setBusy(true);
    try {
      await api.delete(`/api/v1/admin/services/schedules/${s.id}`);
      await load(service.id);
    } catch {
      setError('Could not remove the slot.');
    } finally {
      setBusy(false);
    }
  };

  const byDay = DAYS.map((day) => ({ day, slots: schedules.filter((s) => s.day === day) }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Availability — {service?.name}</DialogTitle>
          <DialogDescription>
            Time windows customers can book. With no slots the service is bookable at any time.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-5">
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          {loading ? (
            <p className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
              <Loader2 className="size-4 animate-spin" /> Loading…
            </p>
          ) : schedules.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">
              No availability set — this service can be booked at any time.
            </p>
          ) : (
            <div className="space-y-3">
              {byDay
                .filter((d) => d.slots.length > 0)
                .map(({ day, slots }) => (
                  <div key={day} className="rounded-xl border border-slate-200">
                    <p className="border-b border-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {day}
                    </p>
                    <ul className="divide-y divide-slate-100">
                      {slots.map((s) => (
                        <li key={s.id} className="flex items-center gap-2 px-4 py-2.5">
                          {editingId === s.id ? (
                            <>
                              <select
                                value={editDraft.day}
                                onChange={(e) => setEditDraft({ ...editDraft, day: e.target.value })}
                                className={`${selectClass} h-9 w-36`}
                              >
                                {DAYS.map((d) => (
                                  <option key={d} value={d}>
                                    {d}
                                  </option>
                                ))}
                              </select>
                              <Input
                                type="time"
                                value={editDraft.startTime}
                                onChange={(e) => setEditDraft({ ...editDraft, startTime: e.target.value })}
                                className="h-9 w-28"
                              />
                              <Input
                                type="time"
                                value={editDraft.endTime}
                                onChange={(e) => setEditDraft({ ...editDraft, endTime: e.target.value })}
                                className="h-9 w-28"
                              />
                              <Button size="icon" title="Save" disabled={busy} onClick={() => void commitEdit(s)}>
                                {busy ? <Loader2 className="animate-spin" /> : <Check />}
                              </Button>
                              <Button size="icon" variant="ghost" title="Cancel" onClick={() => setEditingId(null)}>
                                <X />
                              </Button>
                            </>
                          ) : (
                            <>
                              <CalendarClock className="size-4 shrink-0 text-slate-400" />
                              <span className="flex-1 text-sm font-medium text-slate-800">
                                {s.startTime} – {s.endTime}
                              </span>
                              <button
                                type="button"
                                onClick={() => void toggle(s)}
                                title={s.status ? 'Disable this slot' : 'Enable this slot'}
                              >
                                <Badge variant={s.status ? 'success' : 'default'}>
                                  {s.status ? 'Active' : 'Off'}
                                </Badge>
                              </button>
                              <Button size="icon" variant="ghost" title="Edit slot" onClick={() => startEdit(s)}>
                                <Pencil />
                              </Button>
                              <Button
                                size="icon"
                                variant="destructiveGhost"
                                title="Remove slot"
                                onClick={() => void remove(s)}
                              >
                                <Trash2 />
                              </Button>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          )}

          <form onSubmit={add} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-800">Add a slot</p>
            <div className="grid gap-3 sm:grid-cols-[1fr_130px_130px_auto] sm:items-end">
              <Field label="Day">
                <select
                  value={draft.day}
                  onChange={(e) => setDraft({ ...draft, day: e.target.value })}
                  className={selectClass}
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="From">
                <Input
                  type="time"
                  value={draft.startTime}
                  onChange={(e) => setDraft({ ...draft, startTime: e.target.value })}
                />
              </Field>
              <Field label="To">
                <Input
                  type="time"
                  value={draft.endTime}
                  onChange={(e) => setDraft({ ...draft, endTime: e.target.value })}
                />
              </Field>
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <Plus />} Add
              </Button>
            </div>
          </form>
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
