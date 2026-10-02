import { Unimplemented } from './Unimplemented';
import { Cliffhanger, Explain, Hook, Pitfall, Recap } from './Passive';
import { Predict } from './Predict';
import { FillBlanks } from './FillBlanks';
import { SqlLabWidget } from './sql-wiring';
import type { Step } from '@learn-code/lesson-schema';
import type { StepComponentProps, WidgetRegistry } from './types';

/** One component per step kind. Kinds without a real widget map to a visible placeholder. */
export const widgetRegistry: WidgetRegistry = {
  hook: Hook,
  recall: Unimplemented,
  predict: Predict,
  reveal: Unimplemented,
  explain: Explain,
  beTheRuntime: Unimplemented,
  beTheDatabase: Unimplemented,
  parsons: Unimplemented,
  fillBlanks: FillBlanks,
  firesideChat: Unimplemented,
  brainPower: Unimplemented,
  matching: Unimplemented,
  pitfall: Pitfall,
  sqlLab: SqlLabWidget,
  schemaBuilder: Unimplemented,
  relationLab: Unimplemented,
  normalizeLab: Unimplemented,
  namingReview: Unimplemented,
  migrationLab: Unimplemented,
  recap: Recap,
  cliffhanger: Cliffhanger,
};

/** Kinds that have a real widget (the rest render the placeholder). */
export const IMPLEMENTED_KINDS = [
  'hook',
  'explain',
  'recap',
  'cliffhanger',
  'pitfall',
  'predict',
  'fillBlanks',
  'sqlLab',
] as const;

/**
 * Renders the widget for any step. The switch narrows `step` per kind, so no cast is needed, and
 * the `never` check fails type checking when a kind is added to the schema without a case.
 */
export function StepWidget({ step, restored, onComplete }: StepComponentProps<Step>) {
  switch (step.kind) {
    case 'hook': {
      const W = widgetRegistry.hook;
      return <W step={step} restored={restored} onComplete={onComplete} />;
    }
    case 'recall': {
      const W = widgetRegistry.recall;
      return <W step={step} restored={restored} onComplete={onComplete} />;
    }
    case 'predict': {
      const W = widgetRegistry.predict;
      return <W step={step} restored={restored} onComplete={onComplete} />;
    }
    case 'reveal': {
      const W = widgetRegistry.reveal;
      return <W step={step} restored={restored} onComplete={onComplete} />;
    }
    case 'explain': {
      const W = widgetRegistry.explain;
      return <W step={step} restored={restored} onComplete={onComplete} />;
    }
    case 'beTheRuntime': {
      const W = widgetRegistry.beTheRuntime;
      return <W step={step} restored={restored} onComplete={onComplete} />;
    }
    case 'beTheDatabase': {
      const W = widgetRegistry.beTheDatabase;
      return <W step={step} restored={restored} onComplete={onComplete} />;
    }
    case 'parsons': {
      const W = widgetRegistry.parsons;
      return <W step={step} restored={restored} onComplete={onComplete} />;
    }
    case 'fillBlanks': {
      const W = widgetRegistry.fillBlanks;
      return <W step={step} restored={restored} onComplete={onComplete} />;
    }
    case 'firesideChat': {
      const W = widgetRegistry.firesideChat;
      return <W step={step} restored={restored} onComplete={onComplete} />;
    }
    case 'brainPower': {
      const W = widgetRegistry.brainPower;
      return <W step={step} restored={restored} onComplete={onComplete} />;
    }
    case 'matching': {
      const W = widgetRegistry.matching;
      return <W step={step} restored={restored} onComplete={onComplete} />;
    }
    case 'pitfall': {
      const W = widgetRegistry.pitfall;
      return <W step={step} restored={restored} onComplete={onComplete} />;
    }
    case 'sqlLab': {
      const W = widgetRegistry.sqlLab;
      return <W step={step} restored={restored} onComplete={onComplete} />;
    }
    case 'schemaBuilder': {
      const W = widgetRegistry.schemaBuilder;
      return <W step={step} restored={restored} onComplete={onComplete} />;
    }
    case 'relationLab': {
      const W = widgetRegistry.relationLab;
      return <W step={step} restored={restored} onComplete={onComplete} />;
    }
    case 'normalizeLab': {
      const W = widgetRegistry.normalizeLab;
      return <W step={step} restored={restored} onComplete={onComplete} />;
    }
    case 'namingReview': {
      const W = widgetRegistry.namingReview;
      return <W step={step} restored={restored} onComplete={onComplete} />;
    }
    case 'migrationLab': {
      const W = widgetRegistry.migrationLab;
      return <W step={step} restored={restored} onComplete={onComplete} />;
    }
    case 'recap': {
      const W = widgetRegistry.recap;
      return <W step={step} restored={restored} onComplete={onComplete} />;
    }
    case 'cliffhanger': {
      const W = widgetRegistry.cliffhanger;
      return <W step={step} restored={restored} onComplete={onComplete} />;
    }
    default: {
      const unreachable: never = step;
      return unreachable;
    }
  }
}
