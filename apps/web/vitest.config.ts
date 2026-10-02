import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/player/reducer.ts', 'src/player/progress.ts'],
      thresholds: {
        'src/player/reducer.ts': { lines: 100, functions: 100, branches: 100, statements: 100 },
        'src/player/progress.ts': { lines: 90, functions: 90, branches: 85, statements: 90 },
      },
    },
  },
});
