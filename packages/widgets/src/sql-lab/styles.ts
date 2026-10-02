/** Styles for the sqlLab widget. Rendered once inside the widget so no extra CSS import is needed. */
export const SQL_LAB_CSS = `
.sl-editor { border: 1px solid var(--border, #d9d5cc); border-radius: 8px; overflow: hidden; background: var(--surface, #fff); }
.sl-editor .cm-editor { font: 0.9rem/1.6 var(--font-code, ui-monospace, monospace); min-height: 8rem; }
.sl-editor .cm-editor.cm-focused { outline: 2px solid var(--accent, #1d4ed8); outline-offset: -2px; }
.sl-editor .cm-scroller { overflow: auto; }
.sl-grid-wrap { overflow: auto; max-width: 100%; border: 1px solid var(--border, #d9d5cc); border-radius: 8px; }
.sl-grid { border-collapse: collapse; width: 100%; font: 0.85rem/1.5 var(--font-code, ui-monospace, monospace); }
.sl-grid th, .sl-grid td { text-align: left; padding: 0.3rem 0.6rem; border-bottom: 1px solid var(--border, #d9d5cc); white-space: nowrap; }
.sl-grid th { background: color-mix(in srgb, var(--border, #d9d5cc) 35%, transparent); }
.sl-grid tr[data-diff='missing'] td { background: color-mix(in srgb, #b45309 18%, transparent); }
.sl-grid tr[data-diff='extra'] td { background: color-mix(in srgb, #b91c1c 14%, transparent); }
.sl-null { color: var(--muted, #55524d); font-style: italic; }
.sl-error { margin: 0; padding: 0.6rem 0.8rem; border-radius: 8px; border: 2px solid #b91c1c; font: 0.9rem/1.5 var(--font-code, ui-monospace, monospace); white-space: pre-wrap; overflow-wrap: anywhere; }
.sl-ok { margin: 0; padding: 0.6rem 0.8rem; border-radius: 8px; border: 2px solid #15803d; font-weight: 600; }
.sl-schema { display: flex; flex-wrap: wrap; gap: 0.75rem; margin: 0; padding: 0; list-style: none; }
.sl-schema li { border: 1px solid var(--border, #d9d5cc); border-radius: 8px; padding: 0.4rem 0.7rem; font: 0.85rem/1.5 var(--font-code, ui-monospace, monospace); }
.sl-schema strong { display: block; }
.sl-schema span { color: var(--muted, #55524d); }
.sl-diff { display: grid; gap: 0.5rem; }
`;
