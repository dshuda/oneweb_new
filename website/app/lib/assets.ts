import manifest from './asset-manifest.json';

/**
 * Resolves a public asset path to its CDN URL.
 *
 * Static files under /public are NOT rewritten by Next's `basePath` when
 * `images.unoptimized` is set — Next emits a plain <img>, so "/logo.svg" stays
 * absolute and 404s once the app is served under a sub-path like /web. Routing
 * every asset through the CDN removes that whole class of problem: the URLs are
 * absolute and independent of where the app is mounted.
 *
 * Falls back to the original path (prefixed with basePath when configured) so
 * local development works without uploading anything.
 */
const CDN_BASE = (process.env.NEXT_PUBLIC_CDN_URL ?? '').replace(/\/+$/, '');
const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/+$/, '');

const MANIFEST = manifest as Record<string, string>;

export function asset(path: string): string {
  if (!path) return path;

  // Already absolute (CDN URL from the API, or an external image).
  if (/^https?:\/\//i.test(path)) return path;

  const key = path.startsWith('/') ? path : `/${path}`;

  const mapped = MANIFEST[key];
  if (mapped) return mapped;

  // Not in the manifest but a CDN is configured — derive the URL by convention
  // so newly added files work before the next upload run.
  if (CDN_BASE) return `${CDN_BASE}${key.replace(/[^A-Za-z0-9._/-]/g, '-')}`;

  return `${BASE_PATH}${key}`;
}
