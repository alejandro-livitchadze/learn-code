'use client';

import { createContext, useContext, useState } from 'react';
import { Button, Cliffhanger as CliffhangerCard, ReviewCard } from '@learn-code/ui';
import { Code } from './Code';
import { WidgetFrame } from './chrome';
import { HookColumn } from './Margin';
import { Markdown, renderInline } from './markdown';
import type { StepComponentProps, StepOfKind } from './types';

export function Hook({ step }: StepComponentProps<StepOfKind<'hook'>>) {
  return (
    <div className="w-widget" data-kind="hook">
      <HookColumn character={step.character}>
        <Markdown text={step.body} />
      </HookColumn>
    </div>
  );
}

export function Pitfall({ step }: StepComponentProps<StepOfKind<'pitfall'>>) {
  return (
    <WidgetFrame kind="pitfall">
      <Markdown text={step.body} />
      {step.badCode !== undefined || step.goodCode !== undefined ? (
        <div className="w-compare">
          {step.badCode !== undefined ? (
            <div className="w-compare-side">
              <p className="w-label w-label-bad">Avoid</p>
              <Code code={step.badCode} highlightKey={`${step.id}:badCode`} label="Code to avoid" />
            </div>
          ) : null}
          {step.goodCode !== undefined ? (
            <div className="w-compare-side">
              <p className="w-label w-label-good">Prefer</p>
              <Code code={step.goodCode} highlightKey={`${step.id}:goodCode`} label="Better code" />
            </div>
          ) : null}
        </div>
      ) : null}
    </WidgetFrame>
  );
}

export function Explain({ step }: StepComponentProps<StepOfKind<'explain'>>) {
  const total = step.annotations.length;
  // The first note is open from the start, so the code never looks bare.
  const [shown, setShown] = useState(Math.min(1, total));
  const notes = step.annotations.slice(0, shown);
  return (
    <WidgetFrame kind="explain">
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
              <Button
                disabled={shown >= total}
                onClick={() => setShown((n) => Math.min(n + 1, total))}
              >
                {shown >= total ? 'All notes shown' : 'Show next note'}
              </Button>
              <Button disabled={shown >= total} onClick={() => setShown(total)}>
                Show all
              </Button>
              <span className="w-muted" role="status">
                {shown} of {total} notes
              </span>
            </div>
          ) : null}
        </>
      ) : null}
    </WidgetFrame>
  );
}

const ReviewCardsContext = createContext<Readonly<Record<string, string>>>({});

/** The host supplies the learner-facing concept names (by concept id) that become review cards. */
export const ReviewCardsProvider = ReviewCardsContext.Provider;

const DUE_TIMES = ['in 1 day', 'in 3 days', 'in 1 week', 'in 2 weeks'] as const;

export function Recap({ step }: StepComponentProps<StepOfKind<'recap'>>) {
  const names = useContext(ReviewCardsContext);
  const cards = step.concepts.flatMap((id) => {
    const name = Object.hasOwn(names, id) ? names[id] : undefined;
    return name === undefined ? [] : [name];
  });
  return (
    <WidgetFrame kind="recap">
      <ol className="w-points">
        {step.points.map((p, i) => (
          <li key={i}>
            <span className="w-point-n" aria-hidden="true">
              {i + 1}
            </span>
            <p>{renderInline(p)}</p>
          </li>
        ))}
      </ol>
      {cards.length > 0 ? (
        <section className="w-reviews" aria-label="Review cards">
          <h3 className="w-label">These come back as review cards</h3>
          <ul className="w-review-list">
            {cards.map((name, i) => (
              <li key={name}>
                <ReviewCard
                  question={`Can you explain: ${name}?`}
                  due={DUE_TIMES[Math.min(i, DUE_TIMES.length - 1)] ?? 'soon'}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </WidgetFrame>
  );
}

export function Cliffhanger({ step }: StepComponentProps<StepOfKind<'cliffhanger'>>) {
  return (
    <WidgetFrame kind="cliffhanger">
      <div className="w-cliff">
        <CliffhangerCard>{renderInline(step.question)}</CliffhangerCard>
      </div>
    </WidgetFrame>
  );
}
