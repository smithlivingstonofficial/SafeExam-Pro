import { Suspense } from "react";
import Link from "next/link";
import { getUniversitySettings } from "@/lib/settings";
import { LoginFormClient } from "@/components/auth/login-form-client";
import { ShieldCheck, Lock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const settings = await getUniversitySettings();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white">
      {/* University Header */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-700 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900">
                  SafeExam Pro
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">
                  University Entrance
                </span>
              </div>
              <span className="text-[11px] text-slate-500 hidden sm:inline truncate max-w-sm">
                {settings.name}
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
          <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading sign in...</div>}>
            <LoginFormClient
              institutionName={settings.name}
              allowRegistration={settings.allowCandidateRegistration}
            />
          </Suspense>

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
