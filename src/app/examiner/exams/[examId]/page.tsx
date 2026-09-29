import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createExamSectionAction,
  addQuestionToSectionAction,
} from "@/app/actions/examiner";
import {
  ArrowLeft,
  ChevronRight,
  Layers,
  Clock,
  Shield,
  PlusCircle,
  FileQuestion,
  CalendarCheck,
  CheckCircle,
  Hash,
  Award,
  Globe,
  Building2,
} from "lucide-react";

interface Props {
  params: Promise<{ examId: string }>;
}

export default async function ExamBlueprintDetailPage({ params }: Props) {
  const { examId } = await params;
  const supabase = await createClient();

  // Fetch exam blueprint
  const { data: exam } = await supabase
    .from("exams")
    .select("*")
    .eq("id", examId)
    .single();

  if (!exam) {
    notFound();
  }

  // Fetch departments
  const { data: depts } = await supabase
    .from("departments")
    .select("id, name, code")
    .order("name", { ascending: true });

  interface RawDept {
    id: string;
    name: string;
    code: string | null;
  }

  const departments = (depts || []) as RawDept[];
  const deptMap = new Map(departments.map((d) => [d.id, d]));

  // Fetch sections
  const { data: sections } = await supabase
    .from("exam_sections")
    .select("*")
    .eq("exam_id", examId)
    .order("order_index", { ascending: true });

  // Fetch section questions
  const sectionIds = sections?.map((s) => s.id) || [];
  const { data: sectionQuestions } = await supabase
    .from("exam_section_questions")
    .select("id, section_id, question_id, order_index, marks")
    .in("section_id", sectionIds.length ? sectionIds : ["00000000-0000-0000-0000-000000000000"])
    .order("order_index", { ascending: true });

  const linkedQuestionIds = sectionQuestions?.map((sq) => sq.question_id) || [];
  const { data: linkedQuestions } = await supabase
    .from("questions")
    .select("id, type, subject, difficulty, content, is_common, department_id")
    .in("id", linkedQuestionIds.length ? linkedQuestionIds : ["00000000-0000-0000-0000-000000000000"]);

  const questionMap = new Map((linkedQuestions || []).map((q) => [q.id, q]));

  // Fetch available questions from banks for quick linking
  const { data: availableQuestions } = await supabase
    .from("questions")
    .select("id, subject, type, difficulty, content, bank_id, is_common, department_id")
    .limit(50);

  const settings = exam.settings as {
    require_safe_browser?: boolean;
    shuffle_questions?: boolean;
    shuffle_options?: boolean;
    allow_backtracking?: boolean;
  } | null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link
          href="/examiner/exams"
          className="hover:text-indigo-600 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exam Blueprints</span>
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-900 font-bold truncate">{exam.title}</span>
      </div>

      {/* Blueprint Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full border ${
                exam.status === "published"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}
            >
              {exam.status}
            </span>
            <span className="text-xs font-bold text-slate-400">•</span>
            <span className="text-xs text-slate-500">
              {sections?.length || 0} Sections Configured
            </span>
          </div>

          <h1 className="text-xl font-bold text-slate-900">{exam.title}</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {exam.description || "University qualifying entrance assessment."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/examiner/schedules"
            className="px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-xs font-bold text-white shadow-xs transition-colors flex items-center gap-1.5"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Schedule Exam Session</span>
          </Link>
        </div>
      </div>

      {/* Blueprint Settings Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-wrap items-center gap-4 text-xs font-medium text-slate-700">
        <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider">
          Enforced Policies:
        </span>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
          <Shield className="w-3.5 h-3.5 text-indigo-600" />
          <span>Lockdown Browser: {settings?.require_safe_browser ? "Required" : "Optional"}</span>
        </span>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
          <Hash className="w-3.5 h-3.5 text-emerald-600" />
          <span>Shuffle Questions: {settings?.shuffle_questions ? "Active" : "Disabled"}</span>
        </span>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          <span>Shuffle Options: {settings?.shuffle_options ? "Active" : "Disabled"}</span>
        </span>
      </div>

      {/* Sections and Questions */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Examination Sections ({sections?.length || 0})</span>
          </h2>

          <details className="group relative">
            <summary className="list-none inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 cursor-pointer select-none transition-all">
              <PlusCircle className="w-3.5 h-3.5 text-indigo-600" />
              <span>Add Section</span>
            </summary>

            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl p-5 shadow-xl z-30">
              <h4 className="text-xs font-bold text-slate-900 mb-2">
                New Section Specification
              </h4>

              <form
                action={async (formData: FormData) => {
                  "use server";
                  await createExamSectionAction(formData);
                }}
                className="space-y-3"
              >
                <input type="hidden" name="examId" value={exam.id} />
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Section Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    placeholder="e.g. Part A: Research Methodology"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Delivery Scope *
                  </label>
                  <select
                    name="scope"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 font-medium"
                  >
                    <option value="common">🌐 Universal Common (All Candidates)</option>
                    <option value="department_specific">🏛️ Department-Specific Delivery</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Target Academic Department (If Dept-Specific)
                  </label>
                  <select
                    name="departmentId"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-slate-900"
                  >
                    <option value="">-- Optional / Select Department --</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} {dept.code ? `(${dept.code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Correct Marks
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      name="correctMarks"
                      defaultValue="2.0"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Negative Penalty
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      name="negativeMarks"
                      defaultValue="0.5"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Section Time Limit (mins)
                  </label>
                  <input
                    type="number"
                    name="timeLimitMinutes"
                    placeholder="Optional (e.g. 60)"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2 rounded-lg bg-indigo-700 text-xs font-bold text-white shadow-xs"
                  >
                    Add Section
                  </button>
                </div>
              </form>
            </div>
          </details>
        </div>

        {sections && sections.length > 0 ? (
          <div className="space-y-6">
            {sections.map((section, sIndex) => {
              const assigned =
                sectionQuestions?.filter((sq) => sq.section_id === section.id) || [];
              const marking = section.marking_scheme as {
                correct_marks?: number;
                negative_marks?: number;
              } | null;

              const isSectionCommon = section.scope !== "department_specific";
              const sectionDept = section.department_id ? deptMap.get(section.department_id) : null;

              return (
                <div
                  key={section.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                          {sIndex + 1}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">
                          {section.title}
                        </h3>
                        {isSectionCommon ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center gap-1">
                            <Globe className="w-2.5 h-2.5" />
                            <span>Universal Common</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 flex items-center gap-1">
                            <Building2 className="w-2.5 h-2.5" />
                            <span>
                              Dept: {sectionDept?.name || "Specialized"} {sectionDept?.code ? `(${sectionDept.code})` : ""}
                            </span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>
                          Marks: +{marking?.correct_marks || 1} / -{marking?.negative_marks || 0}
                        </span>
                        {section.time_limit_minutes && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{section.time_limit_minutes} Mins Limit</span>
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>{assigned.length} Questions</span>
                      </div>
                    </div>

                    {/* Quick Link Question Dialog */}
                    <details className="group relative">
                      <summary className="list-none inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 cursor-pointer">
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Link Questions</span>
                      </summary>

                      <div className="absolute right-0 mt-2 w-96 bg-white border border-slate-200 rounded-2xl p-4 shadow-xl z-30 max-h-96 overflow-y-auto">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold text-slate-900">
                            Available Questions from Banks
                          </h4>
                          <span className="text-[10px] text-slate-500">
                            {isSectionCommon ? "Universal Pool" : `Target: ${sectionDept?.code || "Dept"}`}
                          </span>
                        </div>
                        {availableQuestions && availableQuestions.length > 0 ? (
                          <div className="space-y-2">
                            {availableQuestions.map((q) => {
                              const content = q.content as { text?: string } | null;
                              const isQCommon = q.is_common !== false;
                              const qDept = q.department_id ? deptMap.get(q.department_id) : null;
                              const isMatchedDept = !isSectionCommon && q.department_id === section.department_id;

                              return (
                                <form
                                  key={q.id}
                                  action={async () => {
                                    "use server";
                                    await addQuestionToSectionAction(
                                      section.id,
                                      q.id,
                                      exam.id,
                                      marking?.correct_marks || 1.0,
                                      assigned.length + 1
                                    );
                                  }}
                                  className={`p-2.5 rounded-xl border transition-colors flex items-center justify-between gap-2 ${
                                    isMatchedDept
                                      ? "bg-purple-50/50 border-purple-200 hover:bg-purple-50"
                                      : "border-slate-200 hover:bg-slate-50"
                                  }`}
                                >
                                  <div className="min-w-0">
                                    <div className="text-xs font-semibold text-slate-800 truncate">
                                      {content?.text || "Question statement"}
                                    </div>
                                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                      {isQCommon ? (
                                        <span className="font-bold text-indigo-700 bg-indigo-50 px-1 py-0.2 rounded border border-indigo-100">
                                          🌐 Common
                                        </span>
                                      ) : (
                                        <span className={`font-bold px-1 py-0.2 rounded border ${
                                          isMatchedDept
                                            ? "text-purple-700 bg-purple-100/80 border-purple-300 font-extrabold"
                                            : "text-slate-600 bg-slate-100 border-slate-200"
                                        }`}>
                                          🏛️ {qDept?.code || "Dept"}
                                        </span>
                                      )}
                                      <span>•</span>
                                      <span>{q.subject}</span>
                                      <span>•</span>
                                      <span>Lvl {q.difficulty}/5</span>
                                    </div>
                                  </div>
                                  <button
                                    type="submit"
                                    className="px-2.5 py-1 rounded bg-indigo-700 text-white text-[11px] font-bold shrink-0 cursor-pointer hover:bg-indigo-800"
                                  >
                                    Add
                                  </button>
                                </form>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 py-3 text-center">
                            No questions found in repository banks.
                          </div>
                        )}
                      </div>
                    </details>
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
                            className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="font-bold text-slate-400">
                                #{sqIdx + 1}
                              </span>
                              <span className="font-semibold text-slate-800 truncate">
                                {qContent?.text || "Question"}
                              </span>
                              {isQCommon ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 shrink-0">
                                  🌐 Common
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-700 shrink-0">
                                  🏛️ {qDept?.code || "Dept"}
                                </span>
                              )}
                              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 shrink-0">
                                {qData?.type?.replace("_", " ") || "item"}
                              </span>
                            </div>

                            <span className="font-bold text-slate-700 shrink-0">
                              {sq.marks} Marks
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 py-6 text-center border border-dashed border-slate-200 rounded-xl">
                      No questions linked to this section yet. Click &ldquo;Link Questions&rdquo; above to assign from Question Banks.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center">
            <h3 className="text-sm font-bold text-slate-900">
              No Sections Created
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Exams require at least one section (e.g. Research Methodology, Specialization) to organize questions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
