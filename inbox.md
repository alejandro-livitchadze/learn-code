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

## 2026-10-02 milestone D5

- Milestone D5 is on main (PR #16, integration verdict APPROVE on 13e0b20, merge commit 7bd1c27; it also carries P8, P8b, D4). What to try by hand: read `research/demand/report-js.md` and `spot-check.md` (compare the 20 listed vacancies with their Djinni text), and run `pnpm install && pnpm --filter @learn-code/web build && pnpm --filter @learn-code/web start`, then open /fullstack/joins-01 and play through the sqlLab step.
- Integration review minors: the e2e still seeds recall, brainPower and matching as completed (remove as widgets land).

## 2026-10-02 sixth run

- F1, F2, F6 merged (PRs #23, #22, #24). Stale remote branches `task/F1`, `task/F2`, `task/F6` need deleting (branch delete returned 403 from this environment).
- F6 minors: `joins-01` title still says "400 rows" (seed gives 320); the 1920 distractor in p2 is weak.
- Decision needed from the author: do recall, brainPower, matching, parsons and firesideChat get tasks, or leave the 3-month scope? Nothing builds them; the sample lesson no longer uses them.
- F1 minor: new lint rules have no `brokenFixtures` entries.

## 2026-10-03

- F3 (PR #26) and F4 (PR #25) merged. Stale remote branches `task/F3` and `task/F4` need deleting (delete failed from this environment).
- Please bump `@playwright/test` to 1.60 or later (outside any task's paths) and then remove the Node 22 install workaround in `.github/workflows/ci.yml`; Playwright 1.56 hung extracting Chromium on Node 26 (cause taken from the worker's report, not verified). Local e2e runs on Node 26 may hit the same hang.
- F3 leftovers: `@electric-sql/pglite` is an unused dependency of `packages/lesson-compiler`; `COMPARE_CASES` fixtures are exported from the sql-engine root; `runPredictSql` does not catch `open()` failures (reported as "verification crashed").
- F4 note: the macOS clause rests on `ControlOrMeta+A` only; nobody ran the suite on macOS.

## 2026-10-03 (second run)

- V1 merged (PR #27). Stale remote branch `task/V1` needs deleting. V4 must remove LEGACY_EXEMPT in `packages/ui/src/codeLint.ts` and the `.legacy-skin` block in `apps/web/app/globals.css`.
- lesson-compiler tests hang locally in the sandbox (PGlite); CI is the only check for them.

- F5 merged (PR #28). Stale remote branches `task/F5` needs deleting. Booleans now print as `t`/`f` (PostgreSQL raw text); tell me if lessons should show true/false.

## 2026-10-03 (third run)

- F7 (PR #29) and C1 (PR #30) merged. Stale remote branches `task/F7` and `task/C1` need deleting (delete failed from this environment).
- Follow-up wanted: extend `roadmapLesson` and `roadmapModule` in `packages/lesson-schema/src/registry.ts` with `misconceptions`, `plannedStepKinds`, `interaction` and `note`, so the C1 roadmap is validated (not covered by any open task).
- F7 minors: a list line right after paragraph text renders as one paragraph; recap and cliffhanger render inline only but lint allows lists and fences there.

## 2026-10-03 (fourth run)

- V2 (PR #31) merged. Stale remote branch `task/V2` needs deleting (delete not possible from this environment).
- V2 minor: `marginItem` in `packages/lesson-compiler/src/tags/kinds.ts` has no explicit `diagram` case or `never` check.
- V3 (PR #33) merged. Stale remote branch `task/V3` needs deleting. V3 minors: duplicate `prefers-reduced-motion` block in `packages/ui/src/ui.css`; no unit tests for ReviewCard, FeedbackBanner, Cliffhanger; no copy length limits on FeedbackBanner and Cliffhanger (V4).
- L1 (PR #32) is waiting for fix round 1: postgresql.org was unreachable from the sandbox, so none of the doc links in `query-order-01` are verified against the pages. Please spot-check them when you can.
- L1 (PR #32) merged. A fix commit (8183533) appeared on `task/L1` from a session other than this run's workers; I reviewed it fresh (APPROVE) before merging. Stale remote branch `task/L1` needs deleting. The postgresql.org links in `query-order-01` are still unverified against the pages; please spot-check them.

## 2026-10-03 (sixth run)

- V4 (PR #34) is open, not yet reviewed. Worker-reported gaps: `LEGACY_EXEMPT` in `packages/ui/src/codeLint.ts` is outside V4's paths (can be set to `[]`; code-lint passes); `apps/web/screenshots/*.png` are stale; `react-dom` is only a devDependency of `packages/widgets` but `chrome.tsx` imports it; no review cards, no `reveal` step, home page shows raw course id "fullstack"; e2e specs edited but not run locally.
- V4 (PR #34) after review round 1: out-of-path follow-ups from the worker: add a `reveal` Markdoc tag in the compiler, a `reviewCards` field on the recap schema, a ui table `DiagramElement`, and a shared DataTable in packages/ui; empty `LEGACY_EXEMPT` in `packages/ui/src/codeLint.ts`. V4's reveal and review cards are approximations built from existing components.
- V4 (PR #34) is `blocked` after 2 fix rounds. Last review (head 269f145) has one blocker: `packages/widgets/src/sql-lab/schema.ts:3-12` and `SqlLab.tsx:389`, the schema panel never shows "pk" (the `is_primary` value from SCHEMA_QUERY is not read as true on PGlite; fix by querying pg_index/pg_constraint or comparing robustly, plus a test running the real query on the seed). Everything else passes; remaining minors come from missing schema fields (see the PR comment). A small fix plus a fresh review would let it merge. L2, P9, M0 and the rest wait on V4.

## 2026-10-03 (seventh run)

- Nothing could run: V4 (PR #34) is blocked and everything else depends on it, except D6, which needs djinni.co (403 from this sandbox's proxy).
- Decision needed: allow a manual third fix round on V4 (small: sqlLab schema panel `pk` marker, `packages/widgets/src/sql-lab/schema.ts:3-12` and `SqlLab.tsx:389`) by resetting V4 to `todo`/`in_progress`, or tell me otherwise. Also allow djinni.co in the environment network policy if D6 should run.
- V4 (PR #34) merged after the author's pk fix dfd027b (reviewed fresh, APPROVE). Stale remote branch `task/V4` needs deleting. Follow-ups: empty `LEGACY_EXEMPT` in `packages/ui/src/codeLint.ts`; add `reveal` tag, recap `reviewCards` field and a table `DiagramElement` to the schema/compiler/ui so A2 and A4 become real content.

## 2026-10-05 (sixteenth run)

- M0 needs module-federation.io (and other official docs) reachable; the sandbox proxy blocks it (npm registry works, npmjs.com 403). Allow the domains or M0 stays stuck; M1 to M5 wait on it.
- L2 (PR #35): no `recall` opener because the widget is not implemented; postgresql.org links unverified again.

## 2026-10-05 (seventeenth run)

- Needs the author: GitHub Actions runs fail within seconds with no steps (since about 04:48 UTC; last green 04:37 UTC). Likely runners, quota or billing. Check the repository's Actions settings and billing. L2 (PR #35) and all further merges wait on green CI.

- L2 (PR #35) merged. Stale remote branch `task/L2` deleted if the push succeeded, otherwise delete it. Flaky e2e: `apps/web/e2e/player.spec.ts:247` (Enter on step 1 did not advance once; passed on re-run). L2 minors are in the PR comment and the backlog note.

## 2026-10-05 (eighteenth run)

- P9 (PR #36) merged. Stale remote branch `task/P9` needs deleting if the delete fails from this environment.

## 2026-10-05 (twentieth run)

- F11 (PR #39) merged; delete stale remote branch `task/F11`. P10 (PR #40) awaits CI and review.

## 2026-10-05 (twenty-first run)

- P10 (PR #40) merged; delete stale remote branch `task/P10`. Minors are in the PR comment; wiring is F13.

## 2026-10-05 (twenty-first run, addendum)

- Decided without the author: P10 is in MILESTONES, but the milestone step was not run when PR #40 merged. I defer it until F13 (wiring `beTheDatabase` into the player and `lesson check`) is merged, because the integration check needs the widget to render end to end. Integration PR #21 stays open.
