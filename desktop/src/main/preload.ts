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
  exitApp: () => void;
  onSecurityAlert: (callback: (infractions: any[]) => void) => void;
}

contextBridge.exposeInMainWorld("safeExamDesktop", {
  runDiagnostics: () => ipcRenderer.invoke("run-diagnostics"),
  launchExamSession: (examUrl: string) => ipcRenderer.invoke("launch-exam", examUrl),
  exitApp: () => ipcRenderer.send("exit-app"),
  onSecurityAlert: (callback: (infractions: any[]) => void) => {
    ipcRenderer.on("security-infraction-alert", (_event, infractions) => callback(infractions));
  },
} as SafeExamDesktopAPI);
