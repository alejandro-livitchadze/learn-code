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

/** Kinds with no widget yet. Their placeholder is an active step that cannot be completed. */
const UNBUILT_ACTIVE = ['r1', 's1', 'b1', 'm1'] as const;

const kindOf = async (page: Page): Promise<string> =>
  /: (\w+)$/.exec(((await heading(page).textContent()) ?? '').trim())?.[1] ?? '';

/** Gives the real correct answer for the widget on the current step. */
async function answerCurrent(page: Page, kind: string): Promise<void> {
  if (kind === 'predict') {
    await page.getByRole('button', { name: /400/ }).click();
    await expect(page.getByText('Correct', { exact: true })).toBeVisible();
  } else if (kind === 'fillBlanks') {
    await page.getByRole('textbox', { name: /Blank 1 of 1/ }).fill('distinct');
    await page.getByRole('button', { name: 'Check' }).click();
    await expect(page.getByText('All blanks are correct.')).toBeVisible();
  }
}

/** The four unbuilt active steps are marked answered in storage, so the rest is played for real. */
async function seedUnbuilt(page: Page): Promise<void> {
  // Wait for hydration and the first save, or that save could overwrite the seed.
  await expect(heading(page)).toBeVisible();
  await page.evaluate(
    ({ key, ids }) => {
      const results = Object.fromEntries(
        ids.map((id) => [id, { status: 'answered', correct: true, attempts: 1, payload: null }]),
      );
      localStorage.setItem(
        key,
        JSON.stringify({
          state: { lessonId: 'fullstack/joins-01', index: 0, results },
          completed: false,
        }),
      );
    },
    { key: KEY, ids: [...UNBUILT_ACTIVE] },
  );
  await page.reload();
}

async function playToEnd(page: Page): Promise<void> {
  await expect(heading(page)).toBeVisible();
  for (let i = await stepNumber(page); i < TOTAL; i += 1) {
    const kind = await kindOf(page);
    if (kind === 'predict' || kind === 'fillBlanks') {
      await expect(continueBtn(page)).toBeDisabled();
      await answerCurrent(page, kind);
    }
    await continueBtn(page).click();
    await expect(heading(page)).toContainText(`Step ${i + 1} of ${TOTAL}`);
  }
  await page.getByRole('link', { name: 'Finish' }).click();
  await expect(page).toHaveURL('/');
}

for (const width of [1024, 1440]) {
  test(`plays the sample lesson with the real widgets at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(URL);
    await seedUnbuilt(page);
    await playToEnd(page);
    await expect(page.getByText('Completed')).toBeVisible();
  });

  test(`no horizontal page overflow on any step at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(URL);
    await seedUnbuilt(page);
    for (let i = 1; i < TOTAL; i += 1) {
      const kind = await kindOf(page);
      await answerCurrent(page, kind);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `step ${i} (${kind})`).toBeLessThanOrEqual(0);
      await continueBtn(page).click();
      await expect(heading(page)).toContainText(`Step ${i + 1} of ${TOTAL}`);
    }
  });
}

test('a wrong answer does not complete the step; the right one does', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(URL);
  await continueBtn(page).click(); // hook -> predict
  await page.getByRole('button', { name: /100/ }).click();
  await expect(page.getByText('Not quite')).toBeVisible();
  await expect(continueBtn(page)).toBeDisabled();
  await answerCurrent(page, 'predict');
  await expect(continueBtn(page)).toBeEnabled();
});

test('an unbuilt active kind (recall) blocks the lesson with its placeholder', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(URL);
  await continueBtn(page).click(); // hook -> predict
  await answerCurrent(page, 'predict');
  await continueBtn(page).click(); // -> explain
  await continueBtn(page).click(); // -> recall
  await expect(heading(page)).toContainText('Step 4 of');
  await expect(page.getByText('Not built yet')).toBeVisible();
  await expect(continueBtn(page)).toBeDisabled();
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
  await expect(heading(page)).toContainText('Step 3 of');
  await page.reload();
  await expect(heading(page)).toContainText('Step 3 of');
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(heading(page)).toContainText('Step 2 of');
  await expect(page.getByRole('button', { name: /400/ })).toHaveAttribute('data-state', 'correct');
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
