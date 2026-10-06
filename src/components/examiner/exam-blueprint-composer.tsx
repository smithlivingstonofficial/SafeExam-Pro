"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createExamSectionAction,
  deleteExamSectionAction,
  bulkAddQuestionsToSectionAction,
  removeQuestionFromSectionAction,
  updateExamStatusAction,
  createQuestionAction,
} from "@/app/actions/examiner";
import {
  Layers,
  PlusCircle,
  Clock,
  Shield,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Globe,
  Building2,
  CalendarCheck,
  Search,
  Filter,
  X,
  Check,
  HelpCircle,
  FileQuestion,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Scale,
  Percent,
  Calculator,
  Shuffle,
  Target,
  ChevronRight,
  FileText,
} from "lucide-react";

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
          className={`absolute bottom-full mb-2 z-50 w-56 sm:w-60 p-2.5 bg-slate-900 text-white text-[11px] leading-relaxed rounded-xl shadow-xl border border-slate-700/80 backdrop-blur-xs animate-in fade-in zoom-in-95 duration-150 pointer-events-none ${
            align === "left" ? "left-0" : "right-0"
          }`}
        >
          {title && <div className="font-bold text-white mb-0.5 text-[11px]">{title}</div>}
          <p className="text-slate-300 text-[10px] leading-snug">{content}</p>
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

interface Department {
  id: string;
  name: string;
  code: string | null;
}

interface QuestionBank {
  id: string;
  name: string;
}

interface AvailableQuestion {
  id: string;
  subject: string;
  type: string;
  difficulty: number;
  content: any;
  bank_id: string;
  is_common?: boolean | null;
  department_id?: string | null;
}

interface SectionQuestion {
  id: string;
  section_id: string;
  question_id: string;
  order_index: number;
  marks: number;
}

interface SectionItem {
  id: string;
  exam_id: string;
  title: string;
  scope: string;
  department_id?: string | null;
  order_index: number;
  time_limit_minutes?: number | null;
  marking_scheme: any;
}

interface ExamBlueprintComposerProps {
  exam: {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    settings?: any;
    created_at: string;
  };
  initialSections: SectionItem[];
  initialSectionQuestions: SectionQuestion[];
  initialLinkedQuestions: AvailableQuestion[];
  availableQuestions: AvailableQuestion[];
  banks: QuestionBank[];
  departments: Department[];
}

export function ExamBlueprintComposer({
  exam,
  initialSections,
  initialSectionQuestions,
  initialLinkedQuestions,
  availableQuestions,
  banks,
  departments,
}: ExamBlueprintComposerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Local state for instant feedback
  const [sections, setSections] = useState<SectionItem[]>(initialSections);
  const [sectionQuestions, setSectionQuestions] = useState<SectionQuestion[]>(initialSectionQuestions);
  const [examStatus, setExamStatus] = useState<string>(exam.status);

  // Modals state
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [activeLinkingSection, setActiveLinkingSection] = useState<SectionItem | null>(null);

  const isNegativeMarkingEnabled = Boolean(exam.settings?.enable_negative_marking);

  // Add Section form state
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionScope, setSectionScope] = useState<"common" | "department_specific">("common");
  const [sectionDeptId, setSectionDeptId] = useState("");
  const [correctMarks, setCorrectMarks] = useState(2.0);
  const [negativeMarks, setNegativeMarks] = useState(
    isNegativeMarkingEnabled ? Number(exam.settings?.default_negative_penalty) || 0.5 : 0
  );
  const [timeLimit, setTimeLimit] = useState<number | "">("");

  // Question Linker Drawer state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBankFilter, setSelectedBankFilter] = useState("all");
  const [scopeFilter, setScopeFilter] = useState<"all" | "common" | "matched">("all");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [linkerMode, setLinkerMode] = useState<"pick" | "create">("pick");

  // In-context Quick Question creation state
  const [quickQuestionText, setQuickQuestionText] = useState("");
  const [quickSubject, setQuickSubject] = useState("");
  const [quickBankId, setQuickBankId] = useState(banks[0]?.id || "");
  const [quickOptions, setQuickOptions] = useState([
    { id: "opt_1", text: "", isCorrect: true },
    { id: "opt_2", text: "", isCorrect: false },
    { id: "opt_3", text: "", isCorrect: false },
    { id: "opt_4", text: "", isCorrect: false },
  ]);

  const deptMap = new Map(departments.map((d) => [d.id, d]));
  const questionMap = new Map(
    [...initialLinkedQuestions, ...availableQuestions].map((q) => [q.id, q])
  );

  // Computations
  const totalQuestionsCount = sectionQuestions.length;
  let totalMarks = 0;
  sectionQuestions.forEach((sq) => {
    totalMarks += Number(sq.marks) || 0;
  });

  const commonQuestionsLinkedCount = sectionQuestions.filter((sq) => {
    const q = questionMap.get(sq.question_id);
    return q?.is_common !== false;
  }).length;

  const deptQuestionsLinkedCount = totalQuestionsCount - commonQuestionsLinkedCount;

  // Handlers
  const handleToggleStatus = (newStatus: "draft" | "published") => {
    startTransition(async () => {
      const res = await updateExamStatusAction(exam.id, newStatus);
      if (res.success) {
        setExamStatus(newStatus);
        router.refresh();
      } else {
        alert(res.error || "Failed to update status");
      }
    });
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionTitle.trim()) return;

    const effectiveNegativeMarks = isNegativeMarkingEnabled ? negativeMarks : 0;

    const formData = new FormData();
    formData.append("examId", exam.id);
    formData.append("title", sectionTitle);
    formData.append("scope", sectionScope);
    if (sectionScope === "department_specific" && sectionDeptId) {
      formData.append("departmentId", sectionDeptId);
    }
    formData.append("correctMarks", String(correctMarks));
    formData.append("negativeMarks", String(effectiveNegativeMarks));
    formData.append("orderIndex", String(sections.length + 1));
    if (timeLimit) {
      formData.append("timeLimitMinutes", String(timeLimit));
    }

    startTransition(async () => {
      const res = await createExamSectionAction(formData);
      if (res.success) {
        setIsAddSectionOpen(false);
        setSectionTitle("");
        setSectionDeptId("");
        setNegativeMarks(
          isNegativeMarkingEnabled ? Number(exam.settings?.default_negative_penalty) || 0.5 : 0
        );
        setTimeLimit("");
        router.refresh();
      } else {
        alert(res.error || "Failed to create section");
      }
    });
  };

  const handleDeleteSection = (sectionId: string) => {
    if (!confirm("Are you sure you want to remove this section and unlink its questions?")) {
      return;
    }
    startTransition(async () => {
      const res = await deleteExamSectionAction(sectionId, exam.id);
      if (res.success) {
        setSections((prev) => prev.filter((s) => s.id !== sectionId));
        setSectionQuestions((prev) => prev.filter((sq) => sq.section_id !== sectionId));
        router.refresh();
      } else {
        alert(res.error || "Failed to delete section");
      }
    });
  };

  const handleRemoveQuestionFromSection = (sectionQuestionId: string) => {
    startTransition(async () => {
      const res = await removeQuestionFromSectionAction(sectionQuestionId, exam.id);
      if (res.success) {
        setSectionQuestions((prev) => prev.filter((sq) => sq.id !== sectionQuestionId));
        router.refresh();
      } else {
        alert(res.error || "Failed to remove question");
      }
    });
  };

  const handleToggleQuestionSelect = (qId: string) => {
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) {
        next.delete(qId);
      } else {
        next.add(qId);
      }
      return next;
    });
  };

  const handleBulkLinkSelected = () => {
    if (!activeLinkingSection || selectedQuestionIds.size === 0) return;

    const qIds = Array.from(selectedQuestionIds);
    const sectionMarks = activeLinkingSection.marking_scheme?.correct_marks || 1.0;
    const currentAssignedCount = sectionQuestions.filter(
      (sq) => sq.section_id === activeLinkingSection.id
    ).length;

    startTransition(async () => {
      const res = await bulkAddQuestionsToSectionAction(
        activeLinkingSection.id,
        qIds,
        exam.id,
        sectionMarks,
        currentAssignedCount + 1
      );
      if (res.success) {
        setSelectedQuestionIds(new Set());
        setActiveLinkingSection(null);
        router.refresh();
      } else {
        alert(res.error || "Failed to link questions");
      }
    });
  };

  const handleQuickCreateAndLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLinkingSection || !quickQuestionText.trim() || !quickSubject.trim() || !quickBankId) return;

    const isCommon = activeLinkingSection.scope !== "department_specific";
    const departmentId = isCommon ? null : (activeLinkingSection.department_id || null);

    const payload = {
      bankId: quickBankId,
      type: "mcq_single" as const,
      subject: quickSubject,
      difficulty: 3,
      questionText: quickQuestionText,
      isCommon,
      departmentId,
      options: quickOptions,
      tags: [quickSubject],
    };

    startTransition(async () => {
      const createRes = await createQuestionAction(payload);
      if (createRes.success && createRes.data) {
        const newQId = (createRes.data as any).id;
        const sectionMarks = activeLinkingSection.marking_scheme?.correct_marks || 1.0;
        const currentAssignedCount = sectionQuestions.filter(
          (sq) => sq.section_id === activeLinkingSection.id
        ).length;

        await bulkAddQuestionsToSectionAction(
          activeLinkingSection.id,
          [newQId],
          exam.id,
          sectionMarks,
          currentAssignedCount + 1
        );

        setQuickQuestionText("");
        setQuickSubject("");
        setActiveLinkingSection(null);
        router.refresh();
      } else {
        alert(createRes.error || "Failed to author question");
      }
    });
  };

  // Filter available questions in drawer
  const alreadyLinkedIds = new Set(
    activeLinkingSection
      ? sectionQuestions
          .filter((sq) => sq.section_id === activeLinkingSection.id)
          .map((sq) => sq.question_id)
      : []
  );

  const filteredDrawerQuestions = availableQuestions.filter((q) => {
    if (alreadyLinkedIds.has(q.id)) return false;

    if (selectedBankFilter !== "all" && q.bank_id !== selectedBankFilter) return false;

    const isQCommon = q.is_common !== false;
    if (scopeFilter === "common" && !isQCommon) return false;
    if (scopeFilter === "matched" && activeLinkingSection) {
      if (activeLinkingSection.scope === "department_specific") {
        if (q.department_id !== activeLinkingSection.department_id && !isQCommon) return false;
      }
    }

    if (searchQuery.trim()) {
      const qText = (q.content?.text || "").toLowerCase();
      const qSubj = (q.subject || "").toLowerCase();
      const term = searchQuery.toLowerCase();
      return qText.includes(term) || qSubj.includes(term);
    }

    return true;
  });

  return (
    <div className="space-y-3.5">
      {/* Blueprint Executive Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        {/* Top Bar: Breadcrumb + Action Cluster */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <Link
              href="/examiner/exams"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exam Blueprints</span>
            </Link>
            <span className="text-slate-300 font-bold">•</span>
            <span className="text-slate-500 font-medium">Blueprint Composer Studio</span>
          </div>

          {/* Action Buttons Suite */}
          <div className="flex items-center gap-2 shrink-0">
            {examStatus === "draft" ? (
              <button
                onClick={() => handleToggleStatus("published")}
                disabled={isPending}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Publish Blueprint</span>
              </button>
            ) : (
              <button
                onClick={() => handleToggleStatus("draft")}
                disabled={isPending}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 border border-slate-200 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>Revert to Draft</span>
              </button>
            )}

            <Link
              href="/examiner/schedules"
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 border border-slate-200 shadow-2xs transition-all flex items-center gap-1.5"
            >
              <CalendarCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Schedule Session</span>
            </Link>

            <button
              onClick={() => setIsAddSectionOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs hover:shadow-indigo-100"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Section</span>
            </button>
          </div>
        </div>

        {/* Middle Section: Title, Badges & KPI Metrics Strip */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  examStatus === "published"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    examStatus === "published" ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
                <span>{examStatus}</span>
              </span>

              {exam.settings?.department_id ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                  <Building2 className="w-3 h-3" />
                  <span>{deptMap.get(exam.settings.department_id)?.name || "Dept Specific"}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Globe className="w-3 h-3" />
                  <span>Universal Common</span>
                </span>
              )}
            </div>

            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {exam.title}
            </h1>
            {exam.description && (
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {exam.description}
              </p>
            )}
          </div>

          {/* KPI Metrics Chips Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex items-center gap-2 shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-indigo-50/60 border border-indigo-100/80 text-center min-w-[90px]">
              <span className="block text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Total Marks</span>
              <span className="text-sm font-extrabold text-indigo-950">{totalMarks}</span>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-center min-w-[90px]">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sections</span>
              <span className="text-sm font-extrabold text-slate-900">{sections.length}</span>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-center min-w-[100px]">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Questions</span>
              <div className="flex items-center justify-center gap-1">
                <span className="text-sm font-extrabold text-slate-900">{totalQuestionsCount}</span>
                <span className="text-[10px] text-slate-400 font-semibold">/ 50 target</span>
              </div>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-emerald-50/60 border border-emerald-100/80 text-center min-w-[90px]">
              <span className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Pass Cutoff</span>
              <span className="text-sm font-extrabold text-emerald-950">{exam.settings?.passing_percentage || 50}%</span>
            </div>
          </div>
        </div>

        {/* Bottom Policy & Configuration Strip */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase tracking-wider">
            Blueprint Rules:
          </span>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50/70 border border-indigo-200/80 text-indigo-900 text-xs font-semibold">
            <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="text-indigo-700 text-[11px]">Universal Part A:</span>
            <span className="font-extrabold text-indigo-950">{commonQuestionsLinkedCount}/20 Qs</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50/70 border border-purple-200/80 text-purple-900 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span className="text-purple-700 text-[11px]">Dept-Specific Part B:</span>
            <span className="font-extrabold text-purple-950">{deptQuestionsLinkedCount}/30 Qs</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs">
            <span className="text-slate-500 text-[11px]">Standard Ratio:</span>
            <span className="font-bold text-slate-900">
              {commonQuestionsLinkedCount === 20 && deptQuestionsLinkedCount === 30 ? (
                <span className="text-emerald-700">✓ 50 Q Blueprint Complete</span>
              ) : (
                <span className="text-slate-600">20 Common + 30 Dept = 50 Total</span>
              )}
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs">
            <Scale className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="text-slate-500 text-[11px]">Negative Marking:</span>
            <span className={`font-bold ${exam.settings?.enable_negative_marking ? "text-rose-700" : "text-slate-600"}`}>
              {exam.settings?.enable_negative_marking
                ? `-${exam.settings?.default_negative_penalty || 0.25} / wrong`
                : "Disabled"}
            </span>
          </div>

          {exam.settings?.target_duration_minutes && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="text-slate-500 text-[11px]">Duration:</span>
              <span className="font-bold text-slate-900">
                {exam.settings.target_duration_minutes} mins
              </span>
            </div>
          )}

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs">
            <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="text-slate-500 text-[11px]">Lockdown Browser:</span>
            <span className="font-bold text-slate-900">
              {exam.settings?.require_safe_browser !== false ? "Enforced" : "Optional"}
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs">
            <Shuffle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-slate-500 text-[11px]">Question Order:</span>
            <span className="font-bold text-slate-900">
              {exam.settings?.shuffle_questions !== false ? "Randomized" : "Sequential"}
            </span>
          </div>

          {exam.settings?.calculator_type && exam.settings.calculator_type !== "none" && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs">
              <Calculator className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="text-slate-500 text-[11px]">Calculator:</span>
              <span className="font-bold text-slate-900 capitalize">
                {exam.settings.calculator_type}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Sections Structure */}
      <div className="space-y-4">
        {sections.length > 0 ? (
          sections.map((section, sIndex) => {
            const assigned = sectionQuestions.filter((sq) => sq.section_id === section.id);
            const marking = section.marking_scheme as {
              correct_marks?: number;
              negative_marks?: number;
            } | null;

            const isSectionCommon = section.scope !== "department_specific";
            const sectionDept = section.department_id ? deptMap.get(section.department_id) : null;

            let sectionTotalMarks = 0;
            assigned.forEach((sq) => {
              sectionTotalMarks += Number(sq.marks) || 0;
            });

            return (
              <div
                key={section.id}
                className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden transition-all duration-200 hover:border-slate-300"
              >
                {/* Section Header */}
                <div className="bg-slate-50/70 px-4 py-3 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      {String(sIndex + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      {section.title}
                    </h3>
                    {isSectionCommon ? (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200/80 text-indigo-700 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        <span>Universal Common</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200/80 text-purple-700 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        <span>Dept: {sectionDept?.code || "Specialized"}</span>
                      </span>
                    )}

                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-600 font-medium bg-white px-2 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
                      Marks:{" "}
                      <strong className="text-slate-800">
                        +{marking?.correct_marks || 1}
                        {marking?.negative_marks && marking.negative_marks > 0
                          ? ` / -${marking.negative_marks}`
                          : " pts"}
                      </strong>
                    </span>

                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-600 font-medium bg-white px-2 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
                      <strong className="text-slate-900">{assigned.length}</strong> Questions ({sectionTotalMarks} Marks)
                    </span>

                    {section.time_limit_minutes && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/70 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>{section.time_limit_minutes}m Limit</span>
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      onClick={() => {
                        setActiveLinkingSection(section);
                        setSelectedQuestionIds(new Set());
                        setLinkerMode("pick");
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg shadow-2xs transition-all cursor-pointer hover:shadow-xs active:scale-[0.98]"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Link Questions</span>
                    </button>

                    <button
                      onClick={() => handleDeleteSection(section.id)}
                      title="Delete Section"
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Section Questions Table */}
                {assigned.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/40 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
                          <th className="py-2.5 px-3.5 w-12 text-center">#</th>
                          <th className="py-2.5 px-3.5">Question Statement & Domain</th>
                          <th className="py-2.5 px-3.5 w-32">Scope</th>
                          <th className="py-2.5 px-3.5 w-32">Format</th>
                          <th className="py-2.5 px-3.5 w-28">Difficulty</th>
                          <th className="py-2.5 px-3.5 w-24 text-right">Marks</th>
                          <th className="py-2.5 px-3.5 w-12 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {assigned.map((sq, sqIdx) => {
                          const qData = questionMap.get(sq.question_id);
                          const qContent = qData?.content as { text?: string } | null;
                          const isQCommon = qData?.is_common !== false;
                          const qDept = qData?.department_id ? deptMap.get(qData.department_id) : null;
                          const diff = qData?.difficulty || 3;

                          return (
                            <tr
                              key={sq.id}
                              className="hover:bg-slate-50/80 transition-colors group"
                            >
                              {/* Index */}
                              <td className="py-2.5 px-3.5 text-center font-mono text-[11px] font-semibold text-slate-400 group-hover:text-indigo-600">
                                #{String(sqIdx + 1).padStart(2, "0")}
                              </td>

                              {/* Question Statement & Subject */}
                              <td className="py-2.5 px-3.5">
                                <div className="font-semibold text-slate-900 group-hover:text-slate-950 line-clamp-1 leading-snug">
                                  {qContent?.text || "Question statement"}
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <span className="font-medium text-slate-500">{qData?.subject || "General"}</span>
                                </div>
                              </td>

                              {/* Scope */}
                              <td className="py-2.5 px-3.5 whitespace-nowrap">
                                {isQCommon ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200/70 text-indigo-700">
                                    <Globe className="w-2.5 h-2.5" />
                                    Common
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 border border-purple-200/70 text-purple-700">
                                    <Building2 className="w-2.5 h-2.5" />
                                    {qDept?.code || "Dept"}
                                  </span>
                                )}
                              </td>

                              {/* Type */}
                              <td className="py-2.5 px-3.5 whitespace-nowrap">
                                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-100 border border-slate-200/80 text-slate-600">
                                  {qData?.type?.replace("_", " ") || "MCQ Single"}
                                </span>
                              </td>

                              {/* Difficulty */}
                              <td className="py-2.5 px-3.5 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-600 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      diff <= 2
                                        ? "bg-emerald-500"
                                        : diff === 3
                                        ? "bg-amber-500"
                                        : "bg-rose-500"
                                    }`}
                                  />
                                  Lvl {diff}/5
                                </span>
                              </td>

                              {/* Marks */}
                              <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                                <span className="font-mono font-bold text-[11px] text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
                                  +{sq.marks} pts
                                </span>
                              </td>

                              {/* Unlink Action */}
                              <td className="py-2.5 px-3.5 text-center">
                                <button
                                  onClick={() => handleRemoveQuestionFromSection(sq.id)}
                                  title="Unlink question from this section"
                                  className="text-slate-300 group-hover:text-slate-400 hover:!text-rose-600 hover:bg-rose-50 p-1 rounded-md transition-colors cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 py-6 text-center bg-slate-50/30 border-t border-slate-100 flex flex-col items-center justify-center gap-1.5">
                    <p className="text-slate-500 font-medium">No questions linked to this section yet.</p>
                    <button
                      onClick={() => {
                        setActiveLinkingSection(section);
                        setSelectedQuestionIds(new Set());
                        setLinkerMode("pick");
                      }}
                      className="inline-flex items-center gap-1 text-xs text-indigo-700 font-bold hover:underline cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Link questions from repository &rarr;</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-6 text-center shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
              <Layers className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">
              No Sections Created Yet
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm mx-auto">
              Examination blueprints require at least one section (e.g. Research Methodology, Core Specialization).
            </p>
            <button
              onClick={() => setIsAddSectionOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create First Section</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal 1: Add Section Modal Dialog */}
      {isAddSectionOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-xl w-full space-y-4 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Add Examination Section
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Partition questions into structured modules, subject domains, or scoring tiers.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSectionOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSection} className="space-y-4 pt-1">
              {/* Section Title */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-bold text-slate-800">
                      Section Title <span className="text-rose-500">*</span>
                    </label>
                    <InfoHelp
                      title="Section Title"
                      content="The title shown to candidates in their exam navigation palette and scorecard."
                      align="left"
                    />
                  </div>
                  <span className="text-[10px] font-medium text-slate-400">Required</span>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={sectionTitle}
                    onChange={(e) => setSectionTitle(e.target.value)}
                    placeholder="e.g. Part A: Research Methodology & Quantitative Aptitude"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white text-slate-900 placeholder:text-slate-400 transition-all font-semibold shadow-2xs"
                  />
                </div>
              </div>

              {/* Delivery Scope & Segmented Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-bold text-slate-800">
                      Delivery Scope <span className="text-rose-500">*</span>
                    </label>
                    <InfoHelp
                      title="Delivery Scope"
                      content="Universal Common sections are delivered to all examinees. Department-Specific sections deliver tailored question banks based on candidate program."
                      align="left"
                    />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      sectionScope === "common"
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        : "bg-purple-50 text-purple-700 border border-purple-200"
                    }`}
                  >
                    {sectionScope === "common" ? "Universal Common" : "Dept Specific"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSectionScope("common");
                      setSectionDeptId("");
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      sectionScope === "common"
                        ? "bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20 shadow-2xs"
                        : "bg-slate-50/50 border-slate-200 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          sectionScope === "common"
                            ? "bg-indigo-600 text-white shadow-2xs"
                            : "bg-white border border-slate-200 text-slate-500"
                        }`}
                      >
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-900">Universal Common</span>
                        <span className="block text-[10px] text-slate-500">All Candidates</span>
                      </div>
                    </div>
                    {sectionScope === "common" && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSectionScope("department_specific")}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      sectionScope === "department_specific"
                        ? "bg-purple-50/70 border-purple-500 ring-2 ring-purple-500/20 shadow-2xs"
                        : "bg-slate-50/50 border-slate-200 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          sectionScope === "department_specific"
                            ? "bg-purple-600 text-white shadow-2xs"
                            : "bg-white border border-slate-200 text-slate-500"
                        }`}
                      >
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-900">Dept-Specific</span>
                        <span className="block text-[10px] text-slate-500">Target Faculty</span>
                      </div>
                    </div>
                    {sectionScope === "department_specific" && (
                      <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Conditional Target Department */}
              {sectionScope === "department_specific" && (
                <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-200/80 space-y-1.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-purple-900">
                      Target Academic Department <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-semibold text-purple-600">Faculty Enrolled</span>
                  </div>
                  <div className="relative">
                    <select
                      required
                      value={sectionDeptId}
                      onChange={(e) => setSectionDeptId(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 text-xs rounded-lg border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white text-slate-900 font-semibold shadow-2xs cursor-pointer appearance-none"
                    >
                      <option value="">-- Choose Academic Department --</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name} {dept.code ? `(${dept.code})` : ""}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-purple-500">
                      <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                    </div>
                  </div>
                </div>
              )}

              {/* Timing & Scoring Configuration */}
              {isNegativeMarkingEnabled ? (
                <div className="space-y-3">
                  {/* Section Time Limit Card */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/90 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="text-xs font-bold text-slate-800">Section Time Limit</span>
                        <InfoHelp
                          title="Independent Section Timer"
                          content="Optional time cap for this section. Set to 'Shared' to share the total exam timer."
                          align="left"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                        {timeLimit ? `${timeLimit} mins` : "Shared Exam Timer"}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <div className="relative flex-1 w-full">
                        <input
                          type="number"
                          min={1}
                          max={300}
                          value={timeLimit}
                          onChange={(e) => setTimeLimit(e.target.value ? Number(e.target.value) : "")}
                          placeholder="Shared timer (e.g. 60)"
                          className="w-full pl-3 pr-11 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white text-slate-900 font-semibold shadow-2xs"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">
                          mins
                        </span>
                      </div>

                      <div className="flex items-center gap-1 w-full sm:w-auto shrink-0">
                        {(
                          [
                            { label: "Shared", val: "" },
                            { label: "30m", val: 30 },
                            { label: "45m", val: 45 },
                            { label: "60m", val: 60 },
                            { label: "90m", val: 90 },
                          ] as Array<{ label: string; val: number | "" }>
                        ).map((opt) => (
                          <button
                            key={opt.label}
                            type="button"
                            onClick={() => setTimeLimit(opt.val)}
                            className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                              timeLimit === opt.val || (opt.val === "" && !timeLimit)
                                ? "bg-indigo-600 text-white shadow-2xs"
                                : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Dual Scoring Scheme (Correct Mark + Wrong Penalty) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Correct Mark */}
                    <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/90 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold flex items-center justify-center shrink-0">
                            +
                          </span>
                          <span className="text-xs font-bold text-slate-800">Correct Mark</span>
                          <InfoHelp
                            title="Correct Answer Reward"
                            content="Score awarded for each correctly answered question in this section."
                            align="left"
                          />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                          +{correctMarks} pts
                        </span>
                      </div>

                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          min={0.5}
                          max={100}
                          required
                          value={correctMarks}
                          onChange={(e) => setCorrectMarks(Number(e.target.value))}
                          className="w-full pl-3 pr-10 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white text-slate-900 font-bold shadow-2xs"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                          pts
                        </span>
                      </div>

                      <div className="flex items-center gap-1 pt-0.5">
                        {[1, 2, 3, 4].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setCorrectMarks(m)}
                            className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                              correctMarks === m
                                ? "bg-emerald-600 text-white shadow-2xs"
                                : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            +{m}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Wrong Penalty */}
                    <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/90 space-y-2.5 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-800 text-[11px] font-extrabold flex items-center justify-center shrink-0">
                            -
                          </span>
                          <span className="text-xs font-bold text-slate-800">Wrong Penalty</span>
                          <InfoHelp
                            title="Wrong Answer Penalty"
                            content="Marks deducted for each incorrect answer in this section. Set to 0 if there is no negative penalty."
                          />
                        </div>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            negativeMarks > 0
                              ? "text-rose-700 bg-rose-50 border-rose-200/60"
                              : "text-slate-600 bg-slate-100 border-slate-200"
                          }`}
                        >
                          {negativeMarks > 0 ? `-${negativeMarks}` : "0"}
                        </span>
                      </div>

                      <div className="relative">
                        <input
                          type="number"
                          step="0.25"
                          min={0}
                          max={50}
                          required
                          value={negativeMarks}
                          onChange={(e) => setNegativeMarks(Number(e.target.value))}
                          className="w-full pl-3 pr-11 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white text-slate-900 font-bold shadow-2xs"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                          deduct
                        </span>
                      </div>

                      <div className="flex items-center gap-1 pt-0.5">
                        {[
                          { label: "0", val: 0 },
                          { label: "-.25", val: 0.25 },
                          { label: "-.5", val: 0.5 },
                          { label: "-1", val: 1.0 },
                        ].map((opt) => (
                          <button
                            key={opt.label}
                            type="button"
                            onClick={() => setNegativeMarks(opt.val)}
                            className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                              negativeMarks === opt.val
                                ? "bg-rose-600 text-white shadow-2xs"
                                : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Symmetric Balanced 2-Column Grid (Time Limit + Correct Mark) */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Section Time Limit */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/90 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="text-xs font-bold text-slate-800">Section Time Limit</span>
                        <InfoHelp
                          title="Independent Section Timer"
                          content="Optional time cap for this section. Leave empty to share the total exam timer."
                          align="left"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                        {timeLimit ? `${timeLimit}m` : "Shared"}
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        max={300}
                        value={timeLimit}
                        onChange={(e) => setTimeLimit(e.target.value ? Number(e.target.value) : "")}
                        placeholder="Shared timer (e.g. 60)"
                        className="w-full pl-3 pr-11 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white text-slate-900 font-semibold shadow-2xs"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">
                        mins
                      </span>
                    </div>

                    <div className="flex items-center gap-1 pt-0.5">
                      {(
                        [
                          { label: "Shared", val: "" },
                          { label: "30m", val: 30 },
                          { label: "45m", val: 45 },
                          { label: "60m", val: 60 },
                        ] as Array<{ label: string; val: number | "" }>
                      ).map((opt) => (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => setTimeLimit(opt.val)}
                          className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                            timeLimit === opt.val || (opt.val === "" && !timeLimit)
                              ? "bg-indigo-600 text-white shadow-2xs"
                              : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Marks per Question */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/90 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold flex items-center justify-center shrink-0">
                          +
                        </span>
                        <span className="text-xs font-bold text-slate-800">Correct Mark</span>
                        <InfoHelp
                          title="Correct Answer Reward"
                          content="Score awarded for each correctly answered question in this section."
                          align="left"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                        +{correctMarks} pts
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        min={0.5}
                        max={100}
                        required
                        value={correctMarks}
                        onChange={(e) => setCorrectMarks(Number(e.target.value))}
                        className="w-full pl-3 pr-10 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-white text-slate-900 font-bold shadow-2xs"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                        pts
                      </span>
                    </div>

                    <div className="flex items-center gap-1 pt-0.5">
                      {[1, 2, 3, 4].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setCorrectMarks(m)}
                          className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                            correctMarks === m
                              ? "bg-emerald-600 text-white shadow-2xs"
                              : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          +{m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Questions can be linked immediately after section creation.
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsAddSectionOpen(false)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || !sectionTitle.trim()}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{isPending ? "Creating..." : "Create Section"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Slide-Over Question Linker Drawer (Bulk & Quick Authoring) */}
      {activeLinkingSection && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
          <div className="bg-white border-l border-slate-200 w-full max-w-2xl h-full shadow-2xl flex flex-col justify-between">
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    Question Linker
                  </span>
                  <span className="text-xs font-bold text-slate-400">•</span>
                  <span className="text-xs font-semibold text-slate-600 truncate max-w-xs">
                    {activeLinkingSection.title}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                  Assign Questions to Section
                </h3>
              </div>

              <button
                onClick={() => setActiveLinkingSection(null)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="px-5 pt-3 border-b border-slate-200 flex items-center gap-4 bg-white text-xs font-semibold">
              <button
                onClick={() => setLinkerMode("pick")}
                className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  linkerMode === "pick"
                    ? "border-indigo-600 text-indigo-700 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <FileQuestion className="w-3.5 h-3.5" />
                <span>Select from Repository Banks</span>
              </button>

              <button
                onClick={() => setLinkerMode("create")}
                className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  linkerMode === "create"
                    ? "border-indigo-600 text-indigo-700 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Author & Link Question Directly</span>
              </button>
            </div>

            {/* Drawer Body */}
            {linkerMode === "pick" ? (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
                {/* Search & Filter Controls */}
                <div className="space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search questions by statement or topic..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={selectedBankFilter}
                      onChange={(e) => setSelectedBankFilter(e.target.value)}
                      className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-700"
                    >
                      <option value="all">All Question Banks</option>
                      {banks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={scopeFilter}
                      onChange={(e) => setScopeFilter(e.target.value as any)}
                      className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-700"
                    >
                      <option value="all">All Scopes</option>
                      <option value="common">Universal Common</option>
                      <option value="matched">Section Matched Scope</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        const allFilteredIds = filteredDrawerQuestions.map((q) => q.id);
                        setSelectedQuestionIds(new Set(allFilteredIds));
                      }}
                      className="text-indigo-600 font-bold hover:underline ml-auto text-xs cursor-pointer"
                    >
                      Select All ({filteredDrawerQuestions.length})
                    </button>
                  </div>
                </div>

                {/* Available Questions List with Checkboxes */}
                {filteredDrawerQuestions.length > 0 ? (
                  <div className="space-y-2">
                    {filteredDrawerQuestions.map((q) => {
                      const isSelected = selectedQuestionIds.has(q.id);
                      const isQCommon = q.is_common !== false;
                      const qDept = q.department_id ? deptMap.get(q.department_id) : null;
                      const content = q.content as { text?: string } | null;

                      return (
                        <div
                          key={q.id}
                          onClick={() => handleToggleQuestionSelect(q.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-50/40 shadow-2xs"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div
                            className={`w-4.5 h-4.5 rounded flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                              isSelected
                                ? "bg-indigo-600 text-white"
                                : "border border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-slate-900 leading-snug">
                              {content?.text || "Question statement"}
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px]">
                              {isQCommon ? (
                                <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                                  Universal Common
                                </span>
                              ) : (
                                <span className="font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                                  Dept: {qDept?.name || "Specialized"}
                                </span>
                              )}

                              <span className="font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                {q.subject}
                              </span>

                              <span className="font-medium text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                Lvl {q.difficulty}/5
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-slate-500">
                    No questions match the current filter criteria or all questions are already linked.
                  </div>
                )}
              </div>
            ) : (
              /* Quick Question Authoring Tab */
              <form onSubmit={handleQuickCreateAndLink} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs">
                <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-indigo-950">
                  <span className="font-bold block mb-0.5">Authoring in Section Context:</span>
                  <span>
                    This question will be saved into the selected Question Bank and automatically linked into{" "}
                    <strong>{activeLinkingSection.title}</strong> with{" "}
                    <strong>{activeLinkingSection.marking_scheme?.correct_marks || 1} marks</strong>.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Target Question Bank <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={quickBankId}
                    onChange={(e) => setQuickBankId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-slate-900 text-xs"
                  >
                    {banks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Subject / Domain Area <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={quickSubject}
                    onChange={(e) => setQuickSubject(e.target.value)}
                    placeholder="e.g. Distributed Algorithms & Consensus"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Question Statement <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={quickQuestionText}
                    onChange={(e) => setQuickQuestionText(e.target.value)}
                    placeholder="State the problem clearly..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-slate-900 text-xs"
                  ></textarea>
                </div>

                <div className="space-y-2">
                  <label className="block font-bold text-slate-700">
                    Multiple Choice Options (Mark Correct Answer)
                  </label>
                  {quickOptions.map((opt, optIdx) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="quickCorrectOption"
                        checked={opt.isCorrect}
                        onChange={() =>
                          setQuickOptions((prev) =>
                            prev.map((o, i) => ({ ...o, isCorrect: i === optIdx }))
                          )
                        }
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <input
                        type="text"
                        required
                        value={opt.text}
                        onChange={(e) =>
                          setQuickOptions((prev) =>
                            prev.map((o, i) => (i === optIdx ? { ...o, text: e.target.value } : o))
                          )
                        }
                        placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 focus:bg-white text-slate-900 text-xs"
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs cursor-pointer disabled:opacity-50 text-xs"
                  >
                    Author & Link to Section Now
                  </button>
                </div>
              </form>
            )}

            {/* Drawer Bottom Action Bar */}
            {linkerMode === "pick" && (
              <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between gap-4">
                <div className="text-xs text-slate-600">
                  <span className="font-bold text-indigo-700 text-sm">
                    {selectedQuestionIds.size}
                  </span>{" "}
                  {selectedQuestionIds.size === 1 ? "question" : "questions"} selected
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveLinkingSection(null)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleBulkLinkSelected}
                    disabled={isPending || selectedQuestionIds.size === 0}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Link {selectedQuestionIds.size > 0 ? `(${selectedQuestionIds.size}) Questions` : "Selected"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
