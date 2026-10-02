import { expect, test, type Page } from '@playwright/test';

const URL = '/fullstack/joins-01';
const KEY = 'learn-code:v1:progress:fullstack/joins-01';
const TOTAL = 9;

const heading = (page: Page) => page.getByTestId('step-heading');
const continueBtn = (page: Page) => page.getByRole('button', { name: 'Continue' });

async function stepNumber(page: Page): Promise<number> {
  const text = (await heading(page).textContent()) ?? '';
  return Number(/Step (\d+) of/.exec(text)?.[1]);
}

async function playToEnd(page: Page): Promise<void> {
  await expect(heading(page)).toBeVisible();
  for (let i = await stepNumber(page); i < TOTAL; i += 1) {
    const answer = page.getByRole('button', { name: 'Mark as answered' });
    if (await answer.isVisible()) await answer.click();
    await continueBtn(page).click();
    await expect(heading(page)).toContainText(`Step ${i + 1} of ${TOTAL}`);
  }
  await page.getByRole('link', { name: 'Finish' }).click();
  await expect(page).toHaveURL('/');
}

for (const width of [1024, 1280, 1440]) {
  test(`plays the sample lesson to the end at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(URL);
    await playToEnd(page);
    await expect(page.getByText('Completed')).toBeVisible();
  });
}

test('shows a notice instead of the player below 1024px', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 900 });
  await page.goto(URL);
  await expect(page.getByRole('note')).toBeVisible();
  await expect(page.getByRole('main')).toBeHidden();
});

test('reload restores the step and earlier answers', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(URL);
  await continueBtn(page).click(); // hook -> predict
  await page.getByRole('button', { name: 'Mark as answered' }).click();
  await continueBtn(page).click(); // -> explain
  await expect(heading(page)).toContainText('Step 3 of');
  await page.reload();
  await expect(heading(page)).toContainText('Step 3 of');
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(heading(page)).toContainText('Step 2 of');
  await expect(page.getByRole('status').filter({ hasText: 'Answered.' })).toBeVisible();
});

test('an active step cannot be skipped by button, keyboard or URL', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(URL);
  await continueBtn(page).click();
  await expect(heading(page)).toContainText('Step 2 of');
  await expect(continueBtn(page)).toBeDisabled();
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowRight');
  await expect(heading(page)).toContainText('Step 2 of');
  // URL: query and hash carry no step, and forged stored progress is clamped.
  await page.goto(`${URL}?step=9#9`);
  await expect(heading(page)).toContainText('Step 2 of');
  await page.evaluate((key) => {
    localStorage.setItem(
      key,
      JSON.stringify({
        state: { lessonId: 'fullstack/joins-01', index: 8, results: {} },
        completed: false,
      }),
    );
  }, KEY);
  await page.reload();
  await expect(heading(page)).toContainText('Step 2 of');
  await expect(continueBtn(page)).toBeDisabled();
});

test('keyboard: arrows and Enter move through passive steps, focus lands on the heading', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(URL);
  await expect(heading(page)).toContainText('Step 1 of');
  await page.keyboard.press('Enter');
  await expect(heading(page)).toContainText('Step 2 of');
  await expect(heading(page)).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(heading(page)).toContainText('Step 1 of');
});

test('corrupted stored data is discarded', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(URL);
  await page.evaluate((key) => localStorage.setItem(key, '{broken'), KEY);
  await page.reload();
  await expect(heading(page)).toContainText('Step 1 of');
});
