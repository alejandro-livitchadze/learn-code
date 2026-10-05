import type { ReactNode } from 'react';
import { Character, type CharacterName } from './characters';
import { wordCount } from './Highlight';

/** A character with its speech bubble beside or below the drawing. Not for Olha (stickies). */
export function Speaker({
  who,
  children,
}: {
  readonly who: CharacterName;
  readonly children: ReactNode;
}) {
  return (
    <div className="ui-speaker" data-character={who}>
      <Character who={who} />
      <SpeechBubble>{children}</SpeechBubble>
    </div>
  );
}

/** Olha's sticky note: handwritten text under an uppercase label. Only Olha speaks in these. */
export function StickyNote({
  label = 'Olha asks',
  children,
}: {
  readonly label?: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="ui-sticky" data-testid="sticky-note">
      <div className="ui-sticky-label">{label}</div>
      {children}
    </div>
  );
}

/** White bubble with a hard shadow. Only The Bug and Mr. Runtime speak in bubbles. */
export function SpeechBubble({ children }: { readonly children: ReactNode }) {
  return <div className="ui-bubble">{children}</div>;
}

/** A common mistake and its consequence. */
export function Gotcha({ children }: { readonly children: ReactNode }) {
  return (
    <div className="ui-gotcha">
      <div className="ui-gotcha-label">Gotcha</div>
      <p>{children}</p>
    </div>
  );
}

/** One open question, never the answer. */
export function StopAndThink({ children }: { readonly children: ReactNode }) {
  return (
    <div className="ui-stop">
      <div className="ui-stop-label">
        <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
          <path d="M13 3 a7 7 0 0 1 4 12.7 V19 h-8 v-3.3 A7 7 0 0 1 13 3z" />
          <path d="M10 23 h6" />
        </svg>
        Stop and think
      </div>
      <p>{children}</p>
    </div>
  );
}

export const MAX_ANNOTATION_WORDS = 8;

/**
 * Handwritten note with a hand-drawn arrow, placed to the right of a code line. Text only,
 * so the word limit can be enforced: a longer note is not rendered.
 */
export function Annotation({
  children,
  curve = 'up',
}: {
  readonly children: string;
  readonly curve?: 'up' | 'down';
}): ReactNode {
  if (wordCount(children) > MAX_ANNOTATION_WORDS) return null;
  return (
    <span className="ui-annotation">
      <svg width="44" height="20" viewBox="0 0 44 20" aria-hidden="true">
        <path
          d={
            curve === 'up'
              ? 'M42 10 C30 4 18 16 4 10 M4 10 L12 4 M4 10 L11 17'
              : 'M42 10 C30 16 18 4 4 10 M4 10 L12 4 M4 10 L11 17'
          }
        />
      </svg>
      <span>{children}</span>
    </span>
  );
}

export type DiagramElement =
  | { readonly type: 'chip'; readonly text: string; readonly tone?: 'ink' | 'plain' }
  | { readonly type: 'cards'; readonly texts: readonly string[] }
  | { readonly type: 'arrow' };

export const MAX_DIAGRAM_ELEMENTS = 8;

/** Elements shown: at most `MAX_DIAGRAM_ELEMENTS` (a card group counts as its cards). */
export function limitDiagramElements(
  elements: readonly DiagramElement[],
): readonly DiagramElement[] {
  const out: DiagramElement[] = [];
  let used = 0;
  for (const el of elements) {
    const cost = el.type === 'cards' ? el.texts.length : 1;
    if (used + cost > MAX_DIAGRAM_ELEMENTS) break;
    out.push(el);
    used += cost;
  }
  return out;
}

function DiagramPart({ element }: { readonly element: DiagramElement }) {
  switch (element.type) {
    case 'chip':
      return (
        <span className="ui-chip" data-tone={element.tone ?? 'plain'}>
          {element.text}
        </span>
      );
    case 'cards':
      return (
        <span className="ui-diagram-cards">
          {element.texts.map((t) => (
            <span key={t} className="ui-chip" data-tone="plain">
              {t}
            </span>
          ))}
        </span>
      );
    case 'arrow':
      return (
        <svg
          className="ui-diagram-arrow"
          width="30"
          height="18"
          viewBox="0 0 30 18"
          aria-hidden="true"
        >
          <path d="M2 9 H26 M20 3 L27 9 L20 15" />
        </svg>
      );
    default: {
      const never: never = element;
      return never;
    }
  }
}

/** Mono chips and hand-drawn arrows with one handwritten caption. At most 8 elements. */
export function MiniDiagram({
  elements,
  caption,
  label,
}: {
  readonly elements: readonly DiagramElement[];
  readonly caption: string;
  readonly label?: string;
}) {
  return (
    <figure className="ui-diagram" aria-label={label ?? caption}>
      <figcaption className="ui-diagram-caption">{caption}</figcaption>
      <div className="ui-diagram-row">
        {limitDiagramElements(elements).map((el, i) => (
          <DiagramPart key={i} element={el} />
        ))}
      </div>
    </figure>
  );
}
