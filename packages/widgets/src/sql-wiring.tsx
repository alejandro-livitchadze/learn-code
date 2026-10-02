'use client';

import { createContext, useContext, useMemo, type ComponentType } from 'react';
import type { SqlEngine } from '@learn-code/sql-engine';
import { createSqlLab, type SqlLabDeps } from './sql-lab';
import type { StepComponentProps, StepOfKind } from './types';

/**
 * Where the host serves the seed files of the current lesson: `<base>/<seedRef>.sql`.
 * The player and the catalogue provide it; without it a sqlLab step shows a clear error.
 */
const SeedBaseContext = createContext<string | undefined>(undefined);
export const SeedBaseProvider = SeedBaseContext.Provider;

let engine: Promise<SqlEngine> | undefined;

/**
 * The adapter is imported here and nowhere else, on the first sqlLab step. Until then no page
 * downloads PGlite or the worker. A failed import is not cached, so the learner can retry.
 */
export function getLazyEngine(): Promise<SqlEngine> {
  if (engine === undefined) {
    const loading = import('@learn-code/sql-engine').then((m) => m.createWorkerEngine());
    engine = loading;
    loading.catch(() => {
      if (engine === loading) engine = undefined;
    });
  }
  return engine;
}

/** Fetch `<base>/<seedRef>.sql`. */
export async function fetchSeed(base: string | undefined, seedRef: string): Promise<string> {
  if (base === undefined) throw new Error('This page does not provide seed files for sqlLab.');
  const response = await fetch(`${base}/${encodeURIComponent(seedRef)}.sql`);
  if (!response.ok) throw new Error(`Could not load the seed "${seedRef}" (${response.status}).`);
  return response.text();
}

type SqlLabStepProps = StepComponentProps<StepOfKind<'sqlLab'>>;

/** The registry entry for `sqlLab`: `createSqlLab` bound to the lazy engine and the seed base. */
export function SqlLabWidget(props: SqlLabStepProps) {
  const base = useContext(SeedBaseContext);
  const Lab: ComponentType<SqlLabStepProps> = useMemo(() => {
    const deps: SqlLabDeps = {
      getEngine: getLazyEngine,
      loadSeed: (seedRef) => fetchSeed(base, seedRef),
    };
    return createSqlLab(deps);
  }, [base]);
  return <Lab {...props} />;
}
