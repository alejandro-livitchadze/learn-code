import { notFound } from 'next/navigation';
import { highlightLesson } from '../../../src/lib/highlight';
import { listLessonRefs, loadConceptNames, loadLesson } from '../../../src/lib/lessons';
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
  const cliffhanger = loaded.steps.find((s) => s.kind === 'cliffhanger');
  const nextId = cliffhanger?.kind === 'cliffhanger' ? cliffhanger.nextLessonId : undefined;
  const nextRef =
    nextId === undefined
      ? undefined
      : listLessonRefs().find((r) => r.course === course && r.lesson === nextId);
  return (
    <LessonPlayer
      lesson={loaded}
      highlights={highlights}
      conceptNames={loadConceptNames(course)}
      {...(nextRef === undefined
        ? {}
        : {
            next: {
              href: `/${nextRef.course}/${nextRef.lesson}`,
              title: loadLesson(nextRef).title,
            },
          })}
    />
  );
}
