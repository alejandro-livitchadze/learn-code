'use client';

import { useRef, useState } from 'react';
import { Button, FeedbackBanner, InkCard } from '@learn-code/ui';
import { checkFillBlanks, parseTemplate, readAnswers, type FillBlanksCheck } from './check';
import { useStepFooter, WidgetFrame } from './chrome';
import type { StepComponentProps, StepOfKind } from './types';

type Props = StepComponentProps<StepOfKind<'fillBlanks'>> & {
  /** Catalogue only: start with these answers already checked. */
  readonly initialChecked?: Readonly<Record<string, string>>;
};

export function FillBlanks({ step, restored, onComplete, initialChecked }: Props) {
  const restoredAnswers =
    restored?.status === 'answered' ? (readAnswers(restored.payload) ?? {}) : undefined;
  const parts = parseTemplate(step.template);
  const [answers, setAnswers] = useState<Readonly<Record<string, string>>>(
    restoredAnswers ?? initialChecked ?? {},
  );
  const [check, setCheck] = useState<FillBlanksCheck | undefined>(
    restoredAnswers !== undefined
      ? checkFillBlanks(step, restoredAnswers)
      : initialChecked !== undefined
        ? checkFillBlanks(step, initialChecked)
        : undefined,
  );
  const attempts = useRef(initialChecked !== undefined ? 1 : 0);
  const completed = useRef(restoredAnswers !== undefined);
  const locked = check?.correct === true;

  const incomplete = step.blanks.some((b) => (answers[b.id] ?? '').trim() === '');

  const submit = () => {
    if (locked || incomplete) return;
    const result = checkFillBlanks(step, answers);
    setCheck(result);
    attempts.current += 1;
    if (result.correct && !completed.current) {
      completed.current = true;
      onComplete({
        status: 'answered',
        correct: true,
        attempts: attempts.current,
        payload: { answers },
      });
    }
  };

  const wrong = check?.blanks.filter((b) => !b.correct) ?? [];
  const hosted = useStepFooter(
    locked
      ? undefined
      : {
          hint: incomplete ? 'fill every blank to continue' : 'press Enter to lock it in',
          action: { label: 'Lock in answer', disabled: incomplete, onAct: submit },
        },
  );
  const number = (id: string) => step.blanks.findIndex((x) => x.id === id) + 1;
  const banner = locked ? (
    <FeedbackBanner correct title="That's right.">
      All blanks are correct.
    </FeedbackBanner>
  ) : wrong.length > 0 ? (
    <FeedbackBanner correct={false} title="Not quite.">
      {wrong.map((b) => `Blank ${number(b.id)}: ${b.feedback}`).join(' ')}
    </FeedbackBanner>
  ) : undefined;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
          e.preventDefault();
          submit();
        }
      }}
    >
      <WidgetFrame kind="fillBlanks" {...(banner === undefined ? {} : { banner })}>
        <p className="w-question">Fill in the blanks to finish the code.</p>
        <figure className="w-code" aria-label="Code with blanks">
          <InkCard>
            <pre className="w-code-flow">
              <code>
                {parts.map((p, i) => {
                  if (p.kind === 'text') return <span key={i}>{p.text}</span>;
                  const r = check?.blanks.find((b) => b.id === p.id);
                  const accepted = step.blanks.find((b) => b.id === p.id)?.accepted ?? [];
                  const width = Math.max(6, ...accepted.map((a) => a.length)) + 2;
                  return (
                    <input
                      key={i}
                      className="w-blank"
                      data-state={r === undefined ? 'idle' : r.correct ? 'correct' : 'wrong'}
                      style={{ width: `${width}ch` }}
                      aria-label={`Blank ${number(p.id)} of ${step.blanks.length}`}
                      aria-invalid={r !== undefined && !r.correct}
                      value={answers[p.id] ?? ''}
                      readOnly={locked}
                      spellCheck={false}
                      autoComplete="off"
                      autoCapitalize="off"
                      onChange={(e) => setAnswers((a) => ({ ...a, [p.id]: e.target.value }))}
                    />
                  );
                })}
              </code>
            </pre>
          </InkCard>
        </figure>
        <p className="w-muted">Whitespace does not matter.</p>
        {!locked && !hosted ? (
          <div>
            <Button variant="primary" type="submit" disabled={incomplete}>
              Lock in answer
            </Button>
          </div>
        ) : null}
      </WidgetFrame>
    </form>
  );
}
