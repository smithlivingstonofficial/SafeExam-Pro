"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { logAuditEvent } from "@/lib/audit";
import { UserRole } from "@/types/database";

export interface AuthResponse {
  error?: string;
  code?: string;
  success?: boolean;
}

export async function loginAction(formData: FormData): Promise<AuthResponse> {
  const rawEmail = formData.get("email") as string;
  const rawPassword = formData.get("password") as string;
  const requestedRole = (formData.get("role") as UserRole) || "candidate";

  // 1. Zod Input Validation
  const validation = loginSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
    role: requestedRole,
  });

  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || "Invalid input data",
      code: "VALIDATION_ERROR",
    };
  }

  const { email, password, role } = validation.data;

  // 2. Demo fallback if Supabase is still on placeholder credentials
  const isPlaceholderUrl =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");

  if (isPlaceholderUrl) {
    // Audit log demo login
    await logAuditEvent({
      userId: null,
      action: "USER_LOGIN_DEMO",
      entityType: "auth",
      details: { email, role: role || "candidate", mode: "development_demo" },
    });

    // Route directly to the selected role dashboard
    redirect(`/${role || "candidate"}`);
  }

  // 3. Authenticate with Supabase
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return {
      error: authError?.message || "Invalid email or password",
      code: "AUTH_FAILED",
    };
  }

  // 4. Retrieve user profile to determine actual role
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();

  const profile = data as { role?: UserRole } | null;
  const userRole: UserRole = profile?.role || role || "candidate";

  // 5. Audit Log
  await logAuditEvent({
    userId: authData.user.id,
    action: "USER_LOGIN_SUCCESS",
    entityType: "profiles",
    entityId: authData.user.id,
    details: { role: userRole },
  });

  // 6. Role-Based Navigation
  redirect(`/${userRole}`);
}

export async function registerAction(formData: FormData): Promise<AuthResponse> {
  const rawData = {
    fullName: formData.get("fullName") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
    department: formData.get("department") as string,
    phone: (formData.get("phone") as string) || undefined,
  };

  // 1. Zod Input Validation
  const validation = registerSchema.safeParse(rawData);

  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || "Invalid registration form",
      code: "VALIDATION_ERROR",
    };
  }

  const { fullName, email, password, department, phone } = validation.data;

  // 2. Demo fallback
  const isPlaceholderUrl =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");

  if (isPlaceholderUrl) {
    await logAuditEvent({
      userId: null,
      action: "CANDIDATE_REGISTER_DEMO",
      entityType: "auth",
      details: { fullName, email, department, mode: "development_demo" },
    });
    redirect("/candidate");
  }

  // 3. Register user with Supabase Auth
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: "candidate",
        department,
        phone,
      },
    },
  });

  if (error || !data.user) {
    return {
      error: error?.message || "Failed to create candidate account",
      code: "REGISTRATION_FAILED",
    };
  }

  // 4. Audit Log
  await logAuditEvent({
    userId: data.user.id,
    action: "CANDIDATE_REGISTERED",
    entityType: "profiles",
    entityId: data.user.id,
    details: { fullName, email, department },
  });

  redirect("/candidate");
}

export async function logoutAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    await logAuditEvent({
      userId: user.id,
      action: "USER_LOGOUT",
      entityType: "profiles",
      entityId: user.id,
    });
  }

  await supabase.auth.signOut();
  redirect("/login");
}
