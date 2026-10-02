import { describe, expect, it } from 'vitest';
import { LocalStorageProgressStore } from './progress';
import type { PlayerState } from './types';

class MemoryStorage implements Storage {
  private readonly map = new Map<string, string>();
  get length(): number {
    return this.map.size;
  }
  clear(): void {
    this.map.clear();
  }
  getItem(k: string): string | null {
    return this.map.get(k) ?? null;
  }
  key(i: number): string | null {
    return [...this.map.keys()][i] ?? null;
  }
  removeItem(k: string): void {
    this.map.delete(k);
  }
  setItem(k: string, v: string): void {
    this.map.set(k, v);
  }
}

const state: PlayerState = {
  lessonId: 'fs/a',
  index: 1,
  results: { s1: { status: 'answered', correct: false, attempts: 2, payload: { pick: 1 } } },
};

describe('LocalStorageProgressStore', () => {
  it('round-trips state', async () => {
    const store = new LocalStorageProgressStore(() => new MemoryStorage());
    const mem = new MemoryStorage();
    const s = new LocalStorageProgressStore(() => mem);
    await s.save(state);
    expect(await s.load('fs/a')).toEqual(state);
    expect(await store.load('fs/a')).toBeNull();
  });
  it('discards corrupted data and removes it', async () => {
    const mem = new MemoryStorage();
    const s = new LocalStorageProgressStore(() => mem);
    mem.setItem('learn-code:v1:progress:fs/a', '{not json');
    expect(await s.load('fs/a')).toBeNull();
    expect(mem.length).toBe(0);
    mem.setItem('learn-code:v1:progress:fs/a', JSON.stringify({ state: { index: 'x' } }));
    expect(await s.load('fs/a')).toBeNull();
    expect(mem.length).toBe(0);
  });
  it('lists completed lessons of one course', async () => {
    const mem = new MemoryStorage();
    const s = new LocalStorageProgressStore(() => mem);
    await s.save(state, { completed: true });
    await s.save({ ...state, lessonId: 'fs/b' });
    await s.save({ ...state, lessonId: 'other/c' }, { completed: true });
    expect(await s.listCompleted('fs')).toEqual(['fs/a']);
  });
  it('keeps the completed flag when saving without meta', async () => {
    const mem = new MemoryStorage();
    const s = new LocalStorageProgressStore(() => mem);
    await s.save(state, { completed: true });
    await s.save(state);
    expect(await s.listCompleted('fs')).toEqual(['fs/a']);
  });
  it('never throws when storage is missing or broken', async () => {
    const none = new LocalStorageProgressStore(() => undefined);
    await none.save(state);
    expect(await none.load('fs/a')).toBeNull();
    expect(await none.listCompleted('fs')).toEqual([]);
    const broken = new LocalStorageProgressStore(() => {
      throw new Error('blocked');
    });
    await broken.save(state);
    expect(await broken.load('fs/a')).toBeNull();
    expect(await broken.listCompleted('fs')).toEqual([]);
  });
  it('uses no storage outside the browser by default', async () => {
    expect(await new LocalStorageProgressStore().load('fs/a')).toBeNull();
  });
  it('survives removeItem failing on corrupt data', async () => {
    const mem = new MemoryStorage();
    mem.setItem('learn-code:v1:progress:fs/a', 'bad');
    mem.removeItem = () => {
      throw new Error('nope');
    };
    expect(await new LocalStorageProgressStore(() => mem).load('fs/a')).toBeNull();
  });
});
