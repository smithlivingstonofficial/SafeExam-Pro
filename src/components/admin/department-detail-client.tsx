"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  ArrowLeft,
  Mail,
  Shield,
  Calendar,
  FileQuestion,
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
} from "lucide-react";
import { UserRole } from "@/types/database";

export interface DepartmentProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  department: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface DepartmentExam {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  creatorName?: string;
}

export interface DepartmentQuestionBank {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  creatorName?: string;
}

interface Props {
  department: {
    id: string;
    name: string;
    code: string | null;
    headName: string | null;
    contactEmail: string | null;
    description: string | null;
    createdAt: string;
  };
  faculty: DepartmentProfile[];
  candidates: DepartmentProfile[];
  exams: DepartmentExam[];
  questionBanks: DepartmentQuestionBank[];
}

export function DepartmentDetailClient({
  department,
  faculty,
  candidates,
  exams,
  questionBanks,
}: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "faculty" | "candidates" | "exams">("overview");
  const [facultySearch, setFacultySearch] = useState("");
  const [candidateSearch, setCandidateSearch] = useState("");

  const filteredFaculty = faculty.filter(
    (f) =>
      f.fullName.toLowerCase().includes(facultySearch.toLowerCase()) ||
      f.email.toLowerCase().includes(facultySearch.toLowerCase()) ||
      f.role.toLowerCase().includes(facultySearch.toLowerCase())
  );

  const filteredCandidates = candidates.filter(
    (c) =>
      c.fullName.toLowerCase().includes(candidateSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(candidateSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/admin/departments"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-purple-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Departments</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/users"
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Manage Users Roster</span>
          </Link>
        </div>
      </div>

      {/* Department Hero Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-100 mt-1">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {department.name}
                </h1>
                {department.code && (
                  <span className="px-2.5 py-1 rounded-lg bg-purple-100 border border-purple-200 text-purple-900 font-extrabold text-xs tracking-wider font-mono">
                    {department.code}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
                {department.description || "Academic program unit under university examination jurisdiction."}
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-purple-600" />
                  <span className="font-semibold text-slate-800">
                    HOD: {department.headName || "Not Designated"}
                  </span>
                </div>
                {department.contactEmail && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>{department.contactEmail}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Established {new Date(department.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 mt-8 -mb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 px-3 text-xs font-bold transition-all relative whitespace-nowrap cursor-pointer ${
              activeTab === "overview"
                ? "text-purple-700 border-b-2 border-purple-700 font-extrabold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Overview & Metrics
          </button>

          <button
            onClick={() => setActiveTab("faculty")}
            className={`pb-3 px-3 text-xs font-bold transition-all relative whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === "faculty"
                ? "text-purple-700 border-b-2 border-purple-700 font-extrabold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Assigned Faculty</span>
            <span className="px-1.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px]">
              {faculty.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("candidates")}
            className={`pb-3 px-3 text-xs font-bold transition-all relative whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === "candidates"
                ? "text-purple-700 border-b-2 border-purple-700 font-extrabold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Enrolled Candidates</span>
            <span className="px-1.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px]">
              {candidates.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("exams")}
            className={`pb-3 px-3 text-xs font-bold transition-all relative whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === "exams"
                ? "text-purple-700 border-b-2 border-purple-700 font-extrabold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Exams & Question Banks</span>
            <span className="px-1.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[10px]">
              {exams.length + questionBanks.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Faculty Staff</span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-2">{faculty.length}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Examiners & Proctors</p>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Enrolled Candidates</span>
                <GraduationCap className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-2">{candidates.length}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Applied to this program</p>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Examinations</span>
                <BookOpen className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-2">{exams.length}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Active or drafted papers</p>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Question Banks</span>
                <FileQuestion className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-2">{questionBanks.length}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Discipline question pools</p>
            </div>
          </div>

          {/* Department Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Building2 className="w-4 h-4 text-purple-700" />
                <h3 className="text-sm font-bold text-slate-900">Academic Leadership & Scope</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Head of Department / Program Chair</span>
                  <span className="font-bold text-slate-800 text-sm">{department.headName || "Not Assigned"}</span>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Department Code / Prefix</span>
                  <span className="font-mono font-bold text-slate-800 text-xs">
                    {department.code ? department.code : "None registered"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Departmental Contact Email</span>
                  <span className="font-medium text-slate-800">
                    {department.contactEmail || "No departmental email on file"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Shield className="w-4 h-4 text-purple-700" />
                <h3 className="text-sm font-bold text-slate-900">Entrance & Evaluation Guidelines</h3>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Candidates applying under this department are evaluated according to university syllabus
                specifications. Faculty examiners assigned to this department prepare question banks and
                supervise test sessions through SafeExam Pro lockdown browser protocol.
              </p>

              <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 text-xs text-purple-900">
                <div className="font-bold mb-0.5">Department ID</div>
                <div className="font-mono text-[11px] text-purple-700 break-all">{department.id}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Assigned Faculty */}
      {activeTab === "faculty" && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-slate-400 ml-2" />
              <input
                type="text"
                value={facultySearch}
                onChange={(e) => setFacultySearch(e.target.value)}
                placeholder="Search faculty by name, email, or role..."
                className="w-full text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
              />
            </div>
            <Link
              href="/admin/users"
              className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all shrink-0 inline-flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Assign New Faculty</span>
            </Link>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            {filteredFaculty.length > 0 ? (
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-5">Faculty Member</th>
                    <th className="py-3 px-5">Role</th>
                    <th className="py-3 px-5 text-center">Status</th>
                    <th className="py-3 px-5 text-right">Appointed Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFaculty.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {f.fullName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{f.fullName}</span>
                            <span className="text-[11px] text-slate-400">{f.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-5">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10px] capitalize">
                          {f.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            f.isActive
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : "bg-red-50 border-red-200 text-red-700"
                          }`}
                        >
                          {f.isActive ? "Active" : "Suspended"}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-right text-slate-400">
                        {new Date(f.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-10 text-center">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-800">No Faculty Assigned</h4>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                  Assign examiners or proctors to &quot;{department.name}&quot; in the Institutional Users roster.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Enrolled Candidates */}
      {activeTab === "candidates" && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-slate-400 ml-2" />
              <input
                type="text"
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
                placeholder="Search candidates by name or email..."
                className="w-full text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
              />
            </div>
            <Link
              href="/admin/students"
              className="px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all shrink-0 inline-flex items-center gap-1.5"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Allocate to Exam Session</span>
            </Link>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            {filteredCandidates.length > 0 ? (
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-5">Candidate Name</th>
                    <th className="py-3 px-5">Email Address</th>
                    <th className="py-3 px-5 text-center">Account Status</th>
                    <th className="py-3 px-5 text-right">Enrolled Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCandidates.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {c.fullName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{c.fullName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {c.id.slice(0, 8)}...</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-5 font-medium text-slate-700">{c.email}</td>

                      <td className="py-3.5 px-5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            c.isActive
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : "bg-red-50 border-red-200 text-red-700"
                          }`}
                        >
                          {c.isActive ? "Active" : "Suspended"}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-right text-slate-400">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-10 text-center">
                <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-800">No Candidates Enrolled</h4>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                  Candidates who register for entrance examinations under &quot;{department.name}&quot; will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Exams & Question Banks */}
      {activeTab === "exams" && (
        <div className="space-y-6">
          {/* Question Banks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileQuestion className="w-4 h-4 text-purple-700" />
                <h3 className="text-sm font-bold text-slate-900">Question Banks</h3>
              </div>
              <Link
                href="/admin/question-banks"
                className="text-xs font-bold text-purple-700 hover:underline inline-flex items-center gap-1"
              >
                <span>All Question Banks</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              {questionBanks.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {questionBanks.map((qb) => (
                    <div key={qb.id} className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">{qb.name}</span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {qb.description || "General syllabus question bank"}
                        </span>
                        {qb.creatorName && (
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            Prepared by: {qb.creatorName}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(qb.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <FileQuestion className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No question banks currently linked to department faculty.</p>
                </div>
              )}
            </div>
          </div>

          {/* Examinations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-700" />
                <h3 className="text-sm font-bold text-slate-900">Department Examinations</h3>
              </div>
              <Link
                href="/admin/exams"
                className="text-xs font-bold text-purple-700 hover:underline inline-flex items-center gap-1"
              >
                <span>All Examinations</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              {exams.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {exams.map((ex) => (
                    <div key={ex.id} className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">{ex.title}</span>
                        {ex.creatorName && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Created by: {ex.creatorName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10px] uppercase">
                          {ex.status}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(ex.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No entrance examinations currently registered under this department.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
