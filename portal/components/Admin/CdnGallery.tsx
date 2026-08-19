'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAdminToken } from '@/lib/adminAuth';
import { cn } from '@/lib/cn';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

export interface CdnObject {
  key: string;
  url: string;
  size: number;
}

interface CdnGalleryProps {
  /** CDN folder to browse and upload into, e.g. "web/service-banners". */
  path: string;
  onSelect: (url: string) => void;
  /** Highlight the image currently in use. */
  selectedUrl?: string | null;
  allowDelete?: boolean;
  /** Horizontal filmstrip (default) or a wrapping grid. */
  layout?: 'strip' | 'grid';
}

/**
 * Browse, upload and delete CDN images.
 *
 * The strip layout scrolls horizontally with arrow controls — a wrapping grid
 * inside a dialog pushed the action buttons off-screen once a folder had more
 * than a handful of images.
 */
export default function CdnGallery({
  path,
  onSelect,
  selectedUrl,
  allowDelete = false,
  layout = 'strip',
}: CdnGalleryProps) {
  const [images, setImages] = useState<CdnObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const authHeaders = useCallback((): HeadersInit => {
    const token = getAdminToken();
    return token ? { Authorization: `Bearer ${token.trim()}` } : {};
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/v1/cdn?folder=${encodeURIComponent(path)}&take=300`, {
        headers: authHeaders(),
      });
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

  // Keep the arrow affordances honest as content and scroll position change.
  const syncArrows = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    syncArrows();
    const el = scroller.current;
    if (!el) return;
    const observer = new ResizeObserver(syncArrows);
    observer.observe(el);
    return () => observer.disconnect();
  }, [images, syncArrows]);

  const scrollBy = (direction: -1 | 1) => {
    scroller.current?.scrollBy({ left: direction * 320, behavior: 'smooth' });
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError('');
    try {
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append('file', file);
        body.append('folder', path);
        // Sequential keeps any error tied to the file that caused it.
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
    if (!confirm(`Delete ${key}?\n\nAnything still using this image will lose it.`)) return;
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

  const tile = (img: CdnObject) => {
    const active = selectedUrl === img.url;
    return (
      <div
        key={img.key}
        className={cn(
          'group relative shrink-0 overflow-hidden rounded-xl border bg-white transition-all',
          layout === 'strip' ? 'w-36' : 'w-full',
          active ? 'border-orange-500 ring-2 ring-orange-200' : 'border-slate-200 hover:border-orange-300',
        )}
      >
        <button type="button" onClick={() => onSelect(img.url)} title={img.key} className="block w-full">
          {/* Arbitrary remote CDN URLs — a plain img is correct here. */}
          <img src={img.url} alt={img.key} className="h-24 w-full bg-slate-50 object-contain p-1.5" />
          <span className="block truncate px-2 py-1.5 text-left text-[11px] text-slate-600">
            {img.key.split('/').pop()}
          </span>
        </button>

        {active && (
          <Badge variant="success" className="absolute left-1.5 top-1.5">
            In use
          </Badge>
        )}

        {allowDelete && (
          <button
            type="button"
            onClick={() => void handleDelete(img.key)}
            title="Delete from CDN"
            className="absolute right-1.5 top-1.5 rounded-md bg-white/95 p-1 text-red-600 opacity-0 shadow transition-opacity hover:bg-red-50 group-hover:opacity-100"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={() => fileInput.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
          {uploading ? 'Uploading…' : 'Upload'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => void load()}>
          <RefreshCw /> Refresh
        </Button>
        <Badge variant="outline">{path}</Badge>
        <span className="ml-auto text-xs text-slate-500">{images.length} image(s)</span>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => void handleUpload(e.target.files)}
        />
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
          <Loader2 className="size-4 animate-spin" /> Loading images…
        </p>
      ) : images.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
          No images here yet — upload one to get started.
        </p>
      ) : layout === 'grid' ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">{images.map(tile)}</div>
      ) : (
        <div className="relative">
          <div
            ref={scroller}
            onScroll={syncArrows}
            className="flex gap-3 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:thin]"
          >
            {images.map(tile)}
          </div>

          {canLeft && (
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Scroll left"
              className="absolute -left-3 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md hover:bg-slate-50"
            >
              <ChevronLeft className="size-4" />
            </button>
          )}
          {canRight && (
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Scroll right"
              className="absolute -right-3 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md hover:bg-slate-50"
            >
              <ChevronRight className="size-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
