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
  name: z.string().min(2, "Department name must be at least 2 characters long"),
  headName: z.string().optional(),
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
