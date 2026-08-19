import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
  {
    variants: {
      variant: {
        default: 'bg-slate-100 text-slate-700',
        success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
        danger: 'bg-red-50 text-red-700 ring-1 ring-red-200',
        info: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
        warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
        outline: 'border border-slate-200 text-slate-600',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
