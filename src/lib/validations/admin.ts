import { z } from "zod";

export const universitySettingsSchema = z.object({
  name: z.string().min(3, "University name must be at least 3 characters long"),
  contactEmail: z.string().email("Valid university contact email is required"),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  lockdownBrowserRequired: z.boolean().default(true),
  defaultProctoringLevel: z.enum(["none", "basic", "standard", "full"]).default("standard"),
  allowCandidateRegistration: z.boolean().default(true),
  sessionTimeoutMinutes: z.number().int().min(15).max(720).default(180),
  autoSaveFrequencySeconds: z.number().int().min(10).max(120).default(30),
});

export const departmentSchema = z.object({
  name: z.string().min(2, "Department name must be at least 2 characters long").max(120),
  code: z.string().min(2, "Discipline code must be at least 2 characters").max(15).optional().nullable().or(z.literal("")),
  headName: z.string().max(100).optional().nullable().or(z.literal("")),
  contactEmail: z.string().email("Valid departmental email required").optional().nullable().or(z.literal("")),
  description: z.string().max(1000).optional().nullable().or(z.literal("")),
});

export const updateDepartmentSchema = departmentSchema.extend({
  id: z.string().uuid("Invalid department identifier"),
});

export const userManagementSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters long"),
  email: z.string().email("Valid university email required"),
  role: z.enum(["admin", "examiner", "proctor", "candidate", "viewer"]),
  department: z.string().optional(),
  phone: z.string().optional(),
});

export type UniversitySettingsInput = z.infer<typeof universitySettingsSchema>;
export type DepartmentInput = z.infer<typeof departmentSchema>;
export type UserManagementInput = z.infer<typeof userManagementSchema>;

// Bulk Departments
export const bulkDepartmentItemSchema = z.object({
  name: z.string().min(2, "Department name must be at least 2 characters long").max(120),
  code: z.string().max(15).optional().nullable().or(z.literal("")),
  headName: z.string().max(100).optional().nullable().or(z.literal("")),
  contactEmail: z.string().email("Invalid departmental email").optional().nullable().or(z.literal("")),
  description: z.string().max(1000).optional().nullable().or(z.literal("")),
});

export const bulkCreateDepartmentsSchema = z.object({
  departments: z.array(bulkDepartmentItemSchema).min(1, "At least one department is required"),
  conflictStrategy: z.enum(["skip", "overwrite"]).default("skip"),
});

export type BulkDepartmentItem = z.infer<typeof bulkDepartmentItemSchema>;
export type BulkCreateDepartmentsInput = z.infer<typeof bulkCreateDepartmentsSchema>;

// Bulk Users / Roster
export const bulkUserItemSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters long"),
  email: z.string().email("Valid university email required"),
  role: z.enum(["admin", "examiner", "proctor", "candidate", "viewer"]).default("examiner"),
  department: z.string().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable().or(z.literal("")),
  temporaryPassword: z.string().min(6).optional().nullable().or(z.literal("")),
});

export const bulkCreateUsersSchema = z.object({
  users: z.array(bulkUserItemSchema).min(1, "At least one user record is required"),
  conflictStrategy: z.enum(["skip", "overwrite"]).default("skip"),
});

export type BulkUserItem = z.infer<typeof bulkUserItemSchema>;
export type BulkCreateUsersInput = z.infer<typeof bulkCreateUsersSchema>;
