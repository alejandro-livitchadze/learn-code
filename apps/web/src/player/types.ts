import type { Step } from '@learn-code/lesson-schema';

export type StepResult =
  | { readonly status: 'viewed' }
  | {
      readonly status: 'answered';
      readonly correct: boolean;
      readonly attempts: number;
      readonly payload: unknown;
    };

export interface PlayerState {
  readonly lessonId: string;
  readonly index: number;
  readonly results: Readonly<Record<string, StepResult>>;
}

export type PlayerAction =
  | { readonly type: 'complete'; readonly stepId: string; readonly result: StepResult }
  | { readonly type: 'next' }
  | { readonly type: 'back' }
  | { readonly type: 'restore'; readonly state: PlayerState };

export interface StepComponentProps<TStep extends Step> {
  readonly step: TStep;
  readonly restored: StepResult | undefined;
  readonly onComplete: (result: StepResult) => void;
}

export interface ProgressStore {
  load(lessonId: string): Promise<PlayerState | null>;
  save(state: PlayerState, meta?: { readonly completed: boolean }): Promise<void>;
  listCompleted(courseId: string): Promise<readonly string[]>;
}

export type PlayerEvent =
  | { readonly type: 'step_viewed'; readonly lessonId: string; readonly stepId: string }
  | {
      readonly type: 'step_answered';
      readonly lessonId: string;
      readonly stepId: string;
      readonly correct: boolean;
      readonly attempts: number;
    }
  | { readonly type: 'hint_used'; readonly lessonId: string; readonly stepId: string }
  | { readonly type: 'lesson_completed'; readonly lessonId: string };

export interface EventSink {
  emit(event: PlayerEvent): void;
}
