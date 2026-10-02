import { expect, test, type Page } from '@playwright/test';

const calls = (page: Page, id: string) => page.getByTestId(`${id}-calls`);

for (const width of [1024, 1440]) {
  test.describe(`/dev/widgets at ${width}px`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/dev/widgets');
    });

    test('every built widget kind renders and the page does not overflow', async ({ page }) => {
      for (const kind of [
        'hook',
        'explain',
        'recap',
        'cliffhanger',
        'pitfall',
        'predict',
        'fillBlanks',
      ]) {
        await expect(page.locator(`[data-kind="${kind}"]`).first()).toBeVisible();
      }
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test('predict: wrong answer does not complete, correct answer completes once', async ({
      page,
    }) => {
      const entry = page.locator('#predict-idle');
      await entry.getByRole('button', { name: /Ada, 25/ }).click();
      await expect(calls(page, 'predict-idle')).toContainText('onComplete calls: 0');
      await entry.getByRole('button', { name: /^Grace, 40/ }).click();
      await entry.getByRole('button', { name: /^Grace, 40/ }).click();
      await expect(calls(page, 'predict-idle')).toContainText('onComplete calls: 1');
    });

    test('fillBlanks: wrong answer does not complete, correct answer completes once', async ({
      page,
    }) => {
      const entry = page.locator('#fill-idle');
      const blank = entry.getByRole('textbox');
      await blank.fill('inner');
      await entry.getByRole('button', { name: 'Check' }).click();
      await expect(calls(page, 'fill-idle')).toContainText('onComplete calls: 0');
      await blank.fill('LEFT');
      await entry.getByRole('button', { name: 'Check' }).click();
      await expect(calls(page, 'fill-idle')).toContainText('onComplete calls: 1');
      await expect(entry.getByRole('button', { name: 'Check' })).toBeDisabled();
    });

    test('an unbuilt kind shows the placeholder', async ({ page }) => {
      await expect(page.locator('#unbuilt-parsons').getByText('Not built yet')).toBeVisible();
    });
  });
}
