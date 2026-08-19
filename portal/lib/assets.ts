import manifest from './asset-manifest.json';

/**
 * Resolves a /public asset path to its CDN URL.
 *
 * Next does not apply `basePath` to plain <img>/next-image srcs when
 * `images.unoptimized` is set, so "/img/logo.svg" would 404 once the portal is
 * served under /portal. Serving assets from the CDN sidesteps that entirely.
 *
 * Falls back to the basePath-prefixed local path so `next dev` needs no upload.
 */
const CDN_BASE = (process.env.NEXT_PUBLIC_CDN_PORTAL_URL ?? '').replace(/\/+$/, '');
const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/+$/, '');

const MANIFEST = manifest as Record<string, string>;

export function asset(path: string): string {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;

  const key = path.startsWith('/') ? path : `/${path}`;
  const mapped = MANIFEST[key];
  if (mapped) return mapped;

  if (CDN_BASE) return `${CDN_BASE}${key.replace(/[^A-Za-z0-9._/-]/g, '-')}`;
  return `${BASE_PATH}${key}`;
}
