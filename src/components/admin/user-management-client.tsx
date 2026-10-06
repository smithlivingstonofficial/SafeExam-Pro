"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserAction,
  updateUserRoleAction,
  toggleUserStatusAction,
  bulkCreateUsersAction,
} from "@/app/actions/admin";
import { BulkUploadModal } from "@/components/shared/bulk-upload-modal";
import {
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  PlusCircle,
  Building2,
  Upload,
} from "lucide-react";
import { UserRole } from "@/types/database";

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  isActive: boolean;
}

export interface DepartmentOption {
  id: string;
  name: string;
  code?: string | null;
}

interface Props {
  initialUsers: UserItem[];
  availableDepartments?: DepartmentOption[];
}

export function UserManagementClient({ initialUsers, availableDepartments = [] }: Props) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

  const [users, setUsers] = useState<UserItem[]>(initialUsers);

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q);
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesDept = departmentFilter === "all" || u.department === departmentFilter;
    return matchesSearch && matchesRole && matchesDept;
  });

  async function handleCreateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as UserRole;
    const department = (formData.get("department") as string) || "General";

    try {
      const res = await createUserAction(formData);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setUsers([
          {
            id: `usr-${Date.now().toString().slice(-4)}`,
            name: fullName,
            email,
            role,
            department,
            isActive: true,
          },
          ...users,
        ]);
        setSuccessMessage(`User "${fullName}" provisioned successfully with role "${role}".`);
        setIsModalOpen(false);
        router.refresh();
      }
    } catch {
      setErrorMessage("Failed to add user. Please check credentials and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: UserRole) {
    try {
      await updateUserRoleAction(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setSuccessMessage("User role updated successfully.");
    } catch {
      setErrorMessage("Could not update user role.");
    }
  }

  async function handleToggleStatus(userId: string, currentStatus: boolean) {
    try {
      await toggleUserStatusAction(userId, !currentStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: !currentStatus } : u))
      );
      setSuccessMessage(`User account ${!currentStatus ? "activated" : "suspended"}.`);
    } catch {
      setErrorMessage("Could not toggle user status.");
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
            placeholder="Search roster by name, email, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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

        {/* Filters & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Department Filter */}
          {availableDepartments.length > 0 && (
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-2.5 py-2 text-xs rounded-lg border border-slate-200/80 bg-slate-50/70 focus:bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all"
            >
              <option value="all">All Departments ({availableDepartments.length})</option>
              {availableDepartments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name} {d.code ? `(${d.code})` : ""}
                </option>
              ))}
            </select>
          )}

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-2.5 py-2 text-xs rounded-lg border border-slate-200/80 bg-slate-50/70 focus:bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all"
          >
            <option value="all">All Roles ({users.length})</option>
            <option value="admin">Administrators</option>
            <option value="examiner">Examiners</option>
            <option value="proctor">Proctors</option>
            <option value="candidate">Candidates</option>
            <option value="viewer">Viewers</option>
          </select>

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
              setIsModalOpen(true);
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className="px-3.5 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Users Roster Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
        {filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-700 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">User Details</th>
                  <th className="py-3 px-4">Academic Department</th>
                  <th className="py-3 px-4">System Role</th>
                  <th className="py-3 px-4 text-center">Account Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0 border border-purple-100">
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{u.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono block mt-0.5">{u.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{u.department}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border cursor-pointer transition-all shadow-2xs focus:outline-none focus:ring-2 focus:ring-purple-600 ${
                          u.role === "admin"
                            ? "bg-purple-50 border-purple-200 text-purple-800"
                            : u.role === "examiner"
                            ? "bg-indigo-50 border-indigo-200 text-indigo-800"
                            : u.role === "proctor"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : u.role === "candidate"
                            ? "bg-sky-50 border-sky-200 text-sky-800"
                            : "bg-slate-100 border-slate-200 text-slate-700"
                        }`}
                      >
                        <option value="admin">Administrator</option>
                        <option value="examiner">Examiner</option>
                        <option value="proctor">Proctor</option>
                        <option value="candidate">Candidate</option>
                        <option value="viewer">Viewer (Auditor)</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded border ${
                          u.isActive
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-red-50 border-red-200 text-red-700"
                        }`}
                      >
                        {u.isActive ? "Active" : "Suspended"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(u.id, u.isActive)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer shadow-2xs ${
                          u.isActive
                            ? "border-slate-200 bg-white text-slate-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {u.isActive ? "Suspend" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-xs text-slate-500">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mx-auto mb-2 border border-purple-100">
              <Users className="w-5 h-5" />
            </div>
            <div className="font-bold text-slate-800">
              {searchQuery || roleFilter !== "all" || departmentFilter !== "all"
                ? "No matching users found"
                : "No Institutional Users Found"}
            </div>
            <div className="text-slate-400 mt-0.5">
              {searchQuery || roleFilter !== "all" || departmentFilter !== "all"
                ? "Clear your search or filters to see all faculty and staff."
                : "Add examiners, proctors, or staff using the toolbar above."}
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <PlusCircle className="w-4 h-4 text-purple-700" />
                <span>Add Institutional User Account</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  placeholder="e.g. Dr. Arthur Pendelton"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  University Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="e.g. faculty@university.edu"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Initial Password *
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={8}
                  placeholder="Min 8 characters"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    System Access Role *
                  </label>
                  <select
                    name="role"
                    required
                    defaultValue="examiner"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 font-medium"
                  >
                    <option value="examiner">Examiner</option>
                    <option value="proctor">Proctor</option>
                    <option value="candidate">Candidate</option>
                    <option value="viewer">Viewer (Auditor)</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  {availableDepartments && availableDepartments.length > 0 ? (
                    <select
                      name="department"
                      defaultValue=""
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 font-medium"
                    >
                      <option value="">General / None Assigned</option>
                      {availableDepartments.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name} {d.code ? `(${d.code})` : ""}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="department"
                      placeholder="e.g. Computer Science"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 font-medium"
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Provisioning..." : "Provision Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Universal Bulk CSV Import Modal */}
      <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Bulk Import Faculty & Staff"
        entityName="Staff Roster"
        description="Upload a CSV spreadsheet to provision faculty examiners, proctors, and university staff accounts in bulk."
        templateFileName="university_staff_roster_template.csv"
        columns={[
          { key: "fullName", label: "Full Name", sample: "Prof. Ananya Sundaram", required: true },
          { key: "email", label: "Institutional Email", sample: "ananya.s@klu.ac.in", required: true },
          { key: "role", label: "Access Role", sample: "examiner", required: true, description: "examiner, proctor, viewer, admin, candidate" },
          { key: "department", label: "Department / Discipline", sample: "MCA", required: false },
          { key: "phone", label: "Phone Number", sample: "+91 98401 23456", required: false },
          { key: "temporaryPassword", label: "Initial Password", sample: "Faculty@2026", required: false },
        ]}
        validateRow={(row) => {
          const errors: string[] = [];
          const fullName = row.fullName?.trim() || "";
          const email = row.email?.trim()?.toLowerCase() || "";
          const rawRole = (row.role?.trim()?.toLowerCase() || "examiner") as UserRole;
          const department = row.department?.trim() || "";
          const phone = row.phone?.trim() || "";
          const temporaryPassword = row.temporaryPassword?.trim() || "";

          if (!fullName || fullName.length < 2) {
            errors.push("Full Name must be at least 2 characters");
          }
          if (!email || !email.includes("@") || !email.includes(".")) {
            errors.push("Valid institutional email address is required");
          }
          const validRoles: UserRole[] = ["admin", "examiner", "proctor", "candidate", "viewer"];
          if (!validRoles.includes(rawRole)) {
            errors.push(`Invalid role "${row.role}". Must be one of: admin, examiner, proctor, viewer, candidate`);
          }

          return {
            isValid: errors.length === 0,
            errors,
            parsed: errors.length === 0 ? {
              fullName,
              email,
              role: rawRole,
              department: department || undefined,
              phone: phone || undefined,
              temporaryPassword: temporaryPassword || undefined,
            } : undefined,
          };
        }}
        onExecuteImport={async (validItems, strategy) => {
          const res = await bulkCreateUsersAction(validItems, strategy);
          return {
            success: res.success || false,
            error: res.error,
            data: res.data,
          };
        }}
        onSuccess={(result) => {
          setSuccessMessage(
            `Bulk import complete: ${result.createdCount} user(s) created, ${result.updatedCount} updated, ${result.skippedCount} skipped, ${result.failedCount} failed.`
          );
          router.refresh();
        }}
      />
    </div>
  );
}
