/** Inline marker for highlighted phrases in titles and prose: `==phrase==`. */
const MARKER = /==([^=\n]+?)==/g;

/** Every highlighted phrase in `text`, in order. */
export function findHighlights(text: string): readonly string[] {
  return [...text.matchAll(MARKER)].map((m) => (m[1] ?? '').trim());
}

/** Remove the markers and return the plain text with the phrases that were marked. */
export function splitHighlights(text: string): {
  readonly plain: string;
  readonly highlights: readonly string[];
} {
  return {
    plain: text.replace(MARKER, (_, p: string) => p.trim()),
    highlights: findHighlights(text),
  };
}
