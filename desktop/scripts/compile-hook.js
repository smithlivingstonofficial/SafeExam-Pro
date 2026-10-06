const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

if (process.platform === "win32") {
  console.log("[Build] Compiling Windows native lockdown hook...");
  const binDir = path.join(__dirname, "../bin");
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }

  try {
    execSync(
      'powershell -Command "Stop-Process -Name \'safeexam-hook\' -Force -ErrorAction SilentlyContinue"',
      { stdio: "ignore" }
    );
  } catch {
    // ignore
  }

  const cscPath = "C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe";
  if (fs.existsSync(cscPath)) {
    const srcPath = path.join(__dirname, "../src/native/SafeExamLockdownHook.cs");
    const outPath = path.join(binDir, "safeexam-hook.exe");
    execSync(`"${cscPath}" /target:winexe /out:"${outPath}" /platform:x64 "${srcPath}"`, {
      stdio: "inherit",
    });
    console.log("[Build] safeexam-hook.exe compiled successfully.");
  } else {
    console.warn("[Build] csc.exe not found at standard path. Skipping C# compilation.");
  }
} else {
  console.log(`[Build] Target platform is ${process.platform}. Skipping Windows C# hook compilation.`);
}
