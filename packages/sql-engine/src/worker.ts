import { createWorkerHandler } from './handler';
import type { WorkerRequest, WorkerResponse } from './protocol';
import { createPglite } from './pglite';

interface WorkerScope {
  postMessage(message: WorkerResponse): void;
  onmessage: ((event: { readonly data: WorkerRequest }) => void) | null;
}

function isWorkerScope(value: unknown): value is WorkerScope {
  return typeof value === 'object' && value !== null && 'postMessage' in value;
}

/** Entry point of the Web Worker. PGlite is loaded here, so the page never downloads it. */
const scope: unknown = globalThis;
if (isWorkerScope(scope)) {
  const handle = createWorkerHandler(createPglite, (response) => scope.postMessage(response));
  scope.onmessage = (event) => {
    void handle(event.data);
  };
}
