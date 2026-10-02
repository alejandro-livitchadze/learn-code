import type { Step } from '@learn-code/lesson-schema';
import { isActive } from '@learn-code/lesson-schema';
import type { HighlightMap } from '../lib/highlight';
import { AnnotatedCode } from './AnnotatedCode';
import type { StepComponentProps } from './types';

interface Props extends StepComponentProps<Step> {
  readonly highlights: HighlightMap;
}

/**
 * Stand-in until E03 delivers real widgets. Shows the step JSON. Active steps get a
 * button that records an answer, so the gating can be exercised end to end.
 */
export function StepPlaceholder({ step, restored, onComplete, highlights }: Props) {
  const explainLines = step.kind === 'explain' ? highlights[`${step.id}:code`] : undefined;
  return (
    <div className="placeholder">
      <p className="badge">Placeholder for “{step.kind}” (widget arrives in E03)</p>
      {step.kind === 'explain' && explainLines ? (
        <AnnotatedCode lines={explainLines} annotations={step.annotations} label="Annotated code" />
      ) : null}
      <pre className="json" tabIndex={0}>
        {JSON.stringify(step, null, 2)}
      </pre>
      {isActive(step) ? (
        restored?.status === 'answered' ? (
          <p role="status">Answered.</p>
        ) : (
          <button
            type="button"
            className="secondary"
            onClick={() =>
              onComplete({ status: 'answered', correct: true, attempts: 1, payload: null })
            }
          >
            Mark as answered
          </button>
        )
      ) : null}
    </div>
  );
}
