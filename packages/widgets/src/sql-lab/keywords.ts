import { RangeSetBuilder } from '@codemirror/state';
import { Decoration, ViewPlugin, type DecorationSet, type EditorView } from '@codemirror/view';

/** Words shown as keywords in the editor (the notebook colors SQL keywords with the author's ink). */
export const SQL_KEYWORDS: ReadonlySet<string> = new Set(
  (
    'select from where group by order having limit offset join inner left right full outer cross ' +
    'on using as and or not in is null distinct case when then else end union all intersect except ' +
    'insert into values update set delete create table alter drop add column with desc asc like ilike ' +
    'between exists primary key references default unique true false returning'
  ).split(' '),
);

export interface SqlSpan {
  readonly from: number;
  readonly to: number;
  readonly kind: 'keyword' | 'comment' | 'string';
}

const TOKEN = /--[^\n]*|'(?:[^']|'')*'?|\b[A-Za-z_]+\b/g;

/** Keywords, comments and string literals of `text`. Words inside comments or strings stay plain. */
export function sqlSpans(text: string): readonly SqlSpan[] {
  const spans: SqlSpan[] = [];
  for (const m of text.matchAll(TOKEN)) {
    const word = m[0];
    const from = m.index;
    const to = from + word.length;
    if (word.startsWith('--')) spans.push({ from, to, kind: 'comment' });
    else if (word.startsWith("'")) spans.push({ from, to, kind: 'string' });
    else if (SQL_KEYWORDS.has(word.toLowerCase())) spans.push({ from, to, kind: 'keyword' });
  }
  return spans;
}

function decorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  for (const s of sqlSpans(view.state.doc.toString())) {
    builder.add(s.from, s.to, Decoration.mark({ class: `sl-${s.kind}` }));
  }
  return builder.finish();
}

/** Marks keywords with the `sl-keyword` class. Styling lives in `widgets.css`. */
export const sqlKeywordMarks = ViewPlugin.fromClass(
  class {
    deco: DecorationSet;
    constructor(view: EditorView) {
      this.deco = decorations(view);
    }
    update(update: { docChanged: boolean; view: EditorView }): void {
      if (update.docChanged) this.deco = decorations(update.view);
    }
  },
  { decorations: (plugin) => plugin.deco },
);
