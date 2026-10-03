import { expect, test, type Page } from '@playwright/test';
import { typeSql } from './helpers';

const URL = '/fullstack/joins-01';
const KEY = 'learn-code:v1:progress:fullstack/joins-01';
const TOTAL = 13;

const heading = (page: Page) => page.getByTestId('step-heading');
const continueBtn = (page: Page) => page.getByRole('button', { name: 'Continue' });
/** The predict option whose printed output is exactly `output`. */
const option = (page: Page, output: string) =>
  page
    .locator('.w-options button')
    .filter({ has: page.locator('.w-mono', { hasText: new RegExp(`^${output}$`) }) });

async function stepNumber(page: Page): Promise<number> {
  const text = (await heading(page).textContent()) ?? '';
  return Number(/step (\d+) of/i.exec(text)?.[1]);
}

/** The kind of the widget on screen; a hook step has no widget in the main column. */
const kindOf = async (page: Page): Promise<string> =>
  (await page
    .locator('main [data-kind]')
    .first()
    .getAttribute('data-kind', { timeout: 1000 })
    .catch(() => null)) ?? 'hook';

/** The correct answer of every active step, by 1-based step number. */
const ANSWERS: Readonly<Record<number, string>> = {
  2: '320',
  4: '6400',
  5: 'distinct',
  6: '80',
  7: 'select count(distinct order_id) as n from items',
  9: 'select sum(amount) as revenue from orders',
  10: 'o.id',
  12: '340',
};

/** Gives the real correct answer for the widget on the current step. */
async function answerCurrent(page: Page, kind: string): Promise<void> {
  const answer = ANSWERS[await stepNumber(page)];
  if (answer === undefined) return;
  if (kind === 'predict') {
    await option(page, answer).click();
    await page.getByRole('button', { name: 'Lock in answer' }).click();
    await expect(page.getByText('Correct', { exact: true })).toBeVisible();
  } else if (kind === 'fillBlanks') {
    await page.getByRole('textbox', { name: /Blank 1 of 1/ }).fill(answer);
    await page.getByRole('button', { name: 'Lock in answer' }).click();
    await expect(page.getByText('All blanks are correct.')).toBeVisible();
  } else if (kind === 'sqlLab') {
    await typeSql(page, answer);
    await page.getByRole('button', { name: /Run/ }).click();
    await expect(page.getByText('Your query returns the expected result.')).toBeVisible({
      timeout: 60_000,
    });
  }
}

async function playToEnd(page: Page): Promise<void> {
  await expect(heading(page)).toBeVisible();
  for (let i = await stepNumber(page); i < TOTAL; i += 1) {
    const kind = await kindOf(page);
    if (ANSWERS[i] !== undefined) {
      await expect(continueBtn(page)).toBeDisabled();
      await answerCurrent(page, kind);
    }
    await continueBtn(page).click();
    await expect(heading(page)).toContainText(`step ${i + 1} of ${TOTAL}`);
  }
  await page.getByRole('link', { name: 'Finish' }).click();
  await expect(page).toHaveURL('/');
}

for (const width of [1024, 1440]) {
  test(`plays the sample lesson with the real widgets at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(URL);
    await playToEnd(page);
    await expect(page.getByText('Completed')).toBeVisible();
  });

  test(`no horizontal page overflow on any step at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(URL);
    for (let i = 1; i < TOTAL; i += 1) {
      const kind = await kindOf(page);
      await answerCurrent(page, kind);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `step ${i} (${kind})`).toBeLessThanOrEqual(0);
      await continueBtn(page).click();
      await expect(heading(page)).toContainText(`step ${i + 1} of ${TOTAL}`);
    }
  });
}

test('a wrong answer does not complete the step; the right one does', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(URL);
  await continueBtn(page).click(); // hook -> predict
  await option(page, '100').click();
  await page.getByRole('button', { name: 'Lock in answer' }).click();
  await expect(page.locator('.ui-feedback[data-correct="false"]')).toContainText('Not quite.');
  await expect(page.locator('.w-opt[data-state="wrong"]')).toHaveCount(1);
  await expect(continueBtn(page)).toBeDisabled();
  await answerCurrent(page, 'predict');
  await expect(continueBtn(page)).toBeEnabled();
});

test('every step of the lesson has a real widget, none is a stand-in', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(URL);
  await expect(heading(page)).toBeVisible();
  for (let i = 1; i < TOTAL; i += 1) {
    await expect(page.getByText('coming soon')).toHaveCount(0);
    await answerCurrent(page, await kindOf(page));
    await continueBtn(page).click();
  }
  await expect(page.getByText('coming soon')).toHaveCount(0);
  await expect(heading(page)).toContainText(`step ${TOTAL} of ${TOTAL}`);
});

test('the hook step puts its character and bubble in the left column', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(URL);
  const lead = page.getByRole('complementary', { name: 'Character' });
  await expect(lead.getByRole('img', { name: 'The Bug' })).toBeVisible();
  await expect(lead.locator('.ui-bubble')).not.toBeEmpty();
  await continueBtn(page).click();
  await expect(lead).toHaveCount(0);
});

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
  await answerCurrent(page, 'predict');
  await continueBtn(page).click(); // -> explain
  await expect(heading(page)).toContainText('step 3 of');
  await page.reload();
  await expect(heading(page)).toContainText('step 3 of');
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(heading(page)).toContainText('step 2 of');
  await expect(option(page, '320')).toHaveAttribute('data-state', 'correct');
});

test('an active step cannot be skipped by button, keyboard or URL', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(URL);
  await continueBtn(page).click();
  await expect(heading(page)).toContainText('step 2 of');
  await expect(continueBtn(page)).toBeDisabled();
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowRight');
  await expect(heading(page)).toContainText('step 2 of');
  // URL: query and hash carry no step, and forged stored progress is clamped.
  await page.goto(`${URL}?step=13#13`);
  await expect(heading(page)).toContainText('step 2 of');
  await page.evaluate((key) => {
    localStorage.setItem(
      key,
      JSON.stringify({
        state: { lessonId: 'fullstack/joins-01', index: 12, results: {} },
        completed: false,
      }),
    );
  }, KEY);
  await page.reload();
  await expect(heading(page)).toContainText('step 2 of');
  await expect(continueBtn(page)).toBeDisabled();
});

test('keyboard: arrows and Enter move through passive steps, focus lands on the heading', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(URL);
  await expect(heading(page)).toContainText('step 1 of');
  await page.keyboard.press('Enter');
  await expect(heading(page)).toContainText('step 2 of');
  await expect(heading(page)).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(heading(page)).toContainText('step 1 of');
});

test('corrupted stored data is discarded', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(URL);
  await page.evaluate((key) => localStorage.setItem(key, '{broken'), KEY);
  await page.reload();
  await expect(heading(page)).toContainText('step 1 of');
});
