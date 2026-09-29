import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { requireRole } from "@/lib/auth/rbac";
import {
  ShieldCheck,
  FileSpreadsheet,
  PlusCircle,
  Upload,
  BookOpen,
  CheckCircle,
  HelpCircle,
  LogOut,
  User,
  Sliders,
} from "lucide-react";

export default async function ExaminerDashboard() {
  await requireRole(["examiner", "admin"]);
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-700 flex items-center justify-center text-white shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900">
                SafeExam Pro
              </span>
              <span className="ml-2 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">
                Examiner Suite
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <User className="w-4 h-4 text-slate-400" />
              <span>Prof. Eleanor Vance (Faculty of Computing)</span>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs uppercase font-bold text-slate-500 mb-1">Question Banks</div>
            <div className="text-2xl font-extrabold text-slate-900">12 Banks</div>
            <div className="text-xs text-indigo-600 font-semibold mt-1">450+ Active Items</div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs uppercase font-bold text-slate-500 mb-1">Composed Exams</div>
            <div className="text-2xl font-extrabold text-slate-900">4 Active</div>
            <div className="text-xs text-emerald-600 font-semibold mt-1">Ready for Scheduling</div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs uppercase font-bold text-slate-500 mb-1">Item Types</div>
            <div className="text-2xl font-extrabold text-slate-900">7 Formats</div>
            <div className="text-xs text-slate-500 mt-1">MCQ, LaTeX, Code, Fill-in</div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs uppercase font-bold text-slate-500 mb-1">Evaluation Status</div>
            <div className="text-2xl font-extrabold text-slate-900">Auto-Graded</div>
            <div className="text-xs text-blue-600 font-semibold mt-1">Instant Objective Scoring</div>
          </div>
        </div>

        {/* Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              Department Question Repositories
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Author questions, review item discrimination indices, and compose secure entrance papers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Bulk Import CSV/QTI</span>
            </button>
            <button className="px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-xs font-bold text-white shadow-xs flex items-center gap-1.5 cursor-pointer">
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Question</span>
            </button>
          </div>
        </div>

        {/* Question Banks List */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="divide-y divide-slate-100">
            <div className="p-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Advanced Algorithms & Complexity (CS-901)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Graph algorithms, Dynamic Programming, NP-Completeness, Randomized structures
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">128 Questions</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-medium">Difficulty Level: 3.8 / 5</span>
                    <span>•</span>
                    <span>Version 2.4</span>
                  </div>
                </div>
              </div>
              <button className="text-xs font-bold text-indigo-700 hover:text-indigo-800 px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-50">
                Open Bank →
              </button>
            </div>

            <div className="p-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Discrete Mathematics & Formal Proofs (MATH-804)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Combinatorics, Boolean algebra, Recurrence relations, Graph theory (LaTeX enabled)
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">164 Questions</span>
                    <span>•</span>
                    <span className="text-amber-700 font-medium">Difficulty Level: 4.2 / 5</span>
                    <span>•</span>
                    <span>Version 1.9</span>
                  </div>
                </div>
              </div>
              <button className="text-xs font-bold text-indigo-700 hover:text-indigo-800 px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-50">
                Open Bank →
              </button>
            </div>

            <div className="p-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Research Methodology & Statistical Inference (RM-701)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hypothesis testing, Regression, Sampling techniques, Research ethics
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">92 Questions</span>
                    <span>•</span>
                    <span className="text-blue-700 font-medium">Difficulty Level: 3.1 / 5</span>
                    <span>•</span>
                    <span>Version 3.0</span>
                  </div>
                </div>
              </div>
              <button className="text-xs font-bold text-indigo-700 hover:text-indigo-800 px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-50">
                Open Bank →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
