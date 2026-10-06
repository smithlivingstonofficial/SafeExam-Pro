"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createQuestionBankAction, deleteQuestionBankAction } from "@/app/actions/examiner";
import {
  BookOpen,
  PlusCircle,
  Globe,
  Building2,
  ArrowRight,
  Search,
  X,
  LayoutList,
  LayoutGrid,
  Layers,
  FolderPlus,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";

interface BankItem {
  id: string;
  name: string;
  description: string | null;
  is_common: boolean;
  department_id: string | null;
  created_at: string;
}

interface Department {
  id: string;
  name: string;
  code: string | null;
}

interface QuestionBankManagerProps {
  banks: BankItem[];
  departments: Department[];
  questionCountMap: Record<string, number>;
  totalQuestions: number;
  totalCommonQuestions: number;
  totalDeptQuestions: number;
}

export function QuestionBankManager({
  banks: initialBanks,
  departments,
  questionCountMap,
  totalQuestions,
  totalCommonQuestions,
  totalDeptQuestions,
}: QuestionBankManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [banks, setBanks] = useState<BankItem[]>(initialBanks);
  const [searchQuery, setSearchQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState<"all" | "universal" | "department">("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Create Bank Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [bankName, setBankName] = useState("");
  const [bankScope, setBankScope] = useState<"common" | "department_specific">("common");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [bankDescription, setBankDescription] = useState("");

  // Delete Bank State
  const [bankToDelete, setBankToDelete] = useState<BankItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Feedback Notifications
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const deptMap = useMemo(() => new Map(departments.map((d) => [d.id, d])), [departments]);

  const [departmentFilter, setDepartmentFilter] = useState("all");

  // Statistics
  const universalBanksCount = banks.filter((b) => b.is_common !== false).length;
  const deptBanksCount = banks.filter((b) => b.is_common === false).length;

  // Filtered Banks
  const filteredBanks = useMemo(() => {
    return banks.filter((bank) => {
      const boundDept = bank.department_id ? deptMap.get(bank.department_id) : null;
      const deptName = boundDept ? `${boundDept.name} ${boundDept.code || ""}` : "";
      const matchesSearch =
        bank.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (bank.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        deptName.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (scopeFilter === "universal" && bank.is_common === false) return false;
      if (scopeFilter === "department" && bank.is_common !== false) return false;
      if (departmentFilter !== "all" && bank.department_id !== departmentFilter) return false;
      return true;
    });
  }, [banks, searchQuery, scopeFilter, departmentFilter, deptMap]);

  const handleCreateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim()) return;

    const formData = new FormData();
    formData.append("name", bankName.trim());
    formData.append("scope", bankScope);
    if (bankScope === "department_specific" && selectedDeptId) {
      formData.append("departmentId", selectedDeptId);
    }
    if (bankDescription.trim()) {
      formData.append("description", bankDescription.trim());
    }

    startTransition(async () => {
      const res = await createQuestionBankAction(formData);
      if (res.success) {
        setIsCreateModalOpen(false);
        setBankName("");
        setBankDescription("");
        setBankScope("common");
        setSelectedDeptId("");
        setSuccessMessage(`Successfully created question repository "${bankName}".`);
        router.refresh();
      } else {
        setErrorMessage(res.error || "Failed to create question bank");
      }
    });
  };

  const handleDeleteBank = async () => {
    if (!bankToDelete) return;
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      const res = await deleteQuestionBankAction(bankToDelete.id);
      if (res.success) {
        const deletedName = bankToDelete.name;
        setBanks((prev) => prev.filter((b) => b.id !== bankToDelete.id));
        setSuccessMessage(`Successfully deleted question repository "${deletedName}".`);
        setBankToDelete(null);
        router.refresh();
      } else {
        setErrorMessage(res.error || "Failed to delete question repository");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "An unexpected error occurred while deleting.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-full">
      {/* Toast Notification */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between text-xs shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1 rounded hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 flex items-center justify-between text-xs shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-900 p-1 rounded hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4 Clean Metric Cards (Above Search Toolbar) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Repositories */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500">
              Repositories
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {banks.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Total item banks
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Total Questions */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500">
              Total Questions
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {totalQuestions}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {totalCommonQuestions} Universal • {totalDeptQuestions} Dept
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Academic Scope */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500">
              Academic Scope
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {departments.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Configured departments
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4: Bank Distribution */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500">
              Bank Distribution
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {universalBanksCount} / {deptBanksCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {universalBanksCount} Universal • {deptBanksCount} Dept
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Actions Toolbar Container */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Inner Search Input */}
        <div className="flex-1 bg-slate-50/70 border border-slate-200/80 rounded-lg px-3 py-2 flex items-center gap-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-600 focus-within:border-transparent transition-all">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search question banks by title, syllabus notes, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-slate-400 hover:text-slate-600 text-xs font-medium cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Department Filter (if applicable) */}
          {departments.length > 0 && (
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-2.5 py-2 text-xs rounded-lg border border-slate-200/80 bg-slate-50/70 focus:bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all cursor-pointer"
            >
              <option value="all">All Departments ({departments.length})</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.code ? `(${d.code})` : ""}
                </option>
              ))}
            </select>
          )}

          {/* Scope Filter */}
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value as "all" | "universal" | "department")}
            className="px-2.5 py-2 text-xs rounded-lg border border-slate-200/80 bg-slate-50/70 focus:bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all cursor-pointer"
          >
            <option value="all">All Scopes ({banks.length})</option>
            <option value="universal">Universal Common ({universalBanksCount})</option>
            <option value="department">Department-Bound ({deptBanksCount})</option>
          </select>

          {/* Create Bank CTA */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Question Bank</span>
          </button>
        </div>
      </div>

      {/* Question Banks Roster Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
        {filteredBanks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-700 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Repository Title & Description</th>
                  <th className="py-3 px-4 w-44">Academic Scope</th>
                  <th className="py-3 px-4 w-32">Questions</th>
                  <th className="py-3 px-4 w-32">Added Date</th>
                  <th className="py-3 px-4 text-right w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBanks.map((bank) => {
                  const count = questionCountMap[bank.id] || 0;
                  const isBankCommon = bank.is_common !== false;
                  const boundDept = bank.department_id ? deptMap.get(bank.department_id) : null;

                  return (
                    <tr key={bank.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Title & Description */}
                      <td className="py-3.5 px-4 min-w-[240px]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-100">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div>
                            <Link
                              href={`/examiner/banks/${bank.id}`}
                              className="font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1"
                            >
                              {bank.name}
                            </Link>
                            <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 max-w-md">
                              {bank.description || "No syllabus notes documented."}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Scope */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isBankCommon ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                            <Globe className="w-3 h-3 text-indigo-500" />
                            <span>Universal Common</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/80">
                            <Building2 className="w-3 h-3 text-purple-500" />
                            <span>{boundDept?.code || boundDept?.name || "Dept Bound"}</span>
                          </span>
                        )}
                      </td>

                      {/* Questions Count */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {count} {count === 1 ? "Item" : "Items"}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-medium">
                        {new Date(bank.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/examiner/banks/${bank.id}`}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-semibold text-xs transition-colors inline-flex items-center gap-1"
                          >
                            <span>Manage Items</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setBankToDelete(bank);
                              setErrorMessage(null);
                            }}
                            title="Delete Question Bank"
                            className="p-1 rounded-lg border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty State */
          <div className="p-8 text-center">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-2.5">
              <FolderPlus className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              No Matching Question Banks
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || scopeFilter !== "all" || departmentFilter !== "all"
                ? "No repositories found matching your filter criteria. Try adjusting or clearing filters."
                : "No question banks registered yet. Create your first repository to start organizing entrance examination questions."}
            </p>
            <div className="mt-3.5 flex items-center justify-center gap-2">
              {searchQuery || scopeFilter !== "all" || departmentFilter !== "all" ? (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setScopeFilter("all");
                    setDepartmentFilter("all");
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>New Question Bank</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New Question Bank Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Create Question Bank</h3>
                  <p className="text-[11px] text-slate-500">Define a new subject or domain repository.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBank} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bank Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. Advanced Algorithms (CS-902)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50/70 focus:bg-white text-slate-900 placeholder:text-slate-400 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Academic Scope Binding
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBankScope("common");
                      setSelectedDeptId("");
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center gap-2 ${
                      bankScope === "common"
                        ? "bg-indigo-50 border-indigo-300 text-indigo-950 font-bold shadow-2xs"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                    }`}
                  >
                    <Globe className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <div>Universal Common</div>
                      <div className="text-[10px] text-slate-400 font-normal">All departments</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBankScope("department_specific");
                      if (departments.length > 0 && !selectedDeptId) {
                        setSelectedDeptId(departments[0].id);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center gap-2 ${
                      bankScope === "department_specific"
                        ? "bg-purple-50 border-purple-300 text-purple-950 font-bold shadow-2xs"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
                    <div>
                      <div>Department Specific</div>
                      <div className="text-[10px] text-slate-400 font-normal">Bound to a dept</div>
                    </div>
                  </button>
                </div>

                {bankScope === "department_specific" && (
                  <div className="animate-in fade-in duration-150">
                    <select
                      value={selectedDeptId}
                      onChange={(e) => setSelectedDeptId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white text-slate-900 font-medium shadow-2xs"
                    >
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name} {dept.code ? `(${dept.code})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description & Syllabus Scope
                </label>
                <textarea
                  rows={3}
                  value={bankDescription}
                  onChange={(e) => setBankDescription(e.target.value)}
                  placeholder="e.g. Graph theory, algorithmic complexity, dynamic programming..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50/70 focus:bg-white text-slate-900 placeholder:text-slate-400 shadow-2xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !bankName.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Creating..." : "Create Repository"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Question Bank Confirmation Modal */}
      {bankToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Delete Question Bank</h3>
                  <p className="text-[11px] text-slate-500">Permanent removal of repository</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBankToDelete(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-700 leading-relaxed">
                Are you sure you want to permanently delete <strong className="font-bold text-slate-900">{bankToDelete.name}</strong>?
              </p>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] space-y-1">
                  <span className="font-bold">Caution:</span>
                  <p>
                    This repository currently contains{" "}
                    <strong className="font-bold text-slate-900">
                      {questionCountMap[bankToDelete.id] || 0} question(s)
                    </strong>
                    . Deleting this repository will permanently delete all its questions from the database.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setBankToDelete(null)}
                disabled={isDeleting}
                className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-white text-slate-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBank}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Repository</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
