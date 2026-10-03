import type { ReactNode } from 'react';
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
