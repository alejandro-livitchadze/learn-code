import { z } from 'zod';
import type { PlayerState, ProgressStore } from './types';

const stepResult = z.discriminatedUnion('status', [
  z.object({ status: z.literal('viewed') }),
  z.object({
    status: z.literal('answered'),
    correct: z.boolean(),
    attempts: z.number().int().nonnegative(),
    payload: z.unknown(),
  }),
]);

const playerState = z.object({
  lessonId: z.string().min(1),
  index: z.number().int().nonnegative(),
  results: z.record(z.string(), stepResult),
});

const record = z.object({ state: playerState, completed: z.boolean() });

const PREFIX = 'learn-code:v1:progress:';

/** Lesson ids are qualified as `<course>/<lesson>`, so the course can be read from the key. */
export class LocalStorageProgressStore implements ProgressStore {
  constructor(private readonly storage: () => Storage | undefined = defaultStorage) {}

  async load(lessonId: string): Promise<PlayerState | null> {
    return this.read(PREFIX + lessonId)?.state ?? null;
  }

  async save(state: PlayerState, meta?: { readonly completed: boolean }): Promise<void> {
    try {
      const completed = meta?.completed ?? this.read(PREFIX + state.lessonId)?.completed ?? false;
      this.storage()?.setItem(PREFIX + state.lessonId, JSON.stringify({ state, completed }));
    } catch {
      // Storage may be full, blocked or unavailable. Progress is best effort.
    }
  }

  async listCompleted(courseId: string): Promise<readonly string[]> {
    try {
      const storage = this.storage();
      if (!storage) return [];
      const prefix = `${PREFIX}${courseId}/`;
      const done: string[] = [];
      for (let i = 0; i < storage.length; i += 1) {
        const key = storage.key(i);
        if (key?.startsWith(prefix) && this.read(key)?.completed === true) {
          done.push(key.slice(PREFIX.length));
        }
      }
      return done;
    } catch {
      return [];
    }
  }

  private read(key: string): z.infer<typeof record> | null {
    const storage = (() => {
      try {
        return this.storage();
      } catch {
        return undefined;
      }
    })();
    if (!storage) return null;
    try {
      const raw = storage.getItem(key);
      if (raw === null) return null;
      const parsed = record.safeParse(JSON.parse(raw));
      if (parsed.success) return parsed.data;
      storage.removeItem(key);
      return null;
    } catch {
      try {
        storage.removeItem(key);
      } catch {
        // ignore
      }
      return null;
    }
  }
}

function defaultStorage(): Storage | undefined {
  return typeof window === 'undefined' ? undefined : window.localStorage;
}
