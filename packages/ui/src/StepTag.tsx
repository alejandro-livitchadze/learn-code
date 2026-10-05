/** Step kinds that carry a tag (E08 section 6). `hook` has none. */
export type TaggedStepKind =
  | 'predict'
  | 'reveal'
  | 'explain'
  | 'fillBlanks'
  | 'sqlLab'
  | 'schemaBuilder'
  | 'bugHunt'
  | 'parsons'
  | 'firesideChat'
  | 'brainPower'
  | 'matching'
  | 'pitfall'
  | 'recall'
  | 'recap'
  | 'beTheRuntime'
  | 'beTheDatabase';

export const STEP_TAGS: Readonly<Record<TaggedStepKind, string>> = {
  predict: 'Predict',
  reveal: 'What really happened',
  explain: "Here's the thing",
  fillBlanks: 'Your turn',
  sqlLab: 'Your turn',
  schemaBuilder: 'Your turn',
  bugHunt: 'Your turn',
  parsons: 'Put it in order',
  firesideChat: "Who's right?",
  brainPower: 'Stop and think',
  matching: 'Match them up',
  pitfall: 'Gotcha',
  recall: 'Remember this?',
  recap: 'Pin this to your brain',
  beTheRuntime: 'You are the machine',
  beTheDatabase: 'You are the machine',
};

/** The tag text for a step kind, or `null` when the kind has none (hook, cliffhanger, unknown). */
export function stepTagText(kind: string): string | null {
  return Object.hasOwn(STEP_TAGS, kind) ? STEP_TAGS[kind as TaggedStepKind] : null;
}

/** One per step, text from the fixed vocabulary. Renders nothing for kinds without a tag. */
export function StepTag({ kind }: { readonly kind: string }) {
  const text = stepTagText(kind);
  return text === null ? null : <span className="ui-steptag">{text}</span>;
}
