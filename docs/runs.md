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
