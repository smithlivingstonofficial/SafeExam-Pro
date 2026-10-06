@echo off
title SafeExam Pro — Desktop Installer Builder
echo =====================================================================
echo  SafeExam Pro — Institutional Desktop Installer Builder
echo =====================================================================
echo  Target: Windows x64 Native NSIS Setup Installer (.exe)
echo  Features: Win32 Low-Level Hook, Kiosk Enclosure, Protocol Registrar
echo =====================================================================
echo.
cd /d "%~dp0desktop"
call npm run dist:nsis
echo.
echo =====================================================================
echo  Build Complete!
echo  Installer output: desktop\dist-package\SafeExam Pro Setup 1.0.0.exe
echo =====================================================================
pause
