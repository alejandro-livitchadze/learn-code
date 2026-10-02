'use client';

import { createContext, useContext } from 'react';
import type { HighlightMap } from './types';

const HighlightsContext = createContext<HighlightMap>({});

/** The host supplies pre-highlighted code (by `<stepId>:<field>`). Without it code is plain text. */
export const HighlightsProvider = HighlightsContext.Provider;

export interface CodeNote {
  readonly line: number;
  readonly text: string;
}

interface Props {
  readonly code: string;
  readonly highlightKey: string;
  readonly label: string;
  readonly notes?: readonly CodeNote[];
}

/** Code that scrolls inside its own box, never the page. Notes sit in the margin by line. */
export function Code({ code, highlightKey, label, notes = [] }: Props) {
  const highlights = useContext(HighlightsContext);
  const tokens = highlights[highlightKey];
  const lines = code.split('\n');
  return (
    <figure className="w-code" aria-label={label}>
      <pre tabIndex={0}>
        <code>
          {lines.map((text, i) => (
            <span className="w-line" key={i}>
              <span className="w-line-text">
                {tokens?.[i] === undefined
                  ? text === ''
                    ? '\n'
                    : text
                  : tokens[i].map((t, j) => (
                      <span key={j} style={t.style} className="w-tok">
                        {t.content}
                      </span>
                    ))}
              </span>
              {notes
                .filter((n) => n.line === i + 1)
                .map((n, k) => (
                  <span className="w-note" key={k}>
                    {'← '}
                    {n.text}
                  </span>
                ))}
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}
