/**
 * Turn PostgreSQL's 1-based error position into a `[from, to)` range in the document: the word
 * that starts at the position, or one character when it points at punctuation or the end.
 */
export function diagnosticRange(
  doc: string,
  position: number,
): { readonly from: number; readonly to: number } {
  if (doc.length === 0) return { from: 0, to: 0 };
  const at = Math.min(Math.max(position - 1, 0), doc.length - 1);
  let to = at;
  while (to < doc.length && /\w/.test(doc.charAt(to))) to += 1;
  return { from: at, to: to > at ? to : at + 1 };
}
