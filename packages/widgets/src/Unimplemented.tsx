import type { Step } from '@learn-code/lesson-schema';
import type { StepComponentProps } from './types';

/** Visible stand-in for step kinds whose widget is not built yet. */
export function Unimplemented({ step }: StepComponentProps<Step>) {
  return (
    <div className="w-widget w-placeholder" data-kind={step.kind} role="note">
      <p className="w-tag">Not built yet</p>
      <p>
        The widget for <code>{step.kind}</code> steps has not been built yet.
      </p>
    </div>
  );
}
