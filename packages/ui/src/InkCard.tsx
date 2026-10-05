import type { HTMLAttributes } from 'react';

export type InkCardState = 'default' | 'lifted' | 'selected';

export interface InkCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {
  readonly state?: InkCardState;
}

/** White card with an ink border. Only for things the learner acts on or reads closely. */
export function InkCard({ state = 'default', ...rest }: InkCardProps) {
  return <div className="ui-card" data-state={state} {...rest} />;
}
