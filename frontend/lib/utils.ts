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
