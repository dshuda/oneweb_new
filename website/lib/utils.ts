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

export function formatDateParts(iso: string) {
  const d = new Date(`${iso}T00:00:00`)
  return {
    dayShort: d.toLocaleDateString('en-US', { weekday: 'short' }),
    dayNumber: d.getDate(),
    dayFull: d.toLocaleDateString('en-US', { weekday: 'long' }),
    month: d.toLocaleDateString('en-US', { month: 'short' }),
  }
}
