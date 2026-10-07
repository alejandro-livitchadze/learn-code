import { expect, type Page } from '@playwright/test';

/** Replace the editor text. CodeMirror is a contenteditable, so select all and type. */
export async function typeSql(page: Page, sql: string): Promise<void> {
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(sql);
}

export const heading = (page: Page) => page.getByTestId('step-heading');
export const continueBtn = (page: Page) => page.getByRole('button', { name: 'Continue' });
/** The step is still open: no enabled Continue button (it is disabled or replaced by the step's own action). */
export const expectGated = async (page: Page) => {
  await expect(page.getByRole('button', { name: 'Continue', disabled: false })).toHaveCount(0);
  // The footer still shows its one primary control, and it is disabled.
  await expect(page.locator('footer .ui-btn-primary:disabled')).toHaveCount(1);
};
/** The predict option whose printed output is exactly `output`. */
export const option = (page: Page, output: string) =>
  page
    .locator('.w-options button')
    .filter({ has: page.locator('.w-mono', { hasText: new RegExp(`^${output}$`) }) });
