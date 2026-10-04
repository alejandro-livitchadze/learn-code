# Runs

## 2026-10-02: R0 recovery and migration

- Tasks: R0, P1 (PR #3), D1 and D2 (PR #4). All merged into `develop` with green CI on GitHub.
- Finding on how the scaffold ended up on `lane/demand`: `lane/demand` was branched from `main` and then the platform scaffold (`ad74c83`, "feat(platform): scaffold monorepo, tooling and CI") and a "mark P1 done" commit (`b96148e`) were committed on it, with the demand work (`f9a6263` and later) stacked on top. `lane/platform` meanwhile had its own, different scaffold commits (`0498f8e`, `3dc088d`). So two scaffolds existed; `lane/platform` was taken as canonical for P1, and only `tools/demand-scanner/**` and `research/**` were taken from `lane/demand`.
- CI: green on `develop`.
- Usage: no workers used.
- Open item: branches `lane/platform`, `lane/demand`, `task/P1`, `task/D1` could not be deleted (git push --delete was denied); see inbox.md.

## 2026-10-02 (second run): P2 and D3

- P2 (PR #6), D3 (PR #7), P3 (PR #9): all merged, CI green. MAX_TASKS_PER_RUN (3) reached.
- Workers: 2 (parallel). P2 worker returned a placeholder report; I verified its diff and checks myself.
- D3 note: vacancy 846663 contained an embedded instruction; the worker ignored it (data only). Long descriptions were truncated at about 5000 characters; relevant for D4.
- Usage: no concerns.

- Extra task at the author's request (beyond MAX_TASKS_PER_RUN): P4 (PR #10), merged, CI green.
- Follow-ups for P5 or a root task: add `"test"` to `packages/lesson-compiler/tsconfig.json` include; add `@vitest/coverage-v8` and a coverage threshold if CI should enforce 90%; export `./lint` from `src/index.ts`; CLI must pass real registries to `lintLesson`.

- P5 (PR #11): merged, CI green, review verdict APPROVE on 51c040d. Under protocol v4 from here on. P2, D3, P3, P4 were merged earlier under v2 without a reviewer. Milestone step for P5 follows.
- Milestone P5: integration reviewer verdict APPROVE on fc25ac9, CI green on develop; PR #8 retitled "Integration" and merged into main (merge commit fb82dbc). main was synced back into develop. No integration PR is open now because develop has no diff against main; open a new "Integration" PR when develop moves ahead.
- Usage: 5 workers and 2 reviewers this run; four tasks plus P5 at the author's request, beyond MAX_TASKS_PER_RUN.
- P6 (PR #13): merged, CI green, review verdict APPROVE on b96982f. Extra task at the author's request.
- P7 (PR #14): merged, CI green, review verdict APPROVE on 9b67ce5 (reviewer drove /dev/widgets in Chromium at 1024 and 1440 px). Extra task at the author's request. Milestone step for P7 is held until P7b (player wiring, added by the orchestrator) is merged, because the integration checklist requires the sample lesson to render implemented step kinds.
- P7b (PR #15): merged, CI green, review verdict APPROVE on 77e314d. Added by the orchestrator to wire the P7 widgets into the player before the P7 milestone step.
- Milestone P7: integration reviewer verdict APPROVE on 530fe77, CI green on develop; PR #12 merged into main (merge commit d1eadef); main synced back into develop. Usage: this run used 8 workers (P2, D3, P3, P4, P5, P6, P7, P7b) and 6 reviewer runs (4 task reviews and 2 integration reviews), with P7b added by the orchestrator, well beyond MAX_TASKS_PER_RUN at the author's request.

## 2026-10-02 (third run): D4 and P8

- D4 (PR #17): merged, CI green, review verdict APPROVE on d088d9c. 212 extraction files, validator 0 errors. Minors for D5: decide how to bucket GenAI tools (Cursor, Claude, ChatGPT) and keep the "Junior-Middle" to junior mapping consistent; vacancies 850924, 850047, 850459 are not ordinary developer roles (D5 may exclude them).
- P8 (PR #18): first review on 01f4a28 was CHANGES_REQUESTED (blocker: diff grid headers used the learner's column order). Fix round 1 pushed as 8b76101 (code fix and test pass locally). CI on 8b76101 is red only because `prettier --check` flags `compare.ts` and `SqlLab.tsx`; the worker and my local checks did not run `pnpm format`. P8 stays `in_progress`. Next run: fix round 2 (run `pnpm format`, add `pnpm format` to the worker checks), then review on the new head. No review verdict exists for 8b76101 yet.
- Workers in this run: D4, P8, P8 fix round 1 (MAX_TASKS_PER_RUN of 3 reached). Reviewers: 2. Both workers' final reports were empty or a placeholder; I verified diffs and checks myself.
- P8 follow-ups (outside its Paths): register `sqlLab` in the widgets registry with a lazy `getEngine`, add fixtures, `loadSeed`, `transpilePackages` for `@learn-code/sql-engine`; move CodeMirror deps from root to `packages/widgets/package.json`; extend `lesson check` to use the sql-engine; verify the Worker and wasm in a browser and that non-SQL pages do not fetch PGlite. Suggested new backlog task P8b.

## 2026-10-02 (fourth run): P8 fix round 2

- P8 (PR #18): fix round 2 pushed as ed5a368 (`prettier` format only). Local format, typecheck, lint and test pass. CI on ed5a368 was still running when this run ended; no review verdict exists for this head. Next run: if CI is green, run the review gate on ed5a368. P8 stays `in_progress`.
- Workers: 1 (P8 fix round 2). Reviewers: 0. No usage concerns.

- Update, same run: after an unrelated session pushed a format-only commit (ed5a368) to `task/P8`, CI went green on the new head; I confirmed the diff is whitespace only, re-ran all checks locally, and a fresh reviewer gave APPROVE on ed5a368. P8 (PR #18) merged. Added task P8b for the wiring and `lesson check` follow-ups. Stale branches `task/D4`, `task/P8` need deleting.

## 2026-10-02 (fifth run): P8b resumed

- P8b (PR #20, head a18cfb9): the branch was already complete (final commit 91287c5, develop merged in by another session). I ran install, typecheck, lint, prettier and test locally: all pass; only `root` files outside the app/package paths changed. CI was still running when this run ended; no review verdict exists for this head. P8b stays `in_progress`. Next run: if CI is green, run the review gate on a18cfb9.
- Workers: 0. Reviewers: 0. Integration PR #16 stays open (milestone D5 step pending; see backlog).
- Update, same run: CI green on a18cfb9; fresh reviewer gave APPROVE; P8b (PR #20) squash-merged into develop. Reviewers: 1. Workers: 0.
- Milestone D5: CI green on develop (13e0b20); integration reviewer APPROVE; PR #16 merged into main (merge commit 7bd1c27); main synced back into develop. Reviewers this run: 2 (task P8b, integration). Workers: 0. Next: C1 is ready (depends on D5); P9 is ready (depends on P8).

## 2026-10-02 (sixth run): F1, F2, F6

- F2 (PR #22): merged, CI green, review APPROVE on 0890164.
- F1 (PR #23): merged, CI green, review APPROVE on e69f87e. Unbuilt-kind and step-count rules were warnings for joins-01 via LEGACY_LESSONS until F6.
- F6 (PR #24): worker left three compiler tests red (they edit joins-01 by string replacement); F6 Paths widened, fix round 1 done, merged, CI green, review APPROVE on af651a5.
- Workers: 4 (F1, F2, F6, F6 fix round). Reviewers: 3. MAX_PARALLEL and MAX_TASKS_PER_RUN exceeded at the author's request.
- Next ready: F3, F4, F5, F7 (F3 and F5 overlap each other; F4 and F7 are independent), F8 is author/orchestrator only.

## 2026-10-03: F3, F4

- F3 (PR #26): merged, CI green, review APPROVE on f71d17f.
- F4 (PR #25): first CI run red (e2e job hung in `playwright install` on Node 26, cancelled at the 20 min timeout). Fix round 1 installed browsers under Node 22; CI green; merged, review APPROVE on b1ce79e.
- Workers: 3 (F3, F4, F4 fix round). Reviewers: 2. CI on develop not re-checked after the merges. Integration PR #21 still open; no milestone this run.
- Next ready: F5, F7 (F8 is author/orchestrator only), V1, C1.

## 2026-10-03 (second run): F5, V1

- V1 (PR #27, head adbe8d8): worker done; scope, install, typecheck, lint pass locally; lesson-compiler tests hang locally (PGlite), so CI decides. CI running; no review verdict yet. V1 stays `in_progress`. Next run: if CI green, run review gate on adbe8d8.
- F5: worker dispatched on `task/F5`, still running at this write. Stays `in_progress`; resume from the branch if it has no PR.
- V1 notes for reviewer/V4: LEGACY_EXEMPT list in codeLint.ts and `.legacy-skin` block in globals.css must be removed by V4.
- Update, same run: CI green on adbe8d8; fresh reviewer APPROVE; V1 (PR #27) squash-merged. F5 worker still running at this write; F5 stays `in_progress`.
- Update, same run: F5 worker done; PR #28 opened (head f7a0f55); local typecheck and lint pass, sql-engine tests pass under both TZ values. CI running, no verdict yet. F5 stays `in_progress`. Next run: if CI green, review gate on f7a0f55. Note: F5 renders booleans as `t`/`f` (PostgreSQL raw text).
- Update, same run: F5 (PR #28) CI red on f7a0f55 (prettier on `pg-text.test.ts`); fix round 1 pushed as 9b3dedb (format only; format, lint, typecheck, sql-engine tests pass locally). CI on 9b3dedb pending; no review verdict for this head. F5 stays `in_progress` (1 of 2 fix rounds used). Next run: if CI green, review gate on 9b3dedb. Workers this run: 2 (F5, V1) plus 1 fix round; reviewers: 1 (V1).
- Update, same run: CI green on 9b3dedb; fresh reviewer APPROVE; F5 (PR #28) squash-merged. Reviewers this run: 2. MAX_TASKS_PER_RUN reached; stopping. Next ready: F7, C1 (F8 is author/orchestrator only), V2.

## 2026-10-03 (third run): F7, C1

- F7 (PR #29): merged, CI green, review APPROVE on 413527f.
- C1 (PR #30): merged, CI green, review APPROVE on 2fe4814.
- Workers: 2. Reviewers: 2. No fix rounds. Integration PR #21 still open; no milestone this run.
- Next ready: V2, L1 (C1 and P8b done); F8 is author/orchestrator only.

## 2026-10-03 (fourth run): V2

- V2 (PR #31): merged, CI green, review APPROVE on cf4d96e. No fix rounds.
- Workers: 1. Reviewers: 1. L1 was ready but its `content/**` Paths overlap V2, so it ran alone; no other task was ready in parallel. Integration PR #21 still open; no milestone this run.
- Next ready: L1, V3 (V3 paths overlap L1 only through nothing: `packages/ui`, `packages/widgets`, `apps/web` vs `content/fullstack`; check next run). F8 is author/orchestrator only.
- Update, same run: V3 (PR #33) worker done; CI green on 7465d4e; reviewer APPROVE; squash-merged. Paths widened to `pnpm-lock.yaml`.
- Update, same run: L1 (PR #32, head eb4e58a) worker done; CI green; reviewer CHANGES_REQUESTED (predict samples show `-- Docs:` comments that state the answer; the alias rule says "only after SELECT" but GROUP BY also accepts output names). L1 stays `in_progress`; fix round 1 not started because MAX_TASKS_PER_RUN (V2, V3, L1) was reached. Next run: dispatch the fix round on `task/L1` with the PR comment as context, then re-review.
- Workers: 3. Reviewers: 3. Integration PR #21 still open; no milestone this run.
- Next ready: V4 (V3 done), L1 fix round; F8 is author/orchestrator only.

## 2026-10-03 (fifth run): L1 fix round 1

- L1 (PR #32): fix round 1 worker done, head 8183533 (both blockers fixed; scope checked, only `content/fullstack/query-order-01/**` and `registry/**` changed). Worker ran install, typecheck, lint and `lesson check` (pass); `pnpm test` hangs locally (PGlite), CI decides. CI running on 8183533; no review verdict for this head yet. L1 stays `in_progress` (1 of 2 fix rounds used). Next run: if CI green, run a fresh review on 8183533.
- V4 was ready but its `content/**` Paths overlap L1, so it waits.
- Workers: 1. Reviewers: 0. Integration PR #21 still open; no milestone this run.
- Update, same run: a fix commit 8183533 appeared on `task/L1` (not from this run's workers); it removed the answer-revealing sample comments and narrowed the alias-scope wording. CI green; fresh reviewer APPROVE; L1 (PR #32) squash-merged. Reviewers this run: 4. L1 is `done`.
- Next ready: V4, L2 (F8 is author/orchestrator only).

## 2026-10-03 (sixth run): V4

- V4 (PR #34, head 81a490b): worker done; scope checked, install, typecheck, lint, lesson check pass locally. e2e and visual check against A1 to A4 not run in the sandbox. CI running; no review verdict yet. V4 stays `in_progress`. Next run: if CI green, run a fresh review on 81a490b (reviewer must do the A1 to A4 visual check).
- Workers: 1. Reviewers: 0. L2 was ready but its `content/**` overlap with V4 means it waits. Integration PR #21 still open; no milestone this run.
- Update, same run: CI e2e red on 81a490b (6 failures: footer action replaced the Continue button in gating assertions; unbuilt-kind fixture title contained the kind name). Fix round 1 pushed as 8e452a1 (2 files; 27 e2e passed locally with the preinstalled Chromium). CI on 8e452a1 pending; no review verdict for this head. V4 stays `in_progress` (1 of 2 fix rounds used). Next run: if CI green, fresh review on 8e452a1 including the A1 to A4 visual check. Workers this run: 2.
- Update, same run: CI green on 8e452a1; fresh reviewer CHANGES_REQUESTED (5 blockers: raw course id on home page; A2 reveal missing; A4 review cards and next lesson; A3 sqlLab hints, pk/fk, missing-column case, danger styling; broken MiniDiagram). Verdict posted on PR #34. Fix round 2 (last allowed) pushed as 269f145; scope checked. Worker reports the reveal and review cards are approximated (no `reveal` tag or recap review-card field in the schema; those are outside V4's paths). CI on 269f145 pending; no verdict for this head. V4 stays `in_progress` (2 of 2 fix rounds used; another failure sets it to `blocked`). MAX_TASKS_PER_RUN reached; stopping. Workers: 3. Reviewers: 1.
- Update, same run: CI green on 269f145; fresh reviewer CHANGES_REQUESTED (1 blocker: sqlLab schema panel never shows the `pk` marker; the earlier blockers are fixed). Verdict posted on PR #34. Fix rounds exhausted (2 of 2), so V4 is `blocked` and PR #34 stays open. Reviewers this run: 2.

## 2026-10-03 (seventh run): nothing started

- V4 (PR #34) is still `blocked` (2 of 2 fix rounds used; pk-marker blocker open). L2, P9, M0 and everything after them wait on V4.
- D6 was the only ready task, but djinni.co is unreachable from this sandbox (proxy CONNECT returns 403), so no refresh was possible. F8 is author/orchestrator only.
- Workers: 0. Reviewers: 0. Integration PR #21 still open; no milestone.

## 2026-10-04 (eighth run): nothing started

- No change since the seventh run: V4 (PR #34, head 269f145) is `blocked` awaiting the author's decision on a third fix round; D6 still needs djinni.co. Workers: 0. Reviewers: 0.

## 2026-10-04 (ninth run): nothing started

- No change: V4 (PR #34) still `blocked`, awaiting the author; D6 needs djinni.co; F8 is author-only. Workers: 0. Reviewers: 0.
