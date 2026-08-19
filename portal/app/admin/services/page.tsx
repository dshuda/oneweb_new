'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ChevronRight, FolderTree, Layers, Loader2, Plus, Search, ShoppingBag } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { PriceItem, Service } from '@/components/services/ServiceRow';
import {
  ServiceFormDialog,
  emptyService,
  type ServiceFormValues,
} from '@/components/services/ServiceFormDialog';
import { PricingDialog } from '@/components/services/PricingDialog';
import { ScheduleDialog } from '@/components/services/ScheduleDialog';
import { ServiceImagePicker, ServiceThumb } from '@/components/services/ServiceImagePicker';
import { ServiceExplorer } from '@/components/services/ServiceExplorer';

/**
 * Flatten the tree so counts and search can look at every node.
 * Defensive about shape: the API has returned both an array and a wrapper
 * object across versions, and a non-array here crashes the whole page.
 */
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

/** Keep a branch if it matches, or if any descendant does. */
function filterTree(nodes: unknown, term: string): Service[] {
  const list = asArray(nodes);
  if (!term) return list;
  const needle = term.toLowerCase();
  const kept: Service[] = [];
  for (const node of list) {
    const children = filterTree(node.children, term);
    const hit =
      node.name.toLowerCase().includes(needle) || (node.slug ?? '').toLowerCase().includes(needle);
    if (hit || children.length > 0) kept.push({ ...node, children });
  }
  return kept;
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Layers;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <span className="flex size-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-xl font-bold leading-tight text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [parent, setParent] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceFormValues>(emptyService());
  const [saving, setSaving] = useState(false);

  const [pricingFor, setPricingFor] = useState<Service | null>(null);
  const [scheduleFor, setScheduleFor] = useState<Service | null>(null);
  const [pricingBusy, setPricingBusy] = useState(false);
  const [imageFor, setImageFor] = useState<Service | null>(null);
  const [exploring, setExploring] = useState<Service | null>(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/v1/admin/services/categories');
      setServices(asArray(response.data));
    } catch {
      setError('Could not load the service tree. Check that the API is reachable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchServices();
  }, [fetchServices]);

  const all = useMemo(() => flatten(services), [services]);
  const visible = useMemo(() => filterTree(services, search.trim()), [services, search]);

  // Searching should reveal matches rather than hide them behind collapsed rows.
  useEffect(() => {
    if (!search.trim()) return;
    const open: Record<number, boolean> = {};
    for (const node of flatten(visible)) open[node.id] = true;
    setExpanded(open);
  }, [search, visible]);

  const toggle = (id: number) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const openCreate = (parentNode: Service | null) => {
    setEditing(null);
    setParent(parentNode);
    setForm(emptyService(parentNode ? parentNode.level + 1 : 0, parentNode?.id ?? null));
    setFormOpen(true);
  };

  const openEdit = (service: Service) => {
    setEditing(service);
    setParent(all.find((s) => s.id === service.parentId) ?? null);
    setForm({
      name: service.name,
      slug: service.slug ?? '',
      parentId: service.parentId,
      level: service.level,
      bannerImage: service.bannerImage ?? '',
      serviceIcon: service.serviceIcon ?? '',
      initialPrice: service.initialPrice ?? 0,
      priceUnit: (service as { priceUnit?: string }).priceUnit ?? '',
      rating: (service as { rating?: number | null }).rating ?? null,
      reviewCount: (service as { reviewCount?: number | null }).reviewCount ?? null,
      heroTitle: (service as { heroTitle?: string }).heroTitle ?? '',
      heroSubtitle: (service as { heroSubtitle?: string }).heroSubtitle ?? '',
      status: service.status,
    });
    setFormOpen(true);
  };

  const submitForm = async () => {
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/api/v1/admin/services/${editing.id}`, { ...form, id: editing.id });
      } else {
        await api.post('/api/v1/admin/services', form);
      }
      setFormOpen(false);
      await fetchServices();
    } catch {
      setError('Saving failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (service: Service) => {
    const children = service.children?.length ?? 0;
    const warning = children > 0 ? `\n\nIt has ${children} child item(s).` : '';
    if (!confirm(`Delete "${service.name}"?${warning}`)) return;
    try {
      await api.delete(`/api/v1/admin/services/${service.id}`);
      await fetchServices();
    } catch {
      setError('Delete failed.');
    }
  };

  /** Save an image chosen from a row without opening the full form. */
  const applyImage = async (service: Service, url: string) => {
    try {
      const field = service.level === 2 ? 'bannerImage' : 'serviceIcon';
      await api.put(`/api/v1/admin/services/${service.id}`, {
        ...service,
        [field]: url,
        parentId: service.parentId ?? null,
      });
      setImageFor(null);
      await fetchServices();
    } catch {
      setError('Could not update the image.');
    }
  };

  const addPrice = async (name: string, price: number) => {
    if (!pricingFor) return;
    setPricingBusy(true);
    try {
      await api.post('/api/v1/admin/services/add-pricing', {
        serviceId: pricingFor.id,
        name,
        price,
      });
      const fresh = await api.get('/api/v1/admin/services/categories');
      setServices(asArray(fresh.data));
      setPricingFor(flatten(fresh.data).find((s) => s.id === pricingFor.id) ?? null);
    } catch {
      setError('Could not add the package.');
    } finally {
      setPricingBusy(false);
    }
  };

  const editPrice = async (price: PriceItem, name: string, amount: number) => {
    if (!pricingFor) return;
    setPricingBusy(true);
    try {
      await api.put(`/api/v1/admin/services/update-price/${price.id}`, {
        serviceId: pricingFor.id,
        name,
        price: amount,
        status: true,
      });
      const fresh = await api.get('/api/v1/admin/services/categories');
      setServices(asArray(fresh.data));
      setPricingFor(flatten(fresh.data).find((s) => s.id === pricingFor.id) ?? null);
    } catch {
      setError('Could not update the package.');
    } finally {
      setPricingBusy(false);
    }
  };

  const removePrice = async (price: PriceItem) => {
    if (!confirm(`Remove the "${price.name}" package?`)) return;
    setPricingBusy(true);
    try {
      await api.delete(`/api/v1/admin/services/remove-pricing/${price.id}`);
      const fresh = await api.get('/api/v1/admin/services/categories');
      setServices(asArray(fresh.data));
      setPricingFor(flatten(fresh.data).find((s) => s.id === pricingFor?.id) ?? null);
    } catch {
      setError('Could not remove the package.');
    } finally {
      setPricingBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Service architecture</h1>
            <p className="mt-1 text-sm text-slate-500">
              Categories, sub-categories and bookable services — with their imagery and packages.
            </p>
          </div>
          <Button onClick={() => openCreate(null)}>
            <Plus /> New category
          </Button>
        </div>

        {/* At-a-glance counts */}
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard icon={FolderTree} label="Categories" value={all.filter((s) => s.level === 0).length} />
          <StatCard icon={Layers} label="Sub-categories" value={all.filter((s) => s.level === 1).length} />
          <StatCard icon={ShoppingBag} label="Bookable services" value={all.filter((s) => s.level === 2).length} />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError('')} className="text-xs font-semibold underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Tree */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or slug"
                className="pl-9"
              />
            </div>
            <Badge variant="outline">{flatten(visible).length} shown</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setExpanded((prev) =>
                  Object.keys(prev).length ? {} : Object.fromEntries(all.map((s) => [s.id, true])),
                )
              }
            >
              {Object.keys(expanded).length ? 'Collapse all' : 'Expand all'}
            </Button>
          </div>

          {loading ? (
            <p className="flex items-center justify-center gap-2 py-20 text-sm text-slate-500">
              <Loader2 className="size-4 animate-spin" /> Loading services…
            </p>
          ) : visible.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-sm font-medium text-slate-700">
                {search ? 'Nothing matches that search.' : 'No services yet.'}
              </p>
              {!search && (
                <Button className="mt-3" onClick={() => openCreate(null)}>
                  <Plus /> Create the first category
                </Button>
              )}
            </div>
          ) : (
            /* Cards: one per category. Everything else happens in the modal. */
            <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((category) => {
                const subs = Array.isArray(category.children) ? category.children : [];
                const leaves = flatten(subs).filter((n) => n.level === 2).length;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setExploring(category)}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm ring-1 ring-transparent transition-all duration-200 hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg hover:ring-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                  >
                    <div className="relative flex h-32 items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
                      <ServiceThumb
                        src={category.bannerImage || category.serviceIcon}
                        alt={category.name}
                        className="h-full w-full"
                        contain={!category.bannerImage}
                      />
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate font-semibold text-slate-900">{category.name}</h3>
                        {!category.status && <Badge variant="danger">Hidden</Badge>}
                      </div>
                      <p className="mt-0.5 truncate font-mono text-xs text-slate-400">{category.slug}</p>
                      <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Layers className="size-3" /> {subs.length} sub
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <ShoppingBag className="size-3" /> {leaves} services
                        </span>
                        <span className="ml-auto inline-flex items-center gap-0.5 font-semibold text-orange-600 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100">
                          Open <ChevronRight className="size-3" />
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ServiceExplorer
        open={exploring !== null}
        onOpenChange={(open) => !open && setExploring(null)}
        roots={services}
        initial={exploring}
        onEdit={(service) => {
          setExploring(null);
          openEdit(service);
        }}
        onDelete={(service) => {
          setExploring(null);
          void remove(service);
        }}
        onAddChild={(parentNode) => {
          setExploring(null);
          openCreate(parentNode);
        }}
        onPickImage={(service) => {
          setExploring(null);
          setImageFor(service);
        }}
        onManagePricing={(service) => {
          setExploring(null);
          setPricingFor(service);
        }}
        onManageSchedule={(service) => {
          setExploring(null);
          setScheduleFor(service);
        }}
      />

      <ScheduleDialog
        open={scheduleFor !== null}
        onOpenChange={(open) => !open && setScheduleFor(null)}
        service={scheduleFor}
      />

      <ServiceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        values={form}
        onChange={setForm}
        onSubmit={submitForm}
        saving={saving}
        parentName={parent?.name ?? null}
      />

      <PricingDialog
        open={pricingFor !== null}
        onOpenChange={(open) => !open && setPricingFor(null)}
        service={pricingFor}
        onAdd={addPrice}
        onEdit={editPrice}
        onRemove={removePrice}
        busy={pricingBusy}
      />

      {imageFor && (
        <ServiceImagePicker
          open
          onOpenChange={(open) => !open && setImageFor(null)}
          title={`Image — ${imageFor.name}`}
          description="Pick from the CDN library, upload a new image, or paste a URL."
          folder={imageFor.level === 2 ? 'web/service-banners' : 'web/service-icons'}
          value={imageFor.level === 2 ? imageFor.bannerImage ?? '' : imageFor.serviceIcon ?? ''}
          onChange={(url) => void applyImage(imageFor, url)}
        />
      )}
    </div>
  );
}
