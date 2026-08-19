/**
 * Catalogue view models.
 *
 * The API is the source of truth: names, prices, imagery, ratings and the
 * bookable package ids all come from /api/v1/services. Cards therefore carry a
 * real serviceId/priceId, which is what lets checkout create an order and hand
 * off to the payment gateway.
 */

import {
  getCategories,
  getServiceById,
  getServices,
  type ApiService,
  type ApiServicePrice,
} from './api';
import { asset } from './assets';

export interface CatalogPackage {
  priceId: number;
  name: string;
  price: number;
}

export interface CatalogService {
  serviceId: number;
  title: string;
  slug: string | null;
  image: string;
  price: number;
  priceUnit?: string;
  rating: number;
  reviewCount: number;
  isTrending: boolean;
  /** Level-1 parent, used to group services under the category's filter tabs. */
  parentId: number | null;
  packages: CatalogPackage[];
}

export interface CatalogSubCategory {
  id: number;
  name: string;
  services: CatalogService[];
}

export interface CatalogCategory {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  heroTitle: string | null;
  heroSubtitle: string | null;
  bannerImage: string | null;
  subCategories: { id: number; name: string; bannerImage: string | null }[];
}

/** Shown when neither the service nor its category carries a banner. */
const FALLBACK_IMAGE = '/banner_appliance_repair.png';

function toPackages(prices?: ApiServicePrice[] | null): CatalogPackage[] {
  return (prices ?? [])
    .filter((p) => p.name)
    .map((p) => ({ priceId: p.id, name: p.name as string, price: p.price }));
}

/**
 * Packages by service id.
 *
 * The list endpoint only carries `prices` on newer API builds; older deployments
 * expose them solely via /services/detail. Rather than assume, we fill the gap
 * from the detail endpoint and cache it, so both behave identically.
 */
const packageCache = new Map<number, CatalogPackage[]>();

async function ensurePackages(services: CatalogService[]): Promise<void> {
  const missing = services.filter(
    (s) => s.packages.length === 0 && !packageCache.has(s.serviceId),
  );

  await Promise.all(
    missing.map(async (service) => {
      try {
        const detail = await getServiceById(service.serviceId);
        packageCache.set(service.serviceId, toPackages(detail.prices));
      } catch {
        // No packages available — the service is still bookable at its base
        // price via priceId 0.
        packageCache.set(service.serviceId, []);
      }
    }),
  );

  for (const service of services) {
    if (service.packages.length === 0) {
      service.packages = packageCache.get(service.serviceId) ?? [];
    }
  }
}

export function toCatalogService(
  service: ApiService,
  fallbackImage = FALLBACK_IMAGE,
): CatalogService {
  return {
    serviceId: service.id,
    title: service.name,
    slug: service.slug,
    image: asset(service.bannerImage || fallbackImage),
    price: service.initialPrice,
    priceUnit: service.priceUnit ?? undefined,
    // The API has no reviews table yet; these are presentation values carried
    // through from the design catalogue, so absent means "don't show a score".
    rating: service.rating ?? 0,
    reviewCount: service.reviewCount ?? 0,
    isTrending: service.isTrending,
    parentId: service.parentId,
    packages: toPackages(service.prices),
  };
}

export function toCatalogCategory(category: ApiService): CatalogCategory {
  const children = category.children ?? [];
  return {
    id: category.id,
    name: category.name,
    slug: category.slug ?? String(category.id),
    icon: category.serviceIcon,
    heroTitle: category.heroTitle ?? null,
    heroSubtitle: category.heroSubtitle ?? null,
    // Sub-categories carry the artwork on the deployed server, so it doubles as
    // the fallback banner for services that have none of their own.
    bannerImage:
      category.bannerImage || children.find((c) => c.bannerImage)?.bannerImage || null,
    subCategories: children.map((child) => ({
      id: child.id,
      name: child.name,
      bannerImage: child.bannerImage ?? null,
    })),
  };
}

export async function fetchCategories(
  signal?: AbortSignal,
): Promise<CatalogCategory[]> {
  const categories = await getCategories(signal);
  return categories.map(toCatalogCategory);
}

/** Every bookable service in a category, grouped under its sub-category tabs. */
export async function fetchCategoryServices(
  category: CatalogCategory,
  signal?: AbortSignal,
): Promise<CatalogSubCategory[]> {
  const result = await getServices(
    { categoryId: category.id, pageSize: 200 },
    signal,
  );

  const bannerFor = (parentId: number | null) =>
    category.subCategories.find((s) => s.id === parentId)?.bannerImage ||
    category.bannerImage ||
    FALLBACK_IMAGE;

  const services = result.items.map((item) =>
    toCatalogService(item, bannerFor(item.parentId)),
  );

  // Older API builds omit prices from the list — fetch them before rendering so
  // every card can offer its packages.
  await ensurePackages(services);

  const groups: CatalogSubCategory[] = category.subCategories.map((sub) => ({
    id: sub.id,
    name: sub.name,
    services: services.filter((s) => s.parentId === sub.id),
  }));

  // Services whose parent isn't among the listed sub-categories would otherwise
  // vanish; keep them under the category itself.
  const grouped = new Set(groups.flatMap((g) => g.services.map((s) => s.serviceId)));
  const ungrouped = services.filter((s) => !grouped.has(s.serviceId));
  if (ungrouped.length > 0) {
    groups.push({ id: category.id, name: category.name, services: ungrouped });
  }

  // Drop empty tabs so the UI never shows a sub-category with nothing in it.
  return groups.filter((group) => group.services.length > 0);
}

export async function fetchTrendingServices(
  limit = 5,
  signal?: AbortSignal,
): Promise<CatalogService[]> {
  // The API already sorts trending first.
  const result = await getServices({ pageSize: limit }, signal);
  const services = result.items.map((item) => toCatalogService(item));
  await ensurePackages(services);
  return services;
}

/** "02:30 PM" -> "14:30:00" (the TimeSpan format the orders API expects). */
export function toApiTime(display: string): string {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(display.trim());
  if (!match) return '09:00:00';

  const [, rawHour, minutes, meridiem] = match;
  let hour = Number(rawHour) % 12;
  if (meridiem.toUpperCase() === 'PM') hour += 12;

  return `${String(hour).padStart(2, '0')}:${minutes}:00`;
}
