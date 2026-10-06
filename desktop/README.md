# SafeExam Pro — Secure Lockdown Desktop Examination Client

SafeExam Pro Desktop Client is a native examination browser enclosure engineered for institutional high-stakes assessments. It encapsulates the candidate examination experience inside a hardened kiosk sandbox, eliminating cheating vectors such as secondary displays, screen recording, remote desktop utilities, and hotkey switching.

---

## Key Security Architecture

### 1. Cryptographic Client Attestation
- **Hardware-Derived Fingerprint**: Generates a deterministic device ID combining host information, CPU architecture, OS platform, and physical network MAC address.
- **HMAC-SHA256 Request Signing**: Every outgoing HTTP/HTTPS request sent by the client to the examination server automatically attaches:
  - `X-SafeExam-Client-Token`: Base64 HMAC payload with 5-minute freshness window.
  - `X-SafeExam-Hardware-Id`: Hardware identifier.
  - `X-SafeExam-Client-Version`: Client binary version (`1.0.0`).
- **Server Verification**: The university Next.js server validates the cryptographic seal using `verifyClientAttestation()` before unlocking test questions.

### 2. Auxiliary Display Blackout Guard (`DisplayBlackoutGuard`)
- Automatically monitors connected monitors in real time via Electron's `screen` API.
- If more than 1 display is detected, the primary monitor remains allocated to the examination, while high-priority frameless blackout shield windows automatically cover all secondary/auxiliary screens.
- Auxiliary screens remain completely unusable until the cable is disconnected.

### 3. Native Background Process Integrity Scanner
- Continuously scans running OS tasks every 3.5 seconds (`tasklist` on Windows / `ps` on macOS/Linux).
- Over 25+ application signatures actively blacklisted:
  - **Remote Access**: AnyDesk, TeamViewer, UltraViewer, RustDesk, VNC, RDP (`mstsc`), Parsec.
  - **Screen Recording**: OBS Studio, Camtasia, Snagit, ShareX, Lightshot, Snipping Tool.
  - **Virtualization**: VMware Workstation, VirtualBox, QEMU.
  - **Communication & AI**: Discord, Telegram, WhatsApp, Slack, Zoom, Teams, Skype, ChatGPT Desktop.
  - **Proxy/Inspection**: Fiddler, Charles Proxy, Wireshark, Postman.
- Instantly halts exam progress and triggers candidate warnings upon infraction detection.

### 4. OS Kiosk & System Hotkey Trapping
- Runs with `kiosk: true`, `alwaysOnTop: true`, `fullscreen: true`, and `frame: false`.
- Traps and silences system shortcuts (`F12`, `F11`, `Ctrl+Shift+I`, `Ctrl+Shift+C`, `Ctrl+U`, `Ctrl+R`, `F5`, `Alt+F4`, `Ctrl+W`).
- Blocks window closing until candidate submits examination.
- **Supervisor Emergency Exit**: `Ctrl+Alt+Shift+Q` allows proctor override in emergency scenarios.

### 5. Deep-Link Protocol Handler (`safeexam://`)
- Registered system-wide protocol handler for 1-click web-to-desktop launching:
  - `safeexam://exam/<assignmentId>` -> Launches directly into the candidate's test room.
  - `safeexam://candidate` -> Launches candidate dashboard diagnostic.

---

## Running the Desktop Client

### Prerequisites
- Node.js 20+
- Windows 10 or 11 (64-bit)

### Developer / Local Launch
From repository root:
```powershell
.\launch-desktop-client.bat
```
Or directly inside `desktop/`:
```powershell
cd desktop
npm start
```

### Build & Compilation
```powershell
npm run build
```
Generates compiled JavaScript in `desktop/dist/main/`.
