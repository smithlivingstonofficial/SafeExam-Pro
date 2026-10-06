@echo off
title SafeExam Pro — Desktop Lockdown Client
echo =====================================================================
echo  SafeExam Pro — Institutional Desktop Examination Lockdown Client
echo =====================================================================
echo  Version: 1.0.0
echo  Platform: Windows x64 Native Enclosure
echo  Security: OS Kiosk, Single Display Shield, Process Scanner Engaged
echo =====================================================================
echo.
echo Launching SafeExam Pro Desktop Client...
cd /d "%~dp0desktop"
npm start
