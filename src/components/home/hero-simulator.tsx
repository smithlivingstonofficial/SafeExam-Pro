"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Lock,
  Camera,
  Timer,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  Activity,
  Volume2,
  RefreshCw,
  Bell,
  Cpu,
  Radio,
  Eye,
  Check,
  Sparkles,
} from "lucide-react";

interface HeroSimulatorProps {
  universityName: string;
  lockdownRequired: boolean;
  autoSaveSeconds: number;
}

export function HeroSimulator({
  universityName,
  lockdownRequired,
  autoSaveSeconds,
}: HeroSimulatorProps) {
  const [activeTab, setActiveTab] = useState<"candidate" | "proctor">("candidate");
  const [selectedOption, setSelectedOption] = useState<number>(1);
  const [timeRemaining, setTimeRemaining] = useState<number>(6245); // 01:44:05
  const [lastSaved, setLastSaved] = useState<string>("Just now");
  const [hasIncident, setHasIncident] = useState<boolean>(false);
  const [warningSent, setWarningSent] = useState<boolean>(false);
  const [auditEvents, setAuditEvents] = useState<
    Array<{ id: string; time: string; event: string; type: "info" | "warning" | "success" }>
  >([
    { id: "1", time: "10:32:04", event: "Biometric identity token validated via university roster", type: "success" },
    { id: "2", time: "10:32:05", event: "Lockdown shell enforced: dual-screen disabled, 14 apps restricted", type: "info" },
    { id: "3", time: "10:32:15", event: "WebRTC peer connection established with Proctor Grid #04", type: "success" },
  ]);

  // Live timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Periodic auto-save simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setLastSaved(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, autoSaveSeconds * 1000);
    return () => clearInterval(interval);
  }, [autoSaveSeconds]);

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const triggerSimulatedIncident = () => {
    if (hasIncident) {
      setHasIncident(false);
      setWarningSent(false);
      return;
    }
    setHasIncident(true);
    setWarningSent(false);
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setAuditEvents((prev) => [
      {
        id: Date.now().toString(),
        time: now,
        event: "Telemetry Flag: Candidate #102 gaze deviation > 4.2s + Audio spike detected (42dB)",
        type: "warning",
      },
      ...prev.slice(0, 4),
    ]);
  };

  const handleSendWarning = () => {
    setWarningSent(true);
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setAuditEvents((prev) => [
      {
        id: Date.now().toString(),
        time: now,
        event: "Proctor Warning Dispatched: 'Please keep your focus squarely on the primary display.'",
        type: "info",
      },
      ...prev.slice(0, 4),
    ]);
    setTimeout(() => {
      setHasIncident(false);
    }, 4000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Outer Shell Card with Glassmorphic Header */}
      <div className="rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-xl shadow-2xl shadow-slate-900/10 overflow-hidden transition-all duration-300">
        {/* Top Control Bar & Tab Switcher */}
        <div className="bg-slate-100/90 border-b border-slate-200/90 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* OS Window Controls & Platform Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-400 border border-rose-500/50 inline-block shadow-2xs" />
              <span className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500/50 inline-block shadow-2xs" />
              <span className="w-3 h-3 rounded-full bg-emerald-400 border border-emerald-500/50 inline-block shadow-2xs" />
            </div>
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              <span>SafeExam Shell v2.4</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                Locked
              </span>
            </div>
          </div>

          {/* Interactive Mode Toggle */}
          <div className="flex items-center bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab("candidate")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "candidate"
                  ? "bg-white text-blue-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Candidate Testing Screen</span>
            </button>
            <button
              onClick={() => setActiveTab("proctor")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "proctor"
                  ? "bg-white text-indigo-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Proctor Live Cockpit</span>
              {hasIncident && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
              )}
            </button>
          </div>

          {/* Status Metric */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Telemetry Ping: 18ms</span>
          </div>
        </div>

        {/* Tab 1: Candidate Testing Environment */}
        {activeTab === "candidate" && (
          <div className="p-4 sm:p-6 bg-slate-50/50">
            {/* Top Exam Header Strip */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  Paper Code: RES-PHD-2026
                </span>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 mt-1">
                  Research Methodology & Quantitative Analysis
                </h3>
                <p className="text-xs text-slate-500 truncate max-w-md">
                  {universityName} • Entrance Examination
                </p>
              </div>

              {/* Ticking Countdown & Auto-Save Badge */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Time Left</div>
                  <div className="text-xl sm:text-2xl font-mono font-extrabold text-blue-700 flex items-center gap-1.5">
                    <Timer className="w-4 h-4 text-blue-600 animate-pulse" />
                    <span>{formatTimer(timeRemaining)}</span>
                  </div>
                </div>

                <div className="hidden sm:block pl-4 border-l border-slate-200 text-right">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Response Status</div>
                  <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Auto-saved ({lastSaved})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Interactive Question Panel & Navigation Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Question Body (8 cols) */}
              <div className="lg:col-span-8 bg-white rounded-xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 text-xs">
                    <span className="font-extrabold text-blue-700">QUESTION 14 OF 50</span>
                    <span className="text-slate-500 font-medium">Marks: +2.0 / -0.5</span>
                  </div>

                  <p className="text-sm sm:text-base font-semibold text-slate-900 leading-relaxed mb-4">
                    In high-integrity distributed evaluation architectures, which mechanism guarantees cryptographic tamper-proofing of examination response packets before asynchronous transmission to the central evaluation database?
                  </p>

                  {/* Interactive Options */}
                  <div className="space-y-2.5">
                    {[
                      { id: 1, text: "Sequential SHA-256 hash chaining appended with a client-side ephemeral private key." },
                      { id: 2, text: "Standard unencrypted localStorage caching with periodic batch sync." },
                      { id: 3, text: "Single-threaded browser cookie storage with CSRF session tokens only." },
                      { id: 4, text: "Direct socket broadcast without cryptographic payload signing." },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedOption(opt.id)}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-start gap-3 cursor-pointer ${
                          selectedOption === opt.id
                            ? "bg-blue-50/80 border-blue-500 text-blue-900 shadow-2xs font-semibold ring-1 ring-blue-500/20"
                            : "bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                            selectedOption === opt.id
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-600 border border-slate-300"
                          }`}
                        >
                          {String.fromCharCode(64 + opt.id)}
                        </span>
                        <span className="flex-1">{opt.text}</span>
                        {selectedOption === opt.id && (
                          <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bottom Navigation Buttons */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
                  <div className="text-slate-400 font-medium">Question 14 answered • Autosaved</div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer">
                      Mark for Review
                    </button>
                    <button className="px-4 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold transition-colors cursor-pointer shadow-xs">
                      Save & Next Question →
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Proctoring & Question Matrix HUD (4 cols) */}
              <div className="lg:col-span-4 space-y-4">
                {/* Live Candidate Biometric Stream Mockup */}
                <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-blue-600" />
                      Live Proctoring Feed
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Encrypted 60fps
                    </span>
                  </div>

                  {/* Camera Screen Preview */}
                  <div className="relative rounded-lg aspect-video bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 overflow-hidden flex items-center justify-center p-3 text-center">
                    {/* Bounding box overlay */}
                    <div className="absolute inset-4 border-2 border-emerald-400/80 rounded-lg pointer-events-none flex flex-col justify-between p-1.5">
                      <div className="flex justify-between items-start text-[9px] font-mono text-emerald-300 font-bold bg-slate-950/60 px-1 py-0.5 rounded">
                        <span>FACE LOCK: 99.8%</span>
                        <span>GAZE: CENTER</span>
                      </div>
                      <div className="text-[9px] font-mono text-emerald-300 bg-slate-950/60 px-1 py-0.5 rounded self-start">
                        AUDIO: 12 dB (STABLE)
                      </div>
                    </div>

                    <div className="w-16 h-16 rounded-full bg-slate-700/80 border border-slate-500/50 flex items-center justify-center text-slate-300">
                      <Eye className="w-8 h-8 text-blue-400" />
                    </div>
                  </div>

                  {/* Telemetry Chips */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-1.5 text-slate-600">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">Browser Locked</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-1.5 text-slate-600">
                      <Volume2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">Audio Clean</span>
                    </div>
                  </div>
                </div>

                {/* Question Navigator Matrix */}
                <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
                  <div className="text-xs font-bold text-slate-900 mb-2.5 flex items-center justify-between">
                    <span>Question Palette</span>
                    <span className="text-[10px] text-slate-500 font-normal">14 of 50 Answered</span>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {Array.from({ length: 18 }).map((_, i) => {
                      const num = i + 1;
                      const isCurrent = num === 14;
                      const isAnswered = num < 14;
                      return (
                        <div
                          key={num}
                          className={`h-7 rounded flex items-center justify-center text-[11px] font-bold transition-all ${
                            isCurrent
                              ? "bg-blue-700 text-white ring-2 ring-blue-500/40 shadow-xs"
                              : isAnswered
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          {num}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Proctor Command Cockpit */}
        {activeTab === "proctor" && (
          <div className="p-4 sm:p-6 bg-slate-50/50">
            {/* Proctor Top Alert Bar */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    Proctor Station #04
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Assigned candidates: 42 active
                  </span>
                </div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 mt-1">
                  Active Monitoring: Department of Computer Science & Research
                </h3>
              </div>

              {/* Simulation Interactive Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={triggerSimulatedIncident}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                    hasIncident
                      ? "bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300"
                      : "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300"
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>{hasIncident ? "Reset Anomaly Test" : "Simulate Live Incident"}</span>
                </button>

                {hasIncident && !warningSent && (
                  <button
                    onClick={handleSendWarning}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Dispatch Warning</span>
                  </button>
                )}
              </div>
            </div>

            {/* 4-Candidate Video Streaming Wall */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Candidate 1 */}
              <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs">
                <div className="relative rounded-lg aspect-video bg-gradient-to-tr from-slate-900 to-slate-800 overflow-hidden flex items-center justify-center mb-2">
                  <div className="absolute top-2 left-2 text-[9px] font-mono text-emerald-400 bg-slate-950/70 px-1.5 py-0.5 rounded font-bold">
                    ID #101 • MEERA R.
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-500 flex items-center justify-center text-slate-300">
                    <Eye className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="absolute bottom-2 right-2 text-[9px] font-mono text-emerald-300 bg-slate-950/70 px-1.5 py-0.5 rounded">
                    GAZE: 98%
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">Meera R.</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Normal
                  </span>
                </div>
              </div>

              {/* Candidate 2 (The incident candidate) */}
              <div
                className={`bg-white rounded-xl p-3 border transition-all shadow-xs ${
                  hasIncident
                    ? "border-rose-400 ring-2 ring-rose-400/40 bg-rose-50/20"
                    : "border-slate-200/80"
                }`}
              >
                <div
                  className={`relative rounded-lg aspect-video overflow-hidden flex items-center justify-center mb-2 transition-all ${
                    hasIncident
                      ? "bg-gradient-to-tr from-rose-950 to-slate-900"
                      : "bg-gradient-to-tr from-slate-900 to-slate-800"
                  }`}
                >
                  <div className="absolute top-2 left-2 text-[9px] font-mono text-amber-400 bg-slate-950/70 px-1.5 py-0.5 rounded font-bold">
                    ID #102 • ARUN K.
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-500 flex items-center justify-center text-slate-300">
                    <Eye className={`w-5 h-5 ${hasIncident ? "text-rose-400" : "text-blue-400"}`} />
                  </div>
                  <div
                    className={`absolute bottom-2 right-2 text-[9px] font-mono px-1.5 py-0.5 rounded ${
                      hasIncident
                        ? "text-rose-300 bg-rose-950/90 font-bold animate-pulse"
                        : "text-emerald-300 bg-slate-950/70"
                    }`}
                  >
                    {hasIncident ? "GAZE DIVERTED" : "GAZE: 94%"}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">Arun K.</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      hasIncident
                        ? "text-rose-800 bg-rose-100 animate-pulse"
                        : "text-emerald-700 bg-emerald-50"
                    }`}
                  >
                    {hasIncident ? "Flagged (Gaze & Audio)" : "Normal"}
                  </span>
                </div>
              </div>

              {/* Candidate 3 */}
              <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs">
                <div className="relative rounded-lg aspect-video bg-gradient-to-tr from-slate-900 to-slate-800 overflow-hidden flex items-center justify-center mb-2">
                  <div className="absolute top-2 left-2 text-[9px] font-mono text-emerald-400 bg-slate-950/70 px-1.5 py-0.5 rounded font-bold">
                    ID #103 • DIVYA S.
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-500 flex items-center justify-center text-slate-300">
                    <Eye className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="absolute bottom-2 right-2 text-[9px] font-mono text-emerald-300 bg-slate-950/70 px-1.5 py-0.5 rounded">
                    GAZE: 99%
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">Divya S.</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Normal
                  </span>
                </div>
              </div>

              {/* Candidate 4 */}
              <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs">
                <div className="relative rounded-lg aspect-video bg-gradient-to-tr from-slate-900 to-slate-800 overflow-hidden flex items-center justify-center mb-2">
                  <div className="absolute top-2 left-2 text-[9px] font-mono text-emerald-400 bg-slate-950/70 px-1.5 py-0.5 rounded font-bold">
                    ID #104 • RAHUL M.
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-500 flex items-center justify-center text-slate-300">
                    <Eye className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="absolute bottom-2 right-2 text-[9px] font-mono text-emerald-300 bg-slate-950/70 px-1.5 py-0.5 rounded">
                    GAZE: 97%
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">Rahul M.</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Normal
                  </span>
                </div>
              </div>
            </div>

            {/* Realtime Event Stream / Audit Ledger */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 text-xs">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                  Live Cryptographic Audit Trail
                </span>
                <span className="text-[10px] font-mono text-slate-500">Append-Only Event Stream</span>
              </div>

              <div className="space-y-2">
                {auditEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className={`flex items-start gap-2.5 p-2 rounded-lg text-xs font-mono transition-all ${
                      evt.type === "warning"
                        ? "bg-rose-50 border border-rose-200 text-rose-900"
                        : evt.type === "success"
                        ? "bg-emerald-50/70 text-emerald-900 border border-emerald-100"
                        : "bg-slate-50 text-slate-700 border border-slate-100"
                    }`}
                  >
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/80 border shrink-0">
                      {evt.time}
                    </span>
                    <span className="flex-1">{evt.event}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Institutional Seal Footer */}
        <div className="bg-slate-100/60 border-t border-slate-200/80 px-4 py-2.5 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Encrypted Dual-Channel Proctor Protocol v3.8</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Lockdown: {lockdownRequired ? "Enforced" : "Configurable"}</span>
            <span>Auto-Save: {autoSaveSeconds}s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
