'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Plus, Edit, Trash2, X, Loader2, Folder, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Field, Switch } from '@/components/ui/form-bits';
import {
  Dialog, DialogBody, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ServiceImageField, ServiceThumb } from '@/components/services/ServiceImagePicker';
import { getAdminToken } from '@/lib/adminAuth';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

/**
 * Categories are level-0 rows in the service tree (/api/v1/admin/services), not
 * a separate resource — the earlier screen called a /categories endpoint that
 * does not exist. Everything the storefront renders for a category is editable
 * here: CDN icon, CDN banner and the hero copy.
 */
interface Category {
  id: number;
  name: string;
  slug: string | null;
  serviceIcon: string | null;
  bannerImage: string | null;
  heroTitle: string | null;
  heroSubtitle: string | null;
  status: boolean;
  children?: Category[] | null;
}

const EMPTY = {
  id: 0,
  name: '',
  slug: '',
  serviceIcon: '',
  bannerImage: '',
  heroTitle: '',
  heroSubtitle: '',
  status: true,
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [slugLocked, setSlugLocked] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });

  const authHeaders = useCallback(
    (json = false): HeadersInit => {
      const token = getAdminToken();
      return {
        ...(json ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token.trim()}` } : {}),
      };
    },
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/v1/services/categories`);
      if (!res.ok) {
        setError(`Could not load categories (HTTP ${res.status}).`);
        return;
      }
      setCategories(await res.json());
    } catch {
      setError('Could not reach the API.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term
      ? categories.filter((c) => c.name.toLowerCase().includes(term))
      : categories;
  }, [categories, search]);

  const openCreate = () => {
    setForm({ ...EMPTY });
    setSlugLocked(false);
    setShowForm(true);
  };

  const openEdit = (c: Category) => {
    setForm({
      id: c.id,
      name: c.name,
      slug: c.slug ?? '',
      serviceIcon: c.serviceIcon ?? '',
      bannerImage: c.bannerImage ?? '',
      heroTitle: c.heroTitle ?? '',
      heroSubtitle: c.heroSubtitle ?? '',
      status: c.status,
    });
    setSlugLocked(true);
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus('');
    setError('');

    const payload = {
      ...form,
      // Level 0 = category; a category has no parent and no own price.
      level: 0,
      parentId: null,
      initialPrice: 0,
      slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    };

    try {
      const editing = form.id > 0;
      const res = await fetch(
        editing ? `${API_BASE}/api/v1/admin/services/${form.id}` : `${API_BASE}/api/v1/admin/services`,
        {
          method: editing ? 'PUT' : 'POST',
          headers: authHeaders(true),
          body: JSON.stringify(editing ? payload : { ...payload, id: undefined }),
        },
      );
      if (!res.ok) {
        setError(`Save failed (HTTP ${res.status}).`);
        return;
      }
      setStatus(editing ? 'Category updated.' : 'Category created.');
      setShowForm(false);
      await load();
    } catch {
      setError('Could not reach the API.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: Category) => {
    if (!confirm(`Delete "${c.name}"?\n\nServices under it will lose their category.`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/services/${c.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      setStatus(res.ok ? 'Category deleted.' : `Delete failed (HTTP ${res.status}).`);
      await load();
    } catch {
      setError('Could not reach the API.');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="mt-1 text-sm text-gray-500">
            Icons, banners and hero copy rendered by the storefront — all served from the CDN.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            <Plus size={16} /> New category
          </button>
        </div>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories"
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm"
        />
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {status && <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{status}</p>}

      {loading ? (
        <p className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin" /> Loading categories…
        </p>
      ) : filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-500">No categories found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <div key={c.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg">
              <div className="relative flex h-32 items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
                {/* Banner if there is one, otherwise the icon, otherwise a mark. */}
                <ServiceThumb
                  src={c.bannerImage || c.serviceIcon}
                  alt={c.name}
                  className="h-full w-full"
                  contain={!c.bannerImage}
                />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <ServiceThumb src={c.serviceIcon} alt="" className="size-8" contain />
                  <h3 className="truncate font-semibold text-slate-900">{c.name}</h3>
                  {!c.status && <Badge variant="danger">Hidden</Badge>}
                </div>
                <p className="mt-1 truncate text-xs text-gray-500">
                  {c.heroTitle || 'No hero title'} · {c.children?.length ?? 0} sub-categories
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => openEdit(c)}
                    className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium hover:bg-gray-200"
                  >
                    <Edit size={12} /> Edit
                  </button>
                  <button
                    onClick={() => void remove(c)}
                    className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={save}
            className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">{form.id ? 'Edit category' : 'New category'}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg p-1 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="ml-1 text-sm font-bold text-gray-700">Name</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((f) => ({
                        ...f,
                        name: val,
                        slug: slugLocked ? f.slug : slugify(val),
                      }));
                    }}
                    placeholder="e.g. AC Servicing"
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                  />
                </div>
                <div>
                  <label className="ml-1 text-sm font-bold text-gray-700">Slug</label>
                  <input
                    value={form.slug}
                    onChange={(e) => {
                      setSlugLocked(true);
                      setForm({ ...form, slug: e.target.value });
                    }}
                    placeholder="auto-generated from name"
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 font-mono text-xs outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                  />
                </div>
              </div>

              <ServiceImageField
                label="Category icon"
                value={form.serviceIcon}
                onChange={(url) => setForm({ ...form, serviceIcon: url })}
                folder="web/service-icons"
                hint="Shown in the storefront category strip."
              />

              <ServiceImageField
                label="Category banner"
                value={form.bannerImage}
                onChange={(url) => setForm({ ...form, bannerImage: url })}
                folder="web/service-banners"
                hint="Hero artwork on the category page."
              />

              <div>
                <label className="ml-1 text-sm font-bold text-gray-700">Hero title</label>
                <input
                  value={form.heroTitle}
                  onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />
              </div>
              <div>
                <label className="ml-1 text-sm font-bold text-gray-700">Hero subtitle</label>
                <textarea
                  rows={2}
                  value={form.heroSubtitle}
                  onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.checked })}
                />
                Visible on the storefront
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save category'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
