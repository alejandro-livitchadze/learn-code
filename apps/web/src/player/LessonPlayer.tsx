'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { isActive, type Lesson } from '@learn-code/lesson-schema';
import {
  HighlightsProvider,
  StepWidget,
  type HighlightMap,
  type StepResult,
} from '@learn-code/widgets';
import { ConsoleEventSink } from './events';
import { LocalStorageProgressStore } from './progress';
import { initialState, isLessonComplete, reduce } from './reducer';
import type { PlayerAction, PlayerState } from './types';

interface Props {
  readonly lesson: Lesson;
  readonly highlights: HighlightMap;
}

const store = new LocalStorageProgressStore();
const sink = new ConsoleEventSink();

function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  return t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(t.tagName);
}

export function LessonPlayer({ lesson, highlights }: Props) {
  const lessonId = `${lesson.courseId}/${lesson.id}`;
  const steps = lesson.steps;
  const [state, dispatch] = useReducer(
    (s: PlayerState, a: PlayerAction) => reduce(steps, s, a),
    undefined,
    () => initialState(lessonId, steps),
  );
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  const wasComplete = useRef(false);

  // Restore saved progress once, after hydration (the server cannot read localStorage).
  useEffect(() => {
    let cancelled = false;
    void store.load(lessonId).then((saved) => {
      if (cancelled) return;
      if (saved) dispatch({ type: 'restore', state: saved });
      wasComplete.current =
        saved !== null &&
        isLessonComplete(
          steps,
          reduce(steps, initialState(lessonId, steps), { type: 'restore', state: saved }),
        );
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [lessonId, steps]);

  const complete = isLessonComplete(steps, state);
  useEffect(() => {
    if (ready) void store.save(state, { completed: complete });
  }, [ready, state, complete]);

  const step = steps[state.index];
  const stepId = step?.id;

  useEffect(() => {
    if (!ready || stepId === undefined) return;
    sink.emit({ type: 'step_viewed', lessonId, stepId });
    if (moved.current) headingRef.current?.focus();
    moved.current = true;
  }, [ready, stepId, lessonId]);

  useEffect(() => {
    if (ready && complete && !wasComplete.current) {
      wasComplete.current = true;
      sink.emit({ type: 'lesson_completed', lessonId });
    }
  }, [ready, complete, lessonId]);

  const onComplete = useCallback(
    (result: StepResult) => {
      if (stepId === undefined) return;
      if (result.status === 'answered') {
        sink.emit({
          type: 'step_answered',
          lessonId,
          stepId,
          correct: result.correct,
          attempts: result.attempts,
        });
      }
      dispatch({ type: 'complete', stepId, result });
    },
    [stepId, lessonId],
  );

  const current = step ? state.results[step.id] : undefined;
  const open = step !== undefined && isActive(step) && current === undefined;
  const isLast = state.index === steps.length - 1;
  const next = useCallback(() => dispatch({ type: 'next' }), []);
  const back = useCallback(() => dispatch({ type: 'back' }), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!ready || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (isTypingTarget(e.target)) return;
      if (e.key === 'ArrowLeft') back();
      else if (e.key === 'ArrowRight' || (e.key === 'Enter' && !isLast)) next();
      else if (e.key === 'Enter' && isLast && !open) router.push('/');
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ready, next, back, isLast, open, router]);

  return (
    <>
      <p className="notice" role="note">
        This course needs a desktop browser at least 1024 px wide. Please widen your window or
        switch to a computer.
      </p>
      <main className="player" aria-busy={!ready}>
        <header className="player-head">
          <Link href="/" className="crumb">
            All lessons
          </Link>
          <h1 className="lesson-title">{lesson.title}</h1>
          <div
            className="progress"
            role="progressbar"
            aria-label="Lesson progress"
            aria-valuemin={1}
            aria-valuemax={steps.length}
            aria-valuenow={state.index + 1}
            aria-valuetext={`Step ${state.index + 1} of ${steps.length}`}
          >
            {steps.map((s, i) => (
              <span
                key={s.id}
                className="seg"
                data-state={i === state.index ? 'current' : state.results[s.id] ? 'done' : 'todo'}
              />
            ))}
          </div>
        </header>

        <section className="stage" aria-label="Current step">
          {ready && step ? (
            <div className="step" key={step.id}>
              <h2 ref={headingRef} tabIndex={-1} className="step-title" data-testid="step-heading">
                Step {state.index + 1} of {steps.length}: {step.kind}
              </h2>
              <HighlightsProvider value={highlights}>
                <StepWidget step={step} restored={current} onComplete={onComplete} />
              </HighlightsProvider>
            </div>
          ) : (
            <p role="status" className="loading">
              Loading your progress…
            </p>
          )}
        </section>

        <footer className="controls">
          <button type="button" className="secondary" onClick={back} disabled={state.index === 0}>
            Back
          </button>
          <span className="hint" id="gate-hint">
            {open ? 'Answer this step to continue.' : ''}
          </span>
          {isLast ? (
            open || !ready ? (
              <button type="button" className="primary" disabled aria-describedby="gate-hint">
                Finish
              </button>
            ) : (
              <Link href="/" className="primary">
                Finish
              </Link>
            )
          ) : (
            <button
              type="button"
              className="primary"
              onClick={next}
              disabled={open || !ready}
              aria-describedby="gate-hint"
            >
              Continue
            </button>
          )}
        </footer>
      </main>
    </>
  );
}
