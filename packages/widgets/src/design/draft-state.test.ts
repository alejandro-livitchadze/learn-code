import { describe, expect, it } from 'vitest';
import type { ColumnDraft, SchemaDraft } from '@learn-code/lesson-schema';
import {
  EMPTY_DRAFT,
  addColumn,
  addTable,
  fieldToColumnName,
  newColumn,
  placeField,
  referenceTargets,
  removeColumn,
  removeTable,
  renameTable,
  reportSummary,
  roleOptions,
  setReference,
  unplacedFields,
  updateColumn,
} from './draft-state';

const fk = { table: 'customers', column: 'id', onDelete: 'restrict' } as const;
const col = (name: string, over: Partial<ColumnDraft> = {}): ColumnDraft => ({
  ...newColumn(name),
  ...over,
});
const base: SchemaDraft = {
  tables: [
    { name: 'customers', columns: [col('id', { primaryKey: true, nullable: false })] },
    { name: 'orders', columns: [col('id'), col('customer_id', { references: fk })] },
  ],
};

describe('draft edits', () => {
  it('never changes its input', () => {
    const frozen = structuredClone(base);
    renameTable(base, 0, 'people');
    removeTable(base, 0);
    updateColumn(base, 0, 0, { name: 'key' });
    expect(base).toEqual(frozen);
  });
  it('adds an empty table and a nullable text column', () => {
    const d = addColumn(addTable(EMPTY_DRAFT), 0);
    expect(d.tables).toEqual([{ name: '', columns: [newColumn()] }]);
    expect(newColumn().nullable).toBe(true);
  });
  it('turns a loose field into a snake_case column and hides it from the pile', () => {
    expect(fieldToColumnName(' Order total ')).toBe('order_total');
    const d = placeField(addTable(EMPTY_DRAFT), 0, 'order total');
    expect(d.tables[0]?.columns[0]?.name).toBe('order_total');
    expect(unplacedFields(['email', 'order total'], d)).toEqual(['email']);
  });
  it('renaming a table or column keeps foreign keys pointing at it', () => {
    const t = renameTable(base, 0, 'people');
    expect(t.tables[1]?.columns[1]?.references?.table).toBe('people');
    const c = updateColumn(base, 0, 0, { name: 'key' });
    expect(c.tables[1]?.columns[1]?.references?.column).toBe('key');
  });
  it('removing a table or column drops the foreign keys that pointed at it', () => {
    expect(removeTable(base, 0).tables[1]?.columns[1]?.references).toBeUndefined();
    expect(removeColumn(base, 0, 0).tables[1]?.columns[1]?.references).toBeUndefined();
    expect(removeColumn(base, 1, 0).tables[1]?.columns.map((c) => c.name)).toEqual(['customer_id']);
  });
  it('a primary key is never nullable', () => {
    const d = updateColumn(addColumn(addTable(EMPTY_DRAFT), 0), 0, 0, { primaryKey: true });
    expect(d.tables[0]?.columns[0]).toMatchObject({ primaryKey: true, nullable: false });
  });
  it('sets and clears a reference', () => {
    const d = setReference(base, 1, 0, fk);
    expect(d.tables[1]?.columns[0]?.references).toEqual(fk);
    expect(setReference(d, 1, 0, undefined).tables[1]?.columns[0]).not.toHaveProperty('references');
  });
  it('ignores a position that does not exist', () => {
    expect(renameTable(base, 9, 'x')).toBe(base);
    expect(removeTable(base, 9)).toBe(base);
    expect(updateColumn(base, 0, 9, { name: 'x' })).toBe(base);
    expect(removeColumn(base, 9, 0)).toBe(base);
  });
});

describe('pickers', () => {
  it('offers only keys of other tables as foreign key targets', () => {
    expect(referenceTargets(base, 1)).toEqual([{ table: 'customers', column: 'id' }]);
    expect(referenceTargets(base, 0)).toEqual([]);
    const composite: SchemaDraft = {
      tables: [
        { name: 'a', columns: [col('x', { primaryKey: true }), col('y', { primaryKey: true })] },
        { name: 'b', columns: [col('z')] },
      ],
    };
    expect(referenceTargets(composite, 1)).toEqual([]);
  });
  it('offers tables for a table role and the picked table columns for a column role', () => {
    const table = { id: 't', label: 'T', kind: 'table' } as const;
    const column = { id: 'c', label: 'C', kind: 'column', table: 't' } as const;
    expect(roleOptions(table, base, {})).toEqual(['customers', 'orders']);
    expect(roleOptions(column, base, {})).toEqual([]);
    expect(roleOptions(column, base, { t: 'orders' })).toEqual(['id', 'customer_id']);
  });
});

describe('reportSummary', () => {
  const result = (status: 'passed' | 'failed') => ({
    id: 'a',
    story: 's',
    status,
    statement: '',
    answer: '',
    explanation: undefined,
    hint: undefined,
    misconception: 'm',
  });
  it('says what the learner needs to hear in each phase', () => {
    expect(
      reportSummary({ phase: 'invalid', problems: ['A table has no name yet.'] }),
    ).toMatchObject({
      good: false,
      text: 'A table has no name yet.',
    });
    expect(reportSummary({ phase: 'ddlFailed', message: 'boom' }).text).toBe('boom');
    expect(reportSummary({ phase: 'ran', allPassed: true, results: [result('passed')] }).good).toBe(
      true,
    );
    expect(
      reportSummary({
        phase: 'ran',
        allPassed: false,
        results: [result('passed'), result('failed')],
      }).text,
    ).toBe('1 of 2 rules hold. Read the failed ones below.');
  });
});
