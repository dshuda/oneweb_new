'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, ImageIcon, Loader2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/form-bits';
import {
  Dialog, DialogBody, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DataTable, ErrorBanner, PageHeader, StatTile, SuccessBanner, type Column,
} from '@/components/ui/data-table';
import CdnImageField from '@/components/Admin/CdnImageField';
import { unwrapList } from '@/lib/unwrap';

interface Blog {
  id: number;
  title: string;
  slug: string | null;
  image: string | null;
  createdAt: string | null;
}

interface BlogDetail extends Blog {
  content: string | null;
  appContent: string | null;
  metaKeywords: string | null;
  metaDescription: string | null;
  categoryId?: number | null;
}

interface BlogCategory {
  id: number;
  name: string;
  slug: string | null;
}

const EMPTY = {
  id: 0,
  title: '',
  slug: '',
  categoryId: 0,
  content: '',
  image: '',
  metaKeywords: '',
  metaDescription: '',
};

const slugify = (v: string) =>
  v.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const selectClass =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm focus-visible:border-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30';

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingPost, setLoadingPost] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  // Only auto-derive the slug for new posts — changing a live slug breaks links.
  const [slugLocked, setSlugLocked] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/v1/blogs');
      setBlogs(unwrapList<Blog>(response.data));
    } catch {
      setError('Could not load blog posts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    api
      .get('/api/v1/blogs/categories')
      .then((r) => setCategories(unwrapList<BlogCategory>(r.data)))
      .catch(() => setCategories([]));
  }, [load]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term
      ? blogs.filter((b) =>
          [b.title, b.slug].some((v) => (v ?? '').toLowerCase().includes(term)),
        )
      : blogs;
  }, [blogs, search]);

  const openCreate = () => {
    setForm({ ...EMPTY, categoryId: categories[0]?.id ?? 0 });
    setSlugLocked(false);
    setShowForm(true);
  };

  const openEdit = async (blog: Blog) => {
    setForm({ ...EMPTY, id: blog.id, title: blog.title, slug: blog.slug ?? '' });
    setSlugLocked(true);
    setShowForm(true);
    if (!blog.slug) return;
    // The list is a summary; body and meta only come from the detail endpoint.
    setLoadingPost(true);
    try {
      const response = await api.get(`/api/v1/blogs/${blog.slug}`);
      const d = (response.data?.data ?? response.data) as BlogDetail;
      setForm({
        id: blog.id,
        title: d.title ?? blog.title,
        slug: d.slug ?? blog.slug ?? '',
        categoryId: d.categoryId ?? categories[0]?.id ?? 0,
        content: d.content ?? '',
        image: d.image ?? '',
        metaKeywords: d.metaKeywords ?? '',
        metaDescription: d.metaDescription ?? '',
      });
    } catch {
      setError('Could not load the full post — only the title and slug are shown.');
    } finally {
      setLoadingPost(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = (form.slug || slugify(form.title)).trim();
    if (!slug) {
      setError('A slug is required.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      title: form.title.trim(),
      slug,
      categoryId: form.categoryId || null,
      content: form.content,
      appContent: null,
      image: form.image || null,
      metaKeywords: form.metaKeywords || null,
      metaDescription: form.metaDescription || null,
    };
    try {
      if (form.id > 0) await api.put(`/api/v1/admin/blogs/${form.id}`, payload);
      else await api.post('/api/v1/admin/blogs', payload);
      setStatus(form.id > 0 ? 'Post updated.' : 'Post published.');
      setShowForm(false);
      await load();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Saving the post failed.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (blog: Blog) => {
    if (!confirm(`Delete "${blog.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/v1/admin/blogs/${blog.id}`);
      setStatus('Post deleted.');
      await load();
    } catch {
      setError('Delete failed.');
    }
  };

  const columns: Column<Blog>[] = [
    {
      key: 'title',
      header: 'Post',
      cell: (b) => (
        <div className="flex items-center gap-3">
          {b.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={b.image}
              alt=""
              className="size-10 shrink-0 rounded-lg border border-slate-200 object-cover"
            />
          ) : (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              <ImageIcon className="size-4" />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900">{b.title}</p>
            {b.slug && <p className="truncate font-mono text-xs text-slate-400">/{b.slug}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'image',
      header: 'Cover',
      align: 'center',
      cell: (b) =>
        b.image ? <Badge variant="success">Set</Badge> : <Badge variant="warning">Missing</Badge>,
    },
    {
      key: 'createdAt',
      header: 'Published',
      align: 'right',
      cell: (b) =>
        b.createdAt ? (
          <span className="text-xs text-slate-500">
            {new Date(b.createdAt).toLocaleDateString('en-GB', {
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
      cell: (b) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="icon" variant="ghost" title="Edit post" onClick={() => void openEdit(b)}>
            <Pencil />
          </Button>
          <Button
            size="icon"
            variant="destructiveGhost"
            title="Delete post"
            onClick={() => void remove(b)}
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
        <PageHeader title="Blog" description="Articles published on the storefront.">
          <Button variant="outline" onClick={() => void load()}>
            <RefreshCw /> Refresh
          </Button>
          <Button onClick={openCreate}>
            <Plus /> New post
          </Button>
        </PageHeader>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <StatTile icon={FileText} label="Total posts" value={blogs.length} />
          <StatTile
            icon={ImageIcon}
            label="With a cover image"
            value={blogs.filter((b) => b.image).length}
            tone="success"
          />
          <StatTile icon={FileText} label="Categories" value={categories.length} />
        </div>

        <ErrorBanner message={error} onDismiss={() => setError('')} />
        <SuccessBanner message={status} />

        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search posts by title or slug"
          emptyTitle={search ? 'No posts match that search' : 'No blog posts yet'}
          emptyAction={
            !search ? (
              <Button onClick={openCreate}>
                <Plus /> Write the first post
              </Button>
            ) : undefined
          }
          footer={<span className="text-xs text-slate-500">{rows.length} of {blogs.length} shown</span>}
        />
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent size="xl">
          <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
            <DialogHeader>
              <DialogTitle>{form.id ? 'Edit post' : 'New post'}</DialogTitle>
              <DialogDescription>
                Published straight to the storefront blog once saved.
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="space-y-4">
              {loadingPost && (
                <p className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="size-4 animate-spin" /> Loading the full post…
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                <Field label="Title" required>
                  <Input
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        title: e.target.value,
                        slug: slugLocked ? f.slug : slugify(e.target.value),
                      }))
                    }
                    placeholder="Top 5 AC maintenance tips"
                  />
                </Field>
                <Field label="Category">
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}
                    className={selectClass}
                  >
                    <option value={0}>Uncategorised</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Slug" required hint="Used in the public URL. Changing it breaks existing links.">
                <Input
                  required
                  value={form.slug}
                  onChange={(e) => {
                    setSlugLocked(true);
                    setForm({ ...form, slug: slugify(e.target.value) });
                  }}
                  className="font-mono"
                  placeholder="ac-maintenance-tips"
                />
              </Field>

              <CdnImageField
                label="Cover image"
                value={form.image}
                onChange={(url) => setForm({ ...form, image: url })}
                folder="web/blog"
                hint="Shown as the article header and in the blog list."
              />

              <Field label="Content" hint="Plain text or HTML — rendered as-is on the storefront.">
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={10}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm shadow-sm focus-visible:border-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30"
                  placeholder="Write the article…"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Meta keywords" hint="Comma separated. Optional.">
                  <Input
                    value={form.metaKeywords}
                    onChange={(e) => setForm({ ...form, metaKeywords: e.target.value })}
                    placeholder="ac, maintenance, summer"
                  />
                </Field>
                <Field label="Meta description" hint="Shown in search results. Optional.">
                  <Input
                    value={form.metaDescription}
                    onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                  />
                </Field>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || loadingPost}>
                {saving && <Loader2 className="animate-spin" />}
                {form.id ? 'Save changes' : 'Publish post'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
