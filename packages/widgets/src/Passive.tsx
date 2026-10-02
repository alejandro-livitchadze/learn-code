'use client';

import { useState } from 'react';
import { Code } from './Code';
import { Markdown, renderInline } from './markdown';
import type { StepComponentProps, StepOfKind } from './types';

type Character = NonNullable<StepOfKind<'hook'>['character']> | 'careful';

const CHARACTERS: Readonly<Record<Character, { readonly name: string; readonly mark: string }>> = {
  bug: { name: 'Bug', mark: 'B' },
  olha: { name: 'Olha', mark: 'O' },
  mrRuntime: { name: 'Mr. Runtime', mark: 'R' },
  careful: { name: 'Careful', mark: '!' },
};

function Speech({
  character,
  children,
}: {
  readonly character: Character;
  readonly children: React.ReactNode;
}) {
  const c = CHARACTERS[character];
  return (
    <div className="w-speech" data-character={character}>
      <div className="w-avatar" aria-hidden="true">
        {c.mark}
      </div>
      <div className="w-bubble">
        <p className="w-speaker">{c.name}</p>
        {children}
      </div>
    </div>
  );
}

export function Hook({ step }: StepComponentProps<StepOfKind<'hook'>>) {
  return (
    <div className="w-widget" data-kind="hook">
      <Speech character={step.character ?? 'bug'}>
        <Markdown text={step.body} />
      </Speech>
    </div>
  );
}

export function Pitfall({ step }: StepComponentProps<StepOfKind<'pitfall'>>) {
  return (
    <div className="w-widget" data-kind="pitfall">
      <Speech character="careful">
        <Markdown text={step.body} />
      </Speech>
      {step.badCode !== undefined || step.goodCode !== undefined ? (
        <div className="w-compare">
          {step.badCode !== undefined ? (
            <div>
              <p className="w-tag w-tag-bad">Avoid</p>
              <Code code={step.badCode} highlightKey={`${step.id}:badCode`} label="Code to avoid" />
            </div>
          ) : null}
          {step.goodCode !== undefined ? (
            <div>
              <p className="w-tag w-tag-good">Prefer</p>
              <Code code={step.goodCode} highlightKey={`${step.id}:goodCode`} label="Better code" />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function Explain({ step }: StepComponentProps<StepOfKind<'explain'>>) {
  const total = step.annotations.length;
  const [shown, setShown] = useState(0);
  const notes = step.annotations.slice(0, shown);
  return (
    <div className="w-widget" data-kind="explain">
      <Markdown text={step.body} />
      {step.code !== undefined ? (
        <>
          <Code
            code={step.code}
            highlightKey={`${step.id}:code`}
            label="Annotated code"
            notes={notes}
          />
          {total > 0 ? (
            <div className="w-row">
              <button
                type="button"
                className="w-btn"
                disabled={shown >= total}
                onClick={() => setShown((n) => Math.min(n + 1, total))}
              >
                {shown >= total
                  ? 'All notes shown'
                  : shown === 0
                    ? 'Show first note'
                    : 'Show next note'}
              </button>
              <button
                type="button"
                className="w-btn w-btn-quiet"
                disabled={shown >= total}
                onClick={() => setShown(total)}
              >
                Show all
              </button>
              <span className="w-muted" role="status">
                {shown} of {total} notes
              </span>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export function Recap({ step }: StepComponentProps<StepOfKind<'recap'>>) {
  const total = step.points.length;
  const [shown, setShown] = useState(1);
  return (
    <div className="w-widget" data-kind="recap">
      <h3 className="w-h">What to remember</h3>
      <ul className="w-recap">
        {step.points.slice(0, shown).map((p, i) => (
          <li key={i}>{renderInline(p)}</li>
        ))}
      </ul>
      <div className="w-row">
        <button
          type="button"
          className="w-btn"
          disabled={shown >= total}
          onClick={() => setShown((n) => Math.min(n + 1, total))}
        >
          {shown >= total ? 'All points shown' : 'Show next point'}
        </button>
        <button
          type="button"
          className="w-btn w-btn-quiet"
          disabled={shown >= total}
          onClick={() => setShown(total)}
        >
          Show all
        </button>
        <span className="w-muted" role="status">
          {shown} of {total} points
        </span>
      </div>
    </div>
  );
}

export function Cliffhanger({ step }: StepComponentProps<StepOfKind<'cliffhanger'>>) {
  return (
    <div className="w-widget" data-kind="cliffhanger">
      <p className="w-tag">Next time</p>
      <p className="w-cliff">{renderInline(step.question)}</p>
      {step.nextLessonId !== undefined ? (
        <p className="w-muted">Continues in lesson {step.nextLessonId}.</p>
      ) : null}
    </div>
  );
}
