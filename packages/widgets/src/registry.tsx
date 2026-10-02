import { Unimplemented } from './Unimplemented';
import { Cliffhanger, Explain, Hook, Pitfall, Recap } from './Passive';
import { Predict } from './Predict';
import { FillBlanks } from './FillBlanks';
import type { WidgetRegistry } from './types';

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
  sqlLab: Unimplemented,
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
] as const;
