import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { checkLesson, formatIssue, loadRegistries, verifySamples } from '../src';
import { runNode, runPredictSql } from '../src/verify';
import { compileLesson } from '../src/compile';
import { formatRows } from '../src/verify/format';

const contentRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../content');
const sourceCourse = join(contentRoot, 'fullstack');
const tmp = mkdtempSync(join(tmpdir(), 'lesson-check-'));
afterAll(async () => {
  rmSync(tmp, { recursive: true, force: true });
});

const original = readFileSync(join(sourceCourse, 'joins-01/lesson.mdoc'), 'utf8');
let counter = 0;

/** Copy the course to a temp dir with a modified lesson source; returns the lesson path. */
function variant(edit: (src: string) => string, lessonId = 'joins-01'): string {
  const course = join(tmp, `c${counter++}`, 'fullstack');
  cpSync(sourceCourse, course, { recursive: true });
  if (lessonId !== 'joins-01') renameSync(join(course, 'joins-01'), join(course, lessonId));
  const file = join(course, lessonId, 'lesson.mdoc');
  const next = edit(original).replace('id: joins-01', `id: ${lessonId}`);
  expect(next).not.toBe(original);
  writeFileSync(file, next);
  return file;
}
const errorsOf = (issues: readonly { severity: string }[]) =>
  issues.filter((i) => i.severity === 'error');
const lineOf = (src: string, text: string): number =>
  src.split('\n').findIndex((l) => l.includes(text)) + 1;

describe('sample lesson', () => {
  it('passes check under the strict rules with no errors and no warnings', async () => {
    const issues = await checkLesson(join(sourceCourse, 'joins-01/lesson.mdoc'));
    expect(issues.map(formatIssue)).toEqual([]);
  });
});

describe('lint rules reported with file and line', () => {
  const words = Array.from({ length: 90 }, () => 'word').join(' ');
  const cases: readonly (readonly [string, (s: string) => string, string])[] = [
    [
      'no-adjacent-passive',
      (s) =>
        s.replace(
          '{% sqlLab id="s2"',
          '{% pitfall id="x1" estSeconds=30 %}\nOops.\n{% /pitfall %}\n\n{% sqlLab id="s2"',
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
            '{% fillBlanks id="f2"',
            '{% cliffhanger id="x2" estSeconds=10 question="Next?" /%}\n\n{% fillBlanks id="f2"',
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
          .replace(/concepts=\["row-multiplication"\]/g, 'concepts=[]')
          .replace(/concepts=\["inner-join", "row-multiplication"\]/g, 'concepts=["inner-join"]'),
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

describe('playable and solvable rules', () => {
  const passives = Array.from(
    { length: 13 },
    (_, i) => `{% cliffhanger id="z${i}" estSeconds=10 question="Next?" /%}`,
  ).join('\n\n');
  const cases: readonly (readonly [string, (s: string) => string, string])[] = [
    [
      'unique-step-ids',
      (s) => s.replace('id="p2"', 'id="p1"'),
      'id="p1" estSeconds=60 code="./samples/sum.sql"',
    ],
    ['fill-blanks-markers', (s) => s.replace('___fn___', '___ghost___'), 'id="f1"'],
    [
      'fill-blanks-solvable',
      (s) => s.replace('accepted=["distinct"]', 'accepted=["  "]'),
      'id="f1"',
    ],
    [
      'unknown-concept',
      (s) =>
        s.replace('concepts: [inner-join, row-multiplication]', 'concepts: [inner-join, nope]'),
      '',
    ],
    [
      'unknown-concept',
      (s) => s.replace('concepts=["inner-join"] %}\n{% blank', 'concepts=["nope"] %}\n{% blank'),
      'id="f1"',
    ],
    [
      'unknown-misconception',
      (s) =>
        s.replace(
          'accepted=["distinct"] misconception="join-counts-orders"',
          'accepted=["distinct"] misconception="nope"',
        ),
      'id="f1"',
    ],
    ['folder-names', (s) => s.replace('id: joins-01', 'id: other'), 'id: other'],
    ['folder-names', (s) => s.replace('courseId: fullstack', 'courseId: other'), 'courseId:'],
    ['step-count', (s) => s.slice(0, s.indexOf('{% pitfall id="pf1"')), ''],
    ['step-count', (s) => `${s}\n${passives}\n`, ''],
  ];
  it.each(cases)('%s', async (rule, edit, at) => {
    const file = variant(edit, 'joins-02');
    const src = readFileSync(file, 'utf8');
    const issues = await checkLesson(file, { allowUnbuilt: true });
    const hit = issues.find((i) => i.rule === rule);
    expect(hit, issues.map(formatIssue).join('\n')).toBeDefined();
    expect(hit?.severity).toBe('error');
    expect(hit?.file).toBe(file);
    if (at) expect(hit?.line).toBe(src.split('\n').findIndex((l) => l.includes(at)) + 1);
    expect(formatIssue(hit!)).toContain(`${file}:`);
  });

  it('puts duplicate ids on the second occurrence', async () => {
    const file = variant((s) => s.replace('id="p2"', 'id="p1"'), 'joins-02');
    const src = readFileSync(file, 'utf8');
    const hit = (await checkLesson(file, { allowUnbuilt: true })).find(
      (i) => i.rule === 'unique-step-ids',
    );
    expect(hit?.line).toBe(
      lineOf(src, '{% predict id="p1" estSeconds=60 code="./samples/sum.sql"'),
    );
  });

  it('fails on unbuilt kinds unless allowUnbuilt is set', async () => {
    const unbuilt = [
      '{% recall id="r1" estSeconds=60 %}',
      '{% question prompt="Why is the sum too high?" %}',
      '{% option text="Each order is repeated once per item" correct=true %}\nRight.\n{% /option %}',
      '{% option text="The database counts twice" misconception="join-counts-orders" %}\nNo.\n{% /option %}',
      '{% /question %}',
      '{% question prompt="Why is count(*) not the number of orders?" %}',
      '{% option text="It counts result rows" correct=true %}\nRight.\n{% /option %}',
      '{% option text="It ignores the join" misconception="join-keeps-row-count" %}\nNo.\n{% /option %}',
      '{% /question %}',
      '{% /recall %}',
      '',
      '{% brainPower id="b1" estSeconds=60 question="Why four times?" concepts=["row-multiplication"] %}',
      'Each order is repeated once per item.',
      '{% /brainPower %}',
      '',
      '{% matching id="m1" estSeconds=45 prompt="Match each term." concepts=["inner-join"] %}',
      '{% pair left="Primary key" right="Identifies one row" /%}',
      '{% pair left="Foreign key" right="Points at another table" /%}',
      '{% pair left="Inner join" right="Keeps matching rows" /%}',
      '{% /matching %}',
      '',
    ].join('\n');
    const file = variant(
      (s) => s.replace('{% recap id="rc1"', `${unbuilt}\n{% recap id="rc1"`),
      'joins-02',
    );
    const strict = (await checkLesson(file)).filter((i) => i.rule === 'unbuilt-kind');
    expect(strict.map((i) => i.line)).toEqual(
      ['{% recall', '{% brainPower', '{% matching'].map((t) =>
        lineOf(readFileSync(file, 'utf8'), t),
      ),
    );
    expect(strict.every((i) => i.severity === 'error')).toBe(true);
    const lax = await checkLesson(file, { allowUnbuilt: true });
    expect(lax.some((i) => i.rule === 'unbuilt-kind')).toBe(false);
  }, 120_000);

  it('accepts the sample lesson under its real name with no folder or registry errors', async () => {
    const file = variant((s) => s.replace('estSeconds=45', 'estSeconds=46'));
    const issues = await checkLesson(file);
    expect(issues.map(formatIssue)).toEqual([]);
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
      s.replace('{% option output="320" correct=true %}', '{% option output="401" correct=true %}'),
    );
    const issues = await checkLesson(file);
    const hit = issues.find((i) => i.rule === 'verify');
    expect(hit?.message).toContain('declared output "401" but the sample printed "320"');
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
        'starter="select count(*) as n from orders"',
        'starter="select count(distinct order_id) as n from items"',
      ),
    );
    const issues = await checkLesson(file);
    expect(issues.find((i) => i.rule === 'verify')?.message).toContain('starter already passes');
  });

  it('accepts an empty or failing starter, rejects a broken solution or missing seed', async () => {
    const empty = variant((s) => s.replace(/ starter="[^"]*"/, ''));
    expect(errorsOf(await checkLesson(empty))).toEqual([]);
    const broken = variant((s) => s.replace(/ starter="[^"]*"/, ' starter="select nope"'));
    expect(errorsOf(await checkLesson(broken))).toEqual([]);
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
  }, 120_000);

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
    expect(await runPredictSql(undefined, 'select 1 as x union all select 2')).toBe('x\n1\n2');
    expect(await runPredictSql('  ', 'create table t (a int)')).toBe('');
    expect(await runPredictSql(undefined, '')).toBe('');
    expect(await runPredictSql(undefined, 'select nope')).toBeInstanceOf(Error);
  });
});

describe('cli files exist', () => {
  it('sample lesson is in content', () => {
    expect(existsSync(join(sourceCourse, 'joins-01/lesson.mdoc'))).toBe(true);
  });
});
