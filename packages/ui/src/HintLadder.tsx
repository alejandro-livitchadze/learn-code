'use client';

import { useState } from 'react';

/**
 * Three stacked hints. The next hint is a secondary button, shown hints print their text,
 * later hints stay locked (dashed). `onUse` fires with the 0-based index when a hint opens.
 */
export function HintLadder({
  hints,
  onUse,
}: {
  readonly hints: readonly string[];
  readonly onUse?: (index: number) => void;
}) {
  const [shown, setShown] = useState(0);
  return (
    <ol className="ui-hints" aria-label="Hints">
      {hints.slice(0, 3).map((hint, i) => {
        if (i < shown) {
          return (
            <li key={i} className="ui-hint ui-hint-open">
              <span className="ui-hint-n">Hint {i + 1}</span> {hint}
            </li>
          );
        }
        const available = i === shown;
        return (
          <li key={i}>
            <button
              type="button"
              className={available ? 'ui-btn ui-btn-secondary' : 'ui-hint-locked'}
              disabled={!available}
              onClick={() => {
                setShown(i + 1);
                onUse?.(i);
              }}
            >
              {available ? `Show hint ${i + 1}` : `Hint ${i + 1} (locked)`}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
