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

  // 2. Strict Supabase Password Verification
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    // Record failed login security event
    await logAuditEvent({
      userId: null,
      action: "USER_LOGIN_FAILED",
      entityType: "auth",
      details: { email, reason: authError?.message || "Invalid credentials" },
    });

    return {
      error: "Invalid university email or password. Please verify credentials.",
      code: "AUTH_FAILED",
    };
  }

  // 3. Retrieve user profile to determine verified role and account status
  const { data } = await supabase
    .from("profiles")
    .select("role, is_active, full_name")
    .eq("id", authData.user.id)
    .maybeSingle();

  const profile = data as { role?: UserRole; is_active?: boolean; full_name?: string } | null;

  // Check if account is suspended
  if (profile && profile.is_active === false) {
    await supabase.auth.signOut();
    await logAuditEvent({
      userId: authData.user.id,
      action: "SUSPENDED_USER_LOGIN_BLOCKED",
      entityType: "profiles",
      entityId: authData.user.id,
      details: { email },
    });

    return {
      error: "Your institutional account has been deactivated. Please contact the Examination Board.",
      code: "ACCOUNT_SUSPENDED",
    };
  }

  const isMasterAdmin = email.toLowerCase() === "smithlivingston2005@gmail.com";
  let userRole: UserRole = isMasterAdmin ? "admin" : (profile?.role || role || "candidate");

  // Ensure master admin has admin role in database
  if (isMasterAdmin && profile?.role !== "admin") {
    const adminClient = (await import("@/lib/supabase/server")).createAdminClient();
    await adminClient
      .from("profiles")
      .update({ role: "admin", full_name: "Smith Livingston" })
      .eq("id", authData.user.id);
    userRole = "admin";
  }

  // 4. Audit Log
  await logAuditEvent({
    userId: authData.user.id,
    action: "USER_LOGIN_SUCCESS",
    entityType: "profiles",
    entityId: authData.user.id,
    details: { role: userRole, isMasterAdmin },
  });

  // 5. Role-Based Navigation
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

  // 2. Register user securely with Supabase Auth
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: email.toLowerCase() === "smithlivingston2005@gmail.com" ? "admin" : "candidate",
        department,
        phone,
      },
    },
  });

  if (error || !data.user) {
    return {
      error: error?.message || "Failed to create account",
      code: "REGISTRATION_FAILED",
    };
  }

  const isMaster = email.toLowerCase() === "smithlivingston2005@gmail.com";

  // 4. Audit Log
  await logAuditEvent({
    userId: data.user.id,
    action: isMaster ? "MASTER_ADMIN_REGISTERED" : "CANDIDATE_REGISTERED",
    entityType: "profiles",
    entityId: data.user.id,
    details: { fullName, email, department, role: isMaster ? "admin" : "candidate" },
  });

  redirect(isMaster ? "/admin" : "/candidate");
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
