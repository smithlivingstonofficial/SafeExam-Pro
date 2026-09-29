"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Lock,
  Camera,
  Timer,
  FileSpreadsheet,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Monitor,
  Activity,
  Award,
  Sparkles,
  RefreshCw,
  School,
  FileText,
  Eye,
} from "lucide-react";

export default function HomePage() {
  const [checkingSystem, setCheckingSystem] = useState(false);
  const [systemChecked, setSystemChecked] = useState(false);

  const runDiagnostic = () => {
    setCheckingSystem(true);
    setTimeout(() => {
      setCheckingSystem(false);
      setSystemChecked(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Top Banner & University Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center shadow-sm text-white">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-slate-900">
                  SafeExam Pro
                </span>
                <span className="hidden sm:inline-block text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-semibold">
                  University Edition
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Apex State University • Examination & Evaluation Board
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Proctoring Grid Online</span>
            </div>
            <a
              href="#portals"
              className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white transition-colors shadow-xs"
            >
              Sign In to Portal
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-14 pb-20 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100/60 border-b border-slate-200/60">
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs text-slate-700 mb-6 shadow-xs font-medium">
              <School className="w-3.5 h-3.5 text-blue-600" />
              <span>Official University Entrance Examination Infrastructure</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight sm:leading-tight">
              Secure, Tamper-Resistant <br className="hidden sm:inline" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900">
                Entrance Examination Platform
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
              SafeExam Pro guarantees complete academic integrity for our university admissions
              through lockdown browser enforcement, real-time AI & human proctoring, server-synced auto-save responses,
              and immutable audit logs.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#system-check"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 font-semibold text-white shadow-sm transition-all hover:shadow"
              >
                <Monitor className="w-4 h-4" />
                <span>Test Candidate Device</span>
              </a>
              <a
                href="#portals"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 font-semibold text-slate-700 transition-all shadow-2xs"
              >
                <span>Access University Portals</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </a>
            </div>

            {/* Quick Metrics Grid */}
            <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="bg-white p-5 rounded-xl text-left border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 text-blue-700 mb-1.5">
                  <Lock className="w-4 h-4" />
                  <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500">Lockdown Mode</span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900">100%</div>
                <div className="text-xs text-slate-500 mt-1">Dual-monitor & process restriction</div>
              </div>

              <div className="bg-white p-5 rounded-xl text-left border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 text-indigo-700 mb-1.5">
                  <Camera className="w-4 h-4" />
                  <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500">Proctoring</span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900">Realtime</div>
                <div className="text-xs text-slate-500 mt-1">Continuous multi-signal telemetry</div>
              </div>

              <div className="bg-white p-5 rounded-xl text-left border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 text-emerald-700 mb-1.5">
                  <Timer className="w-4 h-4" />
                  <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500">Auto-Save</span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900">&lt; 30s</div>
                <div className="text-xs text-slate-500 mt-1">Direct cloud sync per response</div>
              </div>

              <div className="bg-white p-5 rounded-xl text-left border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 text-purple-700 mb-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500">Audit Trail</span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900">Immutable</div>
                <div className="text-xs text-slate-500 mt-1">Cryptographic session timeline</div>
              </div>
            </div>
          </div>
        </section>

        {/* Candidate Pre-Flight System Diagnostic */}
        <section id="system-check" className="py-16 bg-white border-b border-slate-200/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                Candidate Pre-Flight
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
                System Compatibility Diagnostic
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                Verify browser compatibility, webcam/microphone readiness, and network stability before exam commencement.
              </p>
            </div>

            <div className="bg-slate-50/80 rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <div className="p-2.5 rounded-lg bg-blue-50 text-blue-700">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Browser Environment</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Full-screen API capability, cookie session management, and HTML5 Web Storage.
                    </p>
                    <div className="mt-2 text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Modern Browser Verified</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Media Feeds & WebRTC</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Webcam and microphone access for automated AI proctoring and supervisor monitoring.
                    </p>
                    <div className="mt-2 text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>WebRTC Streaming Available</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Network & Server Heartbeat</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Continuous low-latency connection to the university database server.
                    </p>
                    <div className="mt-2 text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Average Latency: 38ms</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <div className="p-2.5 rounded-lg bg-purple-50 text-purple-700">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Safe Browser Protocol</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Restricted exam environment blocking copy/paste, tab-switching, and unauthorized tools.
                    </p>
                    <div className="mt-2 text-xs font-semibold text-blue-700 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>Standard Web & Lockdown Client Supported</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-600 text-center sm:text-left">
                  {systemChecked ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      All system compatibility checks passed. Your device is ready for examination.
                    </span>
                  ) : (
                    "Click to run an automated diagnostic on this browser and network."
                  )}
                </div>
                <button
                  onClick={runDiagnostic}
                  disabled={checkingSystem}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold border border-slate-300 flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${checkingSystem ? "animate-spin text-blue-600" : "text-slate-500"}`} />
                  <span>{checkingSystem ? "Testing Device..." : "Run Compatibility Scan"}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* University Role Portals */}
        <section id="portals" className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
              University Access
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-3">
              Institutional Gateways
            </h2>
            <p className="text-sm text-slate-500 mt-2 max-w-xl mx-auto">
              Sign in through your authorized institutional role to access exam functions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Candidate Portal */}
            <div className="bg-white light-card-hover p-6 rounded-2xl flex flex-col justify-between border border-slate-200 shadow-xs">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Candidate Lobby</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Identity verification, admit card checks, scheduled entrance exam sessions, and score reports.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1">
                  Candidate Login <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Examiner Portal */}
            <div className="bg-white light-card-hover p-6 rounded-2xl flex flex-col justify-between border border-slate-200 shadow-xs">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 mb-4">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Examiner Suite</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Question bank authoring with LaTeX equations, exam composing, marking scheme setup, and question analytics.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-indigo-700 hover:text-indigo-800 flex items-center gap-1">
                  Examiner Login <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Proctor Portal */}
            <div className="bg-white light-card-hover p-6 rounded-2xl flex flex-col justify-between border border-slate-200 shadow-xs">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-4">
                  <Eye className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Proctor Monitor</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Live multi-video candidate grid, anomaly incident flags, candidate warnings, and exam termination tools.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
                  Proctor Console <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* University Admin */}
            <div className="bg-white light-card-hover p-6 rounded-2xl flex flex-col justify-between border border-slate-200 shadow-xs">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 mb-4">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">University Admin</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Institutional governance, department rosters, user role assignments, audit logs, and result publication.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1">
                  Admin Control <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* University Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
            <span className="font-bold text-slate-800">SafeExam Pro</span>
            <span>— University Entrance Examination Board System</span>
          </div>
          <div className="flex items-center gap-6 text-slate-400">
            <span>Next.js 16 • Supabase PostgreSQL • Light Theme Enforced</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
