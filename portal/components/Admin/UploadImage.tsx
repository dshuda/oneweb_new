'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getAdminToken } from '@/lib/adminAuth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface CdnObject {
  key: string;
  url: string;
  size: number;
}

interface UploadImageProps {
  /** CDN folder to browse and upload into, e.g. "web/service-banners". */
  path: string;
  onSelect: (url: string) => void;
  /** Show a delete control on each image. Off by default — deleting an object
   *  breaks anything still pointing at it. */
  allowDelete?: boolean;
}

/**
 * Browse and upload images on the CDN.
 *
 * Backed by /api/v1/cdn (list) and /api/v1/cdn/upload, so the portal manages
 * the same objects the storefront renders — no hand-pasted URLs.
 */
const UploadImage: React.FC<UploadImageProps> = ({ path, onSelect, allowDelete = false }) => {
  const [images, setImages] = useState<CdnObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const authHeaders = useCallback((): HeadersInit => {
    const token = getAdminToken();
    return token ? { Authorization: `Bearer ${token.trim()}` } : {};
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/cdn?folder=${encodeURIComponent(path)}&take=300`,
        { headers: authHeaders() },
      );
      if (!res.ok) {
        setError(res.status === 401 ? 'Session expired — sign in again.' : `Could not load images (HTTP ${res.status}).`);
        setImages([]);
        return;
      }
      const data = await res.json();
      setImages(data.items ?? []);
    } catch {
      setError('Could not reach the API.');
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [path, authHeaders]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError('');
    try {
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append('file', file);
        body.append('folder', path);
        // Sequential keeps the error message tied to the file that failed.
        // oxlint-disable-next-line no-await-in-loop
        const res = await fetch(`${API_BASE}/api/v1/cdn/upload`, {
          method: 'POST',
          headers: authHeaders(),
          body,
        });
        if (!res.ok) setError(`Upload failed for ${file.name}.`);
      }
      await load();
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`Delete ${key}?

Any service still using it will lose its picture.`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/cdn?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) setError('Delete failed.');
      await load();
    } catch {
      setError('Delete failed.');
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
        >
          {uploading ? 'Uploading…' : 'Upload new'}
        </button>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-xl border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
        >
          Refresh
        </button>
        <span className="text-xs text-gray-500">{path}</span>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => void handleUpload(e.target.files)}
        />
      </div>

      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-500">Loading images…</p>
      ) : images.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">No images in this folder yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {images.map((img) => (
            <div
              key={img.key}
              className="group relative overflow-hidden rounded-xl border border-gray-200 hover:border-orange-400"
            >
              <button type="button" onClick={() => onSelect(img.url)} title={img.key} className="w-full">
                {/* Arbitrary remote CDN URLs — a plain img is correct here. */}
                <img src={img.url} alt={img.key} className="h-24 w-full object-contain bg-gray-50 p-1" />
                <span className="block truncate px-2 py-1 text-[11px] text-gray-600">
                  {img.key.split('/').pop()}
                </span>
              </button>
              {allowDelete && (
                <button
                  type="button"
                  onClick={() => void handleDelete(img.key)}
                  title="Delete from CDN"
                  className="absolute right-1 top-1 rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 opacity-0 shadow group-hover:opacity-100"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UploadImage;
