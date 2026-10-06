"use client";

import { useState } from "react";
import {
  Lock,
  Camera,
  Timer,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Cpu,
  Layers,
  Radio,
  HardDrive,
  Users,
  Activity,
  FileCheck,
  Award,
} from "lucide-react";

interface ArchitectureShowcaseProps {
  autoSaveSeconds: number;
  lockdownRequired: boolean;
}

export function ArchitectureShowcase({
  autoSaveSeconds,
  lockdownRequired,
}: ArchitectureShowcaseProps) {
  const [activeStep, setActiveStep] = useState<number>(1);

  const pillars = [
    {
      id: "lockdown",
      title: "Kernel-Grade Lockdown Sandbox",
      badge: "Desktop & Web Kiosk",
      icon: Lock,
      color: "from-blue-600 to-indigo-600",
      lightBg: "bg-blue-50/70 border-blue-200/80 text-blue-700",
      desc: "Enforces single-screen display isolation, intercepting all operating system task-switching shortcuts and terminating unauthorized background processes.",
      specs: [
        "Blocks Alt+Tab, Cmd+Space, WinKey & DevTools",
        "Disables multi-monitor mirroring & virtual displays",
        "Clipboard wipe and print-screen interceptor",
        "Virtual machine (VMWare/VirtualBox) hypervisor detection",
      ],
    },
    {
      id: "proctoring",
      title: "Multi-Signal AI & Human Proctoring",
      badge: "Continuous WebRTC",
      icon: Camera,
      color: "from-indigo-600 to-purple-600",
      lightBg: "bg-indigo-50/70 border-indigo-200/80 text-indigo-700",
      desc: "Synchronous 60fps video and audio telemetry combined with local edge-computed neural inference for facial presence, gaze angle, and acoustic baseline.",
      specs: [
        "Realtime facial landmark tracking & gaze vector estimation",
        "Multi-person in room detection & continuous absence alarms",
        "Live audio waveform analysis with background chatter flags",
        "Supervisor live multi-candidate stream grid with instant whisper warnings",
      ],
    },
    {
      id: "autosave",
      title: "Zero-Data-Loss Response Engine",
      badge: `${autoSaveSeconds}s Incremental Sync`,
      icon: Timer,
      color: "from-emerald-600 to-teal-600",
      lightBg: "bg-emerald-50/70 border-emerald-200/80 text-emerald-700",
      desc: "Candidate responses are encrypted and synchronized every few seconds. An indexed offline buffer ensures unbroken continuity even during total campus Wi-Fi drops.",
      specs: [
        `Asynchronous delta sync every ${autoSaveSeconds} seconds per candidate`,
        "Encrypted IndexedDB & SQLite client-side state buffer",
        "Zero question reset on sudden tab refresh or power outage",
        "Seamless automatic reconnection with server timestamp reconciliation",
      ],
    },
    {
      id: "audit",
      title: "Cryptographic Audit Ledger",
      badge: "Append-Only Hash Chain",
      icon: ShieldCheck,
      color: "from-purple-600 to-pink-600",
      lightBg: "bg-purple-50/70 border-purple-200/80 text-purple-700",
      desc: "Every interaction—from question navigation and answer change to device blur—is cryptographically hashed and sealed into an immutable audit trail.",
      specs: [
        "SHA-256 tamper-evident event log for forensic examination review",
        "Granular per-second candidate timeline replay for faculty panels",
        "Role-based access control (RBAC) across 5 institutional roles",
        "Department-level grade verification and automated statistical normalizer",
      ],
    },
  ];

  const journeySteps = [
    {
      step: 1,
      title: "Identity & Device Pre-Flight",
      subtitle: "Biometrics & Hardware Seal",
      desc: "Candidate performs webcam face check, hardware peripheral scan, and network latency benchmark before receiving their exam session token.",
      tag: "Pre-Exam",
    },
    {
      step: 2,
      title: "Lockdown Shell Activation",
      subtitle: "Full-Screen Kiosk Lockdown",
      desc: "Operating system shortcuts, background utilities, secondary displays, and browser developer consoles are locked down with cryptographic key verification.",
      tag: "Initialization",
    },
    {
      step: 3,
      title: "Supervised High-Stakes Testing",
      subtitle: "Live Stream & Heartbeat",
      desc: `Candidate completes paper with sub-${autoSaveSeconds}s auto-save cloud sync while proctoring AI and human invigilators supervise live telemetry streams.`,
      tag: "Live Session",
    },
    {
      step: 4,
      title: "Cryptographic Submission & Audit",
      subtitle: "Immutable Score Generation",
      desc: "Responses are digitally sealed with candidate token signature, audit timeline is frozen for forensic review, and auto-evaluated scores are prepared for faculty review.",
      tag: "Finalization",
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-20">
      {/* 4 Architectural Pillars Grid */}
      <div>
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 mb-3 shadow-2xs">
            <Cpu className="w-3.5 h-3.5 text-blue-600" />
            <span>High-Assurance Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Engineered for Total Academic Integrity
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
            SafeExam Pro replaces vulnerable web forms with an enterprise-grade examination engine built on zero-trust principles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-7 shadow-xs hover:border-blue-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className={`p-3 rounded-xl border ${pillar.lightBg} group-hover:scale-105 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {pillar.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                    {pillar.desc}
                  </p>

                  <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                    {pillar.specs.map((spec, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span>{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4-Step Examination Security Journey */}
      <div className="bg-slate-50/70 border border-slate-200/90 rounded-3xl p-6 sm:p-12 relative overflow-hidden">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
            Examination Lifecycle
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
            The 4-Stage Security Verification Pipeline
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Click through each phase to observe how candidate data and integrity are safeguarded from start to finish.
          </p>
        </div>

        {/* Step Buttons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {journeySteps.map((s) => (
            <button
              key={s.step}
              onClick={() => setActiveStep(s.step)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                activeStep === s.step
                  ? "bg-white border-blue-500 ring-2 ring-blue-500/20 shadow-md font-semibold"
                  : "bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-extrabold ${
                    activeStep === s.step
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  0{s.step}
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {s.tag}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900 truncate">{s.title}</div>
              <div className="text-[11px] text-slate-500 truncate mt-0.5">{s.subtitle}</div>
            </button>
          ))}
        </div>

        {/* Active Step Showcase Detail */}
        {(() => {
          const cur = journeySteps.find((s) => s.step === activeStep) || journeySteps[0];
          return (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
                  <span>STAGE {cur.step} PROTOCOL</span>
                  <span>•</span>
                  <span>{cur.subtitle}</span>
                </div>
                <h4 className="text-xl font-extrabold text-slate-900">{cur.title}</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{cur.desc}</p>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <div className="text-center p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xl font-extrabold text-blue-700">100%</div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Tamper Proof</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xl font-extrabold text-indigo-700">
                    {lockdownRequired ? "Enforced" : "Active"}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Kiosk Sandbox</div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
