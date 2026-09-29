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
  const rawEmail = (formData.get("email") as string)?.trim().toLowerCase();
  const rawPassword = formData.get("password") as string;
  const redirectTo = (formData.get("redirectTo") as string | null)?.trim() || null;

  // 1. Zod Input Validation
  const validation = loginSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
  });

  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || "Please provide valid credentials.",
      code: "VALIDATION_ERROR",
    };
  }

  const { email, password } = validation.data;
  const isMasterAdmin = email === "smithlivingston2005@gmail.com";

  // 2. Supabase Password Verification
  const supabase = await createClient();
  let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // If master admin is logging in for the very first time and doesn't exist in auth.users yet
  if ((authError || !authData.user) && isMasterAdmin) {
    const adminClient = (await import("@/lib/supabase/server")).createAdminClient();
    const { data: userList } = await adminClient.auth.admin.listUsers();
    const existingMaster = userList?.users?.find(
      (u: { email?: string }) => u.email?.toLowerCase() === "smithlivingston2005@gmail.com"
    );

    if (!existingMaster) {
      // First-time initialization: create master admin with user's entered password
      const { data: createdUser, error: createErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: "admin",
          full_name: "Smith Livingston",
        },
      });

      if (!createErr && createdUser.user) {
        // Ensure profile exists in profiles table
        await adminClient.from("profiles").upsert(
          {
            id: createdUser.user.id,
            role: "admin",
            full_name: "Smith Livingston",
            is_active: true,
          },
          { onConflict: "id" }
        );

        // Sign in immediately with newly created credentials
        const retry = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        authData = retry.data;
        authError = retry.error;
      }
    }
  }

  if (authError || !authData.user) {
    await logAuditEvent({
      userId: null,
      action: "USER_LOGIN_FAILED",
      entityType: "auth",
      details: { email, reason: authError?.message || "Invalid credentials" },
    });

    return {
      error: "Invalid email or password. Please verify credentials or register.",
      code: "AUTH_FAILED",
    };
  }

  // 3. Retrieve user profile to determine verified role and account status from database
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active, full_name")
    .eq("id", authData.user.id)
    .maybeSingle();

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

  // Role resolution strictly from database
  let userRole: UserRole = isMasterAdmin ? "admin" : (profile?.role || "candidate");

  // Ensure master admin has admin role in database
  if (isMasterAdmin && profile?.role !== "admin") {
    const adminClient = (await import("@/lib/supabase/server")).createAdminClient();
    await adminClient
      .from("profiles")
      .upsert(
        {
          id: authData.user.id,
          role: "admin",
          full_name: profile?.full_name || "Smith Livingston",
          is_active: true,
        },
        { onConflict: "id" }
      );
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

  // 5. Automatic Role-Based Navigation
  // If a valid safe redirectTo path is provided and user has access, honour it
  if (redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
    if (userRole === "admin") {
      redirect(redirectTo);
    } else if (redirectTo.startsWith(`/${userRole}`)) {
      redirect(redirectTo);
    }
  }

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

  // 3. Resolve department_id and link profile
  const adminClient = (await import("@/lib/supabase/server")).createAdminClient();
  const { data: deptRow } = await adminClient
    .from("departments")
    .select("id")
    .or(`name.eq.${department},code.eq.${department}`)
    .maybeSingle();

  if (deptRow) {
    await adminClient
      .from("profiles")
      .update({ department_id: deptRow.id })
      .eq("id", data.user.id);
  }

  // 4. Audit Log
  await logAuditEvent({
    userId: data.user.id,
    action: isMaster ? "MASTER_ADMIN_REGISTERED" : "CANDIDATE_REGISTERED",
    entityType: "profiles",
    entityId: data.user.id,
    details: { fullName, email, department, departmentId: deptRow?.id, role: isMaster ? "admin" : "candidate" },
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
