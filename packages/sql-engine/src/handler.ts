import type { WorkerRequest, WorkerResponse } from './protocol';
import { SqlRunner, type DatabaseLike } from './runner';

export type DatabaseFactory = () => Promise<DatabaseLike>;

/**
 * The message handler that lives inside the worker. It is a plain function over `post`, so tests
 * can run it in-process. Requests are handled one at a time, in order.
 */
export function createWorkerHandler(
  createDatabase: DatabaseFactory,
  post: (response: WorkerResponse) => void,
): (request: WorkerRequest) => Promise<void> {
  let runner: SqlRunner | undefined;
  let chain: Promise<void> = Promise.resolve();

  const handle = async (request: WorkerRequest): Promise<void> => {
    try {
      switch (request.type) {
        case 'init': {
          runner = new SqlRunner(await createDatabase(), request.seedSql, request.maxRows);
          await runner.seed();
          post({ id: request.id, type: 'done' });
          return;
        }
        case 'exec': {
          if (runner === undefined) throw new Error('session is not open');
          post({ id: request.id, type: 'outcome', outcome: await runner.execute(request.sql) });
          return;
        }
        case 'reset': {
          if (runner === undefined) throw new Error('session is not open');
          await runner.reset();
          post({ id: request.id, type: 'done' });
          return;
        }
        case 'close': {
          await runner?.close();
          runner = undefined;
          post({ id: request.id, type: 'done' });
          return;
        }
        default: {
          const unreachable: never = request;
          return unreachable;
        }
      }
    } catch (error) {
      post({
        id: request.id,
        type: 'failed',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return (request) => {
    chain = chain.then(() => handle(request));
    return chain;
  };
}
