import { listSeeds, readSeed } from '../../../../../src/lib/seeds';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return listSeeds().map((s) => ({ course: s.course, lesson: s.lesson, file: s.file }));
}

type Params = Promise<{ course: string; lesson: string; file: string }>;

/** Seed SQL for sqlLab steps, served as static files: `/seeds/<course>/<lesson>/<seedRef>.sql`. */
export async function GET(_request: Request, { params }: { params: Params }) {
  const text = readSeed(await params);
  if (text === undefined) return new Response('Not found', { status: 404 });
  return new Response(text, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
