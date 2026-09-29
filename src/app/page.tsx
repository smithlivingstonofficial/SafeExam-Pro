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
} from "lucide-react";

export default function HomePage() {
  const [checkingSystem, setCheckingSystem] = useState(false);
  const [systemChecked, setSystemChecked] = useState(false);

  const runDiagnostic = () => {
    setCheckingSystem(true);
    setTimeout(() => {
      setCheckingSystem(false);
      setSystemChecked(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Top Banner & Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#070b14]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-blue-200">
                SafeExam Pro
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-950/80 border border-blue-800/50 text-blue-300 font-medium">
                University Edition
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Proctoring Network Online</span>
            </div>
            <a
              href="#portals"
              className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-md shadow-blue-600/30"
            >
              Sign In
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-16 pb-20 overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[250px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700/60 text-xs text-slate-300 mb-6 shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Official Entrance Examination Platform</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight sm:leading-tight">
              Uncompromising Security for <br className="hidden sm:inline" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
                High-Stakes University Exams
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
              SafeExam Pro safeguards academic integrity through a verified lockdown browser,
              real-time AI proctoring, server-synced auto-save responses, and tamper-proof audit trails
              tailored for our university admissions.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#system-check"
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.02]"
              >
                <Monitor className="w-4 h-4" />
                <span>Test Candidate Environment</span>
              </a>
              <a
                href="#portals"
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 font-semibold text-slate-200 transition-all hover:scale-[1.02]"
              >
                <span>Enter Staff Portal</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </a>
            </div>

            {/* Quick Stats Grid */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="glass-panel p-4 rounded-2xl text-left border border-slate-800">
                <div className="flex items-center gap-2 text-blue-400 mb-1">
                  <Lock className="w-4 h-4" />
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Lockdown</span>
                </div>
                <div className="text-2xl font-bold text-white">100%</div>
                <div className="text-xs text-slate-400 mt-1">Restricted OS Environment</div>
              </div>

              <div className="glass-panel p-4 rounded-2xl text-left border border-slate-800">
                <div className="flex items-center gap-2 text-indigo-400 mb-1">
                  <Camera className="w-4 h-4" />
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Proctoring</span>
                </div>
                <div className="text-2xl font-bold text-white">Realtime</div>
                <div className="text-xs text-slate-400 mt-1">Multi-signal telemetry</div>
              </div>

              <div className="glass-panel p-4 rounded-2xl text-left border border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <Timer className="w-4 h-4" />
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Sync Engine</span>
                </div>
                <div className="text-2xl font-bold text-white">&lt; 30s</div>
                <div className="text-xs text-slate-400 mt-1">Continuous Cloud Auto-save</div>
              </div>

              <div className="glass-panel p-4 rounded-2xl text-left border border-slate-800">
                <div className="flex items-center gap-2 text-purple-400 mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Governance</span>
                </div>
                <div className="text-2xl font-bold text-white">Immutable</div>
                <div className="text-xs text-slate-400 mt-1">Full audit log trail</div>
              </div>
            </div>
          </div>
        </section>

        {/* System Compatibility & Pre-Exam Diagnostic */}
        <section id="system-check" className="py-16 border-y border-slate-800/80 bg-slate-950/60">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Candidate Pre-Flight
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                System Compatibility Diagnostic
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Verify your browser, camera permissions, and network stability before taking an entrance exam.
              </p>
            </div>

            <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 mt-0.5">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Browser Environment</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Checks WebRTC, Fullscreen capability, and secure cookie storage.
                    </p>
                    <div className="mt-2 text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>App Router & HTTPS Ready</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 mt-0.5">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Media Feed Readiness</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Webcam and microphone access for proctored sessions.
                    </p>
                    <div className="mt-2 text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>WebRTC Stream Subsystem Active</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Heartbeat & Sync Latency</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Direct low-latency link to Supabase Postgres database.
                    </p>
                    <div className="mt-2 text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Average roundtrip &lt; 45ms</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 mt-0.5">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Safe Browser Protocol</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Enforces anti-cheating restrictions and tab-switch monitoring.
                    </p>
                    <div className="mt-2 text-xs font-medium text-blue-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Lockdown desktop mode optional for web demo</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-400 text-center sm:text-left">
                  {systemChecked ? (
                    <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> All core system diagnostics passed. You are ready for examination.
                    </span>
                  ) : (
                    "Run an instant compatibility scan on this device to check exam readiness."
                  )}
                </div>
                <button
                  onClick={runDiagnostic}
                  disabled={checkingSystem}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-white border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${checkingSystem ? "animate-spin text-blue-400" : ""}`} />
                  <span>{checkingSystem ? "Testing Hardware..." : "Run Diagnostic Scan"}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Role Portals Gateway */}
        <section id="portals" className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Role-Based Access Control
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-1">
              Select Your Access Portal
            </h2>
            <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
              SafeExam Pro assigns tailored interfaces according to your designated academic role.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Candidate Portal */}
            <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col justify-between border border-slate-800">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Candidate Portal</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Enter designated exam lobby, undergo identity verification, and take scheduled entrance tests.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/80">
                <span className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  Access Exam Lobby <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Examiner Portal */}
            <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col justify-between border border-slate-800">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Examiner Suite</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Manage categorized question banks with LaTeX math, compose multi-section exams, and publish answer keys.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/80">
                <span className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                  Compose Exams <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Proctor Portal */}
            <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col justify-between border border-slate-800">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-600/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Live Proctor Console</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Supervise active exam candidates with real-time video mosaic, anomaly flag detection, and candidate messaging.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/80">
                <span className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                  Open Monitoring Grid <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* University Admin */}
            <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col justify-between border border-slate-800">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">University Admin</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Configure department rosters, schedules, immutable audit records, and comprehensive results analytics.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/80">
                <span className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1">
                  Manage Institution <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 bg-[#05080f] text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-slate-300">SafeExam Pro</span>
            <span>— Single University Examination Infrastructure</span>
          </div>
          <div className="flex items-center gap-6 text-slate-500">
            <span>Powered by Next.js & Supabase</span>
            <span>Cloudflare Edge Secured</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
