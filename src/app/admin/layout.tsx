import { AdminSidebar } from "@/components/admin/admin-nav";
import { requireRole } from "@/lib/auth/rbac";
import { ShieldCheck } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforce server-side RBAC: Only admin role permitted
  await requireRole(["admin"]);
  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 selection:bg-purple-600 selection:text-white">
      {/* Fixed Admin Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Institution:
            </span>
            <span className="text-xs font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              Apex State University (Main Campus)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Exam System Healthy</span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
