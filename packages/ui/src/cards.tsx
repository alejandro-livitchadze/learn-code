import { useState, type ReactNode } from 'react';
import { InkCard } from './InkCard';

/** Result banner at the top of the main column, after an answer. */
export function FeedbackBanner({
  correct,
  title,
  children,
  aside,
}: {
  readonly correct: boolean;
  /** One bold sentence. */
  readonly title: ReactNode;
  /** One explanation sentence. */
  readonly children?: ReactNode;
  /** Optional handwritten remark. */
  readonly aside?: ReactNode;
}) {
  return (
    <div className="ui-feedback" data-correct={correct} role="status">
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
        <path d={correct ? 'M6 18 L14 26 L29 8' : 'M8 8 L26 26 M26 8 L8 26'} />
      </svg>
      <p>
        <strong>{title}</strong> {children}
      </p>
      {aside === undefined ? null : <span className="ui-feedback-aside">{aside}</span>}
    </div>
  );
}

/** A question to revisit later, with its due time in handwriting ("in 3 days"). */
export function ReviewCard({
  question,
  due,
}: {
  readonly question: ReactNode;
  readonly due: string;
}) {
  return (
    <InkCard state="lifted">
      <div className="ui-review">
        <span className="ui-review-q">{question}</span>
        <span className="ui-review-due">{due}</span>
      </div>
    </InkCard>
  );
}

/** Dark teaser card for the next lesson, slightly rotated. */
export function Cliffhanger({ children }: { readonly children: ReactNode }) {
  return (
    <div className="ui-cliff">
      <div className="ui-cliff-title">Next time…</div>
      <p>{children}</p>
    </div>
  );
}

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
