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

// Enforce Single Instance Lock at entry point before app.whenReady()
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  // Another instance is already running; terminate immediately without creating any windows
  app.quit();
  app.exit(0);
}

// Disable trackpad pinch-to-zoom and edge-swipe overscroll navigation at the Chromium engine level
app.commandLine.appendSwitch("disable-overscroll-edge-effects");
app.commandLine.appendSwitch("overscroll-history-navigation", "0");
app.commandLine.appendSwitch("disable-pinch");

let mainWindow: BrowserWindow | null = null;
const blackoutGuard = new DisplayBlackoutGuard();
let processScanInterval: NodeJS.Timeout | null = null;
let currentExamTargetUrl: string | null = null;
let isLiveExamActive: boolean = false;
let pendingDeepLinkUrl: string | null = null;

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

function handleDeepLink(urlStr: string) {
  const parsed = parseSafeExamProtocolUrl(urlStr);
  if (parsed) {
    currentExamTargetUrl = parsed;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadURL(parsed).catch((err) => {
        console.error("[DeepLink] Failed to load URL:", err);
      });
    } else {
      pendingDeepLinkUrl = urlStr;
    }
  }
}

// Windows second-instance command line handler
app.on("second-instance", (_event, commandLine) => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createMainWindow();
  } else {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
    if (process.platform === "darwin") {
      app.dock?.show();
      app.focus({ steal: true });
    }
  }

  const protocolUrl = commandLine.find((arg) => arg.startsWith("safeexam://"));
  if (protocolUrl) {
    handleDeepLink(protocolUrl);
  }
});

// macOS protocol URL handler
app.on("open-url", (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

// macOS dock activation handler
app.on("activate", () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createMainWindow();
  } else {
    mainWindow.show();
    mainWindow.focus();
    if (process.platform === "darwin") {
      app.dock?.show();
      app.focus({ steal: true });
    }
  }
});

/**
 * Institutional Exit Dialog:
 * If the exam has not started, candidate can safely exit immediately.
 * If the exam is in progress, candidate must submit first, unless proctor forces exit.
 */
function promptExitClient(force: boolean = false): void {
  const terminateCleanly = () => {
    currentExamTargetUrl = null;
    isLiveExamActive = false;
    if (processScanInterval) {
      clearInterval(processScanInterval);
      processScanInterval = null;
    }
    nativeHook.stop();
    blackoutGuard.clearBlackouts();
    globalShortcut.unregisterAll();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.removeAllListeners("close");
      mainWindow.destroy();
      mainWindow = null;
    }
    app.quit();
    app.exit(0);
  };

  if (!mainWindow || mainWindow.isDestroyed()) {
    terminateCleanly();
    return;
  }

  // If forced by proctor/supervisor OR not in an active live exam: exit cleanly immediately
  if (force || !isLiveExamActive) {
    terminateCleanly();
    return;
  }

  // Active examination underway: notify candidate asynchronously without freezing event loop
  dialog
    .showMessageBox(mainWindow, {
      type: "warning",
      buttons: ["Return to Examination"],
      defaultId: 0,
      title: "Examination In Progress",
      message: "Active Examination Underway",
      detail:
        "You are currently taking an active examination. In accordance with university examination policy, you must submit your answers using the 'Submit Examination' button inside the test room before exiting.",
    })
    .catch(() => {});
}

function createMainWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const isMac = process.platform === "darwin";

  if (isMac) {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: app.name,
        submenu: [
          { role: "about" },
          { type: "separator" },
          {
            label: "Quit SafeExam Pro",
            accelerator: "Command+Q",
            click: () => {
              promptExitClient(false);
            },
          },
        ],
      },
      {
        label: "Edit",
        submenu: [
          { role: "undo" },
          { role: "redo" },
          { type: "separator" },
          { role: "cut" },
          { role: "copy" },
          { role: "paste" },
          { role: "selectAll" },
        ],
      },
      {
        label: "Window",
        submenu: [
          {
            label: "Close Window",
            accelerator: "Command+W",
            click: () => {
              promptExitClient(false);
            },
          },
        ],
      },
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  } else {
    Menu.setApplicationMenu(null);
  }

  mainWindow = new BrowserWindow({
    width: primaryDisplay.bounds.width,
    height: primaryDisplay.bounds.height,
    x: primaryDisplay.bounds.x,
    y: primaryDisplay.bounds.y,
    frame: false,
    kiosk: !isMac,
    fullscreen: !isMac,
    minimizable: false,
    maximizable: false,
    closable: true,
    movable: false,
    resizable: false,
    skipTaskbar: false,
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

  // Raise window level safely:
  // On Windows, use "screen-saver" level and visible on all workspaces.
  // On macOS, DO NOT use "screen-saver" level or setVisibleOnAllWorkspaces (which causes WindowServer hiding/focus yielding)
  // Instead use "floating" level on macOS to ensure it stays in the foreground.
  if (process.platform === "win32") {
    mainWindow.setAlwaysOnTop(true, "screen-saver");
    try {
      mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    } catch {
      // OS level fallback
    }
  } else {
    mainWindow.setAlwaysOnTop(true, "floating");
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

  mainWindow.show();
  mainWindow.focus();
  if (isMac) {
    app.dock?.show();
    app.focus({ steal: true });
  }

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
      if (process.platform === "darwin" && mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.setSimpleFullScreen(false);
      }
    }
  });

  // Intercept new window requests (target="_blank", window.open)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    console.warn(`Blocked new window attempt: ${url}`);
    return { action: "deny" };
  });

  // Anti-Switching: If focus is lost during live exam, refocus!
  mainWindow.on("blur", () => {
    // Only enforce aggressive anti-switch focus stealing during ACTIVE live exam!
    if (!isLiveExamActive) {
      return;
    }

    try {
      clipboard.clear();
    } catch {
      // ignore
    }

    setImmediate(() => {
      if (mainWindow && !mainWindow.isDestroyed() && isLiveExamActive) {
        mainWindow.show();
        mainWindow.restore();
        mainWindow.focus();
        if (process.platform === "win32") {
          mainWindow.setAlwaysOnTop(true, "screen-saver");
        } else {
          mainWindow.setAlwaysOnTop(true, "floating");
          app.focus({ steal: true });
        }
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

  // Keyboard hook: blocks system keys, hotkeys, tab switching during live exam
  mainWindow.webContents.on("before-input-event", (event, input) => {
    // Supervisor Emergency Override: Ctrl+Alt+Shift+Q or Cmd+Alt+Shift+Q
    const isSupervisorCombo =
      (input.control || input.meta) &&
      input.alt &&
      input.shift &&
      input.key.toLowerCase() === "q";

    if (isSupervisorCombo) {
      console.log("Supervisor Emergency Exit triggered.");
      promptExitClient(true);
      return;
    }

    // Outside live exam: allow clean exit shortcuts and normal OS usage
    if (!isLiveExamActive) {
      // Allow Escape to exit
      if (input.key === "Escape" || input.key === "Esc") {
        promptExitClient(false);
        return;
      }

      // Allow Cmd+Q or Ctrl+Q or Cmd+W or Ctrl+W to exit outside active exam
      const isExitKey =
        (input.meta || input.control) &&
        (input.key.toLowerCase() === "q" || input.key.toLowerCase() === "w");
      if (isExitKey) {
        promptExitClient(false);
        return;
      }

      // Block DevTools keys outside development
      if (process.env.NODE_ENV !== "development") {
        if (
          input.key === "F12" ||
          ((input.control || input.meta) &&
            input.shift &&
            ["i", "j", "c"].includes(input.key.toLowerCase()))
        ) {
          event.preventDefault();
          return;
        }
      }

      return;
    }

    // --- FROM HERE: LIVE EXAM IS ACTIVE ---

    // Block Windows Key on Windows
    if (input.key === "Meta" && process.platform === "win32") {
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

    // On macOS: Block Command (Meta) shortcut combinations during exam
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
  // Emergency Supervisor Exit Hotkey (Ctrl+Alt+Shift+Q or Command+Alt+Shift+Q)
  try {
    globalShortcut.register("CommandOrControl+Alt+Shift+Q", () => {
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

  // Check if launched directly with a safeexam:// protocol in CLI arguments or macOS open-url
  if (pendingDeepLinkUrl) {
    handleDeepLink(pendingDeepLinkUrl);
    pendingDeepLinkUrl = null;
  } else {
    const initialDeepLink = process.argv.find((arg) => arg.startsWith("safeexam://"));
    if (initialDeepLink) {
      handleDeepLink(initialDeepLink);
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
    mainWindow?.webContents.send("security-infraction-alert", [
      {
        name: "QUIT_ATTEMPT",
        category: "window_manipulation",
        description: "Attempted to quit lockdown browser during active exam",
        detectedAt: new Date().toISOString(),
      },
    ]);
  } else {
    if (processScanInterval) clearInterval(processScanInterval);
    nativeHook.stop();
    blackoutGuard.clearBlackouts();
  }
});

app.on("window-all-closed", () => {
  if (processScanInterval) clearInterval(processScanInterval);
  nativeHook.stop();
  blackoutGuard.clearBlackouts();
  app.quit();
  app.exit(0);
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
  if (!mainWindow || mainWindow.isDestroyed()) return false;

  let target = examUrl.trim();
  if (target.startsWith("safeexam://")) {
    const parsed = parseSafeExamProtocolUrl(target);
    if (parsed) target = parsed;
  }
  if (!target.startsWith("http://") && !target.startsWith("https://")) {
    target = `${SERVER_BASE_URL}${target.startsWith("/") ? "" : "/"}${target}`;
  }

  currentExamTargetUrl = target;
  try {
    await mainWindow.loadURL(target);
    return true;
  } catch (err) {
    console.error(`[LaunchExam] Failed to load target ${target}:`, err);
    // Reload local diagnostic screen gracefully on connection failure
    const distHtmlPath = path.join(__dirname, "../renderer/index.html");
    const srcHtmlPath = path.join(__dirname, "../../src/renderer/index.html");
    const htmlToLoad = fs.existsSync(distHtmlPath) ? distHtmlPath : srcHtmlPath;
    if (mainWindow && !mainWindow.isDestroyed()) {
      await mainWindow.loadFile(htmlToLoad).catch(() => {});
    }
    return false;
  }
});

// IPC Handler: Exit App
ipcMain.on("exit-app", (_event, force?: boolean) => {
  promptExitClient(force === true);
});

// IPC Handler: Update Live Exam State (toggles Win32 low-level hook lock)
ipcMain.on("set-exam-state", (_event, isLive: boolean) => {
  isLiveExamActive = !!isLive;
  nativeHook.setLocked(isLiveExamActive);
  if (mainWindow && !mainWindow.isDestroyed() && process.platform === "darwin") {
    mainWindow.setSimpleFullScreen(isLiveExamActive);
  }
  console.log(`[ExamState] Live exam state: ${isLiveExamActive} — Native Hook setLocked(${isLiveExamActive})`);
});

// IPC Handler: Get Live Exam State
ipcMain.handle("get-exam-state", () => {
  return isLiveExamActive;
});
