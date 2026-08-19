'use client';

import React from 'react';
import { ChevronRight, Home, Layers, Pencil, Plus, Tag, Trash2 , CalendarClock} from 'lucide-react';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/form-bits';
import { ServiceThumb } from './ServiceImagePicker';
import type { Service } from './ServiceRow';
import { cn } from '@/lib/cn';

const LEVEL_NAME: Record<number, string> = { 0: 'Category', 1: 'Sub-category', 2: 'Service' };

function childrenOf(node: Service): Service[] {
  return Array.isArray(node.children) ? node.children : [];
}

/**
 * Drill-down explorer for one branch of the tree.
 *
 * Siblings are tabs across the top, children are cards in the body, and a leaf
 * shows its full detail — so navigating the hierarchy never leaves the modal.
 */
export function ServiceExplorer({
  open,
  onOpenChange,
  roots,
  initial,
  onEdit,
  onDelete,
  onAddChild,
  onPickImage,
  onManagePricing,
  onManageSchedule,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Top-level categories — the sibling set for depth 0. */
  roots: Service[];
  initial: Service | null;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
  onAddChild: (parent: Service) => void;
  onPickImage: (service: Service) => void;
  onManagePricing: (service: Service) => void;
  onManageSchedule: (service: Service) => void;
}) {
  // Path from a root down to the node being viewed; last entry is current.
  const [path, setPath] = React.useState<Service[]>([]);

  React.useEffect(() => {
    if (open && initial) setPath([initial]);
  }, [open, initial]);

  const current = path.at(-1) ?? null;
  const parent = path.length > 1 ? path[path.length - 2] : null;
  const siblings = parent ? childrenOf(parent) : roots;
  const kids = current ? childrenOf(current) : [];
  const isLeaf = current?.level === 2 || kids.length === 0;

  if (!current) return null;

  const switchSibling = (id: string) => {
    const next = siblings.find((s) => String(s.id) === id);
    if (next) setPath([...path.slice(0, -1), next]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl">
        <DialogHeader>
          {/* Breadcrumb — click any ancestor to jump back up. */}
          <nav className="mb-2 flex flex-wrap items-center gap-1 text-xs text-slate-500">
            <button
              type="button"
              onClick={() => setPath(path.slice(0, 1))}
              className="inline-flex items-center gap-1 hover:text-slate-800"
            >
              <Home className="size-3" /> All
            </button>
            {path.map((node, i) => (
              <span key={node.id} className="inline-flex items-center gap-1">
                <ChevronRight className="size-3" />
                <button
                  type="button"
                  onClick={() => setPath(path.slice(0, i + 1))}
                  className={cn(
                    'hover:text-slate-800',
                    i === path.length - 1 && 'font-semibold text-slate-800',
                  )}
                >
                  {node.name}
                </button>
              </span>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <ServiceThumb
              src={current.bannerImage || current.serviceIcon}
              alt={current.name}
              className="h-12 w-16"
              contain={!current.bannerImage}
            />
            <div className="min-w-0">
              <DialogTitle className="truncate">{current.name}</DialogTitle>
              <DialogDescription>
                {LEVEL_NAME[current.level] ?? 'Service'} · <span className="font-mono">{current.slug}</span>
              </DialogDescription>
            </div>
            {!current.status && <Badge variant="danger">Hidden</Badge>}
          </div>
        </DialogHeader>

        <DialogBody className="space-y-5">
          {/* Siblings as tabs, so switching between peers is one click. */}
          {siblings.length > 1 && (
            <Tabs value={String(current.id)} onValueChange={switchSibling}>
              <TabsList className="flex w-full flex-wrap justify-start">
                {siblings.map((s) => (
                  <TabsTrigger key={s.id} value={String(s.id)}>
                    {s.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}

          {isLeaf ? (
            /* ---- Leaf: name, price, packages, imagery ---- */
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
                <ServiceThumb
                  src={current.bannerImage || current.serviceIcon}
                  alt={current.name}
                  className="h-32 w-full"
                  contain={!current.bannerImage}
                />
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-slate-500">Name</dt>
                    <dd className="font-semibold text-slate-900">{current.name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Base price</dt>
                    <dd className="font-semibold text-slate-900">
                      ৳{(current.initialPrice ?? 0).toLocaleString()}
                      {(current as { priceUnit?: string }).priceUnit && (
                        <span className="ml-1 text-xs font-normal text-slate-500">
                          {(current as { priceUnit?: string }).priceUnit}
                        </span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Slug</dt>
                    <dd className="font-mono text-xs text-slate-700">{current.slug}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Status</dt>
                    <dd>
                      <Badge variant={current.status ? 'success' : 'danger'}>
                        {current.status ? 'Visible' : 'Hidden'}
                      </Badge>
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-800">Packages</h4>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => onManageSchedule(current)}>
                      <CalendarClock /> Availability
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onManagePricing(current)}>
                      <Tag /> Manage
                    </Button>
                  </div>
                </div>
                {(current.prices ?? []).length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-500">
                    No packages — books at the base price.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                    {(current.prices ?? []).map((p) => (
                      <li key={p.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                        <span className="font-medium text-slate-800">{p.name}</span>
                        <Badge variant="outline">৳{p.price.toLocaleString()}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            /* ---- Branch: children as links ---- */
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-800">
                  {kids.length} {LEVEL_NAME[kids[0]?.level ?? 1]?.toLowerCase()}
                  {kids.length === 1 ? '' : 's'}
                </h4>
                <Button size="sm" variant="outline" onClick={() => onAddChild(current)}>
                  <Plus /> Add
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {kids.map((child) => {
                  const grandKids = childrenOf(child).length;
                  return (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => setPath([...path, child])}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition-all hover:border-orange-300 hover:shadow-sm"
                    >
                      <ServiceThumb
                        src={child.bannerImage || child.serviceIcon}
                        alt={child.name}
                        className="h-11 w-14"
                        contain={!child.bannerImage}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-900">
                          {child.name}
                        </span>
                        <span className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                          {child.level === 2 ? (
                            <>৳{(child.initialPrice ?? 0).toLocaleString()}</>
                          ) : (
                            <>
                              <Layers className="size-3" /> {grandKids}
                            </>
                          )}
                          {!child.status && <Badge variant="danger">Hidden</Badge>}
                        </span>
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-slate-300" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </DialogBody>

        <DialogFooter className="justify-between">
          <Button variant="destructiveGhost" size="sm" onClick={() => onDelete(current)}>
            <Trash2 /> Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onPickImage(current)}>
              Change image
            </Button>
            <Button size="sm" onClick={() => onEdit(current)}>
              <Pencil /> Edit
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
