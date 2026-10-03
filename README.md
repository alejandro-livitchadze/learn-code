# learn-code

Interactive course for frontend developers moving to fullstack. See `docs/00-context.md`.

Commands: `pnpm install`, `pnpm typecheck`, `pnpm lint`, `pnpm format`, `pnpm test`. CI uses Node.js 26 (`.nvmrc`).

## End-to-end tests

1. Run `pnpm install`, then `pnpm --filter @learn-code/web build`. The e2e server runs `next start`, so a build must exist first.
2. Install the pinned browser once: `pnpm --filter @learn-code/web exec playwright install chromium`.
3. Run `pnpm --filter @learn-code/web e2e`. The tests use port 3100. Locally, a server already running there is reused; under `CI` it is not.
4. To use another Chromium (offline machine, or a different build), set `CHROMIUM_PATH=/path/to/chromium`.

The suite runs on macOS and Linux; CI runs it on Linux.
