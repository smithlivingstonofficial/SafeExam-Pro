"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import {
  assignCandidatesSchema,
  enrollDepartmentSchema,
  reassignDepartmentSchema,
  bulkReassignDepartmentSchema,
  createStudentSchema,
  bulkCreateStudentsSchema,
  BulkStudentItemInput,
} from "@/lib/validations/students";
import { logAuditEvent } from "@/lib/audit";
import { requireRole } from "@/lib/auth/rbac";

export interface ActionResult {
  success?: boolean;
  error?: string;
  code?: string;
  data?: unknown;
}

/**
 * Assigns multiple candidates to a specific exam schedule session.
 */
export async function assignCandidatesToScheduleAction(
  candidateIds: string[],
  scheduleId: string
): Promise<ActionResult> {
  const user = await requireRole(["admin", "examiner"]);

  const validation = assignCandidatesSchema.safeParse({ candidateIds, scheduleId });
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || "Invalid assignment parameters",
      code: "VALIDATION_ERROR",
    };
  }

  const supabase = createAdminClient();

  // 1. Verify schedule exists
  const { data: schedule, error: schError } = await supabase
    .from("exam_schedules")
    .select("id, exam_id, start_at, max_candidates")
    .eq("id", scheduleId)
    .single();

  if (schError || !schedule) {
    return { error: "Exam schedule session not found", code: "NOT_FOUND" };
  }

  // 2. Fetch existing assignments for this schedule to avoid duplicate primary rows
  const { data: existingAssignments } = await supabase
    .from("exam_assignments")
    .select("candidate_id")
    .eq("schedule_id", scheduleId)
    .in("candidate_id", candidateIds);

  const alreadyAssignedSet = new Set(
    (existingAssignments || []).map((a: { candidate_id: string }) => a.candidate_id)
  );

  const toAssignIds = candidateIds.filter((id) => !alreadyAssignedSet.has(id));

  if (toAssignIds.length === 0) {
    return {
      error: "All selected candidates are already assigned to this examination session.",
      code: "ALREADY_ASSIGNED",
    };
  }

  // 3. Batch insert new assignments
  const newRows = toAssignIds.map((cId) => ({
    candidate_id: cId,
    schedule_id: scheduleId,
    status: "assigned" as const,
    assigned_at: new Date().toISOString(),
  }));

  const { error: insertError } = await supabase.from("exam_assignments").insert(newRows);

  if (insertError) {
    return { error: insertError.message, code: "DB_ERROR" };
  }

  // 4. Log audit event
  await logAuditEvent({
    userId: user.id,
    action: "STUDENTS_ASSIGNED_TO_EXAM",
    entityType: "exam_assignments",
    entityId: scheduleId,
    details: {
      assignedCount: toAssignIds.length,
      skippedCount: alreadyAssignedSet.size,
      scheduleId,
      examId: schedule.exam_id,
    },
  });

  revalidatePath("/admin/students");
  revalidatePath("/examiner/schedules");
  revalidatePath("/candidate");

  return {
    success: true,
    data: {
      assignedCount: toAssignIds.length,
      skippedCount: alreadyAssignedSet.size,
    },
  };
}

/**
 * 1-Click enrollment of an entire academic department into an exam delivery session.
 */
export async function enrollDepartmentInScheduleAction(
  departmentName: string,
  scheduleId: string
): Promise<ActionResult> {
  const user = await requireRole(["admin", "examiner"]);

  const validation = enrollDepartmentSchema.safeParse({ departmentName, scheduleId });
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || "Invalid parameters",
      code: "VALIDATION_ERROR",
    };
  }

  const supabase = createAdminClient();

  // 1. Verify schedule exists
  const { data: schedule } = await supabase
    .from("exam_schedules")
    .select("id, exam_id")
    .eq("id", scheduleId)
    .single();

  if (!schedule) {
    return { error: "Exam schedule session not found", code: "NOT_FOUND" };
  }

  // 2. Look up department code if exists
  const { data: dept } = await supabase
    .from("departments")
    .select("id, name, code")
    .or(`name.eq.${departmentName},code.eq.${departmentName}`)
    .maybeSingle();

  const searchNames = [departmentName];
  if (dept?.code && !searchNames.includes(dept.code)) {
    searchNames.push(dept.code);
  }
  if (dept?.name && !searchNames.includes(dept.name)) {
    searchNames.push(dept.name);
  }

  // 3. Find all candidate profiles under this department
  let candidateQuery = supabase
    .from("profiles")
    .select("id")
    .eq("role", "candidate");

  if (dept && (dept as { id?: string }).id) {
    const dId = (dept as { id?: string }).id;
    candidateQuery = candidateQuery.or(
      `department_id.eq.${dId},department.in.(${searchNames.map((s) => `"${s}"`).join(",")})`
    );
  } else {
    candidateQuery = candidateQuery.in("department", searchNames);
  }

  const { data: candidates, error: candError } = await candidateQuery;

  if (candError) {
    return { error: candError.message, code: "DB_ERROR" };
  }

  const typedCandidates = (candidates || []) as Array<{ id: string }>;
  const candidateIds: string[] = typedCandidates.map((c) => c.id);

  if (candidateIds.length === 0) {
    return {
      error: `No registered candidates found under department "${departmentName}".`,
      code: "NO_CANDIDATES",
    };
  }

  // 4. Exclude already assigned
  const { data: existing } = await supabase
    .from("exam_assignments")
    .select("candidate_id")
    .eq("schedule_id", scheduleId)
    .in("candidate_id", candidateIds);

  const existingSet = new Set((existing || []).map((e: { candidate_id: string }) => e.candidate_id));
  const toAssign = candidateIds.filter((id: string) => !existingSet.has(id));

  if (toAssign.length === 0) {
    return {
      error: `All ${candidateIds.length} candidate(s) in "${departmentName}" are already assigned to this session.`,
      code: "ALREADY_ASSIGNED",
    };
  }

  const newRows = toAssign.map((cId: string) => ({
    candidate_id: cId,
    schedule_id: scheduleId,
    status: "assigned" as const,
    assigned_at: new Date().toISOString(),
  }));

  const { error: insertError } = await supabase.from("exam_assignments").insert(newRows);
  if (insertError) {
    return { error: insertError.message, code: "DB_ERROR" };
  }

  await logAuditEvent({
    userId: user.id,
    action: "DEPARTMENT_ENROLLED_IN_EXAM",
    entityType: "exam_assignments",
    entityId: scheduleId,
    details: {
      department: departmentName,
      enrolledCount: toAssign.length,
      alreadyEnrolledCount: existingSet.size,
    },
  });

  revalidatePath("/admin/students");
  revalidatePath("/examiner/schedules");
  revalidatePath("/candidate");

  return {
    success: true,
    data: {
      enrolledCount: toAssign.length,
      alreadyEnrolledCount: existingSet.size,
    },
  };
}

/**
 * Removes an exam assignment for a candidate (only if not submitted).
 */
export async function removeCandidateAssignmentAction(assignmentId: string): Promise<ActionResult> {
  const user = await requireRole(["admin", "examiner"]);
  const supabase = createAdminClient();

  const { data: assignment } = await supabase
    .from("exam_assignments")
    .select("id, status, candidate_id, schedule_id")
    .eq("id", assignmentId)
    .single();

  if (!assignment) {
    return { error: "Exam assignment record not found", code: "NOT_FOUND" };
  }

  if (assignment.status === "submitted" || assignment.status === "graded") {
    return {
      error: "Cannot delete an assignment that has already been submitted or graded.",
      code: "FORBIDDEN",
    };
  }

  const { error: delError } = await supabase
    .from("exam_assignments")
    .delete()
    .eq("id", assignmentId);

  if (delError) {
    return { error: delError.message, code: "DB_ERROR" };
  }

  await logAuditEvent({
    userId: user.id,
    action: "STUDENT_EXAM_ASSIGNMENT_REMOVED",
    entityType: "exam_assignments",
    entityId: assignmentId,
    details: { candidateId: assignment.candidate_id, scheduleId: assignment.schedule_id },
  });

  revalidatePath("/admin/students");
  revalidatePath("/examiner/schedules");
  revalidatePath("/candidate");

  return { success: true };
}

/**
 * Resets a candidate's attempt back to "assigned" if a crash or network interruption occurred.
 */
export async function resetCandidateAttemptAction(assignmentId: string): Promise<ActionResult> {
  const user = await requireRole(["admin", "examiner"]);
  const supabase = createAdminClient();

  const { data: assignment } = await supabase
    .from("exam_assignments")
    .select("id, status, candidate_id")
    .eq("id", assignmentId)
    .single();

  if (!assignment) {
    return { error: "Assignment not found", code: "NOT_FOUND" };
  }

  const { error: updateError } = await supabase
    .from("exam_assignments")
    .update({
      status: "assigned",
      started_at: null,
      submitted_at: null,
    })
    .eq("id", assignmentId);

  if (updateError) {
    return { error: updateError.message, code: "DB_ERROR" };
  }

  await logAuditEvent({
    userId: user.id,
    action: "STUDENT_ATTEMPT_RESET",
    entityType: "exam_assignments",
    entityId: assignmentId,
    details: {
      candidateId: assignment.candidate_id,
      previousStatus: assignment.status,
    },
  });

  revalidatePath("/admin/students");
  revalidatePath("/candidate");

  return { success: true };
}

/**
 * Reassigns an individual candidate to a different academic department.
 */
export async function reassignStudentDepartmentAction(
  candidateId: string,
  department: string
): Promise<ActionResult> {
  const user = await requireRole(["admin"]);

  const validation = reassignDepartmentSchema.safeParse({ candidateId, department });
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || "Invalid parameters",
      code: "VALIDATION_ERROR",
    };
  }

  const supabase = createAdminClient();

  // Resolve department_id
  const { data: deptRow } = await supabase
    .from("departments")
    .select("id")
    .or(`name.eq.${department},code.eq.${department}`)
    .maybeSingle();

  const { error } = await supabase
    .from("profiles")
    .update({
      department,
      department_id: deptRow ? deptRow.id : null,
    })
    .eq("id", candidateId);

  if (error) {
    return { error: error.message, code: "DB_ERROR" };
  }

  await logAuditEvent({
    userId: user.id,
    action: "STUDENT_DEPARTMENT_REASSIGNED",
    entityType: "profiles",
    entityId: candidateId,
    details: { newDepartment: department, departmentId: deptRow?.id },
  });

  revalidatePath("/admin/students");
  revalidatePath("/admin/departments");
  revalidatePath("/admin/users");

  return { success: true };
}

/**
 * Bulk reassigns a set of candidates to a new academic department.
 */
export async function bulkReassignStudentsDepartmentAction(
  candidateIds: string[],
  department: string
): Promise<ActionResult> {
  const user = await requireRole(["admin"]);

  const validation = bulkReassignDepartmentSchema.safeParse({ candidateIds, department });
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || "Invalid parameters",
      code: "VALIDATION_ERROR",
    };
  }

  const supabase = createAdminClient();

  // Resolve department_id
  const { data: deptRow } = await supabase
    .from("departments")
    .select("id")
    .or(`name.eq.${department},code.eq.${department}`)
    .maybeSingle();

  const { error } = await supabase
    .from("profiles")
    .update({
      department,
      department_id: deptRow ? deptRow.id : null,
    })
    .in("id", candidateIds);

  if (error) {
    return { error: error.message, code: "DB_ERROR" };
  }

  await logAuditEvent({
    userId: user.id,
    action: "BULK_STUDENTS_DEPARTMENT_REASSIGNED",
    entityType: "profiles",
    details: { count: candidateIds.length, newDepartment: department, departmentId: deptRow?.id },
  });

  revalidatePath("/admin/students");
  revalidatePath("/admin/departments");
  revalidatePath("/admin/users");

  return { success: true };
}

/**
 * Creates a student/candidate directly from the administration portal.
 */
export async function createStudentAction(formData: FormData): Promise<ActionResult> {
  const user = await requireRole(["admin"]);

  const rawData = {
    fullName: formData.get("fullName") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    department: formData.get("department") as string,
    phone: (formData.get("phone") as string) || undefined,
    scheduleId: (formData.get("scheduleId") as string) || undefined,
  };

  const validation = createStudentSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || "Invalid student data",
      code: "VALIDATION_ERROR",
    };
  }

  const { fullName, email, password, department, phone, scheduleId } = validation.data;
  const supabase = createAdminClient();

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: "candidate",
      department,
      phone,
    },
  });

  if (authError || !authData.user) {
    return { error: authError?.message || "Failed to create candidate account", code: "AUTH_ERROR" };
  }

  const newUserId = authData.user.id;

  // Resolve department_id and link profile
  const { data: deptRow } = await supabase
    .from("departments")
    .select("id")
    .or(`name.eq.${department},code.eq.${department}`)
    .maybeSingle();

  await supabase
    .from("profiles")
    .update({
      department,
      department_id: deptRow ? deptRow.id : null,
      phone: phone || null,
    })
    .eq("id", newUserId);

  // If a schedule was specified, assign the candidate immediately
  if (scheduleId) {
    await supabase.from("exam_assignments").insert({
      candidate_id: newUserId,
      schedule_id: scheduleId,
      status: "assigned",
      assigned_at: new Date().toISOString(),
    });
  }

  await logAuditEvent({
    userId: user.id,
    action: "STUDENT_CREATED",
    entityType: "profiles",
    entityId: newUserId,
    details: { fullName, email, department, scheduleId },
  });

  revalidatePath("/admin/students");
  revalidatePath("/admin/departments");
  revalidatePath("/admin/users");

  return { success: true, data: { id: newUserId } };
}

export interface BulkStudentRowError {
  rowNumber?: number;
  email?: string;
  fullName?: string;
  error: string;
}

export interface BulkImportResult {
  success: boolean;
  totalProcessed: number;
  createdCount: number;
  skippedCount: number;
  updatedCount: number;
  failedCount: number;
  errors: BulkStudentRowError[];
}

/**
 * Bulk creates candidate accounts from imported CSV records.
 */
export async function bulkCreateStudentsAction(
  students: BulkStudentItemInput[],
  conflictStrategy: "skip" | "overwrite" = "skip"
): Promise<{ success: boolean; error?: string; code?: string; data?: BulkImportResult }> {
  const user = await requireRole(["admin"]);

  const validation = bulkCreateStudentsSchema.safeParse({ students, conflictStrategy });
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || "Validation failed on bulk payload",
      code: "VALIDATION_ERROR",
    };
  }

  const supabase = createAdminClient();

  // 1. Preload departments to resolve department_id efficiently
  const { data: deptRows } = await supabase
    .from("departments")
    .select("id, name, code");

  const deptLookup = new Map<string, string>();
  for (const d of deptRows || []) {
    deptLookup.set(d.name.toLowerCase().trim(), d.id);
    if (d.code) {
      deptLookup.set(d.code.toLowerCase().trim(), d.id);
    }
  }

  let createdCount = 0;
  let skippedCount = 0;
  let updatedCount = 0;
  let failedCount = 0;
  const errors: BulkStudentRowError[] = [];

  // Process rows sequentially to avoid auth provider rate limit spikes
  for (let i = 0; i < students.length; i++) {
    const row = students[i];
    const rowNumber = i + 1;
    const cleanEmail = row.email.toLowerCase().trim();
    const cleanDept = row.department.trim();
    const resolvedDeptId = deptLookup.get(cleanDept.toLowerCase()) || null;
    const initialPassword = row.password && row.password.length >= 6
      ? row.password
      : `KluCandidate@${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: cleanEmail,
        password: initialPassword,
        email_confirm: true,
        user_metadata: {
          full_name: row.fullName.trim(),
          role: "candidate",
          department: cleanDept,
          phone: row.phone || null,
          registration_no: row.registrationNo || null,
        },
      });

      if (authError) {
        const isDuplicate =
          authError.message.toLowerCase().includes("already registered") ||
          authError.message.toLowerCase().includes("already exists") ||
          authError.message.toLowerCase().includes("duplicate");

        if (isDuplicate) {
          if (conflictStrategy === "skip") {
            skippedCount++;
            continue;
          } else {
            // Overwrite: look up profile and update
            const { data: existingUser } = await supabase
              .from("profiles")
              .select("id")
              .eq("full_name", row.fullName.trim())
              .maybeSingle();

            if (existingUser) {
              await supabase
                .from("profiles")
                .update({
                  department: cleanDept,
                  department_id: resolvedDeptId,
                  phone: row.phone || null,
                })
                .eq("id", existingUser.id);
              updatedCount++;
              continue;
            } else {
              skippedCount++;
              continue;
            }
          }
        }

        failedCount++;
        errors.push({
          rowNumber,
          email: cleanEmail,
          fullName: row.fullName,
          error: authError.message,
        });
        continue;
      }

      if (authData?.user) {
        const newUserId = authData.user.id;

        // Ensure candidate profile has department, department_id, and phone recorded
        await supabase
          .from("profiles")
          .update({
            department: cleanDept,
            department_id: resolvedDeptId,
            phone: row.phone || null,
          })
          .eq("id", newUserId);

        // If schedule specified, assign candidate
        if (row.scheduleId) {
          await supabase.from("exam_assignments").insert({
            candidate_id: newUserId,
            schedule_id: row.scheduleId,
            status: "assigned",
            assigned_at: new Date().toISOString(),
          });
        }

        createdCount++;
      }
    } catch (err: unknown) {
      failedCount++;
      errors.push({
        rowNumber,
        email: cleanEmail,
        fullName: row.fullName,
        error: err instanceof Error ? err.message : "Unexpected account provisioning failure",
      });
    }
  }

  // Audit event
  await logAuditEvent({
    userId: user.id,
    action: "BULK_STUDENTS_IMPORTED",
    entityType: "profiles",
    details: {
      totalProcessed: students.length,
      createdCount,
      skippedCount,
      updatedCount,
      failedCount,
      conflictStrategy,
    },
  });

  revalidatePath("/admin/students");
  revalidatePath("/admin/departments");
  revalidatePath("/admin/users");

  return {
    success: true,
    data: {
      success: true,
      totalProcessed: students.length,
      createdCount,
      skippedCount,
      updatedCount,
      failedCount,
      errors,
    },
  };
}
