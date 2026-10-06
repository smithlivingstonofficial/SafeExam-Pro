"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createDepartmentAction,
  updateDepartmentAction,
  deleteDepartmentAction,
  bulkCreateDepartmentsAction,
} from "@/app/actions/admin";
import { BulkUploadModal } from "@/components/shared/bulk-upload-modal";
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
  Upload,
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
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentItem | null>(null);
  const [deletingDept, setDeletingDept] = useState<DepartmentItem | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [departments, setDepartments] = useState<DepartmentItem[]>(initialDepartments);

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
        setSuccessMessage(`Department "${deletingDept.name}" deleted successfully.`);
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
    <div className="space-y-4 max-w-full">
      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-2xs animate-in fade-in">
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
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-700 hover:text-red-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Actions Toolbar Container */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Inner Search Input */}
        <div className="flex-1 bg-slate-50/70 border border-slate-200/80 rounded-lg px-3 py-2 flex items-center gap-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-purple-600 focus-within:border-transparent transition-all">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by department name, program code, HOD, or email..."
            className="w-full text-xs text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-slate-400 hover:text-slate-600 text-xs font-medium"
            >
              Clear
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsBulkModalOpen(true)}
            className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-purple-700" />
            <span>Bulk CSV Import</span>
          </button>

          <button
            onClick={() => {
              setIsAddModalOpen(true);
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className="px-3.5 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        </div>
      </div>

      {/* Departments Roster Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
        {filteredDepts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-700 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Department / Program</th>
                  <th className="py-3 px-4">Head & Contact</th>
                  <th className="py-3 px-4 text-center">Faculty</th>
                  <th className="py-3 px-4 text-center">Candidates</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDepts.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-100">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/departments/${d.id}`}
                              className="font-bold text-slate-900 hover:text-purple-700 transition-colors flex items-center gap-1 group"
                            >
                              <span>{d.name}</span>
                              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-purple-600" />
                            </Link>
                            {d.code && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
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

                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-semibold text-slate-800 block">{d.head}</span>
                        {d.contactEmail ? (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {d.contactEmail}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No direct email</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
                        <Users className="w-3 h-3" />
                        <span>{d.examiners} Staff</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 border border-purple-100 text-purple-700 text-xs font-semibold">
                        <GraduationCap className="w-3 h-3" />
                        <span>{d.candidates} Candidates</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/departments/${d.id}`}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 font-semibold text-xs transition-colors"
                        >
                          Manage ↗
                        </Link>
                        <button
                          onClick={() => setEditingDept(d)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                          title="Edit department"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingDept(d)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 transition-colors"
                          title="Delete department"
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
          <div className="p-10 text-center text-xs text-slate-500">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mx-auto mb-2 border border-purple-100">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="font-bold text-slate-800">No Academic Departments Found</div>
            <div className="text-slate-400 mt-0.5">
              Create your first university department using the button above.
            </div>
          </div>
        )}
      </div>

      {/* Add Department Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Building2 className="w-4 h-4 text-purple-700" />
                <span>Add Academic Department</span>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Master of Computer Applications"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Program Code (Short)
                  </label>
                  <input
                    type="text"
                    name="code"
                    placeholder="e.g. MCA"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 uppercase font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Head of Department (HOD)
                  </label>
                  <input
                    type="text"
                    name="headName"
                    placeholder="e.g. Dr. P. Livingston"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Department Contact Email
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  placeholder="e.g. hod.mca@klu.ac.in"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description / Disciplines
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Brief summary of department curricula and Ph.D research scope..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Creating..." : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {editingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Edit2 className="w-4 h-4 text-purple-700" />
                <span>Edit Academic Department</span>
              </div>
              <button
                onClick={() => setEditingDept(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateDepartment} className="space-y-4 pt-4 text-xs">
              <input type="hidden" name="id" value={editingDept.id} />

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingDept.name}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Program Code (Short)
                  </label>
                  <input
                    type="text"
                    name="code"
                    defaultValue={editingDept.code || ""}
                    placeholder="e.g. MCA"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 uppercase font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Head of Department (HOD)
                  </label>
                  <input
                    type="text"
                    name="headName"
                    defaultValue={editingDept.head === "Not Assigned" ? "" : editingDept.head}
                    placeholder="e.g. Dr. P. Livingston"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Department Contact Email
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  defaultValue={editingDept.contactEmail || ""}
                  placeholder="e.g. hod.mca@klu.ac.in"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description / Disciplines
                </label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingDept.description || ""}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 font-bold text-sm pb-3 border-b border-slate-100">
              <Trash2 className="w-5 h-5" />
              <span>Delete Academic Department</span>
            </div>

            <div className="py-4 space-y-2 text-xs">
              <p className="text-slate-700">
                Are you sure you want to delete <strong className="text-slate-900">{deletingDept.name}</strong>?
              </p>
              <p className="text-slate-500 text-[11px]">
                Faculty and candidate profiles currently tagged to this department will be unlinked.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingDept(null)}
                className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteDepartment}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Bulk Import Academic Departments"
        entityName="Academic Departments"
        description="Upload a CSV spreadsheet to create multiple university academic departments, program codes, and HOD contacts."
        templateFileName="academic_departments_template.csv"
        columns={[
          { key: "name", label: "Department Full Name", sample: "Master of Computer Applications", required: true },
          { key: "code", label: "Program Code", sample: "MCA", required: false },
          { key: "headName", label: "Head of Department", sample: "Dr. P. Livingston", required: false },
          { key: "contactEmail", label: "Department Email", sample: "hod.mca@klu.ac.in", required: false },
          { key: "description", label: "Description", sample: "Advanced Computer Applications & Computing Research", required: false },
        ]}
        validateRow={(row) => {
          const errors: string[] = [];
          const name = (row.name || row.departmentName || row.fullName || row["Department Full Name"] || row["Department Name"] || row.department || "").trim();
          const code = (row.code || row.programCode || row["Program Code"] || row["Department Code"] || "").trim().toUpperCase();
          const headName = (row.headName || row.head || row.hod || row["Head of Department"] || row["HOD Name"] || "").trim();
          const contactEmail = (row.contactEmail || row.email || row["Department Email"] || row["Contact Email"] || "").trim();
          const description = (row.description || row.desc || row["Description"] || "").trim();

          if (!name || name.length < 2) {
            errors.push("Department Name must be at least 2 characters");
          }

          return {
            isValid: errors.length === 0,
            errors,
            parsed: errors.length === 0 ? {
              name,
              code: code || undefined,
              headName: headName || undefined,
              contactEmail: contactEmail || undefined,
              description: description || undefined,
            } : undefined,
          };
        }}
        onExecuteImport={async (validItems, strategy) => {
          const res = await bulkCreateDepartmentsAction(validItems, strategy);
          return {
            success: res.success || false,
            error: res.error,
            data: res.data,
          };
        }}
        onSuccess={(result) => {
          setSuccessMessage(
            `Bulk import complete: ${result.createdCount} department(s) created, ${result.updatedCount} updated, ${result.skippedCount} skipped, ${result.failedCount} failed.`
          );
          router.refresh();
        }}
      />
    </div>
  );
}
