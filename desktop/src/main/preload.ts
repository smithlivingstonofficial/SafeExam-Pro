import { contextBridge, ipcRenderer } from "electron";

export interface SafeExamDesktopAPI {
  runDiagnostics: () => Promise<{
    singleDisplay: boolean;
    displayCount: number;
    cleanProcesses: boolean;
    detectedInfractions: Array<{ name: string; category: string; description: string; detectedAt: string }>;
    hardwareId: string;
    token: string;
  }>;
  launchExamSession: (examUrl: string) => Promise<boolean>;
  exitApp: (force?: boolean) => void;
  setExamState: (isLive: boolean) => void;
  getExamState: () => Promise<boolean>;
  onSecurityAlert: (callback: (infractions: any[]) => void) => void;
}

let isCurrentExamLive = false;

contextBridge.exposeInMainWorld("safeExamDesktop", {
  runDiagnostics: () => ipcRenderer.invoke("run-diagnostics"),
  launchExamSession: (examUrl: string) => ipcRenderer.invoke("launch-exam", examUrl),
  exitApp: (force?: boolean) => ipcRenderer.send("exit-app", force),
  setExamState: (isLive: boolean) => {
    isCurrentExamLive = !!isLive;
    ipcRenderer.send("set-exam-state", isLive);
    updateTopBarState(isLive);
  },
  getExamState: () => ipcRenderer.invoke("get-exam-state"),
  onSecurityAlert: (callback: (infractions: any[]) => void) => {
    ipcRenderer.on("security-infraction-alert", (_event, infractions) => callback(infractions));
  },
} as SafeExamDesktopAPI);

function updateTopBarState(isLive: boolean) {
  isCurrentExamLive = isLive;
  const exitContainer = document.getElementById("safeexam-topbar-right");
  if (!exitContainer) return;

  if (isLive) {
    exitContainer.innerHTML = `
      <div style="background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: 700; display: flex; align-items: center; gap: 6px; box-shadow: 0 1px 2px rgba(239,68,68,0.1);">
        <span style="width: 7px; height: 7px; border-radius: 50%; background: #ef4444; animation: pulse 1.5s infinite;"></span>
        <span>🔒 Exam In Progress (Submit to Exit)</span>
      </div>
    `;
  } else {
    exitContainer.innerHTML = `
      <button id="safeexam-topbar-exit-btn" style="background: #f8fafc; color: #334155; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 12px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.15s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.03);">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        <span>Exit Safe Browser</span>
      </button>
    `;
    const btn = document.getElementById("safeexam-topbar-exit-btn");
    if (btn) {
      btn.onmouseover = () => {
        btn.style.background = "#fee2e2";
        btn.style.color = "#991b1b";
        btn.style.borderColor = "#fca5a5";
      };
      btn.onmouseout = () => {
        btn.style.background = "#f8fafc";
        btn.style.color = "#334155";
        btn.style.borderColor = "#cbd5e1";
      };
      btn.onclick = () => {
        ipcRenderer.send("exit-app");
      };
    }
  }
}

function injectSecurityStylesAndTopBar() {
  if (typeof window === "undefined") return;

  // Prevent trackpad gestures and bounce navigation via CSS
  const style = document.createElement("style");
  style.id = "safeexam-lockdown-css";
  style.textContent = `
    html, body {
      overscroll-behavior-x: none !important;
      overscroll-behavior-y: none !important;
      touch-action: pan-y !important;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
  `;
  if (document.head) {
    document.head.appendChild(style);
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      document.head?.appendChild(style);
    });
  }

  // Do not inject top bar on local file diagnostic page
  if (window.location.protocol.startsWith("file:")) return;
  if (document.getElementById("safeexam-topbar")) return;

  const bar = document.createElement("div");
  bar.id = "safeexam-topbar";
  bar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 36px;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 12px;
    color: #0f172a;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    user-select: none;
  `;

  const left = document.createElement("div");
  left.style.cssText = "display: flex; align-items: center; gap: 8px; font-weight: 700; color: #1e1b4b;";
  left.innerHTML = `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4338ca" stroke-width="2.5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
    <span>SafeExam Pro</span>
    <span style="font-size: 10px; background: #e0e7ff; color: #3730a3; padding: 1.5px 5px; border-radius: 4px; font-weight: 700;">LOCKDOWN</span>
  `;

  const center = document.createElement("div");
  center.style.cssText =
    "display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; color: #047857; background: #ecfdf5; padding: 2.5px 9px; border-radius: 9999px; border: 1px solid #a7f3d0;";
  center.innerHTML = `
    <span style="width: 6px; height: 6px; border-radius: 50%; background: #10b981;"></span>
    <span>OS Kiosk Active • Single Display Shield</span>
  `;

  const right = document.createElement("div");
  right.id = "safeexam-topbar-right";
  right.style.cssText = "display: flex; align-items: center; gap: 8px;";

  bar.appendChild(left);
  bar.appendChild(center);
  bar.appendChild(right);

  // Check if live exam is already active based on URL
  const isCurrentlyInExam =
    window.location.pathname.includes("/candidate/exam/") && !window.location.pathname.endsWith("/candidate");

  if (document.body) {
    document.body.prepend(bar);
    document.body.style.paddingTop = "36px";
    updateTopBarState(isCurrentlyInExam);
  } else {
    window.addEventListener("DOMContentLoaded", () => {
      document.body.prepend(bar);
      document.body.style.paddingTop = "36px";
      updateTopBarState(isCurrentlyInExam);
    });
  }
}

// Global key suppressor in DOM capture phase
window.addEventListener(
  "keydown",
  (e) => {
    // If not in live exam and user presses Escape, Cmd+Q, or Ctrl+Q, trigger exit
    if (!isCurrentExamLive) {
      const isExitAttempt =
        e.key === "Escape" ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "q") ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "w");
      if (isExitAttempt) {
        ipcRenderer.send("exit-app");
        return;
      }
    }

    // If live exam is active, trap all tab-switching and dangerous shortcuts
    if (isCurrentExamLive) {
      if (e.key === "Tab" && (e.altKey || e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
      }
      if (e.key === "F5" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r")) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        ["w", "t", "n", "q", "r", "h", "m"].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  },
  true
);

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", injectSecurityStylesAndTopBar);
} else {
  injectSecurityStylesAndTopBar();
}
