# E04. Code Execution (v3)

Read `00-context.md` first. Depends on E01 to E03.

This epic has two parts with different status.

- **Part A, SQL in the browser: do now.** It is all the first module needs.
- **Part B, Node.js execution: postponed.** Do not start it until the author says so. It begins with a spike.

## Principle: precomputed by default

Most steps execute nothing at view time. Outputs and traces for `predict`, `fillBlanks`, `reveal`, `beTheRuntime` and `beTheDatabase` are computed in CI by real PostgreSQL and real Node.js and stored in the step tree. Only steps where the learner writes free SQL or free code call an engine.

---

# Part A. SQL in the browser

## Goal

Learners write real PostgreSQL queries in a lesson and get real results, with no server.

## Scope

In scope: the `SqlEngine` interface, a PGlite adapter, the editor, the `sqlLab` widget.

Out of scope: any backend service, Node.js execution.

## Interface

```ts
interface SqlResult {
  readonly columns: readonly string[];
  readonly rows: readonly (readonly unknown[])[];
  readonly rowCount: number;
}

type SqlOutcome =
  | { readonly ok: true; readonly result: SqlResult }
  | { readonly ok: false; readonly sqlState: string; readonly message: string; readonly position?: number };

interface SqlSession {
  execute(sql: string): Promise<SqlOutcome>;
  reset(): Promise<void>;
  close(): Promise<void>;
}

interface SqlEngine {
  readonly id: string;
  open(seedSql: string): Promise<SqlSession>;
}
```

Widgets and the scenario runner in E06 depend on this interface only.

## PGlite adapter (`packages/sql-engine`)

- Package `@electric-sql/pglite`. One in-memory database per session.
- `open` creates the database and runs the seed. `reset` drops everything and re-seeds.
- Load PGlite lazily, only when a lesson reaches its first SQL step, and show progress while it loads.
- Run the engine in a Web Worker so a heavy query cannot freeze the page. A query that exceeds the time limit terminates the worker; the session is then reopened.
- Cap the number of rows returned to the UI.
- The same adapter runs in Node.js for `lesson check` in CI.

## Editor

CodeMirror 6 with the SQL language package. Run with Ctrl+Enter. Errors from PostgreSQL are shown as they are, with the reported position marked in the editor.

## `sqlLab` widget

- Editor, result grid, schema viewer for the seeded tables, "Reset database".
- The step defines `seedSql`, the task text and `expected`: either rows or a checking query.
- Compare the learner's result with the expected rows. Row order matters only if the step says so. Column names are compared case-insensitively.
- On a mismatch, show a difference: missing rows, extra rows, wrong columns.
- Completes on the first matching result. Attempts are counted.

## Tasks

1. Define `SqlEngine`, `SqlSession` and a fake in-memory implementation for widget tests.
2. Implement the PGlite adapter with the worker, timeout and lazy loading.
3. Build the editor component.
4. Build `sqlLab` and register it.
5. Extend `lesson check` (E01): the reference query returns the expected rows and the starter query does not.

## Acceptance criteria

- A `sqlLab` step with a join over two seeded tables accepts a correct query and rejects a wrong one with a visible difference.
- A syntax error shows the PostgreSQL message and marks the position.
- A runaway query ends with a timeout message and the next query works.
- Pages without SQL steps do not download PGlite.
- `sqlLab` imports only the interface, never the adapter.

## Pitfalls

- Results contain values that are not plain JSON (dates, big integers, numerics). Normalize them to strings before comparing and displaying.
- Error codes are stable; messages are not. Match on `sqlState`.
- Check the size of the PGlite download and report it in the pull request.

---

# Part B. Node.js execution (postponed)

Needed for `bugHunt` and `apiLab`, which first appear in the Node.js module.

## Step 1: a spike, before any production code

Compare two options on one real lesson and write the result to `docs/spikes/E04-node.md`.

**Option 1: a local run service with Docker.**

- A small Node.js service receives the learner's files, starts a short-lived container (no network, memory, CPU and process limits, read-only file system, non-root user, hard timeout), streams output back, and removes the container.
- PostgreSQL in a second container; each run gets a throwaway database created from a seeded template, so Node.js code can use the ordinary `pg` driver.
- Strengths: real Node.js and real PostgreSQL together, no license question.
- Weaknesses: it is a backend to build and operate. The service needs the Docker socket, which equals root on the host, so it is safe only on the author's own machine. A public deployment needs stronger isolation (gVisor, micro-VMs or a managed sandbox), rate limits and a cost ceiling.

**Option 2: WebContainers in the browser.**

- Node.js runs in the learner's browser. No server, no cost per run, no risk to the host.
- Weaknesses: no raw TCP, so no ordinary PostgreSQL connection (a bridge to PGlite would be needed); requires cross-origin isolation headers on lesson pages; production use in a for-profit setting requires a commercial license whose price is not public.

Measure for each: hours to a working `bugHunt`, cold start time, what a lesson with Node.js plus PostgreSQL looks like, and what changes when the site starts earning money.

## Step 2: build the chosen option behind one interface

```ts
type RunEvent =
  | { readonly type: 'stdout'; readonly text: string }
  | { readonly type: 'stderr'; readonly text: string }
  | { readonly type: 'test'; readonly name: string; readonly passed: boolean; readonly message?: string }
  | { readonly type: 'exit'; readonly code: number }
  | { readonly type: 'timeout' }
  | { readonly type: 'error'; readonly message: string };

interface RunRequest {
  readonly lessonId: string;
  readonly stepId: string;
  readonly files: Readonly<Record<string, string>>;
  readonly mode: 'tests' | 'serve';
  readonly timeoutMs: number;
}

interface Runner {
  readonly id: string;
  isAvailable(): Promise<boolean>;
  run(request: RunRequest, onEvent: (event: RunEvent) => void): Promise<void>;
  stop(): Promise<void>;
}
```

Widgets depend on `Runner` only, so the choice can be reversed later.

- **`bugHunt`:** editor, "Run tests", a list of hidden tests with messages. Completes when all pass. Hidden tests use `node:test`.
- **`apiLab`:** editor with server code, "Start server", an HTTP client panel showing status, headers and body. Completes when hidden checks pass.

## Rule that holds for either option

Never expose a service that executes learner code to the internet without an isolation layer stronger than plain Docker.
