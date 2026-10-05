'use client';

import { useCallback, useRef, useState, type ComponentType, type DragEvent } from 'react';
import {
  REFERENCE_ACTIONS,
  COLUMN_TYPES,
  checkRoleMap,
  runScenarios,
  schemaDraft,
  type ColumnDraft,
  type ColumnType,
  type DesignReport,
  type DesignRole,
  type RoleMap,
  type SchemaDraft,
} from '@learn-code/lesson-schema';
import type { SqlEngine } from '@learn-code/sql-engine';
import { Button, FeedbackBanner, InkCard, StepTag } from '@learn-code/ui';
import { InMargin, WidgetFrame } from '../chrome';
import { Markdown } from '../markdown';
import type { StepComponentProps, StepOfKind } from '../types';
import {
  EMPTY_DRAFT,
  addColumn,
  addTable,
  placeField,
  referenceTargets,
  removeColumn,
  removeTable,
  renameTable,
  reportSummary,
  roleOptions,
  setReference,
  unplacedFields,
  updateColumn,
} from './draft-state';
import './design.css';

type SchemaBuilderStep = StepOfKind<'schemaBuilder'>;

/** What the host app supplies. The widget never imports an engine implementation. */
export interface SchemaBuilderDeps {
  /** Resolves the engine; the host loads the PGlite adapter lazily inside this function. */
  readonly getEngine: () => Promise<SqlEngine>;
}

interface Saved {
  readonly draft: SchemaDraft;
  readonly roles: RoleMap;
}

/** Read a saved answer back; anything that does not look right is ignored. */
function readSaved(restored: StepComponentProps<SchemaBuilderStep>['restored']): Saved | undefined {
  if (restored?.status !== 'answered') return undefined;
  const payload: unknown = restored.payload;
  if (typeof payload !== 'object' || payload === null) return undefined;
  const draft = schemaDraft.safeParse(Reflect.get(payload, 'draft'));
  const roles: unknown = Reflect.get(payload, 'roles');
  if (!draft.success || typeof roles !== 'object' || roles === null) return undefined;
  const map: Record<string, string> = {};
  for (const [k, v] of Object.entries(roles)) if (typeof v === 'string') map[k] = v;
  return { draft: draft.data, roles: map };
}

const TYPE_LABEL: Readonly<Record<ColumnType, string>> = {
  integer: 'integer',
  bigint: 'bigint',
  text: 'text',
  boolean: 'boolean',
  numeric: 'numeric',
  timestamptz: 'timestamptz',
  uuid: 'uuid',
  date: 'date',
};

function ColumnRow({
  draft,
  ti,
  ci,
  column,
  onChange,
}: {
  readonly draft: SchemaDraft;
  readonly ti: number;
  readonly ci: number;
  readonly column: ColumnDraft;
  readonly onChange: (next: SchemaDraft) => void;
}) {
  const who = column.name === '' ? 'new column' : column.name;
  const targets = referenceTargets(draft, ti);
  const ref = column.references;
  const refValue = ref === undefined ? '' : `${ref.table}.${ref.column}`;
  return (
    <li className="sb-col">
      <label className="sb-field">
        <span className="w-label">Column</span>
        <input
          className="sb-input w-mono"
          value={column.name}
          spellCheck={false}
          onChange={(e) => onChange(updateColumn(draft, ti, ci, { name: e.target.value }))}
        />
      </label>
      <label className="sb-field">
        <span className="w-label">Type</span>
        <select
          className="sb-input"
          value={column.type}
          aria-label={`Type of ${who}`}
          onChange={(e) => {
            const type = COLUMN_TYPES.find((t) => t === e.target.value);
            if (type !== undefined) onChange(updateColumn(draft, ti, ci, { type }));
          }}
        >
          {COLUMN_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABEL[t]}
            </option>
          ))}
        </select>
      </label>
      <label className="sb-check">
        <input
          type="checkbox"
          checked={column.primaryKey}
          aria-label={`${who} is the primary key`}
          onChange={(e) => onChange(updateColumn(draft, ti, ci, { primaryKey: e.target.checked }))}
        />
        Primary key
      </label>
      <label className="sb-check">
        <input
          type="checkbox"
          checked={!column.nullable}
          disabled={column.primaryKey}
          aria-label={`${who} is required`}
          onChange={(e) => onChange(updateColumn(draft, ti, ci, { nullable: !e.target.checked }))}
        />
        Required
      </label>
      <label className="sb-check">
        <input
          type="checkbox"
          checked={column.unique}
          disabled={column.primaryKey}
          aria-label={`${who} is unique`}
          onChange={(e) => onChange(updateColumn(draft, ti, ci, { unique: e.target.checked }))}
        />
        Unique
      </label>
      <label className="sb-field">
        <span className="w-label">Points at</span>
        <select
          className="sb-input"
          value={refValue}
          aria-label={`${who} points at`}
          onChange={(e) => {
            const target = targets.find((t) => `${t.table}.${t.column}` === e.target.value);
            onChange(
              setReference(
                draft,
                ti,
                ci,
                target === undefined
                  ? undefined
                  : { ...target, onDelete: ref?.onDelete ?? 'restrict' },
              ),
            );
          }}
        >
          <option value="">nothing</option>
          {targets.map((t) => (
            <option key={`${t.table}.${t.column}`} value={`${t.table}.${t.column}`}>
              {t.table}.{t.column}
            </option>
          ))}
          {ref !== undefined &&
          !targets.some((t) => t.table === ref.table && t.column === ref.column) ? (
            <option value={refValue}>{refValue}</option>
          ) : null}
        </select>
      </label>
      {ref === undefined ? null : (
        <label className="sb-field">
          <span className="w-label">On delete</span>
          <select
            className="sb-input"
            value={ref.onDelete}
            aria-label={`When the row ${who} points at is deleted`}
            onChange={(e) => {
              const onDelete = REFERENCE_ACTIONS.find((a) => a === e.target.value);
              if (onDelete !== undefined)
                onChange(setReference(draft, ti, ci, { ...ref, onDelete }));
            }}
          >
            {REFERENCE_ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
      )}
      <Button
        onClick={() => onChange(removeColumn(draft, ti, ci))}
        aria-label={`Remove column ${who}`}
      >
        Remove
      </Button>
    </li>
  );
}

function TableCard({
  draft,
  ti,
  loose,
  onChange,
}: {
  readonly draft: SchemaDraft;
  readonly ti: number;
  readonly loose: readonly string[];
  readonly onChange: (next: SchemaDraft) => void;
}) {
  const table = draft.tables[ti];
  const [over, setOver] = useState(false);
  if (table === undefined) return null;
  const who = table.name === '' ? 'new table' : table.name;
  const drop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setOver(false);
    const field = e.dataTransfer.getData('text/plain');
    if (loose.includes(field)) onChange(placeField(draft, ti, field));
  };
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={drop}
    >
      <InkCard state={over ? 'selected' : 'default'}>
        <section className="sb-table" aria-label={`Table ${who}`}>
          <div className="sb-table-head">
            <label className="sb-field sb-grow">
              <span className="w-label">Table</span>
              <input
                className="sb-input w-mono"
                value={table.name}
                spellCheck={false}
                onChange={(e) => onChange(renameTable(draft, ti, e.target.value))}
              />
            </label>
            <Button
              onClick={() => onChange(removeTable(draft, ti))}
              aria-label={`Remove table ${who}`}
            >
              Remove table
            </Button>
          </div>
          {table.columns.length === 0 ? (
            <p className="w-muted">No columns yet. Add one, or drop a loose field here.</p>
          ) : (
            <ul className="sb-cols">
              {table.columns.map((c, ci) => (
                <ColumnRow key={ci} draft={draft} ti={ti} ci={ci} column={c} onChange={onChange} />
              ))}
            </ul>
          )}
          <div className="w-row">
            <Button onClick={() => onChange(addColumn(draft, ti))}>Add column</Button>
            {loose.length > 0 ? (
              <label className="sb-field">
                <span className="w-label">Loose field</span>
                <select
                  className="sb-input"
                  value=""
                  aria-label={`Put a loose field into ${who}`}
                  onChange={(e) => {
                    if (e.target.value !== '') onChange(placeField(draft, ti, e.target.value));
                  }}
                >
                  <option value="">put one here…</option>
                  {loose.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
        </section>
      </InkCard>
    </div>
  );
}

function RolePicker({
  role,
  draft,
  map,
  onPick,
}: {
  readonly role: DesignRole;
  readonly draft: SchemaDraft;
  readonly map: RoleMap;
  readonly onPick: (name: string) => void;
}) {
  const options = roleOptions(role, draft, map);
  const value = map[role.id] ?? '';
  return (
    <label className="sb-field sb-role">
      <span>{role.label}</span>
      <select className="sb-input w-mono" value={value} onChange={(e) => onPick(e.target.value)}>
        <option value="">pick one…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
        {value !== '' && !options.includes(value) ? <option value={value}>{value}</option> : null}
      </select>
    </label>
  );
}

function Results({ report }: { readonly report: DesignReport }) {
  if (report.phase === 'invalid') {
    return (
      <ul className="sb-problems" aria-label="Problems to fix first">
        {report.problems.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>
    );
  }
  if (report.phase === 'ddlFailed') return null;
  return (
    <ol className="sb-results" aria-label="Rules checked against your design">
      {report.results.map((r) => (
        <li key={r.id}>
          <InkCard>
            <div className="sb-result" data-status={r.status}>
              <p className="sb-story">
                <span className="w-label">{r.status === 'passed' ? 'Holds' : 'Broken'}</span>{' '}
                {r.story}
              </p>
              {r.status === 'failed' ? (
                <>
                  {r.explanation === undefined ? null : <p>{r.explanation}</p>}
                  <p className="w-label">The statement tried</p>
                  <pre className="w-mono w-pre sb-sql">{r.statement}</pre>
                  <p className="w-label">What the database answered</p>
                  <pre className="w-mono w-pre sb-sql">{r.answer}</pre>
                  {r.hint === undefined ? null : <p className="sb-hint">{r.hint}</p>}
                </>
              ) : null}
            </div>
          </InkCard>
        </li>
      ))}
    </ol>
  );
}

function SchemaBuilderView({
  step,
  restored,
  onComplete,
  deps,
}: StepComponentProps<SchemaBuilderStep> & { readonly deps: SchemaBuilderDeps }) {
  const saved = readSaved(restored);
  const [draft, setDraft] = useState<SchemaDraft>(saved?.draft ?? EMPTY_DRAFT);
  const [map, setMap] = useState<RoleMap>(saved?.roles ?? {});
  const [report, setReport] = useState<DesignReport | undefined>(undefined);
  const [running, setRunning] = useState(false);
  const [solved, setSolved] = useState(restored?.status === 'answered');
  const attempts = useRef(restored?.status === 'answered' ? restored.attempts : 0);
  const completed = useRef(restored?.status === 'answered');

  const edit = useCallback((next: SchemaDraft) => {
    setDraft(next);
    setReport(undefined);
  }, []);

  const pickRole = (id: string, name: string) => {
    setMap((m) => {
      const next: Record<string, string> = { ...m };
      if (name === '') delete next[id];
      else next[id] = name;
      return next;
    });
    setReport(undefined);
  };

  const test = async () => {
    if (running) return;
    setRunning(true);
    attempts.current += 1;
    try {
      const engine = await deps.getEngine();
      const next = await runScenarios({
        engine,
        draft,
        roles: step.roles,
        map,
        scenarios: step.scenarios,
      });
      setReport(next);
      if (next.phase === 'ran' && next.allPassed) {
        setSolved(true);
        if (!completed.current) {
          completed.current = true;
          onComplete({
            status: 'answered',
            correct: true,
            attempts: attempts.current,
            payload: { draft, roles: map },
          });
        }
      }
    } catch (error) {
      setReport({
        phase: 'ddlFailed',
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setRunning(false);
    }
  };

  const loose = unplacedFields(step.looseFields, draft);
  const summary = report === undefined ? undefined : reportSummary(report);
  const mapProblems = checkRoleMap(step.roles, draft, map);
  const banner =
    summary !== undefined ? (
      <FeedbackBanner correct={summary.good} title={summary.title}>
        {summary.text}
      </FeedbackBanner>
    ) : solved ? (
      <FeedbackBanner correct title="Your design holds.">
        Every rule is enforced by the database itself.
      </FeedbackBanner>
    ) : undefined;

  return (
    <WidgetFrame
      kind="schemaBuilder"
      {...(banner === undefined ? {} : { banner })}
      lead={
        <>
          <StepTag kind="sqlLab" />
          <div className="w-lead">
            <Markdown text={step.prompt} />
          </div>
        </>
      }
    >
      <div className="sb-tables">
        {draft.tables.map((_, ti) => (
          <TableCard key={ti} draft={draft} ti={ti} loose={loose} onChange={edit} />
        ))}
        <div>
          <Button onClick={() => edit(addTable(draft))}>Add table</Button>
        </div>
      </div>
      <InkCard>
        <fieldset className="sb-roles">
          <legend className="w-label">Last step: which is which?</legend>
          <p className="w-muted">
            Your names are yours. Tell the checker which table or column plays each part.
          </p>
          <div className="sb-role-grid">
            {step.roles.map((role) => (
              <RolePicker
                key={role.id}
                role={role}
                draft={draft}
                map={map}
                onPick={(name) => pickRole(role.id, name)}
              />
            ))}
          </div>
        </fieldset>
      </InkCard>
      <div className="w-row">
        <Button
          variant="primary"
          onClick={() => void test()}
          disabled={running || draft.tables.length === 0}
        >
          {running ? 'Testing…' : 'Test my design'}
        </Button>
        {mapProblems.length > 0 && draft.tables.length > 0 ? (
          <span className="w-muted">{mapProblems[0]}</span>
        ) : null}
      </div>
      {report === undefined ? null : <Results report={report} />}
      <InMargin>
        {step.looseFields.length > 0 ? (
          <section className="sb-pile" aria-labelledby={`${step.id}-loose`}>
            <h3 className="w-label" id={`${step.id}-loose`}>
              Loose fields
            </h3>
            {loose.length === 0 ? (
              <p className="w-muted">All placed.</p>
            ) : (
              <ul className="sb-chips" aria-label="Fields not in a table yet">
                {loose.map((f) => (
                  <li
                    key={f}
                    className="sb-chip w-mono"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', f)}
                  >
                    {f}
                  </li>
                ))}
              </ul>
            )}
            <p className="w-muted">Drag a field into a table, or pick it in the table's list.</p>
          </section>
        ) : null}
      </InMargin>
    </WidgetFrame>
  );
}

/** Build the registry component for `schemaBuilder`, bound to the host's engine. */
export function createSchemaBuilder(
  deps: SchemaBuilderDeps,
): ComponentType<StepComponentProps<SchemaBuilderStep>> {
  return function SchemaBuilder(props: StepComponentProps<SchemaBuilderStep>) {
    return <SchemaBuilderView {...props} deps={deps} />;
  };
}
