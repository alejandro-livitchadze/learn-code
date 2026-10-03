import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { fixtures } from './fixtures';
import { FooterProvider } from './chrome';
import { Predict } from './Predict';
import { ReviewCardsProvider } from './Passive';
import { IMPLEMENTED_KINDS, widgetRegistry } from './registry';

/** Text a learner can read: tags and attribute values removed. */
function visibleText(markup: string): string {
  return markup.replace(/<[^>]*>/g, ' ');
}

function html(id: string, onComplete = vi.fn()): string {
  const f = fixtures.find((x) => x.id === id);
  if (f === undefined) throw new Error(`no fixture ${id}`);
  const Widget = widgetRegistry[f.step.kind] as React.ComponentType<{
    step: typeof f.step;
    restored: typeof f.restored;
    onComplete: typeof onComplete;
  }>;
  return renderToString(<Widget step={f.step} restored={f.restored} onComplete={onComplete} />);
}

describe('rendering', () => {
  it('renders every fixture without throwing', () => {
    for (const f of fixtures) expect(html(f.id).length).toBeGreaterThan(0);
  });
  it('covers every implemented kind in the fixtures', () => {
    const kinds = new Set(fixtures.map((f) => f.step.kind));
    for (const k of IMPLEMENTED_KINDS) expect(kinds.has(k)).toBe(true);
  });
  it('renders a short notice for unbuilt kinds, without naming the kind', () => {
    const out = html('unbuilt-parsons');
    expect(out).toContain('coming soon');
    expect(visibleText(out)).not.toMatch(/parsons|built yet|placeholder/i);
  });
  it('never shows an internal kind name, id or placeholder wording to the learner', () => {
    for (const f of fixtures) {
      const text = visibleText(html(f.id));
      expect(text, f.id).not.toMatch(/fillBlanks|sqlLab|beTheRuntime|beTheDatabase|firesideChat/);
      expect(text, f.id).not.toMatch(/placeholder|not built yet/i);
    }
  });
  it('puts the step tag text from E08 section 6 on each step', () => {
    expect(html('predict-idle')).toContain('>Predict<');
    expect(html('fill-idle')).toContain('>Your turn<');
    expect(html('sql-idle')).toContain('>Your turn<');
    expect(html('explain-normal')).toContain('>Here&#x27;s the thing<');
    expect(html('recap-normal')).toContain('>Pin this to your brain<');
    expect(html('pitfall-normal')).toContain('>Gotcha<');
    expect(html('hook-normal')).not.toContain('ui-steptag');
  });
  it('shows its own Lock in answer button without a host, and none with a host', () => {
    expect(html('predict-idle')).toContain('Lock in answer');
    expect(html('fill-idle')).toContain('Lock in answer');
    const f = fixtures.find((x) => x.id === 'predict-idle');
    if (f === undefined || f.step.kind !== 'predict') throw new Error('fixture');
    const hosted = renderToString(
      <FooterProvider value={() => undefined}>
        <Predict step={f.step} restored={undefined} onComplete={() => undefined} />
      </FooterProvider>,
    );
    expect(hosted).not.toContain('Lock in answer');
  });
  it('shows the feedback banner at the top after a wrong try', () => {
    const f = fixtures.find((x) => x.id === 'predict-wrong');
    if (f === undefined || f.step.kind !== 'predict') throw new Error('fixture');
    const out = renderToString(
      <Predict
        step={f.step}
        restored={undefined}
        onComplete={() => undefined}
        initialTried={f.preset?.tried ?? []}
      />,
    );
    expect(out.indexOf('ui-feedback')).toBeGreaterThan(-1);
    expect(out.indexOf('ui-feedback')).toBeLessThan(out.indexOf('ui-steptag'));
    expect(out).toContain('data-correct="false"');
  });
  it('shows the answered state when restored, without calling onComplete', () => {
    const done = vi.fn();
    const predict = html('predict-restored', done);
    expect(predict).toContain('Correct');
    expect(predict).toContain('Output');
    const fill = html('fill-restored', done);
    expect(fill).toContain('All blanks are correct.');
    expect(done).not.toHaveBeenCalled();
  });
  it('renders sqlLab as the real widget, with its editor frame and no engine started', () => {
    const out = html('sql-idle');
    expect(out).toContain('data-kind="sqlLab"');
    expect(out).toContain('Run · Ctrl+Enter');
    expect(out).toContain('Reset database');
    expect(out).not.toContain('has not been built yet');
  });
  it('shows a solved sqlLab when restored, without calling onComplete', () => {
    const done = vi.fn();
    expect(html('sql-restored', done)).toContain('Your query returns the expected result.');
    expect(done).not.toHaveBeenCalled();
  });
  it('does not show the real output before answering', () => {
    expect(html('predict-idle')).not.toContain('Real output');
  });
});

describe('recap review cards and explain notes', () => {
  it('shows a review card per known concept of the recap, and none without names', () => {
    const f = fixtures.find((x) => x.id === 'recap-normal');
    if (f === undefined || f.step.kind !== 'recap') throw new Error('no recap fixture');
    const Recap = widgetRegistry.recap;
    const concept = f.step.concepts[0] ?? 'none';
    const withNames = renderToString(
      <ReviewCardsProvider value={{ [concept]: 'Row multiplication' }}>
        <Recap step={f.step} restored={undefined} onComplete={vi.fn()} />
      </ReviewCardsProvider>,
    );
    expect(visibleText(withNames)).toContain('Can you explain: Row multiplication?');
    expect(visibleText(withNames)).toContain('in 1 day');
    const without = renderToString(
      <Recap step={f.step} restored={undefined} onComplete={vi.fn()} />,
    );
    expect(without).not.toContain('review cards');
  });
  it('opens the first annotation of an explain step', () => {
    const f = fixtures.find((x) => x.id === 'explain-normal');
    if (f === undefined || f.step.kind !== 'explain') throw new Error('no explain fixture');
    const first = f.step.annotations[0];
    expect(first).toBeDefined();
    expect(visibleText(html('explain-normal'))).toContain(first?.text);
  });
});
