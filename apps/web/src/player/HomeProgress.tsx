'use client';

import { useEffect, useState } from 'react';
import { LocalStorageProgressStore } from './progress';

const store = new LocalStorageProgressStore();

/** Client-only progress label for one lesson on the home page. */
export function HomeProgress({
  lessonId,
  total,
}: {
  readonly lessonId: string;
  readonly total: number;
}) {
  const [label, setLabel] = useState('Not started');
  useEffect(() => {
    void store.load(lessonId).then((s) => {
      if (!s) return;
      const done = Object.keys(s.results).length;
      setLabel(done >= total ? 'Completed' : `${done} of ${total} steps`);
    });
  }, [lessonId, total]);
  return <span className="progress-label">{label}</span>;
}
