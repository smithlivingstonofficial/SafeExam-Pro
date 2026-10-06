import { z } from "zod";

export const saveResponseSchema = z.object({
  assignmentId: z.string().uuid("Invalid assignment identifier"),
  questionId: z.string().uuid("Invalid question identifier"),
  response: z.record(z.string(), z.any()),
  isFlagged: z.boolean().default(false),
  timeSpentSeconds: z.number().int().min(0).default(0),
});

export const submitExamSchema = z.object({
  assignmentId: z.string().uuid("Invalid assignment identifier"),
});

export const proctorIncidentSchema = z.object({
  assignmentId: z.string().uuid("Invalid assignment identifier"),
  incidentType: z.enum([
    "TAB_SWITCH",
    "WINDOW_BLUR",
    "FULLSCREEN_EXIT",
    "MULTIPLE_FACES",
    "NO_FACE_DETECTED",
    "AUDIO_SPIKE",
    "RIGHT_CLICK_ATTEMPT",
    "COPY_PASTE_ATTEMPT",
    "DEVTOOLS_OPEN",
    "DEVTOOLS_ATTEMPT",
    "SCREEN_CAPTURE_ATTEMPT",
    "CLOCK_ANOMALY_DETECTED",
  ]),
  details: z.record(z.string(), z.any()).optional().default({}),
});

export const candidateQuerySchema = z.object({
  assignmentId: z.string().uuid("Invalid assignment identifier"),
  category: z.enum([
    "technical",
    "question_clarity",
    "audio_video",
    "connectivity",
    "general",
  ]),
  questionNumber: z.number().int().positive().optional(),
  message: z.string().min(3, "Query message must be at least 3 characters").max(1000, "Query message is too long"),
});

export const respondQuerySchema = z.object({
  queryId: z.string().uuid("Invalid query identifier"),
  assignmentId: z.string().uuid("Invalid assignment identifier"),
  responseMessage: z.string().min(1, "Response message cannot be empty").max(1000, "Response is too long"),
  status: z.enum(["in_progress", "resolved"]).default("resolved"),
});

export type SaveResponseInput = z.infer<typeof saveResponseSchema>;
export type SubmitExamInput = z.infer<typeof submitExamSchema>;
export type ProctorIncidentInput = z.infer<typeof proctorIncidentSchema>;
export type CandidateQueryInput = z.infer<typeof candidateQuerySchema>;
export type RespondQueryInput = z.infer<typeof respondQuerySchema>;
