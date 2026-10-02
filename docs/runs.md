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
