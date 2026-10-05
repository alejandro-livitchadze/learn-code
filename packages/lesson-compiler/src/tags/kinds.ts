import type { SchemaAttribute } from '@markdoc/markdoc';
import type { BuildContext, Fields, TagSpec } from './types';

const str = (required = false): SchemaAttribute => ({ type: String, required });
const num = (required = false): SchemaAttribute => ({ type: Number, required });
const bool = (): SchemaAttribute => ({ type: Boolean });
const arr = (required = false): SchemaAttribute => ({ type: Array, required });
const oneOf = (values: readonly string[], required = false): SchemaAttribute => ({
  type: String,
  required,
  matches: [...values],
});

const LANGUAGES = ['ts', 'js', 'sql', 'http'];

/** Attributes every step tag has. */
const common = {
  id: str(true),
  estSeconds: num(true),
  concepts: arr(),
};

/** Attributes whose string value may be a `./relative/file` reference. */
export const FILE_ATTRIBUTES: ReadonlySet<string> = new Set([
  'code',
  'template',
  'starter',
  'solution',
  'badCode',
  'goodCode',
  'query',
  'ddl',
  'before',
  'after',
  'design',
]);

/** Copy the named attributes that are present, preserving their values. */
function pick(c: BuildContext, ...names: string[]): Fields {
  const out: Fields = {};
  for (const n of names) {
    const v = c.attrs[n];
    if (v !== undefined) out[n] = v;
  }
  return out;
}

function stepBase(c: BuildContext): Fields {
  return { ...pick(c, 'id', 'estSeconds'), concepts: c.attrs['concepts'] ?? [] };
}

/** Parse the JSON of a `design` attribute. A broken file stops the step with a readable message. */
function readDesign(raw: unknown): Fields {
  if (typeof raw !== 'string') return {};
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    throw new Error(`design is not valid JSON: ${(e instanceof Error ? e.message : String(e))}`);
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error('design must be a JSON object');
  }
  return { ...data };
}

const texts = (c: BuildContext, name: string): string[] =>
  c.kids(name).map((k) => c.child(k).body());

function option(c: BuildContext, textField: 'text' | 'output'): Fields {
  return {
    [textField]: c.attrs[textField],
    isCorrect: c.attrs['correct'] === true,
    feedback: c.body(),
    ...pick(c, 'misconception'),
  };
}

const optionTag = {
  attributes: { text: str(), output: str(), correct: bool(), misconception: str() },
};

const tableTag = {
  attributes: { name: str(true), columns: arr(true), rows: arr() },
};

const table = (c: BuildContext, withRows: boolean): Fields[] =>
  c.kids('table').map((k) => {
    const t = c.child(k);
    return withRows
      ? { name: t.attrs['name'], columns: t.attrs['columns'], rows: t.attrs['rows'] ?? [] }
      : { name: t.attrs['name'], columns: t.attrs['columns'] };
  });

/** Helper tags that only appear nested inside a step tag. */
export const CHILD_TAGS: Record<string, { readonly attributes: Record<string, SchemaAttribute> }> =
  {
    option: optionTag,
    question: { attributes: { prompt: str(true), fromLessonId: str() } },
    blank: {
      attributes: { id: str(true), accepted: arr(true), misconception: str() },
    },
    message: { attributes: { speaker: str(true) } },
    pair: { attributes: { left: str(true), right: str(true) } },
    item: { attributes: { id: str(true) } },
    annotation: { attributes: { line: num(true) } },
    hint: { attributes: {} },
    table: tableTag,
    startTable: tableTag,
    relation: {
      attributes: {
        from: str(true),
        to: str(true),
        cardinality: oneOf(['one-to-one', 'one-to-many', 'many-to-many'], true),
      },
    },
    issue: {
      attributes: { identifier: str(true), problem: str(true) },
    },
    stage: { attributes: {} },
    point: { attributes: {} },
    margin: { attributes: {} },
    sticky: { attributes: { who: oneOf(['olha']), label: oneOf(['asks', 'says'], true) } },
    bubble: { attributes: { who: oneOf(['bug', 'runtime'], true) } },
    gotcha: { attributes: {} },
    stop: { attributes: {} },
    diagram: { attributes: { ref: str(true), caption: str(true) } },
  };

/** Tags allowed inside `{% margin %}`. Every step tag may contain one `margin`. */
export const MARGIN_CHILDREN: readonly string[] = ['sticky', 'bubble', 'gotcha', 'stop', 'diagram'];

/** Plain margin item for one tag inside `{% margin %}`. */
export function marginItem(name: string, c: BuildContext): Fields {
  switch (name) {
    case 'sticky':
      return {
        type: 'sticky',
        who: c.attrs['who'] ?? 'olha',
        label: c.attrs['label'],
        text: c.body(),
      };
    case 'bubble':
      return { type: 'bubble', who: c.attrs['who'], text: c.body() };
    case 'gotcha':
      return { type: 'gotcha', text: c.body() };
    case 'stop':
      return { type: 'stopAndThink', text: c.body() };
    default:
      return { type: 'diagram', ref: c.attrs['ref'], caption: c.attrs['caption'] };
  }
}

/** One tag per step kind, keyed by the `kind` value in the schema. */
export const KIND_TAGS: Record<string, TagSpec> = {
  hook: {
    attributes: { ...common, character: oneOf(['bug', 'olha', 'mrRuntime']) },
    children: [],
    build: (c) => ({ ...stepBase(c), kind: 'hook', body: c.body(), ...pick(c, 'character') }),
  },
  recall: {
    attributes: { ...common },
    children: ['question'],
    build: (c) => ({
      ...stepBase(c),
      kind: 'recall',
      questions: c.kids('question').map((q) => {
        const qc = c.child(q);
        return {
          prompt: qc.attrs['prompt'],
          options: qc.kids('option').map((o) => option(qc.child(o), 'text')),
          ...pick(qc, 'fromLessonId'),
        };
      }),
    }),
  },
  predict: {
    attributes: { ...common, code: str(true), language: oneOf(LANGUAGES, true) },
    children: ['option'],
    build: (c) => ({
      ...stepBase(c),
      kind: 'predict',
      ...pick(c, 'code', 'language'),
      options: c.kids('option').map((o) => option(c.child(o), 'output')),
    }),
  },
  reveal: {
    attributes: { ...common, traceRef: str(true), caption: str() },
    children: [],
    build: (c) => ({
      ...stepBase(c),
      kind: 'reveal',
      body: c.body(),
      ...pick(c, 'traceRef', 'caption'),
    }),
  },
  explain: {
    attributes: { ...common, code: str() },
    children: ['annotation'],
    build: (c) => ({
      ...stepBase(c),
      kind: 'explain',
      body: c.body(),
      ...pick(c, 'code'),
      annotations: c.kids('annotation').map((a) => {
        const ac = c.child(a);
        return { line: ac.attrs['line'], text: ac.body() };
      }),
    }),
  },
  beTheRuntime: {
    attributes: {
      ...common,
      code: str(true),
      language: oneOf(['ts', 'js'], true),
      traceRef: str(true),
      prompt: str(true),
    },
    children: [],
    build: (c) => ({
      ...stepBase(c),
      kind: 'beTheRuntime',
      ...pick(c, 'code', 'language', 'traceRef', 'prompt'),
    }),
  },
  beTheDatabase: {
    attributes: { ...common, query: str(true), traceRef: str(true), prompt: str(true) },
    children: ['table'],
    build: (c) => ({
      ...stepBase(c),
      kind: 'beTheDatabase',
      ...pick(c, 'query', 'traceRef', 'prompt'),
      tables: table(c, true),
    }),
  },
  parsons: {
    attributes: { ...common, prompt: str(true), feedback: str(true) },
    children: ['item'],
    build: (c) => ({
      ...stepBase(c),
      kind: 'parsons',
      ...pick(c, 'prompt', 'feedback'),
      items: c.kids('item').map((i) => {
        const ic = c.child(i);
        return { id: ic.attrs['id'], text: ic.body() };
      }),
    }),
  },
  fillBlanks: {
    attributes: { ...common, template: str(true), language: oneOf(LANGUAGES, true) },
    children: ['blank'],
    build: (c) => ({
      ...stepBase(c),
      kind: 'fillBlanks',
      ...pick(c, 'template', 'language'),
      blanks: c.kids('blank').map((b) => {
        const bc = c.child(b);
        return { ...pick(bc, 'id', 'accepted', 'misconception'), feedback: bc.body() };
      }),
    }),
  },
  firesideChat: {
    attributes: { ...common, speakers: arr(true), question: str(true) },
    children: ['message', 'option'],
    build: (c) => ({
      ...stepBase(c),
      kind: 'firesideChat',
      ...pick(c, 'speakers', 'question'),
      messages: c.kids('message').map((m) => {
        const mc = c.child(m);
        return { speaker: mc.attrs['speaker'], text: mc.body() };
      }),
      options: c.kids('option').map((o) => option(c.child(o), 'text')),
    }),
  },
  brainPower: {
    attributes: { ...common, question: str(true), minChars: num() },
    children: [],
    build: (c) => ({
      ...stepBase(c),
      kind: 'brainPower',
      ...pick(c, 'question', 'minChars'),
      explanation: c.body(),
    }),
  },
  matching: {
    attributes: { ...common, prompt: str(true) },
    children: ['pair'],
    build: (c) => ({
      ...stepBase(c),
      kind: 'matching',
      ...pick(c, 'prompt'),
      pairs: c.kids('pair').map((p) => pick(c.child(p), 'left', 'right')),
    }),
  },
  pitfall: {
    attributes: { ...common, badCode: str(), goodCode: str(), language: oneOf(LANGUAGES) },
    children: [],
    build: (c) => ({
      ...stepBase(c),
      kind: 'pitfall',
      body: c.body(),
      ...pick(c, 'badCode', 'goodCode', 'language'),
    }),
  },
  sqlLab: {
    attributes: {
      ...common,
      prompt: str(true),
      seedRef: str(true),
      starter: str(),
      solution: str(true),
      orderMatters: bool(),
    },
    children: ['hint'],
    build: (c) => ({
      ...stepBase(c),
      kind: 'sqlLab',
      ...pick(c, 'prompt', 'seedRef', 'starter', 'solution', 'orderMatters'),
      hints: texts(c, 'hint'),
    }),
  },
  schemaBuilder: {
    // `design` is a `./design/<name>.json` file: loose fields, roles, scenarios, reference and
    // wrong drafts. Its shape is validated by the `designTask` schema.
    attributes: { ...common, prompt: str(true), design: str(true) },
    children: [],
    build: (c) => ({
      ...stepBase(c),
      kind: 'schemaBuilder',
      ...pick(c, 'prompt'),
      ...readDesign(c.attrs['design']),
    }),
  },
  relationLab: {
    attributes: { ...common, prompt: str(true), entities: arr(true) },
    children: ['relation'],
    build: (c) => ({
      ...stepBase(c),
      kind: 'relationLab',
      ...pick(c, 'prompt', 'entities'),
      expected: c.kids('relation').map((r) => pick(c.child(r), 'from', 'to', 'cardinality')),
    }),
  },
  normalizeLab: {
    attributes: {
      ...common,
      prompt: str(true),
      targetForm: oneOf(['1nf', '2nf', '3nf'], true),
    },
    children: ['startTable', 'table'],
    build: (c) => {
      const start = c.kids('startTable')[0];
      const s = start ? c.child(start) : undefined;
      return {
        ...stepBase(c),
        kind: 'normalizeLab',
        ...pick(c, 'prompt', 'targetForm'),
        ...(s
          ? {
              startTable: {
                name: s.attrs['name'],
                columns: s.attrs['columns'],
                rows: s.attrs['rows'] ?? [],
              },
            }
          : {}),
        expectedTables: table(c, false),
      };
    },
  },
  namingReview: {
    attributes: { ...common, prompt: str(true), ddl: str(true) },
    children: ['issue'],
    build: (c) => ({
      ...stepBase(c),
      kind: 'namingReview',
      ...pick(c, 'prompt', 'ddl'),
      issues: c.kids('issue').map((i) => {
        const ic = c.child(i);
        return { ...pick(ic, 'identifier', 'problem'), fix: ic.body() };
      }),
    }),
  },
  migrationLab: {
    attributes: {
      ...common,
      prompt: str(true),
      seedRef: str(true),
      before: str(true),
      after: str(true),
    },
    children: ['stage'],
    build: (c) => ({
      ...stepBase(c),
      kind: 'migrationLab',
      ...pick(c, 'prompt', 'seedRef', 'before', 'after'),
      steps: texts(c, 'stage'),
    }),
  },
  recap: {
    attributes: { ...common },
    children: ['point'],
    build: (c) => ({ ...stepBase(c), kind: 'recap', points: texts(c, 'point') }),
  },
  cliffhanger: {
    attributes: { ...common, question: str(true), nextLessonId: str() },
    children: [],
    build: (c) => ({ ...stepBase(c), kind: 'cliffhanger', ...pick(c, 'question', 'nextLessonId') }),
  },
};
