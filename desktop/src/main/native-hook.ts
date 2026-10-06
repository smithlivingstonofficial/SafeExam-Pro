import { spawn, ChildProcess } from "child_process";
import * as path from "path";
import * as fs from "fs";

export class WindowsLockdownHook {
  private hookProcess: ChildProcess | null = null;
  private isHookActive: boolean = false;
  private onSupervisorOverride?: () => void;

  constructor(onSupervisorOverride?: () => void) {
    this.onSupervisorOverride = onSupervisorOverride;
  }

  public start(): void {
    if (process.platform !== "win32") return;
    if (this.hookProcess) return;

    const possiblePaths = [
      path.join(process.resourcesPath || "", "bin/safeexam-hook.exe"),
      path.join(process.resourcesPath || "", "safeexam-hook.exe"),
      path.join(__dirname, "../../../bin/safeexam-hook.exe"),
      path.join(__dirname, "../../bin/safeexam-hook.exe"),
      path.join(__dirname, "../bin/safeexam-hook.exe"),
      path.join(process.cwd(), "bin/safeexam-hook.exe"),
      path.join(process.cwd(), "desktop/bin/safeexam-hook.exe"),
    ];

    const hookExe = possiblePaths.find((p) => fs.existsSync(p));
    if (!hookExe) {
      console.warn("[LockdownHook] safeexam-hook.exe not found. Relying on Chromium-level hooks.");
      return;
    }

    try {
      this.hookProcess = spawn(hookExe, [], {
        windowsHide: true,
        stdio: ["pipe", "pipe", "pipe"],
      });

      this.hookProcess.stdout?.on("data", (data) => {
        const msg = data.toString().trim();
        console.log(`[LockdownHook] ${msg}`);
        if (msg.includes("SUPERVISOR_OVERRIDE") && this.onSupervisorOverride) {
          this.onSupervisorOverride();
        }
      });

      this.hookProcess.stderr?.on("data", (data) => {
        console.error(`[LockdownHook Error] ${data.toString()}`);
      });

      this.hookProcess.on("exit", (code) => {
        console.log(`[LockdownHook] exited with code ${code}`);
        this.hookProcess = null;
        this.isHookActive = false;
      });

      this.isHookActive = true;
      console.log(`[LockdownHook] Engaged via ${hookExe}`);
    } catch (err) {
      console.error("[LockdownHook] Failed to start:", err);
    }
  }

  public setLocked(locked: boolean): void {
    if (!this.hookProcess || !this.hookProcess.stdin) return;
    try {
      this.hookProcess.stdin.write(locked ? "LOCK\n" : "UNLOCK\n");
      console.log(`[LockdownHook] Command sent: ${locked ? "LOCK" : "UNLOCK"}`);
    } catch (err) {
      console.error("[LockdownHook] Failed to write lock state:", err);
    }
  }

  public stop(): void {
    if (!this.hookProcess) return;
    try {
      this.hookProcess.stdin?.write("QUIT\n");
      setTimeout(() => {
        try {
          if (this.hookProcess) this.hookProcess.kill();
        } catch {
          // ignore
        }
        this.hookProcess = null;
        this.isHookActive = false;
      }, 150);
    } catch {
      try {
        this.hookProcess.kill();
      } catch {
        // ignore
      }
      this.hookProcess = null;
      this.isHookActive = false;
    }
  }
}
