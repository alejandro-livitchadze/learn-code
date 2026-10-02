import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { fixtures } from './fixtures';
import { IMPLEMENTED_KINDS, widgetRegistry } from './registry';

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
  it('renders a visible placeholder for unbuilt kinds', () => {
    expect(html('unbuilt-parsons')).toContain('has not been built yet');
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
  it('does not show a run button or answer before answering', () => {
    expect(html('predict-idle')).not.toContain('Run it');
  });
});
