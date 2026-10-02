import type { WorkerLike, WorkerRequest, WorkerResponse } from './protocol';
import { DEFAULT_MAX_ROWS } from './inline';
import {
  SQLSTATE_INTERNAL,
  SQLSTATE_TIMEOUT,
  type SqlEngine,
  type SqlOutcome,
  type SqlSession,
} from './types';

export const DEFAULT_TIMEOUT_MS = 5000;

export interface WorkerEngineOptions {
  readonly timeoutMs?: number;
  readonly maxRows?: number;
  /**
   * Creates the worker. The default starts `worker.ts` as a module worker; bundlers pick it up
   * from the `new URL(..., import.meta.url)` pattern.
   */
  readonly createWorker?: () => WorkerLike;
}

type Pending = {
  readonly resolve: (response: WorkerResponse) => void;
  readonly reject: (error: Error) => void;
};

function defaultWorker(): WorkerLike {
  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  const like: WorkerLike = {
    onmessage: null,
    onerror: null,
    postMessage: (message) => worker.postMessage(message),
    terminate: () => worker.terminate(),
  };
  worker.onmessage = (event: MessageEvent<WorkerResponse>) =>
    like.onmessage?.({ data: event.data });
  worker.onerror = (event) => like.onerror?.({ message: event.message });
  return like;
}

/** One live worker. Requests are answered by id; `terminate` rejects everything in flight. */
class WorkerChannel {
  private nextId = 1;
  private readonly pending = new Map<number, Pending>();
  private dead = false;

  constructor(private readonly worker: WorkerLike) {
    worker.onmessage = (event) => {
      const entry = this.pending.get(event.data.id);
      if (entry === undefined) return;
      this.pending.delete(event.data.id);
      entry.resolve(event.data);
    };
    worker.onerror = (event) => this.fail(new Error(event.message ?? 'The SQL worker crashed'));
  }

  request(build: (id: number) => WorkerRequest, timeoutMs?: number): Promise<WorkerResponse> {
    if (this.dead) return Promise.reject(new Error('The SQL worker was terminated'));
    const id = this.nextId++;
    return new Promise<WorkerResponse>((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const settle =
        <T>(fn: (v: T) => void) =>
        (v: T) => {
          if (timer !== undefined) clearTimeout(timer);
          fn(v);
        };
      this.pending.set(id, { resolve: settle(resolve), reject: settle(reject) });
      if (timeoutMs !== undefined) {
        timer = setTimeout(() => this.fail(new TimeoutError(timeoutMs)), timeoutMs);
      }
      this.worker.postMessage(build(id));
    });
  }

  get alive(): boolean {
    return !this.dead;
  }

  terminate(): void {
    this.fail(new Error('The SQL worker was terminated'));
  }

  private fail(error: Error): void {
    this.dead = true;
    this.worker.terminate();
    const entries = [...this.pending.values()];
    this.pending.clear();
    for (const e of entries) e.reject(error);
  }
}

class TimeoutError extends Error {
  constructor(readonly timeoutMs: number) {
    super(`Query timed out after ${timeoutMs} ms`);
  }
}

/**
 * PGlite in a Web Worker. A query that runs past `timeoutMs` terminates the worker; the next call
 * starts a fresh worker and re-seeds, so one runaway query never ends the lesson.
 */
export function createWorkerEngine(options: WorkerEngineOptions = {}): SqlEngine {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRows = options.maxRows ?? DEFAULT_MAX_ROWS;
  const createWorker = options.createWorker ?? defaultWorker;

  return {
    id: 'pglite-worker',
    async open(seedSql: string): Promise<SqlSession> {
      let channel: WorkerChannel | undefined;
      let closed = false;
      let queue: Promise<unknown> = Promise.resolve();
      const serial = <T>(job: () => Promise<T>): Promise<T> => {
        const next = queue.then(job);
        queue = next.catch(() => undefined);
        return next;
      };

      const expectDone = (response: WorkerResponse): void => {
        if (response.type === 'failed') throw new Error(response.message);
        if (response.type !== 'done') throw new Error('Unexpected reply from the SQL worker');
      };

      /** Start a worker and seed it. Seeding has no time limit of its own beyond the timeout. */
      const start = async (): Promise<WorkerChannel> => {
        const fresh = new WorkerChannel(createWorker());
        try {
          expectDone(
            await fresh.request(
              (id) => ({ id, type: 'init', seedSql, maxRows }),
              Math.max(timeoutMs, 30_000),
            ),
          );
        } catch (error) {
          fresh.terminate();
          throw error;
        }
        return fresh;
      };

      const current = async (): Promise<WorkerChannel> => {
        if (closed) throw new Error('The session is closed');
        if (channel === undefined || !channel.alive) channel = await start();
        return channel;
      };

      channel = await start();

      return {
        execute: (sql) =>
          serial(async (): Promise<SqlOutcome> => {
            try {
              const response = await (
                await current()
              ).request((id) => ({ id, type: 'exec', sql }), timeoutMs);
              if (response.type === 'outcome') return response.outcome;
              if (response.type === 'failed') {
                return { ok: false, sqlState: SQLSTATE_INTERNAL, message: response.message };
              }
              return {
                ok: false,
                sqlState: SQLSTATE_INTERNAL,
                message: 'Unexpected reply from the SQL worker',
              };
            } catch (error) {
              if (error instanceof TimeoutError) {
                return {
                  ok: false,
                  sqlState: SQLSTATE_TIMEOUT,
                  message: `${error.message}. The database was restarted from the seed.`,
                };
              }
              return {
                ok: false,
                sqlState: SQLSTATE_INTERNAL,
                message: error instanceof Error ? error.message : String(error),
              };
            }
          }),
        reset: () =>
          serial(async () => {
            const c = await current();
            expectDone(
              await c.request((id) => ({ id, type: 'reset' }), Math.max(timeoutMs, 30_000)),
            );
          }),
        close: () =>
          serial(async () => {
            if (closed) return;
            closed = true;
            const c = channel;
            channel = undefined;
            if (c === undefined || !c.alive) return;
            try {
              await c.request((id) => ({ id, type: 'close' }), 5000);
            } catch {
              // The worker is terminated below either way.
            }
            c.terminate();
          }),
      };
    },
  };
}
