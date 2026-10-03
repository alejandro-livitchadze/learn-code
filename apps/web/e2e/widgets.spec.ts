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
        'sqlLab',
      ]) {
        await expect(page.locator(`[data-kind="${kind}"]`).first()).toBeVisible();
      }
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test('every UI component has a story, including the characters and margin items', async ({
      page,
    }) => {
      for (const id of [
        'ui-characters',
        'ui-sticky',
        'ui-bubble',
        'ui-gotcha',
        'ui-stop',
        'ui-annotation',
        'ui-feedback',
        'ui-diagram',
        'ui-review',
        'ui-cliffhanger',
        'ui-hints',
        'ui-margin',
      ]) {
        await expect(page.locator(`#${id}`)).toBeVisible();
      }
      for (const name of ['The Bug', 'Olha', 'Mr. Runtime']) {
        await expect(page.locator('#ui-characters').getByRole('img', { name })).toBeVisible();
      }
    });

    test('hint ladder unlocks one hint at a time', async ({ page }) => {
      const ladder = page.locator('#ui-hints');
      await expect(ladder.getByRole('button', { name: 'Show hint 1' })).toBeEnabled();
      await expect(ladder.getByRole('button', { name: /Hint 2 \(locked\)/ })).toBeDisabled();
      await ladder.getByRole('button', { name: 'Show hint 1' }).click();
      await expect(ladder.getByText('Look at the join condition.')).toBeVisible();
      await expect(ladder.getByRole('button', { name: 'Show hint 2' })).toBeEnabled();
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
