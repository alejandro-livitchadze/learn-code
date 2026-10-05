import { z } from 'zod';

/**
 * Database design labs (E06): a learner's design is data (`SchemaDraft`), turned into real DDL,
 * and judged by scenarios that run against PostgreSQL. Everything here is pure; the only
 * side effect is in `runScenarios`, which talks to a session handed in by the caller.
 */

export const COLUMN_TYPES = [
  'integer',
  'bigint',
  'text',
  'boolean',
  'numeric',
  'timestamptz',
  'uuid',
  'date',
] as const;
export const columnType = z.enum(COLUMN_TYPES);
export type ColumnType = z.infer<typeof columnType>;

export const REFERENCE_ACTIONS = ['restrict', 'cascade', 'set null'] as const;

export const columnDraft = z.object({
  name: z.string(),
  type: columnType,
  nullable: z.boolean(),
  unique: z.boolean(),
  primaryKey: z.boolean(),
  references: z
    .object({
      table: z.string(),
      column: z.string(),
      onDelete: z.enum(REFERENCE_ACTIONS),
    })
    .readonly()
    .optional(),
});
export type ColumnDraft = z.infer<typeof columnDraft>;

export const tableDraft = z.object({
  name: z.string(),
  columns: z.array(columnDraft).readonly(),
});
export type TableDraft = z.infer<typeof tableDraft>;

export const schemaDraft = z.object({ tables: z.array(tableDraft).readonly() });
export type SchemaDraft = z.infer<typeof schemaDraft>;

/** A name in the design the lesson talks about: "the customers table", "the order's customer". */
export const designRole = z.object({
  id: z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/, 'a role id is letters, digits and underscores'),
  label: z.string().min(1),
  kind: z.enum(['table', 'column']),
  /** For a column role: the id of the table role the column belongs to. */
  table: z.string().min(1).optional(),
});
export type DesignRole = z.infer<typeof designRole>;

/** Role id to the learner's table or column name. */
export type RoleMap = Readonly<Record<string, string>>;

export const expectation = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('succeeds') }),
  z.object({ kind: z.literal('fails'), sqlState: z.string().length(5) }),
  z.object({
    kind: z.literal('returns'),
    rows: z.array(z.array(z.unknown()).readonly()).readonly(),
  }),
]);
export type Expectation = z.infer<typeof expectation>;

export const scenario = z.object({
  id: z.string().min(1),
  /** The rule in plain language: "An order must belong to an existing customer." */
  story: z.string().min(1),
  /** SQL templates; `{{roleId}}` becomes the learner's quoted name. */
  setupSql: z.array(z.string()).readonly().default([]),
  probeSql: z.string().min(1),
  expect: expectation,
  hintOnFail: z.string().min(1),
  misconception: z.string().min(1),
});
export type Scenario = z.infer<typeof scenario>;

/** A draft together with the role mapping that goes with it. */
export const mappedDraft = z.object({
  name: z.string().min(1),
  draft: schemaDraft,
  roles: z.record(z.string(), z.string()).readonly(),
});
export type MappedDraft = z.infer<typeof mappedDraft>;

/** A wrong draft names the scenario it is meant to fail. */
export const wrongDraft = mappedDraft.extend({ fails: z.string().min(1) });
export type WrongDraft = z.infer<typeof wrongDraft>;

/** The data of a schemaBuilder step that is not prose. */
export const designTask = z.object({
  /** Loose fields to drag into tables ("email", "order total", "created at"). */
  looseFields: z.array(z.string().min(1)).readonly().default([]),
  roles: z.array(designRole).min(2).readonly(),
  scenarios: z.array(scenario).min(1).readonly(),
  references: z.array(mappedDraft).min(1).readonly(),
  wrongDrafts: z.array(wrongDraft).readonly().default([]),
});
export type DesignTask = z.infer<typeof designTask>;

// ---------------------------------------------------------------------------------------------
// DDL

/** PostgreSQL's identifier limit (NAMEDATALEN - 1) in bytes. */
export const MAX_IDENTIFIER_BYTES = 63;

/** Quote an identifier for PostgreSQL. Callers validate the name first; this only escapes. */
export const quoteIdent = (name: string): string => `"${name.replaceAll('"', '""')}"`;

/** Why a name cannot be used, in plain language, or `undefined` when it is fine. */
export function nameProblem(name: string, what: string): string | undefined {
  if (name.trim() === '') return `A ${what} has no name yet.`;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(name))
    return `The ${what} name "${name}" has a control character.`;
  if (new TextEncoder().encode(name).length > MAX_IDENTIFIER_BYTES) {
    return `The ${what} name "${name.slice(0, 20)}..." is longer than ${MAX_IDENTIFIER_BYTES} bytes; PostgreSQL cuts longer names.`;
  }
  return undefined;
}

const dupes = (names: readonly string[]): readonly string[] => [
  ...new Set(names.filter((n, i) => names.indexOf(n) !== i)),
];

/**
 * Problems found before anything is sent to the database. Empty means the draft can become DDL.
 * Messages are plain language and name the table or column.
 */
export function validateDraft(draft: SchemaDraft): readonly string[] {
  const problems: string[] = [];
  if (draft.tables.length === 0) return ['The design has no tables yet.'];
  for (const t of draft.tables) {
    const tp = nameProblem(t.name, 'table');
    if (tp !== undefined) problems.push(tp);
    if (t.columns.length === 0) problems.push(`The table "${t.name}" has no columns.`);
    for (const c of t.columns) {
      const cp = nameProblem(c.name, `column of "${t.name}"`);
      if (cp !== undefined) problems.push(cp);
    }
    for (const d of dupes(t.columns.map((c) => c.name))) {
      problems.push(`The table "${t.name}" has two columns called "${d}".`);
    }
  }
  for (const d of dupes(draft.tables.map((t) => t.name))) {
    problems.push(`Two tables are called "${d}".`);
  }
  for (const t of draft.tables) {
    for (const c of t.columns) {
      const ref = c.references;
      if (ref === undefined) continue;
      const target = draft.tables.find((x) => x.name === ref.table);
      const targetColumn = target?.columns.find((x) => x.name === ref.column);
      if (target === undefined) {
        problems.push(
          `"${t.name}.${c.name}" points at the table "${ref.table}", which is not in your design.`,
        );
      } else if (targetColumn === undefined) {
        problems.push(
          `"${t.name}.${c.name}" points at "${ref.table}.${ref.column}", which does not exist.`,
        );
      } else {
        const soloKey =
          targetColumn.primaryKey && target.columns.filter((x) => x.primaryKey).length === 1;
        const uniqueAlone = targetColumn.unique && !targetColumn.primaryKey;
        if (!soloKey && !uniqueAlone) {
          problems.push(
            targetColumn.primaryKey
              ? `"${ref.table}.${ref.column}" is only part of a composite primary key, so "${t.name}.${c.name}" cannot point at it alone.`
              : `"${t.name}.${c.name}" points at "${ref.table}.${ref.column}", but a foreign key needs a column that is the primary key or unique.`,
          );
        }
      }
    }
  }
  return problems;
}

export interface DdlOptions {
  /**
   * Columns the scenarios talk about, as `table` and `column` names. When given, every other
   * non-key column is created nullable, so scenario rows can be small. Without it every
   * constraint is emitted as drawn.
   */
  readonly mapped?: ReadonlySet<string>;
}

/** Key used in `DdlOptions.mapped`. */
export const columnKey = (table: string, column: string): string => `${table}\u0000${column}`;

function columnSql(
  t: TableDraft,
  c: ColumnDraft,
  options: DdlOptions,
  compositeKey: boolean,
): string {
  const relaxed =
    options.mapped !== undefined && !options.mapped.has(columnKey(t.name, c.name)) && !c.primaryKey;
  const parts = [quoteIdent(c.name), c.type];
  if (c.primaryKey && !compositeKey) parts.push('primary key');
  else if (!c.nullable && !c.primaryKey && !relaxed) parts.push('not null');
  if (c.unique && !c.primaryKey) parts.push('unique');
  return parts.join(' ');
}

/**
 * The statements for a draft: one `create table` per table, then one `alter table` per foreign
 * key (so tables may point at each other in any order). Names are quoted; call `validateDraft`
 * first, because this function does not reject bad names.
 */
export function draftToDdl(draft: SchemaDraft, options: DdlOptions = {}): readonly string[] {
  const creates = draft.tables.map((t) => {
    const keys = t.columns.filter((c) => c.primaryKey);
    const composite = keys.length > 1;
    const lines = t.columns.map((c) => `  ${columnSql(t, c, options, composite)}`);
    if (composite) lines.push(`  primary key (${keys.map((k) => quoteIdent(k.name)).join(', ')})`);
    return `create table ${quoteIdent(t.name)} (\n${lines.join(',\n')}\n)`;
  });
  const alters = draft.tables.flatMap((t) =>
    t.columns.flatMap((c) =>
      c.references === undefined
        ? []
        : [
            `alter table ${quoteIdent(t.name)} add foreign key (${quoteIdent(c.name)}) references ${quoteIdent(c.references.table)} (${quoteIdent(c.references.column)}) on delete ${c.references.onDelete}`,
          ],
    ),
  );
  return [...creates, ...alters];
}

// ---------------------------------------------------------------------------------------------
// Roles

/** Problems with a role mapping, in plain language. Empty means every role points at something real. */
export function checkRoleMap(
  roles: readonly DesignRole[],
  draft: SchemaDraft,
  map: RoleMap,
): readonly string[] {
  const problems: string[] = [];
  for (const role of roles) {
    const name = map[role.id];
    if (name === undefined || name === '') {
      problems.push(`Pick your table or column for "${role.label}".`);
      continue;
    }
    if (role.kind === 'table') {
      if (!draft.tables.some((t) => t.name === name)) {
        problems.push(`"${name}" is not a table in your design (for "${role.label}").`);
      }
      continue;
    }
    const tableName = role.table === undefined ? undefined : map[role.table];
    const table = draft.tables.find((t) => t.name === tableName);
    if (table === undefined) {
      problems.push(`"${role.label}" needs its table to be picked first.`);
    } else if (!table.columns.some((c) => c.name === name)) {
      problems.push(`"${name}" is not a column of "${table.name}" (for "${role.label}").`);
    } else {
      const twin = roles.find(
        (other) =>
          other.id < role.id &&
          other.kind === 'column' &&
          map[other.id] === name &&
          map[other.table ?? ''] === tableName,
      );
      if (twin !== undefined) {
        problems.push(
          `You picked "${name}" for both "${twin.label}" and "${role.label}". Each needs its own column.`,
        );
      }
    }
  }
  return problems;
}

/** The `{table, column}` keys of every mapped column, for `DdlOptions.mapped`. */
export function mappedColumns(roles: readonly DesignRole[], map: RoleMap): ReadonlySet<string> {
  const keys = new Set<string>();
  for (const role of roles) {
    const name = map[role.id];
    const table = role.table === undefined ? undefined : map[role.table];
    if (role.kind === 'column' && name !== undefined && table !== undefined) {
      keys.add(columnKey(table, name));
    }
  }
  return keys;
}

/** Replace `{{roleId}}` with the learner's quoted name. An unknown or unmapped role throws. */
export function fillTemplate(sql: string, map: RoleMap): string {
  return sql.replace(/\{\{\s*([A-Za-z][A-Za-z0-9_]*)\s*\}\}/g, (_all, id: string) => {
    const name = map[id];
    if (name === undefined)
      throw new Error(`the scenario uses the role "${id}", which is not mapped`);
    return quoteIdent(name);
  });
}

/** Every `{{roleId}}` in the SQL templates of a scenario. */
export function rolesUsed(s: Scenario): readonly string[] {
  const all = [...s.setupSql, s.probeSql].flatMap((sql) =>
    [...sql.matchAll(/\{\{\s*([A-Za-z][A-Za-z0-9_]*)\s*\}\}/g)].map((m) => m[1] ?? ''),
  );
  return [...new Set(all)];
}

// ---------------------------------------------------------------------------------------------
// Scenario runner

/** The part of `SqlSession` the runner needs, so this package does not depend on the engine. */
export interface ScenarioSession {
  execute(sql: string): Promise<
    | {
        readonly ok: true;
        readonly result: {
          readonly rows: readonly (readonly unknown[])[];
          readonly rowCount: number;
        };
      }
    | { readonly ok: false; readonly sqlState: string; readonly message: string }
  >;
  reset(): Promise<void>;
  close(): Promise<void>;
}
export interface ScenarioEngine {
  open(seedSql: string): Promise<ScenarioSession>;
}

export interface ScenarioResult {
  readonly id: string;
  readonly story: string;
  readonly status: 'passed' | 'failed';
  /** The statement that was tried, with the learner's names filled in. */
  readonly statement: string;
  /** What the database answered, in one line. */
  readonly answer: string;
  /** Plain-language explanation; set when the scenario failed. */
  readonly explanation: string | undefined;
  readonly hint: string | undefined;
  readonly misconception: string;
}

export type DesignReport =
  | { readonly phase: 'invalid'; readonly problems: readonly string[] }
  | { readonly phase: 'ddlFailed'; readonly message: string }
  | {
      readonly phase: 'ran';
      readonly allPassed: boolean;
      readonly results: readonly ScenarioResult[];
    };

const STATE_MEANING: Readonly<Record<string, string>> = {
  '23503': 'a value pointed at a row that does not exist (foreign key)',
  '23505': 'a value that must be unique was repeated (unique or primary key)',
  '23502': 'a required value was missing (not null)',
  '23514': 'a value broke a check rule',
  '42P01': 'a table does not exist',
  '42703': 'a column does not exist',
};

/** One line on what the database answered. */
export function describeAnswer(outcome: Awaited<ReturnType<ScenarioSession['execute']>>): string {
  if (outcome.ok) {
    return outcome.result.rows.length > 0
      ? `Accepted. Rows: ${JSON.stringify(outcome.result.rows)}`
      : 'Accepted.';
  }
  const meaning = STATE_MEANING[outcome.sqlState];
  return `Refused (${outcome.sqlState}${meaning === undefined ? '' : `, ${meaning}`}): ${outcome.message}`;
}

const cell = (v: unknown): string | null => (v === null || v === undefined ? null : String(v));
export const sameRows = (
  a: readonly (readonly unknown[])[],
  b: readonly (readonly unknown[])[],
): boolean =>
  JSON.stringify(a.map((r) => r.map(cell))) === JSON.stringify(b.map((r) => r.map(cell)));

/** Judge one outcome against an expectation. Returns an explanation when it does not match. */
export function judge(
  expected: Expectation,
  outcome: Awaited<ReturnType<ScenarioSession['execute']>>,
): string | undefined {
  switch (expected.kind) {
    case 'succeeds':
      return outcome.ok ? undefined : 'Your design refused a statement that should have worked.';
    case 'fails':
      if (outcome.ok) return 'Your design accepted a statement that should have been refused.';
      return outcome.sqlState === expected.sqlState
        ? undefined
        : `Your design refused it, but for another reason than this rule (it expected ${expected.sqlState}, the database said ${outcome.sqlState}).`;
    case 'returns':
      if (!outcome.ok) return 'Your design could not answer the question this rule asks.';
      return sameRows(expected.rows, outcome.result.rows)
        ? undefined
        : 'Your design answered, but with different rows than the rule needs.';
    default: {
      const never: never = expected;
      return never;
    }
  }
}

const SETUP_FAILED =
  'The test rows could not be created in your design, so this rule could not be checked.';

/**
 * Run every scenario against the draft. The draft becomes DDL (columns that no role names are
 * nullable, so test rows stay small), the DDL seeds a fresh session, and each scenario runs
 * inside a transaction that is rolled back, so scenarios cannot see each other.
 */
export async function runScenarios(input: {
  readonly engine: ScenarioEngine;
  readonly draft: SchemaDraft;
  readonly roles: readonly DesignRole[];
  readonly map: RoleMap;
  readonly scenarios: readonly Scenario[];
}): Promise<DesignReport> {
  const { engine, draft, roles, map, scenarios } = input;
  const problems = [...validateDraft(draft), ...checkRoleMap(roles, draft, map)];
  if (problems.length > 0) return { phase: 'invalid', problems };
  const script = draftToDdl(draft, { mapped: mappedColumns(roles, map) }).join(';\n');
  let session: ScenarioSession;
  try {
    session = await engine.open(script);
  } catch (error) {
    return { phase: 'ddlFailed', message: error instanceof Error ? error.message : String(error) };
  }
  try {
    const results: ScenarioResult[] = [];
    for (const s of scenarios) results.push(await runOne(session, s, map));
    return { phase: 'ran', allPassed: results.every((r) => r.status === 'passed'), results };
  } finally {
    await session.close().catch(() => undefined);
  }
}

async function runOne(
  session: ScenarioSession,
  s: Scenario,
  map: RoleMap,
): Promise<ScenarioResult> {
  const base = { id: s.id, story: s.story, misconception: s.misconception };
  let setup: readonly string[];
  let probe: string;
  try {
    setup = s.setupSql.map((sql) => fillTemplate(sql, map));
    probe = fillTemplate(s.probeSql, map);
  } catch (error) {
    return {
      ...base,
      status: 'failed',
      statement: s.probeSql,
      answer: error instanceof Error ? error.message : String(error),
      explanation: SETUP_FAILED,
      hint: s.hintOnFail,
    };
  }
  await session.execute('begin');
  try {
    for (const sql of setup) {
      const outcome = await session.execute(sql);
      if (!outcome.ok) {
        return {
          ...base,
          status: 'failed',
          statement: sql,
          answer: describeAnswer(outcome),
          explanation: SETUP_FAILED,
          hint: s.hintOnFail,
        };
      }
    }
    const outcome = await session.execute(probe);
    const explanation = judge(s.expect, outcome);
    return {
      ...base,
      status: explanation === undefined ? 'passed' : 'failed',
      statement: probe,
      answer: describeAnswer(outcome),
      explanation,
      hint: explanation === undefined ? undefined : s.hintOnFail,
    };
  } finally {
    const rolledBack = await session.execute('rollback');
    if (!rolledBack.ok) await session.reset();
  }
}

// ---------------------------------------------------------------------------------------------
// Authoring checks

/**
 * Check a design step the way `lesson check` does: every reference draft passes every scenario,
 * and every wrong draft fails the scenario it names. Returns problems; empty means the step is sound.
 */
export async function verifyDesignTask(
  engine: ScenarioEngine,
  task: DesignTask,
): Promise<readonly string[]> {
  const problems: string[] = [];
  const ids = task.scenarios.map((s) => s.id);
  for (const d of dupes(ids)) problems.push(`scenario id "${d}" is used twice`);
  const roleIds = new Set(task.roles.map((r) => r.id));
  for (const role of task.roles) {
    if (role.kind === 'column' && (role.table === undefined || !roleIds.has(role.table))) {
      problems.push(`column role "${role.id}" needs "table" to name a table role`);
    }
  }
  for (const s of task.scenarios) {
    for (const used of rolesUsed(s)) {
      if (!roleIds.has(used)) problems.push(`scenario "${s.id}" uses the unknown role "${used}"`);
    }
  }
  if (problems.length > 0) return problems;

  const run = (m: MappedDraft) =>
    runScenarios({
      engine,
      draft: m.draft,
      roles: task.roles,
      map: m.roles,
      scenarios: task.scenarios,
    });

  for (const ref of task.references) {
    const report = await run(ref);
    if (report.phase === 'invalid')
      problems.push(`reference "${ref.name}": ${report.problems.join(' ')}`);
    else if (report.phase === 'ddlFailed')
      problems.push(`reference "${ref.name}": ${report.message}`);
    else {
      for (const r of report.results.filter((x) => x.status === 'failed')) {
        problems.push(
          `reference "${ref.name}" fails scenario "${r.id}": ${r.explanation ?? ''} ${r.answer}`,
        );
      }
    }
  }
  for (const wrong of task.wrongDrafts) {
    if (!ids.includes(wrong.fails)) {
      problems.push(`wrong draft "${wrong.name}" names the unknown scenario "${wrong.fails}"`);
      continue;
    }
    const report = await run(wrong);
    if (report.phase === 'invalid')
      problems.push(`wrong draft "${wrong.name}": ${report.problems.join(' ')}`);
    else if (report.phase === 'ddlFailed')
      problems.push(`wrong draft "${wrong.name}": ${report.message}`);
    else if (report.results.find((r) => r.id === wrong.fails)?.status !== 'failed') {
      problems.push(`wrong draft "${wrong.name}" does not fail scenario "${wrong.fails}"`);
    }
  }
  if (task.wrongDrafts.length === 0)
    problems.push('the step lists no wrong draft; add one that fails a scenario');
  return problems;
}
