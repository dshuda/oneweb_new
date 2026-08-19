'use client';

import React, { useState } from 'react';
import UploadImage from './UploadImage';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

/**
 * Resolves a stored image value for display.
 *
 * Values arrive in three shapes and all must render:
 *  - a full CDN URL      ("https://…/Onetap/web/x.png")  → use as-is
 *  - a legacy API path   ("/uploads/x.png")              → prefix the API host
 *  - a lucide icon name  ("wind")                        → not an image
 * Blindly prefixing the API base — as the older screens did — corrupts CDN URLs
 * into "http://host/https://cdn/…".
 */
export function mediaUrl(value?: string | null): string {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (!value.startsWith('/')) return value; // icon name, not a path
  return `${API_BASE}${value}`;
}

export function isImageValue(value?: string | null): boolean {
  if (!value) return false;
  return /^https?:\/\//i.test(value) || value.startsWith('/');
}

interface CdnImageFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** CDN folder to browse/upload into, e.g. "web/service-banners". */
  folder: string;
  /** Shown under the field to explain what the image is used for. */
  hint?: string;
}

/**
 * Image picker backed by the CDN: preview, browse existing objects, upload a
 * new one, or paste a URL. Used everywhere an image is configured so every
 * screen behaves the same and every asset lands in the same place.
 */
const CdnImageField: React.FC<CdnImageFieldProps> = ({
  label,
  value,
  onChange,
  folder,
  hint,
}) => {
  const [browsing, setBrowsing] = useState(false);

  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-gray-700 ml-1">{label}</label>

      {isImageValue(value) && (
        <div className="flex items-center gap-3">
          {/* Arbitrary CDN/remote URL — a plain img is correct here. */}
          <img
            src={mediaUrl(value)}
            alt={label}
            className="h-20 w-28 rounded-xl border border-gray-200 bg-gray-50 object-contain p-1"
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-xs font-medium text-red-600 hover:underline"
          >
            Clear
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://cdn…/image.png"
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all text-sm"
        />
        <button
          type="button"
          onClick={() => setBrowsing(true)}
          className="shrink-0 rounded-xl bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-600 hover:bg-orange-100"
        >
          Choose from CDN
        </button>
      </div>

      {hint && <p className="ml-1 text-xs text-gray-500">{hint}</p>}

      {browsing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold">{label}</h3>
              <button
                type="button"
                onClick={() => setBrowsing(false)}
                className="rounded-lg px-3 py-1 text-sm hover:bg-gray-100"
              >
                Close
              </button>
            </div>
            <UploadImage
              path={folder}
              onSelect={(url) => {
                onChange(url);
                setBrowsing(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CdnImageField;
