import { expect, test } from '@playwright/test';

/**
 * End-to-end coverage of the paths that carry money and identity.
 * Runs against BASE_URL, so the same suite works locally and against a deploy.
 */

test.describe('storefront', () => {
  test('renders the catalogue from the API', async ({ page }) => {
    await page.goto('./');
    // Cards only appear once /api/v1/services has responded.
    await expect(page.locator('h3').first()).toBeVisible({ timeout: 30_000 });
    expect(await page.locator('h3').count()).toBeGreaterThan(0);
  });

  test('serves every image it references', async ({ page }) => {
    const failed: string[] = [];
    page.on('response', (r) => {
      if (r.status() >= 400 && /\.(png|jpe?g|svg|webp)$/i.test(r.url())) {
        failed.push(`${r.status()} ${r.url()}`);
      }
    });

    await page.goto('./');
    await page.locator('h3').first().waitFor({ timeout: 30_000 });
    await page.waitForTimeout(3000);

    const broken = await page
      .locator('img')
      .evaluateAll((imgs) =>
        imgs.filter((i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth === 0).length,
      );

    expect(failed, `asset requests failed: ${failed.join(', ')}`).toHaveLength(0);
    expect(broken, 'broken <img> elements').toBe(0);
  });

  test('never advertises the bootstrap test credentials', async ({ page }) => {
    await page.goto('./');
    await page.locator('h3').first().waitFor({ timeout: 30_000 });

    const body = await page.locator('body').innerText();
    expect(body).not.toContain('01708521990');
    expect(body).not.toContain('123456');

    await page.getByRole('button', { name: /^login$/i }).first().click();
    await page.getByText('Enter your contact no.').waitFor({ timeout: 15_000 });

    const drawer = await page.locator('body').innerText();
    expect(drawer, 'login drawer must not leak the master number').not.toContain('01708521990');
    expect(drawer, 'login drawer must not leak the master OTP').not.toContain('123456');
  });

  test('location search offers address suggestions', async ({ page }) => {
    await page.goto('./');
    await page.locator('h3').first().waitFor({ timeout: 30_000 });

    await page.getByRole('button', { name: /Green Road|Select Location/i }).first().click();
    await page.getByPlaceholder('Search area, road or landmark').fill('dhan');

    // Mapbox is debounced by 250ms; allow for network.
    await expect(page.locator('div.max-h-64 button').first()).toBeVisible({ timeout: 15_000 });
  });

  test('rejects an invalid phone number before calling the API', async ({ page }) => {
    await page.goto('./');
    await page.locator('h3').first().waitFor({ timeout: 30_000 });

    await page.getByRole('button', { name: /^login$/i }).first().click();
    await page.getByLabel('Phone number').fill('12345');
    await page.getByRole('button', { name: /Get Verification Code/i }).click();

    await expect(page.getByText(/valid 11-digit number/i)).toBeVisible();
  });
});
