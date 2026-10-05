import type { ReactNode } from 'react';

interface MiniTable {
  readonly name: string;
  readonly columns: readonly string[];
  readonly rows: readonly {
    readonly cells: readonly string[];
    /** `true` highlights the row, `false` fades it, `undefined` leaves it plain. */
    readonly focus?: boolean;
  }[];
}

interface TableDiagramData {
  /** Tables in order; the operator between table `i` and `i + 1` is `operators[i]`. */
  readonly tables: readonly MiniTable[];
  readonly operators: readonly string[];
}

/**
 * Diagrams made of small data tables (the "reveal" picture of a join). The numbers are the
 * ones in the sample seed: order 7 has amount 20 and the items sku-25 to sku-28.
 */
export const TABLE_DIAGRAMS: Readonly<Record<string, TableDiagramData>> = {
  'orders-x-items': {
    tables: [
      {
        name: 'orders',
        columns: ['id', 'amount'],
        rows: [
          { cells: ['7', '20'], focus: true },
          { cells: ['8', '20'], focus: false },
        ],
      },
      {
        name: 'items',
        columns: ['order_id', 'sku'],
        rows: [
          { cells: ['7', 'sku-25'], focus: true },
          { cells: ['7', 'sku-26'], focus: true },
          { cells: ['7', 'sku-27'], focus: true },
          { cells: ['7', 'sku-28'], focus: true },
        ],
      },
      {
        name: 'join result',
        columns: ['o.id', 'amount', 'sku'],
        rows: [
          { cells: ['7', '20', 'sku-25'] },
          { cells: ['7', '20', 'sku-26'] },
          { cells: ['7', '20', 'sku-27'] },
          { cells: ['7', '20', 'sku-28'] },
        ],
      },
    ],
    operators: ['×', '='],
  },
};

/** The data for a table diagram ref, or `undefined` when the ref names no table diagram. */
export function tableDiagramFor(ref: string): TableDiagramData | undefined {
  return Object.hasOwn(TABLE_DIAGRAMS, ref) ? TABLE_DIAGRAMS[ref] : undefined;
}

function Table({ table }: { readonly table: MiniTable }): ReactNode {
  return (
    <div>
      <div className="w-tablefig-name">{table.name}</div>
      <div className="sl-grid-wrap">
        <table className="sl-grid">
          <thead>
            <tr>
              {table.columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r, i) => (
              <tr key={i} {...(r.focus === undefined ? {} : { 'data-focus': String(r.focus) })}>
                {r.cells.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TableDiagram({
  data,
  caption,
}: {
  readonly data: TableDiagramData;
  readonly caption: string;
}) {
  return (
    <figure className="w-tablefig" aria-label={caption}>
      <figcaption>{caption}</figcaption>
      {data.tables.map((t, i) => (
        <div key={t.name} className="w-tablefig-part">
          <Table table={t} />
          {data.operators[i] !== undefined ? (
            <div className="w-tablefig-op" aria-hidden="true">
              {data.operators[i]}
            </div>
          ) : null}
        </div>
      ))}
    </figure>
  );
}
