export {
  checkFillBlanks,
  checkPredict,
  correctPredictIndex,
  humanizeMisconception,
  normalizeAnswer,
  parseTemplate,
} from '@learn-code/lesson-schema';
export type { BlankResult, FillBlanksCheck, TemplatePart } from '@learn-code/lesson-schema';

/** Narrow a saved payload to a string map, or undefined if it is anything else. */
export function readAnswers(payload: unknown): Readonly<Record<string, string>> | undefined {
  if (typeof payload !== 'object' || payload === null) return undefined;
  const answers: unknown = Reflect.get(payload, 'answers');
  if (typeof answers !== 'object' || answers === null) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(answers)) {
    if (typeof v !== 'string') return undefined;
    out[k] = v;
  }
  return out;
}

/** Narrow a saved payload to a chosen option index, or undefined. */
export function readChosen(payload: unknown): number | undefined {
  if (typeof payload !== 'object' || payload === null) return undefined;
  const chosen: unknown = Reflect.get(payload, 'chosen');
  return typeof chosen === 'number' && Number.isInteger(chosen) && chosen >= 0 ? chosen : undefined;
}
