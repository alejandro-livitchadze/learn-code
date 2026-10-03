'use client';

import { useRef, useState } from 'react';
import { Button, FeedbackBanner, InkCard } from '@learn-code/ui';
import { checkPredict, correctPredictIndex, humanizeMisconception, readChosen } from './check';
import { Code } from './Code';
import { useStepFooter, WidgetFrame } from './chrome';
import type { StepComponentProps, StepOfKind } from './types';

type Props = StepComponentProps<StepOfKind<'predict'>> & {
  /** Catalogue only: start with these wrong options already tried. */
  readonly initialTried?: readonly number[];
};

const MAX_ASIDE_WORDS = 25;

export function Predict({ step, restored, onComplete, initialTried = [] }: Props) {
  const restoredIndex =
    restored?.status === 'answered'
      ? (readChosen(restored.payload) ?? correctPredictIndex(step))
      : undefined;
  const [tried, setTried] = useState<readonly number[]>(initialTried);
  const [last, setLast] = useState<number | undefined>(initialTried[initialTried.length - 1]);
  const [done, setDone] = useState<number | undefined>(restoredIndex);
  const [selected, setSelected] = useState<number | undefined>(undefined);
  const completed = useRef(restoredIndex !== undefined);

  const pick = (i: number) => {
    if (done !== undefined || tried.includes(i)) return;
    setSelected(i);
  };

  const lockIn = () => {
    if (done !== undefined || selected === undefined) return;
    const i = selected;
    setLast(i);
    setSelected(undefined);
    if (checkPredict(step, i).correct) {
      setDone(i);
      if (!completed.current) {
        completed.current = true;
        onComplete({
          status: 'answered',
          correct: true,
          attempts: tried.length + 1,
          payload: { chosen: i },
        });
      }
    } else if (!tried.includes(i)) {
      setTried((t) => [...t, i]);
    }
  };

  const open = done === undefined;
  const hosted = useStepFooter(
    open
      ? {
          hint: selected === undefined ? 'pick an answer to continue' : 'press Enter to lock it in',
          action: { label: 'Lock in answer', disabled: selected === undefined, onAct: lockIn },
        }
      : undefined,
  );

  const shownIndex = done ?? last;
  const shown = shownIndex === undefined ? undefined : step.options[shownIndex];
  const result = shownIndex === undefined ? undefined : checkPredict(step, shownIndex);
  const correctOption = step.options[correctPredictIndex(step)];
  const mixUp =
    result?.misconception === undefined
      ? undefined
      : `Common mix-up: ${humanizeMisconception(result.misconception)}.`;

  const banner =
    shown !== undefined && result !== undefined ? (
      <FeedbackBanner
        correct={result.correct}
        title={result.correct ? "That's right." : 'Not quite.'}
        {...(mixUp !== undefined && mixUp.split(/\s+/).length <= MAX_ASIDE_WORDS
          ? { aside: mixUp }
          : {})}
      >
        {shown.feedback}
      </FeedbackBanner>
    ) : undefined;

  return (
    <WidgetFrame kind="predict" {...(banner === undefined ? {} : { banner })}>
      <p className="w-question">What does this print?</p>
      <Code code={step.code} highlightKey={`${step.id}:code`} label="Code to predict" />
      <fieldset
        className="w-choices"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && selected !== undefined) {
            e.preventDefault();
            lockIn();
          }
        }}
      >
        <legend className="w-label">Your answer</legend>
        <ul className="w-options" aria-label="Possible outputs">
          {step.options.map((o, i) => {
            const state =
              done === i
                ? 'correct'
                : tried.includes(i)
                  ? 'wrong'
                  : selected === i
                    ? 'selected'
                    : 'idle';
            return (
              <li key={i} className="w-opt" data-state={state}>
                <InkCard
                  state={state === 'selected' ? 'selected' : state === 'correct' ? 'lifted' : 'default'}
                >
                  <button
                    type="button"
                    className="w-option"
                    data-state={state}
                    aria-pressed={selected === i || done === i}
                    disabled={(done !== undefined && done !== i) || tried.includes(i)}
                    onClick={() => pick(i)}
                  >
                    <span className="w-mono w-pre">{o.output}</span>
                    {state === 'correct' ? <span className="w-state">Correct</span> : null}
                    {state === 'wrong' ? <span className="w-state">Not quite</span> : null}
                  </button>
                </InkCard>
              </li>
            );
          })}
        </ul>
      </fieldset>
      {open && !hosted ? (
        <div>
          <Button variant="primary" disabled={selected === undefined} onClick={lockIn}>
            Lock in answer
          </Button>
        </div>
      ) : null}
      {done !== undefined && correctOption !== undefined ? (
        <figure className="w-output" aria-label="Real output">
          <figcaption className="w-label">Output</figcaption>
          <InkCard>
            <pre tabIndex={0}>{correctOption.output}</pre>
          </InkCard>
        </figure>
      ) : null}
    </WidgetFrame>
  );
}
