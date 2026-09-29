import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { requireRole } from "@/lib/auth/rbac";
import {
  ShieldCheck,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Lock,
  LogOut,
  Play,
  FileText,
  User,
} from "lucide-react";

export default async function CandidateDashboard() {
  await requireRole(["candidate", "admin"]);
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-700 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900">
                SafeExam Pro
              </span>
              <span className="ml-2 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
                Candidate Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <User className="w-4 h-4 text-slate-400" />
              <span>Candidate #2026-MCA-084</span>
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
        {/* Welcome Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                Apex State University Admissions
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                Welcome, Alexander Vance
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Department of Computer Applications • Ph.D / MCA Entrance Examination 2026
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-700">Device Status</div>
                <div className="text-xs font-bold text-emerald-700 flex items-center gap-1 justify-end">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified & Compatible
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Exam Allocation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active / Upcoming Tests (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-700" />
              <span>Assigned Entrance Examination Sessions</span>
            </h2>

            {/* Test Card */}
            <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-blue-600 text-white text-[11px] font-bold rounded-bl-xl uppercase tracking-wider">
                Scheduled Today
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900">
                    Ph.D Entrance Assessment 2026 — Paper I & II
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Advanced Algorithms, Discrete Mathematics, Data Systems & Research Aptitude
                  </p>

                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>Duration: <strong>120 Mins</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-indigo-500" />
                      <span>Lockdown Browser: <strong>Required</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Proctoring: <strong>AI + Human</strong></span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-500">
                      Reporting Window: <span className="font-semibold text-slate-700">10:00 AM – 10:30 AM IST</span>
                    </div>
                    <button className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Launch Exam Environment</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Pre-Exam Security & Guidelines */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-700" />
              <span>Candidate Checklist</span>
            </h2>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div className="text-xs text-slate-600">
                  <strong className="text-slate-900">Valid Identification:</strong> Keep your official government ID card ready for camera verification.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div className="text-xs text-slate-600">
                  <strong className="text-slate-900">Single Monitor Setup:</strong> Disconnect any external secondary monitors or screen mirroring cables.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div className="text-xs text-slate-600">
                  <strong className="text-slate-900">Well-Lit Room:</strong> Ensure your face is clearly visible without bright background backlights.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div className="text-xs text-slate-600">
                  <strong className="text-slate-900">Strict Anti-Cheat:</strong> Tab-switching, copy-pasting, or unauthorized audio triggers an automatic incident flag.
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/#system-check"
                  className="block text-center py-2 text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-100"
                >
                  Re-run Device Compatibility Scan →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
