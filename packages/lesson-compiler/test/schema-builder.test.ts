import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { designTask, runScenarios, type DesignTask } from '@learn-code/lesson-schema';
import { createInlineEngine } from '@learn-code/sql-engine';
import { compileSource } from '../src/compile';
import { lintLesson } from '../src/lint';
import { checkSchemaBuilder } from '../src/verify/schema-builder';

const lessonPath = join(import.meta.dirname, '../../../content/fullstack/schema-01/lesson.mdoc');
const designPath = join(
  import.meta.dirname,
  '../../../content/fullstack/schema-01/design/shop.json',
);

const task: DesignTask = designTask.parse(JSON.parse(readFileSync(designPath, 'utf8')));

const hooks = Array.from(
  { length: 7 },
  (_, i) => `{% hook id="h${i}" estSeconds=10 %}\nText.\n{% /hook %}`,
).join('\n\n');
const source = (attrs: string): string =>
  `---\nid: schema-01\ncourseId: fullstack\ntitle: T\nconcepts: []\n---\n\n{% schemaBuilder id="sb" estSeconds=120 prompt="Design it." ${attrs} /%}\n\n${hooks}\n`;

describe('schemaBuilder tag', () => {
  it('reads the design file into the step', () => {
    const result = compileSource(source('design="./design/shop.json"'), lessonPath);
    if (!result.ok) throw new Error(result.errors.map((e) => e.message).join('; '));
    const step = result.lesson.steps[0];
    expect(step?.kind).toBe('schemaBuilder');
    if (step?.kind !== 'schemaBuilder') return;
    expect(step.scenarios.length).toBe(task.scenarios.length);
    expect(step.references).toHaveLength(2);
  });
  it('reports a missing design file and broken JSON with a line', () => {
    const missing = compileSource(source('design="./design/none.json"'), lessonPath);
    expect(missing.ok).toBe(false);
    const broken = compileSource(source('design="{ nope"'), lessonPath);
    if (broken.ok) throw new Error('expected an error');
    expect(broken.errors[0]?.message).toContain('design is not valid JSON');
  });
  it('rejects a design that does not match the schema', () => {
    const result = compileSource(source('design="{}"'), lessonPath);
    expect(result.ok).toBe(false);
  });
});

describe('schemaBuilder lint', () => {
  const lesson = (scenarios: DesignTask['scenarios']) => {
    const result = compileSource(source('design="./design/shop.json"'), lessonPath);
    if (!result.ok) throw new Error('compile failed');
    const [first, ...rest] = result.lesson.steps;
    if (first?.kind !== 'schemaBuilder') throw new Error('unexpected step');
    return { ...result.lesson, steps: [{ ...first, scenarios }, ...rest] };
  };
  const registries = {
    concepts: [],
    misconceptions: task.scenarios.map((s) => ({ id: s.misconception })),
  };
  const rules = (scenarios: DesignTask['scenarios']) =>
    lintLesson(lesson(scenarios), registries as never, { allowUnbuilt: true })
      .filter((i) => i.rule.startsWith('schema-builder'))
      .map((i) => i.rule);
  it('accepts 3 to 7 scenarios with known misconceptions', () => {
    expect(rules(task.scenarios)).toEqual([]);
  });
  it('fails fewer than 3 and more than 7 scenarios', () => {
    expect(rules(task.scenarios.slice(0, 2))).toEqual(['schema-builder-scenario-count']);
    const eight = Array.from({ length: 8 }, (_, i) => ({ ...task.scenarios[0]!, id: `s${i}` }));
    expect(rules(eight)).toEqual(['schema-builder-scenario-count']);
  });
  it('fails an unknown misconception id', () => {
    const bad = task.scenarios.map((s) => ({ ...s, misconception: 'nope' }));
    expect(rules(bad)).toEqual(Array(bad.length).fill('schema-builder-misconception'));
  });
});

describe('sample task on PostgreSQL (PGlite)', () => {
  it('passes two different correct designs and fails each wrong one on its own scenario', async () => {
    expect(await checkSchemaBuilder(task)).toEqual([]);
  }, 120_000);

  it('tells the learner in plain language when the foreign key is missing', async () => {
    const wrong = task.wrongDrafts.find((w) => w.fails === 'order-needs-customer');
    if (wrong === undefined) throw new Error('no wrong draft');
    const report = await runScenarios({
      engine: createInlineEngine(),
      draft: wrong.draft,
      roles: task.roles,
      map: wrong.roles,
      scenarios: task.scenarios,
    });
    if (report.phase !== 'ran') throw new Error('expected a run');
    const failed = report.results.filter((r) => r.status === 'failed');
    expect(failed.map((r) => r.id)).toEqual(['order-needs-customer']);
    expect(failed[0]).toMatchObject({
      story: 'An order must belong to a customer that exists.',
      answer: 'Accepted.',
      explanation: 'Your design accepted a statement that should have been refused.',
    });
    expect(failed[0]?.hint).toContain('foreign key');
    expect(failed[0]?.statement).toContain('insert into "orders"');
  }, 120_000);

  it('shows the database answer when a design refuses a good statement', async () => {
    const ref = task.references[0];
    if (ref === undefined) throw new Error('no reference');
    const tables = ref.draft.tables.map((t) =>
      t.name === 'orders'
        ? {
            ...t,
            columns: t.columns.map((c) => (c.name === 'customer_id' ? { ...c, unique: true } : c)),
          }
        : t,
    );
    const report = await runScenarios({
      engine: createInlineEngine(),
      draft: { tables },
      roles: task.roles,
      map: ref.roles,
      scenarios: task.scenarios,
    });
    if (report.phase !== 'ran') throw new Error('expected a run');
    const reorder = report.results.find((r) => r.id === 'customer-can-reorder');
    expect(reorder?.status).toBe('failed');
    expect(reorder?.answer).toContain('23505');
  }, 120_000);
});
