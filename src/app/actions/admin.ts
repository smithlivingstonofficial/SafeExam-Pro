"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  universitySettingsSchema,
  departmentSchema,
  updateDepartmentSchema,
  userManagementSchema,
  bulkDepartmentItemSchema,
  bulkCreateDepartmentsSchema,
  BulkDepartmentItem,
  bulkUserItemSchema,
  bulkCreateUsersSchema,
  BulkUserItem,
} from "@/lib/validations/admin";
import { logAuditEvent } from "@/lib/audit";
import { requireRole } from "@/lib/auth/rbac";
import { UserRole } from "@/types/database";

export interface ActionResult<T = unknown> {
  success?: boolean;
  error?: string;
  code?: string;
  data?: T;
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
    revalidatePath("/", "layout");
    revalidatePath("/admin/settings");
    return { success: true };
  }

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("university_settings")
    .select("id")
    .limit(1)
    .maybeSingle();

  let error;
  if (existing?.id) {
    const res = await supabase
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
      .eq("id", existing.id);
    error = res.error;
  } else {
    const res = await supabase
      .from("university_settings")
      .insert({
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
      });
    error = res.error;
  }

  if (error) {
    return { error: error.message, code: "DB_ERROR" };
  }

  await logAuditEvent({
    action: "UNIVERSITY_SETTINGS_UPDATED",
    entityType: "university_settings",
    details: { name, contactEmail, lockdownBrowserRequired },
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function createDepartmentAction(formData: FormData): Promise<ActionResult> {
  const user = await requireRole(["admin"]);

  const rawData = {
    name: formData.get("name") as string,
    code: (formData.get("code") as string) || undefined,
    headName: (formData.get("headName") as string) || undefined,
    contactEmail: (formData.get("contactEmail") as string) || undefined,
    description: (formData.get("description") as string) || undefined,
  };

  const validation = departmentSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || "Invalid department data",
      code: "VALIDATION_ERROR",
    };
  }

  const { name, code, headName, contactEmail, description } = validation.data;
  const supabase = createAdminClient();

  const { data: newDept, error } = await supabase
    .from("departments")
    .insert({
      name,
      code: code ? code.trim().toUpperCase() : null,
      head_name: headName || null,
      contact_email: contactEmail || null,
      description: description || null,
    })
    .select("id, name, code")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        error: "A department with this name or code already exists.",
        code: "DUPLICATE_ERROR",
      };
    }
    return { error: error.message, code: "DB_ERROR" };
  }

  await logAuditEvent({
    userId: user.id,
    action: "DEPARTMENT_CREATED",
    entityType: "departments",
    entityId: newDept?.id,
    details: { name, code, headName },
  });

  revalidatePath("/admin/departments");
  return { success: true, data: newDept };
}

export async function updateDepartmentAction(formData: FormData): Promise<ActionResult> {
  const user = await requireRole(["admin"]);

  const rawData = {
    id: formData.get("id") as string,
    name: formData.get("name") as string,
    code: (formData.get("code") as string) || undefined,
    headName: (formData.get("headName") as string) || undefined,
    contactEmail: (formData.get("contactEmail") as string) || undefined,
    description: (formData.get("description") as string) || undefined,
  };

  const validation = updateDepartmentSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || "Invalid update parameters",
      code: "VALIDATION_ERROR",
    };
  }

  const { id, name, code, headName, contactEmail, description } = validation.data;
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("departments")
    .update({
      name,
      code: code ? code.trim().toUpperCase() : null,
      head_name: headName || null,
      contact_email: contactEmail || null,
      description: description || null,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return {
        error: "Another department with this name or code already exists.",
        code: "DUPLICATE_ERROR",
      };
    }
    return { error: error.message, code: "DB_ERROR" };
  }

  await logAuditEvent({
    userId: user.id,
    action: "DEPARTMENT_UPDATED",
    entityType: "departments",
    entityId: id,
    details: { name, code, headName },
  });

  revalidatePath("/admin/departments");
  revalidatePath(`/admin/departments/${id}`);
  return { success: true };
}

export async function deleteDepartmentAction(departmentId: string): Promise<ActionResult> {
  const user = await requireRole(["admin"]);
  const supabase = createAdminClient();

  // Safety check: Fetch department name and code
  const { data: dept } = await supabase
    .from("departments")
    .select("id, name, code")
    .eq("id", departmentId)
    .single();

  if (!dept) {
    return { error: "Department not found", code: "NOT_FOUND" };
  }

  // Safety check: Are any faculty or candidates registered under this department?
  const { count: nameCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("department", dept.name);

  let totalUsers = nameCount || 0;
  if (dept.code) {
    const { count: codeCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("department", dept.code);
    totalUsers += codeCount || 0;
  }

  if (totalUsers > 0) {
    return {
      error: `Cannot delete "${dept.name}" because ${totalUsers} user(s) are currently assigned to it. Please reassign them before deletion.`,
      code: "DEPARTMENT_IN_USE",
    };
  }

  const { error } = await supabase.from("departments").delete().eq("id", departmentId);
  if (error) {
    return { error: error.message, code: "DELETE_FAILED" };
  }

  await logAuditEvent({
    userId: user.id,
    action: "DEPARTMENT_DELETED",
    entityType: "departments",
    entityId: departmentId,
    details: { name: dept.name },
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

/**
 * Bulk imports academic departments from CSV spreadsheet.
 */
export async function bulkCreateDepartmentsAction(
  departments: BulkDepartmentItem[],
  conflictStrategy: "skip" | "overwrite" = "skip"
): Promise<ActionResult<{
  success: boolean;
  totalProcessed: number;
  createdCount: number;
  skippedCount: number;
  updatedCount: number;
  failedCount: number;
  errors: Array<{ rowNumber?: number; fullName?: string; email?: string; error: string }>;
}>> {
  const user = await requireRole(["admin"]);

  const validation = bulkCreateDepartmentsSchema.safeParse({ departments, conflictStrategy });
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || "Validation failed on departments data",
      code: "VALIDATION_ERROR",
    };
  }

  const isPlaceholderUrl =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");

  if (isPlaceholderUrl) {
    await logAuditEvent({
      userId: user.id,
      action: "BULK_DEPARTMENTS_IMPORTED_DEMO",
      entityType: "departments",
      details: {
        totalProcessed: departments.length,
        createdCount: departments.length,
        conflictStrategy,
      },
    });
    revalidatePath("/admin/departments");
    return {
      success: true,
      data: {
        success: true,
        totalProcessed: departments.length,
        createdCount: departments.length,
        skippedCount: 0,
        updatedCount: 0,
        failedCount: 0,
        errors: [],
      },
    };
  }

  const supabase = createAdminClient();

  // Fetch existing departments to match name/code
  const { data: existingDepts } = await supabase
    .from("departments")
    .select("id, name, code");

  const nameMap = new Map<string, string>();
  const codeMap = new Map<string, string>();

  (existingDepts || []).forEach((d: { id: string; name: string | null; code: string | null }) => {
    if (d.name) nameMap.set(d.name.toLowerCase().trim(), d.id);
    if (d.code) codeMap.set(d.code.toLowerCase().trim(), d.id);
  });

  let createdCount = 0;
  let skippedCount = 0;
  let updatedCount = 0;
  let failedCount = 0;
  const errors: Array<{ rowNumber?: number; fullName?: string; email?: string; error: string }> = [];

  for (let i = 0; i < departments.length; i++) {
    const row = departments[i];
    const rowNumber = i + 1;
    const cleanName = row.name.trim();
    const cleanCode = row.code ? row.code.trim().toUpperCase() : null;
    const cleanHead = row.headName ? row.headName.trim() : null;
    const cleanEmail = row.contactEmail ? row.contactEmail.trim().toLowerCase() : null;
    const cleanDesc = row.description ? row.description.trim() : null;

    const lowerName = cleanName.toLowerCase();
    const lowerCode = cleanCode ? cleanCode.toLowerCase() : null;

    const existingId = nameMap.get(lowerName) || (lowerCode ? codeMap.get(lowerCode) : null);

    if (existingId) {
      if (conflictStrategy === "overwrite") {
        const { error: updateErr } = await supabase
          .from("departments")
          .update({
            name: cleanName,
            code: cleanCode,
            head_name: cleanHead,
            contact_email: cleanEmail,
            description: cleanDesc,
          })
          .eq("id", existingId);

        if (updateErr) {
          failedCount++;
          errors.push({ rowNumber, fullName: cleanName, error: updateErr.message });
        } else {
          updatedCount++;
        }
      } else {
        skippedCount++;
      }
      continue;
    }

    // Insert new department
    const { data: newDept, error: insertErr } = await supabase
      .from("departments")
      .insert({
        name: cleanName,
        code: cleanCode,
        head_name: cleanHead,
        contact_email: cleanEmail,
        description: cleanDesc,
      })
      .select("id")
      .single();

    if (insertErr) {
      failedCount++;
      errors.push({ rowNumber, fullName: cleanName, error: insertErr.message });
    } else {
      createdCount++;
      if (newDept?.id) {
        nameMap.set(lowerName, newDept.id);
        if (lowerCode) codeMap.set(lowerCode, newDept.id);
      }
    }
  }

  await logAuditEvent({
    userId: user.id,
    action: "BULK_DEPARTMENTS_IMPORTED",
    entityType: "departments",
    details: {
      totalProcessed: departments.length,
      createdCount,
      skippedCount,
      updatedCount,
      failedCount,
      conflictStrategy,
    },
  });

  revalidatePath("/admin/departments");
  revalidatePath("/admin/users");
  revalidatePath("/admin/students");

  return {
    success: true,
    data: {
      success: true,
      totalProcessed: departments.length,
      createdCount,
      skippedCount,
      updatedCount,
      failedCount,
      errors,
    },
  };
}

/**
 * Bulk provisions institutional users and staff roster accounts.
 */
export async function bulkCreateUsersAction(
  users: BulkUserItem[],
  conflictStrategy: "skip" | "overwrite" = "skip"
): Promise<ActionResult<{
  success: boolean;
  totalProcessed: number;
  createdCount: number;
  skippedCount: number;
  updatedCount: number;
  failedCount: number;
  errors: Array<{ rowNumber?: number; fullName?: string; email?: string; error: string }>;
}>> {
  const adminUser = await requireRole(["admin"]);

  const validation = bulkCreateUsersSchema.safeParse({ users, conflictStrategy });
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || "Validation failed on user data",
      code: "VALIDATION_ERROR",
    };
  }

  const isPlaceholderUrl =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project");

  if (isPlaceholderUrl) {
    await logAuditEvent({
      userId: adminUser.id,
      action: "BULK_USERS_IMPORTED_DEMO",
      entityType: "profiles",
      details: {
        totalProcessed: users.length,
        createdCount: users.length,
        conflictStrategy,
      },
    });
    revalidatePath("/admin/users");
    return {
      success: true,
      data: {
        success: true,
        totalProcessed: users.length,
        createdCount: users.length,
        skippedCount: 0,
        updatedCount: 0,
        failedCount: 0,
        errors: [],
      },
    };
  }

  const supabase = createAdminClient();

  // Pre-load departments to link department_id
  const { data: deptRows } = await supabase.from("departments").select("id, name, code");
  const deptMap = new Map<string, string>();
  (deptRows || []).forEach((d: { id: string; name: string | null; code: string | null }) => {
    if (d.name) deptMap.set(d.name.toLowerCase().trim(), d.id);
    if (d.code) deptMap.set(d.code.toLowerCase().trim(), d.id);
  });

  let createdCount = 0;
  let skippedCount = 0;
  let updatedCount = 0;
  let failedCount = 0;
  const errors: Array<{ rowNumber?: number; fullName?: string; email?: string; error: string }> = [];

  for (let i = 0; i < users.length; i++) {
    const row = users[i];
    const rowNumber = i + 1;
    const cleanEmail = row.email.trim().toLowerCase();
    const cleanName = row.fullName.trim();
    const cleanDept = row.department?.trim() || "";
    const cleanRole = row.role;
    const cleanPhone = row.phone?.trim() || null;
    const tempPassword = row.temporaryPassword?.trim() || "Staff@2026";

    const resolvedDeptId = cleanDept ? (deptMap.get(cleanDept.toLowerCase()) || null) : null;

    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: cleanEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: cleanName,
          role: cleanRole,
          department: cleanDept,
          department_id: resolvedDeptId,
          phone: cleanPhone,
        },
      });

      if (authError) {
        const isDuplicate =
          authError.message.toLowerCase().includes("already registered") ||
          authError.message.toLowerCase().includes("already exists");

        if (isDuplicate) {
          if (conflictStrategy === "overwrite") {
            const { data: userList } = await supabase.auth.admin.listUsers();
            const existingUser = userList?.users?.find(
              (u: { email?: string }) => u.email?.toLowerCase() === cleanEmail
            );

            if (existingUser) {
              await supabase
                .from("profiles")
                .update({
                  full_name: cleanName,
                  role: cleanRole,
                  department: cleanDept,
                  department_id: resolvedDeptId,
                  phone: cleanPhone,
                })
                .eq("id", existingUser.id);
              updatedCount++;
              continue;
            }
          } else {
            skippedCount++;
            continue;
          }
        }

        failedCount++;
        errors.push({
          rowNumber,
          email: cleanEmail,
          fullName: cleanName,
          error: authError.message,
        });
        continue;
      }

      if (authData?.user) {
        const newUserId = authData.user.id;
        if (resolvedDeptId) {
          await supabase
            .from("profiles")
            .update({ department_id: resolvedDeptId })
            .eq("id", newUserId);
        }
        createdCount++;
      }
    } catch (err: unknown) {
      failedCount++;
      errors.push({
        rowNumber,
        email: cleanEmail,
        fullName: cleanName,
        error: err instanceof Error ? err.message : "Account creation error",
      });
    }
  }

  await logAuditEvent({
    userId: adminUser.id,
    action: "BULK_USERS_IMPORTED",
    entityType: "profiles",
    details: {
      totalProcessed: users.length,
      createdCount,
      skippedCount,
      updatedCount,
      failedCount,
      conflictStrategy,
    },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/departments");

  return {
    success: true,
    data: {
      success: true,
      totalProcessed: users.length,
      createdCount,
      skippedCount,
      updatedCount,
      failedCount,
      errors,
    },
  };
}
