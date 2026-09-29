import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid university or candidate email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  role: z.enum(["candidate", "examiner", "proctor", "admin"]).optional(),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters long"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  confirmPassword: z.string().min(8, "Confirm password is required"),
  department: z.string().min(2, "Please select or enter your academic department"),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
