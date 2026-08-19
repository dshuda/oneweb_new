'use client';

import Image from 'next/image';
import {
  Car,
  Droplets,
  Hammer,
  Home,
  PawPrint,
  Plane,
  Shield,
  Smartphone,
  Sparkles,
  Truck,
  Wind,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { FiGrid } from 'react-icons/fi';
import { asset } from '@/app/lib/assets';

/**
 * A category's icon can arrive in two shapes:
 *  - a path or URL ("/service-icons/icon_cleaning.svg") → render as an image
 *  - a bare lucide name ("wind", "droplets")            → render that glyph
 * Anything unrecognised falls back to a generic grid mark, so a new category
 * added on the backend never renders a broken image.
 */
const LUCIDE_BY_NAME: Record<string, LucideIcon> = {
  car: Car,
  droplets: Droplets,
  hammer: Hammer,
  home: Home,
  'paw-print': PawPrint,
  plane: Plane,
  shield: Shield,
  smartphone: Smartphone,
  sparkles: Sparkles,
  truck: Truck,
  wind: Wind,
  wrench: Wrench,
  zap: Zap,
};

function isImagePath(icon: string): boolean {
  return icon.startsWith('/') || icon.startsWith('http://') || icon.startsWith('https://');
}

export default function CategoryIcon({
  icon,
  name,
  size = 26,
  className = 'h-8 w-8',
}: {
  icon?: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  if (icon && isImagePath(icon)) {
    return (
      <Image
        // Icons seeded as "/service-icons/…" resolve through the CDN manifest.
        src={asset(icon)}
        alt={name}
        width={42}
        height={42}
        className={className}
      />
    );
  }

  const Glyph = icon ? LUCIDE_BY_NAME[icon.toLowerCase()] : undefined;
  if (Glyph) return <Glyph size={size} strokeWidth={1.8} />;

  return <FiGrid size={size} />;
}
