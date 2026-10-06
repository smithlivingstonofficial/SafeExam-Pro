"use client";

import { useState, useEffect, useRef } from "react";
import { Clock, AlertTriangle, ShieldCheck } from "lucide-react";

interface ExamTimerProps {
  initialDurationMinutes: number;
  startedAt?: string | null;
  serverNow?: string | null;
  scheduleEndAt?: string | null;
  onTimeExpired: () => void;
  onClockTamperDetected?: (details: { alteredBySeconds: number }) => void;
}

/**
 * High-Security CBT Countdown Timer.
 * Synchronizes with authoritative server timestamp and measures elapsed time via
 * monotonic high-resolution performance.now() rather than mutable client OS wall-clocks.
 * Strictly respects both exam duration and schedule window end deadlines.
 */
export function ExamTimer({
  initialDurationMinutes,
  startedAt,
  serverNow,
  scheduleEndAt,
  onTimeExpired,
  onClockTamperDetected,
}: ExamTimerProps) {
  // Compute absolute target end time in milliseconds: min(startedAt + duration, scheduleEndAt)
  const [targetDeadlineMs] = useState<number>(() => {
    const startMs = startedAt
      ? new Date(startedAt).getTime()
      : serverNow
      ? new Date(serverNow).getTime()
      : Date.now();

    const durationEndMs = startMs + initialDurationMinutes * 60 * 1000;
    const scheduleEndMs = scheduleEndAt ? new Date(scheduleEndAt).getTime() : Number.MAX_SAFE_INTEGER;
    return Math.min(durationEndMs, scheduleEndMs);
  });

  // Reference points for monotonic elapsed time measurement
  const syncRef = useRef<{
    calibratedServerStartMs: number;
    perfStartMs: number;
    mountWallClockMs: number;
    hasTamperReported: boolean;
  }>({
    calibratedServerStartMs: serverNow ? new Date(serverNow).getTime() : Date.now(),
    perfStartMs: typeof performance !== "undefined" ? performance.now() : 0,
    mountWallClockMs: Date.now(),
    hasTamperReported: false,
  });

  // Initial remaining seconds calculation
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const currentServerMs = serverNow ? new Date(serverNow).getTime() : Date.now();
    return Math.max(0, Math.floor((targetDeadlineMs - currentServerMs) / 1000));
  });

  // Re-calibrate whenever a fresh authoritative server timestamp arrives (from heartbeat)
  useEffect(() => {
    if (serverNow) {
      syncRef.current.calibratedServerStartMs = new Date(serverNow).getTime();
      syncRef.current.perfStartMs = performance.now();
      syncRef.current.mountWallClockMs = Date.now();
    }
  }, [serverNow]);

  useEffect(() => {
    const interval = setInterval(() => {
      const { calibratedServerStartMs, perfStartMs, mountWallClockMs, hasTamperReported } = syncRef.current;

      // Monotonic elapsed time calculation (immune to client changing OS clock)
      const elapsedPerfMs = performance.now() - perfStartMs;
      const currentSyncedServerMs = calibratedServerStartMs + elapsedPerfMs;

      // Compute remaining time to hard deadline
      const diff = Math.max(0, Math.floor((targetDeadlineMs - currentSyncedServerMs) / 1000));
      setRemainingSeconds(diff);

      // Anti-Tamper Clock Anomaly Detector:
      // If client OS wall clock diverges by > 12 seconds from expected elapsed time
      const expectedWallClock = mountWallClockMs + elapsedPerfMs;
      const actualWallClock = Date.now();
      const wallClockDiscrepancy = Math.abs(actualWallClock - expectedWallClock);

      if (wallClockDiscrepancy > 12000 && !hasTamperReported) {
        syncRef.current.hasTamperReported = true;
        onClockTamperDetected?.({
          alteredBySeconds: Math.round(wallClockDiscrepancy / 1000),
        });
      }

      if (diff <= 0) {
        clearInterval(interval);
        onTimeExpired();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDeadlineMs, onTimeExpired, onClockTamperDetected]);

  // Format into HH:MM:SS or MM:SS
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  const formattedTime =
    hours > 0
      ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const isUrgent = remainingSeconds <= 120; // under 2 mins
  const isWarning = remainingSeconds <= 600 && !isUrgent; // under 10 mins

  return (
    <div
      className={`h-9 px-3 rounded-xl border flex items-center gap-2 font-mono transition-colors shadow-2xs shrink-0 ${
        isUrgent
          ? "bg-rose-50 border-rose-300 text-rose-800 animate-pulse ring-2 ring-rose-200"
          : isWarning
          ? "bg-amber-50 border-amber-300 text-amber-900"
          : "bg-slate-50/80 border-slate-200/90 text-slate-800"
      }`}
      title="Authoritative Server-Synchronized CBT Timer (Anti-Clock-Tamper Protected)"
    >
      {isUrgent ? (
        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-bounce shrink-0" />
      ) : (
        <Clock className={`w-3.5 h-3.5 shrink-0 ${isWarning ? "text-amber-600" : "text-slate-400"}`} />
      )}

      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-sans uppercase font-bold tracking-wider text-slate-400 hidden sm:inline">
          Time Left:
        </span>
        <span className="text-xs sm:text-sm font-extrabold tracking-tight">
          {formattedTime}
        </span>
      </div>

      <div className="hidden xl:flex items-center gap-0.5 text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 font-sans font-semibold">
        <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
        <span>Synced</span>
      </div>
    </div>
  );
}
