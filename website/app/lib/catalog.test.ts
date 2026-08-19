import { describe, expect, it } from 'vitest';
import { toApiTime, toCatalogCategory, toCatalogService } from './catalog';
import type { ApiService } from './api';

const baseService: ApiService = {
  id: 27,
  name: 'Full Deep Home Cleaning',
  slug: 'full-deep-home-cleaning',
  parentId: 10,
  level: 2,
  serviceIcon: null,
  bannerImage: '/service-banners/banner_cleaning.png',
  initialPrice: 1499,
  isTrending: true,
  status: true,
};

describe('toApiTime', () => {
  // The orders API takes a TimeSpan; the UI shows a 12-hour label.
  it.each([
    ['09:00 AM', '09:00:00'],
    ['12:00 AM', '00:00:00'],
    ['12:30 PM', '12:30:00'],
    ['02:30 PM', '14:30:00'],
    ['11:30 PM', '23:30:00'],
  ])('converts %s to %s', (input, expected) => {
    expect(toApiTime(input)).toBe(expected);
  });

  it('falls back to a safe slot when the label is unparseable', () => {
    expect(toApiTime('not a time')).toBe('09:00:00');
  });
});

describe('toCatalogService', () => {
  it('carries the backend ids that make checkout possible', () => {
    const result = toCatalogService(baseService);
    expect(result.serviceId).toBe(27);
    expect(result.price).toBe(1499);
  });

  it('routes imagery through the asset resolver', () => {
    // Either a CDN URL or a local path — never an empty src.
    expect(toCatalogService(baseService).image).toMatch(/banner_cleaning\.png$/);
  });

  it('uses the supplied fallback when a service has no banner', () => {
    const result = toCatalogService({ ...baseService, bannerImage: null }, '/fallback.png');
    expect(result.image).toContain('fallback.png');
  });

  it('reports no rating rather than zero-star when the API omits it', () => {
    // The card hides the rating block when this is 0.
    expect(toCatalogService(baseService).rating).toBe(0);
  });

  it('maps package prices to bookable priceIds', () => {
    const withPrices = {
      ...baseService,
      prices: [{ id: 25, name: '2 BHK', price: 2199 }],
    };
    expect(toCatalogService(withPrices).packages).toEqual([
      { priceId: 25, name: '2 BHK', price: 2199 },
    ]);
  });
});

describe('toCatalogCategory', () => {
  it('falls back to a child banner when the category has none', () => {
    const category: ApiService = {
      ...baseService,
      id: 1,
      level: 0,
      parentId: null,
      bannerImage: null,
      children: [{ ...baseService, id: 7, level: 1, bannerImage: 'https://cdn/x.png' }],
    };
    expect(toCatalogCategory(category).bannerImage).toBe('https://cdn/x.png');
  });
});
