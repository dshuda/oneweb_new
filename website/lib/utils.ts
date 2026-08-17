import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatReviewCount(count: number): string {
  if (count >= 1000) {
    const k = (count / 1000).toFixed(1).replace(/\.0$/, '')
    return `${k}k`
  }
  return String(count)
}

export function formatDateParts(iso?: string) {
  if (!iso) {
    return { dayShort: '', dayNumber: '', dayFull: '', month: '' }
  }
  try {
    const cleanIso = iso.includes('T') ? iso.split('T')[0] : iso
    const d = new Date(`${cleanIso}T00:00:00`)
    if (isNaN(d.getTime())) {
      const fallback = new Date(iso)
      if (isNaN(fallback.getTime())) {
        return { dayShort: '', dayNumber: '', dayFull: '', month: '' }
      }
      return {
        dayShort: fallback.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: String(fallback.getDate()),
        dayFull: fallback.toLocaleDateString('en-US', { weekday: 'long' }),
        month: fallback.toLocaleDateString('en-US', { month: 'short' }),
      }
    }
    return {
      dayShort: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: String(d.getDate()),
      dayFull: d.toLocaleDateString('en-US', { weekday: 'long' }),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
    }
  } catch {
    return { dayShort: '', dayNumber: '', dayFull: '', month: '' }
  }
}

export function resolveImageUrl(url?: string | null, fallback = '/service-banners/banner_cleaning.png'): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return fallback;
  }
  let clean = url.trim();

  // If full external URL not pointing to our backend hosts, keep it
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    if (!clean.includes('localhost') && !clean.includes('127.0.0.1') && !clean.includes('104.248.232.169')) {
      return clean;
    }
    // Strip our backend host so it routes cleanly through Next.js proxy
    clean = clean.replace(/^https?:\/\/[^\/]+/i, '');
  }

  if (!clean) return fallback;

  // If starts with /api/v1/
  if (clean.startsWith('/api/v1/')) {
    return clean;
  }
  if (clean.startsWith('api/v1/')) {
    return `/${clean}`;
  }

  // If UploadImage
  if (clean.startsWith('/UploadImage/') || clean.startsWith('UploadImage/')) {
    return `/api/v1/UploadImage/${clean.replace(/^\/?UploadImage\//, '')}`;
  }

  // If local static assets in public folder
  if (clean.startsWith('/service-icons/') || clean.startsWith('/service-banners/') || clean.startsWith('/offers/')) {
    return clean;
  }

  // If CDN path
  if (clean.startsWith('web/') || clean.startsWith('cdn/') || clean.startsWith('/cdn/')) {
    const key = clean.replace(/^\/?cdn\//, '');
    return `/api/v1/cdn/file?key=${encodeURIComponent(key)}`;
  }

  if (clean.includes('/')) {
    return clean.startsWith('/') ? clean : `/${clean}`;
  }

  // Single file name
  return `/api/v1/UploadImage/${clean}`;
}
