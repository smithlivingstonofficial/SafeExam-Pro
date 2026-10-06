"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Layers,
  BookOpen,
  Calendar,
  Shield,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Scale,
  Lock,
  Video,
  Shuffle,
  Calculator,
  HelpCircle,
  Sparkles,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Users,
  Eye,
  Globe,
  Building2,
  X,
  FileQuestion,
  Filter,
} from "lucide-react";
import { autoPickExamQuestions, AvailableQuestionItem } from "@/lib/exam-builder/auto-pick";
import { quickPublishExamWizardAction, getOrCreateDefaultBankAction } from "@/app/actions/examiner";
import { QuestionBulkModal } from "@/components/examiner/question-bulk-modal";

export interface DepartmentMeta {
  id: string;
  name: string;
  code: string | null;
}

export interface CandidatePoolItem {
  id: string;
  fullName: string;
  email: string;
  departmentId: string | null;
  departmentName?: string;
  isActive?: boolean;
}

export interface QuestionBankMeta {
  id: string;
  name: string;
  isCommon: boolean;
  departmentId: string | null;
}

interface ExamSetupWizardProps {
  departments: DepartmentMeta[];
  availableQuestions: AvailableQuestionItem[];
  questionBanks: QuestionBankMeta[];
  candidates: CandidatePoolItem[];
}

type WizardStep = 1 | 2 | 3 | 4;

function InfoHelp({
  title,
  content,
  align = "right",
}: {
  title?: string;
  content: string;
  align?: "left" | "right";
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-flex items-center ml-1 shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="text-slate-400 hover:text-indigo-600 p-0.5 rounded-full hover:bg-indigo-50/80 transition-colors cursor-pointer"
        aria-label="More information"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          className={`absolute bottom-full mb-2 z-50 w-60 p-3 bg-slate-900 text-white text-[11px] leading-relaxed rounded-xl shadow-xl border border-slate-700/80 backdrop-blur-xs animate-in fade-in zoom-in-95 duration-150 pointer-events-none ${
            align === "left" ? "left-0" : "right-0"
          }`}
        >
          {title && <div className="font-bold text-white mb-1 text-xs">{title}</div>}
          <p className="text-slate-300 text-[11px] leading-relaxed">{content}</p>
          <div
            className={`absolute top-full -mt-1 border-4 border-transparent border-t-slate-900 ${
              align === "left" ? "left-2" : "right-2"
            }`}
          />
        </div>
      )}
    </div>
  );
}

export function ExamSetupWizard({
  departments,
  availableQuestions,
  questionBanks,
  candidates,
}: ExamSetupWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Wizard Navigation
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // -------------------------------------------------------------
  // Step 1: Exam Basics & Blueprint Configuration
  // -------------------------------------------------------------
  const [title, setTitle] = useState("Ph.D. Entrance Assessment 2026 — Engineering & Technology");
  const [departmentId, setDepartmentId] = useState("");
  const [description, setDescription] = useState(
    "Doctoral entrance curriculum, subject syllabus topics, and qualifying criteria."
  );
  const [instructions, setInstructions] = useState(
    "Lockdown browser mandatory. Scientific calculator permitted. No external reference aids."
  );
  const [targetDurationMinutes, setTargetDurationMinutes] = useState(120);
  const [passingPercentage, setPassingPercentage] = useState(50);
  const [commonQuestionTarget, setCommonQuestionTarget] = useState(20);
  const [deptQuestionTarget, setDeptQuestionTarget] = useState(30);
  const [marksPerQuestion, setMarksPerQuestion] = useState(2);

  // Evaluation Rules & Negative Marking
  const [enableNegativeMarking, setEnableNegativeMarking] = useState(false);
  const [defaultNegativePenalty, setDefaultNegativePenalty] = useState(0.25);
  const [enablePartialMarking, setEnablePartialMarking] = useState(false);
  const [requireSectionalCutoff, setRequireSectionalCutoff] = useState(false);

  // Security & Delivery Safeguards
  const [requireSafeBrowser, setRequireSafeBrowser] = useState(true);
  const [enableWebcamProctoring, setEnableWebcamProctoring] = useState(true);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [allowBacktracking, setAllowBacktracking] = useState(true);
  const [calculatorType, setCalculatorType] = useState<"none" | "basic" | "scientific">("none");

  // -------------------------------------------------------------
  // Step 2: Question Pool Selection Studio & Telemetry
  // -------------------------------------------------------------
  const departmentMetaMap = useMemo(() => {
    const map: Record<string, { name: string; code?: string }> = {};
    departments.forEach((d) => {
      map[d.id] = { name: d.name, code: d.code || undefined };
    });
    return map;
  }, [departments]);

  const bankNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    questionBanks.forEach((b) => {
      map[b.id] = b.name;
    });
    return map;
  }, [questionBanks]);

  const questionByIdMap = useMemo(() => {
    const map = new Map<string, AvailableQuestionItem>();
    availableQuestions.forEach((q) => map.set(q.id, q));
    return map;
  }, [availableQuestions]);

  const [selectedCommonIds, setSelectedCommonIds] = useState<string[]>([]);
  const [selectedDeptIdsByDept, setSelectedDeptIdsByDept] = useState<Record<string, string[]>>({});
  const [activeDeptTab, setActiveDeptTab] = useState<string>("common");
  const [questionSearch, setQuestionSearch] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [filterSelectionStatus, setFilterSelectionStatus] = useState<"all" | "selected" | "unselected">("all");
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<Set<string>>(new Set());
  const [isAllExpanded, setIsAllExpanded] = useState(false);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeUploadBankId, setActiveUploadBankId] = useState<string>(questionBanks[0]?.id || "");

  const commonQuestionsPool = useMemo(() => {
    return availableQuestions.filter(
      (q) => q.is_common === true || (!q.department_id && q.is_common !== false)
    );
  }, [availableQuestions]);

  const deptQuestionsPoolMap = useMemo(() => {
    const map: Record<string, AvailableQuestionItem[]> = {};
    departments.forEach((d) => {
      map[d.id] = availableQuestions.filter(
        (q) => !q.is_common && q.department_id === d.id
      );
    });
    return map;
  }, [availableQuestions, departments]);

  // Selected Questions Breakdown for Part A
  const { commonEasyCount, commonMedCount, commonHardCount } = useMemo(() => {
    let easy = 0;
    let med = 0;
    let hard = 0;
    selectedCommonIds.forEach((id) => {
      const q = questionByIdMap.get(id);
      const diff = q?.difficulty ?? 2;
      if (diff === 1) easy++;
      else if (diff === 2) med++;
      else hard++;
    });
    return { commonEasyCount: easy, commonMedCount: med, commonHardCount: hard };
  }, [selectedCommonIds, questionByIdMap]);

  // Fulfilled Departments Count
  const fulfilledDeptsCount = useMemo(() => {
    return departments.filter(
      (d) => (selectedDeptIdsByDept[d.id] || []).length >= deptQuestionTarget
    ).length;
  }, [departments, selectedDeptIdsByDept, deptQuestionTarget]);

  // Active Tab specific selection & pool
  const activeTabSelectedIds = useMemo(() => {
    if (activeDeptTab === "common") {
      return selectedCommonIds;
    }
    return selectedDeptIdsByDept[activeDeptTab] || [];
  }, [activeDeptTab, selectedCommonIds, selectedDeptIdsByDept]);

  const activeTabPool = useMemo(() => {
    if (activeDeptTab === "common") {
      return commonQuestionsPool;
    }
    return deptQuestionsPoolMap[activeDeptTab] || [];
  }, [activeDeptTab, commonQuestionsPool, deptQuestionsPoolMap]);

  const activeTargetCount = activeDeptTab === "common" ? commonQuestionTarget : deptQuestionTarget;
  const activePoolAvailableCount = activeTabPool.length;
  const activePoolShortfall = Math.max(0, activeTargetCount - activePoolAvailableCount);

  // Active Dept breakdown if in department tab
  const { activeDeptEasyCount, activeDeptMedCount, activeDeptHardCount } = useMemo(() => {
    if (activeDeptTab === "common") return { activeDeptEasyCount: 0, activeDeptMedCount: 0, activeDeptHardCount: 0 };
    const ids = selectedDeptIdsByDept[activeDeptTab] || [];
    let easy = 0;
    let med = 0;
    let hard = 0;
    ids.forEach((id) => {
      const q = questionByIdMap.get(id);
      const diff = q?.difficulty ?? 2;
      if (diff === 1) easy++;
      else if (diff === 2) med++;
      else hard++;
    });
    return { activeDeptEasyCount: easy, activeDeptMedCount: med, activeDeptHardCount: hard };
  }, [activeDeptTab, selectedDeptIdsByDept, questionByIdMap]);

  // Filtered Questions for Active Tab
  const filteredActiveQuestions = useMemo(() => {
    return activeTabPool.filter((q) => {
      // Difficulty filter
      if (filterDifficulty !== "all" && String(q.difficulty ?? 2) !== filterDifficulty) {
        return false;
      }

      // Selection status filter
      const isSelected = activeTabSelectedIds.includes(q.id);
      if (filterSelectionStatus === "selected" && !isSelected) return false;
      if (filterSelectionStatus === "unselected" && isSelected) return false;

      // Search keyword filter
      if (questionSearch.trim()) {
        const term = questionSearch.toLowerCase();
        const text = (q.content?.text || "").toLowerCase();
        const subject = (q.subject || "").toLowerCase();
        const topic = (q.topic || "").toLowerCase();
        const bankName = (bankNameMap[q.bank_id] || "").toLowerCase();
        return text.includes(term) || subject.includes(term) || topic.includes(term) || bankName.includes(term);
      }

      return true;
    });
  }, [activeTabPool, filterDifficulty, filterSelectionStatus, activeTabSelectedIds, questionSearch, bankNameMap]);

  const handleAutoPick = () => {
    const targetDeptIds = departments.map((d) => d.id);
    const result = autoPickExamQuestions({
      allQuestions: availableQuestions,
      targetDepartmentIds: targetDeptIds,
      commonCount: commonQuestionTarget,
      deptCount: deptQuestionTarget,
      departmentMetaMap,
    });

    setSelectedCommonIds(result.commonQuestionIds);
    setSelectedDeptIdsByDept(result.deptQuestionIdsByDept);
  };

  const toggleCommonQuestion = (qId: string) => {
    setSelectedCommonIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  const toggleDeptQuestion = (deptId: string, qId: string) => {
    setSelectedDeptIdsByDept((prev) => {
      const current = prev[deptId] || [];
      const updated = current.includes(qId)
        ? current.filter((id) => id !== qId)
        : [...current, qId];
      return { ...prev, [deptId]: updated };
    });
  };

  const toggleQuestionInActiveTab = (qId: string) => {
    if (activeDeptTab === "common") {
      toggleCommonQuestion(qId);
    } else {
      toggleDeptQuestion(activeDeptTab, qId);
    }
  };

  const toggleExpandQuestion = (qId: string) => {
    setExpandedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) {
        next.delete(qId);
      } else {
        next.add(qId);
      }
      return next;
    });
  };

  const handleToggleExpandAll = () => {
    if (isAllExpanded) {
      setIsAllExpanded(false);
      setExpandedQuestionIds(new Set());
    } else {
      setIsAllExpanded(true);
      setExpandedQuestionIds(new Set(filteredActiveQuestions.map((q) => q.id)));
    }
  };

  const isAllActiveTabSelected = useMemo(() => {
    if (filteredActiveQuestions.length === 0) return false;
    return filteredActiveQuestions.every((q) => activeTabSelectedIds.includes(q.id));
  }, [filteredActiveQuestions, activeTabSelectedIds]);

  const handleToggleSelectAllActiveTab = () => {
    const filteredIds = filteredActiveQuestions.map((q) => q.id);
    if (activeDeptTab === "common") {
      if (isAllActiveTabSelected) {
        setSelectedCommonIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
      } else {
        const set = new Set([...selectedCommonIds, ...filteredIds]);
        setSelectedCommonIds(Array.from(set));
      }
    } else {
      if (isAllActiveTabSelected) {
        setSelectedDeptIdsByDept((prev) => {
          const current = prev[activeDeptTab] || [];
          return {
            ...prev,
            [activeDeptTab]: current.filter((id) => !filteredIds.includes(id)),
          };
        });
      } else {
        setSelectedDeptIdsByDept((prev) => {
          const current = prev[activeDeptTab] || [];
          const set = new Set([...current, ...filteredIds]);
          return {
            ...prev,
            [activeDeptTab]: Array.from(set),
          };
        });
      }
    }
  };

  // -------------------------------------------------------------
  // Step 3: Schedule & Candidate Assignment
  // -------------------------------------------------------------
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);

  const [examDate, setExamDate] = useState(tomorrowStr);
  const [startTime, setStartTime] = useState("10:00");
  const [proctoringLevel, setProctoringLevel] = useState<"none" | "basic" | "standard" | "full">("standard");
  const [windowType, setWindowType] = useState<"fixed" | "flexible">("fixed");

  const { startIso, endIso, formattedTimeWindow } = useMemo(() => {
    try {
      const startDt = new Date(`${examDate}T${startTime}:00`);
      const endDt = new Date(startDt.getTime() + targetDurationMinutes * 60 * 1000);
      const formatTime = (date: Date) =>
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      return {
        startIso: startDt.toISOString(),
        endIso: endDt.toISOString(),
        formattedTimeWindow: `${formatTime(startDt)} – ${formatTime(endDt)}`,
      };
    } catch {
      return {
        startIso: new Date().toISOString(),
        endIso: new Date().toISOString(),
        formattedTimeWindow: "10:00 AM – 12:00 PM",
      };
    }
  }, [examDate, startTime, targetDurationMinutes]);

  const [assignmentMode, setAssignmentMode] = useState<"all" | "departments" | "manual">("all");
  const [selectedDeptIdsForCandidates, setSelectedDeptIdsForCandidates] = useState<string[]>(
    departments.map((d) => d.id)
  );
  const [manuallySelectedCandidateIds, setManuallySelectedCandidateIds] = useState<string[]>(
    candidates.map((c) => c.id)
  );
  const [candidateSearch, setCandidateSearch] = useState("");

  const assignedCandidateIds = useMemo(() => {
    if (assignmentMode === "all") {
      return candidates.filter((c) => c.isActive !== false).map((c) => c.id);
    }
    if (assignmentMode === "departments") {
      const deptSet = new Set(selectedDeptIdsForCandidates);
      return candidates
        .filter((c) => c.departmentId && deptSet.has(c.departmentId) && c.isActive !== false)
        .map((c) => c.id);
    }
    return manuallySelectedCandidateIds;
  }, [assignmentMode, candidates, selectedDeptIdsForCandidates, manuallySelectedCandidateIds]);

  const candidateCountsByDept = useMemo(() => {
    const counts: Record<string, number> = {};
    const assignedSet = new Set(assignedCandidateIds);
    candidates.forEach((c) => {
      if (assignedSet.has(c.id) && c.departmentId) {
        counts[c.departmentId] = (counts[c.departmentId] || 0) + 1;
      }
    });
    return counts;
  }, [candidates, assignedCandidateIds]);

  // -------------------------------------------------------------
  // Step 4: Review, Validation & Submission
  // -------------------------------------------------------------
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishedResult, setPublishedResult] = useState<{ examId: string; scheduleId: string } | null>(null);

  const warnings = useMemo(() => {
    const list: string[] = [];
    if (selectedCommonIds.length < commonQuestionTarget) {
      list.push(
        `Part A (Common) has ${selectedCommonIds.length}/${commonQuestionTarget} questions selected.`
      );
    }

    departments.forEach((dept) => {
      const deptSelected = (selectedDeptIdsByDept[dept.id] || []).length;
      const deptCandidates = candidateCountsByDept[dept.id] || 0;
      if (deptCandidates > 0 && deptSelected < deptQuestionTarget) {
        list.push(
          `${dept.name} (${dept.code || "DEPT"}) has ${deptCandidates} candidate(s) enrolled, but only ${deptSelected}/${deptQuestionTarget} questions selected.`
        );
      }
    });

    if (assignedCandidateIds.length === 0) {
      list.push("No candidates are currently assigned to this examination schedule.");
    }

    return list;
  }, [
    selectedCommonIds,
    commonQuestionTarget,
    departments,
    selectedDeptIdsByDept,
    deptQuestionTarget,
    candidateCountsByDept,
    assignedCandidateIds,
  ]);

  const handlePublish = async (status: "draft" | "published") => {
    setPublishError(null);

    const deptSections = departments
      .filter((dept) => {
        const ids = selectedDeptIdsByDept[dept.id] || [];
        return ids.length > 0;
      })
      .map((dept) => ({
        departmentId: dept.id,
        departmentName: dept.name,
        title: `Part B — ${dept.name} (${dept.code || "Subject"})`,
        questionIds: selectedDeptIdsByDept[dept.id] || [],
      }));

    const payload = {
      title,
      description,
      instructions,
      departmentId: departmentId || undefined,
      targetDurationMinutes,
      passingPercentage,
      correctMarksPerQuestion: marksPerQuestion,
      enableNegativeMarking,
      defaultNegativePenalty,
      enablePartialMarking,
      requireSectionalCutoff,
      shuffleQuestions,
      shuffleOptions,
      allowBacktracking,
      requireSafeBrowser,
      enableWebcamProctoring,
      calculatorType,
      commonSection: {
        title: "Part A — Research Aptitude & Universal Common",
        questionIds: selectedCommonIds,
      },
      deptSections,
      schedule: {
        startAt: startIso,
        endAt: endIso,
        durationMinutes: targetDurationMinutes,
        windowType,
        maxCandidates: null,
        proctoringLevel,
      },
      candidateIds: assignedCandidateIds,
      publishStatus: status,
    };

    startTransition(async () => {
      const res = await quickPublishExamWizardAction(payload);
      if (!res.success || !res.data) {
        setPublishError(res.error || "Failed to finalize examination wizard");
      } else {
        setPublishedResult(res.data);
      }
    });
  };

  const handleOpenUploadModal = async (bankId?: string) => {
    if (bankId) {
      setActiveUploadBankId(bankId);
      setIsUploadModalOpen(true);
      return;
    }

    if (questionBanks.length > 0) {
      setActiveUploadBankId(questionBanks[0].id);
      setIsUploadModalOpen(true);
    } else {
      const res = await getOrCreateDefaultBankAction(title);
      if (res.success && res.data) {
        setActiveUploadBankId(res.data.bankId);
        setIsUploadModalOpen(true);
      }
    }
  };

  // -------------------------------------------------------------
  // Render Success Screen
  // -------------------------------------------------------------
  if (publishedResult) {
    return (
      <div className="max-w-2xl mx-auto py-12 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-8 sm:p-10 text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-emerald-100 shadow-inner">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
            Exam Blueprint Created & Published!
          </h2>
          <p className="text-slate-600 text-sm max-w-md mx-auto mb-8 leading-relaxed">
            <span className="font-semibold text-slate-900">{title}</span> is configured with
            universal sections, department questions, schedule window, and candidate enrollment.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8 text-left">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-xs uppercase font-bold text-slate-400 block mb-1">Questions</span>
              <span className="text-base font-bold text-slate-900">
                {selectedCommonIds.length + Object.values(selectedDeptIdsByDept).reduce((a, b) => a + b.length, 0)} Total Qs
              </span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-xs uppercase font-bold text-slate-400 block mb-1">Schedule</span>
              <span className="text-base font-bold text-slate-900 truncate block">{examDate}</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-xs uppercase font-bold text-slate-400 block mb-1">Candidates</span>
              <span className="text-base font-bold text-indigo-600">
                {assignedCandidateIds.length} Enrolled
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Link
              href={`/examiner/exams/${publishedResult.examId}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
            >
              <Eye className="w-4 h-4" />
              View Blueprint
            </Link>
            <Link
              href="/examiner/schedules"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-colors"
            >
              <Calendar className="w-4 h-4 text-slate-500" />
              Schedules Hub
            </Link>
            <Link
              href="/examiner"
              className="px-5 py-3 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Master Card — Refined, Proportional Full-Width UI Scale Design
  // -------------------------------------------------------------
  return (
    <div className="w-full space-y-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Header with Clean Padding */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8.5 h-8.5 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Layers className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  New Examination Blueprint
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60 uppercase tracking-wide shrink-0">
                  Draft Setup
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                Configure curriculum parameters, academic faculty, negative scoring, and proctoring safeguards.
              </p>
            </div>
          </div>

          {/* Stepper Navigation Strip */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/80 shrink-0">
            {[
              { step: 1, label: "1. Specs" },
              { step: 2, label: "2. Pool" },
              { step: 3, label: "3. Schedule" },
              { step: 4, label: "4. Review" },
            ].map((item) => {
              const isCurrent = currentStep === item.step;
              const isCompleted = currentStep > item.step;
              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => setCurrentStep(item.step as WizardStep)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isCurrent
                      ? "bg-indigo-600 text-white shadow-2xs font-bold"
                      : isCompleted
                      ? "text-emerald-700 hover:bg-emerald-50"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  {isCompleted && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Body with Refined Compact Typography & Proportional Spacing */}
        <div className="p-5 space-y-5 text-xs">
          {/* ------------------------------------------------------- */}
          {/* STEP 1: Specs & Security Form */}
          {/* ------------------------------------------------------- */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* LEFT COLUMN: Blueprint Essentials & Timing (6 Cols) */}
                <div className="lg:col-span-6 space-y-3.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Curriculum & Assessment Specs</span>
                  </div>

                  {/* Examination Title */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Examination Title <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Ph.D. Entrance Assessment 2026 — Engineering & Technology"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white text-slate-900 placeholder:text-slate-400 transition-all font-medium"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Official title displayed on admit cards and candidate test screens.
                    </p>
                  </div>

                  {/* Faculty / Dept */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Academic Faculty / Department
                    </label>
                    <div className="relative">
                      <select
                        value={departmentId}
                        onChange={(e) => setDepartmentId(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white text-slate-900 font-medium transition-all cursor-pointer appearance-none pr-8"
                      >
                        <option value="">Universal Common (All Faculties)</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name} ({dept.code || "DEPT"})
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                        <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Filters eligible question banks and candidate registration pools.
                    </p>
                  </div>

                  {/* Duration & Cutoff Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">Duration</label>
                        <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                          {Math.floor(targetDurationMinutes / 60)}h {targetDurationMinutes % 60}m
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min={15}
                          max={600}
                          value={targetDurationMinutes}
                          onChange={(e) => setTargetDurationMinutes(Number(e.target.value))}
                          className="w-full pl-3 pr-10 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white text-slate-900 font-bold"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-400 pointer-events-none">
                          mins
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">Cutoff Score</label>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          Pass Mark
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={passingPercentage}
                          onChange={(e) => setPassingPercentage(Number(e.target.value))}
                          className="w-full pl-3 pr-8 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white text-slate-900 font-bold"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-400 pointer-events-none">
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 20 Common + 30 Dept Question Split Widget */}
                  <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-950">
                        Question Architecture (50 Total Qs)
                      </span>
                      <span className="text-[11px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-100 shadow-2xs">
                        {(commonQuestionTarget + deptQuestionTarget) * marksPerQuestion} Marks Total
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-2.5 bg-white rounded-lg border border-indigo-100 shadow-2xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-800">Part A (Common)</span>
                          <span className="font-bold text-indigo-600 text-xs">{commonQuestionTarget} Qs</span>
                        </div>
                        <input
                          type="range"
                          min={10}
                          max={35}
                          step={5}
                          value={commonQuestionTarget}
                          onChange={(e) => setCommonQuestionTarget(Number(e.target.value))}
                          className="w-full accent-indigo-600 h-1.5 cursor-pointer"
                        />
                      </div>

                      <div className="p-2.5 bg-white rounded-lg border border-indigo-100 shadow-2xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-800">Part B (Dept)</span>
                          <span className="font-bold text-indigo-600 text-xs">{deptQuestionTarget} Qs</span>
                        </div>
                        <input
                          type="range"
                          min={15}
                          max={45}
                          step={5}
                          value={deptQuestionTarget}
                          onChange={(e) => setDeptQuestionTarget(Number(e.target.value))}
                          className="w-full accent-indigo-600 h-1.5 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Description / Syllabus Scope */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Syllabus Scope & Topics
                      </label>
                      <span className="text-[10px] text-slate-400">Optional</span>
                    </div>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Doctoral entrance curriculum, subject syllabus topics, and qualifying criteria..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white text-slate-900 placeholder:text-slate-400 resize-none font-medium"
                    />
                  </div>

                  {/* Candidate Guidelines */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Candidate Guidelines & Instructions
                      </label>
                      <span className="text-[10px] text-slate-400">Optional</span>
                    </div>
                    <textarea
                      rows={2}
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="Lockdown browser mandatory. Scientific calculator permitted. No external reference aids."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white text-slate-900 placeholder:text-slate-400 resize-none font-medium"
                    />
                  </div>
                </div>

                {/* RIGHT COLUMN: Grading Engine & Security Safeguards (6 Cols) */}
                <div className="lg:col-span-6 space-y-3.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <Scale className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Evaluation Rules & Security Policies</span>
                  </div>

                  {/* Scoring & Negative Marking Scheme Card */}
                  <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/90 space-y-3">
                    {/* Negative Marking Main Toggle */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-100/80 text-indigo-700 flex items-center justify-center shrink-0">
                          <Scale className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900">Negative Marking Scheme</span>
                          <InfoHelp
                            title="Negative Marking Scheme"
                            content="Deducts penalty marks for incorrect objective responses to eliminate random guessing."
                            align="left"
                          />
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              enableNegativeMarking
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-slate-200/70 text-slate-600"
                            }`}
                          >
                            {enableNegativeMarking ? "Active" : "Disabled"}
                          </span>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={enableNegativeMarking}
                          onChange={(e) => setEnableNegativeMarking(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    {/* Penalty Rate Pill Bar */}
                    {enableNegativeMarking && (
                      <div className="p-3 bg-white border border-indigo-100 rounded-lg space-y-2 animate-in fade-in duration-150 shadow-2xs">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">Deduction Penalty Rate:</span>
                          <span className="font-bold text-indigo-700 font-mono">
                            -{defaultNegativePenalty} marks/wrong
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { label: "-0.25", val: 0.25, desc: "1/4 Mark" },
                            { label: "-0.33", val: 0.33, desc: "1/3 Mark" },
                            { label: "-0.50", val: 0.5, desc: "1/2 Mark" },
                            { label: "-1.00", val: 1.0, desc: "Full Mark" },
                          ].map((opt) => (
                            <button
                              key={opt.val}
                              type="button"
                              onClick={() => setDefaultNegativePenalty(opt.val)}
                              className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                                defaultNegativePenalty === opt.val
                                  ? "bg-indigo-600 text-white font-bold shadow-2xs"
                                  : "bg-slate-50 border border-slate-200 text-slate-700 hover:border-indigo-300"
                              }`}
                            >
                              <span className="block text-xs font-bold">{opt.label}</span>
                              <span
                                className={`block text-[9px] ${
                                  defaultNegativePenalty === opt.val ? "text-indigo-100" : "text-slate-400"
                                }`}
                              >
                                {opt.desc}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Partial & Sectional Cutoff Rules */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-slate-200/70">
                      <label
                        className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                          enablePartialMarking
                            ? "bg-indigo-50/50 border-indigo-200 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={enablePartialMarking}
                            onChange={(e) => setEnablePartialMarking(e.target.checked)}
                            className="sr-only"
                          />
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                              enablePartialMarking
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {enablePartialMarking && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="font-semibold text-slate-800 text-xs whitespace-nowrap">Partial Credit MCQs</span>
                        </div>
                        <InfoHelp
                          title="Partial Marks"
                          content="Students get proportional marks for each correct option selected."
                        />
                      </label>

                      <label
                        className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                          requireSectionalCutoff
                            ? "bg-indigo-50/50 border-indigo-200 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={requireSectionalCutoff}
                            onChange={(e) => setRequireSectionalCutoff(e.target.checked)}
                            className="sr-only"
                          />
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                              requireSectionalCutoff
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {requireSectionalCutoff && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="font-semibold text-slate-800 text-xs whitespace-nowrap">Mandate Sectional Cutoff</span>
                        </div>
                        <InfoHelp
                          title="Sectional Cutoff"
                          content="Students must score above passing marks in each section individually."
                        />
                      </label>
                    </div>
                  </div>

                  {/* Security & Integrity Safeguards Card */}
                  <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/90 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0">
                        <Shield className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block leading-tight">
                          Security & Delivery Safeguards
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Automated lockdown controls and anti-collusion measures
                        </span>
                      </div>
                    </div>

                    {/* Interactive Safeguards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Safe Lockdown Browser */}
                      <label
                        className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                          requireSafeBrowser
                            ? "bg-indigo-50/50 border-indigo-200 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={requireSafeBrowser}
                            onChange={(e) => setRequireSafeBrowser(e.target.checked)}
                            className="sr-only"
                          />
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                              requireSafeBrowser
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {requireSafeBrowser && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Lock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="font-semibold text-slate-800 text-xs whitespace-nowrap">Safe Lockdown Browser</span>
                          </div>
                        </div>
                        <InfoHelp
                          title="Lockdown Browser"
                          content="Full-screen kiosk mode, disabling alt-tab, screenshots, and dual screens."
                        />
                      </label>

                      {/* Webcam & AI Proctoring */}
                      <label
                        className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                          enableWebcamProctoring
                            ? "bg-indigo-50/50 border-indigo-200 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={enableWebcamProctoring}
                            onChange={(e) => setEnableWebcamProctoring(e.target.checked)}
                            className="sr-only"
                          />
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                              enableWebcamProctoring
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {enableWebcamProctoring && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Video className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="font-semibold text-slate-800 text-xs whitespace-nowrap">Live Webcam Proctoring</span>
                          </div>
                        </div>
                        <InfoHelp
                          title="Webcam Proctoring"
                          content="Continuous candidate video stream verification and gaze detection."
                        />
                      </label>

                      {/* Randomize Questions */}
                      <label
                        className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                          shuffleQuestions
                            ? "bg-indigo-50/50 border-indigo-200 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={shuffleQuestions}
                            onChange={(e) => setShuffleQuestions(e.target.checked)}
                            className="sr-only"
                          />
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                              shuffleQuestions
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {shuffleQuestions && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Shuffle className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="font-semibold text-slate-800 text-xs whitespace-nowrap">Randomize Questions</span>
                          </div>
                        </div>
                        <InfoHelp
                          title="Randomize Questions"
                          content="Generates a unique question order for each candidate."
                        />
                      </label>

                      {/* Shuffle Options (A-D) */}
                      <label
                        className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                          shuffleOptions
                            ? "bg-indigo-50/50 border-indigo-200 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={shuffleOptions}
                            onChange={(e) => setShuffleOptions(e.target.checked)}
                            className="sr-only"
                          />
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                              shuffleOptions
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {shuffleOptions && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Shuffle className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="font-semibold text-slate-800 text-xs whitespace-nowrap">Shuffle Option Choices</span>
                          </div>
                        </div>
                        <InfoHelp
                          title="Shuffle Options"
                          content="Permutes option choices (A–D) randomly for each candidate."
                        />
                      </label>

                      {/* Allow Question Backtracking & Review */}
                      <label
                        className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none sm:col-span-2 ${
                          allowBacktracking
                            ? "bg-indigo-50/50 border-indigo-200 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={allowBacktracking}
                            onChange={(e) => setAllowBacktracking(e.target.checked)}
                            className="sr-only"
                          />
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                              allowBacktracking
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {allowBacktracking && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <span className="font-semibold text-slate-800 text-xs whitespace-nowrap">
                            Allow Question Backtracking & Review
                          </span>
                        </div>
                        <InfoHelp
                          title="Backtracking"
                          content="Candidates can navigate back and forth and edit answers before final submission."
                        />
                      </label>
                    </div>

                    {/* Calculator Policy 3-Card Selector */}
                    <div className="pt-2.5 border-t border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <Calculator className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-bold text-slate-900">In-Exam Digital Calculator</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {calculatorType === "none" ? "Disabled" : calculatorType === "basic" ? "Basic" : "Scientific"}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setCalculatorType("none")}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            calculatorType === "none"
                              ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                              : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/60"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="text-xs font-bold">Prohibited</span>
                            <div className={`w-2 h-2 rounded-full ${calculatorType === "none" ? "bg-rose-400" : "bg-slate-300"}`} />
                          </div>
                          <span className={`text-[10px] leading-tight ${calculatorType === "none" ? "text-slate-300" : "text-slate-400"}`}>
                            No tool allowed
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCalculatorType("basic")}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            calculatorType === "basic"
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                              : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/60"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="text-xs font-bold">Basic</span>
                            <div className={`w-2 h-2 rounded-full ${calculatorType === "basic" ? "bg-emerald-300" : "bg-slate-300"}`} />
                          </div>
                          <span className={`text-[10px] leading-tight ${calculatorType === "basic" ? "text-indigo-100" : "text-slate-400"}`}>
                            + − × ÷ % Arithmetic
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCalculatorType("scientific")}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            calculatorType === "scientific"
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                              : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/60"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="text-xs font-bold">Scientific</span>
                            <div className={`w-2 h-2 rounded-full ${calculatorType === "scientific" ? "bg-emerald-300" : "bg-slate-300"}`} />
                          </div>
                          <span className={`text-[10px] leading-tight ${calculatorType === "scientific" ? "text-indigo-100" : "text-slate-400"}`}>
                            LaTeX, Trig, Log, √
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------- */}
          {/* STEP 2: Question Pool Selection Studio */}
          {/* ------------------------------------------------------- */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* 1. Header & Executive Action Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">Question Pool Studio & Allocation</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Ph.D 20+30 Standard
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Curate 20 Universal Foundation items (Part A) and 30 Department items (Part B) per stream.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleAutoPick}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs hover:shadow-sm active:scale-[0.98]"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>⚡ Auto-Pick (20+30)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenUploadModal(activeDeptTab === "common" ? undefined : questionBanks.find(b => b.departmentId === activeDeptTab)?.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Bulk Upload</span>
                  </button>
                </div>
              </div>

              {/* 2. Live Executive Telemetry Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Part A Telemetry Card */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  activeDeptTab === "common"
                    ? "bg-indigo-50/40 border-indigo-200 shadow-2xs ring-1 ring-indigo-100"
                    : "bg-white border-slate-200"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                      <span className="text-xs font-bold text-slate-900">Part A — Universal Common</span>
                      <span className="text-[10px] text-slate-400 font-medium">(All Candidates)</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedCommonIds.length >= commonQuestionTarget
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      {selectedCommonIds.length >= commonQuestionTarget
                        ? `✓ Ready (${selectedCommonIds.length}/${commonQuestionTarget})`
                        : `${selectedCommonIds.length}/${commonQuestionTarget} Selected`}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full transition-all duration-300 ${
                        selectedCommonIds.length >= commonQuestionTarget ? "bg-emerald-500" : "bg-indigo-600"
                      }`}
                      style={{ width: `${Math.min(100, Math.round((selectedCommonIds.length / commonQuestionTarget) * 100))}%` }}
                    />
                  </div>

                  {/* Difficulty Distribution of Selected */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {commonEasyCount} Easy
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        {commonMedCount} Med
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        {commonHardCount} Hard
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Pool Bank: {commonQuestionsPool.length} Qs
                    </span>
                  </div>
                </div>

                {/* Part B Telemetry Card */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  activeDeptTab !== "common"
                    ? "bg-purple-50/30 border-purple-200 shadow-2xs ring-1 ring-purple-100"
                    : "bg-white border-slate-200"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-600" />
                      <span className="text-xs font-bold text-slate-900">Part B — Department Specific</span>
                      <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-1.5 py-0.2 rounded border border-purple-100">
                        {departments.length} Streams
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      fulfilledDeptsCount === departments.length
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-indigo-50 text-indigo-700"
                    }`}>
                      {fulfilledDeptsCount}/{departments.length} Depts Ready
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full transition-all duration-300 ${
                        fulfilledDeptsCount === departments.length ? "bg-emerald-500" : "bg-purple-600"
                      }`}
                      style={{ width: `${departments.length > 0 ? Math.round((fulfilledDeptsCount / departments.length) * 100) : 0}%` }}
                    />
                  </div>

                  {/* Active Dept Context or Overall info */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    {activeDeptTab === "common" ? (
                      <span className="text-slate-500 text-[11px]">
                        Switch to any department tab below to inspect branch pools
                      </span>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {departmentMetaMap[activeDeptTab]?.code || departmentMetaMap[activeDeptTab]?.name}:
                          </span>
                          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {activeDeptEasyCount} Easy
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            {activeDeptMedCount} Med
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            {activeDeptHardCount} Hard
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Pool: {(deptQuestionsPoolMap[activeDeptTab] || []).length} Qs
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Department Stream Tab Strip */}
              <div className="bg-slate-50/70 p-1.5 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
                  {/* Part A Tab */}
                  <button
                    type="button"
                    onClick={() => setActiveDeptTab("common")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border ${
                      activeDeptTab === "common"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <Globe className={`w-3.5 h-3.5 ${activeDeptTab === "common" ? "text-white" : "text-indigo-600"}`} />
                    <span>Part A (Common)</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        activeDeptTab === "common"
                          ? "bg-indigo-700 text-white"
                          : selectedCommonIds.length >= commonQuestionTarget
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {selectedCommonIds.length >= commonQuestionTarget && "✓ "}
                      {selectedCommonIds.length}/{commonQuestionTarget}
                    </span>
                  </button>

                  <div className="w-px h-5 bg-slate-300/70 mx-1 shrink-0" />

                  {/* Dept Tabs */}
                  {departments.map((dept) => {
                    const count = (selectedDeptIdsByDept[dept.id] || []).length;
                    const isSelected = activeDeptTab === dept.id;
                    const isReady = count >= deptQuestionTarget;
                    const hasPartial = count > 0 && !isReady;

                    return (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => setActiveDeptTab(dept.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <span>{dept.code || dept.name}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            isSelected
                              ? "bg-indigo-700 text-white"
                              : isReady
                              ? "bg-emerald-100 text-emerald-800"
                              : hasPartial
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isReady && "✓ "}
                          {count}/{deptQuestionTarget}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Shortfall Guidance Banner (if active pool is insufficient) */}
              {activePoolShortfall > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-amber-900 font-medium">
                      Repository has only <strong className="font-bold">{activePoolAvailableCount}</strong> questions available (Target: <strong className="font-bold">{activeTargetCount}</strong> questions).
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenUploadModal(activeDeptTab === "common" ? undefined : questionBanks.find(b => b.departmentId === activeDeptTab)?.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-[11px] font-bold shrink-0 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Import +{activePoolShortfall} Qs</span>
                  </button>
                </div>
              )}

              {/* 5. Filter & Selection Management Toolbar */}
              <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
                {/* Search Input */}
                <div className="relative flex-1 min-w-[200px]">
                  <input
                    type="text"
                    value={questionSearch}
                    onChange={(e) => setQuestionSearch(e.target.value)}
                    placeholder="Search question statement, topic, or subject..."
                    className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 font-medium shadow-2xs"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  {questionSearch && (
                    <button
                      type="button"
                      onClick={() => setQuestionSearch("")}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Filter Controls */}
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {/* Difficulty Filter */}
                  <select
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-600 shadow-2xs cursor-pointer"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="1">🟢 Easy (Level 1)</option>
                    <option value="2">🔵 Medium (Level 2)</option>
                    <option value="3">🔴 Hard (Level 3+)</option>
                  </select>

                  {/* Selection Status Filter */}
                  <select
                    value={filterSelectionStatus}
                    onChange={(e) => setFilterSelectionStatus(e.target.value as any)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-600 shadow-2xs cursor-pointer"
                  >
                    <option value="all">All Questions ({activeTabPool.length})</option>
                    <option value="selected">Selected ({activeTabSelectedIds.length})</option>
                    <option value="unselected">Unselected ({Math.max(0, activeTabPool.length - activeTabSelectedIds.length)})</option>
                  </select>

                  {/* Batch Select / Clear */}
                  <button
                    type="button"
                    onClick={handleToggleSelectAllActiveTab}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                  >
                    {isAllActiveTabSelected ? "Deselect All in View" : "Select All in View"}
                  </button>

                  {/* Expand / Collapse All Options */}
                  <button
                    type="button"
                    onClick={handleToggleExpandAll}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                    title={isAllExpanded ? "Collapse all question answer choices" : "Expand all question answer choices"}
                  >
                    {isAllExpanded ? "Collapse Choices" : "Preview Choices"}
                  </button>
                </div>
              </div>

              {/* 6. Question List Studio */}
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {filteredActiveQuestions.length === 0 ? (
                  <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center shadow-2xs">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                      <Search className="w-5 h-5" />
                    </div>
                    <h5 className="text-xs font-bold text-slate-900">No questions match your current filters</h5>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                      {questionSearch || filterDifficulty !== "all" || filterSelectionStatus !== "all"
                        ? "Try resetting search keyword or difficulty filters."
                        : "No questions currently exist in this department pool. Author or bulk import questions to proceed."}
                    </p>
                    {(questionSearch || filterDifficulty !== "all" || filterSelectionStatus !== "all") && (
                      <button
                        type="button"
                        onClick={() => {
                          setQuestionSearch("");
                          setFilterDifficulty("all");
                          setFilterSelectionStatus("all");
                        }}
                        className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                ) : (
                  filteredActiveQuestions.map((q, idx) => {
                    const isChecked = activeTabSelectedIds.includes(q.id);
                    const isExpanded = isAllExpanded || expandedQuestionIds.has(q.id);
                    const options = Array.isArray(q.options)
                      ? q.options
                      : Array.isArray(q.content?.options)
                      ? q.content.options
                      : [];
                    const correctAnswer = q.correct_answer || q.content?.correct_answer || q.content?.correctAnswer;

                    return (
                      <div
                        key={q.id}
                        className={`rounded-xl border transition-all p-3.5 ${
                          isChecked
                            ? "bg-indigo-50/30 border-indigo-300 ring-1 ring-indigo-200/80 shadow-2xs"
                            : "bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs"
                        }`}
                      >
                        {/* Question Header Metadata Row */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Selection Checkbox */}
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleQuestionInActiveTab(q.id)}
                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                #{idx + 1}
                              </span>
                            </label>

                            {/* Scope Badge */}
                            {q.is_common ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 inline-flex items-center gap-1">
                                <Globe className="w-3 h-3 text-indigo-600" />
                                <span>Part A: Common</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-700 inline-flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-purple-600" />
                                <span>{departmentMetaMap[q.department_id || ""]?.code || "Part B: Dept"}</span>
                              </span>
                            )}

                            {/* Subject / Bank Badge */}
                            <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                              {q.subject || bankNameMap[q.bank_id] || "Subject"}
                            </span>

                            {/* Topic (if any) */}
                            {q.topic && (
                              <span className="text-[10px] font-medium text-slate-500 hidden sm:inline">
                                • {q.topic}
                              </span>
                            )}
                          </div>

                          {/* Right Badges: Difficulty, Marks, Choices toggle */}
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Difficulty Badge */}
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border inline-flex items-center gap-1 ${
                                (q.difficulty ?? 2) === 1
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                  : (q.difficulty ?? 2) === 2
                                  ? "bg-blue-50 border-blue-200 text-blue-800"
                                  : "bg-rose-50 border-rose-200 text-rose-800"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  (q.difficulty ?? 2) === 1
                                    ? "bg-emerald-500"
                                    : (q.difficulty ?? 2) === 2
                                    ? "bg-blue-500"
                                    : "bg-rose-500"
                                }`}
                              />
                              <span>
                                {(q.difficulty ?? 2) === 1
                                  ? "L1 Easy"
                                  : (q.difficulty ?? 2) === 2
                                  ? "L2 Medium"
                                  : "L3 Hard"}
                              </span>
                            </span>

                            {/* Marks */}
                            <span className="text-[10px] font-bold text-slate-500 px-1.5 py-0.5 bg-slate-100 rounded">
                              +{marksPerQuestion}.0
                            </span>

                            {/* Expand / Collapse Choices */}
                            {options.length > 0 && (
                              <button
                                type="button"
                                onClick={() => toggleExpandQuestion(q.id)}
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/60 hover:bg-indigo-100/70 border border-indigo-100 px-2 py-0.5 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1"
                              >
                                <span>{isExpanded ? "Hide" : `${options.length} Options`}</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Question Statement */}
                        <div
                          onClick={() => toggleQuestionInActiveTab(q.id)}
                          className="text-xs font-medium text-slate-900 leading-relaxed cursor-pointer"
                        >
                          {q.content?.text || "No question statement provided."}
                        </div>

                        {/* LaTeX Formula if present */}
                        {q.content?.latex && (
                          <div className="mt-2 p-2 bg-slate-50 border border-indigo-100 rounded-lg font-mono text-[11px] text-indigo-950">
                            <span className="text-[9px] uppercase font-bold text-indigo-600 block mb-0.5">
                              Mathematical Formula:
                            </span>
                            {q.content.latex}
                          </div>
                        )}

                        {/* Code Snippet if present */}
                        {q.content?.codeSnippet && (
                          <div className="mt-2 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 p-2.5">
                            <div className="text-[9px] uppercase font-mono font-bold text-slate-400 mb-1">
                              Template ({q.content.programmingLanguage || "Code"}):
                            </div>
                            <pre className="text-[11px] font-mono text-emerald-400 overflow-x-auto">
                              {q.content.codeSnippet}
                            </pre>
                          </div>
                        )}

                        {/* Options & Choices (if expanded) */}
                        {isExpanded && options.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-100">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {options.map((opt: any, optIdx: number) => {
                                const isCorrect =
                                  Array.isArray(correctAnswer)
                                    ? correctAnswer.includes(opt.id) || correctAnswer.includes(String.fromCharCode(65 + optIdx))
                                    : correctAnswer === opt.id ||
                                      correctAnswer === String.fromCharCode(65 + optIdx) ||
                                      correctAnswer === opt.text;

                                return (
                                  <div
                                    key={opt.id || optIdx}
                                    className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-2 ${
                                      isCorrect
                                        ? "bg-emerald-50/90 border-emerald-300 text-emerald-950 font-semibold shadow-2xs"
                                        : "bg-slate-50/70 border-slate-200/80 text-slate-700"
                                    }`}
                                  >
                                    <span
                                      className={`w-4.5 h-4.5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                        isCorrect
                                          ? "bg-emerald-600 text-white"
                                          : "bg-slate-200 text-slate-600"
                                      }`}
                                    >
                                      {String.fromCharCode(65 + optIdx)}
                                    </span>
                                    <span className="flex-1 min-w-0 truncate">{opt.text}</span>
                                    {isCorrect && (
                                      <span className="text-[9px] font-bold uppercase text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded shrink-0">
                                        ✓ Correct
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Explanation if present */}
                            {q.explanation && (
                              <div className="mt-2 p-2 bg-indigo-50/40 border border-indigo-100 rounded-lg text-[11px] text-slate-600">
                                <span className="font-bold text-indigo-900 block text-[10px] mb-0.5">
                                  Answer Key Rationale:
                                </span>
                                {q.explanation}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------- */}
          {/* STEP 3: Scheduling & Candidate Assignment */}
          {/* ------------------------------------------------------- */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100/80 text-indigo-700 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Delivery Schedule & Candidate Enrollment</h4>
                    <p className="text-[11px] text-slate-500">
                      Specify execution date, window duration, proctoring tier, and candidate assignments.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                  {assignedCandidateIds.length} Candidates Selected
                </span>
              </div>

              {/* Schedule Window Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Examination Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Computed Window
                  </label>
                  <div className="px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 font-bold text-slate-800 text-xs truncate">
                    {formattedTimeWindow}
                  </div>
                </div>
              </div>

              {/* Proctoring Level Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Proctoring Security Tier
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { tier: "none" as const, title: "Standard Kiosk", icon: Shield },
                    { tier: "basic" as const, title: "Basic Lockdown", icon: Lock },
                    { tier: "standard" as const, title: "AI Webcam", icon: Sparkles, rec: true },
                    { tier: "full" as const, title: "Live Proctor", icon: Users },
                  ].map((p) => {
                    const Icon = p.icon;
                    const isSelected = proctoringLevel === p.tier;
                    return (
                      <button
                        key={p.tier}
                        type="button"
                        onClick={() => setProctoringLevel(p.tier)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-500 text-indigo-900 shadow-2xs ring-1 ring-indigo-500"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Icon className={`w-4 h-4 ${isSelected ? "text-indigo-600" : "text-slate-400"}`} />
                          {p.rec && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-indigo-600 text-white">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-bold">{p.title}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Candidate Enrollment Strategy */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Candidate Enrollment Strategy
                </span>

                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                  {[
                    { mode: "all" as const, label: `⚡ Assign All Eligible (${candidates.length})` },
                    { mode: "departments" as const, label: "Filter by Department" },
                    { mode: "manual" as const, label: "Manual Selection" },
                  ].map((s) => (
                    <button
                      key={s.mode}
                      type="button"
                      onClick={() => setAssignmentMode(s.mode)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        assignmentMode === s.mode ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {assignmentMode === "departments" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    {departments.map((dept) => {
                      const isChecked = selectedDeptIdsForCandidates.includes(dept.id);
                      const deptCandidatesCount = candidates.filter((c) => c.departmentId === dept.id).length;
                      return (
                        <label
                          key={dept.id}
                          className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 text-xs font-medium cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDeptIdsForCandidates((prev) => [...prev, dept.id]);
                              } else {
                                setSelectedDeptIdsForCandidates((prev) => prev.filter((id) => id !== dept.id));
                              }
                            }}
                            className="text-indigo-600 rounded"
                          />
                          <span className="truncate">{dept.code || dept.name}</span>
                          <span className="text-[10px] text-slate-400 ml-auto">({deptCandidatesCount})</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {assignmentMode === "manual" && (
                  <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      value={candidateSearch}
                      onChange={(e) => setCandidateSearch(e.target.value)}
                      placeholder="Search candidate name or email..."
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 bg-white border border-slate-200 rounded-lg">
                      {candidates
                        .filter((c) => {
                          if (!candidateSearch.trim()) return true;
                          return c.fullName.toLowerCase().includes(candidateSearch.toLowerCase());
                        })
                        .map((c) => {
                          const isChecked = manuallySelectedCandidateIds.includes(c.id);
                          return (
                            <label key={c.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 cursor-pointer">
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setManuallySelectedCandidateIds((prev) => [...prev, c.id]);
                                    } else {
                                      setManuallySelectedCandidateIds((prev) => prev.filter((id) => id !== c.id));
                                    }
                                  }}
                                  className="text-indigo-600 rounded"
                                />
                                <span className="font-semibold text-slate-800">{c.fullName}</span>
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {departmentMetaMap[c.departmentId || ""]?.code || "Universal"}
                              </span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------- */}
          {/* STEP 4: Review, Validation & Final Publish */}
          {/* ------------------------------------------------------- */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Pre-Flight Review & Atomic Publish</h4>
                    <p className="text-[11px] text-slate-500">
                      Verify examination parameters, question links, and candidate enrollment before publishing.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  Ready for Activation
                </span>
              </div>

              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-amber-900">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Readiness Checklist ({warnings.length})</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-xs">
                    {warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Review Summary Box */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/60">
                <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{description}</p>
                  </div>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-bold">
                    50 Total Qs • {(commonQuestionTarget + deptQuestionTarget) * marksPerQuestion} Marks
                  </span>
                </div>

                <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Date & Window</span>
                    <span className="font-bold text-slate-900 truncate block mt-0.5">{examDate}</span>
                    <span className="text-[10px] text-slate-500">{formattedTimeWindow}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Structure</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">
                      {commonQuestionTarget} Common + {deptQuestionTarget} Dept
                    </span>
                    <span className="text-[10px] text-slate-500">+{marksPerQuestion}M per Q • Pass {passingPercentage}%</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Candidates</span>
                    <span className="font-bold text-indigo-600 mt-0.5 block">{assignedCandidateIds.length} Enrolled</span>
                    <span className="text-[10px] text-slate-500">{departments.length} Departments</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Security</span>
                    <span className="font-bold text-slate-900 mt-0.5 block capitalize">{proctoringLevel}</span>
                    <span className="text-[10px] text-slate-500">Lockdown Browser Active</span>
                  </div>
                </div>
              </div>

              {publishError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{publishError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between bg-white shrink-0 text-xs">
          <span className="text-slate-400 text-xs hidden sm:inline-block">
            {currentStep === 1
              ? "Sections, question items, and mark allocation will be assembled in the wizard next."
              : currentStep === 2
              ? "Question selections will be mapped to universal Part A and department Part B."
              : currentStep === 3
              ? "Candidates will be automatically allocated to this exam session."
              : "Review all parameters before activating exam delivery."}
          </span>

          <div className="flex items-center gap-2.5 ml-auto">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((currentStep - 1) as WizardStep)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
            ) : (
              <Link
                href="/examiner/exams"
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold transition-colors text-xs"
              >
                Cancel
              </Link>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((currentStep + 1) as WizardStep)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer text-xs"
              >
                <span>
                  {currentStep === 1
                    ? "Next: Question Pool"
                    : currentStep === 2
                    ? "Next: Schedule & Roster"
                    : "Next: Review & Publish"}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handlePublish("draft")}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold transition-colors cursor-pointer disabled:opacity-50 text-xs"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handlePublish("published")}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 text-xs"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isPending ? "Finalizing..." : "Publish & Activate Exam"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Embedded Bulk Upload Modal */}
      {isUploadModalOpen && (
        <QuestionBulkModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          bankId={activeUploadBankId}
          bankName="Exam Pool Repository"
          departments={departments.map((d) => ({ id: d.id, name: d.name, code: d.code }))}
          onSuccess={() => {
            setIsUploadModalOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
