"use client";

import { useState } from "react";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import {
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  School,
  AlertCircle,
  Users,
  Briefcase,
  Eye,
  EyeOff,
} from "lucide-react";
import { UserRole } from "@/types/database";

export default function LoginPage() {
  const [roleCategory, setRoleCategory] = useState<"candidate" | "staff">("candidate");
  const [selectedStaffRole, setSelectedStaffRole] = useState<UserRole>("examiner");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const assignedRole = roleCategory === "candidate" ? "candidate" : selectedStaffRole;
    formData.set("role", assignedRole);

    try {
      const response = await loginAction(formData);
      if (response?.error) {
        setErrorMessage(response.error);
        setIsLoading(false);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
        return; // Redirecting to authorized portal
      }
      setErrorMessage("Authentication failed. Please verify your credentials and try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* University Header */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900">
                SafeExam Pro
              </span>
              <span className="ml-2 text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
                University Entrance
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Login Card Section */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-700 mb-3 border border-blue-100">
                <School className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Apex State University
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Entrance Examination & Institutional Access Gateway
              </p>
            </div>

            {/* Role Category Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6 border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setRoleCategory("candidate");
                  setErrorMessage(null);
                }}
                className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  roleCategory === "candidate"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Candidate Portal</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRoleCategory("staff");
                  setErrorMessage(null);
                }}
                className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  roleCategory === "staff"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Faculty & Admin</span>
              </button>
            </div>

            {/* Staff Sub-Role Selector if Staff is active */}
            {roleCategory === "staff" && (
              <div className="mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <label className="block text-[11px] uppercase font-bold text-slate-500 mb-1.5">
                  Select Staff Access Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["examiner", "proctor", "admin"] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedStaffRole(r)}
                      className={`py-1.5 text-xs font-semibold rounded-lg capitalize border cursor-pointer transition-all ${
                        selectedStaffRole === r
                          ? "bg-blue-700 text-white border-blue-700 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error Alert */}
            {errorMessage && (
              <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* High-Security Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  University / Registered Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder={
                      roleCategory === "candidate"
                        ? "candidate@example.com"
                        : "admin@apex.edu"
                    }
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 font-bold text-sm text-white shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                <span>{isLoading ? "Authenticating..." : "Sign In"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Candidate Registration Link */}
            <div className="mt-6 text-center text-xs text-slate-500 pt-4 border-t border-slate-100">
              New entrance exam candidate?{" "}
              <Link href="/register" className="font-bold text-blue-700 hover:underline">
                Register Candidate Account
              </Link>
            </div>
          </div>

          {/* Security Indicator */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Encrypted with Argon2/Bcrypt • SafeExam Security Protocol</span>
          </div>
        </div>
      </main>
    </div>
  );
}
