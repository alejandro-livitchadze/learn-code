import type { SqlOutcome } from './types';

export type WorkerRequest =
  | {
      readonly id: number;
      readonly type: 'init';
      readonly seedSql: string;
      readonly maxRows: number;
    }
  | { readonly id: number; readonly type: 'exec'; readonly sql: string }
  | { readonly id: number; readonly type: 'reset' }
  | { readonly id: number; readonly type: 'close' };

export type WorkerResponse =
  | { readonly id: number; readonly type: 'done' }
  | { readonly id: number; readonly type: 'outcome'; readonly outcome: SqlOutcome }
  | { readonly id: number; readonly type: 'failed'; readonly message: string };

/** The slice of the DOM `Worker` the client uses; tests supply an in-process stand-in. */
export interface WorkerLike {
  postMessage(message: WorkerRequest): void;
  terminate(): void;
  onmessage: ((event: { readonly data: WorkerResponse }) => void) | null;
  onerror: ((event: { readonly message?: string }) => void) | null;
}
