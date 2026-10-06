"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  assignCandidatesToScheduleAction,
  enrollDepartmentInScheduleAction,
  reassignStudentDepartmentAction,
  bulkReassignStudentsDepartmentAction,
  removeCandidateAssignmentAction,
  resetCandidateAttemptAction,
  createStudentAction,
  bulkCreateStudentsAction,
} from "@/app/actions/students";
import {
  BulkUploadModal,
} from "@/components/shared/bulk-upload-modal";
import {
  GraduationCap,
  Calendar,
  Building2,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  PlusCircle,
  Clock,
  Printer,
  CheckSquare,
  Square,
  RefreshCw,
  Trash2,
  BookOpen,
  Edit2,
  Upload,
  MonitorOff,
  ExternalLink,
  ShieldAlert,
  AlertOctagon,
  AlertTriangle,
} from "lucide-react";

export interface CandidateAssignment {
  id: string;
  scheduleId: string;
  examTitle: string;
  startAt: string;
  durationMinutes: number;
  proctoringLevel: string;
  status: "assigned" | "started" | "submitted" | "graded" | "absent";
  assignedAt: string;
  startedAt?: string | null;
  submittedAt?: string | null;
  riskScore?: number;
  fullscreenExits?: number;
  tabSwitches?: number;
  totalFlags?: number;
  flags?: Array<{
    type: string;
    message?: string;
    timestamp: string;
    reason?: string;
    issuedBy?: string;
  }>;
}

export interface StudentItem {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  department: string;
  isActive: boolean;
  createdAt: string;
  assignments: CandidateAssignment[];
}

export interface ScheduleOption {
  id: string;
  examId: string;
  examTitle: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  proctoringLevel: string;
  maxCandidates: number | null;
  status: string;
}

export interface DepartmentOption {
  id: string;
  name: string;
  code?: string | null;
}

interface Props {
  initialStudents: StudentItem[];
  availableSchedules: ScheduleOption[];
  availableDepartments: DepartmentOption[];
  universityName: string;
}

export function StudentsClient({
  initialStudents,
  availableSchedules,
  availableDepartments,
  universityName,
}: Props) {
  const router = useRouter();

  // State
  const [students, setStudents] = useState<StudentItem[]>(initialStudents);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Messages & Loading
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkExamModalOpen, setIsBulkExamModalOpen] = useState(false);
  const [isBulkDeptModalOpen, setIsBulkDeptModalOpen] = useState(false);
  const [isDeptEnrollModalOpen, setIsDeptEnrollModalOpen] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [reassignCandidate, setReassignCandidate] = useState<StudentItem | null>(null);
  const [hallTicketStudent, setHallTicketStudent] = useState<StudentItem | null>(null);
  const [detailStudent, setDetailStudent] = useState<StudentItem | null>(null);

  // Filtered Students
  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      s.fullName.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q);

    const matchesDept = departmentFilter === "all" || s.department === departmentFilter;

    let matchesStatus = true;
    if (statusFilter === "unassigned") {
      matchesStatus = s.assignments.length === 0;
    } else if (statusFilter === "assigned") {
      matchesStatus = s.assignments.some((a) => a.status === "assigned");
    } else if (statusFilter === "started") {
      matchesStatus = s.assignments.some((a) => a.status === "started");
    } else if (statusFilter === "submitted") {
      matchesStatus = s.assignments.some((a) => a.status === "submitted" || a.status === "graded");
    } else if (statusFilter === "surveillance_flagged") {
      matchesStatus = s.assignments.some((a) => (a.totalFlags || 0) > 0 || (a.riskScore || 0) > 0);
    } else if (statusFilter === "fullscreen_violators") {
      matchesStatus = s.assignments.some((a) => (a.fullscreenExits || 0) > 0);
    } else if (statusFilter === "tab_switchers") {
      matchesStatus = s.assignments.some((a) => (a.tabSwitches || 0) > 0);
    }

    return matchesSearch && matchesDept && matchesStatus;
  });

  // Selection toggles
  function toggleSelectAll() {
    if (selectedIds.length === filteredStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map((s) => s.id));
    }
  }

  function toggleSelectOne(id: string) {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  }

  // 1. Bulk Assign to Exam Schedule
  async function handleBulkAssignExam(scheduleId: string) {
    if (selectedIds.length === 0 || !scheduleId) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await assignCandidatesToScheduleAction(selectedIds, scheduleId);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        const schedule = availableSchedules.find((sch) => sch.id === scheduleId);
        const assignedCount = (res.data as { assignedCount: number })?.assignedCount || selectedIds.length;
        setSuccessMessage(`Successfully allocated ${assignedCount} candidate(s) to "${schedule?.examTitle || 'examination'}".`);
        setIsBulkExamModalOpen(false);
        setSelectedIds([]);
        router.refresh();
      }
    } catch {
      setErrorMessage("Failed to assign candidates to exam. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // 2. 1-Click Department-Wide Exam Enrollment
  async function handleDepartmentEnroll(deptName: string, scheduleId: string) {
    if (!deptName || !scheduleId) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await enrollDepartmentInScheduleAction(deptName, scheduleId);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        const schedule = availableSchedules.find((sch) => sch.id === scheduleId);
        const enrolledCount = (res.data as { enrolledCount: number })?.enrolledCount || 0;
        setSuccessMessage(`Enrolled ${enrolledCount} candidate(s) from "${deptName}" into "${schedule?.examTitle}".`);
        setIsDeptEnrollModalOpen(false);
        router.refresh();
      }
    } catch {
      setErrorMessage("Failed to enroll department. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // 3. Bulk Move to Department
  async function handleBulkMoveDepartment(newDepartment: string) {
    if (selectedIds.length === 0 || !newDepartment) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await bulkReassignStudentsDepartmentAction(selectedIds, newDepartment);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setStudents((prev) =>
          prev.map((s) => (selectedIds.includes(s.id) ? { ...s, department: newDepartment } : s))
        );
        setSuccessMessage(`Successfully moved ${selectedIds.length} candidate(s) to "${newDepartment}".`);
        setIsBulkDeptModalOpen(false);
        setSelectedIds([]);
        router.refresh();
      }
    } catch {
      setErrorMessage("Failed to reassign department. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // 4. Single Candidate Reassign Department
  async function handleSingleReassignDepartment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reassignCandidate) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData(event.currentTarget);
    const newDept = formData.get("department") as string;

    try {
      const res = await reassignStudentDepartmentAction(reassignCandidate.id, newDept);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setStudents((prev) =>
          prev.map((s) => (s.id === reassignCandidate.id ? { ...s, department: newDept } : s))
        );
        setSuccessMessage(`Updated department for ${reassignCandidate.fullName} to "${newDept}".`);
        setReassignCandidate(null);
        router.refresh();
      }
    } catch {
      setErrorMessage("Failed to update department. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // 5. Remove Candidate from Exam Session
  async function handleRemoveAssignment(assignmentId: string, candidateId: string) {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await removeCandidateAssignmentAction(assignmentId);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setStudents((prev) =>
          prev.map((s) =>
            s.id === candidateId
              ? { ...s, assignments: s.assignments.filter((a) => a.id !== assignmentId) }
              : s
          )
        );
        if (detailStudent && detailStudent.id === candidateId) {
          setDetailStudent({
            ...detailStudent,
            assignments: detailStudent.assignments.filter((a) => a.id !== assignmentId),
          });
        }
        setSuccessMessage("Removed exam assignment successfully.");
        router.refresh();
      }
    } catch {
      setErrorMessage("Failed to remove assignment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // 6. Reset Interrupted Attempt
  async function handleResetAttempt(assignmentId: string, candidateId: string) {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await resetCandidateAttemptAction(assignmentId);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setStudents((prev) =>
          prev.map((s) =>
            s.id === candidateId
              ? {
                  ...s,
                  assignments: s.assignments.map((a) =>
                    a.id === assignmentId ? { ...a, status: "assigned", startedAt: null } : a
                  ),
                }
              : s
          )
        );
        if (detailStudent && detailStudent.id === candidateId) {
          setDetailStudent({
            ...detailStudent,
            assignments: detailStudent.assignments.map((a) =>
              a.id === assignmentId ? { ...a, status: "assigned", startedAt: null } : a
            ),
          });
        }
        setSuccessMessage("Candidate examination attempt reset. Candidate may now relaunch the test.");
        router.refresh();
      }
    } catch {
      setErrorMessage("Failed to reset attempt. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // 7. Add Student Direct Modal
  async function handleCreateStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData(event.currentTarget);
    const fullName = formData.get("fullName") as string;
    const department = formData.get("department") as string;

    try {
      const res = await createStudentAction(formData);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage(`Candidate account "${fullName}" created successfully in "${department}".`);
        setIsAddModalOpen(false);
        router.refresh();
      }
    } catch {
      setErrorMessage("Failed to create candidate. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 max-w-full">
      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-700 hover:text-red-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Actions Toolbar Container */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Inner Search Input */}
        <div className="flex-1 bg-slate-50/70 border border-slate-200/80 rounded-lg px-3 py-2 flex items-center gap-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-purple-600 focus-within:border-transparent transition-all">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidates by full name, email, or candidate ID..."
            className="w-full text-xs text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-slate-400 hover:text-slate-600 text-xs font-medium"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-2.5 py-2 text-xs rounded-lg border border-slate-200/80 bg-slate-50/70 focus:bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all"
          >
            <option value="all">All Departments ({availableDepartments.length})</option>
            {availableDepartments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name} {d.code ? `(${d.code})` : ""}
              </option>
            ))}
          </select>

          {/* Allocation & Surveillance Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-2 text-xs rounded-lg border border-slate-200/80 bg-slate-50/70 focus:bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all"
          >
            <option value="all">All Allocations</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Pending (Unassigned)</option>
            <option value="started">In Progress</option>
            <option value="submitted">Submitted / Completed</option>
            <option value="surveillance_flagged">Surveillance Flagged</option>
            <option value="fullscreen_violators">Fullscreen Exits</option>
            <option value="tab_switchers">Tab Switches</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setIsBulkImportModalOpen(true);
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-purple-700" />
            <span>Bulk CSV Import</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsDeptEnrollModalOpen(true);
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className="px-3.5 py-2 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 font-semibold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Building2 className="w-3.5 h-3.5 text-purple-700" />
            <span>Enroll Dept</span>
          </button>

          <button
            onClick={() => {
              setIsAddModalOpen(true);
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className="px-3.5 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      {/* Bulk Action Bar (Visible when candidates are selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-purple-900 text-white p-2.5 rounded-xl shadow-md flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-700 font-mono font-extrabold text-xs">
              {selectedIds.length} Selected
            </span>
            <span className="text-xs text-purple-200 font-medium">
              Actions for selected candidates:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBulkExamModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 font-semibold text-xs text-white shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Assign Exam Session</span>
            </button>

            <button
              type="button"
              onClick={() => setIsBulkDeptModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs text-white shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Move Department</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 rounded-lg border border-purple-700 hover:bg-purple-800 font-semibold text-xs text-purple-300 transition-colors cursor-pointer"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* Candidates Roster Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
        {filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-700 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="p-1 text-slate-400 hover:text-purple-700 transition-colors"
                      title={selectedIds.length === filteredStudents.length ? "Deselect All" : "Select All"}
                    >
                      {selectedIds.length === filteredStudents.length && filteredStudents.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-purple-700" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4">Candidate Profile</th>
                  <th className="py-3 px-4">Department / Program</th>
                  <th className="py-3 px-4">Allocated Exam Session</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => {
                  const isChecked = selectedIds.includes(s.id);
                  const activeAssignment = s.assignments[0];

                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isChecked ? "bg-purple-50/30" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => toggleSelectOne(s.id)}
                          className="p-1 text-slate-400 hover:text-purple-700 transition-colors cursor-pointer"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-purple-700" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0 border border-purple-100">
                            {s.fullName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => setDetailStudent(s)}
                              className="font-bold text-slate-900 hover:text-purple-700 transition-colors text-left block"
                            >
                              {s.fullName}
                            </button>
                            <span className="text-[11px] text-slate-400 font-mono block mt-0.5">{s.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800 line-clamp-1 max-w-[200px]">
                            {s.department || "General"}
                          </span>
                          <button
                            onClick={() => setReassignCandidate(s)}
                            title="Change Department"
                            className="p-1 text-slate-400 hover:text-purple-700 rounded-md transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {activeAssignment ? (
                          <div>
                            <span className="font-bold text-slate-900 block text-xs">
                              {activeAssignment.examTitle}
                            </span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {new Date(activeAssignment.startAt).toLocaleString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              <span>• {activeAssignment.durationMinutes}m</span>
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500">
                            Not Allocated
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {activeAssignment ? (
                          <div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-extrabold border capitalize ${
                                activeAssignment.status === "assigned"
                                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                                  : activeAssignment.status === "started"
                                  ? "bg-amber-50 border-amber-200 text-amber-700"
                                  : activeAssignment.status === "submitted" || activeAssignment.status === "graded"
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                  : "bg-slate-100 border-slate-200 text-slate-700"
                              }`}
                            >
                              {activeAssignment.status}
                            </span>

                            {/* Granular Separate Flag Badges */}
                            {((activeAssignment.fullscreenExits || 0) > 0 || (activeAssignment.tabSwitches || 0) > 0) && (
                              <div className="flex items-center justify-center gap-1 mt-1.5 flex-wrap">
                                {(activeAssignment.fullscreenExits || 0) > 0 && (
                                  <span
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200"
                                    title={`Candidate exited fullscreen perimeter ${activeAssignment.fullscreenExits} time(s)`}
                                  >
                                    <MonitorOff className="w-2.5 h-2.5" />
                                    <span>{activeAssignment.fullscreenExits} FS</span>
                                  </span>
                                )}

                                {(activeAssignment.tabSwitches || 0) > 0 && (
                                  <span
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
                                    title={`Candidate switched tabs / blurred window ${activeAssignment.tabSwitches} time(s)`}
                                  >
                                    <ExternalLink className="w-2.5 h-2.5" />
                                    <span>{activeAssignment.tabSwitches} Tab</span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                            Pending
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDetailStudent(s)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 font-semibold text-xs transition-colors"
                          >
                            Detail ↗
                          </button>

                          <button
                            type="button"
                            onClick={() => setHallTicketStudent(s)}
                            title="View / Print Hall Ticket"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-xs text-slate-500">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mx-auto mb-2 border border-purple-100">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="font-bold text-slate-800">
              {searchQuery ? "No matching candidates found" : "No Registered Candidates Found"}
            </div>
            <div className="text-slate-400 mt-0.5">
              {searchQuery
                ? `No candidates match "${searchQuery}". Clear your search query to see all candidates.`
                : "Upload candidates via CSV or enroll candidates individually using the toolbar above."}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Bulk Assign to Exam Schedule */}
      {isBulkExamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Calendar className="w-4 h-4 text-purple-700" />
                <span>Assign {selectedIds.length} Candidate(s) to Exam</span>
              </div>
              <button
                onClick={() => setIsBulkExamModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleBulkAssignExam(formData.get("scheduleId") as string);
              }}
              className="space-y-4 pt-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Exam Delivery Session *
                </label>
                <select
                  name="scheduleId"
                  required
                  defaultValue=""
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 font-medium"
                >
                  <option value="" disabled>
                    Select an active examination session...
                  </option>
                  {availableSchedules.map((sch) => (
                    <option key={sch.id} value={sch.id}>
                      {sch.examTitle} — {new Date(sch.startAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} ({sch.durationMinutes}m)
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-lg bg-purple-50/70 border border-purple-100 text-xs text-purple-900 space-y-1">
                <div className="font-bold">Automatic Duplicate Prevention</div>
                <div className="text-[11px] text-purple-700">
                  Any candidate already assigned to this session will be safely preserved without creating duplicates.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBulkExamModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Allocating..." : "Confirm Allocation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: 1-Click Department-Wide Exam Enrollment */}
      {isDeptEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Building2 className="w-4 h-4 text-purple-700" />
                <span>1-Click Department Enrollment</span>
              </div>
              <button
                onClick={() => setIsDeptEnrollModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleDepartmentEnroll(
                  formData.get("departmentName") as string,
                  formData.get("scheduleId") as string
                );
              }}
              className="space-y-4 pt-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Academic Department Cohort *
                </label>
                <select
                  name="departmentName"
                  required
                  defaultValue=""
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 font-medium"
                >
                  <option value="" disabled>
                    Select Department to enroll...
                  </option>
                  {availableDepartments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name} {d.code ? `(${d.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Examination Delivery Session *
                </label>
                <select
                  name="scheduleId"
                  required
                  defaultValue=""
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 font-medium"
                >
                  <option value="" disabled>
                    Select Exam Schedule Session...
                  </option>
                  {availableSchedules.map((sch) => (
                    <option key={sch.id} value={sch.id}>
                      {sch.examTitle} — {new Date(sch.startAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                All candidates enrolled in the chosen department will be linked to this entrance session immediately.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDeptEnrollModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Enrolling..." : "Enroll Whole Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Bulk Move to Department */}
      {isBulkDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Building2 className="w-4 h-4 text-indigo-700" />
                <span>Move {selectedIds.length} Candidate(s)</span>
              </div>
              <button
                onClick={() => setIsBulkDeptModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleBulkMoveDepartment(formData.get("department") as string);
              }}
              className="space-y-4 pt-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Destination Department *
                </label>
                <select
                  name="department"
                  required
                  defaultValue=""
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900 font-medium"
                >
                  <option value="" disabled>
                    Select destination department...
                  </option>
                  {availableDepartments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name} {d.code ? `(${d.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBulkDeptModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Moving..." : "Reassign Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Single Reassign Department */}
      {reassignCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Building2 className="w-4 h-4 text-purple-700" />
                <span>Reassign Department for {reassignCandidate.fullName}</span>
              </div>
              <button
                onClick={() => setReassignCandidate(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSingleReassignDepartment} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Current Department: <span className="text-slate-500 font-normal">{reassignCandidate.department}</span>
                </label>
                <select
                  name="department"
                  required
                  defaultValue={reassignCandidate.department}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 font-medium"
                >
                  {availableDepartments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name} {d.code ? `(${d.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReassignCandidate(null)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : "Update Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Student Deep-Dive Detail Drawer */}
      {detailStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-2xl p-6 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100 font-bold text-xs">
                  {detailStudent.fullName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">{detailStudent.fullName}</h3>
                  <span className="text-[11px] text-slate-400 font-mono">{detailStudent.email}</span>
                </div>
              </div>
              <button
                onClick={() => setDetailStudent(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5 pt-4 text-xs">
              {/* Profile Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50/70 p-3.5 rounded-lg border border-slate-200/80">
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Department</span>
                  <span className="font-bold text-slate-800">{detailStudent.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Candidate ID</span>
                  <span className="font-mono text-slate-800 text-[11px]">{detailStudent.id.slice(0, 12)}...</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Enrolled Date</span>
                  <span className="text-slate-800">{new Date(detailStudent.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Exam Allocation List */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-purple-700" />
                    <span>Allocated Examination Sessions ({detailStudent.assignments.length})</span>
                  </h4>
                </div>

                {detailStudent.assignments.length > 0 ? (
                  <div className="space-y-2.5">
                    {detailStudent.assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="p-3.5 rounded-lg border border-slate-200/80 bg-white hover:border-purple-200 transition-colors space-y-3 shadow-2xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs">
                                {assignment.examTitle}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-extrabold border capitalize ${
                                  assignment.status === "assigned"
                                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                                    : assignment.status === "started"
                                    ? "bg-amber-50 border-amber-200 text-amber-700"
                                    : "bg-emerald-50 border-emerald-200 text-emerald-700"
                                }`}
                              >
                                {assignment.status}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2.5 mt-1">
                              <span>
                                Window: {new Date(assignment.startAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </span>
                              <span>•</span>
                              <span>Duration: {assignment.durationMinutes}m</span>
                              <span>•</span>
                              <span className="capitalize">{assignment.proctoringLevel} Proctoring</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {assignment.status === "started" && (
                              <button
                                onClick={() => handleResetAttempt(assignment.id, detailStudent.id)}
                                disabled={isSubmitting}
                                title="Reset Interrupted Attempt"
                                className="px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Reset Attempt</span>
                              </button>
                            )}

                            {assignment.status === "assigned" && (
                              <button
                                onClick={() => handleRemoveAssignment(assignment.id, detailStudent.id)}
                                disabled={isSubmitting}
                                title="Remove Assignment"
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Separate Surveillance & Anti-Cheat Summary Block */}
                        {((assignment.fullscreenExits || 0) > 0 || (assignment.tabSwitches || 0) > 0 || (assignment.riskScore || 0) > 0) && (
                          <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                              <span className="flex items-center gap-1">
                                <ShieldAlert className="w-3.5 h-3.5 text-purple-700" />
                                <span>Surveillance Incident Telemetry</span>
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                (assignment.riskScore || 0) >= 60
                                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                                  : (assignment.riskScore || 0) >= 30
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              }`}>
                                Risk: {assignment.riskScore || 0}%
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                              <div className="p-2 rounded-lg bg-white border border-rose-200 flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-rose-900 font-semibold text-[11px]">
                                  <MonitorOff className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Fullscreen Exits</span>
                                </span>
                                <span className="font-extrabold text-rose-700 text-xs">
                                  {assignment.fullscreenExits || 0}
                                </span>
                              </div>

                              <div className="p-2 rounded-lg bg-white border border-amber-200 flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-amber-900 font-semibold text-[11px]">
                                  <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Tab / Focus Switches</span>
                                </span>
                                <span className="font-extrabold text-amber-700 text-xs">
                                  {assignment.tabSwitches || 0}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center border border-dashed border-slate-200 rounded-lg">
                    <p className="text-xs text-slate-400">
                      No examinations currently allocated to this candidate.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-5">
              <button
                type="button"
                onClick={() => setDetailStudent(null)}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Hall Ticket / Admit Card Preview */}
      {hallTicketStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-xl p-6 sm:p-7 animate-in zoom-in-95 duration-150">
            {/* Printable Hall Ticket Pass */}
            <div className="border-2 border-slate-900 rounded-xl p-5 relative overflow-hidden bg-white text-slate-900">
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 mb-4">
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                    Official Examination Admit Pass
                  </div>
                  <h2 className="text-base font-extrabold tracking-tight mt-0.5">{universityName}</h2>
                  <div className="text-xs text-slate-600">Entrance & Research Examination Board</div>
                </div>
                <div className="w-10 h-10 rounded-lg border border-slate-900 flex items-center justify-center font-extrabold text-xs font-mono">
                  PASS
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs mb-5">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Candidate Full Name</span>
                  <span className="font-extrabold text-slate-900 text-sm">{hallTicketStudent.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Registration / Roll No.</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {hallTicketStudent.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Academic Department</span>
                  <span className="font-semibold text-slate-800">{hallTicketStudent.department}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Registered Email</span>
                  <span className="font-mono text-slate-800">{hallTicketStudent.email}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-3 mb-3">
                <span className="text-[10px] font-extrabold uppercase text-slate-500 block mb-2">
                  Allocated Examination Sessions
                </span>
                {hallTicketStudent.assignments.length > 0 ? (
                  hallTicketStudent.assignments.map((a) => (
                    <div key={a.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs mb-2">
                      <div className="font-bold text-slate-900">{a.examTitle}</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Slot: {new Date(a.startAt).toLocaleString()} ({a.durationMinutes} Minutes)
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-amber-700 italic">No examination session scheduled yet.</div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-2.5 text-[10px] text-slate-500 flex items-center justify-between">
                <span>SafeExam Pro Lockdown Browser Protocol Required</span>
                <span className="font-mono font-bold">VALIDATED</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5 text-purple-700" />
                <span>Print Admit Card</span>
              </button>

              <button
                type="button"
                onClick={() => setHallTicketStudent(null)}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: Direct Candidate Creation */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <PlusCircle className="w-4 h-4 text-purple-700" />
                <span>Add Entrance Candidate</span>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  placeholder="e.g. Jonathan Edwards"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Candidate Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="jonathan@student.edu"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Initial Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={8}
                    placeholder="Min 8 characters"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Academic Department *
                  </label>
                  <select
                    name="department"
                    required
                    defaultValue=""
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 font-medium"
                  >
                    <option value="" disabled>
                      Select Department...
                    </option>
                    {availableDepartments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name} {d.code ? `(${d.code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contact Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Immediate Exam Session Allocation (Optional)
                </label>
                <select
                  name="scheduleId"
                  defaultValue=""
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 font-medium"
                >
                  <option value="">Do not allocate immediately (Leave unassigned)</option>
                  {availableSchedules.map((sch) => (
                    <option key={sch.id} value={sch.id}>
                      {sch.examTitle} ({new Date(sch.startAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Creating..." : "Save & Enroll Candidate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Candidate CSV Import Modal */}
      <BulkUploadModal
        isOpen={isBulkImportModalOpen}
        onClose={() => setIsBulkImportModalOpen(false)}
        title="Bulk Import Candidates"
        entityName="Candidates"
        description="Upload a CSV spreadsheet to onboard entrance examinees and assign programs in bulk."
        templateFileName="candidates_bulk_import_template.csv"
        columns={[
          { key: "fullName", label: "Full Name", sample: "Aarav Sharma", required: true },
          { key: "email", label: "Email Address", sample: "aarav.sharma@klu.ac.in", required: true },
          { key: "department", label: "Department / Program", sample: "MCA", required: true },
          { key: "phone", label: "Phone Number", sample: "+91 98765 43210", required: false },
          { key: "registrationNo", label: "Registration No", sample: "KLU2026-MCA-001", required: false },
          { key: "password", label: "Default Password", sample: "Candidate@2026", required: false },
        ]}
        validateRow={(row) => {
          const errors: string[] = [];
          const fullName = row.fullName?.trim() || "";
          const email = row.email?.trim() || "";
          const department = row.department?.trim() || "";

          if (!fullName || fullName.length < 2) {
            errors.push("Full Name must be at least 2 characters");
          }
          if (!email || !email.includes("@") || !email.includes(".")) {
            errors.push("Valid email address is required");
          }
          if (!department || department.length < 2) {
            errors.push("Department or discipline code is required");
          }

          return {
            isValid: errors.length === 0,
            errors,
            parsed: errors.length === 0 ? {
              fullName,
              email,
              department,
              phone: row.phone?.trim() || undefined,
              registrationNo: row.registrationNo?.trim() || undefined,
              password: row.password?.trim() || undefined,
            } : undefined,
          };
        }}
        onExecuteImport={async (validItems, strategy) => {
          const res = await bulkCreateStudentsAction(validItems, strategy);
          return {
            success: res.success,
            error: res.error,
            data: res.data,
          };
        }}
        onSuccess={(result) => {
          setSuccessMessage(
            `Bulk import complete: ${result.createdCount} candidate(s) created, ${result.skippedCount} skipped, ${result.failedCount} failed.`
          );
          router.refresh();
        }}
      />
    </div>
  );
}
