import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 120_000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/__fixtures__/**', 'src/cli.ts', 'src/index.ts'],
      thresholds: { 'src/lint/**': { lines: 90, functions: 90, branches: 90, statements: 90 } },
    },
  },
});
