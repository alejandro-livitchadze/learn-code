import { expect, test, type Page } from '@playwright/test';
import { typeSql } from './helpers';

const URL = '/fullstack/joins-01';
const KEY = 'learn-code:v1:progress:fullstack/joins-01';
const BOOT = { timeout: 60_000 };

/** Marks everything before the sqlLab step as answered, so the lesson opens on it. */
async function openSqlStep(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(URL);
  await expect(page.getByTestId('step-heading')).toBeVisible();
  await page.evaluate((key) => {
    const ids = ['p1', 'b1', 'p2', 'f1', 'p3'];
    const results = Object.fromEntries(
      ids.map((id) => [id, { status: 'answered', correct: true, attempts: 1, payload: null }]),
    );
    localStorage.setItem(
      key,
      JSON.stringify({
        state: { lessonId: 'fullstack/joins-01', index: 7, results },
        completed: false,
      }),
    );
  }, KEY);
  await page.reload();
  await expect(page.locator('[data-kind="sqlLab"]')).toBeVisible();
}

const run = (page: Page) => page.getByRole('button', { name: /^Run/ });
const isEngineAsset = (url: string) => /pglite|initdb|\.wasm|\.data($|\?)/i.test(url);

test('pages without SQL steps do not fetch PGlite; the first sqlLab step does', async ({
  page,
}) => {
  const early: string[] = [];
  page.on('request', (r) => {
    if (isEngineAsset(r.url())) early.push(r.url());
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(URL);
  await expect(page.getByTestId('step-heading')).toContainText('step 1 of');
  await page.getByRole('button', { name: 'Continue' }).click(); // predict, still no SQL step
  await page.waitForLoadState('networkidle');
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(early).toEqual([]);

  const late: string[] = [];
  page.on('request', (r) => {
    if (isEngineAsset(r.url())) late.push(r.url());
  });
  await openSqlStep(page);
  await expect.poll(() => late.length, BOOT).toBeGreaterThan(0);
  await expect(page.getByRole('list', { name: 'Tables in the database' })).toBeVisible(BOOT);
});

test('a wrong query shows a difference, a syntax error shows the PostgreSQL message', async ({
  page,
}) => {
  await openSqlStep(page);
  await expect(page.getByRole('list', { name: 'Tables in the database' })).toBeVisible(BOOT);

  await typeSql(page, 'select count(*) as n from orders');
  await run(page).click();
  await expect(page.locator('.ui-feedback[data-correct="false"]')).toContainText('Not quite.');
  await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();

  await typeSql(page, 'selec 1');
  await run(page).click();
  await expect(page.locator('p.sl-error')).toContainText('syntax error');
  await expect(page.locator('.cm-lintRange-error, .cm-lint-marker-error').first()).toBeVisible();
});

test('a runaway query hits the Worker timeout and the next query works', async ({ page }) => {
  test.setTimeout(120_000);
  await openSqlStep(page);
  await expect(page.getByRole('list', { name: 'Tables in the database' })).toBeVisible(BOOT);

  await typeSql(page, 'select count(*) from generate_series(1, 100000000000) a');
  await run(page).click();
  await expect(page.locator('p.sl-error')).toContainText('timed out', { timeout: 60_000 });

  await typeSql(page, 'select count(distinct order_id) as n from items');
  await run(page).click();
  await expect(page.getByText('Your query returns the expected result.')).toBeVisible(BOOT);
});
