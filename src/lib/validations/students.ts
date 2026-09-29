import { z } from "zod";

export const assignCandidatesSchema = z.object({
  candidateIds: z.array(z.string().uuid("Invalid candidate identifier")).min(1, "Select at least one candidate"),
  scheduleId: z.string().uuid("Invalid examination schedule identifier"),
});

export const enrollDepartmentSchema = z.object({
  departmentName: z.string().min(2, "Department name must be at least 2 characters long"),
  scheduleId: z.string().uuid("Invalid examination schedule identifier"),
});

export const reassignDepartmentSchema = z.object({
  candidateId: z.string().uuid("Invalid candidate identifier"),
  department: z.string().min(2, "Department name must be at least 2 characters long"),
});

export const bulkReassignDepartmentSchema = z.object({
  candidateIds: z.array(z.string().uuid("Invalid candidate identifier")).min(1, "Select at least one candidate"),
  department: z.string().min(2, "Department name must be at least 2 characters long"),
});

export const createStudentSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters long"),
  email: z.string().email("Valid candidate email required"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  department: z.string().min(2, "Academic department is required"),
  phone: z.string().optional().nullable(),
  scheduleId: z.string().uuid("Invalid schedule identifier").optional().nullable().or(z.literal("")),
});

export type AssignCandidatesInput = z.infer<typeof assignCandidatesSchema>;
export type EnrollDepartmentInput = z.infer<typeof enrollDepartmentSchema>;
export type ReassignDepartmentInput = z.infer<typeof reassignDepartmentSchema>;
export type BulkReassignDepartmentInput = z.infer<typeof bulkReassignDepartmentSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
