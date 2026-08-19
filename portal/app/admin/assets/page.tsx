'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Upload, Trash2, Copy, RefreshCw, Search, FolderOpen } from 'lucide-react';
import { getAdminToken } from '@/lib/adminAuth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface CdnObject {
  key: string;
  url: string;
  size: number;
  lastModified: string | null;
}

/** Folders the storefront and portal actually read from. */
const FOLDERS = [
  { label: 'All', value: '' },
  { label: 'Storefront', value: 'web' },
  { label: 'Service icons', value: 'web/service-icons' },
  { label: 'Service banners', value: 'web/service-banners' },
  { label: 'Portal', value: 'portal' },
  { label: 'Service categories', value: 'Service-category' },
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function isImage(key: string): boolean {
  return /\.(png|jpe?g|svg|webp|gif|avif)$/i.test(key);
}

export default function AssetsPage() {
  const [items, setItems] = useState<CdnObject[]>([]);
  const [folder, setFolder] = useState('');
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const authHeaders = useCallback((): HeadersInit => {
    const token = getAdminToken();
    return token ? { Authorization: `Bearer ${token.trim()}` } : {};
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = folder ? `?folder=${encodeURIComponent(folder)}&take=500` : '?take=500';
      const res = await fetch(`${API_BASE}/api/v1/cdn${query}`, { headers: authHeaders() });
      if (!res.ok) {
        setError(
          res.status === 401
            ? 'Session expired — sign in again.'
            : `Could not load assets (HTTP ${res.status}).`,
        );
        setItems([]);
        return;
      }
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {
      setError('Could not reach the API.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [folder, authHeaders]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const term = filter.trim().toLowerCase();
    return term ? items.filter((i) => i.key.toLowerCase().includes(term)) : items;
  }, [items, filter]);

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setStatus('');
    let ok = 0;
    let failed = 0;

    for (const file of Array.from(files)) {
      const body = new FormData();
      body.append('file', file);
      // Uploading while "All" is selected would land at the bucket root, so
      // default to the storefront folder.
      body.append('folder', folder || 'web');
      try {
        const res = await fetch(`${API_BASE}/api/v1/cdn/upload`, {
          method: 'POST',
          headers: authHeaders(),
          body,
        });
        res.ok ? ok++ : failed++;
      } catch {
        failed++;
      }
    }

    setUploading(false);
    setStatus(`Uploaded ${ok}${failed ? `, ${failed} failed` : ''}.`);
    if (fileInput.current) fileInput.current.value = '';
    void load();
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`Delete ${key}?\n\nAnything still referencing it will break.`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/cdn?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      setStatus(res.ok ? 'Deleted.' : 'Delete failed.');
      void load();
    } catch {
      setStatus('Delete failed.');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CDN Assets</h1>
          <p className="mt-1 text-sm text-gray-500">
            Images served to the storefront and portal from DigitalOcean Spaces.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            <Upload size={16} /> {uploading ? 'Uploading…' : 'Upload'}
          </button>
          <input
            ref={fileInput}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => void handleUpload(e.target.files)}
          />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <FolderOpen size={16} className="text-gray-400" />
          <select
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {FOLDERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by name"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <span className="text-sm text-gray-500">{visible.length} file(s)</span>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {status && (
        <p className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {status}
        </p>
      )}

      {loading ? (
        <p className="py-16 text-center text-sm text-gray-500">Loading assets…</p>
      ) : visible.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-500">No assets in this folder.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visible.map((item) => (
            <div key={item.key} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="flex h-32 items-center justify-center bg-gray-50 p-2">
                {isImage(item.key) ? (
                  // Plain <img>: these are arbitrary CDN URLs, not build-time assets.
                  <img src={item.url} alt={item.key} className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-xs text-gray-400">No preview</span>
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-xs font-medium text-gray-900" title={item.key}>
                  {item.key.split('/').pop()}
                </p>
                <p className="mt-0.5 text-[11px] text-gray-500">{formatSize(item.size)}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => {
                      void navigator.clipboard.writeText(item.url);
                      setStatus('URL copied.');
                    }}
                    className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-200"
                  >
                    <Copy size={12} /> Copy URL
                  </button>
                  <button
                    onClick={() => void handleDelete(item.key)}
                    className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-100"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
