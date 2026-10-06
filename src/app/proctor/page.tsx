import { logoutAction } from "@/app/actions/auth";
import { requireRole } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { getUniversitySettings } from "@/lib/settings";
import { LiveProctorHub, ProctorCandidateFeed } from "@/components/proctor/live-proctor-hub";
import {
  Eye,
  LogOut,
  User,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProctorDashboard() {
  const user = await requireRole(["proctor", "admin"]);
  const supabase = await createClient();
  const settings = await getUniversitySettings();

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

  const candidateFeeds: ProctorCandidateFeed[] = (activeAssignments || []).map((a) => {
    const profile = candidateMap.get(a.candidate_id);
    const session = sessionMap.get(a.id);
    const flagsList = (Array.isArray(session?.flags) ? session?.flags : []) as ProctorCandidateFeed["flags"];

    return {
      assignmentId: a.id,
      candidateId: a.candidate_id,
      candidateName: profile?.full_name || "Candidate",
      candidateDepartment: profile?.department || "General Department",
      startedAt: a.started_at,
      riskScore: session?.risk_score || 0,
      flags: flagsList,
    };
  });

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
                <span className="text-slate-300 font-light select-none hidden md:inline">/</span>
                <span className="text-xs text-slate-500 hidden md:inline truncate max-w-sm">
                  {settings.name}
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
        <LiveProctorHub
          candidates={candidateFeeds}
          universityName={settings.name}
          proctorName={user.fullName || "Invigilator"}
        />
      </main>
    </div>
  );
}

