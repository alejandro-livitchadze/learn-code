# Backlog: platform lane

Branch `lane/platform`. Status values: `todo`, `in_progress`, `done`, `blocked`.

Each task fits one session. "Done when" is the acceptance test for that task only. The epic file holds the details.

## P1. Scaffold and CI
- Status: done
- Depends on: none
- Epic: E01, task 1
- Note: Scaffold built; apps/web and packages are empty stubs (Next.js comes in P6); tools/demand-scanner left to the demand lane. Assumption: local Node is 22, CI pins 26; CI also runs prettier check. CI green on Node 26 (lockfile fix needed first).
- Done when: pnpm workspaces and Turborepo with the layout from `00-context.md`; strict shared tsconfig; ESLint with `no-explicit-any` as error; Prettier; Vitest with one passing test; GitHub Actions running install, typecheck, lint and test on Node.js 26 for pushes and pull requests; CI is green.

## P2. Lesson schema
- Status: todo
- Depends on: P1
- Epic: E01, task 2
- Done when: `packages/lesson-schema` exports Zod schemas and inferred types for the lesson, every step kind listed in `00-context.md` section 2 except `bugHunt` and `apiLab`, and the registry, roadmap and status files; `PASSIVE_KINDS` and `isActive`; unit tests for valid and invalid fixtures.

## P3. Markdoc compiler
- Status: todo
- Depends on: P2
- Epic: E01, task 3 (compile part)
- Done when: Markdoc maintenance status is recorded in the task note; tag definitions exist for the step kinds from P2; `compileLesson(path)` returns a validated `Lesson` or errors with file and line; text outside tags is an error; tests cover a valid lesson and at least five invalid ones.

## P4. Linter
- Status: todo
- Depends on: P3
- Epic: E01, task 3 (lint part)
- Done when: rules 1 to 7 from `00-context.md` section 3 are separate pure functions; seven broken fixtures each fail exactly their rule; coverage of lint rules is at least 90%.

## P5. Sample verification, CLI and sample lesson
- Status: todo
- Depends on: P4
- Epic: E01, tasks 3 (verify part), 4 and 5
- Done when: `pnpm lesson build|check|new` work; SQL samples are verified against PGlite in Node.js; a wrong declared output fails the check; `content/fullstack/joins-01/lesson.mdoc` passes; CI runs `lesson check` on all lessons; README explains how to add a step kind.

## P6. Lesson player
- Status: todo
- Depends on: P5
- Epic: E02
- Done when: all acceptance criteria of E02 are met.

## P7. Widgets, first set
- Status: todo
- Depends on: P6
- Epic: E03
- Done when: `hook`, `explain`, `recap`, `cliffhanger`, `pitfall`, `predict` and `fillBlanks` meet the E03 common rules and appear in the catalogue page with fixtures; the registry completeness type compiles only when every implemented kind has a widget (unimplemented kinds map to a visible placeholder).

## P8. SQL engine and sqlLab
- Status: todo
- Depends on: P7
- Epic: E04, part A
- Done when: all acceptance criteria of E04 part A are met.

## P9. Schema builder
- Status: todo
- Depends on: P8
- Epic: E06 (`schemaBuilder`, `draftToDdl`, role mapping, scenario runner)
- Done when: two different correct designs for the sample task both pass; a design without a foreign key fails the matching scenario with a plain-language message; checking logic is pure and unit-tested.

## P10. Be the database: joins
- Status: todo
- Depends on: P9
- Epic: E06 (`beTheDatabase`, join variant only)
- Done when: traces are generated in CI from real PostgreSQL (PGlite); the widget checks the learner's row pairing for INNER and LEFT joins and for a row-multiplying join; results match the recorded output.

## Stop point
After P10 the lane stops. Further work needs the author's decision.
