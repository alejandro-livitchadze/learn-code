import Link from 'next/link';
import { Highlight } from '@learn-code/ui';
import { listLessonRefs, loadLesson } from '../src/lib/lessons';
import { HomeProgress } from '../src/player/HomeProgress';

export default function Home() {
  const lessons = listLessonRefs().map((ref) => ({ ref, lesson: loadLesson(ref) }));
  const courses = [...new Set(lessons.map((l) => l.ref.course))];
  return (
    <main className="home">
      <h1 className="ui-title">
        Learn <Highlight>fullstack</Highlight>
      </h1>
      <p className="lead">Short, hands-on lessons for frontend developers.</p>
      {courses.map((course) => (
        <section key={course} aria-labelledby={`c-${course}`}>
          <h2 id={`c-${course}`}>{course}</h2>
          <ul className="lesson-list">
            {lessons
              .filter((l) => l.ref.course === course)
              .map(({ ref, lesson }) => (
                <li key={ref.lesson}>
                  <Link href={`/${ref.course}/${ref.lesson}`}>{lesson.title}</Link>
                  <HomeProgress
                    lessonId={`${ref.course}/${ref.lesson}`}
                    total={lesson.steps.length}
                  />
                </li>
              ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
