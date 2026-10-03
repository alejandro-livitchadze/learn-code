import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { step } from '@learn-code/lesson-schema';
import { compileLesson, compileSource, formatError, CHILD_TAGS, KIND_TAGS } from './index';

const dir = join(dirname(fileURLToPath(import.meta.url)), '__fixtures__');
const path = join(dir, 'lesson.mdoc');
const valid = readFileSync(path, 'utf8');

/** Compile the valid lesson after replacing `from` with `to`; return errors. */
function broken(from: string, to: string) {
  expect(valid).toContain(from);
  const r = compileSource(valid.replace(from, to), path);
  if (r.ok) throw new Error('expected compile errors');
  return r.errors;
}
const lineOfText = (text: string): number =>
  valid.split('\n').findIndex((l) => l.includes(text)) + 1;

describe('compileLesson', () => {
  it('compiles a valid lesson file', () => {
    const r = compileLesson(path);
    if (!r.ok) throw new Error(r.errors.map(formatError).join('\n'));
    expect(r.lesson.id).toBe('joins-01');
    expect(r.lesson.steps.map((s) => s.kind)).toEqual([
      'hook',
      'predict',
      'explain',
      'recall',
      'fillBlanks',
      'sqlLab',
      'brainPower',
      'matching',
      'recap',
    ]);
    const predict = r.lesson.steps[1];
    expect(predict?.kind === 'predict' && predict.code).toContain('select count(*)');
    expect(predict?.kind === 'predict' && predict.options[1]).toMatchObject({
      output: '400 rows',
      isCorrect: true,
      feedback: 'Each order matched four items.',
    });
  });

  it('compiles margin tags into margin items', () => {
    const r = compileLesson(path);
    if (!r.ok) throw new Error(r.errors.map(formatError).join('\n'));
    expect(r.lesson.steps[2]?.margin).toEqual([
      { type: 'sticky', who: 'olha', label: 'asks', text: 'So the join multiplies rows?' },
      { type: 'gotcha', text: 'Count the rows before you trust a sum.' },
    ]);
    expect(r.lesson.steps[0]?.margin).toBeUndefined();
  });

  it('compiles bubble, stop and diagram items', () => {
    const errors = compileSource(
      valid.replace(
        '{% /hook %}',
        [
          '{% margin %}',
          '{% bubble who="bug" %}',
          'Mine.',
          '{% /bubble %}',
          '{% stop %}',
          'Why?',
          '{% /stop %}',
          '{% diagram ref="rows" caption="Rows grow" /%}',
          '{% /margin %}',
          '{% /hook %}',
        ].join('\n'),
      ),
      path,
    );
    if (!errors.ok) throw new Error(errors.errors.map(formatError).join('\n'));
    expect(errors.lesson.steps[0]?.margin).toEqual([
      { type: 'bubble', who: 'bug', text: 'Mine.' },
      { type: 'stopAndThink', text: 'Why?' },
      { type: 'diagram', ref: 'rows', caption: 'Rows grow' },
    ]);
  });

  it('rejects bad margin content, with its line', () => {
    const errors = broken(
      '{% /annotation %}\n',
      '{% /annotation %}\n{% margin %}\nLoose text.\n{% hint %}\nx\n{% /hint %}\n{% /margin %}\n',
    );
    const messages = errors.map((e) => e.message);
    expect(messages).toContainEqual(expect.stringContaining('text directly inside "margin"'));
    expect(messages).toContainEqual(
      expect.stringContaining('"hint" is not allowed inside "margin"'),
    );
  });

  it('rejects an unknown sticky label', () => {
    const errors = broken('label="asks"', 'label="shouts"');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('turns ==marks== in the title into titleHighlights', () => {
    const r = compileSource(
      valid.replace('Why your JOIN returned', 'Why your ==JOIN== returned'),
      path,
    );
    if (!r.ok) throw new Error(r.errors.map(formatError).join('\n'));
    expect(r.lesson.title).toBe('Why your JOIN returned 400 rows');
    expect(r.lesson.titleHighlights).toEqual(['JOIN']);
  });

  it('reports an unreadable file', () => {
    const r = compileLesson(join(dir, 'nope.mdoc'));
    expect(r).toMatchObject({ ok: false });
  });

  it('rejects text outside tags, with its line', () => {
    const errors = broken('{% hook', 'Stray paragraph.\n\n{% hook');
    expect(errors).toContainEqual(
      expect.objectContaining({
        line: lineOfText('{% hook'),
        message: expect.stringContaining('text outside'),
      }),
    );
    expect(formatError(errors[0]!)).toMatch(/lesson\.mdoc:\d+: /);
  });

  it('rejects a missing required attribute (Markdoc), with its line', () => {
    const errors = broken('estSeconds=40 ', '');
    expect(errors).toContainEqual({
      file: path,
      line: lineOfText('{% hook'),
      message: "Missing required attribute: 'estSeconds'",
    });
  });

  it('rejects a mistyped attribute', () => {
    const errors = broken('estSeconds=40', 'estSeconds="forty"');
    expect(errors[0]).toMatchObject({ line: lineOfText('{% hook') });
    expect(errors[0]?.message).toMatch(/Number/);
  });

  it('rejects an unknown tag', () => {
    const errors = broken(
      '{% hook',
      '{% banana id="x" estSeconds=1 %}\nhi\n{% /banana %}\n\n{% hook',
    );
    expect(errors.some((e) => e.message.includes("Undefined tag: 'banana'"))).toBe(true);
  });

  it('rejects a helper tag used as a step', () => {
    const errors = broken('{% hook', '{% point %}\nx\n{% /point %}\n\n{% hook');
    expect(errors.some((e) => e.message.includes('cannot be used as a step'))).toBe(true);
  });

  it('rejects a tag in the wrong parent', () => {
    const errors = broken(
      '{% hint %}\nUse an aggregate.\n{% /hint %}',
      '{% point %}\nUse an aggregate.\n{% /point %}',
    );
    expect(errors).toContainEqual(
      expect.objectContaining({ message: 'tag "point" is not allowed inside "sqlLab"' }),
    );
  });

  it('rejects a nested tag written inline inside a paragraph', () => {
    const errors = broken(
      '{% hint %}\nUse an aggregate.\n{% /hint %}',
      'Use {% hint %}x{% /hint %} now',
    );
    expect(errors.some((e) => e.message.includes('own line'))).toBe(true);
  });

  it('rejects a missing sample file', () => {
    const errors = broken('./samples/join.sql', './samples/missing.sql');
    expect(errors[0]).toMatchObject({
      line: lineOfText('{% predict'),
      message: expect.stringContaining('does not exist'),
    });
  });

  it('reports Zod failures at the step line (two correct options)', () => {
    const errors = broken(
      '{% option output="100 rows" misconception="join-keeps-row-count" %}',
      '{% option output="100 rows" correct=true %}',
    );
    expect(errors[0]).toMatchObject({ line: lineOfText('{% predict') });
    expect(errors[0]?.message).toContain('exactly one correct option');
  });

  it('reports a wrong option without a misconception id', () => {
    const errors = broken(' misconception="join-keeps-row-count"', '');
    expect(errors[0]).toMatchObject({ line: lineOfText('{% predict') });
    expect(errors[0]?.message).toContain('misconception');
  });

  it('reports a lesson with too few steps', () => {
    const cut = valid.slice(0, valid.indexOf('{% explain'));
    const r = compileSource(cut, path);
    expect(r.ok).toBe(false);
  });

  it('reports bad frontmatter', () => {
    const r = compileSource(valid.replace('id: joins-01\n', 'id: [unclosed\n'), path);
    expect(r).toMatchObject({ ok: false });
    if (!r.ok) expect(r.errors[0]?.message).toContain('frontmatter');
  });

  it('reports a missing frontmatter block', () => {
    const r = compileSource(valid.slice(valid.indexOf('{% hook')), path);
    if (r.ok) throw new Error('expected errors');
    expect(r.errors[0]).toMatchObject({ line: 1 });
  });
});

describe('tag definitions', () => {
  it('has exactly one tag per schema step kind', () => {
    const kinds = step.options.map((o) => o.shape.kind.value).sort();
    expect(Object.keys(KIND_TAGS).sort()).toEqual(kinds);
  });

  it('declares every nested tag a kind allows', () => {
    for (const spec of Object.values(KIND_TAGS)) {
      for (const c of spec.children) expect(CHILD_TAGS).toHaveProperty(c);
    }
  });

  it('requires id and estSeconds on every step tag', () => {
    for (const spec of Object.values(KIND_TAGS)) {
      expect(spec.attributes['id']).toMatchObject({ required: true });
      expect(spec.attributes['estSeconds']).toMatchObject({ required: true });
    }
  });
});
