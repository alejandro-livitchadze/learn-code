# Inbox

## 2026-10-02

- Please delete the stale remote branches `lane/platform`, `lane/demand`, `task/P1`, `task/D1` (PRs #1 and #2 are closed; my branch deletion was denied by the permission classifier).
- Pins: CI uses Node 26 and pnpm 10.28.0 (lane/platform's choice); the old demand lane used pnpm 12.8.1 and Node 24. Tell me if you want different pins.

## 2026-10-02 (second run)

- The root `package.json` has no `demand` script, so `pnpm demand validate` from the brief does not work; the D3 worker used `pnpm --filter ./tools/demand-scanner demand validate`. A root script would fix it (a `root` task); tell me if you want one.
- Stale remote branches still to delete: `lane/platform`, `lane/demand`, `task/P1`, `task/D1`, `task/P2`, `task/D3`.
- Stale branch `task/P3` also needs deleting.
- Stale branch `task/P4` also needs deleting.
- P5 review minors (not blocking): `cli.ts:36` unchecked `(e as Error)`; `verify/node.ts:21` sample child process inherits the full environment (should pass a minimal env); `cli.ts:25` `lesson new` uses a hard-coded relative `content` dir; root `demand` script was added inside P5 although unrelated. Stale branch `task/P5` also needs deleting.

## 2026-10-02 milestone P5

- Milestone P5 is on main (PR #8, integration verdict APPROVE on fc25ac9). What to try by hand: run `pnpm install && pnpm lesson check content` and then `pnpm lesson new <course> <lesson-id>` to scaffold a lesson; open `content/fullstack/joins-01/lesson.mdoc` and try breaking a declared output to see the check fail.
- Integration review minors: `tags/kinds.ts` coverage is 77% (add tests for the remaining tag converters); exclude type-only files from the coverage config.

## 2026-10-02 P6

- P6 review minors (not blocking): `progress.ts:87` has one uncovered branch; `reducer.ts:36` `complete` action does not check the step id (guard it when E03 widgets arrive); Lighthouse was run with the desktop preset only. Playwright e2e is not in CI (needs a `.github/**` and root change, a candidate task). Stale branch `task/P6` also needs deleting.

## 2026-10-02 P7

- P7 review minors (not blocking): `render.test.tsx:9` has an `as` cast; Predict `attempts` counts distinct wrong options only. The wiring and e2e minors are covered by task P7b. Stale branch `task/P7` also needs deleting.
- P7b review minors (not blocking): `e2e/player.spec.ts:71` test name should say four unbuilt steps are storage-seeded; catalogue still imports `fixtures` by relative path (export it from packages/widgets); the full play-through no longer runs at 1280 px; `globals.css:210-240` may hold dead `.code`/`.note` rules. The sample lesson cannot be finished in the UI until recall, sqlLab, brainPower and matching have widgets. Playwright e2e is still not in CI. Stale branch `task/P7b` also needs deleting.

## 2026-10-02 milestone P7

- Milestone P7 is on main (PR #12, integration verdict APPROVE on 530fe77, merge commit d1eadef). What to try by hand: `git checkout main && pnpm install && pnpm --filter @learn-code/web build && pnpm --filter @learn-code/web start`, then open http://localhost:3000/dev/widgets (all seven built widgets in idle, wrong and restored states) and http://localhost:3000/fullstack/joins-01 (the sample lesson; steps 1 to 3 work, step 4 shows "NOT BUILT YET" and blocks, because recall, sqlLab, brainPower and matching have no widgets yet).
- Integration review minors: the sample lesson cannot be finished through the UI until those four widgets exist (the e2e seeds them as answered); check the contrast of the placeholder text once settled.

## 2026-10-02 third run

- D4 merged. Stale branch `task/D4` needs deleting.
- P8 (PR #18) is waiting on a one-line fix round (prettier format); the next run handles it. Suggested follow-up task P8b for the wiring listed in docs/runs.md.

- P8 merged (PR #18). Added backlog task P8b (wiring, lesson check on sql-engine). Stale branch `task/P8` also needs deleting.

## 2026-10-02 fourth run

- P8 merged (PR #18); stale branches `task/P8` and `task/D5` need deleting.
- D5 reports are on develop: `research/demand/report.md`, `report-js.md`, `spot-check.md`. Milestone D5 step follows. Note for the author: Junior-Middle level mapping in the extraction files is inconsistent (some mapped to junior, some to middle); the reports group them, so numbers are unaffected. Possible later D task: add synonyms for frequent unknown terms (n8n, bootstrap, phpunit, drf, maven, typo "posgtess").

## 2026-10-02 fifth run

- P8b merged (PR #20). Review minors (not blocking): CI does not run `next build` or Playwright e2e (candidate `root`/`.github` task); `packages/lesson-compiler/tsconfig.json` `lib` now includes DOM, drop it if not needed. Stale branches `task/P8b` and `task/D5` need deleting.
