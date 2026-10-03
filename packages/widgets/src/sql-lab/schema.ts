import type { SqlResult } from '@learn-code/sql-engine';

export const SCHEMA_QUERY = `select c.table_name, c.column_name, c.data_type, c.is_nullable,
  exists (
    select 1
    from information_schema.table_constraints tc
    join information_schema.key_column_usage k
      on k.constraint_name = tc.constraint_name and k.table_schema = tc.table_schema
    where tc.constraint_type = 'PRIMARY KEY' and tc.table_schema = 'public'
      and k.table_name = c.table_name and k.column_name = c.column_name
  ) as is_primary,
  (
    select ccu.table_name || '.' || ccu.column_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage k
      on k.constraint_name = tc.constraint_name and k.table_schema = tc.table_schema
    join information_schema.constraint_column_usage ccu
      on ccu.constraint_name = tc.constraint_name and ccu.table_schema = tc.table_schema
    where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'
      and k.table_name = c.table_name and k.column_name = c.column_name
    limit 1
  ) as references_column
from information_schema.columns c
where c.table_schema = 'public'
order by c.table_name, c.ordinal_position`;

export interface SchemaColumn {
  readonly name: string;
  readonly type: string;
  readonly nullable: boolean;
  /** Part of the primary key. */
  readonly primary: boolean;
  /** `table.column` this column points to, when it is a foreign key. */
  readonly references?: string;
}

export interface SchemaTable {
  readonly name: string;
  readonly columns: readonly SchemaColumn[];
}

/** Group the rows of `SCHEMA_QUERY` by table. */
export function groupSchema(result: SqlResult): readonly SchemaTable[] {
  const tables = new Map<string, SchemaColumn[]>();
  for (const [table, column, type, nullable, primary, references] of result.rows) {
    if (typeof table !== 'string' || typeof column !== 'string') continue;
    const list = tables.get(table) ?? [];
    list.push({
      name: column,
      type: typeof type === 'string' ? type : '',
      nullable: nullable !== 'NO',
      primary: primary === true,
      ...(typeof references === 'string' ? { references } : {}),
    });
    tables.set(table, list);
  }
  return [...tables].map(([name, columns]) => ({ name, columns }));
}

/** Statements that can change the table list, so the schema viewer should refresh. */
export function mayChangeSchema(sql: string): boolean {
  return /\b(create|alter|drop|rename|truncate)\b/i.test(sql);
}
