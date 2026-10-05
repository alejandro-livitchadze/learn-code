/** Splits a lesson title around its first highlighted phrase (E08: at most one in the title). */
export function splitTitle(
  title: string,
  highlights: readonly string[] | undefined,
): { readonly before: string; readonly mark?: string; readonly after: string } {
  const phrase = highlights?.[0];
  const at = phrase === undefined ? -1 : title.indexOf(phrase);
  if (phrase === undefined || at < 0) return { before: title, after: '' };
  return {
    before: title.slice(0, at),
    mark: phrase,
    after: title.slice(at + phrase.length),
  };
}
