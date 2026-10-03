'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import { isActive, type Lesson } from '@learn-code/lesson-schema';
import {
  Button,
  buttonClass,
  Highlight,
  PageFooter,
  PageHeader,
  PageShell,
  stepTagText,
} from '@learn-code/ui';
import {
  FooterProvider,
  HighlightsProvider,
  HookLead,
  ReviewCardsProvider,
  MarginItems,
  MarginSlotProvider,
  SeedBaseProvider,
  StepWidget,
  type HighlightMap,
  type StepFooter,
  type StepResult,
} from '@learn-code/widgets';
import { ConsoleEventSink } from './events';
import { LocalStorageProgressStore } from './progress';
import { initialState, isLessonComplete, reduce } from './reducer';
import { splitTitle } from './title';
import type { PlayerAction, PlayerState } from './types';

interface Props {
  readonly lesson: Lesson;
  readonly highlights: HighlightMap;
  /** Concept names by id, for the review cards on a recap. */
  readonly conceptNames?: Readonly<Record<string, string>>;
  /** The lesson the last step leads to, when the cliffhanger names one that exists. */
  readonly next?: { readonly href: string; readonly title: string };
}

function titleNode(lesson: Lesson): ReactNode {
  const parts = splitTitle(lesson.title, lesson.titleHighlights);
  if (parts.mark === undefined) return lesson.title;
  return (
    <>
      {parts.before}
      <Highlight>{parts.mark}</Highlight>
      {parts.after}
    </>
  );
}

const store = new LocalStorageProgressStore();
const sink = new ConsoleEventSink();

function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  return t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(t.tagName);
}

export function LessonPlayer({ lesson, highlights, conceptNames = {}, next: nextLesson }: Props) {
  const lessonId = `${lesson.courseId}/${lesson.id}`;
  const steps = lesson.steps;
  const [state, dispatch] = useReducer(
    (s: PlayerState, a: PlayerAction) => reduce(steps, s, a),
    undefined,
    () => initialState(lessonId, steps),
  );
  const [ready, setReady] = useState(false);
  const [footer, setFooter] = useState<StepFooter | undefined>(undefined);
  const [marginSlot, setMarginSlot] = useState<HTMLElement | null>(null);
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

  const hint = open ? (footer?.hint ?? 'Answer this step to continue.') : '';
  const action = open ? footer?.action : undefined;
  const finish = isLast ? (
    open || !ready ? (
      <Button variant="primary" disabled aria-describedby="gate-hint">
        Finish
      </Button>
    ) : nextLesson !== undefined ? (
      <>
        <Link href="/" className="all-lessons">
          All lessons
        </Link>
        <Link href={nextLesson.href} className={buttonClass('primary')}>
          Next lesson: {nextLesson.title}
        </Link>
      </>
    ) : (
      <Link href="/" className={buttonClass('primary')}>
        Finish
      </Link>
    )
  ) : action !== undefined ? (
    <Button
      variant="primary"
      onClick={action.onAct}
      disabled={action.disabled}
      aria-describedby="gate-hint"
    >
      {action.label}
    </Button>
  ) : (
    <Button variant="primary" onClick={next} disabled={open || !ready} aria-describedby="gate-hint">
      Continue
    </Button>
  );

  const position = `step ${state.index + 1} of ${steps.length}`;
  const tagText = step === undefined ? null : stepTagText(step.kind);

  return (
    <>
      <p className="notice" role="note">
        This course needs a desktop browser at least 1024 px wide. Please widen your window or
        switch to a computer.
      </p>
      <div className="player-root" aria-busy={!ready}>
        <PageShell
          lead={ready && step?.kind === 'hook' ? <HookLead key={step.id} step={step} /> : undefined}
          margin={
            <>
              <div ref={setMarginSlot} />
              {ready && step !== undefined ? (
                <MarginItems key={step.id} items={step.margin} />
              ) : null}
            </>
          }
          header={
            <PageHeader
              module="All lessons"
              moduleHref="/"
              renderLink={({ href, className, children }) => (
                <Link href={href} className={className}>
                  {children}
                </Link>
              )}
              title={titleNode(lesson)}
              counter={
                <span className="counter">
                  <span>{isLast && complete ? `${position} · done!` : position}</span>
                  <span
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
                        data-state={
                          i === state.index ? 'current' : state.results[s.id] ? 'done' : 'todo'
                        }
                      />
                    ))}
                  </span>
                </span>
              }
            />
          }
          footer={
            <PageFooter
              back={
                <Button onClick={back} disabled={state.index === 0}>
                  Back
                </Button>
              }
              hint={hint}
              hintId="gate-hint"
              primary={finish}
            />
          }
        >
          <section aria-label="Current step">
            {ready && step ? (
              <div className="step" key={step.id}>
                <h2
                  ref={headingRef}
                  tabIndex={-1}
                  className="step-title"
                  data-testid="step-heading"
                >
                  {tagText === null ? position : `${position}: ${tagText}`}
                </h2>
                <HighlightsProvider value={highlights}>
                  <SeedBaseProvider value={`/seeds/${lesson.courseId}/${lesson.id}`}>
                    <MarginSlotProvider value={marginSlot}>
                      <FooterProvider value={setFooter}>
                        <ReviewCardsProvider value={conceptNames}>
                          {step.kind === 'hook' ? null : (
                            <StepWidget step={step} restored={current} onComplete={onComplete} />
                          )}
                        </ReviewCardsProvider>
                      </FooterProvider>
                    </MarginSlotProvider>
                  </SeedBaseProvider>
                </HighlightsProvider>
              </div>
            ) : (
              <p role="status" className="loading">
                Loading your progress…
              </p>
            )}
          </section>
        </PageShell>
      </div>
    </>
  );
}
