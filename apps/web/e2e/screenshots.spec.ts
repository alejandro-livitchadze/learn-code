import { expect, test } from '@playwright/test';

/**
 * Visual review captures (E08 section 8): the catalogue and the sample lesson at 1280 px
 * and 1440 px. Run with `pnpm --filter @learn-code/web screenshots`; the PNGs in
 * `screenshots/` are committed. Skipped in normal e2e runs so CI never rewrites them.
 */
test.skip(!process.env['SCREENSHOTS'], 'set SCREENSHOTS=1 to refresh the committed captures');

const pages = [
  { name: 'catalogue', path: '/dev/widgets' },
  { name: 'lesson', path: '/fullstack/joins-01' },
] as const;

for (const width of [1280, 1440]) {
  for (const { name, path } of pages) {
    test(`${name} at ${width}px`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await expect(page.locator('main').first()).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: `screenshots/${name}-${width}.png`, fullPage: true });
    });
  }
}
