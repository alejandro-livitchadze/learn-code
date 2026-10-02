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
