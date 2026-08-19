import { expect, test } from '@playwright/test';

/**
 * Runs against the deployed site rather than a dev server: the location picker
 * depends on NEXT_PUBLIC_MAPBOX_TOKEN being baked into the production bundle,
 * which is exactly the thing that can silently differ between local and prod.
 */
const BASE = process.env.LIVE_BASE_URL ?? 'http://104.248.232.169/web';

test.use({ baseURL: BASE });

test('location search returns results and renders the map', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });

  await page.goto(BASE, { waitUntil: 'load' });

  // Open the location picker in the hero.
  const trigger = page.getByRole('button', { name: /Green Road|Dhaka/i }).first();
  await expect(trigger).toBeVisible({ timeout: 20000 });

  // Target the dropdown's own field by its aria-label — a placeholder match
  // also hits the "Search for Services" box and silently tests the wrong input.
  const input = page.getByLabel('Search location');

  // The button is server-rendered before React attaches its handler, so an
  // early click is a no-op. Retry until the dropdown actually responds.
  await expect(async () => {
    await trigger.click();
    await expect(input).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 30000 });

  // Either search backend is acceptable; assert on what the user actually gets.
  const geocode = page.waitForResponse(
    (r) => /api\.mapbox\.com\/(search|geocoding)/.test(r.url()) && r.status() === 200,
    { timeout: 25000 },
  );
  await input.pressSequentially('dhanmondi', { delay: 60 });
  await geocode;

  // A real suggestion must be offered, not just a successful request.
  await expect(page.getByRole('button', { name: /dhanmondi/i }).first()).toBeVisible({
    timeout: 20000,
  });

  // The static map image must actually load (naturalWidth > 0 proves it rendered).
  const map = page.locator('img[alt*="Map" i]').first();
  await expect(map).toBeVisible({ timeout: 15000 });
  await expect
    .poll(async () => map.evaluate((el: HTMLImageElement) => el.naturalWidth), { timeout: 15000 })
    .toBeGreaterThan(0);

  expect(consoleErrors.join('\n')).not.toMatch(/mapbox|geocod/i);
});
