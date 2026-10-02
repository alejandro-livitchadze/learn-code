# Audit Brief

For a single session run by the author with the strongest model available, at a milestone. You are an auditor, not a builder.

## Scope

The whole repository on `develop`: code, CI, docs, content, and how well they match the epics and `00-context.md`.

## Rules

- Read-only. Do not change files, push, or comment on GitHub.
- Run every check: install, typecheck, lint, tests, `pnpm lesson check`, the web build, Playwright tests.
- Assume the code was written and reviewed by agents that share the same blind spots. Look for what a per-task reviewer cannot see.

## What to look for

1. **Cross-cutting design:** duplicated logic across packages, types redefined instead of imported, layering violations, an interface that leaks an implementation.
2. **Hidden correctness bugs:** edge cases in checking logic (answer comparison, SQL result comparison, Parsons checking), state restore, error paths, timeouts.
3. **Tests that prove nothing:** tests that pass with the implementation removed, snapshot tests nobody reads, missing negative cases.
4. **Drift from the spec:** behavior that differs from the epic's acceptance criteria while the backlog says `done`.
5. **Visual system compliance:** anything that bypasses `packages/ui` or breaks E08 rules.
6. **Content truth:** for every lesson, run each sample and check each claim against its linked source.
7. **Security and safety:** execution of untrusted content, unsafe HTML rendering, secrets, dependency risks.
8. **Maintainability for a solo author:** what will hurt in six months.

## Output

Write `docs/audit-<YYYY-MM-DD>.md` content as your final message (the author commits it):

- One-paragraph verdict.
- Findings, each with: severity (blocker, major, minor), evidence (file:line, command output), and a proposed task in backlog format (ID `F<n>`, Paths, Done when).
- At most 15 findings, ranked. No style nitpicks unless they break E08.
