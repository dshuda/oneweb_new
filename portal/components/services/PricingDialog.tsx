'use client';

import React from 'react';
import { Check, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
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
import type { PriceItem, Service } from './ServiceRow';

/**
 * Packages for a bookable service. Each variant is a ServicePrice row the
 * storefront offers in its "View packages" drawer, so this is where a service's
 * variance is actually configured.
 */
export function PricingDialog({
  open,
  onOpenChange,
  service,
  onAdd,
  onEdit,
  onRemove,
  busy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  onAdd: (name: string, price: number) => Promise<void> | void;
  onEdit: (price: PriceItem, name: string, amount: number) => Promise<void> | void;
  onRemove: (price: PriceItem) => Promise<void> | void;
  busy: boolean;
}) {
  const [name, setName] = React.useState('');
  const [price, setPrice] = React.useState<number | ''>('');
  const [error, setError] = React.useState('');
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [draft, setDraft] = React.useState({ name: '', price: 0 });

  React.useEffect(() => {
    if (open) {
      setName('');
      setPrice('');
      setError('');
      setEditingId(null);
    }
  }, [open]);

  const startEdit = (p: PriceItem) => {
    setEditingId(p.id);
    setDraft({ name: p.name, price: p.price });
  };

  const commitEdit = async (p: PriceItem) => {
    if (!draft.name.trim() || draft.price <= 0) return setError('Name and a price above zero are required.');
    setError('');
    await onEdit(p, draft.name.trim(), draft.price);
    setEditingId(null);
  };

  const prices = service?.prices ?? [];

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Give the package a name.');
    if (price === '' || Number(price) <= 0) return setError('Set a price above zero.');
    setError('');
    await onAdd(name.trim(), Number(price));
    setName('');
    setPrice('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Packages — {service?.name}</DialogTitle>
          <DialogDescription>
            Variants customers can choose, e.g. 1 BHK / 2 BHK. Without any, the base price is used.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-5">
          {prices.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">
              No packages yet — this service books at ৳{service?.initialPrice?.toLocaleString() ?? 0}.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
              {prices.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                  {editingId === p.id ? (
                    <>
                      <Input
                        value={draft.name}
                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                        className="h-9 flex-1"
                        placeholder="Package name"
                      />
                      <Input
                        type="number"
                        min={0}
                        value={draft.price}
                        onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
                        className="h-9 w-28"
                      />
                      <Button
                        type="button"
                        size="icon"
                        title="Save package"
                        disabled={busy}
                        onClick={() => void commitEdit(p)}
                      >
                        {busy ? <Loader2 className="animate-spin" /> : <Check />}
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        title="Cancel"
                        onClick={() => setEditingId(null)}
                      >
                        <X />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 truncate text-sm font-medium text-slate-800">{p.name}</span>
                      <Badge variant="outline">৳{p.price.toLocaleString()}</Badge>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        title="Edit package"
                        onClick={() => startEdit(p)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="destructiveGhost"
                        title="Remove package"
                        onClick={() => void onRemove(p)}
                      >
                        <Trash2 />
                      </Button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={add} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-800">Add a package</p>
            <div className="grid gap-3 sm:grid-cols-[1fr_160px_auto] sm:items-end">
              <Field label="Name">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="2 BHK" />
              </Field>
              <Field label="Price (৳)">
                <Input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="2199"
                />
              </Field>
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <Plus />} Add
              </Button>
            </div>
            {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
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
