import { requireRole } from "@/lib/auth/rbac";
import { createAdminClient } from "@/lib/supabase/server";
import { getUniversitySettings } from "@/lib/settings";
import {
  StudentsClient,
  StudentItem,
  ScheduleOption,
  DepartmentOption,
  CandidateAssignment,
} from "@/components/admin/students-client";

export default async function StudentsPage() {
  await requireRole(["admin"]);
  const adminClient = createAdminClient();
  const settings = await getUniversitySettings();

  // 1. Fetch candidate profiles
  const { data: rawProfiles } = await adminClient
    .from("profiles")
    .select("id, full_name, role, department, phone, is_active, created_at")
    .eq("role", "candidate")
    .order("created_at", { ascending: false });

  interface RawProfile {
    id: string;
    full_name: string;
    role: string;
    department: string | null;
    phone: string | null;
    is_active: boolean;
    created_at: string;
  }

  const typedProfiles = (rawProfiles || []) as RawProfile[];
  const candidateIds = typedProfiles.map((p) => p.id);

  // 2. Fetch candidate emails from auth.users
  const { data: authUsers } = await adminClient.auth.admin.listUsers();
  const emailMap = new Map<string, string>(
    (authUsers?.users || []).map((u: { id: string; email?: string }) => [u.id, u.email || ""])
  );

  // 3. Fetch exams to get titles
  const { data: rawExams } = await adminClient
    .from("exams")
    .select("id, title");

  interface RawExam {
    id: string;
    title: string;
  }
  const examMap = new Map<string, string>(
    ((rawExams || []) as RawExam[]).map((e) => [e.id, e.title])
  );

  // 4. Fetch exam schedules
  const { data: rawSchedules } = await adminClient
    .from("exam_schedules")
    .select("id, exam_id, start_at, end_at, duration_minutes, proctoring_level, max_candidates, status")
    .order("start_at", { ascending: true });

  interface RawSchedule {
    id: string;
    exam_id: string;
    start_at: string;
    end_at: string;
    duration_minutes: number;
    proctoring_level: string;
    max_candidates: number | null;
    status: string;
  }

  const typedSchedules = (rawSchedules || []) as RawSchedule[];
  const scheduleLookup = new Map<string, RawSchedule>(
    typedSchedules.map((s) => [s.id, s])
  );

  const availableSchedules: ScheduleOption[] = typedSchedules.map((s) => ({
    id: s.id,
    examId: s.exam_id,
    examTitle: examMap.get(s.exam_id) || "Examination Session",
    startAt: s.start_at,
    endAt: s.end_at,
    durationMinutes: s.duration_minutes,
    proctoringLevel: s.proctoring_level,
    maxCandidates: s.max_candidates,
    status: s.status,
  }));

  // 5. Fetch assignments for all candidates
  let rawAssignments: unknown[] = [];
  if (candidateIds.length > 0) {
    const { data: assignmentsData } = await adminClient
      .from("exam_assignments")
      .select("id, schedule_id, candidate_id, status, assigned_at, started_at, submitted_at")
      .in("candidate_id", candidateIds);
    rawAssignments = assignmentsData || [];
  }

  interface RawAssignment {
    id: string;
    schedule_id: string;
    candidate_id: string;
    status: "assigned" | "started" | "submitted" | "graded" | "absent";
    assigned_at: string;
    started_at: string | null;
    submitted_at: string | null;
  }

  const typedAssignments = (rawAssignments || []) as RawAssignment[];
  const assignmentIds = typedAssignments.map((a) => a.id);

  // 5.1 Fetch proctoring sessions for these assignments
  interface RawProctorSession {
    assignment_id: string;
    risk_score: number;
    flags: Array<{
      type: string;
      message?: string;
      timestamp: string;
      reason?: string;
      issuedBy?: string;
    }>;
  }

  let rawProctorSessions: RawProctorSession[] = [];
  if (assignmentIds.length > 0) {
    const { data: proctorData } = await adminClient
      .from("proctoring_sessions")
      .select("assignment_id, risk_score, flags")
      .in("assignment_id", assignmentIds);
    rawProctorSessions = (proctorData || []) as RawProctorSession[];
  }

  const proctorMap = new Map<string, RawProctorSession>(
    rawProctorSessions.map((p) => [p.assignment_id, p])
  );

  const assignmentsByCandidate = new Map<string, CandidateAssignment[]>();
  const nowMs = Date.now();

  typedAssignments.forEach((a) => {
    const sch = scheduleLookup.get(a.schedule_id);
    const proc = proctorMap.get(a.id);
    const flagsList = (Array.isArray(proc?.flags) ? proc?.flags : []) as RawProctorSession["flags"];

    let displayStatus = a.status;
    let submittedAt = a.submitted_at;

    if (a.status === "started" && a.started_at && sch) {
      const startedMs = new Date(a.started_at).getTime();
      const durationMs = (sch.duration_minutes || 120) * 60 * 1000;
      const endMs = sch.end_at ? new Date(sch.end_at).getTime() : Number.MAX_SAFE_INTEGER;
      const hardDeadline = Math.min(startedMs + durationMs, endMs);

      if (nowMs >= hardDeadline) {
        displayStatus = "submitted";
        submittedAt = submittedAt || new Date(hardDeadline).toISOString();
      }
    }

    const fsCount = flagsList.filter((f) => f.type === "FULLSCREEN_EXIT").length;
    const tabCount = flagsList.filter((f) => f.type === "TAB_SWITCH" || f.type === "WINDOW_BLUR").length;

    const item: CandidateAssignment = {
      id: a.id,
      scheduleId: a.schedule_id,
      examTitle: sch ? examMap.get(sch.exam_id) || "Entrance Paper" : "Entrance Paper",
      startAt: sch ? sch.start_at : a.assigned_at,
      durationMinutes: sch ? sch.duration_minutes : 120,
      proctoringLevel: sch ? sch.proctoring_level : "standard",
      status: displayStatus,
      assignedAt: a.assigned_at,
      startedAt: a.started_at,
      submittedAt: submittedAt,
      riskScore: proc?.risk_score || 0,
      fullscreenExits: fsCount,
      tabSwitches: tabCount,
      totalFlags: flagsList.length,
      flags: flagsList,
    };

    const currentList = assignmentsByCandidate.get(a.candidate_id) || [];
    currentList.push(item);
    assignmentsByCandidate.set(a.candidate_id, currentList);
  });


  // 6. Fetch departments
  const { data: rawDepts } = await adminClient
    .from("departments")
    .select("id, name, code")
    .order("name", { ascending: true });

  interface RawDept {
    id: string;
    name: string;
    code: string | null;
  }

  const availableDepartments: DepartmentOption[] = ((rawDepts || []) as RawDept[]).map((d) => ({
    id: d.id,
    name: d.name,
    code: d.code,
  }));

  // 7. Assemble students list
  const initialStudents: StudentItem[] = typedProfiles.map((p) => ({
    id: p.id,
    fullName: p.full_name,
    email: emailMap.get(p.id) || "candidate@university.edu",
    phone: p.phone,
    department: p.department || "General",
    isActive: p.is_active,
    createdAt: p.created_at,
    assignments: assignmentsByCandidate.get(p.id) || [],
  }));

  const universityName = settings.name;

  return (
    <StudentsClient
      initialStudents={initialStudents}
      availableSchedules={availableSchedules}
      availableDepartments={availableDepartments}
      universityName={universityName}
    />
  );
}
