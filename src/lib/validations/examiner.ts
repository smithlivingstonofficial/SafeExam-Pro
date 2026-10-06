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
  departmentId: z.string().uuid("Invalid department identifier").optional().nullable().or(z.literal("")),
  targetDurationMinutes: z.coerce.number().int().positive().optional().nullable(),
  passingPercentage: z.coerce.number().min(0).max(100).optional().nullable(),
  enableNegativeMarking: z.boolean().default(false),
  defaultNegativePenalty: z.coerce.number().min(0).default(0.25),
  enablePartialMarking: z.boolean().default(false),
  requireSectionalCutoff: z.boolean().default(false),
  shuffleQuestions: z.boolean().default(true),
  shuffleOptions: z.boolean().default(true),
  allowBacktracking: z.boolean().default(true),
  requireSafeBrowser: z.boolean().default(true),
  enableWebcamProctoring: z.boolean().default(true),
  calculatorType: z.enum(["none", "basic", "scientific"]).default("none"),
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

export const bulkQuestionItemSchema = z.object({
  questionText: z.string().min(5, "Question statement must be at least 5 characters"),
  type: questionTypeEnum.default("mcq_single"),
  options: z.array(
    z.object({
      id: z.string(),
      text: z.string().min(1, "Option text cannot be empty"),
      isCorrect: z.boolean(),
    })
  ).default([]),
  correctAnswerText: z.string().optional().nullable(),
  subject: z.string().default("General"),
  topic: z.string().optional().nullable(),
  difficulty: z.coerce.number().int().min(1).max(5).default(2),
  explanation: z.string().optional().nullable(),
  isCommon: z.boolean().default(true),
  departmentId: z.string().uuid("Invalid department identifier").or(z.literal("")).nullable().optional(),
});

export const bulkCreateQuestionsSchema = z.object({
  bankId: z.string().uuid("Invalid Question Bank ID"),
  questions: z.array(bulkQuestionItemSchema).min(1, "At least 1 question is required").max(1000, "Maximum 1,000 questions per batch"),
});

export type BulkQuestionItemInput = z.infer<typeof bulkQuestionItemSchema>;
export type BulkCreateQuestionsInput = z.infer<typeof bulkCreateQuestionsSchema>;

// Bulk Exam Schedule Allocations / Seating
export const bulkScheduleAllocationItemSchema = z.object({
  candidateIdentifier: z.string().min(2, "Candidate email, registration number, or ID is required"),
  seatNumber: z.string().max(50).optional().nullable().or(z.literal("")),
  roomNumber: z.string().max(50).optional().nullable().or(z.literal("")),
});

export const bulkCreateScheduleAllocationsSchema = z.object({
  scheduleId: z.string().uuid("Invalid schedule ID"),
  allocations: z.array(bulkScheduleAllocationItemSchema).min(1, "At least one allocation record is required"),
  conflictStrategy: z.enum(["skip", "overwrite"]).default("skip"),
});

export type BulkScheduleAllocationItemInput = z.infer<typeof bulkScheduleAllocationItemSchema>;
export type BulkCreateScheduleAllocationsInput = z.infer<typeof bulkCreateScheduleAllocationsSchema>;

// Unified Exam Setup Wizard Schema
export const quickPublishExamWizardSchema = z.object({
  title: z.string().min(3, "Exam title must be at least 3 characters").max(160),
  description: z.string().max(1000).optional().nullable(),
  instructions: z.string().max(5000).optional().nullable(),
  targetDurationMinutes: z.coerce.number().int().positive().default(120),
  passingPercentage: z.coerce.number().min(0).max(100).default(50),
  correctMarksPerQuestion: z.coerce.number().positive().default(2.0),
  enableNegativeMarking: z.boolean().default(false),
  defaultNegativePenalty: z.coerce.number().min(0).default(0.5),
  enablePartialMarking: z.boolean().default(false),
  requireSectionalCutoff: z.boolean().default(false),
  shuffleQuestions: z.boolean().default(true),
  shuffleOptions: z.boolean().default(true),
  allowBacktracking: z.boolean().default(true),
  requireSafeBrowser: z.boolean().default(true),
  enableWebcamProctoring: z.boolean().default(true),
  calculatorType: z.enum(["none", "basic", "scientific"]).default("none"),

  commonSection: z.object({
    title: z.string().default("Part A — Research Aptitude & Universal Common"),
    questionIds: z.array(z.string().uuid()),
  }),
  deptSections: z.array(
    z.object({
      departmentId: z.string().uuid(),
      departmentName: z.string().optional(),
      title: z.string(),
      questionIds: z.array(z.string().uuid()),
    })
  ).default([]),

  schedule: z.object({
    startAt: z.string(),
    endAt: z.string(),
    durationMinutes: z.coerce.number().int().positive().default(120),
    windowType: z.enum(["fixed", "flexible"]).default("fixed"),
    maxCandidates: z.coerce.number().int().positive().optional().nullable(),
    proctoringLevel: z.enum(["none", "basic", "standard", "full"]).default("standard"),
  }),

  candidateIds: z.array(z.string().uuid()).default([]),
  publishStatus: z.enum(["draft", "published"]).default("published"),
});

export type QuickPublishExamWizardInput = z.infer<typeof quickPublishExamWizardSchema>;

