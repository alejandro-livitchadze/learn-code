'use client';

import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import type { SqlEngine, SqlResult } from '@learn-code/sql-engine';
import { Markdown } from '../markdown';
import type { StepComponentProps, StepOfKind } from '../types';
import type { ResultDiff } from './compare';
import { LabController, type RunReport } from './controller';
import { SqlEditor, type EditorError } from './SqlEditor';
import type { SchemaTable } from './schema';
import { SQL_LAB_CSS } from './styles';

type SqlLabStep = StepOfKind<'sqlLab'>;

/** What the host app supplies. The widget never imports an engine implementation. */
export interface SqlLabDeps {
  /** Resolves the engine; the host loads the PGlite adapter lazily inside this function. */
  readonly getEngine: () => Promise<SqlEngine>;
  /** Returns the seed SQL for `seedRef` (the step's `seedRef`). */
  readonly loadSeed: (seedRef: string) => Promise<string>;
}

type Phase =
  | { readonly kind: 'idle' }
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready' }
  | { readonly kind: 'failed'; readonly message: string };

const MAX_DIFF_ROWS = 10;

function restoredSql(restored: StepComponentProps<SqlLabStep>['restored']): string | undefined {
  if (restored?.status !== 'answered') return undefined;
  const payload: unknown = restored.payload;
  if (typeof payload !== 'object' || payload === null) return undefined;
  const sql: unknown = Reflect.get(payload, 'sql');
  return typeof sql === 'string' ? sql : undefined;
}

function Grid({
  columns,
  rows,
  mark,
  caption,
}: {
  readonly columns: readonly string[];
  readonly rows: readonly (readonly unknown[])[];
  readonly mark?: 'missing' | 'extra';
  readonly caption: string;
}) {
  return (
    <div className="sl-grid-wrap" tabIndex={0} role="region" aria-label={caption}>
      <table className="sl-grid">
        <caption className="w-tag">{caption}</caption>
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={i}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} data-diff={mark}>
              {row.map((cell, c) => (
                <td key={c}>
                  {cell === null ? <span className="sl-null">NULL</span> : String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`;

function DiffView({
  diff,
  expected,
}: {
  readonly diff: ResultDiff;
  readonly expected: readonly string[];
}) {
  if (diff.missingColumns.length > 0 || diff.extraColumns.length > 0) {
    return (
      <div className="sl-diff" role="status">
        <p className="w-tag w-tag-bad">Wrong columns</p>
        {diff.missingColumns.length > 0 && (
          <p>
            Missing: <code>{diff.missingColumns.join(', ')}</code>
          </p>
        )}
        {diff.extraColumns.length > 0 && (
          <p>
            Not expected: <code>{diff.extraColumns.join(', ')}</code>
          </p>
        )}
      </div>
    );
  }
  return (
    <div className="sl-diff" role="status">
      <p className="w-tag w-tag-bad">Not the expected result yet</p>
      {diff.truncated && (
        <p>Your query returned more rows than can be shown. Narrow it down and try again.</p>
      )}
      {diff.orderMismatch && <p>You have the right rows, but this task needs a specific order.</p>}
      {diff.missingRows.length > 0 && (
        <Grid
          columns={expected}
          rows={diff.missingRows.slice(0, MAX_DIFF_ROWS)}
          mark="missing"
          caption={`Missing ${plural(diff.missingRows.length, 'row')}`}
        />
      )}
      {diff.extraRows.length > 0 && (
        <Grid
          columns={expected}
          rows={diff.extraRows.slice(0, MAX_DIFF_ROWS)}
          mark="extra"
          caption={`Extra ${plural(diff.extraRows.length, 'row')}`}
        />
      )}
    </div>
  );
}

function SqlLabView({
  step,
  restored,
  onComplete,
  deps,
}: StepComponentProps<SqlLabStep> & { readonly deps: SqlLabDeps }) {
  const savedSql = restoredSql(restored);
  const wasSolved = restored?.status === 'answered';
  const [sql, setSql] = useState(savedSql ?? step.starter);
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [schema, setSchema] = useState<readonly SchemaTable[]>([]);
  const [report, setReport] = useState<RunReport | undefined>(undefined);
  const [expectedColumns, setExpectedColumns] = useState<readonly string[]>([]);
  const [running, setRunning] = useState(false);
  const [solved, setSolved] = useState(wasSolved);
  const [hintsShown, setHintsShown] = useState(0);
  const controller = useRef<Promise<LabController> | undefined>(undefined);
  const completed = useRef(wasSolved);
  const stepRef = useRef(step);
  stepRef.current = step;

  const ensure = useCallback((): Promise<LabController> => {
    if (controller.current !== undefined) return controller.current;
    setPhase({ kind: 'loading' });
    const started = (async () => {
      const current = stepRef.current;
      const [engine, seedSql] = await Promise.all([
        deps.getEngine(),
        deps.loadSeed(current.seedRef),
      ]);
      const lab = new LabController({
        engine,
        seedSql,
        solution: current.solution,
        orderMatters: current.orderMatters,
      });
      try {
        setSchema(await lab.start());
      } catch (error) {
        await lab.close().catch(() => undefined);
        throw error;
      }
      if (restored?.status === 'answered') lab.setAttempts(restored.attempts);
      setPhase({ kind: 'ready' });
      return lab;
    })();
    controller.current = started;
    started.catch((error: unknown) => {
      controller.current = undefined;
      setPhase({
        kind: 'failed',
        message: error instanceof Error ? error.message : String(error),
      });
    });
    return started;
  }, [deps, restored]);

  useEffect(() => {
    // A solved step does not boot the database until the learner asks for it.
    if (!wasSolved) void ensure().catch(() => undefined);
    return () => {
      const pending = controller.current;
      controller.current = undefined;
      void pending?.then((lab) => lab.close()).catch(() => undefined);
    };
  }, [ensure, wasSolved]);

  const run = async () => {
    if (running || sql.trim() === '') return;
    setRunning(true);
    try {
      const lab = await ensure();
      const { report: next, schema: nextSchema } = await lab.run(sql);
      setReport(next);
      if (nextSchema !== undefined) setSchema(nextSchema);
      if (next.outcome.ok) setExpectedColumns(next.outcome.result.columns);
      if (next.correct) setSolved(true);
      if (next.correct && !completed.current) {
        completed.current = true;
        onComplete({
          status: 'answered',
          correct: true,
          attempts: next.attempts,
          payload: { sql },
        });
      }
    } catch {
      // `ensure` already moved the widget to the failed phase.
    } finally {
      setRunning(false);
    }
  };

  const reset = async () => {
    if (running) return;
    setRunning(true);
    try {
      const lab = await ensure();
      setSchema(await lab.reset());
      setReport(undefined);
    } catch (error) {
      setPhase({
        kind: 'failed',
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setRunning(false);
    }
  };

  const outcome = report?.outcome;
  const editorError: EditorError | undefined =
    outcome !== undefined && !outcome.ok && outcome.position !== undefined
      ? { position: outcome.position, message: outcome.message }
      : undefined;
  const result: SqlResult | undefined = outcome?.ok === true ? outcome.result : undefined;
  const loading = phase.kind === 'loading';

  return (
    <section className="w-widget" data-kind="sqlLab">
      <style>{SQL_LAB_CSS}</style>
      <p className="w-h">Write the query</p>
      <div className="w-prose">
        <Markdown text={step.prompt} />
      </div>
      {schema.length > 0 && (
        <ul className="sl-schema" aria-label="Tables in the database">
          {schema.map((t) => (
            <li key={t.name}>
              <strong>{t.name}</strong>
              {t.columns.map((c) => (
                <span key={c.name} style={{ display: 'block' }}>
                  {c.name} {c.type}
                </span>
              ))}
            </li>
          ))}
        </ul>
      )}
      <SqlEditor
        value={sql}
        onChange={(v) => {
          setSql(v);
          setReport((r) => (r !== undefined && !r.outcome.ok ? undefined : r));
        }}
        onRun={() => void run()}
        error={editorError}
        label="SQL query"
      />
      <div className="w-row">
        <button
          type="button"
          className="w-btn"
          onClick={() => void run()}
          disabled={running || loading}
        >
          {running ? 'Running…' : 'Run (Ctrl+Enter)'}
        </button>
        <button
          type="button"
          className="w-btn w-btn-quiet"
          onClick={() => void reset()}
          disabled={running || loading}
        >
          Reset database
        </button>
        {step.hints.length > 0 && hintsShown < step.hints.length && (
          <button
            type="button"
            className="w-btn w-btn-quiet"
            onClick={() => setHintsShown((n) => n + 1)}
          >
            Show a hint ({hintsShown} of {step.hints.length})
          </button>
        )}
      </div>
      {loading && (
        <p className="w-muted" role="status">
          Loading the database. The first time takes a few seconds.
        </p>
      )}
      {phase.kind === 'failed' && (
        <p className="sl-error" role="alert">
          {phase.message}
        </p>
      )}
      {step.hints.slice(0, hintsShown).map((h, i) => (
        <div key={i} className="w-prose">
          <Markdown text={h} />
        </div>
      ))}
      {outcome !== undefined && !outcome.ok && (
        <p className="sl-error" role="alert">
          {outcome.sqlState === '57014' ? '' : `ERROR ${outcome.sqlState}: `}
          {outcome.message}
          {outcome.position !== undefined && `\nPosition: ${outcome.position}`}
        </p>
      )}
      {result !== undefined && (
        <Grid
          columns={result.columns}
          rows={result.rows}
          caption={`Result: ${plural(result.rowCount, 'row')}${
            result.rowCount > result.rows.length ? `, showing the first ${result.rows.length}` : ''
          }`}
        />
      )}
      {report?.diff !== undefined && !report.diff.match && (
        <DiffView diff={report.diff} expected={expectedColumns} />
      )}
      {(report?.correct === true || (solved && report === undefined)) && (
        <p className="sl-ok" role="status">
          Correct. Your query returns the expected result.
        </p>
      )}
    </section>
  );
}

/** Build the registry component for `sqlLab`, bound to the host's engine and seed loader. */
export function createSqlLab(deps: SqlLabDeps): ComponentType<StepComponentProps<SqlLabStep>> {
  return function SqlLab(props: StepComponentProps<SqlLabStep>) {
    return <SqlLabView {...props} deps={deps} />;
  };
}
