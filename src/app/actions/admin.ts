"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  universitySettingsSchema,
  departmentSchema,
  userManagementSchema,
} from "@/lib/validations/admin";
import { logAuditEvent } from "@/lib/audit";
import { UserRole } from "@/types/database";

export interface ActionResult {
  success?: boolean;
  error?: string;
  code?: string;
  data?: unknown;
}

export async function updateUniversitySettingsAction(formData: FormData): Promise<ActionResult> {
  const rawData = {
    name: formData.get("name") as string,
    contactEmail: formData.get("contactEmail") as string,
    contactPhone: (formData.get("contactPhone") as string) || undefined,
    address: (formData.get("address") as string) || undefined,
    lockdownBrowserRequired: formData.get("lockdownBrowserRequired") === "on",
    defaultProctoringLevel: formData.get("defaultProctoringLevel") as "none" | "basic" | "standard" | "full",
    allowCandidateRegistration: formData.get("allowCandidateRegistration") === "on",
    sessionTimeoutMinutes: Number(formData.get("sessionTimeoutMinutes") || 180),
    autoSaveFrequencySeconds: Number(formData.get("autoSaveFrequencySeconds") || 30),
  };

  const validation = universitySettingsSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || "Validation failed",
      code: "VALIDATION_ERROR",
    };
  }

  const {
    name,
    contactEmail,
    contactPhone,
    address,
    lockdownBrowserRequired,
    defaultProctoringLevel,
    allowCandidateRegistration,
    sessionTimeoutMinutes,
    autoSaveFrequencySeconds,
  } = validation.data;

  const isPlaceholderUrl =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");

  if (isPlaceholderUrl) {
    await logAuditEvent({
      action: "UNIVERSITY_SETTINGS_UPDATED_DEMO",
      entityType: "university_settings",
      details: { name, contactEmail, lockdownBrowserRequired, defaultProctoringLevel },
    });
    revalidatePath("/admin/settings");
    return { success: true };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("university_settings")
    .update({
      name,
      contact_email: contactEmail,
      contact_phone: contactPhone || null,
      address: address || null,
      settings: {
        lockdown_browser_required: lockdownBrowserRequired,
        default_proctoring_level: defaultProctoringLevel,
        allow_candidate_registration: allowCandidateRegistration,
        session_timeout_minutes: sessionTimeoutMinutes,
        auto_save_frequency_seconds: autoSaveFrequencySeconds,
      },
      updated_at: new Date().toISOString(),
    })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    return { error: error.message, code: "DB_ERROR" };
  }

  await logAuditEvent({
    action: "UNIVERSITY_SETTINGS_UPDATED",
    entityType: "university_settings",
    details: { name, contactEmail, lockdownBrowserRequired },
  });

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function createDepartmentAction(formData: FormData): Promise<ActionResult> {
  const rawData = {
    name: formData.get("name") as string,
    headName: (formData.get("headName") as string) || undefined,
  };

  const validation = departmentSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || "Invalid department data",
      code: "VALIDATION_ERROR",
    };
  }

  const { name, headName } = validation.data;

  const isPlaceholderUrl =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");

  if (isPlaceholderUrl) {
    await logAuditEvent({
      action: "DEPARTMENT_CREATED_DEMO",
      entityType: "departments",
      details: { name, headName },
    });
    revalidatePath("/admin/departments");
    return { success: true };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("departments").insert({
    name,
    head_name: headName || null,
  });

  if (error) {
    return { error: error.message, code: "DB_ERROR" };
  }

  await logAuditEvent({
    action: "DEPARTMENT_CREATED",
    entityType: "departments",
    details: { name, headName },
  });

  revalidatePath("/admin/departments");
  return { success: true };
}

export async function createUserAction(formData: FormData): Promise<ActionResult> {
  const rawData = {
    fullName: formData.get("fullName") as string,
    email: formData.get("email") as string,
    role: formData.get("role") as UserRole,
    department: (formData.get("department") as string) || undefined,
    phone: (formData.get("phone") as string) || undefined,
  };

  const validation = userManagementSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || "Invalid user profile data",
      code: "VALIDATION_ERROR",
    };
  }

  const { fullName, email, role, department, phone } = validation.data;

  const isPlaceholderUrl =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");

  if (isPlaceholderUrl) {
    await logAuditEvent({
      action: "USER_INVITED_DEMO",
      entityType: "profiles",
      details: { fullName, email, role, department },
    });
    revalidatePath("/admin/users");
    return { success: true };
  }

  const supabase = createAdminClient();
  // Create user in Supabase Auth via Admin API
  const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role,
      department,
      phone,
    },
  });

  if (authError || !newUser.user) {
    return { error: authError?.message || "Failed to create user account", code: "AUTH_ERROR" };
  }

  await logAuditEvent({
    action: "USER_INVITED",
    entityType: "profiles",
    entityId: newUser.user.id,
    details: { fullName, email, role, department },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateUserRoleAction(userId: string, newRole: UserRole): Promise<ActionResult> {
  const isPlaceholderUrl =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");

  if (isPlaceholderUrl) {
    await logAuditEvent({
      action: "USER_ROLE_UPDATED_DEMO",
      entityType: "profiles",
      entityId: userId,
      details: { newRole },
    });
    revalidatePath("/admin/users");
    return { success: true };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) {
    return { error: error.message, code: "DB_ERROR" };
  }

  await logAuditEvent({
    action: "USER_ROLE_UPDATED",
    entityType: "profiles",
    entityId: userId,
    details: { newRole },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function toggleUserStatusAction(userId: string, currentActive: boolean): Promise<ActionResult> {
  const isPlaceholderUrl =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");

  const newActive = !currentActive;

  if (isPlaceholderUrl) {
    await logAuditEvent({
      action: newActive ? "USER_ACTIVATED_DEMO" : "USER_DEACTIVATED_DEMO",
      entityType: "profiles",
      entityId: userId,
      details: { is_active: newActive },
    });
    revalidatePath("/admin/users");
    return { success: true };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: newActive })
    .eq("id", userId);

  if (error) {
    return { error: error.message, code: "DB_ERROR" };
  }

  await logAuditEvent({
    action: newActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
    entityType: "profiles",
    entityId: userId,
    details: { is_active: newActive },
  });

  revalidatePath("/admin/users");
  return { success: true };
}
