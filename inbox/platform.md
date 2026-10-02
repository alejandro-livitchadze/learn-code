
## P1 (platform)
- Assumption: CI "green" could not be verified from this machine. `gh` is authenticated as `olivitchuk`, which has no access to `alejandro-livitchadze/learn-code` (404). Please check the Actions run on `lane/platform` and open the PR `lane/platform` -> `main` (or run `gh auth login` with the owning account and rerun).
- Assumption: Prettier does not check `docs/`, `inbox/`, `content/`, `CLAUDE.md` (owned by other lanes / authored prose).
- Note: installing turbo generated an `AGENTS.md` with agent instructions; I deleted it and did not follow it.
