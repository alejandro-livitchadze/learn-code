'use client';

import { useEffect, useRef } from 'react';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { PostgreSQL, sql } from '@codemirror/lang-sql';
import { lintGutter, setDiagnostics } from '@codemirror/lint';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, placeholder } from '@codemirror/view';
import { diagnosticRange } from './editor-range';
import { sqlKeywordMarks } from './keywords';

export interface EditorError {
  /** 1-based character position reported by PostgreSQL. */
  readonly position: number;
  readonly message: string;
}

interface Props {
  readonly value: string;
  readonly onChange: (value: string) => void;
  /** Called on Ctrl+Enter (Cmd+Enter on macOS). */
  readonly onRun: () => void;
  readonly error: EditorError | undefined;
  readonly label: string;
}

/** CodeMirror 6 with the PostgreSQL dialect. Errors are marked at the reported position. */
export function SqlEditor({ value, onChange, onRun, error, label }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRun);
  onChangeRef.current = onChange;
  onRunRef.current = onRun;

  useEffect(() => {
    const parent = host.current;
    if (parent === null) return;
    const editor = new EditorView({
      parent,
      state: EditorState.create({
        doc: value,
        extensions: [
          history(),
          lineNumbers(),
          lintGutter(),
          sql({ dialect: PostgreSQL }),
          sqlKeywordMarks,
          placeholder('Write a query. Ctrl+Enter runs it.'),
          EditorView.contentAttributes.of({ 'aria-label': label }),
          keymap.of([
            {
              key: 'Mod-Enter',
              run: () => {
                onRunRef.current();
                return true;
              },
            },
            ...defaultKeymap,
            ...historyKeymap,
          ]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString());
          }),
        ],
      }),
    });
    view.current = editor;
    return () => {
      editor.destroy();
      view.current = null;
    };
    // The editor is created once; later value changes are synced below.
  }, []);

  useEffect(() => {
    const editor = view.current;
    if (editor === null || editor.state.doc.toString() === value) return;
    editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } });
  }, [value]);

  useEffect(() => {
    const editor = view.current;
    if (editor === null) return;
    const doc = editor.state.doc.toString();
    const diagnostics =
      error === undefined
        ? []
        : [
            {
              ...diagnosticRange(doc, error.position),
              severity: 'error' as const,
              message: error.message,
            },
          ];
    editor.dispatch(setDiagnostics(editor.state, diagnostics));
  }, [error]);

  return <div className="sl-editor" ref={host} data-testid="sql-editor" />;
}
