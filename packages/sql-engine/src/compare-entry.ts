/**
 * Pure entry point: the result comparer without the engines (and so without PGlite). Browser code
 * imports this instead of the package root.
 */
export { compareResults } from './compare';
export type { ResultDiff } from './compare';
