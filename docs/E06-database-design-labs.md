# E06. Database Design Labs

Read `00-context.md` first. Depends on E01 to E03 and on the `SqlEngine` interface from E04, part A.

## Goal

Teach database design, not only query writing: tables, types, keys, relations, naming, normalization, migrations, and how the database executes work. Every topic is something the learner does, not reads.

## New step kinds

Add to the schema (E01) and to the list in `00-context.md`:

- `schemaBuilder`
- `relationLab`
- `normalizeLab`
- `namingReview`
- `migrationLab`
- `beTheDatabase`

All are active kinds.

## Core idea: check behavior, not names

A design task has many correct answers. Do not compare the learner's schema with a reference. Generate real DDL from it, run it in PostgreSQL through `SqlEngine`, then run **scenarios**: statements that must succeed or must fail.

```ts
type ColumnType = 'integer' | 'bigint' | 'text' | 'boolean' | 'numeric' | 'timestamptz' | 'uuid' | 'date';

interface ColumnDraft {
  readonly name: string;
  readonly type: ColumnType;
  readonly nullable: boolean;
  readonly unique: boolean;
  readonly primaryKey: boolean;
  readonly references?: { readonly table: string; readonly column: string; readonly onDelete: 'restrict' | 'cascade' | 'set null' };
}

interface TableDraft {
  readonly name: string;
  readonly columns: readonly ColumnDraft[];
}

interface SchemaDraft {
  readonly tables: readonly TableDraft[];
}

type Expectation =
  | { readonly kind: 'succeeds' }
  | { readonly kind: 'fails'; readonly sqlState: string } // e.g. 23503 foreign key, 23505 unique, 23502 not null
  | { readonly kind: 'returns'; readonly rows: readonly (readonly unknown[])[] };

interface Scenario {
  readonly id: string;
  readonly story: string;            // "An order must belong to an existing customer."
  readonly setupSql: readonly string[];
  readonly probeSql: string;
  readonly expect: Expectation;
  readonly hintOnFail: string;
}
```

- `draftToDdl(draft)` is a pure function with unit tests.
- Scenario SQL must not depend on the learner's names. The step declares **roles** ("the customers table", "the order's customer reference"), and the learner maps their tables and columns to roles as the last action of the task. Scenarios are templates filled from that mapping.
- Feedback shows the failed story in plain language, the statement that was tried, and what the database answered.

## Widgets

### `schemaBuilder`

- Starts from a short requirement text and a pile of loose fields ("email", "order total", "created at").
- The learner creates tables, drags fields into them, picks types and marks keys and constraints.
- "Test my design" runs the scenarios and lists them as passed or failed stories.

### `relationLab`

- Tables are shown as cards. The learner connects two of them and chooses the relation type.
- For one-to-many, the learner chooses the side that holds the foreign key. A wrong side is demonstrated with data: the widget shows what a second order would require.
- For many-to-many, a junction table appears and the learner names it and picks its key.
- Diagram rendering with SVG lines.

### `normalizeLab`

- Starts with one wide table containing duplicated data.
- Act 1: the learner edits one value and watches the copies go out of sync (update anomaly). Then tries to delete a row and loses unrelated facts (delete anomaly).
- Act 2: the learner splits columns into new tables.
- Check: scenarios confirm that the fact now lives in one place.

### `namingReview`

- A schema written by "a previous developer" in code-review format.
- The learner marks problem names and picks a reason: inconsistent case, mixed singular and plural, reserved word, meaningless abbreviation, type encoded in the name.
- The lesson states one convention and asks for consistency. It does not present style choices as facts.

### `migrationLab`

- A database with existing rows and a change request ("split `full_name` into two columns", "make `email` required").
- The learner writes or assembles the migration steps in order.
- Scenarios verify that the old data survived and the new constraint holds.
- Includes at least one task where the naive migration fails on existing rows.

### `beTheDatabase`

The learner performs the database's job by hand. Traces are precomputed in CI from real PostgreSQL where possible.

- **Join:** two small tables. The learner pairs rows for a given `JOIN` condition, then compares with the real result. Variants for `INNER`, `LEFT` and a join that multiplies rows unexpectedly.
- **Index:** find a value by scanning rows one by one, then by walking a small tree. The step counts comparisons. Label the tree as a simplified teaching model and show the real `EXPLAIN` output next to it.
- **Transactions:** two sessions on a shared timeline. Before each read, the learner predicts what that session sees. Expected values are recorded from real PostgreSQL at the stated isolation level.

## Authoring support

- Extend `lesson check`: for every design step, at least one reference `SchemaDraft` passes all scenarios, and at least one listed wrong draft fails the scenario it is meant to illustrate.
- Each scenario links to a misconception id.
- Add a lint rule: a `schemaBuilder` step has between 3 and 7 scenarios.

## Tasks

1. Add the six step kinds to the schema and fixtures.
2. Implement `draftToDdl`, role mapping and the scenario runner on top of `SqlEngine`.
3. Build `schemaBuilder`, then `relationLab` (they share the table card components).
4. Build `normalizeLab` and `migrationLab`.
5. Build `namingReview`.
6. Build the trace generator for `beTheDatabase` and its three variants.
7. Extend `lesson check` and the catalogue page.
8. Write one sample lesson: "Design the schema for an online shop".

## Acceptance criteria

- Two different correct designs for the same task both pass.
- A design without a foreign key fails the matching scenario with a plain-language explanation.
- All widgets are usable with a keyboard only and fit at 1024 px width.
- `beTheDatabase` join and transaction results match real PostgreSQL output recorded in CI.
- Checking logic is in pure functions with unit tests.

## Pitfalls

- Quote identifiers when generating DDL, and reject names that are empty or too long before sending anything to the database.
- Each "Test my design" run needs a clean database. Use a fresh session or `reset()`.
- Error codes are stable; error messages are not. Match on `sqlState`.
- Free-form naming makes the role mapping step essential. Without it, scenarios cannot find the learner's tables.
