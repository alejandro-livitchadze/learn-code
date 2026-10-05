import { InkCard } from '@learn-code/ui';
import type { Step } from '@learn-code/lesson-schema';
import type { StepComponentProps } from './types';

/** Stand-in for step kinds whose widget does not exist yet. It never names the kind. */
export function Unimplemented({ step }: StepComponentProps<Step>) {
  return (
    <div className="w-widget" data-kind={step.kind} role="note">
      <InkCard>
        <p className="w-question">This activity is coming soon.</p>
      </InkCard>
    </div>
  );
}
