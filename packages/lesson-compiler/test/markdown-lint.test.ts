import { describe, expect, it } from 'vitest';
import type { Lesson, Step } from '@learn-code/lesson-schema';
import { lintLesson, markdownProblems } from '../src/lint';
import { registries, validLesson, validSteps } from './lint-fixtures';

const withBody = (id: string, body: string): Lesson => ({
  ...validLesson,
  steps: validSteps.map((s): Step => (s.id === id && s.kind === 'explain' ? { ...s, body } : s)),
});
const issues = (body: string) =>
  lintLesson(withBody('explain', body), registries, { allowUnbuilt: true }).filter(
    (i) => i.rule === 'markdown-subset',
  );

describe('markdown-subset rule', () => {
  it('accepts every supported construct', () => {
    const body = [
      'Plain `code`, **bold**, *italic* and [docs](https://example.com/a?b=1).',
      '',
      '- one',
      '- two with [more](http://example.com)',
      '',
      '```sql',
      '# not a heading here',
      '> nor a quote',
      '',
      '<b>raw</b>',
      '```',
    ].join('\n');
    expect(markdownProblems(body)).toEqual([]);
    expect(issues(body)).toEqual([]);
  });

  it('rejects a heading, and reports the step and the line inside the field', () => {
    const [issue, ...rest] = issues('Fine.\n\n# Heading');
    expect(rest).toEqual([]);
    expect(issue?.stepId).toBe('explain');
    expect(issue?.stepIndex).toBe(validSteps.findIndex((s) => s.id === 'explain'));
    expect(issue?.message).toBe('body, line 3: heading is not supported');
  });

  it('rejects a javascript: link and non-http links', () => {
    expect(markdownProblems('see [x](javascript:alert(1))')).toHaveLength(1);
    expect(markdownProblems('see [x](/relative)')).toHaveLength(1);
    expect(markdownProblems('see [x](ftp://a.b)')).toHaveLength(1);
  });

  it('rejects other constructs', () => {
    for (const bad of [
      '> quote',
      '1. one',
      '* star',
      '---',
      '| a | b |',
      '![img](https://a.b/c.png)',
      '<div>x</div>',
      '~~gone~~',
      '    indented',
    ]) {
      expect(markdownProblems(bad), bad).not.toEqual([]);
    }
  });

  it('rejects an unclosed fence', () => {
    expect(markdownProblems('a\n```\ncode')).toEqual(['line 2: fenced code block is never closed']);
  });
});
