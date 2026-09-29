import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createQuestionBankAction } from "@/app/actions/examiner";
import {
  BookOpen,
  PlusCircle,
  FolderPlus,
  ArrowRight,
  Globe,
  Building2,
} from "lucide-react";

export default async function ExaminerQuestionBanksPage() {
  const supabase = await createClient();

  // Fetch all question banks
  const { data: banks } = await supabase
    .from("question_banks")
    .select(`
      id,
      name,
      description,
      is_common,
      department_id,
      created_at
    `)
    .order("created_at", { ascending: false });

  // Fetch all departments
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

  // Fetch question counts per bank
  const { data: questions } = await supabase
    .from("questions")
    .select("bank_id, type, is_common, department_id");

  // Count questions per bank
  const questionCountMap: Record<string, number> = {};
  let totalCommonQuestions = 0;
  let totalDeptQuestions = 0;

  questions?.forEach((q) => {
    questionCountMap[q.bank_id] = (questionCountMap[q.bank_id] || 0) + 1;
    if (q.is_common !== false) {
      totalCommonQuestions++;
    } else {
      totalDeptQuestions++;
    }
  });

  const totalQuestions = questions?.length || 0;
  const totalBanks = banks?.length || 0;

  return (
    <div className="space-y-6">
      {/* Metric Summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-xs uppercase font-bold text-slate-500 mb-1">
            Question Banks
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {totalBanks} {totalBanks === 1 ? "Bank" : "Banks"}
          </div>
          <div className="text-xs text-indigo-700 font-semibold mt-1">
            Institutional Repositories
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-xs uppercase font-bold text-slate-500 mb-1">
            Total Questions
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {totalQuestions} {totalQuestions === 1 ? "Item" : "Items"}
          </div>
          <div className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
            <span>{totalCommonQuestions} Universal</span>
            <span>•</span>
            <span>{totalDeptQuestions} Dept-Specific</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-xs uppercase font-bold text-slate-500 mb-1">
            Academic Scope
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {departments.length} {departments.length === 1 ? "Dept" : "Depts"}
          </div>
          <div className="text-xs text-purple-700 font-semibold mt-1">
            Curriculum Partitioning
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-xs uppercase font-bold text-slate-500 mb-1">
            Evaluation Engine
          </div>
          <div className="text-2xl font-extrabold text-slate-900">Automated</div>
          <div className="text-xs text-blue-700 font-semibold mt-1">
            Instant Objective Scoring
          </div>
        </div>
      </div>

      {/* Action Header & Bank Creation */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Departmental Question Banks
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Organize questions by domain, curriculum level, or doctoral research area.
            </p>
          </div>

          <details className="group relative">
            <summary className="list-none inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-xs font-bold text-white shadow-xs cursor-pointer select-none transition-all">
              <PlusCircle className="w-4 h-4" />
              <span>New Question Bank</span>
            </summary>

            <div className="absolute right-0 mt-2 w-96 bg-white border border-slate-200 rounded-2xl p-5 shadow-xl z-30">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Create Question Bank
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Define a new subject or research domain repository.
              </p>

              <form
                action={async (formData: FormData) => {
                  "use server";
                  await createQuestionBankAction(formData);
                }}
                className="space-y-3.5"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bank Title *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Advanced Machine Learning (CS-902)"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Academic Scope / Department Binding
                  </label>
                  <select
                    name="departmentId"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white text-slate-900 font-medium"
                  >
                    <option value="">🌐 Universal Common Bank (All Departments)</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        🏛️ {dept.name} {dept.code ? `(${dept.code})` : ""}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Universal repositories contain common items; departmental banks are dedicated to a specific curriculum.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Description & Syllabus Scope
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="Coverage: Deep architectures, Transformers, Reinforcement learning..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400"
                  ></textarea>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
                  >
                    Save Repository
                  </button>
                </div>
              </form>
            </div>
          </details>
        </div>
      </div>

      {/* Banks List */}
      <div className="space-y-4">
        {banks && banks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {banks.map((bank) => {
              const count = questionCountMap[bank.id] || 0;
              const isBankCommon = bank.is_common !== false;
              const boundDept = bank.department_id ? deptMap.get(bank.department_id) : null;

              return (
                <div
                  key={bank.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100/80 text-indigo-700 flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {count} {count === 1 ? "Question" : "Questions"}
                        </span>
                        {isBankCommon ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                            <Globe className="w-2.5 h-2.5" />
                            <span>Universal</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                            <Building2 className="w-2.5 h-2.5" />
                            <span>{boundDept?.code || "Dept Bound"}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 mt-3">
                      {bank.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {bank.description || "No specific syllabus notes documented."}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">
                      Added {new Date(bank.created_at).toLocaleDateString()}
                    </span>
                    <Link
                      href={`/examiner/banks/${bank.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-800 group"
                    >
                      <span>Manage Items</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <FolderPlus className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              No Question Banks Registered
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create your first question bank using the &ldquo;New Question Bank&rdquo; button above to start organizing entrance examination questions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
