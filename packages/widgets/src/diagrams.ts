import type { DiagramElement } from '@learn-code/ui';

/**
 * Diagrams that a `diagram` margin item can name by `ref`. Each is built from at most 8
 * elements (E08 section 4). Add a diagram here before a lesson refers to it.
 */
export const DIAGRAMS: Readonly<Record<string, readonly DiagramElement[]>> = {
  'one-order-four-items': [
    { type: 'chip', text: 'order 7', tone: 'ink' },
    { type: 'arrow' },
    { type: 'cards', texts: ['mug', 'tee', 'cap', 'pin'] },
  ],
  'row-multiplication': [
    { type: 'chip', text: '1 order', tone: 'ink' },
    { type: 'arrow' },
    { type: 'chip', text: '4 items' },
    { type: 'arrow' },
    { type: 'chip', text: '4 rows' },
  ],
};

/** The elements for a diagram ref, or `undefined` when the ref is unknown. */
export function diagramFor(ref: string): readonly DiagramElement[] | undefined {
  return Object.hasOwn(DIAGRAMS, ref) ? DIAGRAMS[ref] : undefined;
}
