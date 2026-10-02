'use client';

import { useRef, useState } from 'react';
import { checkPredict, correctPredictIndex, humanizeMisconception, readChosen } from './check';
import { Code } from './Code';
import type { StepComponentProps, StepOfKind } from './types';

type Props = StepComponentProps<StepOfKind<'predict'>> & {
  /** Catalogue only: start with these wrong options already tried. */
  readonly initialTried?: readonly number[];
};

export function Predict({ step, restored, onComplete, initialTried = [] }: Props) {
  const restoredIndex =
    restored?.status === 'answered' ? (readChosen(restored.payload) ?? correctPredictIndex(step)) : undefined;
  const [tried, setTried] = useState<readonly number[]>(initialTried);
  const [last, setLast] = useState<number | undefined>(initialTried[initialTried.length - 1]);
  const [done, setDone] = useState<number | undefined>(restoredIndex);
  const [ran, setRan] = useState(restoredIndex !== undefined);
  const completed = useRef(restoredIndex !== undefined);

  const choose = (i: number) => {
    if (done !== undefined) return;
    setLast(i);
    const result = checkPredict(step, i);
    if (result.correct) {
      setDone(i);
      if (!completed.current) {
        completed.current = true;
        onComplete({ status: 'answered', correct: true, attempts: tried.length + 1, payload: { chosen: i } });
      }
    } else if (!tried.includes(i)) {
      setTried((t) => [...t, i]);
    }
  };

  const shownIndex = done ?? last;
  const shown = shownIndex === undefined ? undefined : step.options[shownIndex];
  const result = shownIndex === undefined ? undefined : checkPredict(step, shownIndex);
  const correctOption = step.options[correctPredictIndex(step)];

  return (
    <div className="w-widget" data-kind="predict">
      <p className="w-h">What does this print?</p>
      <Code code={step.code} highlightKey={`${step.id}:code`} label="Code to predict" />
      <ul className="w-options" aria-label="Possible outputs">
        {step.options.map((o, i) => {
          const state =
            done === i ? 'correct' : tried.includes(i) ? 'wrong' : 'idle';
          return (
            <li key={i}>
              <button
                type="button"
                className="w-option"
                data-state={state}
                aria-pressed={shownIndex === i}
                disabled={done !== undefined && done !== i}
                onClick={() => choose(i)}
              >
                <span className="w-mono w-pre">{o.output}</span>
                {state === 'correct' ? <span className="w-state">Correct</span> : null}
                {state === 'wrong' ? <span className="w-state">Not quite</span> : null}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="w-feedback" role="status" aria-live="polite">
        {shown !== undefined && result !== undefined ? (
          <>
            <p data-correct={result.correct}>{shown.feedback}</p>
            {result.misconception !== undefined ? (
              <p className="w-muted">
                Common mix-up: {humanizeMisconception(result.misconception)}.
              </p>
            ) : null}
          </>
        ) : null}
      </div>
      {done !== undefined ? (
        <div className="w-run">
          {ran && correctOption !== undefined ? (
            <figure className="w-output" aria-label="Real output">
              <figcaption>Output</figcaption>
              <pre tabIndex={0}>{correctOption.output}</pre>
            </figure>
          ) : (
            <button type="button" className="w-btn" onClick={() => setRan(true)}>
              Run it
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
