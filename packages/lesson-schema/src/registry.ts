import { z } from 'zod';

const kebabId = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'expected a kebab-case id');

export const conceptEntry = z.object({
  id: kebabId,
  name: z.string().min(1),
  description: z.string().min(1),
  prerequisites: z.array(kebabId).readonly().default([]),
});
export type ConceptEntry = z.infer<typeof conceptEntry>;
export const conceptsFile = z.array(conceptEntry).readonly();

export const misconceptionEntry = z.object({
  id: kebabId,
  belief: z.string().min(1),
  correction: z.string().min(1),
  concepts: z.array(kebabId).readonly(),
});
export type MisconceptionEntry = z.infer<typeof misconceptionEntry>;
export const misconceptionsFile = z.array(misconceptionEntry).readonly();

export const roadmapLesson = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  concepts: z.array(kebabId).readonly(),
  dependsOn: z.array(z.string()).readonly().default([]),
});
export const roadmapModule = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  lessons: z.array(roadmapLesson).readonly(),
});
export const roadmap = z.object({
  courseId: z.string().min(1),
  modules: z.array(roadmapModule).readonly(),
});
export type Roadmap = z.infer<typeof roadmap>;

export const lessonState = z.enum([
  'planned',
  'drafted',
  'interactive',
  'verified',
  'edited',
  'awaiting_review',
  'approved',
  'published',
  'distributed',
  'needs_fix',
  'escalated',
]);
export type LessonState = z.infer<typeof lessonState>;

export const assumption = z.object({
  by: z.string().min(1),
  question: z.string().min(1),
  chosenDefault: z.string().min(1),
});
export const defect = z.object({
  stepId: z.string().min(1),
  kind: z.enum(['wrong_output', 'false_claim', 'broken_test', 'lint', 'style']),
  detail: z.string().min(1),
  source: z.string().optional(),
});
export const lessonStatus = z.object({
  lessonId: z.string().min(1),
  state: lessonState,
  updatedBy: z.string().min(1),
  updatedAt: z.iso.date(),
  retryCount: z.number().int().nonnegative(),
  defects: z.array(defect).readonly(),
  assumptions: z.array(assumption).readonly(),
});
export type LessonStatus = z.infer<typeof lessonStatus>;
