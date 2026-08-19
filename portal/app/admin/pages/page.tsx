'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, FileText, Globe, Loader2, Pencil, Plus, RefreshCw, Smartphone, Trash2 } from 'lucide-react';
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

interface ContentPage {
  id: number;
  title: string;
  slug: string | null;
  link: string;
  type: string;
  content: string | null;
  status: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  updatedAt: string | null;
}

const EMPTY = {
  id: 0,
  title: '',
  slug: '',
  link: '',
  type: 'web',
  content: '',
  status: true,
  metaTitle: '',
  metaDescription: '',
  metaKeywords: '',
};

const slugify = (v: string) =>
  v.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const selectClass =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm focus-visible:border-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30';

const WEB_BASE =
  typeof window === 'undefined' ? '' : `${window.location.origin}/web`;

export default function AdminPagesPage() {
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  // The link is the key clients fetch by, so never auto-change it on an edit.
  const [linkLocked, setLinkLocked] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/v1/admin/pages');
      setPages(unwrapList<ContentPage>(response.data));
    } catch {
      setError('Could not load content pages.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return pages.filter((p) => {
      const matchesType = typeFilter === 'all' || p.type === typeFilter;
      const matchesTerm =
        !term ||
        [p.title, p.slug, p.link].some((v) => (v ?? '').toLowerCase().includes(term));
      return matchesType && matchesTerm;
    });
  }, [pages, search, typeFilter]);

  const openCreate = () => {
    setForm({ ...EMPTY });
    setLinkLocked(false);
    setShowForm(true);
  };

  const openEdit = (p: ContentPage) => {
    setForm({
      id: p.id,
      title: p.title,
      slug: p.slug ?? '',
      link: p.link,
      type: p.type || 'web',
      content: p.content ?? '',
      status: p.status,
      metaTitle: p.metaTitle ?? '',
      metaDescription: p.metaDescription ?? '',
      metaKeywords: p.metaKeywords ?? '',
    });
    setLinkLocked(true);
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const link = (form.link || slugify(form.title)).trim();
    if (!link) {
      setError('A link key is required.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      title: form.title.trim(),
      slug: form.slug || link,
      link,
      type: form.type,
      content: form.content,
      status: form.status,
      metaTitle: form.metaTitle || null,
      metaDescription: form.metaDescription || null,
      metaKeywords: form.metaKeywords || null,
    };
    try {
      if (form.id > 0) await api.put(`/api/v1/admin/pages/${form.id}`, payload);
      else await api.post('/api/v1/admin/pages', payload);
      setStatus(form.id > 0 ? 'Page updated.' : 'Page created.');
      setShowForm(false);
      await load();
    } catch (err) {
      const conflict = (err as { response?: { status?: number } })?.response?.status === 409;
      setError(conflict ? `The link "${link}" is already used by another page.` : 'Saving the page failed.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: ContentPage) => {
    if (!confirm(`Delete "${p.title}"? The storefront will 404 on /${p.link}.`)) return;
    try {
      await api.delete(`/api/v1/admin/pages/${p.id}`);
      setStatus('Page deleted.');
      await load();
    } catch {
      setError('Delete failed.');
    }
  };

  const columns: Column<ContentPage>[] = [
    {
      key: 'title',
      header: 'Page',
      cell: (p) => (
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            {p.type === 'app' ? <Smartphone className="size-4" /> : <Globe className="size-4" />}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900">{p.title}</p>
            <p className="truncate font-mono text-xs text-slate-400">/{p.link}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Surface',
      cell: (p) => <Badge variant="outline">{p.type === 'app' ? 'Mobile app' : 'Website'}</Badge>,
    },
    {
      key: 'content',
      header: 'Content',
      align: 'center',
      cell: (p) =>
        p.content?.trim() ? (
          <span className="text-xs text-slate-500">{p.content.replace(/<[^>]+>/g, '').length} chars</span>
        ) : (
          <Badge variant="warning">Empty</Badge>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (p) => (
        <Badge variant={p.status ? 'success' : 'default'}>{p.status ? 'Published' : 'Draft'}</Badge>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Updated',
      align: 'right',
      cell: (p) =>
        p.updatedAt ? (
          <span className="text-xs text-slate-500">
            {new Date(p.updatedAt).toLocaleDateString('en-GB', {
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
      cell: (p) => (
        <div className="flex items-center justify-end gap-1">
          {p.status && p.type === 'web' && (
            <a
              href={`${WEB_BASE}/${p.link}`}
              target="_blank"
              rel="noreferrer"
              title="View on the storefront"
              className="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <ExternalLink className="size-4" />
            </a>
          )}
          <Button size="icon" variant="ghost" title="Edit page" onClick={() => openEdit(p)}>
            <Pencil />
          </Button>
          <Button size="icon" variant="destructiveGhost" title="Delete page" onClick={() => void remove(p)}>
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 p-6">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          title="Content pages"
          description="Terms, privacy, about and any other static copy the storefront and app show."
        >
          <Button variant="outline" onClick={() => void load()}>
            <RefreshCw /> Refresh
          </Button>
          <Button onClick={openCreate}>
            <Plus /> New page
          </Button>
        </PageHeader>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <StatTile icon={FileText} label="Total pages" value={pages.length} />
          <StatTile
            icon={Globe}
            label="Published"
            value={pages.filter((p) => p.status).length}
            tone="success"
          />
          <StatTile
            icon={FileText}
            label="Empty content"
            value={pages.filter((p) => !p.content?.trim()).length}
            tone="warning"
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
          searchPlaceholder="Search by title or link"
          toolbar={
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={selectClass}
            >
              <option value="all">All surfaces</option>
              <option value="web">Website</option>
              <option value="app">Mobile app</option>
            </select>
          }
          emptyTitle={search || typeFilter !== 'all' ? 'No pages match those filters' : 'No content pages yet'}
          emptyAction={
            !search ? (
              <Button onClick={openCreate}>
                <Plus /> Create the first page
              </Button>
            ) : undefined
          }
          footer={<span className="text-xs text-slate-500">{rows.length} of {pages.length} shown</span>}
        />
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent size="xl">
          <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
            <DialogHeader>
              <DialogTitle>{form.id ? 'Edit page' : 'New page'}</DialogTitle>
              <DialogDescription>
                Content is served to the storefront and app by its link key.
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                <Field label="Title" required>
                  <Input
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        title: e.target.value,
                        link: linkLocked ? f.link : slugify(e.target.value),
                        slug: linkLocked ? f.slug : slugify(e.target.value),
                      }))
                    }
                    placeholder="Refund Policy"
                  />
                </Field>
                <Field label="Surface">
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className={selectClass}
                  >
                    <option value="web">Website</option>
                    <option value="app">Mobile app</option>
                  </select>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Link key"
                  required
                  hint="How clients fetch this page. Changing it breaks existing links."
                >
                  <Input
                    required
                    value={form.link}
                    onChange={(e) => {
                      setLinkLocked(true);
                      setForm({ ...form, link: slugify(e.target.value) });
                    }}
                    className="font-mono"
                    placeholder="refund"
                  />
                </Field>
                <Field label="Slug" hint="Public URL segment. Defaults to the link key.">
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                    className="font-mono"
                  />
                </Field>
              </div>

              <Field label="Content" hint="HTML is rendered as-is on the storefront.">
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={12}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm shadow-sm focus-visible:border-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30"
                  placeholder="<p>Write the page content…</p>"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Meta title">
                  <Input
                    value={form.metaTitle}
                    onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                  />
                </Field>
                <Field label="Meta keywords" hint="Comma separated.">
                  <Input
                    value={form.metaKeywords}
                    onChange={(e) => setForm({ ...form, metaKeywords: e.target.value })}
                  />
                </Field>
              </div>

              <Field label="Meta description">
                <Input
                  value={form.metaDescription}
                  onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                />
              </Field>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">Published</p>
                  <p className="text-xs text-slate-500">Drafts are hidden from the public API.</p>
                </div>
                <Switch checked={form.status} onCheckedChange={(v) => setForm({ ...form, status: v })} />
              </div>
            </DialogBody>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="animate-spin" />}
                {form.id ? 'Save changes' : 'Create page'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
