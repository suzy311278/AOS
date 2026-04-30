import { z } from 'zod';

const MultipleChoiceSchema = z.object({
  type: z.literal('multiple-choice').optional(),
  question: z.string().min(1),
  options: z.array(z.string()).min(2).max(6),
  answer: z.number().int().min(0),
  explanation: z.string().optional(),
}).refine(q => q.answer < q.options.length, { message: 'answer out of range' });

const TrueFalseSchema = z.object({
  type: z.literal('true-false'),
  question: z.string().min(1),
  answer: z.boolean(),
  explanation: z.string().optional(),
});

const MultiSelectSchema = z.object({
  type: z.literal('multi-select'),
  question: z.string().min(1),
  options: z.array(z.string()).min(2).max(8),
  answers: z.array(z.number().int().min(0)).min(1),
  explanation: z.string().optional(),
}).refine(q => q.answers.every(a => a < q.options.length), { message: 'answer index out of range' });

const MatchingSchema = z.object({
  type: z.literal('matching'),
  question: z.string().min(1),
  pairs: z.array(z.object({ left: z.string(), right: z.string() })).min(2).max(8),
  explanation: z.string().optional(),
});

export const QuizQuestionSchema = z.union([
  MultipleChoiceSchema,
  TrueFalseSchema,
  MultiSelectSchema,
  MatchingSchema,
]);

export const LessonMetaSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  duration: z.string().optional(),
  vmRef: z.string().optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(170).optional(),
});

export const ModuleSchema = z.object({
  id: z.number().int().min(0),
  title: z.string().min(1),
  subtitle: z.string(),
  icon: z.string(),
  color: z.string(),
  lessons: z.array(LessonMetaSchema).min(1),
});

export const CourseSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  subtitle: z.string(),
  description: z.string(),
  icon: z.string(),
  color: z.string(),
  status: z.enum(['published', 'draft', 'coming-soon']),
  category: z.enum(['methodologies', 'markets', 'esg', 'fundamentals', 'green-finance', 'sustainability-standards']),
  estimatedHours: z.number().positive(),
  modules: z.array(ModuleSchema).min(1),
});

export const GlossaryTermSchema = z.object({
  term: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  definition: z.string().min(1),
  category: z.string().min(1),
  related: z.array(z.string()).default([]),
});

export type CourseInput = z.infer<typeof CourseSchema>;
export type ModuleInput = z.infer<typeof ModuleSchema>;
export type LessonMetaInput = z.infer<typeof LessonMetaSchema>;
export type QuizQuestionInput = z.infer<typeof QuizQuestionSchema>;
