import type { ComponentType } from 'react';
import type { Step } from '@learn-code/lesson-schema';

/**
 * These shapes are structurally identical to `StepResult` and `StepComponentProps` in
 * `apps/web/src/player/types.ts`. The widgets package cannot import from the app, so the
 * contract is restated here; the follow-up wiring task should make the player import these.
 */
export type StepResult =
  | { readonly status: 'viewed' }
  | {
      readonly status: 'answered';
      readonly correct: boolean;
      readonly attempts: number;
      readonly payload: unknown;
    };

export interface StepComponentProps<TStep extends Step> {
  readonly step: TStep;
  readonly restored: StepResult | undefined;
  readonly onComplete: (result: StepResult) => void;
}

export type StepOfKind<K extends Step['kind']> = Extract<Step, { kind: K }>;

/** Adding a step kind to the schema without a widget fails type checking here. */
export type WidgetRegistry = {
  readonly [K in Step['kind']]: ComponentType<StepComponentProps<StepOfKind<K>>>;
};

/** Same shape as `HighlightMap` in `apps/web/src/lib/highlight.ts`. */
export interface HighlightedToken {
  readonly content: string;
  readonly style: Readonly<Record<string, string>>;
}
export type HighlightedLines = readonly (readonly HighlightedToken[])[];
export type HighlightMap = Readonly<Record<string, HighlightedLines>>;
