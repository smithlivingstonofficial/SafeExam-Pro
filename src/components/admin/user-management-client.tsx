"use client";

import { useState } from "react";
import {
  createUserAction,
  updateUserRoleAction,
  toggleUserStatusAction,
} from "@/app/actions/admin";
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  AlertCircle,
  Shield,
  Briefcase,
  X,
  Mail,
  User,
  Filter,
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const [users, setUsers] = useState<UserItem[]>(initialUsers);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
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
        setSuccessMessage(`User "${fullName}" added successfully with role "${role}".`);
        setIsModalOpen(false);
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
      setSuccessMessage(`User account ${!currentStatus ? "activated" : "deactivated"}.`);
    } catch {
      setErrorMessage("Could not toggle user status.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Institutional User Roster & RBAC
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage authenticated accounts, assign system access tiers, and control active credentials.
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add University User</span>
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-700 hover:text-red-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search roster by name, email, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 placeholder:text-slate-400 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-700 shadow-2xs"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="examiner">Examiners</option>
            <option value="proctor">Proctors</option>
            <option value="candidate">Candidates</option>
            <option value="viewer">Viewers</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                  <th className="p-4">User</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Assigned Role</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>

                    <td className="p-4 text-slate-600">
                      {u.department}
                    </td>

                    <td className="p-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full border cursor-pointer ${
                          u.role === "admin"
                            ? "bg-purple-50 border-purple-200 text-purple-700"
                            : u.role === "examiner"
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                            : u.role === "proctor"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-blue-50 border-blue-200 text-blue-700"
                        }`}
                      >
                        <option value="admin">Admin</option>
                        <option value="examiner">Examiner</option>
                        <option value="proctor">Proctor</option>
                        <option value="candidate">Candidate</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </td>

                    <td className="p-4">
                      <span
                        className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full border ${
                          u.isActive
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-red-50 border-red-200 text-red-700"
                        }`}
                      >
                        {u.isActive ? "Active" : "Suspended"}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(u.id, u.isActive)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                          u.isActive
                            ? "border-red-200 text-red-600 hover:bg-red-50"
                            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
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
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              No Users in Roster
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are no registered users matching your criteria. Add new examiners, proctors, or candidates using the button above.
            </p>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <UserPlus className="w-4 h-4 text-purple-700" />
                <span>Add Institutional User</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  placeholder="e.g. Dr. Arthur Pendelton"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  University Email *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="e.g. arthur@apex.edu"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Password *
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="Set minimum 8 character password"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    System Role *
                  </label>
                  <select
                    name="role"
                    required
                    defaultValue="examiner"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900"
                  >
                    <option value="examiner">Examiner</option>
                    <option value="proctor">Proctor</option>
                    <option value="candidate">Candidate</option>
                    <option value="viewer">Viewer (Auditor)</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  {availableDepartments && availableDepartments.length > 0 ? (
                    <select
                      name="department"
                      defaultValue=""
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900"
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
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900"
                    />
                  )}
                </div>
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
                  {isSubmitting ? "Provisioning..." : "Provision Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
