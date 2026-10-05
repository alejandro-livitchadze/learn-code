import type { JoinTrace, Pair } from './trace';

/** Pure checking logic of the join widget. No React, no I/O. */

const keyOf = (p: Pair): string => `${p.left}:${p.right === null ? 'none' : p.right}`;

const byRows = (a: Pair, b: Pair): number =>
  a.left - b.left || (a.right ?? Number.MAX_SAFE_INTEGER) - (b.right ?? Number.MAX_SAFE_INTEGER);

/** Add the pair, or remove it when it is already there. The list stays ordered and unique. */
export function togglePair(pairs: readonly Pair[], p: Pair): readonly Pair[] {
  const has = pairs.some((x) => keyOf(x) === keyOf(p));
  return (has ? pairs.filter((x) => keyOf(x) !== keyOf(p)) : [...pairs, p]).toSorted(byRows);
}

export const hasPair = (pairs: readonly Pair[], p: Pair): boolean =>
  pairs.some((x) => keyOf(x) === keyOf(p));

export interface PairingCheck {
  readonly correct: boolean;
  /** Pairs the learner made that the database did not make. */
  readonly extra: readonly Pair[];
  /** Pairs the database made that the learner did not. */
  readonly missing: readonly Pair[];
}

/** Compare the learner's pairs with the recorded ones. Order does not matter; duplicates do not count. */
export function checkPairing(trace: JoinTrace, given: readonly Pair[]): PairingCheck {
  const expected = new Set(trace.pairs.map(keyOf));
  const have = new Set(given.map(keyOf));
  const extra = [...new Map(given.map((p) => [keyOf(p), p])).values()]
    .filter((p) => !expected.has(keyOf(p)))
    .toSorted(byRows);
  const missing = trace.pairs.filter((p) => !have.has(keyOf(p)));
  return { correct: extra.length === 0 && missing.length === 0, extra, missing };
}

/** `customers 3 (Chloe)`: table name, first cell (the id) and second cell when there is one. */
export function rowLabel(trace: JoinTrace, side: 'left' | 'right', index: number): string {
  const t = trace[side];
  const row = t.rows[index];
  const id = row?.[0] ?? '?';
  const more = row?.[1];
  return more === undefined ? `${t.name} ${id}` : `${t.name} ${id} (${more})`;
}

export function pairLabel(trace: JoinTrace, p: Pair): string {
  return p.right === null
    ? `${rowLabel(trace, 'left', p.left)} with an empty row of NULLs`
    : `${rowLabel(trace, 'left', p.left)} and ${rowLabel(trace, 'right', p.right)}`;
}

const count = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * Plain-language problems, at most one per left row so the learner can act on them. They say
 * what is wrong with a row, not the full answer.
 */
export function describeProblems(trace: JoinTrace, check: PairingCheck): readonly string[] {
  if (check.correct) return [];
  const rows = new Set([...check.extra, ...check.missing].map((p) => p.left));
  return [...rows]
    .toSorted((a, b) => a - b)
    .map((l) => {
      const who = rowLabel(trace, 'left', l);
      const extra = check.extra.filter((p) => p.left === l);
      const missing = check.missing.filter((p) => p.left === l);
      const expected = trace.pairs.filter((p) => p.left === l);
      const wrongPartner = extra.find((p) => p.right !== null);
      if (wrongPartner !== undefined && wrongPartner.right !== null) {
        return `${rowLabel(trace, 'right', wrongPartner.right)} does not satisfy the condition for ${who}. Check the values the condition compares.`;
      }
      if (extra.some((p) => p.right === null)) {
        return trace.joinKind === 'inner'
          ? `${who} is never kept with NULLs in an inner join.`
          : `${who} has partners, so it does not get an empty row of NULLs.`;
      }
      const real = expected.filter((p) => p.right !== null).length;
      if (real === 0) {
        return trace.joinKind === 'left'
          ? `${who} has no partner. A left join still keeps it, once, with NULLs.`
          : `${who} is missing something.`;
      }
      return `${who} has ${count(real, 'matching row')} on the other side; you found ${real - missing.length}. Every match is its own pair.`;
    });
}

/** One sentence about what the real result shows, built from the recorded numbers only. */
export function summarize(trace: JoinTrace): string {
  const perLeft = trace.left.rows.map((_, i) => trace.pairs.filter((p) => p.left === i));
  const total = trace.pairs.length;
  const multi = perLeft.findIndex((ps) => ps.length > 1);
  const unmatched = perLeft.filter((ps) => ps.every((p) => p.right === null)).length;
  const head = `${count(total, 'row')} came out of ${count(trace.left.rows.length, `${trace.left.name} row`)}.`;
  const parts: string[] = [];
  if (multi >= 0) {
    parts.push(
      `${rowLabel(trace, 'left', multi)} shows up ${perLeft[multi]?.length ?? 0} times, once per match.`,
    );
  }
  if (unmatched > 0) {
    parts.push(
      trace.joinKind === 'left'
        ? `${count(unmatched, 'row')} without a partner stayed, with NULLs.`
        : `${count(unmatched, 'row')} without a partner vanished.`,
    );
  }
  return [head, ...parts].join(' ');
}
