import { notFound } from 'next/navigation';
import { highlightLesson } from '../../../src/lib/highlight';
import { listLessonRefs, loadLesson } from '../../../src/lib/lessons';
import { LessonPlayer } from '../../../src/player/LessonPlayer';

export const dynamicParams = false;

export function generateStaticParams() {
  return listLessonRefs().map((r) => ({ course: r.course, lesson: r.lesson }));
}

type Params = Promise<{ course: string; lesson: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { course, lesson } = await params;
  return { title: `${loadLesson({ course, lesson }).title} | Learn fullstack` };
}

export default async function LessonPage({ params }: { params: Params }) {
  const { course, lesson } = await params;
  if (!listLessonRefs().some((r) => r.course === course && r.lesson === lesson)) notFound();
  const loaded = loadLesson({ course, lesson });
  const highlights = await highlightLesson(loaded);
  return <LessonPlayer lesson={loaded} highlights={highlights} />;
}
