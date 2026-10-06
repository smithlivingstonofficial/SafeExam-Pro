"use client";

import { useState, useTransition, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  scheduleExamAction,
  assignCandidatesToScheduleAction,
  bulkAllocateCandidatesToScheduleAction,
} from "@/app/actions/examiner";
import { BulkUploadModal } from "@/components/shared/bulk-upload-modal";
import { CustomDateTimePicker } from "./custom-datetime-picker";
import {
  CalendarCheck,
  PlusCircle,
  Clock,
  ShieldCheck,
  Users,
  Video,
  ChevronRight,
  Calendar,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
  Search,
  UserCheck,
  ArrowRight,
  Upload,
  CalendarClock,
  Layers,
  Sparkles,
  ShieldOff,
  Lock,
  Camera,
  Check,
  Timer,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  BookOpen,
  FileCheck,
  Radio,
  Sliders,
  ChevronsUpDown,
  LayoutList,
  LayoutGrid,
} from "lucide-react";

interface ExamItem {
  id: string;
  title: string;
  description?: string | null;
  status: string;
}

interface Department {
  id: string;
  name: string;
  code: string | null;
}

interface ScheduleItem {
  id: string;
  exam_id: string;
  start_at: string;
  end_at: string;
  duration_minutes: number;
  window_type: string;
  max_candidates?: number | null;
  proctoring_level: string;
  status: string;
  created_at: string;
}

interface CandidateAssignment {
  id: string;
  schedule_id: string;
  candidate_id: string;
  status: string;
  assigned_at: string;
  candidateName?: string;
  candidateEmail?: string;
  departmentName?: string;
}

export interface ExamSectionSummary {
  id: string;
  examId: string;
  title: string;
  scope: string;
  orderIndex: number;
  questionCount: number;
  totalMarks: number;
  correctMarks: number;
  negativeMarks: number;
}

interface ExamScheduleManagerProps {
  schedules: ScheduleItem[];
  availableExams: ExamItem[];
  departments: Department[];
  initialAssignments: CandidateAssignment[];
  candidatePool: Array<{
    id: string;
    fullName: string;
    email: string;
    departmentId?: string | null;
  }>;
  examSections?: ExamSectionSummary[];
}

const PROCTORING_TIERS = [
  {
    id: "none",
    name: "Practice Mode",
    badge: "Open Browser",
    description: "Open browser access. Ideal for diagnostic and mock assessments.",
    icon: ShieldOff,
    accent: "text-sky-700",
    gradientActive: "bg-gradient-to-r from-sky-50 via-white to-blue-50/70 border-sky-300 text-sky-950 shadow-xs ring-1 ring-sky-200/70",
    bannerGradient: "bg-gradient-to-r from-sky-50/80 via-white to-blue-50/40 border-sky-200/80 text-sky-950",
    iconBg: "bg-sky-100 text-sky-700 border-sky-200",
    badgeColor: "bg-sky-50 text-sky-800 border-sky-200/90",
  },
  {
    id: "basic",
    name: "Focus Lock",
    badge: "Lockdown",
    description: "Fullscreen lock with tab-switch & window blur detection.",
    icon: Lock,
    accent: "text-amber-700",
    gradientActive: "bg-gradient-to-r from-amber-50 via-white to-orange-50/70 border-amber-300 text-amber-950 shadow-xs ring-1 ring-amber-200/70",
    bannerGradient: "bg-gradient-to-r from-amber-50/80 via-white to-orange-50/40 border-amber-200/80 text-amber-950",
    iconBg: "bg-amber-100 text-amber-700 border-amber-200",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200/90",
  },
  {
    id: "standard",
    name: "Webcam Proctor",
    badge: "Recommended",
    description: "ID verification with 60s automated webcam snapshots.",
    icon: Camera,
    accent: "text-indigo-700",
    gradientActive: "bg-gradient-to-r from-indigo-50 via-white to-blue-50/70 border-indigo-300 text-indigo-950 shadow-xs ring-1 ring-indigo-200/70",
    bannerGradient: "bg-gradient-to-r from-indigo-50/80 via-white to-blue-50/40 border-indigo-200/80 text-indigo-950",
    iconBg: "bg-indigo-100 text-indigo-700 border-indigo-200",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200/90",
  },
  {
    id: "full",
    name: "Strict AI Proctor",
    badge: "High Security",
    description: "Live AI stream detecting multiple faces, phones & anomalies.",
    icon: ShieldCheck,
    accent: "text-emerald-700",
    gradientActive: "bg-gradient-to-r from-emerald-50 via-white to-teal-50/70 border-emerald-300 text-emerald-950 shadow-xs ring-1 ring-emerald-200/70",
    bannerGradient: "bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/40 border-emerald-200/80 text-emerald-950",
    iconBg: "bg-emerald-100 text-emerald-700 border-emerald-200",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200/90",
  },
];

export function ExamScheduleManager({
  schedules: initialSchedules,
  availableExams,
  departments,
  initialAssignments,
  candidatePool,
  examSections = [],
}: ExamScheduleManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [schedules, setSchedules] = useState<ScheduleItem[]>(initialSchedules);
  const [assignments, setAssignments] = useState<CandidateAssignment[]>(initialAssignments);

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "scheduled" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Modals & Slide-over states
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [showSectionBreakdown, setShowSectionBreakdown] = useState(false);
  const [expandedCardSections, setExpandedCardSections] = useState<Record<string, boolean>>({});
  const [isBulkAllocationModalOpen, setIsBulkAllocationModalOpen] = useState(false);
  const [activeRosterSchedule, setActiveRosterSchedule] = useState<ScheduleItem | null>(null);
  const [scheduleSuccessMessage, setScheduleSuccessMessage] = useState<string | null>(null);


  // Dynamic default dates (tomorrow 10:00 AM - 1:00 PM)
  const formatDateTimeLocal = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Studio Form state
  const [selectedExamId, setSelectedExamId] = useState(availableExams[0]?.id || "");
  const [startAt, setStartAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return formatDateTimeLocal(d);
  });
  const [endAt, setEndAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(13, 0, 0, 0);
    return formatDateTimeLocal(d);
  });
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [windowType, setWindowType] = useState<"fixed" | "flexible">("fixed");
  const [proctoringLevel, setProctoringLevel] = useState("standard");
  const [maxCandidates, setMaxCandidates] = useState<number | "">("");

  // Auto-Enrollment in studio
  const [autoEnrollDeptId, setAutoEnrollDeptId] = useState("all");

  // Studio custom dropdown open states
  const [isBlueprintDropdownOpen, setIsBlueprintDropdownOpen] = useState(false);
  const [isCohortDropdownOpen, setIsCohortDropdownOpen] = useState(false);
  const blueprintDropdownRef = useRef<HTMLDivElement>(null);
  const cohortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        blueprintDropdownRef.current &&
        !blueprintDropdownRef.current.contains(event.target as Node)
      ) {
        setIsBlueprintDropdownOpen(false);
      }
      if (
        cohortDropdownRef.current &&
        !cohortDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCohortDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsBlueprintDropdownOpen(false);
        setIsCohortDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Roster drawer state
  const [targetEnrollDeptId, setTargetEnrollDeptId] = useState("all");
  const [rosterSearch, setRosterSearch] = useState("");

  // Maps
  const examMap = useMemo(() => new Map(availableExams.map((e) => [e.id, e])), [availableExams]);
  const deptMap = useMemo(() => new Map(departments.map((d) => [d.id, d])), [departments]);
  const candidateMap = useMemo(() => new Map(candidatePool.map((c) => [c.id, c])), [candidatePool]);

  // Selected exam & sections
  const selectedExam = examMap.get(selectedExamId);
  const currentExamSections = examSections.filter((s) => s.examId === selectedExamId);
  const totalBlueprintQuestions = currentExamSections.reduce((acc, s) => acc + s.questionCount, 0);
  const totalBlueprintMarks = currentExamSections.reduce((acc, s) => acc + s.totalMarks, 0);

  // Department counts helper
  const getCandidateCountForDept = (deptId: string) => {
    if (deptId === "all") return candidatePool.length;
    return candidatePool.filter((c) => c.departmentId === deptId).length;
  };

  const targetEnrollCount =
    autoEnrollDeptId === "none" ? 0 : getCandidateCountForDept(autoEnrollDeptId);

  const handleSelectDuration = (mins: number) => {
    const validMins = Math.max(15, Math.min(480, mins));
    setDurationMinutes(validMins);
    const start = new Date(startAt);
    if (!isNaN(start.getTime())) {
      if (windowType === "fixed") {
        const end = new Date(start.getTime() + validMins * 60 * 1000);
        setEndAt(formatDateTimeLocal(end));
      } else {
        const currentEnd = new Date(endAt).getTime();
        const minEnd = start.getTime() + validMins * 60 * 1000;
        if (isNaN(currentEnd) || currentEnd < minEnd) {
          const end = new Date(start.getTime() + (validMins + 180) * 60 * 1000);
          setEndAt(formatDateTimeLocal(end));
        }
      }
    }
  };

  const handleStartAtChange = (newStart: string) => {
    setStartAt(newStart);
    const start = new Date(newStart);
    if (!isNaN(start.getTime())) {
      if (windowType === "fixed") {
        const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
        setEndAt(formatDateTimeLocal(end));
      } else {
        const currentEnd = new Date(endAt).getTime();
        const minEnd = start.getTime() + durationMinutes * 60 * 1000;
        if (isNaN(currentEnd) || currentEnd <= minEnd) {
          const end = new Date(start.getTime() + (durationMinutes + 180) * 60 * 1000);
          setEndAt(formatDateTimeLocal(end));
        }
      }
    }
  };

  const handleWindowTypeChange = (type: "fixed" | "flexible") => {
    setWindowType(type);
    const start = new Date(startAt);
    if (!isNaN(start.getTime())) {
      const extraMinutes = type === "flexible" ? 180 : 0;
      const end = new Date(start.getTime() + (durationMinutes + extraMinutes) * 60 * 1000);
      setEndAt(formatDateTimeLocal(end));
    }
  };

  const handleSelectWindowSpanHours = (hours: number) => {
    const start = new Date(startAt);
    if (!isNaN(start.getTime())) {
      const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
      setEndAt(formatDateTimeLocal(end));
    }
  };

  const formatDurationDisplay = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const getStartTimePreview = () => {
    try {
      const d = new Date(startAt);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const getEndTimePreview = () => {
    try {
      const d = new Date(endAt);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const getWindowSpanDetails = () => {
    try {
      const s = new Date(startAt).getTime();
      const e = new Date(endAt).getTime();
      if (e > s) {
        const diffMinutes = Math.round((e - s) / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const remMins = diffMinutes % 60;
        if (diffHours > 0 && remMins > 0) return `${diffHours}h ${remMins}m window`;
        if (diffHours > 0) return `${diffHours}h window`;
        return `${remMins}m window`;
      }
      return "";
    } catch {
      return "";
    }
  };

  // Create schedule handler
  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) return;

    const formData = new FormData();
    formData.append("examId", selectedExamId);
    formData.append("startAt", new Date(startAt).toISOString());
    formData.append("endAt", new Date(endAt).toISOString());
    formData.append("durationMinutes", String(durationMinutes));
    formData.append("windowType", windowType);
    if (maxCandidates) {
      formData.append("maxCandidates", String(maxCandidates));
    }
    formData.append("proctoringLevel", proctoringLevel);

    startTransition(async () => {
      const res = await scheduleExamAction(formData);
      if (res.success && res.data) {
        const newSchId = res.data.id;
        let enrolledCount = 0;

        if (autoEnrollDeptId !== "none") {
          const enrollRes = await assignCandidatesToScheduleAction(
            newSchId,
            autoEnrollDeptId === "all" ? null : autoEnrollDeptId
          );
          if (enrollRes.success && enrollRes.data) {
            enrolledCount = enrollRes.data.assignedCount;
          }
        }

        const newSch: ScheduleItem = {
          id: newSchId,
          exam_id: selectedExamId,
          start_at: new Date(startAt).toISOString(),
          end_at: new Date(endAt).toISOString(),
          duration_minutes: durationMinutes,
          window_type: windowType,
          max_candidates: maxCandidates ? Number(maxCandidates) : null,
          proctoring_level: proctoringLevel,
          status: "scheduled",
          created_at: new Date().toISOString(),
        };

        setSchedules((prev) => [newSch, ...prev]);
        setIsStudioOpen(false);
        setShowSectionBreakdown(false);

        const examTitle = examMap.get(selectedExamId)?.title || "Exam";
        setScheduleSuccessMessage(
          enrolledCount > 0
            ? `Successfully created schedule for "${examTitle}" and auto-enrolled ${enrolledCount} candidates!`
            : `Successfully created examination schedule for "${examTitle}".`
        );

        router.refresh();
      } else {
        alert(res.error || "Failed to schedule exam");
      }
    });
  };

  // 1-Click Cohort Enrollment from Drawer
  const handle1ClickCohortEnroll = async () => {
    if (!activeRosterSchedule) return;

    startTransition(async () => {
      const res = await assignCandidatesToScheduleAction(
        activeRosterSchedule.id,
        targetEnrollDeptId === "all" ? null : targetEnrollDeptId
      );

      if (res.success && res.data) {
        setScheduleSuccessMessage(
          `Successfully assigned ${res.data.assignedCount} candidates to this examination roster.`
        );
        router.refresh();
      } else {
        alert(res.error || "Failed to batch enroll candidates");
      }
    });
  };

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter((sch) => {
      const examTitle = (examMap.get(sch.exam_id)?.title || "").toLowerCase();
      const matchesSearch =
        examTitle.includes(searchQuery.toLowerCase()) ||
        sch.proctoring_level.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sch.window_type.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (statusFilter === "all") return true;
      if (statusFilter === "active") return sch.status === "active";
      if (statusFilter === "scheduled") return sch.status === "scheduled";
      if (statusFilter === "completed") return sch.status === "completed";
      return true;
    });
  }, [schedules, searchQuery, statusFilter, examMap]);

  // Statistics
  const activeSchedulesCount = schedules.filter((s) => s.status === "active").length;
  const upcomingSchedulesCount = schedules.filter((s) => s.status === "scheduled").length;
  const completedSchedulesCount = schedules.filter((s) => s.status === "completed").length;

  // Active roster drawer filtered assignments
  const activeEnrolledAssignments = activeRosterSchedule
    ? assignments.filter((a) => a.schedule_id === activeRosterSchedule.id)
    : [];

  const searchedEnrolledAssignments = activeEnrolledAssignments.filter((a) => {
    if (!rosterSearch) return true;
    const cand = candidateMap.get(a.candidate_id);
    const name = (cand?.fullName || a.candidateName || "").toLowerCase();
    const email = (cand?.email || a.candidateEmail || "").toLowerCase();
    const term = rosterSearch.toLowerCase();
    return name.includes(term) || email.includes(term);
  });

  const toggleCardSections = (schId: string) => {
    setExpandedCardSections((prev) => ({ ...prev, [schId]: !prev[schId] }));
  };

  return (
    <div className="space-y-4 max-w-full">
      {/* Toast Notification */}
      {scheduleSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/90 text-emerald-950 flex items-center justify-between shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">{scheduleSuccessMessage}</span>
          </div>
          <button
            onClick={() => setScheduleSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1 rounded-md hover:bg-emerald-100/70 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4 Clean Metric Cards (Above Search Toolbar) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Active Windows */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500">
              Active Windows
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {activeSchedulesCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {activeSchedulesCount > 0 ? "Live testing sessions" : "No live sessions"}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Upcoming Windows */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500">
              Upcoming Windows
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {upcomingSchedulesCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {completedSchedulesCount} Completed sessions
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center shrink-0">
            <CalendarClock className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Seated Candidates */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500">
              Seated Candidates
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {assignments.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              of {candidatePool.length} in candidate pool
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4: Academic Cohorts */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500">
              Academic Cohorts
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {departments.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Available departments
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Actions Toolbar Container */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Inner Search Input */}
        <div className="flex-1 bg-slate-50/70 border border-slate-200/80 rounded-lg px-3 py-2 flex items-center gap-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-600 focus-within:border-transparent transition-all">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search delivery windows by exam title, format, or proctoring..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-slate-400 hover:text-slate-600 text-xs font-medium cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "scheduled" | "completed")}
            className="px-2.5 py-2 text-xs rounded-lg border border-slate-200/80 bg-slate-50/70 focus:bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all cursor-pointer"
          >
            <option value="all">All Statuses ({schedules.length})</option>
            <option value="active">Active / Live ({activeSchedulesCount})</option>
            <option value="scheduled">Upcoming ({upcomingSchedulesCount})</option>
            <option value="completed">Completed ({completedSchedulesCount})</option>
          </select>

          {/* Import Seating CSV Button */}
          <button
            onClick={() => {
              if (schedules.length > 0) {
                setActiveRosterSchedule(schedules[0]);
                setIsBulkAllocationModalOpen(true);
              } else {
                alert("Please create an exam schedule first before importing seating.");
              }
            }}
            className="px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 font-semibold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all hover:border-slate-300"
            title="Import roll numbers, rooms, and candidate rosters via CSV"
          >
            <Upload className="w-3.5 h-3.5 text-purple-600" />
            <span>Import Seating CSV</span>
          </button>

          {/* Schedule Exam Window CTA */}
          <button
            onClick={() => setIsStudioOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Schedule Exam Window</span>
          </button>
        </div>
      </div>

      {/* Examination Delivery Schedules Roster Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
        {filteredSchedules.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-700 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-28">Status</th>
                  <th className="py-3 px-4">Exam Blueprint</th>
                  <th className="py-3 px-4">Delivery Window</th>
                  <th className="py-3 px-4">Duration & Format</th>
                  <th className="py-3 px-4">Candidates</th>
                  <th className="py-3 px-4">Proctoring</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSchedules.map((sch) => {
                  const examData = examMap.get(sch.exam_id);
                  const startDate = new Date(sch.start_at);
                  const endDate = new Date(sch.end_at);
                  const enrolledForSch = assignments.filter((a) => a.schedule_id === sch.id);
                  const examSecs = examSections.filter((s) => s.examId === sch.exam_id);
                  const totalQCount = examSecs.reduce((acc, s) => acc + s.questionCount, 0);
                  const totalMarks = examSecs.reduce((acc, s) => acc + s.totalMarks, 0);
                  const isLive = sch.status === "active";

                  return (
                    <tr
                      key={sch.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isLive ? "bg-emerald-50/25" : ""
                      }`}
                    >
                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isLive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : sch.status === "completed" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Upcoming
                          </span>
                        )}
                      </td>

                      {/* Exam Blueprint */}
                      <td className="py-3 px-4 min-w-[240px]">
                        <Link
                          href={`/examiner/exams/${sch.exam_id}`}
                          className="font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1"
                          title={examData?.title}
                        >
                          {examData?.title || "Examination Session"}
                        </Link>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span>{examSecs.length} sections</span>
                          <span className="text-slate-300">•</span>
                          <span>{totalQCount} questions</span>
                          <span className="text-slate-300">•</span>
                          <span className="font-semibold text-slate-700">{totalMarks} marks</span>
                        </div>
                      </td>

                      {/* Delivery Window */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">
                          {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} to {endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>

                      {/* Duration & Format */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800">
                          {sch.duration_minutes} mins
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          {sch.window_type === "fixed" ? (
                            <Lock className="w-3 h-3 text-slate-400" />
                          ) : (
                            <Clock className="w-3 h-3 text-slate-400" />
                          )}
                          <span>{sch.window_type === "fixed" ? "Fixed Delivery" : "Flexible Window"}</span>
                        </div>
                      </td>

                      {/* Candidates */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveRosterSchedule(sch);
                            setRosterSearch("");
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/80 text-xs font-semibold hover:bg-purple-100 transition-colors cursor-pointer"
                          title="Click to view candidate roster"
                        >
                          <Users className="w-3.5 h-3.5 text-purple-600" />
                          <span>{enrolledForSch.length} enrolled</span>
                        </button>
                      </td>

                      {/* Proctoring */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80 capitalize">
                          <ShieldCheck className="w-3 h-3 text-slate-500" />
                          <span>{sch.proctoring_level}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isLive && (
                            <Link
                              href="/proctor"
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1"
                            >
                              <Video className="w-3 h-3" />
                              <span>Proctor</span>
                            </Link>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setActiveRosterSchedule(sch);
                              setIsBulkAllocationModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-purple-700 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 transition-all cursor-pointer"
                            title="Import Seating CSV"
                          >
                            <Upload className="w-3.5 h-3.5" />
                          </button>

                          <Link
                            href={`/examiner/exams/${sch.exam_id}`}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition-all"
                            title="View Paper"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty State */
          <div className="p-8 text-center">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-2.5">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              No Matching Exam Delivery Sessions
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== "all"
                ? "No sessions found matching your filter criteria. Try adjusting or clearing filters."
                : "No examination delivery sessions scheduled yet. Click below to schedule a new delivery window."}
            </p>
            <div className="mt-3.5 flex items-center justify-center gap-2">
              {searchQuery || statusFilter !== "all" ? (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  onClick={() => setIsStudioOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Schedule Exam Window</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* STREAMLINED "SCHEDULE STUDIO" SLIDE-OVER DRAWER WITH BESPOKE CUSTOM INPUTS */}
      {isStudioOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="bg-white border-l border-slate-200 w-full max-w-2xl h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-250">
            {/* Header */}
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                  <CalendarClock className="w-4 h-4 text-slate-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Schedule Examination Window
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure timing, candidate cohort, and proctoring settings.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsStudioOpen(false);
                  setIsBlueprintDropdownOpen(false);
                  setIsCohortDropdownOpen(false);
                }}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Streamlined Form Body */}
            <form
              id="schedule-studio-form"
              onSubmit={handleCreateSchedule}
              className="px-6 py-4 space-y-3.5 overflow-y-auto flex-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full"
            >
              {/* FIELD 1 & 2: 2 Full-Width Distinct Rows */}
              <div className="space-y-3.5">
                {/* ROW 1: Examination Blueprint */}
                <div
                  ref={blueprintDropdownRef}
                  className={`relative transition-all ${
                    isBlueprintDropdownOpen ? "z-30" : "z-10"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>Examination Blueprint</span>
                      <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          selectedExam?.status?.toLowerCase() === "published"
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                        }`}
                      />
                      <span className="uppercase tracking-wider">
                        {selectedExam?.status || "Draft"}
                      </span>
                    </span>
                  </div>

                  {/* Custom Trigger Card */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsBlueprintDropdownOpen((prev) => !prev);
                      setIsCohortDropdownOpen(false);
                    }}
                    aria-haspopup="listbox"
                    aria-expanded={isBlueprintDropdownOpen}
                    className={`w-full p-3 rounded-xl border text-left transition-all duration-150 flex items-center justify-between shadow-2xs cursor-pointer ${
                      isBlueprintDropdownOpen
                        ? "bg-white border-indigo-600 ring-3 ring-indigo-600/10 shadow-sm"
                        : "border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs transition-colors ${
                          isBlueprintDropdownOpen
                            ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                            : "bg-white border-slate-200 text-slate-700"
                        }`}
                      >
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate tracking-tight">
                          {selectedExam?.title || "Select Blueprint"}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium truncate mt-0.5">
                          <span>{currentExamSections.length} sections</span>
                          <span className="text-slate-300">•</span>
                          <span>{totalBlueprintQuestions} questions</span>
                          <span className="text-slate-300">•</span>
                          <span>{totalBlueprintMarks} marks</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <div
                        className={`w-7 h-7 rounded-lg border flex items-center justify-center shadow-2xs transition-all duration-200 ${
                          isBlueprintDropdownOpen
                            ? "bg-indigo-50 border-indigo-200 text-indigo-600 rotate-180"
                            : "bg-white border-slate-200/80 text-slate-400"
                        }`}
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </button>

                  {/* Custom Dropdown Menu Popover */}
                  {isBlueprintDropdownOpen && (
                    <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-40 bg-white rounded-2xl border border-slate-200 shadow-2xl p-1.5 space-y-1 max-h-72 overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-2.5 py-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <span>Available Blueprints ({availableExams.length})</span>
                        <span className="text-[10px] font-normal lowercase text-slate-400">
                          esc to close
                        </span>
                      </div>

                      <div className="space-y-1">
                        {availableExams.map((exam) => {
                          const isSelected = exam.id === selectedExamId;
                          const examSecs = examSections.filter((s) => s.examId === exam.id);
                          const qCount = examSecs.reduce((acc, s) => acc + s.questionCount, 0);
                          const mCount = examSecs.reduce((acc, s) => acc + s.totalMarks, 0);
                          const isPub = exam.status.toLowerCase() === "published";

                          return (
                            <button
                              key={exam.id}
                              type="button"
                              onClick={() => {
                                setSelectedExamId(exam.id);
                                setIsBlueprintDropdownOpen(false);
                              }}
                              className={`w-full text-left p-2.5 rounded-xl transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer ${
                                isSelected
                                  ? "bg-indigo-50/90 border border-indigo-200/90 text-indigo-950 font-semibold shadow-2xs"
                                  : "hover:bg-slate-50 border border-transparent text-slate-800"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                                    isSelected
                                      ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                                      : "bg-white border-slate-200 text-slate-600"
                                  }`}
                                >
                                  <BookOpen className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs sm:text-sm font-semibold truncate tracking-tight">
                                    {exam.title}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium truncate mt-0.5">
                                    <span>{examSecs.length} sections</span>
                                    <span className="text-slate-300">•</span>
                                    <span>{qCount} questions</span>
                                    <span className="text-slate-300">•</span>
                                    <span>{mCount} marks</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span
                                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                                    isPub
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                                      : "bg-amber-50 text-amber-700 border-amber-200/80"
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      isPub ? "bg-emerald-500" : "bg-amber-500"
                                    }`}
                                  />
                                  {exam.status}
                                </span>

                                {isSelected && (
                                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* ROW 2: Candidate Cohort */}
                <div
                  ref={cohortDropdownRef}
                  className={`relative transition-all ${
                    isCohortDropdownOpen ? "z-20" : "z-0"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800">
                      Candidate Cohort
                    </label>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md">
                      <UserCheck className="w-3 h-3 text-slate-500" />
                      <span>
                        {targetEnrollCount}{" "}
                        {targetEnrollCount === 1 ? "candidate" : "candidates"}{" "}
                        ready
                      </span>
                    </span>
                  </div>

                  {/* Custom Trigger Card */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCohortDropdownOpen((prev) => !prev);
                      setIsBlueprintDropdownOpen(false);
                    }}
                    aria-haspopup="listbox"
                    aria-expanded={isCohortDropdownOpen}
                    className={`w-full p-3 rounded-xl border text-left transition-all duration-150 flex items-center justify-between shadow-2xs cursor-pointer ${
                      isCohortDropdownOpen
                        ? "bg-white border-indigo-600 ring-3 ring-indigo-600/10 shadow-sm"
                        : "border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs transition-colors ${
                          isCohortDropdownOpen
                            ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                            : "bg-white border-slate-200 text-slate-700"
                        }`}
                      >
                        {autoEnrollDeptId === "all" ? (
                          <Users className="w-4 h-4" />
                        ) : autoEnrollDeptId === "none" ? (
                          <UserCheck className="w-4 h-4" />
                        ) : (
                          <Building2 className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate tracking-tight">
                          {autoEnrollDeptId === "all"
                            ? "All Candidates in University Pool"
                            : autoEnrollDeptId === "none"
                            ? "Assign candidates later from Roster / CSV"
                            : `Department: ${deptMap.get(autoEnrollDeptId)?.name || "Department"}`}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium truncate mt-0.5">
                          <span>
                            {autoEnrollDeptId === "none"
                              ? "Manual assignment via roster or seating CSV"
                              : `1-Click auto-enrollment (${targetEnrollCount} eligible)`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <div
                        className={`w-7 h-7 rounded-lg border flex items-center justify-center shadow-2xs transition-all duration-200 ${
                          isCohortDropdownOpen
                            ? "bg-indigo-50 border-indigo-200 text-indigo-600 rotate-180"
                            : "bg-white border-slate-200/80 text-slate-400"
                        }`}
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </button>

                  {/* Custom Dropdown Menu Popover */}
                  {isCohortDropdownOpen && (
                    <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-40 bg-white rounded-2xl border border-slate-200 shadow-2xl p-1.5 space-y-1 max-h-72 overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full animate-in fade-in zoom-in-95 duration-150">
                      {/* Option 1: All Candidates */}
                      <div className="px-2.5 py-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <span>University Cohorts</span>
                        <span className="text-[10px] font-normal lowercase text-slate-400">
                          esc to close
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setAutoEnrollDeptId("all");
                          setIsCohortDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer ${
                          autoEnrollDeptId === "all"
                            ? "bg-indigo-50/90 border border-indigo-200/90 text-indigo-950 font-semibold shadow-2xs"
                            : "hover:bg-slate-50 border border-transparent text-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                              autoEnrollDeptId === "all"
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                                : "bg-white border-slate-200 text-slate-600"
                            }`}
                          >
                            <Users className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-semibold truncate tracking-tight">
                              All Candidates in University Pool
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                              Enrolls all registered candidates across all departments
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                            {candidatePool.length} {candidatePool.length === 1 ? "candidate" : "candidates"}
                          </span>
                          {autoEnrollDeptId === "all" && (
                            <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      </button>

                      {/* Departments Section */}
                      {departments.length > 0 && (
                        <>
                          <div className="my-1 border-t border-slate-100 px-2.5 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            By Academic Department
                          </div>
                          {departments.map((d) => {
                            const count = candidatePool.filter((c) => c.departmentId === d.id).length;
                            const isSelected = autoEnrollDeptId === d.id;

                            return (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() => {
                                  setAutoEnrollDeptId(d.id);
                                  setIsCohortDropdownOpen(false);
                                }}
                                className={`w-full text-left p-2.5 rounded-xl transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer ${
                                  isSelected
                                    ? "bg-indigo-50/90 border border-indigo-200/90 text-indigo-950 font-semibold shadow-2xs"
                                    : "hover:bg-slate-50 border border-transparent text-slate-800"
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                                      isSelected
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                                        : "bg-white border-slate-200 text-slate-600"
                                    }`}
                                  >
                                    <Building2 className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs sm:text-sm font-semibold truncate tracking-tight">
                                      Department: {d.name}
                                    </div>
                                    <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                                      Auto-enroll all candidates from {d.code || d.name}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span
                                    className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                                      count > 0
                                        ? "bg-slate-100 text-slate-700 border-slate-200"
                                        : "bg-slate-50 text-slate-400 border-slate-200/60"
                                    }`}
                                  >
                                    {count} {count === 1 ? "candidate" : "candidates"}
                                  </span>
                                  {isSelected && (
                                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </>
                      )}

                      {/* Option 3: Manual assignment / None */}
                      <div className="my-1 border-t border-slate-100 px-2.5 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Manual Assignment
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAutoEnrollDeptId("none");
                          setIsCohortDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer ${
                          autoEnrollDeptId === "none"
                            ? "bg-indigo-50/90 border border-indigo-200/90 text-indigo-950 font-semibold shadow-2xs"
                            : "hover:bg-slate-50 border border-transparent text-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                              autoEnrollDeptId === "none"
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                                : "bg-white border-slate-200 text-slate-600"
                            }`}
                          >
                            <UserCheck className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-semibold truncate tracking-tight">
                              Assign candidates later from Roster / CSV
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                              Schedule will be created with 0 candidates initially
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                            Manual Seating
                          </span>
                          {autoEnrollDeptId === "none" && (
                            <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* FIELD 3: Clean, Uncrowded Delivery Timing Card */}
              <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/90 space-y-3">
                {/* Header with clear closing time */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs font-bold text-slate-800">
                      Delivery Timing
                    </span>
                  </div>

                  <span className="text-xs text-slate-500">
                    Closes: <strong className="font-semibold text-slate-800">{getEndTimePreview()}</strong>
                  </span>
                </div>

                {/* 3 Balanced, Uncrowded Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Start Date & Time */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Start Time <span className="text-rose-500">*</span>
                    </label>
                    <CustomDateTimePicker
                      value={startAt}
                      onChange={handleStartAtChange}
                    />
                  </div>

                  {/* Duration with 4 Spacious Preset Buttons */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Duration
                      </label>
                      <span className="text-[11px] font-bold text-slate-600">
                        {durationMinutes} min
                      </span>
                    </div>
                    <div className="h-9 p-0.5 rounded-lg border border-slate-200 bg-white grid grid-cols-4 gap-1 shadow-2xs">
                      {[60, 90, 120, 180].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => handleSelectDuration(mins)}
                          className={`text-xs font-bold rounded transition-colors cursor-pointer flex items-center justify-center ${
                            durationMinutes === mins
                              ? "bg-gradient-to-r from-indigo-50 via-white to-blue-50 text-indigo-950 border border-indigo-300 shadow-2xs font-bold ring-1 ring-indigo-200/60"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          }`}
                        >
                          {mins === 60 ? "1h" : mins === 90 ? "1.5h" : mins === 120 ? "2h" : "3h"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Mode */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Delivery Mode
                    </label>
                    <div className="h-9 p-0.5 rounded-lg border border-slate-200 bg-white grid grid-cols-2 gap-1 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => handleWindowTypeChange("fixed")}
                        className={`text-xs font-bold rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                          windowType === "fixed"
                            ? "bg-gradient-to-r from-indigo-50 via-white to-blue-50 text-indigo-950 border border-indigo-300 shadow-2xs font-bold ring-1 ring-indigo-200/60"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        <Lock className="w-3 h-3 text-indigo-700" />
                        <span>Fixed</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleWindowTypeChange("flexible")}
                        className={`text-xs font-bold rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                          windowType === "flexible"
                            ? "bg-gradient-to-r from-indigo-50 via-white to-blue-50 text-indigo-950 border border-indigo-300 shadow-2xs font-bold ring-1 ring-indigo-200/60"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        <Clock className="w-3 h-3 text-indigo-700" />
                        <span>Flexible</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Flexible Window Limit Selector (Shown only in Flexible mode) */}
                {windowType === "flexible" && (
                  <div className="pt-2.5 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5 shrink-0">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Window Deadline:</span>
                      </span>
                      <CustomDateTimePicker
                        value={endAt}
                        onChange={(val) => setEndAt(val)}
                        className="w-52 sm:w-60"
                      />
                    </div>

                    {/* Quick Limit Presets */}
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-400 font-medium mr-0.5">Quick Limit:</span>
                      {[
                        { label: "+3h", hours: 3 },
                        { label: "+6h", hours: 6 },
                        { label: "+12h", hours: 12 },
                        { label: "1 Day", hours: 24 },
                        { label: "2 Days", hours: 48 },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => handleSelectWindowSpanHours(item.hours)}
                          className="px-2 py-1 text-[10px] font-bold rounded-md border border-slate-200 bg-white hover:bg-slate-100 hover:border-slate-300 text-slate-700 transition-colors shadow-2xs cursor-pointer"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quiet 1-Line Info Note */}
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                    <span>
                      {windowType === "fixed" ? (
                        <>
                          <strong className="text-slate-800">Fixed Session:</strong> Synchronized start at{" "}
                          <span className="text-slate-700 font-semibold">{getStartTimePreview()}</span>, closes at{" "}
                          <span className="text-slate-700 font-semibold">{getEndTimePreview()}</span>.
                        </>
                      ) : (
                        <>
                          <strong className="text-slate-800">Flexible Window:</strong> Closes at{" "}
                          <span className="text-slate-700 font-semibold">{getEndTimePreview()}</span> ({formatDurationDisplay(durationMinutes)} test timer per candidate).
                        </>
                      )}
                    </span>
                  </div>

                  {windowType === "flexible" && (
                    <span className="text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs shrink-0">
                      {getWindowSpanDetails()}
                    </span>
                  )}
                </div>
              </div>

              {/* FIELD 4: Sleek Proctoring Security Switcher */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Proctoring Security</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md shadow-2xs ${PROCTORING_TIERS.find((t) => t.id === proctoringLevel)?.badgeColor || "bg-slate-100 text-slate-700"}`}>
                    {PROCTORING_TIERS.find((t) => t.id === proctoringLevel)?.badge || "Standard"}
                  </span>
                </div>

                {/* 1-Row Segmented Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-slate-100/80 rounded-xl border border-slate-200/80">
                  {PROCTORING_TIERS.map((tier) => {
                    const isSelected = proctoringLevel === tier.id;
                    const Icon = tier.icon;
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setProctoringLevel(tier.id)}
                        className={`h-9 px-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? tier.gradientActive
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? tier.accent : "text-slate-400"}`} />
                        <span className="truncate">{tier.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Active Tier Description Banner */}
                {(() => {
                  const activeTier = PROCTORING_TIERS.find((t) => t.id === proctoringLevel) || PROCTORING_TIERS[2];
                  const ActiveIcon = activeTier.icon;
                  return (
                    <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs shadow-2xs transition-all ${activeTier.bannerGradient}`}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 shadow-2xs ${activeTier.iconBg}`}>
                          <ActiveIcon className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate">
                          <strong className="font-bold mr-1.5">{activeTier.name}:</strong>
                          <span className="text-slate-600 font-medium">{activeTier.description}</span>
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-2xs shrink-0 ml-2 ${activeTier.badgeColor}`}>
                        {activeTier.badge}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Pre-Flight Launch Confirmation Strip */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-slate-50 via-indigo-50/40 to-blue-50/50 border border-indigo-100/80 flex flex-wrap items-center justify-between gap-2.5 text-xs shadow-2xs">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <div className="inline-flex items-center gap-1.5 font-bold text-slate-800 bg-white/95 border border-slate-200/90 px-2.5 py-1 rounded-lg shadow-2xs">
                    <BookOpen className="w-3.5 h-3.5 text-slate-600" />
                    <span className="truncate max-w-[150px]">{selectedExam?.title || "Exam Blueprint"}</span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 font-semibold text-blue-900 bg-gradient-to-r from-blue-50 via-sky-50/60 to-white border border-blue-200/80 px-2.5 py-1 rounded-lg shadow-2xs">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>{formatDurationDisplay(durationMinutes)} {windowType === "fixed" ? "Fixed" : "Window"}</span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 font-semibold text-indigo-900 bg-gradient-to-r from-indigo-50 via-purple-50/60 to-white border border-indigo-200/80 px-2.5 py-1 rounded-lg shadow-2xs">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    <span>
                      {targetEnrollCount}{" "}
                      {targetEnrollCount === 1 ? "Candidate" : "Candidates"}
                    </span>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 text-emerald-800 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/60 border border-emerald-200/90 px-3 py-1 rounded-lg text-xs font-bold shrink-0 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Ready to Schedule</span>
                </div>
              </div>
            </form>

            {/* Sticky Action Footer */}
            <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0">
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                All settings can be modified before session begins.
              </span>

              <div className="flex items-center gap-2.5 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsStudioOpen(false)}
                  className="h-9 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="schedule-studio-form"
                  disabled={isPending}
                  className="h-9 px-5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 hover:from-indigo-700 hover:to-blue-800 text-xs font-bold text-white shadow-xs cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 transition-all hover:shadow-sm active:scale-[0.99]"
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>
                    {isPending
                      ? "Publishing..."
                      : autoEnrollDeptId !== "none" && targetEnrollCount > 0
                      ? `Publish & Enroll (${targetEnrollCount})`
                      : "Publish Exam Window"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Candidate Roster & 1-Click Enrollment Drawer */}
      {activeRosterSchedule && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
          <div className="bg-white border-l border-slate-200 w-full max-w-xl h-full shadow-2xl flex flex-col justify-between">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                    Candidate Roster
                  </span>
                  <span className="text-xs font-bold text-slate-400">•</span>
                  <span className="text-xs font-semibold text-slate-600">
                    {activeEnrolledAssignments.length} Enrolled
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {examMap.get(activeRosterSchedule.exam_id)?.title || "Exam Session"}
                </h3>
              </div>

              <button
                onClick={() => setActiveRosterSchedule(null)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick 1-Click Department Enrollment Box */}
            <div className="p-5 border-b border-slate-200 bg-purple-50/50 space-y-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-700" />
                <span className="text-xs font-bold text-purple-950">
                  1-Click Departmental Cohort Enrollment
                </span>
              </div>
              <p className="text-[11px] text-purple-800/80 leading-relaxed">
                Automatically assign all registered candidates from a specific department to this exam window.
              </p>

              <div className="flex items-center gap-2">
                <select
                  value={targetEnrollDeptId}
                  onChange={(e) => setTargetEnrollDeptId(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs font-medium rounded-xl border border-purple-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
                >
                  <option value="all">All University Candidates ({candidatePool.length})</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({candidatePool.filter((c) => c.departmentId === d.id).length} candidates)
                    </option>
                  ))}
                </select>

                <button
                  onClick={handle1ClickCohortEnroll}
                  disabled={isPending}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Assigning..." : "Assign Cohort"}
                </button>
              </div>
            </div>

            {/* Enrolled Candidate List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-slate-900">
                  Enrolled Candidates ({activeEnrolledAssignments.length})
                </span>
                <div className="relative w-48">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search roster..."
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {searchedEnrolledAssignments.length > 0 ? (
                <div className="space-y-2">
                  {searchedEnrolledAssignments.map((a) => {
                    const cand = candidateMap.get(a.candidate_id);
                    const dept = cand?.departmentId ? deptMap.get(cand.departmentId) : null;

                    return (
                      <div
                        key={a.id}
                        className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-2xs hover:border-slate-300 transition-colors"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            {cand?.fullName || a.candidateName || "Candidate"}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {cand?.email || a.candidateEmail || "No email"}
                          </div>
                          {dept && (
                            <span className="inline-block mt-1 text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                              {dept.name}
                            </span>
                          )}
                        </div>

                        <div className="text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              a.status === "assigned"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {a.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <div className="text-xs font-bold text-slate-700">No candidates enrolled yet</div>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                    Use the 1-click cohort assigner above or upload a seating CSV to populate the examinee roster.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex justify-end">
              <button
                onClick={() => setActiveRosterSchedule(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Bulk Seating CSV Allocation Modal */}
      {isBulkAllocationModalOpen && activeRosterSchedule && (
        <BulkUploadModal
          isOpen={isBulkAllocationModalOpen}
          onClose={() => setIsBulkAllocationModalOpen(false)}
          title={`Bulk Seating & Roster Upload — ${examMap.get(activeRosterSchedule.exam_id)?.title || "Exam"}`}
          entityName="Candidate Seating"
          description="Upload a CSV with candidate emails/roll numbers, assigned seat numbers, and test lab rooms to automatically assign and seat students in bulk."
          templateFileName="sample_candidate_seating.csv"
          columns={[
            {
              key: "email_or_roll_number",
              label: "Candidate Email / Roll Number",
              sample: "candidate1@klu.ac.in",
              required: true,
              description: "Student's registered university email or roll number",
            },
            {
              key: "seat_number",
              label: "Seat Number",
              sample: "LAB1-S24",
              required: false,
              description: "Assigned physical seat ID in examination lab",
            },
            {
              key: "room_number",
              label: "Room / Lab Number",
              sample: "CSE-LAB-3",
              required: false,
              description: "Examination hall / department lab venue",
            },
          ]}
          validateRow={(row, idx) => {
            const errors: string[] = [];
            const candidateIdentifier = row.email_or_roll_number || row.email || row.candidate_id || row.roll_number;
            const seatNumber = row.seat_number || row.seat;
            const roomNumber = row.room_number || row.room || row.lab;

            if (!candidateIdentifier) {
              errors.push(`Row ${idx + 1}: Missing candidate email or roll number.`);
            }

            return {
              isValid: errors.length === 0,
              errors,
              parsed: errors.length === 0 ? {
                candidateIdentifier,
                seatNumber: seatNumber || undefined,
                roomNumber: roomNumber || undefined,
              } : undefined,
            };
          }}
          onExecuteImport={async (validItems, strategy) => {
            const res = await bulkAllocateCandidatesToScheduleAction(
              activeRosterSchedule.id,
              validItems,
              strategy
            );
            return {
              success: res.success || false,
              error: res.error,
              data: res.data,
            };
          }}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
