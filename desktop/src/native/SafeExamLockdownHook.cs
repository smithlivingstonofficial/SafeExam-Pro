using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Windows.Forms;

namespace SafeExamLockdown
{
    class Program
    {
        private const int WH_KEYBOARD_LL = 13;
        private const int WM_KEYDOWN = 0x0100;
        private const int WM_KEYUP = 0x0101;
        private const int WM_SYSKEYDOWN = 0x0104;
        private const int WM_SYSKEYUP = 0x0105;

        // Virtual Key Codes
        private const int VK_TAB = 0x09;
        private const int VK_ESCAPE = 0x1B;
        private const int VK_SPACE = 0x20;
        private const int VK_F4 = 0x73;
        private const int VK_LWIN = 0x5B;
        private const int VK_RWIN = 0x5C;
        private const int VK_SNAPSHOT = 0x2C;
        private const int VK_CONTROL = 0x11;
        private const int VK_SHIFT = 0x10;
        private const int VK_MENU = 0x12; // Alt key
        private const int VK_APPS = 0x5D; // Windows context menu key
        private const int VK_PRIOR = 0x21; // Page Up
        private const int VK_NEXT = 0x22;  // Page Down
        private const int VK_LEFT = 0x25;
        private const int VK_RIGHT = 0x27;

        // Browser navigation keys
        private const int VK_BROWSER_BACK = 0xA6;
        private const int VK_BROWSER_FORWARD = 0xA7;
        private const int VK_BROWSER_REFRESH = 0xA8;
        private const int VK_BROWSER_STOP = 0xA9;
        private const int VK_BROWSER_SEARCH = 0xAA;
        private const int VK_BROWSER_FAVORITES = 0xAB;
        private const int VK_BROWSER_HOME = 0xAC;

        private const int LLKHF_ALTDOWN = 0x20;

        [StructLayout(LayoutKind.Sequential)]
        private struct KBDLLHOOKSTRUCT
        {
            public uint vkCode;
            public uint scanCode;
            public uint flags;
            public uint time;
            public IntPtr dwExtraInfo;
        }

        private delegate IntPtr LowLevelKeyboardProc(int nCode, IntPtr wParam, IntPtr lParam);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelKeyboardProc lpfn, IntPtr hMod, uint dwThreadId);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool UnhookWindowsHookEx(IntPtr hhk);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

        [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr GetModuleHandle(string lpModuleName);

        [DllImport("user32.dll")]
        private static extern short GetAsyncKeyState(int vKey);

        private static IntPtr _hookID = IntPtr.Zero;
        private static LowLevelKeyboardProc _proc = HookCallback;
        // Defaults to false until setExamState(true) is received upon entering test room
        private static volatile bool _isLocked = false;

        static void Main(string[] args)
        {
            _hookID = SetHook(_proc);
            Console.WriteLine("HOOK_READY");
            Console.Out.Flush();

            // Background reader thread to listen for IPC commands via stdin from Node
            System.Threading.ThreadPool.QueueUserWorkItem((state) =>
            {
                string line;
                while ((line = Console.ReadLine()) != null)
                {
                    line = line.Trim().ToUpper();
                    if (line == "UNLOCK")
                    {
                        _isLocked = false;
                        Console.WriteLine("STATE:UNLOCKED");
                        Console.Out.Flush();
                    }
                    else if (line == "LOCK")
                    {
                        _isLocked = true;
                        Console.WriteLine("STATE:LOCKED");
                        Console.Out.Flush();
                    }
                    else if (line == "QUIT" || line == "EXIT")
                    {
                        UnhookWindowsHookEx(_hookID);
                        Environment.Exit(0);
                    }
                }
            });

            // Standard Windows message loop required for WH_KEYBOARD_LL hook dispatching
            Application.Run();

            UnhookWindowsHookEx(_hookID);
        }

        private static IntPtr SetHook(LowLevelKeyboardProc proc)
        {
            using (Process curProcess = Process.GetCurrentProcess())
            using (ProcessModule curModule = curProcess.MainModule)
            {
                return SetWindowsHookEx(WH_KEYBOARD_LL, proc, GetModuleHandle(curModule.ModuleName), 0);
            }
        }

        private static IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam)
        {
            if (nCode >= 0)
            {
                int msg = wParam.ToInt32();
                if (msg == WM_KEYDOWN || msg == WM_SYSKEYDOWN || msg == WM_KEYUP || msg == WM_SYSKEYUP)
                {
                    KBDLLHOOKSTRUCT hookStruct = (KBDLLHOOKSTRUCT)Marshal.PtrToStructure(lParam, typeof(KBDLLHOOKSTRUCT));
                    uint vk = hookStruct.vkCode;
                    bool isAlt = (hookStruct.flags & LLKHF_ALTDOWN) != 0 || (GetAsyncKeyState(VK_MENU) & 0x8000) != 0;
                    bool isCtrl = (GetAsyncKeyState(VK_CONTROL) & 0x8000) != 0;
                    bool isShift = (GetAsyncKeyState(VK_SHIFT) & 0x8000) != 0;

                    // 1. Emergency Supervisor Override: Ctrl + Alt + Shift + Q (Always enabled)
                    if (vk == 0x51) // 'Q'
                    {
                        if (isCtrl && isAlt && isShift)
                        {
                            Console.WriteLine("SUPERVISOR_OVERRIDE");
                            Console.Out.Flush();
                            return CallNextHookEx(_hookID, nCode, wParam, lParam);
                        }
                    }

                    // 2. Global protection: PrintScreen is ALWAYS blocked regardless of exam state
                    if (vk == VK_SNAPSHOT)
                    {
                        return (IntPtr)1;
                    }

                    // 3. Global protection: DevTools (F12) is ALWAYS blocked
                    if (vk == 0x7B) // F12
                    {
                        return (IntPtr)1;
                    }

                    // 4. If EXAM IS ACTIVELY UNDERWAY (_isLocked == true): Enforce 100% Full Lockdown
                    if (_isLocked)
                    {
                        // A. Block Alt+Tab and Alt+Shift+Tab
                        if (vk == VK_TAB && isAlt)
                        {
                            return (IntPtr)1;
                        }

                        // B. Block Ctrl+Tab and Ctrl+Shift+Tab (Browser tab switching)
                        if (vk == VK_TAB && isCtrl)
                        {
                            return (IntPtr)1;
                        }

                        // C. Block Windows Keys (LWin, RWin)
                        // This suppresses: Win, Win+Tab (Task View), Win+D, Win+M, Win+Ctrl+Left/Right (Virtual Desktops),
                        // and precision trackpad gestures (3-finger swipe up/down, 4-finger swipe left/right, 3-finger tap, 4-finger tap)!
                        if (vk == VK_LWIN || vk == VK_RWIN)
                        {
                            return (IntPtr)1;
                        }

                        // D. Block Escape key completely during active exam
                        if (vk == VK_ESCAPE)
                        {
                            return (IntPtr)1;
                        }

                        // E. Block Alt+Space (Window system menu)
                        if (vk == VK_SPACE && isAlt)
                        {
                            return (IntPtr)1;
                        }

                        // F. Block Alt+F4
                        if (vk == VK_F4 && isAlt)
                        {
                            return (IntPtr)1;
                        }

                        // G. Block Applications / Context Menu key
                        if (vk == VK_APPS)
                        {
                            return (IntPtr)1;
                        }

                        // H. Block all Function keys: F1 to F12 (0x70 to 0x7B)
                        if (vk >= 0x70 && vk <= 0x7B)
                        {
                            return (IntPtr)1;
                        }

                        // I. Block hardware browser navigation buttons
                        if (vk >= VK_BROWSER_BACK && vk <= VK_BROWSER_HOME)
                        {
                            return (IntPtr)1;
                        }

                        // J. Block Ctrl + PageUp / PageDown (Tab switching)
                        if ((vk == VK_PRIOR || vk == VK_NEXT) && isCtrl)
                        {
                            return (IntPtr)1;
                        }

                        // K. Block Alt + Left / Alt + Right (Browser history navigation)
                        if ((vk == VK_LEFT || vk == VK_RIGHT) && isAlt)
                        {
                            return (IntPtr)1;
                        }

                        // L. Block Ctrl + Numbers 1-9 (Tab switching)
                        if (vk >= 0x31 && vk <= 0x39 && isCtrl)
                        {
                            return (IntPtr)1;
                        }

                        // M. Block Ctrl + W (close), Ctrl + T (new tab), Ctrl + N (new window), Ctrl + U (source), Ctrl + R (refresh)
                        if (isCtrl && (vk == 0x57 || vk == 0x54 || vk == 0x4E || vk == 0x55 || vk == 0x52))
                        {
                            return (IntPtr)1;
                        }
                    }
                }
            }

            return CallNextHookEx(_hookID, nCode, wParam, lParam);
        }
    }
}
