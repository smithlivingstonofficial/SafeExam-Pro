"use client";

import { useState } from "react";
import { createDepartmentAction } from "@/app/actions/admin";
import {
  Building2,
  PlusCircle,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

export interface DepartmentItem {
  id: string;
  name: string;
  head: string;
  examiners: number;
  candidates: number;
}

interface Props {
  initialDepartments: DepartmentItem[];
}

export function DepartmentsClient({ initialDepartments }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [departments, setDepartments] = useState<DepartmentItem[]>(initialDepartments);

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
          {
            id: `dept-${Date.now()}`,
            name,
            head: headName,
            examiners: 0,
            candidates: 0,
          },
          ...departments,
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
        {filteredDepts.length > 0 ? (
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
                          <span className="text-[11px] text-slate-400 font-mono">ID: {d.id}</span>
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
                      <span className="text-xs font-bold text-purple-700">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              No Academic Departments Registered
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create university departments to organize courses, examiners, and entrance applicants.
            </p>
          </div>
        )}
      </div>

      {/* Add Department Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Building2 className="w-4 h-4 text-purple-700" />
                <span>Create Academic Department</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Master of Computer Applications (MCA)"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Head of Department / Dean
                </label>
                <input
                  type="text"
                  name="headName"
                  placeholder="e.g. Dr. Arthur Pendelton"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Save Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
