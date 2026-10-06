import { isDeepStrictEqual } from 'node:util';

/** Deep equality of plain data: key order does not matter, array order does. */
export const deepEqual = (a: unknown, b: unknown): boolean => isDeepStrictEqual(a, b);
