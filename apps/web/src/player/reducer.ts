import { isActive, type Step } from '@learn-code/lesson-schema';
import type { PlayerAction, PlayerState, StepResult } from './types';

const VIEWED: StepResult = { status: 'viewed' };

/** Passive steps complete on view: record `viewed` for the step at the current index. */
function markViewed(steps: readonly Step[], state: PlayerState): PlayerState {
  const step = steps[state.index];
  if (step === undefined || isActive(step) || state.results[step.id] !== undefined) return state;
  return { ...state, results: { ...state.results, [step.id]: VIEWED } };
}

/** Index of the first active step without a result, or the last step if none is open. */
export function gateIndex(steps: readonly Step[], results: PlayerState['results']): number {
  const open = steps.findIndex((s) => isActive(s) && results[s.id] === undefined);
  return open === -1 ? Math.max(steps.length - 1, 0) : open;
}

export function initialState(lessonId: string, steps: readonly Step[]): PlayerState {
  return markViewed(steps, { lessonId, index: 0, results: {} });
}

/** Make a stored state safe: known steps only, and never past an unanswered active step. */
export function sanitize(steps: readonly Step[], state: PlayerState): PlayerState {
  const known = new Set(steps.map((s) => s.id));
  const results = Object.fromEntries(Object.entries(state.results).filter(([id]) => known.has(id)));
  const limit = gateIndex(steps, results);
  const index = Math.min(Math.max(Math.trunc(state.index), 0), limit);
  return markViewed(steps, { lessonId: state.lessonId, index, results });
}

export function reduce(
  steps: readonly Step[],
  state: PlayerState,
  action: PlayerAction,
): PlayerState {
  switch (action.type) {
    case 'complete': {
      if (!steps.some((s) => s.id === action.stepId)) return state;
      return { ...state, results: { ...state.results, [action.stepId]: action.result } };
    }
    case 'next': {
      const current = steps[state.index];
      if (current === undefined || state.index >= steps.length - 1) return state;
      if (isActive(current) && state.results[current.id] === undefined) return state;
      return markViewed(steps, { ...state, index: state.index + 1 });
    }
    case 'back':
      return state.index > 0 ? { ...state, index: state.index - 1 } : state;
    case 'restore':
      return action.state.lessonId === state.lessonId ? sanitize(steps, action.state) : state;
    default: {
      const unreachable: never = action;
      return unreachable;
    }
  }
}

export function isLessonComplete(steps: readonly Step[], state: PlayerState): boolean {
  return steps.length > 0 && steps.every((s) => state.results[s.id] !== undefined);
}
