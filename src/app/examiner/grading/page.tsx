import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Award,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  AlertCircle,
  BarChart3,
  Search,
} from "lucide-react";

export default async function ExaminerGradingPage() {
  const supabase = await createClient();

  // Fetch exam results
  const { data: results } = await supabase
    .from("exam_results")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch assignments, profiles, schedules, exams for decoupled joins
  const assignmentIds = results?.map((r) => r.assignment_id) || [];
  const { data: assignments } = await supabase
    .from("exam_assignments")
    .select("id, candidate_id, schedule_id")
    .in("id", assignmentIds.length ? assignmentIds : ["00000000-0000-0000-0000-000000000000"]);

  const candidateIds = assignments?.map((a) => a.candidate_id) || [];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, department")
    .in("id", candidateIds.length ? candidateIds : ["00000000-0000-0000-0000-000000000000"]);

  const scheduleIds = assignments?.map((a) => a.schedule_id) || [];
  const { data: schedules } = await supabase
    .from("exam_schedules")
    .select("id, exam_id")
    .in("id", scheduleIds.length ? scheduleIds : ["00000000-0000-0000-0000-000000000000"]);

  const examIds = schedules?.map((s) => s.exam_id) || [];
  const { data: exams } = await supabase
    .from("exams")
    .select("id, title")
    .in("id", examIds.length ? examIds : ["00000000-0000-0000-0000-000000000000"]);

  const assignmentMap = new Map((assignments || []).map((a) => [a.id, a]));
  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
  const scheduleMap = new Map((schedules || []).map((s) => [s.id, s]));
  const examMap = new Map((exams || []).map((e) => [e.id, e]));

  const totalEvaluated = results?.length || 0;
  const publishedCount =
    results?.filter((r) => r.status === "published").length || 0;
  const pendingReviewCount =
    results?.filter((r) => r.status === "draft").length || 0;

  return (
    <div className="space-y-6">
      {/* Metric Summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-xs uppercase font-bold text-slate-500 mb-1">
            Evaluated Submissions
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {totalEvaluated}
          </div>
          <div className="text-xs text-indigo-700 font-semibold mt-1">
            Across All Departments
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-xs uppercase font-bold text-slate-500 mb-1">
            Published Results
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">
            {publishedCount}
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">
            Visible to Candidates
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-xs uppercase font-bold text-slate-500 mb-1">
            Pending Faculty Review
          </div>
          <div className="text-2xl font-extrabold text-amber-700">
            {pendingReviewCount}
          </div>
          <div className="text-xs text-amber-600 font-semibold mt-1">
            Descriptive / Moderation
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Candidate Evaluation & Grade Moderation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review auto-scored objective items, grade descriptive responses, and authorize score release.
          </p>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600" />
            <span>Candidate Score Sheets</span>
          </h2>
        </div>

        {results && results.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                  <th className="p-4">Candidate</th>
                  <th className="p-4">Examination</th>
                  <th className="p-4">Score</th>
                  <th className="p-4">Percentage</th>
                  <th className="p-4">Percentile</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {results.map((res) => {
                  const assignment = assignmentMap.get(res.assignment_id);
                  const candidate = assignment ? profileMap.get(assignment.candidate_id) : null;
                  const schedule = assignment ? scheduleMap.get(assignment.schedule_id) : null;
                  const exam = schedule ? examMap.get(schedule.exam_id) : null;

                  return (
                    <tr key={res.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">
                          {candidate?.full_name || "Candidate"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {candidate?.department || "Department"}
                        </div>
                      </td>

                      <td className="p-4 text-slate-800">
                        {exam?.title || "Ph.D Entrance Assessment"}
                      </td>

                      <td className="p-4 font-extrabold text-slate-900">
                        {res.total_score} / {res.max_score}
                      </td>

                      <td className="p-4 font-bold text-indigo-700">
                        {res.percentage}%
                      </td>

                      <td className="p-4 text-slate-600">
                        {res.percentile ? `${res.percentile}th` : "—"}
                      </td>

                      <td className="p-4">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                            res.status === "published"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                              : "bg-amber-50 border-amber-200 text-amber-800"
                          }`}
                        >
                          {res.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              No Evaluation Records Yet
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Once candidates take scheduled exams, objective scores are tabulated instantly and displayed here for review.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
