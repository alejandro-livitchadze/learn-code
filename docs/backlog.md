# Backlog

Status values: `todo`, `in_progress`, `done`, `blocked`. Only the orchestrator edits this file.

`Paths` lists what a task may change. `root` means repository root files: `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `turbo.json`, `tsconfig*.json`, ESLint and Prettier configs and their ignore files, `.nvmrc`, `.gitignore`. Changing dependencies of any package also changes `pnpm-lock.yaml`, so such tasks list `root`.

## F1. Lesson check: playable and solvable
- Status: done
- Note: merged via PR #23; CI green; reviewer APPROVE on e69f87e (minors: LEGACY_LESSONS also downgrades unbuilt-kind for joins-01, removed in F6; new rules lack brokenFixtures entries).
- Depends on: none
- Paths: `packages/lesson-compiler/**`, `packages/lesson-schema/**`, `packages/widgets/src/check.ts`, `packages/widgets/src/registry.tsx`, root
- Source: `docs/audit-2026-10-03.md`, finding 1 (blocker)
- Done when: `lesson check` fails, with file and line, on each of: duplicate step ids; a `fillBlanks` whose template markers and `blanks` ids differ; a `fillBlanks` whose first accepted answers do not pass `checkFillBlanks`; a lesson or step concept id missing from `concepts.json`; a blank misconception id missing from `misconceptions.json`; a step kind not in `IMPLEMENTED_KINDS` (error for content, with a `--allow-unbuilt` flag used only by compiler fixtures); frontmatter `id` or `courseId` different from the folder names; fewer than 12 or more than 20 steps (warning for `joins-01` until F6). One failing fixture per rule; the existing seven fixtures still fail exactly their rule.

## F2. SQL session reset that always works
- Status: done
- Note: merged via PR #22; CI green; reviewer APPROVE on 0890164 (2 minors: re-export of DatabaseFactory in handler.ts, worker test covers two cases).
- Depends on: none
- Paths: `packages/sql-engine/**`
- Source: `docs/audit-2026-10-03.md`, finding 2 (major)
- Done when: `reset()` gives a database identical to a fresh `open(seed)` after each of: an aborted transaction, an open transaction, a changed `search_path`, an extra schema, a changed session setting (close and recreate the database, or `rollback` plus `discard all` plus dropping non-system schemas); a failed reset leaves the session usable on the next call; tests cover each case on the inline adapter and one on the worker adapter.

## F3. One result comparer, one SQL path
- Status: done
- Note: merged via PR #26; CI green; reviewer APPROVE on f71d17f (minors: runPredictSql does not catch open() failure; testTimeout raised to 120s; COMPARE_CASES exported from package root; unused @electric-sql/pglite dep left in lesson-compiler).
- Depends on: none
- Paths: `packages/sql-engine/**`, `packages/widgets/src/sql-lab/**`, `packages/lesson-compiler/**`
- Source: `docs/audit-2026-10-03.md`, finding 3 (major)
- Done when: `compareResults` lives in `packages/sql-engine` (pure, exported) and is the only comparer used by the widget and by `lesson check`; `sameSqlResult`, `sameResult` and `verify/sql.ts` are deleted; predict verification runs through the inline adapter; `lesson check` fails a `sqlLab` whose reference result exceeds the row cap; a test feeds the same pairs to the widget path and the check path.

## F4. Build and e2e in CI, e2e portable
- Status: done
- Note: merged via PR #25; CI green (check and e2e); reviewer APPROVE on b1ce79e (minors: e2e job repeats setup; macOS not run; install runs under Node 22 as a workaround, remove after bumping @playwright/test to 1.60+). README clause done via Paths widening.
- Depends on: none
- Paths: `.github/**`, `apps/web/e2e/**`, `apps/web/playwright.config.ts`, root, `README.md` (e2e section only; added by the orchestrator because the Done-when needs it)
- Source: `docs/audit-2026-10-03.md`, finding 4 (major)
- Done when: CI runs `pnpm --filter @learn-code/web build`, installs the pinned Chromium and runs `pnpm --filter @learn-code/web e2e`, with `timeout-minutes` set on the job; `typeSql` uses `ControlOrMeta+A`; the suite passes on macOS and Linux; README says how to run it.

## F5. Show SQL values as PostgreSQL prints them
- Status: done
- Note: merged via PR #28; CI green; reviewer APPROVE on 9b3dedb (1 fix round: prettier; minor: doc comment wrapping in pglite.ts). Booleans print as `t`/`f`.
- Depends on: none
- Paths: `packages/sql-engine/**`, `packages/lesson-compiler/**`
- Source: `docs/audit-2026-10-03.md`, finding 5 (major)
- Done when: date, timestamp, timestamptz, time, interval, numeric, bigint, boolean, arrays and json come back as PostgreSQL's text output (configure PGlite parsers to return raw text, session time zone fixed to UTC); a test asserts the exact strings for each type and passes under `TZ=Europe/Kyiv` and `TZ=UTC`; a predict fixture with a date output passes with `2024-03-10`.

## F6. Sample lesson: finishable and truthful
- Status: done
- Note: merged via PR #24; CI green; reviewer APPROVE on af651a5 (minors: lesson title still says 400 rows; weak 1920 distractor). The author decision on recall, brainPower, matching, parsons and firesideChat is still open.
- Depends on: none
- Paths: `content/fullstack/joins-01/**`, `apps/web/e2e/**`, `docs/backlog.md` (orchestrator); also `packages/lesson-compiler/src/check.ts` and `packages/lesson-compiler/test/check.test.ts`, `packages/lesson-compiler/test/cli.test.ts` (remove `LEGACY_LESSONS`, fix tests that edit joins-01 by string replacement)
- Source: `docs/audit-2026-10-03.md`, finding 6 (major)
- Done when: `joins-01` uses only kinds in `IMPLEMENTED_KINDS`, includes a `pitfall` and a `cliffhanger`, and has 12 to 20 steps; the seed has orders without items and an `amount` column, and a sample shows the inflated sum; `lesson check` proves `select count(*) from orders` does not match the reference; the prompt names the expected column; the e2e plays the lesson with no `localStorage` seeding. The author decides whether recall, brainPower, matching, parsons and firesideChat get tasks or leave the 3-month scope, and the backlog says so.

## F7. One Markdown contract
- Status: done
- Note: merged via PR #29; CI green; reviewer APPROVE on 413527f (minors: list line right after paragraph text renders as one paragraph; recap and cliffhanger render inline only but lint allows lists and fences; `_italic_` and unmatched `*` not flagged).
- Depends on: none
- Paths: `packages/widgets/src/markdown.tsx`, `packages/widgets/src/*.test.*`, `packages/lesson-compiler/src/lint/**`, `packages/lesson-compiler/test/**`
- Source: `docs/audit-2026-10-03.md`, finding 7 (major)
- Done when: the supported subset is written in the compiler README; the renderer supports links (http and https only, `rel="noreferrer"`), emphasis and fenced code; a lint rule rejects any other construct with file and line; tests cover each supported construct, a `javascript:` link, and one rejected construct.

## F8. Make the specs agree
- Status: todo
- Depends on: none
- Paths: `docs/**`, `CLAUDE.md`, `README.md` (author or orchestrator only)
- Source: `docs/audit-2026-10-03.md`, finding 8 (major)
- Done when: every item listed in audit finding 8 is fixed or deleted; `CLAUDE.md` section 10 has an M5 integration check (the three lessons build, play to the end in the e2e, and every linked source was opened); superseded docs carry a first-line "superseded by" note; README lists the commands for lesson check, build and e2e.

## R0. Recovery and migration
- Status: done
- Depends on: none
- Paths: everything (orchestrator only, no workers)
- Done when:
  1. On `main`: move this file to `docs/backlog.md`; delete `docs/backlog/` and the lane inbox files; create an empty `inbox.md` and `docs/runs.md`; commit "chore: switch to orchestrator protocol", push. This is the only allowed push to `main`.
  2. Create `develop` from `main`.
  3. Inspect PR #1 (`lane/platform`), PR #2 (`lane/demand`) and commit `ad74c83`. Write a short finding in `docs/runs.md`: how the scaffold ended up on `lane/demand`.
  4. Take the scaffold from `lane/platform` as the canonical P1. On `task/P1` from `develop`, apply it and add what the demand side needed at the root: `tools/*` in the workspace globs, `research/` in `.prettierignore`, esbuild allowed to run its build script. Pin Node.js 26 and the pnpm version. Get CI green on GitHub, merge into `develop`, mark P1 `done`.
  5. On `task/D1` from the updated `develop`, bring over only `tools/demand-scanner/**` and `research/**` from `lane/demand`, plus any lockfile change it needs. Do not bring its root config copies. Get CI green, merge into `develop`. Set D1 and D2 to `done` only if their "Done when" is really met, otherwise `todo` with a note of what is missing.
  6. Close PR #1 and PR #2 with a comment linking the replacements. Delete `lane/platform` and `lane/demand`.
  7. Open the integration pull request from `develop` into `main`.

## P1. Scaffold and CI
- Status: done
- Note: merged via PR #3 (scaffold from lane/platform plus tools/*, research/ ignore, esbuild build allowed); CI green on Node 26.
- Depends on: R0
- Paths: root, `.github/**`
- Epic: E01, task 1
- Done when: pnpm workspaces (`apps/*`, `packages/*`, `tools/*`) and Turborepo; strict shared tsconfig; ESLint with `no-explicit-any` as error; Prettier; Vitest with one passing test; root scripts `typecheck`, `lint`, `test`; GitHub Actions on Node.js 26 running install with `--frozen-lockfile`, typecheck, lint and test; CI green on GitHub.

## P2. Lesson schema
- Status: done
- Note: merged via PR #6; CI green.
- Depends on: P1
- Paths: `packages/lesson-schema/**`, root
- Epic: E01, task 2
- Done when: Zod schemas and inferred types for the lesson, every step kind in `00-context.md` section 2 except `bugHunt` and `apiLab`, and the registry, roadmap and status files; `PASSIVE_KINDS` and `isActive`; tests for valid and invalid fixtures.

## P3. Markdoc compiler
- Status: done
- Note: merged via PR #9; CI green. Markdoc 0.5.10 is maintained (see compiler README).
- Depends on: P2
- Paths: `packages/lesson-compiler/**`, root
- Epic: E01, task 3 (compile part)
- Done when: Markdoc maintenance status noted; tag definitions for the step kinds from P2; `compileLesson(path)` returns a validated `Lesson` or errors with file and line; text outside tags is an error; tests for one valid and at least five invalid lessons.

## P4. Linter
- Status: done
- Note: merged via PR #10; CI green; 38 tests, lint coverage 99.5% measured locally (CI does not enforce coverage yet).
- Depends on: P3
- Paths: `packages/lesson-compiler/src/lint/**`, `packages/lesson-compiler/test/**`
- Epic: E01, task 3 (lint part)
- Done when: rules 1 to 7 from `00-context.md` section 3 as separate pure functions; seven broken fixtures each fail exactly their rule; coverage of lint rules at least 90%.

## P5. Sample verification, CLI, sample lesson
- Status: done
- Note: merged via PR #11; CI green; reviewer APPROVE on 51c040d (4 minors, see inbox.md).
- Depends on: P4
- Paths: `packages/lesson-compiler/**`, `content/**`, root, `.github/**`
- Epic: E01, tasks 3 (verify part), 4, 5
- Done when: `pnpm lesson build|check|new` work; SQL samples verified against PGlite in Node.js; a wrong declared output fails; `content/fullstack/joins-01/lesson.mdoc` passes; CI runs `lesson check`; README explains adding a step kind.

## P6. Lesson player
- Status: done
- Note: merged via PR #13; CI green; reviewer APPROVE on b96982f; reducer 100% coverage; Lighthouse desktop 1.00/1.00 (reviewer run). E2E is local only, not in CI.
- Depends on: P5
- Paths: `apps/web/**`, root
- Epic: E02
- Done when: all acceptance criteria of E02.

## P7. Widgets, first set
- Status: done
- Note: merged via PR #14; CI green; reviewer APPROVE on 9b67ce5 (driven in Chromium at 1024 and 1440 px). The player is not wired to the registry yet: see P7b.
- Depends on: P6
- Paths: `packages/widgets/**`, `apps/web/app/dev/**`, root
- Epic: E03
- Done when: `hook`, `explain`, `recap`, `cliffhanger`, `pitfall`, `predict`, `fillBlanks` meet the E03 common rules and appear in the catalogue page; unimplemented kinds map to a visible placeholder and the registry type still compiles.

## P7b. Wire widgets into the lesson player
- Status: done
- Note: merged via PR #15; CI green; reviewer APPROVE on 77e314d; e2e 19/19 locally (not in CI). The sample lesson cannot be finished through the UI until recall, sqlLab, brainPower and matching have widgets (the e2e seeds those four steps as answered and says so).
- Depends on: P7
- Paths: `apps/web/**`, root
- Epic: E02 and E03 (player integration)
- Done when: `apps/web` depends on `@learn-code/widgets` (`workspace:*`, `transpilePackages`) and the catalogue imports it by package name; the player renders every step through `StepWidget` inside `HighlightsProvider` with `widgets.css` loaded once; the player imports `StepResult` and `StepComponentProps` from the widgets package (one definition) and `StepPlaceholder` is removed; the P6 e2e is updated to play the sample lesson with the real widgets (answers instead of "Mark as answered") at 1024 and 1440 px; Playwright tests for the `/dev/widgets` catalogue at 1024 and 1440 px; CI still green. Added by the orchestrator so the P7 milestone check "the sample lesson renders every implemented step kind" can pass.

## P8. SQL engine and sqlLab
- Status: done
- Note: merged via PR #18; CI green; reviewer APPROVE on ed5a368 after one fix round (diff headers) and a format commit. Wiring, lesson check and root dep move are in P8b.
- Depends on: P7
- Paths: `packages/sql-engine/**`, `packages/widgets/src/sql-lab/**`, root
- Epic: E04, part A
- Done when: all acceptance criteria of E04 part A.

## P8b. Wire sqlLab, lesson check on the SQL engine
- Status: done
- Note: merged via PR #20; CI green; reviewer APPROVE on a18cfb9; e2e 22/22 locally (not in CI).
- Depends on: P8
- Paths: `packages/widgets/**`, `apps/web/**`, `packages/lesson-compiler/**`, root
- Epic: E04, part A (wiring and task 5)
- Done when: `sqlLab` is registered in the widgets registry via `createSqlLab` with a lazy `getEngine` (`createWorkerEngine`, imported only on the first sqlLab step) and a `loadSeed` that provides `seeds/<seedRef>.sql`; `sqlLab` has fixtures and appears in the catalogue; CodeMirror and `@learn-code/sql-engine` dependencies live in `packages/widgets/package.json`, not the root; `@learn-code/sql-engine` is in `transpilePackages`; the sample lesson can be finished through the UI for sqlLab; a production build shows PGlite is a lazy chunk and pages without SQL steps do not fetch it; the Worker timeout path is checked in a real browser; `lesson check` runs the reference query (must match expected rows) and the starter (must not) through the sql-engine inline adapter. Added by the orchestrator from the P8 review follow-ups.

## V1. UI package: tokens, fonts, page shell
- Status: done
- Note: merged via PR #27; CI green; reviewer APPROVE on adbe8d8 (minors: V4 must empty LEGACY_EXEMPT, remove `.legacy-skin` bridge, dark rules in widgets.css and highlight.ts, and the kind name in the step heading).
- Depends on: P8b
- Paths: `packages/ui/**`, `apps/web/**`, root
- Epic: E08 sections 2, 3, 7 and component Button, InkCard, StepTag, Highlight
- Done when: `packages/ui` exports tokens (CSS and typed), the four fonts via `next/font`, page shell (header, main, margin, footer) and the listed components; the dark theme is removed; the lesson page uses the shell; code lint CL1 and CL2 run in CI; catalogue shows each component; Playwright screenshots at 1280 and 1440 px are committed.

## V2. Margin schema, Markdoc tags, design lint
- Status: done
- Note: merged via PR #31; CI green; reviewer APPROVE on cf4d96e (minor: marginItem in tags/kinds.ts falls through to diagram without a never check). Highlight syntax is ==phrase== (renderer does not draw it yet: V3/V4). joins-01 annotation shortened for DL5.
- Depends on: V1
- Paths: `packages/lesson-schema/**`, `packages/lesson-compiler/**`, `content/**`
- Epic: E08 sections 5, 8 (lesson design lint) and 9
- Done when: `margin` and the title highlight are in the schema; Markdoc tags compile into them; rules DL1 to DL8 exist as pure functions with one failing fixture each; the sample lesson passes.

## V3. Characters and margin components
- Status: done
- Note: merged via PR #33; CI green; reviewer APPROVE on 7465d4e (minors: duplicate reduced-motion block in ui.css; no unit tests for ReviewCard, FeedbackBanner, Cliffhanger; no length limits on FeedbackBanner aside and Cliffhanger). Paths widened by the orchestrator to include pnpm-lock.yaml (3 lines, new workspace dependency).
- Depends on: V2
- Paths: `packages/ui/**`, `packages/widgets/**`, `apps/web/**`
- Epic: E08 sections 4 and 5
- Done when: The Bug, Olha and Mr. Runtime exist as SVG components; StickyNote, SpeechBubble, Gotcha, StopAndThink, FeedbackBanner, Annotation, MiniDiagram, ReviewCard, Cliffhanger, HintLadder are built and in the catalogue; the player renders `margin` items and the hook's left character column.

## V4. Restyle every existing widget and the sample lesson
- Status: blocked
- Depends on: V3
- Paths: `packages/widgets/**`, `content/**`, `apps/web/**`
- Epic: E08 whole file; mockups A1 to A4
- Done when: every implemented widget, including `sqlLab`, uses only `packages/ui`; StepTag text follows section 6; no internal names are visible; the sample lesson is rewritten to use margin items and covers the situations in mockups A1 to A4; the reviewer's visual check against the mockups lists no deviation.

## M0. Course setup and current-state sources
- Status: todo
- Depends on: V4
- Paths: `content/frontend-architecture/**`
- Epic: E09, correctness rules 1 and 2
- Done when: `content/frontend-architecture/sources.md` records, with dated links to official documentation, the current Module Federation version and packages, supported bundlers and meta-frameworks, and deprecated setups; the course is registered so the home page lists it.

## M1. Working example project
- Status: todo
- Depends on: M0
- Paths: `content/frontend-architecture/examples/**`, root, `.github/**`
- Epic: E09, correctness rule 3
- Done when: a host and two remotes built with the currently recommended Module Federation setup from `sources.md`; CI builds them; a script records the runtime outputs that lessons will use (including the duplicate-React failure and its fix).

## M2. Microfrontends roadmap
- Status: todo
- Depends on: M1
- Paths: `content/frontend-architecture/roadmap.json`, `content/frontend-architecture/registry/**`
- Epic: E09 roadmap; E07 method (section 1)
- Done when: 8 to 10 lessons with concepts, misconceptions and planned step kinds; every misconception from the E09 draft roadmap is covered.

## M3. Lesson 1
- Status: todo
- Depends on: M2
- Paths: `content/frontend-architecture/<roadmap lesson 1 id>/**`, `content/frontend-architecture/registry/**`
- Done when: 12 to 20 steps following the roadmap entry, E08 and the E09 correctness rules; every tool claim links official docs; `pnpm lesson check` passes. The reviewer opens each linked source and confirms it supports the claim.

## M4. Lesson 2
- Status: todo
- Depends on: M3
- Paths: `content/frontend-architecture/<roadmap lesson 2 id>/**`, `content/frontend-architecture/registry/**`
- Done when: same as M3 for lesson 2.

## M5. Lesson 3
- Status: todo
- Depends on: M4
- Paths: `content/frontend-architecture/<roadmap lesson 3 id>/**`, `content/frontend-architecture/registry/**`
- Done when: same as M3 for lesson 3. After merge, add to inbox.md: "Microfrontends lessons 1 to 3 are on develop."

## P9. Schema builder
- Status: todo
- Depends on: V4
- Paths: `packages/widgets/src/design/**`, `packages/lesson-schema/**`, `packages/lesson-compiler/**`, `content/**`
- Epic: E06 (`schemaBuilder`, `draftToDdl`, role mapping, scenario runner)
- Done when: two different correct designs for the sample task both pass; a design without a foreign key fails the matching scenario with a plain-language message; checking logic is pure and unit-tested; built only from `packages/ui` components and tokens, following E08.

## P10. Be the database: joins
- Status: todo
- Depends on: P9
- Paths: `packages/widgets/src/be-the-database/**`, `packages/lesson-compiler/src/traces/**`, `content/**`
- Epic: E06 (`beTheDatabase`, join variant)
- Done when: traces generated in CI from PGlite; the widget checks the learner's row pairing for INNER, LEFT and a row-multiplying join; results match the recorded output; built only from `packages/ui` components and tokens, following E08.

## C1. Module 1 roadmap
- Status: done
- Note: merged via PR #30; CI green; reviewer APPROVE on 2fe4814 (minor: roadmap schema does not declare misconceptions, plannedStepKinds, interaction or module note, so they are not validated).
- Depends on: D5
- Paths: `content/fullstack/roadmap.json`, `content/fullstack/registry/**`
- Epic: E07 (module 1 entries), `00-context.md` sections 2 to 4
- Done when: `roadmap.json` lists 8 to 10 lessons for module 1 (PostgreSQL) in order, each with id, title, concepts, misconceptions, planned step kinds, and the E07 interaction it uses if any; lesson order and emphasis are justified in a short note that cites numbers from `research/demand/report-js.md`; `concepts.json` and `misconceptions.json` contain every id the roadmap uses; all files pass schema validation.

## L1. Module 1, lesson 1
- Status: done
- Note: merged via PR #32; CI green; reviewer APPROVE on 8183533 after a first CHANGES_REQUESTED on eb4e58a (answer-revealing sample comments, alias-scope wording). The fix commit 8183533 was pushed by a session other than this run's workers. Minors: p2 option 2 explanation is loose; postgresql.org links unverified (unreachable from the sandbox).
- Depends on: C1, P8b
- Paths: `content/fullstack/<id of roadmap lesson 1>/**`, `content/fullstack/registry/**`
- Done when: `lesson.mdoc` follows its roadmap entry; 12 to 20 steps; uses only step kinds that have a real widget (no placeholders); voice follows `00-context.md` section 4; every SQL sample runs on PGlite in `lesson check`; every claim about PostgreSQL behavior has a comment linking the relevant page on postgresql.org/docs; `pnpm lesson check` passes. The reviewer also runs each sample and checks the explanation matches the actual result.

## L2. Module 1, lesson 2
- Status: todo
- Depends on: L1
- Paths: `content/fullstack/<id of roadmap lesson 2>/**`, `content/fullstack/registry/**`
- Done when: same as L1, for roadmap lesson 2; the lesson starts with a `recall` step about lesson 1 if the widget exists.

## L3. Module 1, lesson 3
- Status: todo
- Depends on: L2
- Paths: `content/fullstack/<id of roadmap lesson 3>/**`, `content/fullstack/registry/**`
- Done when: same as L2, for roadmap lesson 3.

After L3 is merged, the orchestrator adds an entry to inbox.md: "Lessons 1 to 3 are on develop. Play them and leave notes in inbox.md."

## D1. Scanner: fetch, parse, validate
- Status: done
- Note: merged via PR #4; code and data from lane/demand, tests and CI green.
- Depends on: P1
- Paths: `tools/demand-scanner/**`, `research/demand/**`, root
- Epic: E05, with the notes below
- Done when: fetches the Djinni RSS feed for `primary_keyword=Fullstack` and `Node.js` across all `exp_level` values; parses into the `Vacancy` schema; caches raw responses; skips cached vacancies; `pnpm demand validate` implements the schema and literal-occurrence guard; tests pass in CI.

## D2. Synonyms
- Status: done
- Note: 354 skills, all categories and required ai ids present; merged via PR #4.
- Depends on: D1
- Paths: `tools/demand-scanner/**`
- Done when: at least 150 canonical skills with categories `language`, `runtime`, `framework`, `database`, `orm`, `api`, `auth`, `testing`, `devops`, `cloud`, `queue`, `ai`, `frontend`, `other`; Ukrainian spellings; the `ai` category includes claude-code, copilot, openai-api, rag, mcp, langchain, langgraph, vector-db, embeddings, ai-agents; AWS and Azure services have their own ids.

## D3. Extraction, first 100
- Status: done
- Note: merged via PR #7; 100 files, validator 0 errors, CI green. Validate with `pnpm --filter ./tools/demand-scanner demand validate` (no root `demand` script).
- Depends on: D2
- Paths: `research/demand/**`
- Done when: the first 100 unextracted vacancies (sorted by id) have extraction files passing `pnpm demand validate`. The worker extracts by reading the text itself, in batches of 20, validating after each batch.

## D4. Extraction, the rest
- Status: done
- Note: merged via PR #17; 212 extraction files, validator 0 errors, CI green; reviewer APPROVE on d088d9c.
- Depends on: D3
- Paths: `research/demand/**`
- Done when: every parsed vacancy has a valid extraction file.

## D5. Reports
- Status: done
- Note: merged via PR #19; 209-vacancy main sample, 158 JS sample; reviewer APPROVE on d15b4c5, CI green.
- Depends on: D4
- Paths: `research/demand/**`, `tools/demand-scanner/**`
- Done when: `research/demand/report.md` and `research/demand/report-js.md` exist. The JS report covers vacancies where nodejs, typescript or javascript is required: sample size; top 20 required backend-side skills with percentages; shares of NestJS, Express, Fastify, Prisma, TypeORM, Drizzle, Sequelize, Redis, any queue, any AI skill; top 10 split by senior/lead vs junior/middle where known. `research/demand/spot-check.md` lists 20 random vacancy ids with links. Unknown terms seen 3+ times are listed.

## D6. Weekly refresh
- Status: todo
- Depends on: D5
- Paths: `research/demand/**`
- Done when: never marked done. Run at most once per 7 days (check the last date in `research/demand/changelog.md`): fetch new vacancies, extract, regenerate reports, add one dated line to the changelog with the sample size and any skill whose share moved 5 points or more.

## Notes for D tasks

- Djinni RSS: `/jobs/rss/?primary_keyword=Fullstack`. One request returns at most 100 items and ignores `page=`; repeat with each `exp_level` (`no_exp`, `1y` ... `10y`). One request every 3 seconds.
- The feed has no company and no salary. Deduplicate by normalized title plus description hash.
- No local model. Extraction is done by the worker reading the text.

## Stop point

After P10 and D5 the orchestrator only runs D6 and triage. New platform work needs the author.
