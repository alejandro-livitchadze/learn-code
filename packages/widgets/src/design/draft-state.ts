import type {
  ColumnDraft,
  DesignReport,
  DesignRole,
  RoleMap,
  SchemaDraft,
  TableDraft,
} from '@learn-code/lesson-schema';

/**
 * Pure edits of a `SchemaDraft`. The widget keeps the draft in React state and calls these;
 * every function returns a new draft and never changes its input. Tables and columns are
 * addressed by position, because names are being typed and may be empty or twice in the list.
 */

export const EMPTY_DRAFT: SchemaDraft = { tables: [] };

export const newColumn = (name = ''): ColumnDraft => ({
  name,
  type: 'text',
  nullable: true,
  unique: false,
  primaryKey: false,
});

/** "order total" becomes `order_total`. */
export function fieldToColumnName(field: string): string {
  return field
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/** The column without its foreign key. */
const withoutReference = (c: ColumnDraft): ColumnDraft => ({
  name: c.name,
  type: c.type,
  nullable: c.nullable,
  unique: c.unique,
  primaryKey: c.primaryKey,
});

const mapTable = (
  draft: SchemaDraft,
  ti: number,
  edit: (t: TableDraft) => TableDraft,
): SchemaDraft => ({ tables: draft.tables.map((t, i) => (i === ti ? edit(t) : t)) });

/** Rewrite every foreign key that points at `from` so it points at `to`; `to` undefined removes it. */
function retarget(
  draft: SchemaDraft,
  from: { readonly table: string; readonly column?: string },
  to: { readonly table: string; readonly column?: string } | undefined,
): SchemaDraft {
  if (from.table === '') return draft;
  return {
    tables: draft.tables.map((t) => ({
      ...t,
      columns: t.columns.map((c) => {
        const ref = c.references;
        if (ref === undefined || ref.table !== from.table) return c;
        if (from.column !== undefined && ref.column !== from.column) return c;
        if (to === undefined) return withoutReference(c);
        return {
          ...withoutReference(c),
          references: { ...ref, table: to.table, column: to.column ?? ref.column },
        };
      }),
    })),
  };
}

export const addTable = (draft: SchemaDraft): SchemaDraft => ({
  tables: [...draft.tables, { name: '', columns: [] }],
});

export function renameTable(draft: SchemaDraft, ti: number, name: string): SchemaDraft {
  const old = draft.tables[ti]?.name;
  if (old === undefined) return draft;
  const renamed = mapTable(draft, ti, (t) => ({ ...t, name }));
  return retarget(renamed, { table: old }, { table: name });
}

export function removeTable(draft: SchemaDraft, ti: number): SchemaDraft {
  const old = draft.tables[ti]?.name;
  if (old === undefined) return draft;
  const without: SchemaDraft = { tables: draft.tables.filter((_, i) => i !== ti) };
  return retarget(without, { table: old }, undefined);
}

export const addColumn = (
  draft: SchemaDraft,
  ti: number,
  column: ColumnDraft = newColumn(),
): SchemaDraft => mapTable(draft, ti, (t) => ({ ...t, columns: [...t.columns, column] }));

/** Change a column. A primary key is never nullable. A new column name follows foreign keys. */
export function updateColumn(
  draft: SchemaDraft,
  ti: number,
  ci: number,
  patch: Partial<ColumnDraft>,
): SchemaDraft {
  const table = draft.tables[ti];
  const old = table?.columns[ci];
  if (table === undefined || old === undefined) return draft;
  const merged: ColumnDraft = { ...old, ...patch };
  const next = patch.primaryKey === true ? { ...merged, nullable: false } : merged;
  const edited = mapTable(draft, ti, (t) => ({
    ...t,
    columns: t.columns.map((c, i) => (i === ci ? next : c)),
  }));
  return patch.name !== undefined && patch.name !== old.name
    ? retarget(
        edited,
        { table: table.name, column: old.name },
        { table: table.name, column: patch.name },
      )
    : edited;
}

export function removeColumn(draft: SchemaDraft, ti: number, ci: number): SchemaDraft {
  const table = draft.tables[ti];
  const old = table?.columns[ci];
  if (table === undefined || old === undefined) return draft;
  const without = mapTable(draft, ti, (t) => ({
    ...t,
    columns: t.columns.filter((_, i) => i !== ci),
  }));
  return retarget(without, { table: table.name, column: old.name }, undefined);
}

export function setReference(
  draft: SchemaDraft,
  ti: number,
  ci: number,
  ref: ColumnDraft['references'] | undefined,
): SchemaDraft {
  return mapTable(draft, ti, (t) => ({
    ...t,
    columns: t.columns.map((c, i) => {
      if (i !== ci) return c;
      return ref === undefined ? withoutReference(c) : { ...withoutReference(c), references: ref };
    }),
  }));
}

/** Put a loose field into a table as a new column. */
export const placeField = (draft: SchemaDraft, ti: number, field: string): SchemaDraft =>
  addColumn(draft, ti, newColumn(fieldToColumnName(field)));

/** Loose fields not yet placed in any table (a field is placed when a column has its name). */
export function unplacedFields(fields: readonly string[], draft: SchemaDraft): readonly string[] {
  const used = new Set(draft.tables.flatMap((t) => t.columns.map((c) => c.name)));
  return fields.filter((f) => !used.has(fieldToColumnName(f)));
}

/** What the picker for a role offers: table names, or the columns of the table picked for its parent. */
export function roleOptions(role: DesignRole, draft: SchemaDraft, map: RoleMap): readonly string[] {
  if (role.kind === 'table') return draft.tables.map((t) => t.name).filter((n) => n !== '');
  const parent = role.table === undefined ? undefined : map[role.table];
  const table = draft.tables.find((t) => t.name === parent);
  return table === undefined ? [] : table.columns.map((c) => c.name).filter((n) => n !== '');
}

/** Foreign key targets: every column that is the only primary key of its table, or unique alone. */
export function referenceTargets(
  draft: SchemaDraft,
  fromTable: number,
): readonly { readonly table: string; readonly column: string }[] {
  return draft.tables.flatMap((t, ti) =>
    ti === fromTable || t.name === ''
      ? []
      : t.columns
          .filter(
            (c) =>
              c.name !== '' &&
              ((c.primaryKey && t.columns.filter((x) => x.primaryKey).length === 1) ||
                (c.unique && !c.primaryKey)),
          )
          .map((c) => ({ table: t.name, column: c.name })),
  );
}

/** One sentence for the feedback banner. */
export function reportSummary(report: DesignReport): {
  readonly good: boolean;
  readonly title: string;
  readonly text: string;
} {
  switch (report.phase) {
    case 'invalid':
      return {
        good: false,
        title: 'Your design is not ready to test.',
        text: report.problems[0] ?? 'Something is missing.',
      };
    case 'ddlFailed':
      return {
        good: false,
        title: 'PostgreSQL could not build your design.',
        text: report.message,
      };
    case 'ran': {
      const passed = report.results.filter((r) => r.status === 'passed').length;
      const total = report.results.length;
      return report.allPassed
        ? {
            good: true,
            title: 'Your design holds.',
            text: `All ${total} rules were enforced by the database itself.`,
          }
        : {
            good: false,
            title: 'Not quite.',
            text: `${passed} of ${total} rules hold. Read the failed ones below.`,
          };
    }
    default: {
      const never: never = report;
      return never;
    }
  }
}
