"use client";

import { useState } from "react";
import { createDepartmentAction } from "@/app/actions/admin";
import {
  Building2,
  PlusCircle,
  Users,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  School,
  Search,
  X,
} from "lucide-react";

export default function DepartmentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [departments, setDepartments] = useState([
    { id: "dept-1", name: "Master of Computer Applications (MCA)", head: "Dr. K. S. Rao", examiners: 14, candidates: 380 },
    { id: "dept-2", name: "Computer Science & Engineering (Ph.D)", head: "Dr. N. Ramanathan", examiners: 22, candidates: 420 },
    { id: "dept-3", name: "Information Technology & Data Science", head: "Dr. S. Mukherjee", examiners: 12, candidates: 260 },
    { id: "dept-4", name: "Electronics & Communication Engineering", head: "Dr. P. Verma", examiners: 16, candidates: 180 },
    { id: "dept-5", name: "Mathematical Sciences & Statistics", head: "Dr. A. Sengupta", examiners: 8, candidates: 95 },
    { id: "dept-6", name: "Physical Sciences & Nanotechnology", head: "Dr. V. Iyer", examiners: 9, candidates: 85 },
  ]);

  const filteredDepts = departments.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.head.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleCreateDepartment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const headName = (formData.get("headName") as string) || "Not Assigned";

    try {
      const res = await createDepartmentAction(formData);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setDepartments([
          ...departments,
          {
            id: `dept-${Date.now()}`,
            name,
            head: headName,
            examiners: 0,
            candidates: 0,
          },
        ]);
        setSuccessMessage(`Department "${name}" created successfully.`);
        setIsModalOpen(false);
      }
    } catch {
      setErrorMessage("Failed to create department. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
            Academic Organization
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Academic Departments
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize degree programs, assign department heads, and manage faculty examiner quotas.
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Academic Department</span>
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by department name or Head of Department..."
          className="w-full text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
        />
      </div>

      {/* Departments Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-5">Department / Program</th>
                <th className="py-3 px-5">Head of Department</th>
                <th className="py-3 px-5 text-center">Examiners</th>
                <th className="py-3 px-5 text-center">Enrolled Applicants</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDepts.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-100">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">{d.name}</span>
                        <span className="text-[11px] text-slate-400">ID: {d.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5 font-semibold text-slate-700">
                    {d.head}
                  </td>
                  <td className="py-4 px-5 text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[11px]">
                      {d.examiners} Staff
                    </span>
                  </td>
                  <td className="py-4 px-5 text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-bold text-[11px]">
                      {d.candidates} Candidates
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <button className="text-xs font-bold text-purple-700 hover:text-purple-800 hover:underline cursor-pointer">
                      Edit Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Department Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <School className="w-5 h-5 text-purple-700" />
                <span>New Academic Department</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Department Name / Degree Program
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Department of Cyber Security & Forensics"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Head of Department (Faculty Lead)
                </label>
                <input
                  type="text"
                  name="headName"
                  placeholder="e.g. Dr. Arthur Pendelton"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-70"
                >
                  <span>{isSubmitting ? "Creating..." : "Save Department"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
