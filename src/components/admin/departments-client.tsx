"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createDepartmentAction,
  updateDepartmentAction,
  deleteDepartmentAction,
} from "@/app/actions/admin";
import {
  Building2,
  PlusCircle,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Edit2,
  Trash2,
  ArrowUpRight,
  Mail,
  Users,
  GraduationCap,
  Sparkles,
} from "lucide-react";

export interface DepartmentItem {
  id: string;
  name: string;
  code?: string;
  head: string;
  contactEmail?: string;
  description?: string;
  examiners: number;
  candidates: number;
  createdAt?: string;
}

interface Props {
  initialDepartments: DepartmentItem[];
}

export function DepartmentsClient({ initialDepartments }: Props) {
  const router = useRouter();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentItem | null>(null);
  const [deletingDept, setDeletingDept] = useState<DepartmentItem | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [departments, setDepartments] = useState<DepartmentItem[]>(initialDepartments);

  // Sync state if initialDepartments changes from server revalidation
  const filteredDepts = departments.filter((d) => {
    const q = searchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      (d.code && d.code.toLowerCase().includes(q)) ||
      d.head.toLowerCase().includes(q) ||
      (d.contactEmail && d.contactEmail.toLowerCase().includes(q))
    );
  });

  const totalExaminers = departments.reduce((acc, d) => acc + d.examiners, 0);
  const totalCandidates = departments.reduce((acc, d) => acc + d.candidates, 0);

  // Handle Add Department
  async function handleCreateDepartment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const code = (formData.get("code") as string)?.toUpperCase();
    const headName = (formData.get("headName") as string) || "Not Assigned";
    const contactEmail = formData.get("contactEmail") as string;
    const description = formData.get("description") as string;

    try {
      const res = await createDepartmentAction(formData);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        const newDeptItem: DepartmentItem = {
          id: (res.data as { id?: string })?.id || `dept-${Date.now()}`,
          name,
          code: code || undefined,
          head: headName,
          contactEmail: contactEmail || undefined,
          description: description || undefined,
          examiners: 0,
          candidates: 0,
        };

        setDepartments((prev) => [newDeptItem, ...prev]);
        setSuccessMessage(`Department "${name}" created successfully.`);
        setIsAddModalOpen(false);
        router.refresh();
      }
    } catch {
      setErrorMessage("Failed to create department. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Edit Department
  async function handleUpdateDepartment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingDept) return;

    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const code = (formData.get("code") as string)?.toUpperCase();
    const headName = (formData.get("headName") as string) || "Not Assigned";
    const contactEmail = formData.get("contactEmail") as string;
    const description = formData.get("description") as string;

    try {
      const res = await updateDepartmentAction(formData);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setDepartments((prev) =>
          prev.map((d) =>
            d.id === editingDept.id
              ? {
                  ...d,
                  name,
                  code: code || undefined,
                  head: headName,
                  contactEmail: contactEmail || undefined,
                  description: description || undefined,
                }
              : d
          )
        );
        setSuccessMessage(`Department "${name}" updated successfully.`);
        setEditingDept(null);
        router.refresh();
      }
    } catch {
      setErrorMessage("Failed to update department. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Delete Department
  async function handleDeleteDepartment() {
    if (!deletingDept) return;

    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await deleteDepartmentAction(deletingDept.id);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setDepartments((prev) => prev.filter((d) => d.id !== deletingDept.id));
        setSuccessMessage(`Department "${deletingDept.name}" removed successfully.`);
        setDeletingDept(null);
        router.refresh();
      }
    } catch {
      setErrorMessage("Failed to delete department. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              Academic Organization
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
            Academic Departments
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage university departments, faculty assignments, program codes, and entrance quotas.
          </p>
        </div>

        <button
          onClick={() => {
            setIsAddModalOpen(true);
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Academic Department</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-100">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Total Departments</span>
            <span className="text-xl font-extrabold text-slate-900">{departments.length}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-100">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Assigned Faculty Staff</span>
            <span className="text-xl font-extrabold text-slate-900">{totalExaminers}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Enrolled Candidates</span>
            <span className="text-xl font-extrabold text-slate-900">{totalCandidates}</span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-700 hover:text-red-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by department name, code, Head of Department, or email..."
          className="w-full text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-slate-400 hover:text-slate-600 text-xs pr-2"
          >
            Clear
          </button>
        )}
      </div>

      {/* Departments Roster Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {filteredDepts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-5">Department / Program</th>
                  <th className="py-3 px-5">Head & Contact</th>
                  <th className="py-3 px-5 text-center">Faculty</th>
                  <th className="py-3 px-5 text-center">Candidates</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDepts.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-100 mt-0.5">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/departments/${d.id}`}
                              className="font-bold text-slate-900 hover:text-purple-700 hover:underline transition-colors flex items-center gap-1 group"
                            >
                              <span>{d.name}</span>
                              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-purple-600" />
                            </Link>
                            {d.code && (
                              <span className="px-2 py-0.5 rounded-md bg-purple-100 border border-purple-200 text-purple-800 font-extrabold text-[10px]">
                                {d.code}
                              </span>
                            )}
                          </div>
                          {d.description ? (
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 max-w-sm">
                              {d.description}
                            </p>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {d.id.slice(0, 8)}...
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <div>
                        <span className="font-semibold text-slate-900 block">{d.head}</span>
                        {d.contactEmail ? (
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {d.contactEmail}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No direct email</span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-5 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[11px]">
                        <Users className="w-3 h-3" />
                        {d.examiners} Staff
                      </span>
                    </td>

                    <td className="py-4 px-5 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-bold text-[11px]">
                        <GraduationCap className="w-3 h-3" />
                        {d.candidates} Candidates
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/departments/${d.id}`}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-semibold text-xs transition-colors inline-flex items-center gap-1"
                        >
                          <span>Manage</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>

                        <button
                          onClick={() => {
                            setEditingDept(d);
                            setErrorMessage(null);
                            setSuccessMessage(null);
                          }}
                          title="Edit Department"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setDeletingDept(d);
                            setErrorMessage(null);
                            setSuccessMessage(null);
                          }}
                          title="Delete Department"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3 border border-purple-100">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              {searchQuery ? "No matching departments found" : "No Academic Departments Registered"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No departments match "${searchQuery}". Clear your search query to see all programs.`
                : "Create university departments to organize entrance exam papers, assign faculty examiners, and admit candidate cohorts."}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create First Department</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Department Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
                  <Building2 className="w-4 h-4" />
                </div>
                <span>Create Academic Department</span>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department / Degree Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Master of Computer Applications"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Code (e.g. MCA)
                  </label>
                  <input
                    type="text"
                    name="code"
                    maxLength={15}
                    placeholder="MCA"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Head of Department / Dean
                  </label>
                  <input
                    type="text"
                    name="headName"
                    placeholder="e.g. Dr. Arthur Pendelton"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Official Department Email
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    placeholder="e.g. mca-dept@apex.edu"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Program Overview / Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Outline the disciplines, core syllabus subjects, or entrance criteria under this department..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <span>Creating...</span>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Save Department</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {editingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100">
                  <Edit2 className="w-4 h-4" />
                </div>
                <span>Edit Department: {editingDept.name}</span>
              </div>
              <button
                onClick={() => setEditingDept(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateDepartment} className="space-y-4 pt-4">
              <input type="hidden" name="id" value={editingDept.id} />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department / Degree Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingDept.name}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Code (e.g. MCA)
                  </label>
                  <input
                    type="text"
                    name="code"
                    maxLength={15}
                    defaultValue={editingDept.code || ""}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Head of Department / Dean
                  </label>
                  <input
                    type="text"
                    name="headName"
                    defaultValue={editingDept.head === "Not Assigned" ? "" : editingDept.head}
                    placeholder="e.g. Dr. Arthur Pendelton"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Official Department Email
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    defaultValue={editingDept.contactEmail || ""}
                    placeholder="e.g. mca-dept@apex.edu"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Program Overview / Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingDept.description || ""}
                  placeholder="Outline the disciplines, core syllabus subjects, or entrance criteria under this department..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Department Confirmation Dialog */}
      {deletingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Delete Academic Department</h3>
                <p className="text-xs text-slate-500">Action is irreversible per university audit rules</p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-900">{deletingDept.name}</div>
                {deletingDept.code && (
                  <div className="text-slate-500 font-mono text-[11px]">Code: {deletingDept.code}</div>
                )}
                <div className="text-slate-600">
                  Head: <span className="font-semibold">{deletingDept.head}</span>
                </div>
              </div>

              {(deletingDept.examiners > 0 || deletingDept.candidates > 0) ? (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold block">Assigned Members Detected:</span>
                    <span>
                      This department has {deletingDept.examiners} faculty examiner(s) and {deletingDept.candidates} enrolled candidate(s).
                      You must reassign them to another department before this department can be deleted.
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-600">
                  Are you sure you want to permanently delete this department? All department metadata will be purged and an audit entry recorded.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingDept(null)}
                className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteDepartment}
                disabled={isSubmitting || (deletingDept.examiners > 0 || deletingDept.candidates > 0)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "Deleting..." : "Confirm Deletion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
