import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { designTask, schemaBuilderStep, runScenarios } from '@learn-code/lesson-schema';
import { createInlineEngine } from '@learn-code/sql-engine';
import type { StepResult } from '../types';
import { createSchemaBuilder } from './SchemaBuilder';

const design: unknown = JSON.parse(
  readFileSync(
    join(import.meta.dirname, '../../../../content/fullstack/schema-01/design/shop.json'),
    'utf8',
  ),
);
const step = schemaBuilderStep.parse({
  id: 'sb',
  kind: 'schemaBuilder',
  estSeconds: 120,
  concepts: [],
  prompt: 'Design the **shop**.',
  ...designTask.parse(design),
});

const SchemaBuilder = createSchemaBuilder({
  getEngine: () => Promise.resolve(createInlineEngine()),
});
const html = (restored?: StepResult | undefined): string =>
  renderToString(<SchemaBuilder step={step} restored={restored} onComplete={vi.fn()} />);
const text = (markup: string): string => markup.replace(/<[^>]*>/g, ' ');

describe('SchemaBuilder rendering', () => {
  it('starts with the prompt, the step tag, an Add table button and the loose fields', () => {
    const out = html();
    expect(out).toContain('Your turn');
    expect(out).toContain('Add table');
    expect(out).toContain('Test my design');
    expect(out).toContain('order total');
    expect(out).toContain('Last step: which is which?');
    for (const r of step.roles) expect(out).toContain(r.label.replace("'", '&#x27;'));
  });
  it('disables the test button until there is a table, and shows no internal names', () => {
    const out = html();
    expect(out).toMatch(/<button[^>]*disabled=""[^>]*>Test my design/);
    expect(text(out)).not.toMatch(/schemaBuilder|placeholder|not built yet|order-needs-customer/);
  });
  it('restores a saved design and marks the step as solved', () => {
    const ref = step.references[0];
    if (ref === undefined) throw new Error('no reference');
    const out = html({
      status: 'answered',
      correct: true,
      attempts: 2,
      payload: { draft: ref.draft, roles: ref.roles },
    });
    expect(out).toContain('Your design holds.');
    expect(out).toContain('value="customers"');
    expect(out).toContain('aria-label="Table orders"');
    expect(out).toContain('aria-label="Remove column customer_id"');
  });
  it('ignores a saved answer of the wrong shape', () => {
    const out = html({ status: 'answered', correct: true, attempts: 1, payload: { draft: 7 } });
    expect(out).toContain('Add table');
    expect(out).not.toContain('aria-label="Table ');
  });
  it('labels every control for keyboard and screen reader use', () => {
    const ref = step.references[0];
    if (ref === undefined) throw new Error('no reference');
    const out = html({
      status: 'answered',
      correct: true,
      attempts: 1,
      payload: { draft: ref.draft, roles: ref.roles },
    });
    for (const label of [
      'total is required',
      'email is unique',
      'customer_id points at',
      'Put a loose field into orders',
    ]) {
      expect(out, label).toContain(label);
    }
  });
});

describe('what the widget runs', () => {
  it('a restored reference design passes the step scenarios on PostgreSQL', async () => {
    const ref = step.references[1];
    if (ref === undefined) throw new Error('no reference');
    const report = await runScenarios({
      engine: createInlineEngine(),
      draft: ref.draft,
      roles: step.roles,
      map: ref.roles,
      scenarios: step.scenarios,
    });
    expect(report).toMatchObject({ phase: 'ran', allPassed: true });
  }, 120_000);
});
