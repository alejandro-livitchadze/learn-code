'use client';

import { createContext, useContext, useMemo, type ComponentType } from 'react';
import type { StepComponentProps, StepOfKind } from '../types';
import { createBeTheDatabase, type BeTheDatabaseDeps } from './BeTheDatabase';

/**
 * Where the host serves the recorded traces of the current lesson: `<base>/<traceRef>.trace.json`
 * (the files under `content/<course>/<lesson>/traces/`). Without it the widget shows a clear error.
 */
const TraceBaseContext = createContext<string | undefined>(undefined);
export const TraceBaseProvider = TraceBaseContext.Provider;

/** Fetch `<base>/<traceRef>.trace.json` as JSON. */
export async function fetchTrace(base: string | undefined, traceRef: string): Promise<unknown> {
  if (base === undefined) throw new Error('This page does not provide recorded traces.');
  const response = await fetch(`${base}/${encodeURIComponent(traceRef)}.trace.json`);
  if (!response.ok) throw new Error(`Could not load the trace "${traceRef}" (${response.status}).`);
  return response.json();
}

type StepProps = StepComponentProps<StepOfKind<'beTheDatabase'>>;

/** The registry entry for `beTheDatabase`: `createBeTheDatabase` bound to the trace base. */
export function BeTheDatabaseWidget(props: StepProps) {
  const base = useContext(TraceBaseContext);
  const Widget: ComponentType<StepProps> = useMemo(() => {
    const deps: BeTheDatabaseDeps = { loadTrace: (ref) => fetchTrace(base, ref) };
    return createBeTheDatabase(deps);
  }, [base]);
  return <Widget {...props} />;
}
