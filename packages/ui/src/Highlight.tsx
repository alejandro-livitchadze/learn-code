import type { ReactNode } from 'react';

export const MAX_HIGHLIGHT_WORDS = 6;

export function wordCount(text: string): number {
  return text.split(/\s+/).filter((w) => w !== '').length;
}

/**
 * Highlighter stroke behind a short phrase. Text only, so the six-word limit can be
 * enforced: a longer phrase is rendered without the stroke.
 */
export function Highlight({ children }: { readonly children: string }): ReactNode {
  if (wordCount(children) > MAX_HIGHLIGHT_WORDS) return children;
  return <mark className="ui-highlight">{children}</mark>;
}
