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

export function resolveImageUrl(url?: string | null, fallback = '/banner_appliance_repair.png'): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return fallback;
  }
  const clean = url.trim();

  // If already a full HTTP/HTTPS URL
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }

  // If already an API or CDN path
  if (clean.startsWith('/api/v1/')) {
    return clean;
  }
  if (clean.startsWith('api/v1/')) {
    return `/${clean}`;
  }
  if (clean.startsWith('/UploadImage/') || clean.startsWith('UploadImage/')) {
    return `/api/v1/UploadImage/${clean.replace(/^\/?UploadImage\//, '')}`;
  }

  // If public static assets
  if (clean.startsWith('/service-icons/') || clean.startsWith('/service-banners/') || clean.startsWith('/offers/')) {
    return clean;
  }

  // If CDN relative path (e.g. web/service-icons/... or cdn/...)
  if (clean.startsWith('web/') || clean.startsWith('cdn/') || clean.includes('/')) {
    return `/api/v1/cdn/file?key=${encodeURIComponent(clean.replace(/^\/?cdn\//, ''))}`;
  }

  return clean.startsWith('/') ? clean : `/${clean}`;
}
