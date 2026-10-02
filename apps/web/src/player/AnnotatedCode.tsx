import type { HighlightedLines } from '../lib/highlight';

export interface Annotation {
  readonly line: number;
  readonly text: string;
}

interface Props {
  readonly lines: HighlightedLines;
  readonly annotations?: readonly Annotation[];
  readonly label?: string;
}

/** Code with a handwritten note and an arrow in the margin, anchored to a line. */
export function AnnotatedCode({ lines, annotations = [], label = 'Code' }: Props) {
  return (
    <figure className="code" aria-label={label}>
      <pre tabIndex={0}>
        <code>
          {lines.map((tokens, i) => {
            const notes = annotations.filter((a) => a.line === i + 1);
            return (
              <span className="code-line" key={i}>
                <span className="code-text">
                  {tokens.length === 0
                    ? '\n'
                    : tokens.map((t, j) => (
                        <span key={j} style={t.style}>
                          {t.content}
                        </span>
                      ))}
                </span>
                {notes.map((n, k) => (
                  <span className="note" key={k}>
                    <svg
                      aria-hidden="true"
                      width="28"
                      height="14"
                      viewBox="0 0 28 14"
                      focusable="false"
                    >
                      <path
                        d="M27 7 C18 3, 12 11, 3 7 M7 2 L2 7 L7 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="note-text">{n.text}</span>
                  </span>
                ))}
              </span>
            );
          })}
        </code>
      </pre>
    </figure>
  );
}
