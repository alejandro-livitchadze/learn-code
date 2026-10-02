import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { checkLesson, formatIssue, loadRegistries, verifySamples } from '../src';
import { closeSql, runNode, runSql } from '../src/verify';
import { compileLesson } from '../src/compile';
import { formatRows } from '../src/verify/format';
import { sameResult } from '../src/verify/sql';

const contentRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../content');
const sourceCourse = join(contentRoot, 'fullstack');
const tmp = mkdtempSync(join(tmpdir(), 'lesson-check-'));
afterAll(async () => {
  await closeSql();
  rmSync(tmp, { recursive: true, force: true });
});

const original = readFileSync(join(sourceCourse, 'joins-01/lesson.mdoc'), 'utf8');
let counter = 0;

/** Copy the course to a temp dir with a modified lesson source; returns the lesson path. */
function variant(edit: (src: string) => string): string {
  const course = join(tmp, `c${counter++}`);
  cpSync(sourceCourse, course, { recursive: true });
  const file = join(course, 'joins-01/lesson.mdoc');
  const next = edit(original);
  expect(next).not.toBe(original);
  writeFileSync(file, next);
  return file;
}
const lineOf = (src: string, text: string): number =>
  src.split('\n').findIndex((l) => l.includes(text)) + 1;

describe('sample lesson', () => {
  it('passes check', async () => {
    expect(await checkLesson(join(sourceCourse, 'joins-01/lesson.mdoc'))).toEqual([]);
  });
});

describe('lint rules reported with file and line', () => {
  const words = Array.from({ length: 90 }, () => 'word').join(' ');
  const cases: readonly (readonly [string, (s: string) => string, string])[] = [
    [
      'no-adjacent-passive',
      (s) =>
        s.replace(
          '{% recall id="r1"',
          '{% pitfall id="x1" estSeconds=30 %}\nOops.\n{% /pitfall %}\n\n{% recall id="r1"',
        ),
      'x1',
    ],
    [
      'min-active-ratio',
      (s) =>
        s
          .replace(
            '{% sqlLab id="s1"',
            '{% cliffhanger id="x1" estSeconds=10 question="Next?" /%}\n\n{% sqlLab id="s1"',
          )
          .replace(
            '{% brainPower id="b1"',
            '{% cliffhanger id="x2" estSeconds=10 question="Next?" /%}\n\n{% brainPower id="b1"',
          ),
      '',
    ],
    [
      'predict-before-explain',
      (s) =>
        s.replace(
          '{% predict id="p1"',
          '{% pitfall id="p0" estSeconds=1 %}\nx\n{% /pitfall %}\n{% explain id="e0" estSeconds=1 %}\nx\n{% /explain %}\n{% predict id="p1"',
        ),
      'e0',
    ],
    ['passive-word-limit', (s) => s.replace('Friday, 18:40.', `${words}`), 'h1'],
    [
      'wrong-option-feedback',
      (s) => s.replace(' misconception="join-keeps-row-count"', ' misconception="nope"'),
      'p1',
    ],
    [
      'concept-representations',
      (s) =>
        s
          .replace('concepts=["row-multiplication"] %}\nFriday', 'concepts=[] %}\nFriday')
          .replace(/concepts=\["row-multiplication"\]/g, 'concepts=[]')
          .replace(
            'concepts=["inner-join", "row-multiplication"] %}\n{% option output="100"',
            'concepts=[] %}\n{% option output="100"',
          ),
      '',
    ],
    [
      'review-cards',
      (s) =>
        s.replace(
          'concepts=["inner-join", "row-multiplication"] %}\n{% point',
          'concepts=["inner-join"] %}\n{% point',
        ),
      '',
    ],
    [
      'annotation-lines',
      (s) => s.replace('{% annotation line=3 %}', '{% annotation line=9 %}'),
      'e1',
    ],
  ];
  it.each(cases)('%s', async (rule, edit, stepId) => {
    const file = variant(edit);
    const issues = await checkLesson(file);
    const hit = issues.find((i) => i.rule === rule);
    expect(hit, issues.map(formatIssue).join('\n')).toBeDefined();
    expect(hit?.file).toBe(file);
    if (stepId) {
      expect(hit?.line).toBe(lineOf(readFileSync(file, 'utf8'), `id="${stepId}"`));
    }
    expect(formatIssue(hit!)).toContain(`${file}:`);
  });
});

describe('compile and registry errors', () => {
  it('reports a missing required attribute with a line number', async () => {
    const file = variant((s) => s.replace(' estSeconds=40', ''));
    const [issue] = await checkLesson(file);
    expect(issue).toMatchObject({
      rule: 'compile',
      line: lineOf(original, '{% hook'),
      severity: 'error',
    });
    expect(issue?.message).toContain('estSeconds');
  });

  it('fails when registry files are missing', async () => {
    const file = variant((s) => s + '\n');
    rmSync(join(dirname(dirname(file)), 'registry/concepts.json'));
    const [issue] = await checkLesson(file);
    expect(issue?.rule).toBe('registry');
  });

  it('reports invalid registries', () => {
    const course = join(tmp, 'bad-registry');
    cpSync(sourceCourse, course, { recursive: true });
    writeFileSync(join(course, 'registry/concepts.json'), '{oops');
    writeFileSync(join(course, 'registry/misconceptions.json'), '[{"id":"Bad Id"}]');
    writeFileSync(join(course, 'registry/syntax-concepts.json'), '[1]');
    const r = loadRegistries(course);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toHaveLength(3);
    writeFileSync(join(course, 'registry/syntax-concepts.json'), '{oops');
    const r2 = loadRegistries(course);
    expect(!r2.ok && r2.errors.some((e) => e.includes('invalid JSON'))).toBe(true);
  });

  it('loads valid registries with optional syntax list', () => {
    const r = loadRegistries(sourceCourse);
    expect(r.ok && r.registries.syntaxConcepts).toEqual(['sql-syntax']);
    rmSync(join(tmp, 'nosyntax'), { recursive: true, force: true });
    const course = join(tmp, 'nosyntax');
    cpSync(sourceCourse, course, { recursive: true });
    rmSync(join(course, 'registry/syntax-concepts.json'));
    const r2 = loadRegistries(course);
    expect(r2.ok && r2.registries.syntaxConcepts).toEqual([]);
  });
});

describe('sample verification', () => {
  it('fails on a wrong declared output', async () => {
    const file = variant((s) =>
      s.replace('{% option output="400" correct=true %}', '{% option output="401" correct=true %}'),
    );
    const issues = await checkLesson(file);
    const hit = issues.find((i) => i.rule === 'verify');
    expect(hit?.message).toContain('declared output "401" but the sample printed "400"');
    expect(hit?.line).toBe(lineOf(original, 'id="p1"'));
  });

  it('fails when a sample does not run', async () => {
    const file = variant((s) => `${s}\n`);
    writeFileSync(join(dirname(file), 'samples/join.sql'), 'select * from nope;');
    const issues = await checkLesson(file);
    expect(issues.find((i) => i.rule === 'verify')?.message).toContain('failed to run');
  });

  it('fails when the sqlLab starter already passes', async () => {
    const file = variant((s) =>
      s.replace(
        'starter="select count(*) from orders o join items i on i.order_id = o.id"',
        'starter="select count(distinct o.id) from orders o join items i on i.order_id = o.id"',
      ),
    );
    const issues = await checkLesson(file);
    expect(issues.find((i) => i.rule === 'verify')?.message).toContain('starter already passes');
  });

  it('accepts an empty or failing starter, rejects a broken solution or missing seed', async () => {
    const empty = variant((s) => s.replace(/ starter="[^"]*"/, ''));
    expect(await checkLesson(empty)).toEqual([]);
    const broken = variant((s) => s.replace(/ starter="[^"]*"/, ' starter="select nope"'));
    expect(await checkLesson(broken)).toEqual([]);
    const badSolution = variant((s) =>
      s.replace('solution="select count(distinct', 'solution="select count(nope'),
    );
    expect((await checkLesson(badSolution)).find((i) => i.rule === 'verify')?.message).toContain(
      'reference solution failed',
    );
    const noSeed = variant((s) => s.replace('seedRef="default"', 'seedRef="missing"'));
    expect((await checkLesson(noSeed)).find((i) => i.rule === 'verify')?.message).toContain(
      'seeds/missing.sql',
    );
  });

  it('verifies js and ts samples, ignores http', async () => {
    const r = compileLesson(join(sourceCourse, 'joins-01/lesson.mdoc'));
    if (!r.ok) throw new Error('compile failed');
    const predict = r.lesson.steps.find((s) => s.kind === 'predict');
    if (predict?.kind !== 'predict') throw new Error('no predict');
    const lesson = (language: 'js' | 'ts' | 'http', code: string, out: string) => ({
      ...r.lesson,
      steps: [
        {
          ...predict,
          language,
          code,
          options: [
            { ...predict.options[0]!, isCorrect: false },
            { ...predict.options[1]!, output: out },
          ],
        },
      ],
    });
    expect(await verifySamples(lesson('js', 'console.log(1 + 1)', '2'), '/nowhere')).toEqual([]);
    expect(
      await verifySamples(lesson('ts', 'const x: number = 3; console.log(x)', '3'), '/nowhere'),
    ).toEqual([]);
    expect(await verifySamples(lesson('js', 'console.log(1)', '2'), '/nowhere')).toHaveLength(1);
    expect(
      (await verifySamples(lesson('js', 'throw new Error("boom")', '2'), '/nowhere'))[0]?.message,
    ).toContain('boom');
    expect(await verifySamples(lesson('http', 'GET /', 'x'), '/nowhere')).toEqual([]);
  });

  it('runNode times out on endless loops', () => {
    const r = runNode('while (true) {}', 'js');
    expect(r.ok).toBe(false);
  }, 15_000);

  it('formats and compares results', async () => {
    expect(formatRows(['n'], [[3]])).toBe('3');
    expect(
      formatRows(
        ['a', 'b'],
        [
          [1, null],
          [2, { k: 1 }],
        ],
      ),
    ).toBe('a | b\n1 | NULL\n2 | {"k":1}');
    expect(formatRows(['d'], [[new Date(0)], [undefined]])).toContain('1970-01-01T00:00:00.000Z');
    const a = await runSql(undefined, 'select 1 as x union all select 2');
    const b = await runSql(undefined, 'select 2 as x union all select 1');
    expect(sameResult(a, b, false)).toBe(true);
    expect(sameResult(a, b, true)).toBe(false);
    expect((await runSql('  ', 'create table t (a int)')).rows).toEqual([]);
    expect((await runSql(undefined, '')).rows).toEqual([]);
  });
});

describe('cli files exist', () => {
  it('sample lesson is in content', () => {
    expect(existsSync(join(sourceCourse, 'joins-01/lesson.mdoc'))).toBe(true);
  });
});
