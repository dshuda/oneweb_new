/**
 * Exports the website's presentation catalogue (website/app/data/services.ts)
 * into the flat JSON the API seeder consumes.
 *
 * The website is the design source for names, imagery and prices; the backend
 * is the source of truth at runtime. This script keeps the two in step — rerun
 * it whenever services.ts changes, then restart the API to reseed.
 *
 *   node scripts/export-catalog.mjs
 *
 * Node 24 strips TypeScript types natively, so services.ts is imported as-is.
 * Run from the website directory so lucide-react resolves.
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const dataPath = resolve(repoRoot, 'website/app/data/services.ts');
const outPath = resolve(repoRoot, 'src/OneWeb.Api/Seed/catalog.json');

// Seeded imagery must be CDN URLs: the API stores whatever we emit here, and a
// bare "/service-banners/x.png" resolves against the API host, not the CDN.
const manifestPath = resolve(repoRoot, 'website/app/lib/asset-manifest.json');
const manifest = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, 'utf8'))
  : {};

function cdn(path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  return manifest[path] ?? path;
}

const { categoryDetails, serviceCategories, trendingServices } = await import(
  pathToFileURL(dataPath).href
);

/** "Full Deep Home Cleaning" -> "full-deep-home-cleaning" */
function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Icons live on the home-page category list, keyed by slug.
const iconBySlug = new Map(
  serviceCategories
    .filter((c) => typeof c.icon === 'string')
    .map((c) => [c.slug, c.icon]),
);

// Trending flags come from the home-page list, matched on title.
const trendingTitles = new Set(trendingServices.map((s) => s.title.toLowerCase()));

const seenSlugs = new Set();
/** Slugs must be unique across the whole tree — the DB looks services up by slug. */
function uniqueSlug(base) {
  let slug = base;
  let n = 2;
  while (seenSlugs.has(slug)) slug = `${base}-${n++}`;
  seenSlugs.add(slug);
  return slug;
}

const categories = categoryDetails.map((category) => ({
  name: category.name.trim(),
  slug: uniqueSlug(category.slug),
  level: 0,
  serviceIcon: cdn(iconBySlug.get(category.slug)) ?? null,
  bannerImage: null,
  initialPrice: 0,
  isTrending: false,
  heroTitle: `${category.heroTitle} ${category.heroTitleAccent}`.trim(),
  heroSubtitle: category.heroSubtitle,
  children: category.subCategories.map((sub) => ({
    name: sub.name.trim(),
    slug: uniqueSlug(`${category.slug}-${slugify(sub.name)}`),
    level: 1,
    serviceIcon: null,
    bannerImage: null,
    initialPrice: 0,
    isTrending: false,
    children: sub.services.map((service) => ({
      name: service.title.trim(),
      slug: uniqueSlug(slugify(service.title)),
      level: 2,
      serviceIcon: null,
      bannerImage: cdn(service.image),
      initialPrice: service.price,
      priceUnit: service.priceUnit ?? null,
      rating: service.rating ?? null,
      reviewCount: service.reviewCount ?? null,
      isTrending: trendingTitles.has(service.title.toLowerCase()),
      // subServices become ServicePrice rows; a service with none is booked at
      // its InitialPrice, which the order handler already handles (priceId 0).
      prices: (service.subServices ?? []).map((sub) => ({
        name: sub.name,
        price: sub.price,
      })),
      children: [],
    })),
  })),
}));

const counts = { categories: 0, subCategories: 0, services: 0, prices: 0 };
for (const category of categories) {
  counts.categories += 1;
  for (const sub of category.children) {
    counts.subCategories += 1;
    for (const service of sub.children) {
      counts.services += 1;
      counts.prices += service.prices.length;
    }
  }
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(
  outPath,
  JSON.stringify({ version: 1, categories }, null, 2) + '\n',
  'utf8',
);

console.log(`wrote ${outPath}`);
console.log(
  `  ${counts.categories} categories, ${counts.subCategories} sub-categories, ` +
    `${counts.services} services, ${counts.prices} package prices`,
);
