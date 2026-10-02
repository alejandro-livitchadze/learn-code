import { z } from 'zod';

export const VacancySchema = z.object({
  id: z.string().regex(/^\d+$/),
  url: z.string().url(),
  title: z.string().min(1),
  description: z.string().min(50),
  publishedAt: z.string().datetime({ offset: true }),
  fetchedAt: z.string().datetime({ offset: true }),
  query: z.string().min(1),
});
export type Vacancy = Readonly<z.infer<typeof VacancySchema>>;

export const SENIORITIES = ['junior', 'middle', 'senior', 'lead', 'unknown'] as const;

export const ExtractedSkillsSchema = z.object({
  vacancyId: z.string().regex(/^\d+$/),
  required: z.array(z.string().min(1)),
  niceToHave: z.array(z.string().min(1)),
  seniority: z.enum(SENIORITIES),
});
export type ExtractedSkills = Readonly<z.infer<typeof ExtractedSkillsSchema>>;

/** One feed item as stored in raw/<id>.json, before parsing. */
export const RawItemSchema = z.object({
  id: z.string(),
  query: z.string(),
  fetchedAt: z.string(),
  title: z.unknown(),
  link: z.unknown(),
  description: z.unknown(),
  pubDate: z.unknown(),
});
export type RawItem = Readonly<z.infer<typeof RawItemSchema>>;
