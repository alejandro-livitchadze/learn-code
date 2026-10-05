import { describe, expect, it } from 'vitest';
import {
  checkRoleMap,
  draftToDdl,
  fillTemplate,
  judge,
  mappedColumns,
  quoteIdent,
  rolesUsed,
  runScenarios,
  sameRows,
  validateDraft,
  verifyDesignTask,
  type ColumnDraft,
  type DesignRole,
  type SchemaDraft,
  type Scenario,
  type ScenarioEngine,
  type ScenarioSession,
} from './design';

const col = (name: string, over: Partial<ColumnDraft> = {}): ColumnDraft => ({
  name,
  type: 'integer',
  nullable: false,
  unique: false,
  primaryKey: false,
  ...over,
});

const shop: SchemaDraft = {
  tables: [
    { name: 'customers', columns: [col('id', { primaryKey: true }), col('email', { type: 'text', unique: true })] },
    {
      name: 'orders',
      columns: [
        col('id', { primaryKey: true }),
        col('customer_id', { references: { table: 'customers', column: 'id', onDelete: 'restrict' } }),
        col('note', { type: 'text' }),
      ],
    },
  ],
};

describe('quoteIdent', () => {
  it('doubles embedded quotes', () => {
    expect(quoteIdent('a"b')).toBe('"a""b"');
  });
});

describe('draftToDdl', () => {
  it('writes tables first, then foreign keys, with quoted names', () => {
    expect(draftToDdl(shop)).toEqual([
      'create table "customers" (\n  "id" integer primary key,\n  "email" text not null unique\n)',
      'create table "orders" (\n  "id" integer primary key,\n  "customer_id" integer not null,\n  "note" text not null\n)',
      'alter table "orders" add foreign key ("customer_id") references "customers" ("id") on delete restrict',
    ]);
  });
  it('writes a composite primary key as a table constraint', () => {
    const ddl = draftToDdl({
      tables: [{ name: 'link', columns: [col('a', { primaryKey: true }), col('b', { primaryKey: true })] }],
    });
    expect(ddl).toEqual(['create table "link" (\n  "a" integer,\n  "b" integer,\n  primary key ("a", "b")\n)']);
  });
  it('keeps nullable columns nullable and escapes hostile names', () => {
    const [sql] = draftToDdl({ tables: [{ name: 'we"ird', columns: [col('x', { nullable: true })] }] });
    expect(sql).toBe('create table "we""ird" (\n  "x" integer\n)');
  });
  it('relaxes columns that no role names, but never keys or named columns', () => {
    const mapped = new Set(['orders\u0000customer_id']);
    const ddl = draftToDdl(shop, { mapped }).join('\n');
    expect(ddl).toContain('"note" text\n');
    expect(ddl).toContain('"customer_id" integer not null');
    expect(ddl).toContain('"id" integer primary key');
  });
});

describe('validateDraft', () => {
  it('accepts a sound draft', () => {
    expect(validateDraft(shop)).toEqual([]);
  });
  it('rejects empty, long, duplicate and control-character names before any SQL', () => {
    const bad: SchemaDraft = {
      tables: [
        { name: ' ', columns: [col('a')] },
        { name: 'x'.repeat(64), columns: [col('a'), col('a')] },
        { name: 'ok', columns: [col('bad\u0000name')] },
        { name: 'ok', columns: [] },
      ],
    };
    const problems = validateDraft(bad).join('\n');
    expect(problems).toContain('has no name yet');
    expect(problems).toContain('longer than 63 bytes');
    expect(problems).toContain('two columns called "a"');
    expect(problems).toContain('control character');
    expect(problems).toContain('Two tables are called "ok"');
    expect(problems).toContain('has no columns');
  });
  it('counts bytes, not characters', () => {
    const name = 'é'.repeat(32);
    expect(validateDraft({ tables: [{ name, columns: [col('a')] }] }).join()).toContain('longer than 63 bytes');
  });
  it('explains a foreign key that points nowhere or at a non-key', () => {
    const nowhere: SchemaDraft = {
      tables: [{ name: 'a', columns: [col('x', { references: { table: 'zzz', column: 'id', onDelete: 'cascade' } })] }],
    };
    expect(validateDraft(nowhere).join()).toContain('"zzz", which is not in your design');
    const nonKey: SchemaDraft = {
      tables: [
        { name: 'p', columns: [col('id', { primaryKey: true }), col('v')] },
        { name: 'c', columns: [col('x', { references: { table: 'p', column: 'v', onDelete: 'cascade' } })] },
      ],
    };
    expect(validateDraft(nonKey).join()).toContain('primary key or unique');
    const partial: SchemaDraft = {
      tables: [
        { name: 'p', columns: [col('a', { primaryKey: true }), col('b', { primaryKey: true })] },
        { name: 'c', columns: [col('x', { references: { table: 'p', column: 'a', onDelete: 'cascade' } })] },
      ],
    };
    expect(validateDraft(partial).join()).toContain('composite primary key');
    expect(validateDraft({ tables: [] })).toEqual(['The design has no tables yet.']);
  });
});

const roles: readonly DesignRole[] = [
  { id: 'customers', label: 'the customers table', kind: 'table' },
  { id: 'customerId', label: 'the customer key', kind: 'column', table: 'customers' },
  { id: 'orders', label: 'the orders table', kind: 'table' },
  { id: 'orderCustomer', label: "the order's customer", kind: 'column', table: 'orders' },
];
const map = { customers: 'customers', customerId: 'id', orders: 'orders', orderCustomer: 'customer_id' };

describe('roles', () => {
  it('accepts a complete mapping and reports each gap in plain language', () => {
    expect(checkRoleMap(roles, shop, map)).toEqual([]);
    const problems = checkRoleMap(roles, shop, { customers: 'nope', orders: 'orders', orderCustomer: 'zzz' }).join('\n');
    expect(problems).toContain('"nope" is not a table in your design');
    expect(problems).toContain('Pick your table or column for "the customer key"');
    expect(problems).toContain('"zzz" is not a column of "orders"');
  });
  it('refuses one column for two roles', () => {
    const twice = { ...map, orderCustomer: 'id' };
    expect(checkRoleMap(roles, shop, twice).join()).toContain('for both');
  });
  it('lists the mapped columns with their tables', () => {
    expect([...mappedColumns(roles, map)].sort()).toEqual(['customers\u0000id', 'orders\u0000customer_id']);
  });
  it('fills templates with quoted names and refuses an unmapped role', () => {
    expect(fillTemplate('insert into {{orders}} ({{orderCustomer}}) values (1)', map)).toBe(
      'insert into "orders" ("customer_id") values (1)',
    );
    expect(() => fillTemplate('select {{missing}}', map)).toThrow(/not mapped/);
  });
  it('finds the roles a scenario uses', () => {
    const s = { setupSql: ['select {{a}}'], probeSql: 'select {{b}}, {{a}}' } as unknown as Scenario;
    expect(rolesUsed(s)).toEqual(['a', 'b']);
  });
});

describe('judge and sameRows', () => {
  it('matches the three expectation kinds', () => {
    const ok = { ok: true as const, result: { rows: [[1]], rowCount: 1 } };
    const err = { ok: false as const, sqlState: '23503', message: 'm' };
    expect(judge({ kind: 'succeeds' }, ok)).toBeUndefined();
    expect(judge({ kind: 'succeeds' }, err)).toContain('refused a statement');
    expect(judge({ kind: 'fails', sqlState: '23503' }, err)).toBeUndefined();
    expect(judge({ kind: 'fails', sqlState: '23503' }, ok)).toContain('accepted');
    expect(judge({ kind: 'fails', sqlState: '23505' }, err)).toContain('another reason');
    expect(judge({ kind: 'returns', rows: [['1']] }, ok)).toBeUndefined();
    expect(judge({ kind: 'returns', rows: [['2']] }, ok)).toContain('different rows');
    expect(judge({ kind: 'returns', rows: [] }, err)).toContain('could not answer');
  });
  it('compares cells as strings and null as null', () => {
    expect(sameRows([[1, null]], [['1', null]])).toBe(true);
    expect(sameRows([[1]], [[1], [2]])).toBe(false);
  });
});

/** A session that answers by pattern, so the runner is tested without a database. */
function stubEngine(answer: (sql: string) => ReturnType<ScenarioSession['execute']>): {
  engine: ScenarioEngine;
  log: string[];
  seeds: string[];
} {
  const log: string[] = [];
  const seeds: string[] = [];
  return {
    log,
    seeds,
    engine: {
      open: (seed) => {
        seeds.push(seed);
        return Promise.resolve({
          execute: (sql) => {
            log.push(sql);
            return answer(sql);
          },
          reset: () => Promise.resolve(),
          close: () => Promise.resolve(),
        });
      },
    },
  };
}

const fkScenario: Scenario = {
  id: 'fk',
  story: 'An order must belong to an existing customer.',
  setupSql: [],
  probeSql: 'insert into {{orders}} ({{orderCustomer}}) values (999)',
  expect: { kind: 'fails', sqlState: '23503' },
  hintOnFail: 'Connect the order to the customer.',
  misconception: 'app-validation-is-enough',
};

describe('runScenarios', () => {
  it('returns problems without touching the engine for an invalid design', async () => {
    const { engine, seeds } = stubEngine(() => Promise.reject(new Error('unused')));
    const report = await runScenarios({
      engine,
      draft: { tables: [] },
      roles,
      map,
      scenarios: [fkScenario],
    });
    expect(report.phase).toBe('invalid');
    expect(seeds).toEqual([]);
  });
  it('seeds with the DDL, wraps each scenario in a rolled back transaction and reports passes', async () => {
    const { engine, log, seeds } = stubEngine((sql) =>
      Promise.resolve(
        sql.startsWith('insert')
          ? { ok: false as const, sqlState: '23503', message: 'violates foreign key' }
          : { ok: true as const, result: { rows: [], rowCount: 0 } },
      ),
    );
    const report = await runScenarios({ engine, draft: shop, roles, map, scenarios: [fkScenario] });
    expect(seeds[0]).toContain('create table "customers"');
    expect(seeds[0]).toContain('"note" text\n');
    expect(log).toEqual(['begin', 'insert into "orders" ("customer_id") values (999)', 'rollback']);
    expect(report).toMatchObject({ phase: 'ran', allPassed: true });
  });
  it('fails a scenario with the story, the statement, the answer and the hint', async () => {
    const { engine } = stubEngine(() => Promise.resolve({ ok: true as const, result: { rows: [], rowCount: 0 } }));
    const report = await runScenarios({ engine, draft: shop, roles, map, scenarios: [fkScenario] });
    if (report.phase !== 'ran') throw new Error('expected a run');
    expect(report.allPassed).toBe(false);
    expect(report.results[0]).toMatchObject({
      status: 'failed',
      story: 'An order must belong to an existing customer.',
      statement: 'insert into "orders" ("customer_id") values (999)',
      answer: 'Accepted.',
      hint: 'Connect the order to the customer.',
    });
    expect(report.results[0]?.explanation).toContain('should have been refused');
  });
  it('reports a setup that cannot run instead of a pass', async () => {
    const { engine } = stubEngine((sql) =>
      Promise.resolve(
        sql.startsWith('insert') ? { ok: false as const, sqlState: '23502', message: 'null value' } : { ok: true as const, result: { rows: [], rowCount: 0 } },
      ),
    );
    const withSetup: Scenario = { ...fkScenario, setupSql: ['insert into {{customers}} ({{customerId}}) values (1)'] };
    const report = await runScenarios({ engine, draft: shop, roles, map, scenarios: [withSetup] });
    if (report.phase !== 'ran') throw new Error('expected a run');
    expect(report.results[0]?.status).toBe('failed');
    expect(report.results[0]?.explanation).toContain('could not be created');
    expect(report.results[0]?.answer).toContain('23502');
  });
  it('reports a database that refuses the DDL', async () => {
    const engine: ScenarioEngine = { open: () => Promise.reject(new Error('relation does not exist')) };
    const report = await runScenarios({ engine, draft: shop, roles, map, scenarios: [fkScenario] });
    expect(report).toEqual({ phase: 'ddlFailed', message: 'relation does not exist' });
  });
});

describe('verifyDesignTask', () => {
  const task = {
    looseFields: [],
    roles,
    scenarios: [fkScenario],
    references: [{ name: 'ref', draft: shop, roles: map }],
    wrongDrafts: [{ name: 'no fk', draft: shop, roles: map, fails: 'fk' }],
  };
  it('flags a wrong draft that passes, and unknown scenario or role ids', async () => {
    const accepting = stubEngine((sql) =>
      Promise.resolve(
        sql.startsWith('insert')
          ? { ok: false as const, sqlState: '23503', message: 'x' }
          : { ok: true as const, result: { rows: [], rowCount: 0 } },
      ),
    );
    const problems = await verifyDesignTask(accepting.engine, task);
    expect(problems).toEqual(['wrong draft "no fk" does not fail scenario "fk"']);
    expect(
      await verifyDesignTask(accepting.engine, { ...task, wrongDrafts: [{ ...task.wrongDrafts[0]!, fails: 'zzz' }] }),
    ).toEqual(['wrong draft "no fk" names the unknown scenario "zzz"']);
    expect(
      await verifyDesignTask(accepting.engine, {
        ...task,
        scenarios: [{ ...fkScenario, probeSql: 'select {{ghost}}' }],
      }),
    ).toEqual(['scenario "fk" uses the unknown role "ghost"']);
  });
});
