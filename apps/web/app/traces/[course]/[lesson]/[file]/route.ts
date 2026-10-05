import { listTraces, readTrace } from '../../../../../src/lib/traces';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return listTraces().map((t) => ({ course: t.course, lesson: t.lesson, file: t.file }));
}

type Params = Promise<{ course: string; lesson: string; file: string }>;

/** Recorded join traces for beTheDatabase steps: `/traces/<course>/<lesson>/<traceRef>.trace.json`. */
export async function GET(_request: Request, { params }: { params: Params }) {
  const text = readTrace(await params);
  if (text === undefined) return new Response('Not found', { status: 404 });
  return new Response(text, { headers: { 'content-type': 'application/json; charset=utf-8' } });
}
