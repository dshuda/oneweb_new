/**
 * basePath-aware path builder for full-page navigations.
 *
 * Next's router (`router.push`/`replace`) prepends `basePath` automatically,
 * but `window.location.href` does not — assigning "/admin/login" from a portal
 * served at /portal sends the browser to the host root, which nginx routes to
 * a different app entirely (502). Use this wherever a hard navigation is
 * genuinely needed, e.g. clearing all React state after logout.
 */
const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/+$/, '');

export function appPath(path: string): string {
  if (!path) return BASE_PATH || '/';
  if (/^https?:\/\//i.test(path)) return path;
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_PATH}${suffix}`;
}
