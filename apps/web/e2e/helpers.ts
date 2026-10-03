import type { Page } from '@playwright/test';

/** Replace the editor text. CodeMirror is a contenteditable, so select all and type. */
export async function typeSql(page: Page, sql: string): Promise<void> {
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(sql);
}
