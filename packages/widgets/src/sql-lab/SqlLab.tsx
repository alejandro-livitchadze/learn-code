'use client';

import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import type { SqlEngine, SqlResult } from '@learn-code/sql-engine';
import type { ResultDiff } from '@learn-code/sql-engine/compare';
import { Button, FeedbackBanner, HintLadder, InkCard } from '@learn-code/ui';
import { InMargin, WidgetFrame } from '../chrome';
import { Markdown } from '../markdown';
import type { StepComponentProps, StepOfKind } from '../types';
import { LabController, type RunReport } from './controller';
import { SqlEditor, type EditorError } from './SqlEditor';
import type { SchemaTable } from './schema';

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

const MAX_SHOWN_ROWS = 6;

/** Notebook table: ink header, mono rows. `expected` uses the danger border. */
function Grid({
  columns,
  rows,
  mark,
  caption,
  tone,
  flagged = [],
  more = false,
}: {
  readonly columns: readonly string[];
  readonly rows: readonly (readonly unknown[])[];
  readonly mark?: 'missing' | 'extra';
  readonly caption: string;
  readonly tone?: 'expected';
  /** Lower-case column names to underline (wrong or missing). */
  readonly flagged?: readonly string[];
  /** Show a faint "…" row after the rows. */
  readonly more?: boolean;
}) {
  return (
    <div className="sl-block" data-tone={tone}>
      <p className="w-label">{caption}</p>
      <div className="sl-grid-wrap" tabIndex={0} role="region" aria-label={caption}>
        <table className="sl-grid">
          <thead>
            <tr>
              {columns.map((c, i) =>
                flagged.includes(c.toLowerCase()) ? (
                  <th key={i} className="sl-flag">
                    {c}
                  </th>
                ) : (
                  <th key={i}>{c}</th>
                ),
              )}
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
            {more ? (
              <tr className="sl-more" aria-hidden="true">
                {columns.map((_, c) => (
                  <td key={c}>…</td>
                ))}
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`;
const names = (list: readonly string[]): string => list.join(', ');

/** One plain sentence on what is wrong, for the feedback banner. */
export function diffMessage(diff: ResultDiff): string {
  if (diff.missingColumns.length > 0 && diff.extraColumns.length > 0) {
    return `The columns do not match. Missing: ${names(diff.missingColumns)}. Not expected: ${names(diff.extraColumns)}.`;
  }
  if (diff.missingColumns.length > 0) {
    return `One or more columns are missing: ${names(diff.missingColumns)}.`;
  }
  if (diff.extraColumns.length > 0) {
    return `These columns are not expected: ${names(diff.extraColumns)}.`;
  }
  if (diff.truncated) {
    return 'Your query returned more rows than can be shown. Narrow it down and try again.';
  }
  if (diff.orderMismatch) return 'You have the right rows, but this task needs a specific order.';
  if (diff.missingRows.length > 0 || diff.extraRows.length > 0) {
    return `The columns match, but the rows differ: ${plural(diff.missingRows.length, 'row')} missing, ${plural(diff.extraRows.length, 'row')} extra.`;
  }
  return 'The row count is different from the expected result.';
}

/** The rows that differ, when the columns are right. Column problems are in the banner. */
export function DiffView({ diff }: { readonly diff: ResultDiff }) {
  if (diff.missingColumns.length > 0 || diff.extraColumns.length > 0) return null;
  if (diff.missingRows.length === 0 && diff.extraRows.length === 0) return null;
  return (
    <div className="sl-diff">
      {diff.missingRows.length > 0 && (
        <Grid
          columns={diff.expectedColumns}
          rows={diff.missingRows.slice(0, MAX_DIFF_ROWS)}
          mark="missing"
          caption={`Missing ${plural(diff.missingRows.length, 'row')}`}
        />
      )}
      {diff.extraRows.length > 0 && (
        <Grid
          columns={diff.expectedColumns}
          rows={diff.extraRows.slice(0, MAX_DIFF_ROWS)}
          mark="extra"
          caption={`Extra ${plural(diff.extraRows.length, 'row')}`}
        />
      )}
    </div>
  );
}

/** Hints are Markdown; the ladder prints plain text. */
const plainText = (md: string): string => md.replace(/[`*]/g, '');

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
  const [running, setRunning] = useState(false);
  const [solved, setSolved] = useState(wasSolved);
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
  const diff = report?.diff;
  const mismatch = diff !== undefined && !diff.match;
  const showSolved = report?.correct === true || (solved && report === undefined);

  const banner = showSolved ? (
    <FeedbackBanner correct title="Correct.">
      Your query returns the expected result.
    </FeedbackBanner>
  ) : mismatch ? (
    <FeedbackBanner correct={false} title="Not quite.">
      {diffMessage(diff)} Attempt {report?.attempts ?? 1}.
    </FeedbackBanner>
  ) : undefined;

  const shownRows = result?.rows.slice(0, MAX_SHOWN_ROWS) ?? [];
  const expected = report?.expected;

  return (
    <WidgetFrame
      kind="sqlLab"
      {...(banner === undefined ? {} : { banner })}
      lead={
        <div className="w-lead">
          <Markdown text={step.prompt} />
        </div>
      }
    >
      <InkCard>
        <div className="sl-frame">
          <div className="sl-bar">
            <span className="w-mono sl-file">query.sql</span>
            <div className="sl-actions">
              <Button onClick={() => void reset()} disabled={running || loading}>
                Reset database
              </Button>
              <Button variant="primary" onClick={() => void run()} disabled={running || loading}>
                {running ? 'Running…' : 'Run · Ctrl+Enter'}
              </Button>
            </div>
          </div>
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
        </div>
      </InkCard>
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
      {outcome !== undefined && !outcome.ok && (
        <p className="sl-error" role="alert">
          {outcome.sqlState === '57014' ? '' : `ERROR ${outcome.sqlState}: `}
          {outcome.message}
          {outcome.position !== undefined && `\nPosition: ${outcome.position}`}
        </p>
      )}
      {result !== undefined && (
        <div className="sl-results">
          <Grid
            columns={result.columns}
            rows={shownRows}
            more={result.rows.length > shownRows.length}
            flagged={diff?.extraColumns ?? []}
            caption={`Your result · ${plural(result.rowCount, 'row')}${
              result.rowCount > result.rows.length
                ? `, showing the first ${result.rows.length}`
                : ''
            }`}
          />
          {mismatch && expected !== undefined && (
            <Grid
              tone="expected"
              columns={expected.columns}
              rows={expected.rows.slice(0, MAX_SHOWN_ROWS)}
              more={expected.rows.length > MAX_SHOWN_ROWS}
              flagged={diff.missingColumns}
              caption={`Expected · ${plural(expected.rowCount, 'row')}`}
            />
          )}
        </div>
      )}
      {mismatch && <DiffView diff={diff} />}
      <InMargin>
        {schema.length > 0 && (
          <section className="sl-panel" aria-labelledby={`${step.id}-tables`}>
            <h3 className="w-label" id={`${step.id}-tables`}>
              Tables
            </h3>
            <ul className="sl-schema" aria-label="Tables in the database">
              {schema.map((t) => (
                <li key={t.name}>
                  <InkCard>
                    <strong>{t.name}</strong>
                    {t.columns.map((c) => (
                      <span key={c.name} className="sl-col">
                        {c.name} · {c.type}
                      </span>
                    ))}
                  </InkCard>
                </li>
              ))}
            </ul>
          </section>
        )}
        {step.hints.length > 0 && (
          <section className="sl-panel" aria-labelledby={`${step.id}-hints`}>
            <h3 className="w-label" id={`${step.id}-hints`}>
              Hints
            </h3>
            <HintLadder hints={step.hints.map(plainText)} />
          </section>
        )}
      </InMargin>
    </WidgetFrame>
  );
}

/** Build the registry component for `sqlLab`, bound to the host's engine and seed loader. */
export function createSqlLab(deps: SqlLabDeps): ComponentType<StepComponentProps<SqlLabStep>> {
  return function SqlLab(props: StepComponentProps<SqlLabStep>) {
    return <SqlLabView {...props} deps={deps} />;
  };
}
