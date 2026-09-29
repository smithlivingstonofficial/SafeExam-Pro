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

export default function UserManagementPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const [users, setUsers] = useState([
    { id: "usr-01", name: "Dr. R. Sterling", email: "admin@apex.edu", role: "admin" as UserRole, department: "Examination Board", isActive: true },
    { id: "usr-02", name: "Prof. Eleanor Vance", email: "examiner@apex.edu", role: "examiner" as UserRole, department: "Computer Applications", isActive: true },
    { id: "usr-03", name: "Dr. M. Jenkins", email: "proctor@apex.edu", role: "proctor" as UserRole, department: "Invigilation Cell", isActive: true },
    { id: "usr-04", name: "Alexander Vance", email: "candidate1@apex.edu", role: "candidate" as UserRole, department: "Computer Applications", isActive: true },
    { id: "usr-05", name: "Sophia Reynolds", email: "candidate2@apex.edu", role: "candidate" as UserRole, department: "Computer Science", isActive: true },
    { id: "usr-06", name: "Dr. A. Sengupta", email: "math.examiner@apex.edu", role: "examiner" as UserRole, department: "Mathematics", isActive: true },
    { id: "usr-07", name: "Auditor Desk", email: "auditor@apex.edu", role: "viewer" as UserRole, department: "Compliance Committee", isActive: true },
  ]);

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
          ...users,
          {
            id: `usr-${Date.now().toString().slice(-4)}`,
            name: fullName,
            email,
            role,
            department,
            isActive: true,
          },
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

  async function handleStatusToggle(userId: string, currentStatus: boolean) {
    try {
      await toggleUserStatusAction(userId, currentStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: !currentStatus } : u))
      );
      setSuccessMessage(`User status ${currentStatus ? "suspended" : "activated"}.`);
    } catch {
      setErrorMessage("Could not toggle user status.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
            Institutional Roster
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            User & Faculty Roster
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage academic examiners, proctors, administrators, and applicant admissions.
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
          <UserPlus className="w-4 h-4" />
          <span>Invite / Add Member</span>
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

      {/* Filters & Search */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, university email, or department..."
            className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
          {["all", "admin", "examiner", "proctor", "candidate", "viewer"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer ${
                roleFilter === r
                  ? "bg-purple-700 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-5">Member / Email</th>
                <th className="py-3 px-5">Academic Department</th>
                <th className="py-3 px-5">Assigned Role</th>
                <th className="py-3 px-5 text-center">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">{u.name}</span>
                        <span className="text-[11px] text-slate-400">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5 font-medium text-slate-700">
                    {u.department}
                  </td>
                  <td className="py-4 px-5">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 capitalize focus:outline-none focus:ring-1 focus:ring-purple-600"
                    >
                      <option value="admin">Admin</option>
                      <option value="examiner">Examiner</option>
                      <option value="proctor">Proctor</option>
                      <option value="candidate">Candidate</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </td>
                  <td className="py-4 px-5 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        u.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {u.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <button
                      onClick={() => handleStatusToggle(u.id, u.isActive)}
                      className={`text-xs font-bold hover:underline cursor-pointer ${
                        u.isActive ? "text-red-600" : "text-emerald-700"
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
      </div>

      {/* Invite Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-700" />
                <span>Add University Member</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  placeholder="e.g. Dr. Jennifer Clark"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  University Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="jennifer.clark@apex.edu"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Institutional Role
                </label>
                <select
                  name="role"
                  defaultValue="examiner"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="examiner">Examiner (Question Bank & Composer)</option>
                  <option value="proctor">Proctor (Live Stream Invigilator)</option>
                  <option value="candidate">Candidate (Applicant)</option>
                  <option value="viewer">Viewer (Auditor / Read-Only)</option>
                  <option value="admin">Administrator (Full Control)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Department / Unit
                </label>
                <input
                  type="text"
                  name="department"
                  placeholder="e.g. Computer Applications"
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
                  <span>{isSubmitting ? "Inviting..." : "Add Member"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
