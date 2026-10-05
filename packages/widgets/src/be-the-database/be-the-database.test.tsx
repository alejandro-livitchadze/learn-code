import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { FooterProvider } from '../chrome';
import { BeTheDatabaseView, readSavedPairs } from './BeTheDatabase';
import { stepFor, loadTrace, TRACE_REFS } from './fixtures';
import {
  checkPairing,
  describeProblems,
  hasPair,
  pairLabel,
  rowLabel,
  summarize,
  togglePair,
} from './pairing';
import { parseTrace, type Pair } from './trace';

const text = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

describe('parseTrace', () => {
  const raw: unknown = JSON.parse(JSON.stringify(loadTrace('join-left')));
  const mutate = (f: (o: Record<string, unknown>) => void): unknown => {
    const copy: Record<string, unknown> = JSON.parse(JSON.stringify(raw));
    f(copy);
    return copy;
  };
  it('reads every committed trace', () => {
    const dir = join(import.meta.dirname, '../../../../content');
    for (const course of readdirSync(dir)) {
      const lessons = join(dir, course);
      for (const lesson of readdirSync(lessons)) {
        const traces = join(lessons, lesson, 'traces');
        let files: string[] = [];
        try {
          files = readdirSync(traces).filter((f) => f.endsWith('.trace.json'));
        } catch {
          continue;
        }
        for (const f of files) {
          expect(parseTrace(JSON.parse(readFileSync(join(traces, f), 'utf8'))), f).toBeDefined();
        }
      }
    }
  });
  it('rejects damaged data instead of guessing', () => {
    expect(parseTrace(null)).toBeUndefined();
    expect(parseTrace(mutate((o) => (o['version'] = 2)))).toBeUndefined();
    expect(parseTrace(mutate((o) => (o['joinKind'] = 'cross')))).toBeUndefined();
    expect(parseTrace(mutate((o) => (o['pairs'] = [{ left: 99, right: 0 }])))).toBeUndefined();
    expect(parseTrace(mutate((o) => (o['pairs'] = [{ left: 0, right: 1.5 }])))).toBeUndefined();
    expect(parseTrace(mutate((o) => (o['pairs'] = 'x')))).toBeUndefined();
    expect(parseTrace(mutate((o) => delete o['result']))).toBeUndefined();
    expect(
      parseTrace(mutate((o) => (o['left'] = { name: 'a', columns: ['x'], rows: [['1', '2']] }))),
    ).toBeUndefined();
  });
});

describe('checking the learner pairing against the recorded trace', () => {
  it.each(TRACE_REFS)('accepts exactly the recorded pairs of %s, in any order', (ref) => {
    const trace = loadTrace(ref);
    const shuffled = trace.pairs.toReversed();
    expect(checkPairing(trace, shuffled)).toEqual({ correct: true, extra: [], missing: [] });
    expect(describeProblems(trace, checkPairing(trace, shuffled))).toEqual([]);
  });

  it('INNER: rows without a partner must stay unpaired', () => {
    const t = loadTrace('join-inner');
    const wrong = checkPairing(t, [...t.pairs, { left: 2, right: null }]);
    expect(wrong.correct).toBe(false);
    expect(wrong.extra).toEqual([{ left: 2, right: null }]);
    expect(describeProblems(t, wrong).join(' ')).toContain('never kept with NULLs');
  });

  it('LEFT: the learner must keep the unmatched row with an empty partner', () => {
    const t = loadTrace('join-left');
    const noEmpty = t.pairs.filter((p) => p.right !== null);
    const c = checkPairing(t, noEmpty);
    expect(c.missing).toEqual([{ left: 2, right: null }]);
    expect(describeProblems(t, c)).toEqual([
      'customers 3 (Chloe) has no partner. A left join still keeps it, once, with NULLs.',
    ]);
  });

  it('ROW-MULTIPLYING: one pair per match, not one per left row', () => {
    const t = loadTrace('join-multiply');
    const onePerRow = t.pairs.filter((p, i, all) => all.findIndex((q) => q.left === p.left) === i);
    const c = checkPairing(t, onePerRow);
    expect(c.correct).toBe(false);
    expect(c.missing.length).toBe(t.pairs.length - onePerRow.length);
    const msgs = describeProblems(t, c);
    expect(msgs[0]).toContain('people 1 (Olha) has 2 matching rows');
    expect(msgs[0]).toContain('you found 1');
  });

  it('names the wrong partner without giving the full answer', () => {
    const t = loadTrace('join-inner');
    const swapped: Pair[] = [{ left: 0, right: 2 }, ...t.pairs.slice(1)];
    const msgs = describeProblems(t, checkPairing(t, swapped));
    expect(msgs[0]).toContain(
      'orders 13 (2) does not satisfy the condition for customers 1 (Anna)',
    );
  });

  it('ignores duplicate pairs and ignores nothing else', () => {
    const t = loadTrace('join-inner');
    expect(checkPairing(t, [...t.pairs, ...t.pairs]).correct).toBe(true);
    expect(checkPairing(t, []).missing).toHaveLength(t.pairs.length);
  });
});

describe('pair list helpers', () => {
  it('toggles a pair on and off and keeps the list ordered', () => {
    let pairs: readonly Pair[] = [];
    pairs = togglePair(pairs, { left: 2, right: 1 });
    pairs = togglePair(pairs, { left: 0, right: null });
    pairs = togglePair(pairs, { left: 0, right: 3 });
    expect(pairs).toEqual([
      { left: 0, right: 3 },
      { left: 0, right: null },
      { left: 2, right: 1 },
    ]);
    expect(hasPair(pairs, { left: 0, right: null })).toBe(true);
    pairs = togglePair(pairs, { left: 0, right: null });
    expect(hasPair(pairs, { left: 0, right: null })).toBe(false);
    expect(pairs).toHaveLength(2);
  });
  it('labels rows with their id and name', () => {
    const t = loadTrace('join-left');
    expect(rowLabel(t, 'left', 0)).toBe('customers 1 (Anna)');
    expect(pairLabel(t, { left: 2, right: null })).toBe(
      'customers 3 (Chloe) with an empty row of NULLs',
    );
    expect(pairLabel(t, { left: 0, right: 1 })).toBe('customers 1 (Anna) and orders 12 (1)');
  });
  it('summarizes each variant from the recorded numbers', () => {
    expect(summarize(loadTrace('join-inner'))).toBe(
      '5 rows came out of 4 customers rows. customers 1 (Anna) shows up 2 times, once per match. 1 row without a partner vanished.',
    );
    expect(summarize(loadTrace('join-left'))).toContain(
      '1 row without a partner stayed, with NULLs.',
    );
    expect(summarize(loadTrace('join-multiply'))).toContain('people 1 (Olha) shows up 2 times');
  });
});

describe('readSavedPairs', () => {
  it('reads a saved answer and ignores garbage', () => {
    const answered = (payload: unknown) => ({
      status: 'answered' as const,
      correct: true,
      attempts: 1,
      payload,
    });
    expect(
      readSavedPairs(
        answered({
          pairs: [
            [0, 1],
            [2, null],
          ],
        }),
      ),
    ).toEqual([
      { left: 0, right: 1 },
      { left: 2, right: null },
    ]);
    expect(readSavedPairs(answered({ pairs: [[0]] }))).toBeUndefined();
    expect(readSavedPairs(answered({ pairs: [['a', 1]] }))).toBeUndefined();
    expect(readSavedPairs(answered(null))).toBeUndefined();
    expect(readSavedPairs(answered({}))).toBeUndefined();
    expect(readSavedPairs(undefined)).toBeUndefined();
    expect(readSavedPairs({ status: 'viewed' })).toBeUndefined();
  });
});

describe('BeTheDatabaseView rendering', () => {
  const render = (
    ref: (typeof TRACE_REFS)[number],
    restored?: Parameters<typeof BeTheDatabaseView>[0]['restored'],
  ) => {
    const trace = loadTrace(ref);
    return renderToString(
      <BeTheDatabaseView
        step={stepFor(trace)}
        trace={trace}
        restored={restored}
        onComplete={vi.fn()}
      />,
    );
  };
  it('shows the tag, the query, both tables and the one primary button', () => {
    const out = render('join-inner');
    expect(out).toContain('You are the machine');
    expect(out).toContain('inner join orders');
    expect(out).toContain('Table customers');
    expect(out).toContain('Table orders');
    expect(out).toContain('Check my pairs');
    expect(out.match(/ui-btn-primary/g)).toHaveLength(1);
    expect(out).toContain('Pick a row in customers.');
  });
  it('offers the NULL button for a left join only', () => {
    expect(render('join-left')).toContain('No partner: keep it with NULLs');
    expect(render('join-inner')).not.toContain('keep it with NULLs');
    expect(render('join-multiply')).not.toContain('keep it with NULLs');
  });
  it('does not render its own button when a host owns the footer', () => {
    const trace = loadTrace('join-inner');
    const out = renderToString(
      <FooterProvider value={() => undefined}>
        <BeTheDatabaseView
          step={stepFor(trace)}
          trace={trace}
          restored={undefined}
          onComplete={vi.fn()}
        />
      </FooterProvider>,
    );
    expect(out).not.toContain('Check my pairs');
  });
  it('shows the real result and a locked state for a solved step', () => {
    const trace = loadTrace('join-left');
    const out = render('join-left', {
      status: 'answered',
      correct: true,
      attempts: 2,
      payload: { pairs: trace.pairs.map((p) => [p.left, p.right]) },
    });
    const flat = text(out);
    expect(flat).toContain('What PostgreSQL returned');
    expect(flat).toContain('Locked in.');
    expect(flat).toContain('Chloe NULL');
    expect(out).not.toContain('Check my pairs');
    expect(flat).toContain('Dmytro plant');
  });
  it('never shows internal names to the learner', () => {
    for (const ref of TRACE_REFS) {
      expect(text(render(ref))).not.toMatch(/beTheDatabase|traceRef|placeholder|not built yet/i);
    }
  });
});
