'use client';

import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { stepTagText, StepTag } from '@learn-code/ui';

/**
 * What a widget asks of the page chrome. The host (the lesson player) owns the footer, so a
 * widget that needs the one primary button of the screen ("Lock in answer") hands it to the
 * host with `useStepFooter`. Without a host (catalogue, tests) the widget shows its own button.
 */
export interface StepFooter {
  /** Handwritten hint before the primary button. */
  readonly hint?: string;
  /** Replaces "Continue" while the step is open. */
  readonly action?: {
    readonly label: string;
    readonly disabled: boolean;
    readonly onAct: () => void;
  };
}

export type FooterSetter = (footer: StepFooter | undefined) => void;

const FooterContext = createContext<FooterSetter | undefined>(undefined);
export const FooterProvider = FooterContext.Provider;

/** Returns true when a host shows the footer; the widget then renders no button of its own. */
export function useStepFooter(footer: StepFooter | undefined): boolean {
  const set = useContext(FooterContext);
  const latest = useRef(footer);
  latest.current = footer;
  const present = footer !== undefined;
  const hint = footer?.hint;
  const label = footer?.action?.label;
  const disabled = footer?.action?.disabled === true;
  useEffect(() => {
    if (set === undefined || !present) return;
    set({
      ...(hint === undefined ? {} : { hint }),
      ...(label === undefined
        ? {}
        : { action: { label, disabled, onAct: () => latest.current?.action?.onAct() } }),
    });
    return () => set(undefined);
  }, [set, present, hint, label, disabled]);
  return set !== undefined;
}

const MarginSlotContext = createContext<HTMLElement | null>(null);
/** The host's margin column. Widgets put their side panels (tables, hints) there. */
export const MarginSlotProvider = MarginSlotContext.Provider;

/** Renders side panels in the host's margin, or in place when there is no host margin. */
export function InMargin({ children }: { readonly children: ReactNode }) {
  const slot = useContext(MarginSlotContext);
  const panel = <div className="w-aside">{children}</div>;
  return slot === null ? panel : createPortal(panel, slot);
}

/** Banner on top, then the step tag (and an optional lead line beside it), then the content. */
export function WidgetFrame({
  kind,
  banner,
  lead,
  children,
}: {
  readonly kind: string;
  readonly banner?: ReactNode;
  readonly lead?: ReactNode;
  readonly children: ReactNode;
}) {
  const hasTag = stepTagText(kind) !== null;
  return (
    <div className="w-widget" data-kind={kind}>
      {banner}
      {hasTag || lead !== undefined ? (
        <div className="w-tagrow">
          <StepTag kind={kind} />
          {lead}
        </div>
      ) : null}
      {children}
    </div>
  );
}
