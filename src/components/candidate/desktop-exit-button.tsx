"use client";

import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";

export function DesktopExitButton({ className }: { className?: string }) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !!(window as any).safeExamDesktop) {
      setIsDesktop(true);
      // Ensure exam state is unlocked whenever exit button is available
      (window as any).safeExamDesktop.setExamState(false);
    }
  }, []);

  if (!isDesktop) return null;

  return (
    <button
      type="button"
      onClick={() => (window as any).safeExamDesktop?.exitApp()}
      className={
        className ||
        "text-xs font-bold px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 flex items-center gap-1.5 transition-colors cursor-pointer"
      }
      title="Exit SafeExam Pro Lockdown Client"
    >
      <LogOut className="w-3.5 h-3.5 text-rose-600" />
      <span>Exit Safe Browser</span>
    </button>
  );
}
