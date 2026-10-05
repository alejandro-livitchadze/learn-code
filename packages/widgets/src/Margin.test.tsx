import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { MarginItem } from '@learn-code/lesson-schema';
import { fixtures } from './fixtures';
import { HookColumn, MarginItems } from './Margin';
import { diagramFor } from './diagrams';

const items: readonly MarginItem[] = [
  { type: 'sticky', who: 'olha', label: 'asks', text: 'Is that really 400?' },
  { type: 'bubble', who: 'runtime', text: 'Rules are **rules**.' },
  { type: 'gotcha', text: 'Pairs, not orders.' },
  { type: 'stopAndThink', text: 'What does one order become?' },
  { type: 'diagram', ref: 'one-order-four-items', caption: 'one order, four items' },
];

describe('MarginItems', () => {
  it('renders nothing without items', () => {
    expect(renderToString(<MarginItems items={undefined} />)).toBe('');
    expect(renderToString(<MarginItems items={[]} />)).toBe('');
  });

  it('renders every item type with its own component', () => {
    const html = renderToString(<MarginItems items={items} />);
    expect(html).toContain('Olha asks');
    expect(html).toContain('Is that really 400?');
    expect(html).toContain('aria-label="Mr. Runtime"');
    expect(html).toContain('<strong>rules</strong>');
    expect(html).toContain('Gotcha');
    expect(html).toContain('Stop and think');
    expect(html).toContain('one order, four items');
    expect(html).toContain('mug');
  });

  it('labels Olha says differently from asks', () => {
    const html = renderToString(
      <MarginItems items={[{ type: 'sticky', who: 'olha', label: 'says', text: 'Oh.' }]} />,
    );
    expect(html).toContain('Olha says');
  });

  it('shows only the caption for an unknown diagram ref, never the ref', () => {
    const html = renderToString(
      <MarginItems items={[{ type: 'diagram', ref: 'no-such-diagram', caption: 'A caption' }]} />,
    );
    expect(html).toContain('A caption');
    expect(html).not.toContain('no-such-diagram');
  });
});

describe('HookColumn', () => {
  it('draws The Bug by default and the named character otherwise', () => {
    expect(renderToString(<HookColumn character={undefined}>Hi</HookColumn>)).toContain(
      'aria-label="The Bug"',
    );
    expect(renderToString(<HookColumn character="mrRuntime">Hi</HookColumn>)).toContain(
      'aria-label="Mr. Runtime"',
    );
    expect(renderToString(<HookColumn character="olha">Hi</HookColumn>)).toContain(
      'aria-label="Olha"',
    );
  });
});

describe('diagrams', () => {
  it('every registered diagram has at most 8 elements', () => {
    for (const ref of ['one-order-four-items', 'row-multiplication']) {
      expect(diagramFor(ref)?.length).toBeLessThanOrEqual(8);
    }
    expect(diagramFor('toString')).toBeUndefined();
    expect(diagramFor('orders-x-items')).toBeUndefined();
  });
  it('the hook fixtures still render through the widget registry', () => {
    expect(fixtures.some((f) => f.step.kind === 'hook')).toBe(true);
  });
});

describe('table diagram', () => {
  it('renders the orders by items tables for its ref, with the caption', () => {
    const out = renderToString(
      <MarginItems
        items={[{ type: 'diagram', ref: 'orders-x-items', caption: 'follow order 7' }]}
      />,
    );
    expect(out).toContain('follow order 7');
    expect(out).toContain('join result');
    expect(out).toContain('sku-28');
  });
});
