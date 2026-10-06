import {
  app,
  BrowserWindow,
  ipcMain,
  globalShortcut,
  session,
  screen,
  dialog,
  clipboard,
  Menu,
} from "electron";
import * as path from "path";
import * as fs from "fs";
import {
  scanRunningProcesses,
  checkDisplayConfiguration,
  DisplayBlackoutGuard,
  DetectedProcessInfraction,
} from "./security";
import { generateAttestationToken } from "./attestation";
import { WindowsLockdownHook } from "./native-hook";

// Disable trackpad pinch-to-zoom and edge-swipe overscroll navigation at the Chromium engine level
app.commandLine.appendSwitch("disable-overscroll-edge-effects");
app.commandLine.appendSwitch("overscroll-history-navigation", "0");
app.commandLine.appendSwitch("disable-pinch");

let mainWindow: BrowserWindow | null = null;
const blackoutGuard = new DisplayBlackoutGuard();
let processScanInterval: NodeJS.Timeout | null = null;
let currentExamTargetUrl: string | null = null;
let isLiveExamActive: boolean = false;

// Native Win32 Low-Level Keyboard & Gesture Hook (blocks Alt+Tab, Win keys, trackpad gestures)
const nativeHook = new WindowsLockdownHook(() => {
  console.log("[NativeHook] Supervisor Emergency Override invoked.");
  promptExitClient(true);
});

// Target Web Platform Base URL (default local dev, customizable via env)
const SERVER_BASE_URL = process.env.SAFEEXAM_SERVER_URL || "http://localhost:3000";

// Register custom protocol handler: safeexam://
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("safeexam", process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient("safeexam");
}

function parseSafeExamProtocolUrl(urlStr: string): string | null {
  try {
    const url = new URL(urlStr);
    if (url.protocol === "safeexam:") {
      let resolvedPath = "";
      if (url.host === "exam") {
        resolvedPath = `/candidate/exam${url.pathname}`;
      } else if (url.host === "candidate") {
        resolvedPath = `/candidate${url.pathname}`;
      } else if (url.host) {
        resolvedPath = `/${url.host}${url.pathname}`;
      } else {
        resolvedPath = url.pathname;
      }
      return `${SERVER_BASE_URL}${resolvedPath}${url.search}`;
    }
  } catch {
    // invalid protocol
  }
  return null;
}

/**
 * Institutional Exit Dialog:
 * If the exam has not started, candidate can safely exit.
 * If the exam is in progress, candidate must submit first.
 */
function promptExitClient(force: boolean = false): void {
  if (!mainWindow || mainWindow.isDestroyed()) {
    nativeHook.stop();
    app.quit();
    return;
  }

  if (force) {
    currentExamTargetUrl = null;
    isLiveExamActive = false;
    nativeHook.stop();
    app.quit();
    return;
  }

  if (isLiveExamActive) {
    dialog.showMessageBoxSync(mainWindow, {
      type: "warning",
      buttons: ["Return to Examination"],
      defaultId: 0,
      title: "Examination In Progress",
      message: "Active Examination Underway",
      detail:
        "You are currently taking an active examination. In accordance with university examination policy, you must submit your answers using the 'Submit Examination' button inside the test room before exiting.",
    });
    return;
  }

  // Not in active exam: confirm exit cleanly
  const response = dialog.showMessageBoxSync(mainWindow, {
    type: "question",
    buttons: ["Exit SafeExam", "Stay"],
    defaultId: 0,
    cancelId: 1,
    title: "Exit SafeExam Pro",
    message: "Exit SafeExam Pro Lockdown Client?",
    detail: "You have not started an active examination. Your session will be safely closed.",
  });

  if (response === 0) {
    currentExamTargetUrl = null;
    isLiveExamActive = false;
    nativeHook.stop();
    app.quit();
  }
}

function createMainWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();

  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: primaryDisplay.bounds.width,
    height: primaryDisplay.bounds.height,
    x: primaryDisplay.bounds.x,
    y: primaryDisplay.bounds.y,
    frame: false,
    kiosk: true,
    simpleFullscreen: process.platform === "darwin",
    alwaysOnTop: true,
    fullscreen: true,
    minimizable: false,
    maximizable: false,
    closable: true,
    movable: false,
    resizable: false,
    skipTaskbar: true,
    backgroundColor: "#ffffff",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      devTools: process.env.NODE_ENV === "development",
      zoomFactor: 1.0,
    },
  });

  // Enable OS-level screen capture and recording protection (macOS and Windows)
  try {
    mainWindow.setContentProtection(true);
  } catch {
    // OS level fallback
  }

  // Raise to highest screen-saver level on Windows
  mainWindow.setAlwaysOnTop(true, "screen-saver");

  // Prevent virtual desktop bypass (Win+Tab / Desktop 2) by showing on all workspaces
  try {
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  } catch {
    // OS level fallback
  }

  // Lock zoom limits to 1.0
  mainWindow.webContents.setVisualZoomLevelLimits(1, 1);
  mainWindow.webContents.setZoomLevel(0);
  mainWindow.webContents.on("zoom-changed", (e) => {
    e.preventDefault();
  });

  // Suppress trackpad swipe gesture navigation inside Electron window
  (mainWindow as any).on("swipe", (e: any) => {
    e.preventDefault();
  });

  // Load Diagnostic & Launch Screen initially (check dist and src fallbacks)
  const distHtmlPath = path.join(__dirname, "../renderer/index.html");
  const srcHtmlPath = path.join(__dirname, "../../src/renderer/index.html");
  const htmlToLoad = fs.existsSync(distHtmlPath) ? distHtmlPath : srcHtmlPath;
  mainWindow.loadFile(htmlToLoad);

  // Apply secondary display blackout shields
  blackoutGuard.applyBlackouts(primaryDisplay.id);

  // Security: Block DevTools opening in production
  if (process.env.NODE_ENV !== "development") {
    mainWindow.webContents.on("devtools-opened", () => {
      mainWindow?.webContents.closeDevTools();
    });
  }

  // Disable right-click context menu
  mainWindow.webContents.on("context-menu", (e) => {
    e.preventDefault();
  });

  // Intercept Navigation to enforce domain restriction
  mainWindow.webContents.on("will-navigate", (event, targetUrl) => {
    const isLocalFile = targetUrl.startsWith("file://");
    const isServerUrl =
      targetUrl.startsWith(SERVER_BASE_URL) ||
      targetUrl.includes("localhost") ||
      targetUrl.includes("127.0.0.1");

    if (targetUrl.startsWith("safeexam://")) {
      event.preventDefault();
      const resolved = parseSafeExamProtocolUrl(targetUrl);
      if (resolved && mainWindow) {
        mainWindow.loadURL(resolved);
      }
      return;
    }

    if (!isLocalFile && !isServerUrl) {
      event.preventDefault();
      console.warn(`Blocked unauthorized navigation to: ${targetUrl}`);
    }
  });

  // Automatically reset exam active state when navigating away from test room
  mainWindow.webContents.on("did-navigate", (_event, url) => {
    if (!url.includes("/candidate/exam/") || url.endsWith("/candidate")) {
      isLiveExamActive = false;
      nativeHook.setLocked(false);
    }
  });

  // Intercept new window requests (target="_blank", window.open)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    console.warn(`Blocked new window attempt: ${url}`);
    return { action: "deny" };
  });

  // Anti-Switching: If focus is lost (e.g. Win+Tab or Alt-Tab attempt), wipe clipboard and refocus instantly!
  mainWindow.on("blur", () => {
    try {
      clipboard.clear();
    } catch {
      // ignore
    }

    setImmediate(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.restore();
        mainWindow.focus();
        mainWindow.setAlwaysOnTop(true, "screen-saver");
      }
    });
  });

  // Prevent minimization during active exam
  mainWindow.on("minimize", () => {
    if (isLiveExamActive) {
      mainWindow?.restore();
      mainWindow?.focus();
    }
  });

  // Keyboard hook: blocks Windows key, Alt-Tab, PrintScreen, DevTools, Task Manager
  mainWindow.webContents.on("before-input-event", (event, input) => {
    // Supervisor Emergency Override: Ctrl+Alt+Shift+Q
    if (
      input.control &&
      input.alt &&
      input.shift &&
      input.key.toLowerCase() === "q"
    ) {
      console.log("Supervisor Emergency Exit triggered.");
      promptExitClient(true);
      return;
    }

    // If not in live exam, allow Escape to prompt exit
    if (!isLiveExamActive && (input.key === "Escape" || input.key === "Esc")) {
      promptExitClient(false);
      return;
    }

    // Block Windows Key
    if (input.key === "Meta") {
      event.preventDefault();
      return;
    }

    // Block PrintScreen / Screen Capture & clear clipboard
    if (input.key === "PrintScreen") {
      event.preventDefault();
      try {
        clipboard.clear();
      } catch {
        // ignore
      }
      return;
    }

    // If live exam is active, strictly block all switching, shortcut combinations & hotkeys
    if (isLiveExamActive) {
      // On macOS: Block Command (Meta) shortcut combinations
      if (input.meta) {
        const key = input.key.toLowerCase();
        if (
          key === "q" ||
          key === "w" ||
          key === "h" ||
          key === "m" ||
          key === "tab" ||
          key === " " ||
          key === "r"
        ) {
          event.preventDefault();
          return;
        }
        if (input.shift && ["3", "4", "5"].includes(key)) {
          event.preventDefault();
          return;
        }
        if (input.alt && (key === "escape" || key === "esc")) {
          event.preventDefault();
          return;
        }
      }

      // Block Escape during exam
      if (input.key === "Escape" || input.key === "Esc") {
        event.preventDefault();
        return;
      }

      // Block Alt+Tab, Alt+Esc, Alt+Space, Alt+F4
      if (
        input.alt &&
        (input.key === "Tab" ||
          input.key === "Escape" ||
          input.key === " " ||
          input.key === "F4" ||
          input.key === "ArrowLeft" ||
          input.key === "ArrowRight")
      ) {
        event.preventDefault();
        return;
      }

      // Block Ctrl+Tab, Ctrl+Shift+Tab (browser tab switching)
      if (input.control && input.key === "Tab") {
        event.preventDefault();
        return;
      }

      // Block Ctrl+PageUp, Ctrl+PageDown (tab switching)
      if (input.control && (input.key === "PageUp" || input.key === "PageDown")) {
        event.preventDefault();
        return;
      }

      // Block Ctrl+1 through Ctrl+9 (tab switching)
      if (input.control && /^[1-9]$/.test(input.key)) {
        event.preventDefault();
        return;
      }

      // Block Ctrl+Esc (Start Menu), Ctrl+Shift+Esc (Task Manager)
      if (input.control && input.key === "Escape") {
        event.preventDefault();
        return;
      }

      // Block Ctrl+W (close), Ctrl+T (new tab), Ctrl+N (new window), Ctrl+U (source)
      if (
        input.control &&
        ["w", "t", "n", "u", "p", "s", "o", "j", "h"].includes(input.key.toLowerCase())
      ) {
        event.preventDefault();
        return;
      }

      // Block browser reload and DevTools keys
      if (
        input.key === "F1" ||
        input.key === "F3" ||
        input.key === "F5" ||
        input.key === "F6" ||
        input.key === "F11" ||
        input.key === "F12" ||
        (input.control && input.key.toLowerCase() === "r") ||
        (input.control && input.shift && ["i", "j", "c", "r"].includes(input.key.toLowerCase()))
      ) {
        event.preventDefault();
        return;
      }
    } else {
      // Outside live exam: block DevTools keys
      if (
        input.key === "F12" ||
        (input.control && input.shift && ["i", "j", "c"].includes(input.key.toLowerCase()))
      ) {
        event.preventDefault();
        return;
      }
    }
  });

  // Disallow window closing ONLY during active live exam
  mainWindow.on("close", (e) => {
    if (isLiveExamActive) {
      e.preventDefault();
      mainWindow?.webContents.send("security-infraction-alert", [
        {
          name: "CLOSE_ATTEMPT",
          category: "window_manipulation",
          description: "Attempted to close lockdown browser during active exam",
          detectedAt: new Date().toISOString(),
        },
      ]);
    }
  });

  mainWindow.on("closed", () => {
    blackoutGuard.clearBlackouts();
    mainWindow = null;
  });
}

/**
 * Traps and blocks dangerous system hotkeys inside the kiosk.
 */
function registerSecurityShortcuts() {
  const restrictedShortcuts = [
    "F12",
    "F11",
    "Control+Shift+I",
    "Control+Shift+J",
    "Control+Shift+C",
    "Control+U",
    "Control+R",
    "F5",
    "Control+W",
    "Alt+F4",
  ];

  restrictedShortcuts.forEach((shortcut) => {
    try {
      globalShortcut.register(shortcut, () => {
        // nullify shortcut silently
      });
    } catch {
      // ignore OS registration limits
    }
  });

  // Emergency Supervisor Exit Hotkey (Ctrl+Alt+Shift+Q)
  try {
    globalShortcut.register("Control+Alt+Shift+Q", () => {
      console.log("Supervisor Emergency Exit triggered.");
      promptExitClient(true);
    });
  } catch {
    // ignore
  }
}

/**
 * Periodically scans running processes for blacklisted apps.
 */
function startPeriodicSecurityScanner() {
  if (processScanInterval) clearInterval(processScanInterval);

  // Scan every 2.5 seconds for instant threat neutralization
  processScanInterval = setInterval(async () => {
    const infractions = await scanRunningProcesses();
    if (infractions.length > 0 && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("security-infraction-alert", infractions);
    }
  }, 2500);
}

// Attach attestation headers to all outgoing requests to university server
function configureAttestationHeaders() {
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ["http://*/*", "https://*/*"] },
    (details, callback) => {
      const targetUrl = details.url;
      const isTarget =
        targetUrl.startsWith(SERVER_BASE_URL) ||
        targetUrl.includes("localhost") ||
        targetUrl.includes("127.0.0.1");

      if (isTarget) {
        const attestation = generateAttestationToken();
        details.requestHeaders["X-SafeExam-Client-Token"] = attestation.token;
        details.requestHeaders["X-SafeExam-Hardware-Id"] = attestation.hardwareId;
        details.requestHeaders["X-SafeExam-Client-Version"] = "1.0.0";
      }

      callback({ requestHeaders: details.requestHeaders });
    }
  );
}

// App lifecycle
app.whenReady().then(() => {
  // 1. Engage Native Win32 Low-Level Hook process
  nativeHook.start();

  // 2. Configure attestation & create kiosk
  configureAttestationHeaders();
  createMainWindow();
  registerSecurityShortcuts();
  startPeriodicSecurityScanner();

  // Check if launched directly with a safeexam:// protocol in CLI arguments
  const initialDeepLink = process.argv.find((arg) => arg.startsWith("safeexam://"));
  if (initialDeepLink && mainWindow) {
    const parsed = parseSafeExamProtocolUrl(initialDeepLink);
    if (parsed) {
      currentExamTargetUrl = parsed;
      mainWindow.loadURL(parsed);
    }
  }

  // Screen display change handler
  screen.on("display-added", () => {
    const primary = screen.getPrimaryDisplay();
    blackoutGuard.applyBlackouts(primary.id);
  });

  screen.on("display-removed", () => {
    const primary = screen.getPrimaryDisplay();
    blackoutGuard.applyBlackouts(primary.id);
  });
});

app.on("before-quit", (e) => {
  if (isLiveExamActive) {
    e.preventDefault();
    console.log("Blocked app quit attempt during live exam.");
  }
});

app.on("window-all-closed", () => {
  nativeHook.stop();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  nativeHook.stop();
  globalShortcut.unregisterAll();
  if (processScanInterval) clearInterval(processScanInterval);
  blackoutGuard.clearBlackouts();
});

// IPC Handler: Diagnostic Check
ipcMain.handle("run-diagnostics", async () => {
  const displayConfig = checkDisplayConfiguration();
  const infractions = await scanRunningProcesses();
  const attestation = generateAttestationToken();

  return {
    singleDisplay: displayConfig.singleDisplay,
    displayCount: displayConfig.displayCount,
    cleanProcesses: infractions.length === 0,
    detectedInfractions: infractions,
    hardwareId: attestation.hardwareId,
    token: attestation.token,
  };
});

// IPC Handler: Launch Exam URL inside hardened window
ipcMain.handle("launch-exam", async (_event, examUrl: string) => {
  if (!mainWindow) return false;

  let target = examUrl.trim();
  if (target.startsWith("safeexam://")) {
    const parsed = parseSafeExamProtocolUrl(target);
    if (parsed) target = parsed;
  }
  if (!target.startsWith("http://") && !target.startsWith("https://")) {
    target = `${SERVER_BASE_URL}${target.startsWith("/") ? "" : "/"}${target}`;
  }

  currentExamTargetUrl = target;
  await mainWindow.loadURL(target);
  return true;
});

// IPC Handler: Exit App
ipcMain.on("exit-app", (_event, force?: boolean) => {
  promptExitClient(force === true);
});

// IPC Handler: Update Live Exam State (toggles Win32 low-level hook lock)
ipcMain.on("set-exam-state", (_event, isLive: boolean) => {
  isLiveExamActive = !!isLive;
  nativeHook.setLocked(isLiveExamActive);
  console.log(`[ExamState] Live exam state: ${isLiveExamActive} — Native Hook setLocked(${isLiveExamActive})`);
});

// IPC Handler: Get Live Exam State
ipcMain.handle("get-exam-state", () => {
  return isLiveExamActive;
});

// Handle custom protocol launch on Windows (Single Instance Lock)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  nativeHook.stop();
  app.quit();
} else {
  app.on("second-instance", (_event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();

      // Check for safeexam:// deep link in command line args
      const protocolUrl = commandLine.find((arg) => arg.startsWith("safeexam://"));
      if (protocolUrl) {
        const parsed = parseSafeExamProtocolUrl(protocolUrl);
        if (parsed) {
          mainWindow.loadURL(parsed);
        }
      }
    }
  });
}
