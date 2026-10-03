'use client';

import { createContext, useContext } from 'react';
import { Annotation, InkCard } from '@learn-code/ui';
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

/**
 * Code in a white ink card. It scrolls inside its own box, never the page. Notes sit to the
 * right of their line as handwriting with an arrow.
 */
export function Code({ code, highlightKey, label, notes = [] }: Props) {
  const highlights = useContext(HighlightsContext);
  const tokens = highlights[highlightKey];
  const lines = code.split('\n');
  return (
    <figure className="w-code" aria-label={label}>
      <InkCard>
        <pre className="w-code-grid" tabIndex={0}>
          <code>
            {lines.map((text, i) => {
              const here = notes.filter((n) => n.line === i + 1);
              return (
                <span className="w-line" key={i}>
                  <span className="w-line-text">
                    {tokens?.[i] === undefined
                      ? text
                      : tokens[i].map((t, j) => (
                          <span key={j} style={t.style} className="w-tok">
                            {t.content}
                          </span>
                        ))}
                  </span>
                  <span className="w-line-note">
                    {here.map((n, k) => (
                      <Annotation key={k}>{n.text}</Annotation>
                    ))}
                  </span>
                </span>
              );
            })}
          </code>
        </pre>
      </InkCard>
    </figure>
  );
}
