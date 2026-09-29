import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { requireRole } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
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
  VideoOff,
} from "lucide-react";

export default async function ProctorDashboard() {
  const user = await requireRole(["proctor", "admin"]);
  const supabase = await createClient();

  // Fetch real active assignments (candidates currently taking an exam)
  const { data: activeAssignments } = await supabase
    .from("exam_assignments")
    .select("id, candidate_id, schedule_id, status, started_at")
    .eq("status", "started");

  // Fetch profiles for active candidates
  const candidateIds = activeAssignments?.map((a) => a.candidate_id) || [];
  const { data: candidateProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, department")
    .in("id", candidateIds.length ? candidateIds : ["00000000-0000-0000-0000-000000000000"]);

  // Fetch proctoring sessions
  const assignmentIds = activeAssignments?.map((a) => a.id) || [];
  const { data: proctorSessions } = await supabase
    .from("proctoring_sessions")
    .select("id, assignment_id, risk_score, flags")
    .in("assignment_id", assignmentIds.length ? assignmentIds : ["00000000-0000-0000-0000-000000000000"]);

  const candidateMap = new Map((candidateProfiles || []).map((c) => [c.id, c]));
  const sessionMap = new Map((proctorSessions || []).map((s) => [s.assignment_id, s]));

  const activeCount = activeAssignments?.length || 0;
  const flagCount = proctorSessions?.reduce((acc, s) => acc + ((s.flags as any[])?.length || 0), 0) || 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white">
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
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <User className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-800">{user.fullName}</span>
              <span className="text-slate-400">•</span>
              <span className="text-[11px] text-emerald-700 uppercase font-bold">{user.role}</span>
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
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="text-xs uppercase font-bold text-slate-500 mb-1">Supervised Candidates</div>
            <div className="text-2xl font-extrabold text-slate-900">{activeCount} Active</div>
            <div className="text-xs text-emerald-700 font-semibold mt-1">Live WebRTC Video Sync</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="text-xs uppercase font-bold text-slate-500 mb-1">AI Incident Flags</div>
            <div className="text-2xl font-extrabold text-amber-700">{flagCount} Detected</div>
            <div className="text-xs text-amber-600 font-semibold mt-1">Gaze / Process Alerts</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="text-xs uppercase font-bold text-slate-500 mb-1">Lockdown Integrity</div>
            <div className="text-2xl font-extrabold text-slate-900">Enforced</div>
            <div className="text-xs text-slate-500 mt-1">Kiosk Mode Active</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="text-xs uppercase font-bold text-slate-500 mb-1">Invigilation Feed</div>
            <div className="text-2xl font-extrabold text-indigo-700">Ready</div>
            <div className="text-xs text-indigo-600 font-semibold mt-1">Direct Audio/Video Link</div>
          </div>
        </div>

        {/* Video Mosaic Grid */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Active Examination Feeds</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live multi-camera streaming with real-time biometric telemetry and anti-cheat indicators.
            </p>
          </div>
        </div>

        {activeAssignments && activeAssignments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeAssignments.map((assignment) => {
              const candidate = candidateMap.get(assignment.candidate_id);
              const session = sessionMap.get(assignment.id);
              const risk = session?.risk_score || 0;

              return (
                <div
                  key={assignment.id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs"
                >
                  <div className="h-44 bg-slate-900 relative flex items-center justify-center text-slate-500">
                    <Camera className="w-10 h-10 opacity-30" />
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-emerald-500 text-white font-bold text-[10px] uppercase">
                      Live Feed
                    </div>
                    {risk > 50 && (
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-rose-600 text-white font-bold text-[10px] uppercase flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Risk {risk}%</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{candidate?.full_name || "Candidate"}</h4>
                        <p className="text-xs text-slate-500">{candidate?.department || "Department"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button className="flex-1 py-1.5 px-3 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs">
                        Focus Feed
                      </button>
                      <button className="py-1.5 px-3 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs">
                        Flag Incident
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-16 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
              <VideoOff className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              No Active Examination Feeds
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are currently no candidates actively executing an examination session. Surveillance feeds and live anomaly streams will initialize automatically when examinees enter the lockdown environment.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
