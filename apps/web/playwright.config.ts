import { defineConfig } from '@playwright/test';

const executablePath = process.env['CHROMIUM_PATH'];

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3100',
    launchOptions: executablePath ? { executablePath } : {},
  },
  webServer: {
    command: 'pnpm exec next start -p 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env['CI'],
  },
});
