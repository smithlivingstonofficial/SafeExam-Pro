import { z } from "zod";

export const questionTypeEnum = z.enum([
  "mcq_single",
  "mcq_multiple",
  "true_false",
  "fill_blank",
  "numerical",
  "descriptive",
  "coding",
]);

export const bloomLevelEnum = z.enum([
  "Remembering",
  "Understanding",
  "Applying",
  "Analyzing",
  "Evaluating",
  "Creating",
]);

export const createQuestionBankSchema = z.object({
  name: z.string().min(3, "Bank title must be at least 3 characters").max(120),
  description: z.string().max(500).optional().nullable(),
  departmentId: z.string().uuid("Invalid department identifier").optional().nullable().or(z.literal("")),
  isCommon: z.boolean().default(true),
});

export const createQuestionSchema = z.object({
  bankId: z.string().uuid("Invalid Question Bank ID"),
  type: questionTypeEnum,
  subject: z.string().min(2, "Subject is required"),
  topic: z.string().optional().nullable(),
  subTopic: z.string().optional().nullable(),
  difficulty: z.coerce.number().int().min(1).max(5).default(3),
  bloomLevel: bloomLevelEnum.optional().nullable(),
  questionText: z.string().min(5, "Question statement must be at least 5 characters"),
  latexCode: z.string().optional().nullable(),
  explanation: z.string().optional().nullable(),
  departmentId: z.string().uuid("Invalid department identifier").optional().nullable().or(z.literal("")),
  isCommon: z.boolean().default(true),
  options: z.array(
    z.object({
      id: z.string(),
      text: z.string().min(1, "Option text cannot be empty"),
      isCorrect: z.boolean(),
    })
  ).optional().default([]),
  correctAnswerText: z.string().optional().nullable(),
  codeSnippet: z.string().optional().nullable(),
  programmingLanguage: z.string().optional().nullable(),
  testCases: z.array(
    z.object({
      input: z.string(),
      output: z.string(),
      isHidden: z.boolean().default(false),
    })
  ).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
});

export const createExamSchema = z.object({
  title: z.string().min(3, "Exam title must be at least 3 characters").max(160),
  description: z.string().max(1000).optional().nullable(),
  instructions: z.string().max(5000).optional().nullable(),
  shuffleQuestions: z.boolean().default(true),
  shuffleOptions: z.boolean().default(true),
  allowBacktracking: z.boolean().default(true),
  requireSafeBrowser: z.boolean().default(true),
});

export const createExamSectionSchema = z.object({
  examId: z.string().uuid(),
  title: z.string().min(2, "Section title required").max(100),
  scope: z.enum(["common", "department_specific"]).default("common"),
  departmentId: z.string().uuid("Invalid department identifier").optional().nullable().or(z.literal("")),
  orderIndex: z.coerce.number().int().min(1).default(1),
  timeLimitMinutes: z.coerce.number().int().positive().optional().nullable(),
  correctMarks: z.coerce.number().positive().default(1.0),
  negativeMarks: z.coerce.number().min(0).default(0.0),
  partialMarks: z.boolean().default(false),
});

export const scheduleExamSchema = z.object({
  examId: z.string().uuid(),
  startAt: z.string().datetime("Valid ISO datetime required"),
  endAt: z.string().datetime("Valid ISO datetime required"),
  durationMinutes: z.coerce.number().int().positive("Duration must be positive"),
  windowType: z.enum(["fixed", "flexible"]).default("fixed"),
  maxCandidates: z.coerce.number().int().positive().optional().nullable(),
  proctoringLevel: z.enum(["none", "basic", "standard", "full"]).default("standard"),
});
