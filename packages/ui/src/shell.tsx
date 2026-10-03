import type { ReactNode } from 'react';

export interface PageShellProps {
  /** The `PageHeader`. */
  readonly header: ReactNode;
  /** Content of the main column. */
  readonly children: ReactNode;
  /** Left character column, for `hook` steps only (E08 section 3). */
  readonly lead?: ReactNode;
  /** Margin items; the margin column is omitted when absent. */
  readonly margin?: ReactNode;
  /** The `PageFooter`. */
  readonly footer?: ReactNode;
}

/** Notebook page: header, main column with optional margin, footer (E08 section 3). */
export function PageShell({ header, children, lead, margin, footer }: PageShellProps) {
  return (
    <div className="ui-page">
      {header}
      <div className="ui-body">
        {lead === undefined ? null : (
          <aside className="ui-lead" aria-label="Character">
            {lead}
          </aside>
        )}
        <main className="ui-main">{children}</main>
        {margin === undefined ? null : (
          <aside className="ui-margin" aria-label="Margin notes">
            {margin}
          </aside>
        )}
      </div>
      {footer}
    </div>
  );
}

export interface PageHeaderProps {
  /** Module label, rendered as an uppercase link when `moduleHref` is given. */
  readonly module: ReactNode;
  readonly moduleHref?: string;
  /** Lesson title; may contain one `Highlight`. */
  readonly title: ReactNode;
  /** Handwritten step counter, for example `step 2 of 9`. */
  readonly counter?: ReactNode;
  /** Replaces the link element, for example with `next/link`. */
  readonly renderLink?: (props: {
    href: string;
    className: string;
    children: ReactNode;
  }) => ReactNode;
}

export function PageHeader({ module, moduleHref, title, counter, renderLink }: PageHeaderProps) {
  const linkProps = { className: 'ui-module', children: module };
  let label: ReactNode;
  if (moduleHref === undefined) label = <span className="ui-module">{module}</span>;
  else if (renderLink) label = renderLink({ href: moduleHref, ...linkProps });
  else label = <a href={moduleHref} {...linkProps} />;
  return (
    <header className="ui-header">
      <div>
        {label}
        <h1 className="ui-title">{title}</h1>
      </div>
      {counter === undefined ? null : <div className="ui-counter">{counter}</div>}
    </header>
  );
}

export interface PageFooterProps {
  /** Secondary action, left. */
  readonly back?: ReactNode;
  /** Optional handwritten hint before the primary button. */
  readonly hint?: ReactNode;
  /** The one primary button, right. */
  readonly primary?: ReactNode;
  /** Id of the hint element, for `aria-describedby` on the primary button. */
  readonly hintId?: string;
}

export function PageFooter({ back, hint, primary, hintId }: PageFooterProps) {
  return (
    <footer className="ui-footer">
      {back}
      <span className="ui-footer-hint" id={hintId}>
        {hint}
      </span>
      {primary}
    </footer>
  );
}
