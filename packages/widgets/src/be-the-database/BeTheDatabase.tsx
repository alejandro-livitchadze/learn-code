'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';
import { Button, FeedbackBanner, InkCard, MrRuntime, SpeechBubble } from '@learn-code/ui';
import { Code } from '../Code';
import { InMargin, useStepFooter, WidgetFrame } from '../chrome';
import { Markdown } from '../markdown';
import type { StepComponentProps, StepOfKind } from '../types';
import {
  checkPairing,
  describeProblems,
  hasPair,
  pairLabel,
  rowLabel,
  summarize,
  togglePair,
} from './pairing';
import { parseTrace, type JoinTrace, type Pair, type TraceTable } from './trace';
import './be-the-database.css';

type BeTheDatabaseStep = StepOfKind<'beTheDatabase'>;
type Props = StepComponentProps<BeTheDatabaseStep>;

/** What the host supplies. The widget never reads files itself. */
export interface BeTheDatabaseDeps {
  /** Resolves the recorded trace JSON for a `traceRef`. */
  readonly loadTrace: (traceRef: string) => Promise<unknown>;
}

/** Read the learner's pairs back from a saved answer; anything odd is ignored. */
export function readSavedPairs(restored: Props['restored']): readonly Pair[] | undefined {
  if (restored?.status !== 'answered') return undefined;
  const payload: unknown = restored.payload;
  const raw: unknown =
    typeof payload === 'object' && payload !== null ? Reflect.get(payload, 'pairs') : undefined;
  if (!Array.isArray(raw)) return undefined;
  const out: Pair[] = [];
  for (const item of raw) {
    if (!Array.isArray(item) || item.length !== 2) return undefined;
    const [l, r]: unknown[] = item;
    if (typeof l !== 'number' || !(r === null || typeof r === 'number')) return undefined;
    out.push({ left: l, right: r });
  }
  return out;
}

const NO_PICK = -1;

function Grid({
  table,
  side,
  picked,
  paired,
  disabled,
  onPick,
}: {
  readonly table: TraceTable;
  readonly side: 'left' | 'right';
  /** Left table: the picked row. Right table: unused. */
  readonly picked: number;
  /** Rows of this table that are in a pair with the picked left row. */
  readonly paired: ReadonlySet<number>;
  readonly disabled: boolean;
  readonly onPick: (index: number) => void;
}) {
  return (
    <InkCard>
      <table className="bd-grid" aria-label={`Table ${table.name}`}>
        <caption className="w-label">{table.name}</caption>
        <thead>
          <tr>
            <th scope="col">
              <span className="bd-sr">Pick</span>
            </th>
            {table.columns.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => {
            const on = side === 'left' ? picked === i : paired.has(i);
            return (
              <tr key={i} data-on={on}>
                <td>
                  <button
                    type="button"
                    className="bd-pick"
                    aria-pressed={on}
                    disabled={disabled}
                    aria-label={`${side === 'left' ? 'Pick' : 'Pair with'} ${table.name} ${row[0] ?? ''}${row[1] === undefined ? '' : ` (${row[1]})`}`}
                    onClick={() => onPick(i)}
                  >
                    {side === 'left' ? '←' : '→'}
                  </button>
                </td>
                {row.map((cell, c) => (
                  <td key={c} className="w-mono">
                    {cell === 'NULL' ? <span className="bd-null">NULL</span> : cell}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </InkCard>
  );
}

function ResultGrid({ trace }: { readonly trace: JoinTrace }) {
  return (
    <figure className="bd-result" aria-label="What PostgreSQL returned">
      <figcaption className="w-label">What PostgreSQL returned</figcaption>
      <InkCard>
        <table className="bd-grid">
          <thead>
            <tr>
              {trace.result.columns.map((c, i) => (
                <th key={i} scope="col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trace.result.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, c) => (
                  <td key={c} className="w-mono">
                    {cell === 'NULL' ? <span className="bd-null">NULL</span> : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </InkCard>
    </figure>
  );
}

/** The widget once its trace is known. Exported for tests and the catalogue. */
export function BeTheDatabaseView({
  step,
  trace,
  restored,
  onComplete,
}: Props & { readonly trace: JoinTrace }) {
  const saved = readSavedPairs(restored);
  const solvedAtStart = restored?.status === 'answered';
  const [pairs, setPairs] = useState<readonly Pair[]>(saved ?? (solvedAtStart ? trace.pairs : []));
  const [picked, setPicked] = useState<number>(NO_PICK);
  const [attempts, setAttempts] = useState(restored?.status === 'answered' ? restored.attempts : 0);
  const [problems, setProblems] = useState<readonly string[] | undefined>(undefined);
  const [solved, setSolved] = useState(solvedAtStart);
  const completed = useRef(solvedAtStart);

  const edit = (next: readonly Pair[]) => {
    if (solved) return;
    setPairs(next);
    setProblems(undefined);
  };

  const check = () => {
    if (solved || pairs.length === 0) return;
    const result = checkPairing(trace, pairs);
    const tries = attempts + 1;
    setAttempts(tries);
    if (result.correct) {
      setSolved(true);
      setProblems([]);
      if (!completed.current) {
        completed.current = true;
        onComplete({
          status: 'answered',
          correct: true,
          attempts: tries,
          payload: { pairs: pairs.map((p) => [p.left, p.right]) },
        });
      }
    } else {
      setProblems(describeProblems(trace, result));
    }
  };

  const hosted = useStepFooter(
    solved
      ? undefined
      : {
          hint:
            pairs.length === 0 ? 'pair up some rows first' : 'press the button when you are done',
          action: { label: 'Check my pairs', disabled: pairs.length === 0, onAct: check },
        },
  );

  const pairedWithPicked = new Set(
    pairs.flatMap((p) => (p.left === picked && p.right !== null ? [p.right] : [])),
  );
  const keepsEmpty = trace.joinKind === 'left';

  const banner =
    problems === undefined ? undefined : solved ? (
      <FeedbackBanner correct title="That is exactly what the database did.">
        {summarize(trace)}
      </FeedbackBanner>
    ) : (
      <FeedbackBanner correct={false} title="Not the same as the database.">
        {problems.length === 1
          ? 'One row needs another look.'
          : `${problems.length} rows need another look.`}
      </FeedbackBanner>
    );

  return (
    <WidgetFrame
      kind="beTheDatabase"
      lead={<span className="w-hand">you are the join</span>}
      {...(banner === undefined ? {} : { banner })}
    >
      <div className="w-question">
        <Markdown text={step.prompt} />
      </div>
      <Code code={step.query} highlightKey={`${step.id}:query`} label="The query" />
      {problems !== undefined && !solved ? (
        <ul className="bd-problems" aria-label="What to look at again">
          {problems.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      ) : null}
      <p className="bd-help">
        {solved
          ? 'Locked in.'
          : picked === NO_PICK
            ? `Pick a row in ${trace.left.name}.`
            : `Now mark every row in ${trace.right.name} that ${rowLabel(trace, 'left', picked)} pairs with.`}
      </p>
      <div className="bd-tables">
        <Grid
          table={step.tables[0] ?? trace.left}
          side="left"
          picked={picked}
          paired={new Set()}
          disabled={solved}
          onPick={(i) => setPicked(picked === i ? NO_PICK : i)}
        />
        <Grid
          table={step.tables[1] ?? trace.right}
          side="right"
          picked={picked}
          paired={pairedWithPicked}
          disabled={solved || picked === NO_PICK}
          onPick={(i) => edit(togglePair(pairs, { left: picked, right: i }))}
        />
      </div>
      {keepsEmpty && !solved ? (
        <div>
          <Button
            disabled={picked === NO_PICK}
            aria-pressed={hasPair(pairs, { left: picked, right: null })}
            onClick={() => edit(togglePair(pairs, { left: picked, right: null }))}
          >
            No partner: keep it with NULLs
          </Button>
        </div>
      ) : null}
      <section className="bd-pairs" aria-label="Your pairs">
        <h3 className="w-label">Your pairs ({pairs.length})</h3>
        {pairs.length === 0 ? (
          <p className="w-muted">Nothing paired yet.</p>
        ) : (
          <ol>
            {pairs.map((p) => (
              <li key={`${p.left}:${p.right}`}>
                <span>{pairLabel(trace, p)}</span>
                {solved ? null : (
                  <Button
                    aria-label={`Remove the pair ${pairLabel(trace, p)}`}
                    onClick={() => edit(togglePair(pairs, p))}
                  >
                    Remove
                  </Button>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
      {!solved && !hosted ? (
        <div>
          <Button variant="primary" disabled={pairs.length === 0} onClick={check}>
            Check my pairs
          </Button>
        </div>
      ) : null}
      {solved ? <ResultGrid trace={trace} /> : null}
      <InMargin>
        <div className="bd-runtime">
          <MrRuntime />
          <SpeechBubble>
            {trace.joinKind === 'inner'
              ? 'A row needs a partner. No partner, no row.'
              : 'Left join: every left row gets out. No partner means NULLs.'}
          </SpeechBubble>
        </div>
      </InMargin>
    </WidgetFrame>
  );
}

type LoadState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'ready'; readonly trace: JoinTrace };

/** Loads the trace through the host, then shows the view. */
function BeTheDatabaseLoader({ deps, ...props }: Props & { readonly deps: BeTheDatabaseDeps }) {
  const ref = props.step.traceRef;
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    setState({ status: 'loading' });
    deps
      .loadTrace(ref)
      .then((raw) => {
        if (!live) return;
        const trace = parseTrace(raw);
        setState(
          trace === undefined
            ? { status: 'error', message: 'The recorded run of this query is damaged.' }
            : { status: 'ready', trace },
        );
      })
      .catch((e: unknown) => {
        if (live)
          setState({ status: 'error', message: e instanceof Error ? e.message : String(e) });
      });
    return () => {
      live = false;
    };
  }, [deps, ref, attempt]);

  if (state.status === 'ready') return <BeTheDatabaseView {...props} trace={state.trace} />;
  return (
    <WidgetFrame kind="beTheDatabase">
      {state.status === 'loading' ? (
        <p className="w-muted" role="status">
          Getting the tables ready…
        </p>
      ) : (
        <FeedbackBanner correct={false} title="Could not load this exercise.">
          {state.message}
        </FeedbackBanner>
      )}
      {state.status === 'error' ? (
        <div>
          <Button onClick={() => setAttempt((n) => n + 1)}>Try again</Button>
        </div>
      ) : null}
    </WidgetFrame>
  );
}

/** The registry entry for `beTheDatabase`, bound to the host's way of getting traces. */
export function createBeTheDatabase(deps: BeTheDatabaseDeps): ComponentType<Props> {
  return function BeTheDatabase(props: Props) {
    return <BeTheDatabaseLoader {...props} deps={deps} />;
  };
}
