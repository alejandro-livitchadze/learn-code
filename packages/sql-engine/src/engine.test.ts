import { afterAll, describe, expect, it } from 'vitest';
import {
  SQLSTATE_TIMEOUT,
  buildResult,
  createFakeEngine,
  createInlineEngine,
  createWorkerEngine,
  createWorkerHandler,
  normalizeValue,
  type SqlOutcome,
  type SqlSession,
  type WorkerLike,
  type WorkerRequest,
} from './index';
import { createPglite } from './pglite';

const SEED = `
create table authors (id int primary key, name text not null);
create table books (id int primary key, author_id int references authors(id), title text, price numeric(6,2), added timestamptz);
insert into authors values (1, 'Ada'), (2, 'Linus');
insert into books values
  (1, 1, 'Notes', 12.50, '2026-01-02T03:04:05Z'),
  (2, 1, 'More Notes', 9.99, '2026-02-02T03:04:05Z'),
  (3, 2, 'Kernel', 30.00, null);
`;

function mustOk(o: SqlOutcome) {
  if (!o.ok) throw new Error(`${o.sqlState}: ${o.message}`);
  return o.result;
}

describe('normalizeValue', () => {
  it('turns non-JSON values into strings and keeps null', () => {
    expect(normalizeValue(null)).toBeNull();
    expect(normalizeValue(undefined)).toBeNull();
    expect(normalizeValue(10n ** 20n)).toBe('100000000000000000000');
    expect(normalizeValue(new Date('2026-01-02T03:04:05Z'))).toBe('2026-01-02T03:04:05.000Z');
    expect(normalizeValue(42)).toBe('42');
    expect(normalizeValue(true)).toBe('true');
    expect(normalizeValue(new Uint8Array([1, 255]))).toBe('\\x01ff');
    expect(normalizeValue({ a: 1n, b: [new Date(0)] })).toBe(
      '{"a":"1","b":["1970-01-01T00:00:00.000Z"]}',
    );
  });
  it('caps rows but keeps the true row count', () => {
    const r = buildResult(['n'], [[1], [2], [3]], 2);
    expect(r.rows).toEqual([['1'], ['2']]);
    expect(r.rowCount).toBe(3);
  });
});

describe('fake engine', () => {
  it('records executed SQL and returns scripted outcomes', async () => {
    const engine = createFakeEngine({
      respond: (sql, seed) => ({
        ok: true,
        result: { columns: ['sql', 'seed'], rows: [[sql, seed]], rowCount: 1 },
      }),
    });
    const s = await engine.open('seed!');
    expect(mustOk(await s.execute('select 1')).rows).toEqual([['select 1', 'seed!']]);
    await s.reset();
    await s.close();
    expect(engine.executed).toEqual(['select 1']);
    expect([engine.opened, engine.resets, engine.closed]).toEqual([1, 1, 1]);
  });
});

describe('PGlite inline adapter', () => {
  const engine = createInlineEngine({ maxRows: 2 });
  const sessions: SqlSession[] = [];
  afterAll(async () => {
    for (const s of sessions) await s.close();
  });
  const open = async () => {
    const s = await engine.open(SEED);
    sessions.push(s);
    return s;
  };

  it('runs a join and returns normalized strings with real column names', async () => {
    const s = await open();
    const r = mustOk(
      await s.execute(
        'select a.name, b.title, b.price, b.added from books b join authors a on a.id = b.author_id order by b.id limit 2',
      ),
    );
    expect(r.columns).toEqual(['name', 'title', 'price', 'added']);
    expect(r.rows).toEqual([
      ['Ada', 'Notes', '12.50', '2026-01-02 03:04:05+00'],
      ['Ada', 'More Notes', '9.99', '2026-02-02 03:04:05+00'],
    ]);
  });

  it('keeps duplicate column names and null, and caps rows', async () => {
    const s = await open();
    const r = mustOk(
      await s.execute(
        'select a.id, b.id, b.added from books b join authors a on a.id = b.author_id order by b.id',
      ),
    );
    expect(r.columns).toEqual(['id', 'id', 'added']);
    expect(r.rowCount).toBe(3);
    expect(r.rows).toHaveLength(2);
    const last = mustOk(await s.execute('select added from books where id = 3'));
    expect(last.rows).toEqual([[null]]);
  });

  it('returns bigint and numeric as strings', async () => {
    const s = await open();
    const r = mustOk(await s.execute('select 9007199254740993::bigint as big, 1.50::numeric as n'));
    expect(r.rows).toEqual([['9007199254740993', '1.50']]);
  });

  it('reports a syntax error with SQLSTATE, message and position', async () => {
    const s = await open();
    const o = await s.execute('select * form books');
    expect(o.ok).toBe(false);
    if (o.ok) return;
    expect(o.sqlState).toBe('42601');
    expect(o.message).toContain('syntax error');
    expect(o.position).toBe(10);
  });

  it('reports a missing table with its SQLSTATE', async () => {
    const s = await open();
    const o = await s.execute('select * from nope');
    expect(o.ok).toBe(false);
    if (!o.ok) expect(o.sqlState).toBe('42P01');
  });

  it('returns the last statement of a script and survives an error', async () => {
    const s = await open();
    const r = mustOk(
      await s.execute(
        'create table t (a int); insert into t values (1),(2); select count(*) from t',
      ),
    );
    expect(r.rows).toEqual([['2']]);
    expect((await s.execute('select * from nope')).ok).toBe(false);
    expect(mustOk(await s.execute('select 1')).rows).toEqual([['1']]);
  });

  it('reset drops learner changes and re-seeds', async () => {
    const s = await open();
    mustOk(await s.execute('create table scratch (a int); delete from books'));
    await s.reset();
    expect(mustOk(await s.execute('select count(*) from books')).rows).toEqual([['3']]);
    expect((await s.execute('select * from scratch')).ok).toBe(false);
  });

  describe('reset always restores a fresh database', () => {
    const snapshot = async (s: SqlSession) =>
      mustOk(
        await s.execute(
          `select
             (select string_agg(nspname, ',' order by nspname) from pg_namespace
               where nspname !~ '^pg_' and nspname <> 'information_schema') as schemas,
             (select string_agg(table_name, ',' order by table_name) from information_schema.tables
               where table_schema = 'public') as tables,
             (select count(*) from books) as books,
             current_setting('search_path') as search_path,
             current_setting('work_mem') as work_mem,
             current_setting('transaction_isolation') as isolation,
             txid_current_if_assigned() is null as no_tx_id`,
        ),
      ).rows;

    const cases: readonly (readonly [string, string])[] = [
      ['an aborted transaction', 'begin; select 1/0'],
      ['an open transaction', 'begin; delete from books; create table scratch (a int)'],
      ['a changed search_path', 'set search_path to nowhere'],
      ['an extra schema', 'create schema keep; create table keep.x (a int)'],
      [
        'a changed session setting',
        "set work_mem = '8MB'; set transaction_isolation = 'serializable'",
      ],
    ];

    for (const [name, sql] of cases) {
      it(`after ${name}`, async () => {
        const s = await open();
        const fresh = await snapshot(s);
        await s.execute(sql);
        await s.reset();
        expect(await snapshot(s)).toEqual(fresh);
        expect((await s.execute('select * from scratch')).ok).toBe(false);
        expect((await s.execute('select * from keep.x')).ok).toBe(false);
      });
    }

    it('leaves the session usable after a failed reset, and a later reset works', async () => {
      let failNext = false;
      let created = 0;
      const flaky = createInlineEngine({
        createDatabase: async () => {
          created += 1;
          if (failNext) {
            failNext = false;
            throw new Error('out of memory');
          }
          return createPglite();
        },
      });
      const s = await flaky.open(SEED);
      sessions.push(s);
      mustOk(await s.execute('delete from books'));
      failNext = true;
      await expect(s.reset()).rejects.toThrow('out of memory');
      expect(mustOk(await s.execute('select count(*) from books')).rows).toEqual([['0']]);
      await s.reset();
      expect(mustOk(await s.execute('select count(*) from books')).rows).toEqual([['3']]);
      expect(created).toBe(3);
    });
  });

  it('rejects open when the seed is broken', async () => {
    await expect(engine.open('create tabel x')).rejects.toThrow();
  });

  it('keeps sessions isolated', async () => {
    const a = await open();
    const b = await open();
    mustOk(await a.execute('delete from books'));
    expect(mustOk(await b.execute('select count(*) from books')).rows).toEqual([['3']]);
  });
});

/** Runs the worker handler in-process. `hangOn` makes a matching query never answer. */
function inProcessWorkers(hangOn: string) {
  const workers: { terminated: boolean }[] = [];
  const create = (): WorkerLike => {
    const state = { terminated: false };
    workers.push(state);
    const self: WorkerLike = {
      onmessage: null,
      onerror: null,
      terminate() {
        state.terminated = true;
      },
      postMessage(message: WorkerRequest) {
        if (message.type === 'exec' && message.sql.includes(hangOn)) return;
        void handle(message);
      },
    };
    const handle = createWorkerHandler(createPglite, (response) => {
      if (!state.terminated) queueMicrotask(() => self.onmessage?.({ data: response }));
    });
    return self;
  };
  return { create, workers };
}

describe('worker adapter', () => {
  it('runs queries through the message protocol', async () => {
    const { create } = inProcessWorkers('@@never@@');
    const s = await createWorkerEngine({ createWorker: create }).open(SEED);
    const r = mustOk(await s.execute('select count(*) from books'));
    expect(r.rows).toEqual([['3']]);
    const bad = await s.execute('select * form books');
    expect(!bad.ok && bad.sqlState).toBe('42601');
    await s.reset();
    await s.close();
  });

  it('reset recovers from an aborted transaction and a changed search_path', async () => {
    const { create } = inProcessWorkers('@@never@@');
    const s = await createWorkerEngine({ createWorker: create }).open(SEED);
    await s.execute('begin; select 1/0');
    await s.reset();
    expect(mustOk(await s.execute('select count(*) from books')).rows).toEqual([['3']]);
    await s.execute('set search_path to nowhere');
    await s.reset();
    expect(mustOk(await s.execute('select count(*) from books')).rows).toEqual([['3']]);
    expect(mustOk(await s.execute('show search_path')).rows).toEqual([['public']]);
    await s.close();
  });

  it('ends a runaway query with a timeout and the next query works on a fresh, re-seeded database', async () => {
    const { create, workers } = inProcessWorkers('pg_sleep');
    const s = await createWorkerEngine({ createWorker: create, timeoutMs: 100 }).open(SEED);
    mustOk(await s.execute('delete from books'));
    const o = await s.execute('select pg_sleep(1000)');
    expect(o.ok).toBe(false);
    if (!o.ok) {
      expect(o.sqlState).toBe(SQLSTATE_TIMEOUT);
      expect(o.message).toContain('timed out');
    }
    expect(workers[0]?.terminated).toBe(true);
    expect(workers).toHaveLength(1);
    expect(mustOk(await s.execute('select count(*) from books')).rows).toEqual([['3']]);
    expect(workers).toHaveLength(2);
    await s.close();
    expect(workers[1]?.terminated).toBe(true);
  });

  it('fails on a closed session without hanging', async () => {
    const { create } = inProcessWorkers('@@never@@');
    const s = await createWorkerEngine({ createWorker: create }).open('');
    await s.close();
    const o = await s.execute('select 1');
    expect(o.ok).toBe(false);
  });
});
