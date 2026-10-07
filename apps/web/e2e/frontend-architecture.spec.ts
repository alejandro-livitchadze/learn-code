import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { continueBtn, expectGated, heading, option } from './helpers';

const LESSONS = [
  'need-01',
  'compose-01',
  'host-remote-01',
  'shared-deps-01',
  'contracts-01',
  'routing-01',
  'communication-01',
  'styles-01',
  'deploy-01',
  'performance-01',
] as const;

type Step =
  | { readonly kind: 'passive' }
  | { readonly kind: 'predict'; readonly output: string }
  | { readonly kind: 'fillBlanks'; readonly blanks: readonly string[] };

const STEP_TAG = /^\{% (hook|predict|explain|pitfall|fillBlanks|recap|cliffhanger) (.*?) ?%\}$/;

const attr = (line: string, name: string): string | undefined => {
  const m = new RegExp(`(?:^|\\s)${name}="((?:[^"\\\\]|\\\\.)*)"`).exec(line);
  return m?.[1]?.replace(/\\n/g, '\n').replace(/\\"/g, '"');
};

/** The steps of a lesson in order, with the correct answer of each active one, read from the lesson source. */
function stepsOf(id: string): readonly Step[] {
  const file = resolve(process.cwd(), '../../content/frontend-architecture', id, 'lesson.mdoc');
  const lines = readFileSync(file, 'utf8').split('\n');
  const steps: Step[] = [];
  let open: { kind: 'predict' | 'fillBlanks'; template: string } | undefined;
  let correct: string | undefined;
  const accepted = new Map<string, string>();
  const flush = (): void => {
    if (open?.kind === 'predict') {
      expect(correct, `${id}: predict without a correct option`).toBeDefined();
      steps.push({ kind: 'predict', output: correct ?? '' });
    } else if (open?.kind === 'fillBlanks') {
      const order = [...open.template.matchAll(/___(\w+)___/g)].map((m) => m[1] ?? '');
      steps.push({
        kind: 'fillBlanks',
        blanks: order.map((b) => {
          const value = accepted.get(b);
          expect(value, `${id}: no accepted answer for blank ${b}`).toBeDefined();
          return value ?? '';
        }),
      });
    }
    open = undefined;
    correct = undefined;
    accepted.clear();
  };
  for (const line of lines) {
    const tag = STEP_TAG.exec(line);
    if (tag) {
      flush();
      const kind = tag[1];
      if (kind === 'predict') open = { kind, template: '' };
      else if (kind === 'fillBlanks') open = { kind, template: attr(line, 'template') ?? '' };
      else steps.push({ kind: 'passive' });
      continue;
    }
    if (open?.kind === 'predict' && line.startsWith('{% option ') && /correct=true/.test(line)) {
      correct = attr(line, 'output');
    }
    if (open?.kind === 'fillBlanks' && line.startsWith('{% blank ')) {
      const blankId = /id="([^"]+)"/.exec(line)?.[1];
      const first = /accepted=\["((?:[^"\\]|\\.)*)"/.exec(line)?.[1];
      if (blankId !== undefined && first !== undefined) accepted.set(blankId, first);
    }
  }
  flush();
  return steps;
}

async function answer(page: Page, step: Step): Promise<void> {
  if (step.kind === 'predict') {
    await option(page, step.output.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).click();
    await page.getByRole('button', { name: 'Lock in answer' }).click();
    await expect(page.getByText('Correct', { exact: true })).toBeVisible();
  } else if (step.kind === 'fillBlanks') {
    for (const [i, value] of step.blanks.entries()) {
      await page
        .getByRole('textbox', { name: `Blank ${i + 1} of ${step.blanks.length}` })
        .fill(value);
    }
    await page.getByRole('button', { name: 'Lock in answer' }).click();
    await expect(page.getByText('All blanks are correct.')).toBeVisible();
  }
}

for (const id of LESSONS) {
  test(`plays frontend-architecture/${id} from step 1 to Completed`, async ({ page }) => {
    const steps = stepsOf(id);
    const total = steps.length;
    expect(total).toBeGreaterThan(1);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`/frontend-architecture/${id}`);
    await expect(heading(page)).toContainText(`step 1 of ${total}`);
    for (const [index, step] of steps.entries()) {
      const n = index + 1;
      await expect(heading(page)).toContainText(`step ${n} of ${total}`);
      await expect(page.getByText('coming soon')).toHaveCount(0);
      if (step.kind !== 'passive') {
        await expectGated(page);
        await answer(page, step);
      }
      if (n < total) await continueBtn(page).click();
    }
    await expect(page.getByText('coming soon')).toHaveCount(0);
    // The home page shows the lesson as Completed once every step has a result.
    await page.goto('/');
    const entry = page
      .locator('li')
      .filter({ has: page.locator(`a[href="/frontend-architecture/${id}"]`) });
    await expect(entry.getByText('Completed', { exact: true })).toBeVisible();
  });
}
