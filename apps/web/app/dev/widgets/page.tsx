import type { Metadata } from 'next';
import type { Lesson } from '@learn-code/lesson-schema';
import { fixtures } from '../../../../../packages/widgets/src/fixtures';
import { highlightLesson } from '../../../src/lib/highlight';
import { Catalogue } from './Catalogue';

export const metadata: Metadata = { title: 'Widget catalogue' };

/** Review surface for the widgets (E03). Open it at /dev/widgets. */
export default async function WidgetCataloguePage() {
  const lesson: Lesson = {
    schemaVersion: 1,
    id: 'catalogue',
    courseId: 'dev',
    locale: 'en',
    title: 'Widget catalogue',
    concepts: [],
    steps: fixtures.map((f) => f.step),
  };
  const highlights = await highlightLesson(lesson);
  return <Catalogue highlights={highlights} />;
}
