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
  BookOpen,
} from "lucide-react";

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

  // Add Section form state
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionScope, setSectionScope] = useState<"common" | "department_specific">("common");
  const [sectionDeptId, setSectionDeptId] = useState("");
  const [correctMarks, setCorrectMarks] = useState(2.0);
  const [negativeMarks, setNegativeMarks] = useState(0.5);
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

  const handleApplyPreset = (title: string, scope: "common" | "department_specific", marks: number) => {
    setSectionTitle(title);
    setSectionScope(scope);
    setCorrectMarks(marks);
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionTitle.trim()) return;

    const formData = new FormData();
    formData.append("examId", exam.id);
    formData.append("title", sectionTitle);
    formData.append("scope", sectionScope);
    if (sectionScope === "department_specific" && sectionDeptId) {
      formData.append("departmentId", sectionDeptId);
    }
    formData.append("correctMarks", String(correctMarks));
    formData.append("negativeMarks", String(negativeMarks));
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
    <div className="space-y-6">
      {/* Blueprint Header with Real-Time Control & Status Toggle */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full border ${
                examStatus === "published"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}
            >
              {examStatus}
            </span>

            <span className="text-xs font-bold text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-600">
              {sections.length} {sections.length === 1 ? "Section" : "Sections"}
            </span>

            <span className="text-xs font-bold text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-600">
              {totalQuestionsCount} Questions Linked
            </span>

            <span className="text-xs font-bold text-slate-300">•</span>
            <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
              {totalMarks} Total Marks
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {exam.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {exam.description || "University qualifying entrance assessment blueprint."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Switcher Button */}
          {examStatus === "draft" ? (
            <button
              onClick={() => handleToggleStatus("published")}
              disabled={isPending}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Publish Blueprint</span>
            </button>
          ) : (
            <button
              onClick={() => handleToggleStatus("draft")}
              disabled={isPending}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 border border-slate-200 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>Revert to Draft</span>
            </button>
          )}

          <Link
            href="/examiner/schedules"
            className="px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-xs font-bold text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Schedule Session</span>
          </Link>
        </div>
      </div>

      {/* Blueprint Analytics & Policies Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Universal Common
          </span>
          <span className="text-base font-extrabold text-indigo-900 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-indigo-600" />
            <span>{commonQuestionsLinkedCount} Questions</span>
          </span>
          <span className="text-[10px] text-slate-400">All departments</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Dept-Specific
          </span>
          <span className="text-base font-extrabold text-purple-900 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-purple-600" />
            <span>{deptQuestionsLinkedCount} Questions</span>
          </span>
          <span className="text-[10px] text-slate-400">Specialized curriculum</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Lockdown Browser
          </span>
          <span className="text-base font-extrabold text-slate-900 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>{exam.settings?.require_safe_browser ? "Enforced" : "Standard"}</span>
          </span>
          <span className="text-[10px] text-slate-400">Kiosk lockdown mode</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Shuffling Policy
          </span>
          <span className="text-base font-extrabold text-slate-900 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{exam.settings?.shuffle_questions ? "Questions & Options" : "Sequential"}</span>
          </span>
          <span className="text-[10px] text-slate-400">Anti-collusion order</span>
        </div>
      </div>

      {/* Sections and Question Management */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Examination Sections ({sections.length})</span>
          </h2>

          <button
            onClick={() => setIsAddSectionOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Section</span>
          </button>
        </div>

        {sections.length > 0 ? (
          <div className="space-y-6">
            {sections.map((section, sIndex) => {
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
                  className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4 hover:border-slate-300 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                          {sIndex + 1}
                        </span>
                        <h3 className="text-base font-bold text-slate-900">
                          {section.title}
                        </h3>
                        {isSectionCommon ? (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            <span>Universal Common (All Candidates)</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            <span>
                              Dept: {sectionDept?.name || "Specialized"} {sectionDept?.code ? `(${sectionDept.code})` : ""}
                            </span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5">
                        <span className="font-semibold text-slate-700">
                          Marks: +{marking?.correct_marks || 1} / -{marking?.negative_marks || 0}
                        </span>
                        <span>•</span>
                        <span>{assigned.length} Questions Linked</span>
                        <span>•</span>
                        <span className="font-bold text-indigo-700">{sectionTotalMarks} Section Marks</span>
                        {section.time_limit_minutes && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-slate-600">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{section.time_limit_minutes} Mins Limit</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActiveLinkingSection(section);
                          setSelectedQuestionIds(new Set());
                          setLinkerMode("pick");
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200 transition-colors cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Link Questions</span>
                      </button>

                      <button
                        onClick={() => handleDeleteSection(section.id)}
                        title="Delete Section"
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Section Questions List */}
                  {assigned.length > 0 ? (
                    <div className="space-y-2.5">
                      {assigned.map((sq, sqIdx) => {
                        const qData = questionMap.get(sq.question_id);
                        const qContent = qData?.content as { text?: string } | null;
                        const isQCommon = qData?.is_common !== false;
                        const qDept = qData?.department_id ? deptMap.get(qData.department_id) : null;

                        return (
                          <div
                            key={sq.id}
                            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 flex items-center justify-between gap-3 text-xs transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="font-extrabold text-slate-400 w-5">
                                #{sqIdx + 1}
                              </span>

                              <div className="min-w-0">
                                <span className="font-semibold text-slate-900 truncate block">
                                  {qContent?.text || "Question statement"}
                                </span>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <span>{qData?.subject || "Subject"}</span>
                                  <span>•</span>
                                  <span>Level {qData?.difficulty || 3}/5</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {isQCommon ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700">
                                  🌐 Common
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-700">
                                  🏛️ {qDept?.code || "Dept"}
                                </span>
                              )}

                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                                {qData?.type?.replace("_", " ") || "item"}
                              </span>

                              <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                                {sq.marks} Marks
                              </span>

                              <button
                                onClick={() => handleRemoveQuestionFromSection(sq.id)}
                                title="Unlink question from this section"
                                className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 py-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      <p className="font-medium text-slate-600">No questions linked to this section yet.</p>
                      <button
                        onClick={() => {
                          setActiveLinkingSection(section);
                          setSelectedQuestionIds(new Set());
                          setLinkerMode("pick");
                        }}
                        className="mt-2 text-indigo-700 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Link Questions from Bank or Author Quick Item</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              No Sections Created Yet
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Examination blueprints require at least one section (e.g. Research Methodology, Core Specialization).
            </p>
            <button
              onClick={() => setIsAddSectionOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-xs font-bold text-white shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create First Section</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal 1: Add Section Modal Dialog */}
      {isAddSectionOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-w-lg w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Add Examination Section
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Organize questions by domain, curriculum level, or scoring rules.
                </p>
              </div>
              <button
                onClick={() => setIsAddSectionOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Quick Preset Templates:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleApplyPreset("Part A: Research Methodology & Aptitude", "common", 2.0)
                  }
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors"
                >
                  🌐 Part A: Research Methodology (Common)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleApplyPreset("Part B: Department Specialization", "department_specific", 3.0)
                  }
                  className="px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold hover:bg-purple-100 transition-colors"
                >
                  🏛️ Part B: Department Specialization
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateSection} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Section Title *
                </label>
                <input
                  type="text"
                  required
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  placeholder="e.g. Part A: Research Methodology & Aptitude"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Delivery Scope *
                  </label>
                  <select
                    value={sectionScope}
                    onChange={(e) => setSectionScope(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white text-slate-900 font-medium"
                  >
                    <option value="common">🌐 Universal Common (All Candidates)</option>
                    <option value="department_specific">🏛️ Department-Specific Delivery</option>
                  </select>
                </div>

                {sectionScope === "department_specific" ? (
                  <div>
                    <label className="block text-xs font-semibold text-purple-900 mb-1">
                      Target Academic Department *
                    </label>
                    <select
                      required
                      value={sectionDeptId}
                      onChange={(e) => setSectionDeptId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-purple-50/50 focus:bg-white text-slate-900 font-medium"
                    >
                      <option value="">-- Choose Department --</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name} {dept.code ? `(${dept.code})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Section Time Limit (Mins)
                    </label>
                    <input
                      type="number"
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(e.target.value ? Number(e.target.value) : "")}
                      placeholder="Optional (e.g. 60)"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Marks per Question *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={correctMarks}
                    onChange={(e) => setCorrectMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Negative Penalty *
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    required
                    value={negativeMarks}
                    onChange={(e) => setNegativeMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddSectionOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-xs font-bold text-white shadow-xs cursor-pointer disabled:opacity-50"
                >
                  Create Section
                </button>
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
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
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
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Assign Questions to Section
                </h3>
              </div>

              <button
                onClick={() => setActiveLinkingSection(null)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100"
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
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Search & Filter Controls */}
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search questions by statement or topic..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-900"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={selectedBankFilter}
                      onChange={(e) => setSelectedBankFilter(e.target.value)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700"
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
                      className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700"
                    >
                      <option value="all">All Scopes</option>
                      <option value="common">🌐 Universal Common</option>
                      <option value="matched">🏛️ Section Matched Scope</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        const allFilteredIds = filteredDrawerQuestions.map((q) => q.id);
                        setSelectedQuestionIds(new Set(allFilteredIds));
                      }}
                      className="text-indigo-600 font-bold hover:underline ml-auto"
                    >
                      Select All ({filteredDrawerQuestions.length})
                    </button>
                  </div>
                </div>

                {/* Available Questions List with Checkboxes */}
                {filteredDrawerQuestions.length > 0 ? (
                  <div className="space-y-2.5">
                    {filteredDrawerQuestions.map((q) => {
                      const isSelected = selectedQuestionIds.has(q.id);
                      const isQCommon = q.is_common !== false;
                      const qDept = q.department_id ? deptMap.get(q.department_id) : null;
                      const content = q.content as { text?: string } | null;

                      return (
                        <div
                          key={q.id}
                          onClick={() => handleToggleQuestionSelect(q.id)}
                          className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-50/40 shadow-xs"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                              isSelected
                                ? "bg-indigo-600 text-white"
                                : "border border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-slate-900 leading-snug">
                              {content?.text || "Question statement"}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px]">
                              {isQCommon ? (
                                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                  🌐 Universal Common
                                </span>
                              ) : (
                                <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                  🏛️ Dept: {qDept?.name || "Specialized"}
                                </span>
                              )}

                              <span className="font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                {q.subject}
                              </span>

                              <span className="font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
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
              <form onSubmit={handleQuickCreateAndLink} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-indigo-950">
                  <span className="font-bold block mb-0.5">Authoring in Section Context:</span>
                  <span>
                    This question will be saved into the selected Question Bank and automatically linked into{" "}
                    <strong>{activeLinkingSection.title}</strong> with{" "}
                    <strong>{activeLinkingSection.marking_scheme?.correct_marks || 1} marks</strong>.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Target Question Bank *
                  </label>
                  <select
                    required
                    value={quickBankId}
                    onChange={(e) => setQuickBankId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900"
                  >
                    {banks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Subject / Domain Area *
                  </label>
                  <input
                    type="text"
                    required
                    value={quickSubject}
                    onChange={(e) => setQuickSubject(e.target.value)}
                    placeholder="e.g. Distributed Algorithms & Consensus"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Question Statement *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={quickQuestionText}
                    onChange={(e) => setQuickQuestionText(e.target.value)}
                    placeholder="State the problem clearly..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900"
                  ></textarea>
                </div>

                <div className="space-y-2">
                  <label className="block font-semibold text-slate-700">
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
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-slate-900"
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold shadow-xs cursor-pointer disabled:opacity-50"
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
                  <span className="font-extrabold text-indigo-700 text-sm">
                    {selectedQuestionIds.size}
                  </span>{" "}
                  {selectedQuestionIds.size === 1 ? "question" : "questions"} selected
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveLinkingSection(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleBulkLinkSelected}
                    disabled={isPending || selectedQuestionIds.size === 0}
                    className="px-5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
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
