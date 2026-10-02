import type { SqlResult } from '@learn-code/sql-engine';

export const SCHEMA_QUERY = `select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position`;

export interface SchemaTable {
  readonly name: string;
  readonly columns: readonly {
    readonly name: string;
    readonly type: string;
    readonly nullable: boolean;
  }[];
}

/** Group the rows of `SCHEMA_QUERY` by table. */
export function groupSchema(result: SqlResult): readonly SchemaTable[] {
  const tables = new Map<string, { name: string; type: string; nullable: boolean }[]>();
  for (const [table, column, type, nullable] of result.rows) {
    if (typeof table !== 'string' || typeof column !== 'string') continue;
    const list = tables.get(table) ?? [];
    list.push({
      name: column,
      type: typeof type === 'string' ? type : '',
      nullable: nullable !== 'NO',
    });
    tables.set(table, list);
  }
  return [...tables].map(([name, columns]) => ({ name, columns }));
}

/** Statements that can change the table list, so the schema viewer should refresh. */
export function mayChangeSchema(sql: string): boolean {
  return /\b(create|alter|drop|rename|truncate)\b/i.test(sql);
}
