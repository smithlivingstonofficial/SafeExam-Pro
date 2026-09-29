import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { requireRole } from "@/lib/auth/rbac";
import {
  ShieldCheck,
  Camera,
  Eye,
  AlertTriangle,
  Users,
  Radio,
  CheckCircle,
  AlertOctagon,
  LogOut,
  User,
  MessageSquare,
} from "lucide-react";

export default async function ProctorDashboard() {
  await requireRole(["proctor", "admin"]);
  const activeCandidates = [
    { id: "C-101", name: "Alexander Vance", stream: "Live (720p)", flags: 0, status: "Normal", progress: "42/60 answered" },
    { id: "C-102", name: "Sophia Reynolds", stream: "Live (720p)", flags: 2, status: "Voice Anomaly Flagged", progress: "38/60 answered" },
    { id: "C-103", name: "Rohan Sharma", stream: "Live (720p)", flags: 0, status: "Normal", progress: "45/60 answered" },
    { id: "C-104", name: "Mei Lin", stream: "Live (720p)", flags: 1, status: "Gaze Aversion (8s)", progress: "29/60 answered" },
    { id: "C-105", name: "David Kim", stream: "Live (720p)", flags: 0, status: "Normal", progress: "51/60 answered" },
    { id: "C-106", name: "Zainab Al-Mansoor", stream: "Live (720p)", flags: 0, status: "Normal", progress: "36/60 answered" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-xs">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900">
                  SafeExam Pro
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Proctor Console
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <User className="w-4 h-4 text-slate-400" />
              <span>Invigilator Desk #3 (Dr. M. Jenkins)</span>
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
        {/* Metric Overview Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs uppercase font-bold text-slate-500 mb-1">Supervised Candidates</div>
            <div className="text-2xl font-extrabold text-slate-900">24 Active</div>
            <div className="text-xs text-emerald-600 font-semibold mt-1">100% WebRTC Video Sync</div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs uppercase font-bold text-slate-500 mb-1">AI Incident Flags</div>
            <div className="text-2xl font-extrabold text-amber-600">3 Detected</div>
            <div className="text-xs text-amber-700 font-semibold mt-1">Review Required</div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs uppercase font-bold text-slate-500 mb-1">Lockdown Integrity</div>
            <div className="text-2xl font-extrabold text-slate-900">100% Clean</div>
            <div className="text-xs text-slate-500 mt-1">0 Process Breaches</div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs uppercase font-bold text-slate-500 mb-1">Session Remaining</div>
            <div className="text-2xl font-extrabold text-blue-700">01h 14m</div>
            <div className="text-xs text-slate-500 mt-1">Paper II Computer Science</div>
          </div>
        </div>

        {/* Video Mosaic Grid */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              Real-Time Candidate Video Stream Grid
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live multi-candidate WebRTC monitoring with automated audio/gaze anomaly detection.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeCandidates.map((c) => (
            <div
              key={c.id}
              className={`bg-white rounded-2xl border p-4 shadow-xs transition-all ${
                c.flags > 0 ? "border-amber-300 ring-2 ring-amber-100" : "border-slate-200"
              }`}
            >
              {/* Simulated Camera Feed Container */}
              <div className="relative aspect-video rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden mb-3">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="relative text-center text-slate-400">
                  <Camera className="w-8 h-8 mx-auto mb-1 text-slate-500 animate-pulse" />
                  <span className="text-[11px] font-mono">{c.name}</span>
                </div>

                {/* Video Overlays */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>LIVE</span>
                </div>

                {c.flags > 0 && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{c.flags} Flag</span>
                  </div>
                )}

                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-slate-300 bg-black/60 px-2 py-1 rounded">
                  <span>{c.id}</span>
                  <span>{c.progress}</span>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center justify-between mb-3 text-xs">
                <div className="font-bold text-slate-900 truncate max-w-[140px]">
                  {c.name}
                </div>
                <div className={`text-[11px] font-semibold ${c.flags > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                  {c.status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <button className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer">
                  <MessageSquare className="w-3 h-3" />
                  <span>Send Warning</span>
                </button>
                <button className="py-1.5 px-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer">
                  <AlertOctagon className="w-3 h-3" />
                  <span>Pause/Halt</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
