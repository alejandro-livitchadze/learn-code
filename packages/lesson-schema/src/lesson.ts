import { z } from 'zod';
import { step } from './steps';

export const lesson = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  courseId: z.string().min(1),
  locale: z.string().default('en'),
  title: z.string().min(1),
  /** Phrases of the title to draw with the highlighter. Each one is a part of `title`. */
  titleHighlights: z.array(z.string().min(1)).readonly().optional(),
  concepts: z.array(z.string()).readonly(),
  steps: z.array(step).min(8).readonly(),
});
export type Lesson = z.infer<typeof lesson>;
