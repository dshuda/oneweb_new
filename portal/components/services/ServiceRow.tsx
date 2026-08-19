'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Layers, Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ServiceThumb } from './ServiceImagePicker';
import { cn } from '@/lib/cn';

export interface PriceItem {
  id: number;
  name: string;
  price: number;
  status?: boolean;
}

export interface Service {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  bannerImage: string;
  serviceIcon?: string | null;
  level: number;
  status: boolean;
  initialPrice: number;
  prices?: PriceItem[];
  children?: Service[];
}

/** Level 0 = category, 1 = sub-category, 2 = bookable service. */
const LEVEL_META: Record<number, { label: string; variant: 'info' | 'warning' | 'success' }> = {
  0: { label: 'Category', variant: 'info' },
  1: { label: 'Sub-category', variant: 'warning' },
  2: { label: 'Service', variant: 'success' },
};

interface ServiceRowProps {
  service: Service;
  depth?: number;
  expanded: Record<number, boolean>;
  onToggle: (id: number) => void;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
  onAddChild: (parent: Service) => void;
  onPickImage: (service: Service) => void;
  onManagePricing: (service: Service) => void;
}

/**
 * One row of the service tree. Recursive: a row renders its own children so
 * the hierarchy reads as a single structure instead of separate tables.
 */
export function ServiceRow({
  service,
  depth = 0,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onAddChild,
  onPickImage,
  onManagePricing,
}: ServiceRowProps) {
  const isOpen = expanded[service.id];
  const children = service.children ?? [];
  const hasChildren = children.length > 0;
  const meta = LEVEL_META[service.level] ?? LEVEL_META[2];
  const priceCount = service.prices?.length ?? 0;

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-3 border-b border-slate-100 px-4 py-3 transition-colors hover:bg-slate-50/80',
          depth > 0 && 'bg-slate-50/40',
        )}
        style={{ paddingLeft: `${depth * 1.75 + 1}rem` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(service.id)}
            aria-label={isOpen ? 'Collapse' : 'Expand'}
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
          >
            {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        ) : (
          <span className="w-6" />
        )}

        <button
          type="button"
          onClick={() => onPickImage(service)}
          title="Change image"
          className="shrink-0 rounded-lg transition-transform hover:scale-105"
        >
          {/* Categories carry an icon, services a banner — show whichever exists. */}
          <ServiceThumb
            src={service.bannerImage || service.serviceIcon}
            alt={service.name}
            className="h-11 w-14"
            contain={!service.bannerImage}
          />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-semibold text-slate-900">{service.name}</span>
            <Badge variant={meta.variant}>{meta.label}</Badge>
            {!service.status && <Badge variant="danger">Hidden</Badge>}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
            <span className="font-mono">{service.slug}</span>
            {service.level === 2 && <span>৳{service.initialPrice.toLocaleString()}</span>}
            {priceCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <Tag className="size-3" /> {priceCount} package{priceCount === 1 ? '' : 's'}
              </span>
            )}
            {hasChildren && (
              <span className="inline-flex items-center gap-1">
                <Layers className="size-3" /> {children.length}
              </span>
            )}
          </div>
        </div>

        {/* Actions stay quiet until the row is hovered or focused. */}
        <div className="flex items-center gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          {service.level < 2 && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              title="Add child"
              onClick={() => onAddChild(service)}
            >
              <Plus />
            </Button>
          )}
          {service.level === 2 && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              title="Packages & pricing"
              onClick={() => onManagePricing(service)}
            >
              <Tag />
            </Button>
          )}
          {service.level === 1 && (
            <Button asChild size="icon" variant="ghost" title="Content">
              <Link href={`services/${service.id}`}>
                <Layers />
              </Link>
            </Button>
          )}
          <Button type="button" size="icon" variant="ghost" title="Edit" onClick={() => onEdit(service)}>
            <Pencil />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="destructiveGhost"
            title="Delete"
            onClick={() => onDelete(service)}
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      {isOpen &&
        children.map((child) => (
          <ServiceRow
            key={child.id}
            service={child}
            depth={depth + 1}
            expanded={expanded}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddChild={onAddChild}
            onPickImage={onPickImage}
            onManagePricing={onManagePricing}
          />
        ))}
    </div>
  );
}
