import { exec } from "child_process";
import * as os from "os";
import { screen, BrowserWindow } from "electron";

export const BLACKLISTED_PROCESSES: Array<{ name: string; category: string; description: string }> = [
  // Remote Access & Sharing
  { name: "anydesk", category: "remote_access", description: "AnyDesk Remote Control" },
  { name: "teamviewer", category: "remote_access", description: "TeamViewer Remote Desktop" },
  { name: "ultraviewer", category: "remote_access", description: "UltraViewer" },
  { name: "rustdesk", category: "remote_access", description: "RustDesk" },
  { name: "vnc", category: "remote_access", description: "VNC Server / Viewer" },
  { name: "vncviewer", category: "remote_access", description: "VNC Viewer" },
  { name: "mstsc", category: "remote_access", description: "Windows Remote Desktop Client" },
  { name: "parsec", category: "remote_access", description: "Parsec Remote Gaming/Screen" },

  // Screen Recorders & Broadcast
  { name: "obs64", category: "screen_capture", description: "OBS Studio (64-bit)" },
  { name: "obs32", category: "screen_capture", description: "OBS Studio (32-bit)" },
  { name: "obs", category: "screen_capture", description: "OBS Studio" },
  { name: "camtasia", category: "screen_capture", description: "TechSmith Camtasia" },
  { name: "snagit", category: "screen_capture", description: "TechSmith Snagit" },
  { name: "sharex", category: "screen_capture", description: "ShareX Screen Capture" },
  { name: "lightshot", category: "screen_capture", description: "Lightshot Screenshot Utility" },
  { name: "snippingtool", category: "screen_capture", description: "Windows Snipping Tool" },
  { name: "screenclippinghost", category: "screen_capture", description: "Windows Screen Clip Service" },

  // Virtualization / Hypervisors
  { name: "vmware", category: "virtual_machine", description: "VMware Workstation" },
  { name: "vmware-vmx", category: "virtual_machine", description: "VMware Virtual Machine Worker" },
  { name: "virtualbox", category: "virtual_machine", description: "Oracle VM VirtualBox" },
  { name: "vboxheadless", category: "virtual_machine", description: "VirtualBox Headless Service" },
  { name: "qemu-system", category: "virtual_machine", description: "QEMU Hypervisor" },

  // Communication & AI Helpers
  { name: "discord", category: "communication", description: "Discord Chat & Voice" },
  { name: "telegram", category: "communication", description: "Telegram Desktop" },
  { name: "whatsapp", category: "communication", description: "WhatsApp Desktop" },
  { name: "slack", category: "communication", description: "Slack Workspace" },
  { name: "zoom", category: "communication", description: "Zoom Meetings" },
  { name: "teams", category: "communication", description: "Microsoft Teams" },
  { name: "skype", category: "communication", description: "Skype" },
  { name: "chatgpt", category: "ai_assistance", description: "ChatGPT Desktop App" },

  // Proxy / Interception Tools
  { name: "charles", category: "proxy_devtools", description: "Charles Web Proxy" },
  { name: "fiddler", category: "proxy_devtools", description: "Fiddler HTTP Debugger" },
  { name: "wireshark", category: "proxy_devtools", description: "Wireshark Packet Analyzer" },
  { name: "postman", category: "proxy_devtools", description: "Postman API Client" },
];

export interface DetectedProcessInfraction {
  name: string;
  category: string;
  description: string;
  detectedAt: string;
}

export interface SecurityDiagnosticStatus {
  singleDisplay: boolean;
  displayCount: number;
  cleanProcesses: boolean;
  detectedInfractions: DetectedProcessInfraction[];
  isHypervisorDetected: boolean;
}

/**
 * Scans active OS processes for blacklisted remote control, recording, or communication applications.
 */
export async function scanRunningProcesses(): Promise<DetectedProcessInfraction[]> {
  return new Promise((resolve) => {
    const isWin = os.platform() === "win32";
    const command = isWin ? "tasklist /fo csv /nh" : "ps -A -o comm";

    exec(command, { timeout: 3000 }, (error, stdout) => {
      if (error || !stdout) {
        resolve([]);
        return;
      }

      const lowerOutput = stdout.toLowerCase();
      const infractions: DetectedProcessInfraction[] = [];
      const nowIso = new Date().toISOString();

      for (const item of BLACKLISTED_PROCESSES) {
        const needle = item.name.toLowerCase();
        // Check if the process name exists in output
        if (lowerOutput.includes(needle)) {
          infractions.push({
            name: item.name,
            category: item.category,
            description: item.description,
            detectedAt: nowIso,
          });
        }
      }

      resolve(infractions);
    });
  });
}

/**
 * Checks for multi-monitor configuration.
 */
export function checkDisplayConfiguration(): { singleDisplay: boolean; displayCount: number } {
  try {
    const displays = screen.getAllDisplays();
    return {
      singleDisplay: displays.length === 1,
      displayCount: displays.length,
    };
  } catch {
    return { singleDisplay: true, displayCount: 1 };
  }
}

/**
 * Creates blackout overlay windows covering auxiliary/secondary displays to prevent screen leakage.
 */
export class DisplayBlackoutGuard {
  private blackoutWindows: BrowserWindow[] = [];

  public applyBlackouts(primaryDisplayId: number): void {
    this.clearBlackouts();
    const allDisplays = screen.getAllDisplays();

    allDisplays.forEach((disp: any) => {
      if (disp.id !== primaryDisplayId) {
        const win = new BrowserWindow({
          x: disp.bounds.x,
          y: disp.bounds.y,
          width: disp.bounds.width,
          height: disp.bounds.height,
          frame: false,
          kiosk: true,
          alwaysOnTop: true,
          backgroundColor: "#020617",
          skipTaskbar: true,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
          },
        });

        win.loadURL(
          `data:text/html;charset=utf-8,${encodeURIComponent(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Auxiliary Screen Blocked</title>
              <style>
                body {
                  margin: 0;
                  background-color: #020617;
                  color: #e2e8f0;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  text-align: center;
                  padding: 2rem;
                }
                .shield {
                  width: 64px;
                  height: 64px;
                  background: #ef4444;
                  border-radius: 16px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  margin-bottom: 1.5rem;
                }
                h1 { font-size: 24px; font-weight: 700; color: #ffffff; margin-bottom: 8px; }
                p { font-size: 14px; color: #94a3b8; max-width: 480px; line-height: 1.6; }
                .badge {
                  background: rgba(239, 68, 68, 0.15);
                  color: #f87171;
                  padding: 6px 12px;
                  border-radius: 8px;
                  font-size: 12px;
                  font-weight: 600;
                  margin-top: 1rem;
                  border: 1px solid rgba(239, 68, 68, 0.3);
                }
              </style>
            </head>
            <body>
              <div class="shield">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h1>Secondary Display Blocked</h1>
              <p>SafeExam Pro has locked this auxiliary display. Institutional regulations require all assessments to be completed on a single primary monitor.</p>
              <div class="badge">Lockdown Guard Active • Disconnect Cable to Resume</div>
            </body>
          </html>
        `)}`
        );

        this.blackoutWindows.push(win);
      }
    });
  }

  public clearBlackouts(): void {
    this.blackoutWindows.forEach((win) => {
      try {
        if (!win.isDestroyed()) win.close();
      } catch {
        // quiet close
      }
    });
    this.blackoutWindows = [];
  }
}
