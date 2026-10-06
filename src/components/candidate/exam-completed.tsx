"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ShieldCheck,
  Calendar,
  Clock,
  ArrowRight,
  Download,
  FileText,
  User,
  LogOut,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

interface ExamCompletedProps {
  examTitle: string;
  candidateName: string;
  candidateEmail: string;
  assignmentId: string;
  submittedAt?: string | null;
  universityName: string;
}

export function ExamCompleted({
  examTitle,
  candidateName,
  candidateEmail,
  assignmentId,
  submittedAt,
  universityName,
}: ExamCompletedProps) {
  const submitDate = submittedAt ? new Date(submittedAt) : new Date();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).safeExamDesktop) {
      setIsDesktop(true);
      (window as any).safeExamDesktop.setExamState(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="max-w-xl w-full bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-extrabold px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800">
            Submission Confirmed &amp; Archived
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight pt-2">
            Examination Completed
          </h1>
          <p className="text-xs text-slate-500">
            {universityName}
          </p>
        </div>

        {/* Submission Details Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left text-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Exam Blueprint</span>
            <span className="font-extrabold text-slate-900">{examTitle}</span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Candidate Name</span>
            <span className="font-bold text-slate-800">{candidateName}</span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Candidate Email</span>
            <span className="font-mono text-slate-700">{candidateEmail}</span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Submission Timestamp</span>
            <span className="font-semibold text-slate-800">
              {submitDate.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Reference Docket</span>
            <span className="font-mono text-[11px] text-indigo-700 font-bold">
              {assignmentId.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Informational Notice */}
        <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 text-indigo-950 text-xs text-left leading-relaxed flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
          <span>
            Your responses and proctoring log have been synchronized with the university examination server. Objective marks have been processed, and final merit rankings will be released post faculty board verification.
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {isDesktop ? (
            <button
              type="button"
              onClick={() => (window as any).safeExamDesktop?.exitApp()}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-black text-white font-extrabold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Safe Browser</span>
            </button>
          ) : (
            <Link
              href="/candidate"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>Return to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}

          <form action={logoutAction} className="w-full sm:w-auto">
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
