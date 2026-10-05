import Link from 'next/link';
import { Highlight } from '@learn-code/ui';
import { listLessonRefs, loadLesson } from '../src/lib/lessons';
import { HomeProgress } from '../src/player/HomeProgress';

/** Learner-facing titles of the courses; an unknown id falls back to a capitalised id. */
const COURSE_TITLES: Readonly<Record<string, string>> = {
  fullstack: 'Databases for frontend developers',
};

function courseTitle(course: string): string {
  return Object.hasOwn(COURSE_TITLES, course)
    ? (COURSE_TITLES[course] ?? course)
    : course.charAt(0).toUpperCase() + course.slice(1);
}

export default function Home() {
  const lessons = listLessonRefs().map((ref) => ({ ref, lesson: loadLesson(ref) }));
  const courses = [...new Set(lessons.map((l) => l.ref.course))];
  return (
    <main className="home">
      <h1 className="ui-title">
        Learn <Highlight>SQL</Highlight> by doing
      </h1>
      <p className="lead">Short, hands-on lessons for frontend developers.</p>
      {courses.map((course) => (
        <section key={course} aria-labelledby={`c-${course}`}>
          <h2 id={`c-${course}`}>{courseTitle(course)}</h2>
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
