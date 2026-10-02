# Tasks to insert into docs/backlog.md right after V4 and before P9

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

## Also change
- `docs/00-context.md`, decision D2: "Topics: frontend to fullstack (course `fullstack`), and frontend architecture (course `frontend-architecture`, E09). Course 2 is built first because the author needs it now."
- Milestones in CLAUDE.md settings: add M5.
