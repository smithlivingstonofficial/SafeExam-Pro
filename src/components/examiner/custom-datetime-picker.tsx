"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  Sparkles,
} from "lucide-react";

interface CustomDateTimePickerProps {
  value: string; // format: "YYYY-MM-DDTHH:mm"
  onChange: (value: string) => void;
  minDate?: Date;
  placeholder?: string;
  className?: string;
}

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const STANDARD_TIME_SLOTS = [
  "08:00 AM",
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "01:00 PM",
  "01:30 PM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
  "05:00 PM",
];

export function CustomDateTimePicker({
  value,
  onChange,
  minDate,
  className = "",
}: CustomDateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"date" | "time">("date");
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse the current value
  const currentDate = useMemo(() => {
    if (!value) return new Date();
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [value]);

  // Calendar month state
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const d = new Date(currentDate);
    d.setDate(1);
    return d;
  });

  // Sync view month when value changes
  useEffect(() => {
    const d = new Date(currentDate);
    d.setDate(1);
    setViewMonth(d);
  }, [currentDate]);

  // Close on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Format helpers
  const formatDateTimeLocal = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const displayDateStr = useMemo(() => {
    try {
      return currentDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  }, [currentDate]);

  const displayTimeStr = useMemo(() => {
    try {
      return currentDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  }, [currentDate]);

  // Month navigation
  const prevMonth = () => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Month grid calculation
  const calendarCells = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: Array<{
      date: Date;
      dayNumber: number;
      isCurrentMonth: boolean;
      isSelected: boolean;
      isToday: boolean;
      isDisabled: boolean;
    }> = [];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i);
      cells.push({
        date: d,
        dayNumber: daysInPrevMonth - i,
        isCurrentMonth: false,
        isSelected: false,
        isToday: false,
        isDisabled: minDate ? d < new Date(minDate.setHours(0, 0, 0, 0)) : false,
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const d = new Date(year, month, i);
      const isSelected =
        d.getFullYear() === currentDate.getFullYear() &&
        d.getMonth() === currentDate.getMonth() &&
        d.getDate() === currentDate.getDate();

      const isTodayDate =
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate();

      const isBeforeMin = minDate ? d < new Date(minDate.setHours(0, 0, 0, 0)) : false;

      cells.push({
        date: d,
        dayNumber: i,
        isCurrentMonth: true,
        isSelected,
        isToday: isTodayDate,
        isDisabled: isBeforeMin,
      });
    }

    // Next month padding days to fill 35 or 42 cells
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      cells.push({
        date: d,
        dayNumber: i,
        isCurrentMonth: false,
        isSelected: false,
        isToday: false,
        isDisabled: false,
      });
    }

    return cells;
  }, [viewMonth, currentDate, minDate]);

  // Select day handler
  const handleSelectDay = (targetDate: Date) => {
    const updated = new Date(currentDate);
    updated.setFullYear(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    onChange(formatDateTimeLocal(updated));
  };

  // Quick Date presets
  const handleSelectQuickDate = (offsetDays: number) => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    const updated = new Date(currentDate);
    updated.setFullYear(target.getFullYear(), target.getMonth(), target.getDate());
    onChange(formatDateTimeLocal(updated));

    const view = new Date(target);
    view.setDate(1);
    setViewMonth(view);
  };

  // Select time slot handler
  const handleSelectTimeSlot = (timeSlotStr: string) => {
    const [timePart, modifier] = timeSlotStr.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);

    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    const updated = new Date(currentDate);
    updated.setHours(hours, minutes, 0, 0);
    onChange(formatDateTimeLocal(updated));
  };

  // Custom Time Adjusters
  const currentHours12 = currentDate.getHours() % 12 || 12;
  const currentMinutes = currentDate.getMinutes();
  const currentPeriod = currentDate.getHours() >= 12 ? "PM" : "AM";

  const adjustHour = (delta: number) => {
    const updated = new Date(currentDate);
    let h = updated.getHours() + delta;
    if (h < 0) h = 23;
    if (h > 23) h = 0;
    updated.setHours(h);
    onChange(formatDateTimeLocal(updated));
  };

  const adjustMinutes = (delta: number) => {
    const updated = new Date(currentDate);
    let m = updated.getMinutes() + delta;
    if (m < 0) m = 55;
    if (m > 59) m = 0;
    updated.setMinutes(m);
    onChange(formatDateTimeLocal(updated));
  };

  const togglePeriod = () => {
    const updated = new Date(currentDate);
    const h = updated.getHours();
    if (h >= 12) {
      updated.setHours(h - 12);
    } else {
      updated.setHours(h + 12);
    }
    onChange(formatDateTimeLocal(updated));
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-9 px-2.5 rounded-lg border border-slate-200/90 bg-white hover:border-indigo-300 hover:bg-slate-50/50 flex items-center justify-between text-xs font-semibold text-slate-800 shadow-2xs transition-all cursor-pointer outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-1.5 truncate min-w-0">
          <CalendarIcon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="truncate">{displayDateStr}</span>
          <span className="text-slate-300">•</span>
          <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="font-bold text-slate-900">{displayTimeStr}</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 ml-1 transition-transform duration-150 ${
            isOpen ? "rotate-180 text-indigo-600" : ""
          }`}
        />
      </button>

      {/* Custom Floating Date & Time Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 z-50 bg-white rounded-2xl border border-slate-200 shadow-2xl p-3.5 w-[330px] sm:w-[360px] animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Header Switcher: Date vs Time */}
          <div className="flex items-center justify-between gap-1 p-1 bg-slate-100/80 rounded-xl border border-slate-200/80 mb-3">
            <button
              type="button"
              onClick={() => setActiveTab("date")}
              className={`flex-1 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "date"
                  ? "bg-white text-indigo-950 shadow-xs border border-slate-200/90"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CalendarIcon className={`w-3.5 h-3.5 ${activeTab === "date" ? "text-indigo-600" : "text-slate-400"}`} />
              <span>{displayDateStr}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("time")}
              className={`flex-1 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "time"
                  ? "bg-white text-indigo-950 shadow-xs border border-slate-200/90"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Clock className={`w-3.5 h-3.5 ${activeTab === "time" ? "text-indigo-600" : "text-slate-400"}`} />
              <span>{displayTimeStr}</span>
            </button>
          </div>

          {/* TAB 1: DATE PICKER */}
          {activeTab === "date" && (
            <div className="space-y-3">
              {/* Quick Presets */}
              <div className="flex items-center justify-between gap-1 pb-1">
                {[
                  { label: "Today", offset: 0 },
                  { label: "Tomorrow", offset: 1 },
                  { label: "+2 Days", offset: 2 },
                  { label: "Next Week", offset: 7 },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleSelectQuickDate(item.offset)}
                    className="flex-1 py-1 text-[10px] font-bold rounded-md bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200/70 transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Month Navigation */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-800">
                  {viewMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                    title="Next Month"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day} className="text-[10px] font-bold text-slate-400 py-1">
                    {day}
                  </div>
                ))}

                {calendarCells.map((cell, index) => (
                  <button
                    key={index}
                    type="button"
                    disabled={cell.isDisabled}
                    onClick={() => handleSelectDay(cell.date)}
                    className={`h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer relative ${
                      cell.isSelected
                        ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold shadow-xs scale-105 z-10"
                        : cell.isToday
                        ? "bg-indigo-50/80 text-indigo-700 border border-indigo-200 font-bold"
                        : cell.isCurrentMonth
                        ? "text-slate-800 hover:bg-slate-100 hover:text-slate-900"
                        : "text-slate-300 hover:text-slate-500"
                    } ${cell.isDisabled ? "opacity-30 cursor-not-allowed hover:bg-transparent" : ""}`}
                  >
                    {cell.dayNumber}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: TIME PICKER */}
          {activeTab === "time" && (
            <div className="space-y-3">
              {/* Interactive Custom Time Adjuster */}
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-50/80 via-white to-blue-50/60 border border-indigo-100/90 flex items-center justify-center gap-3">
                {/* Hours */}
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => adjustHour(1)}
                    className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                  >
                    ▲
                  </button>
                  <span className="text-xl font-extrabold text-slate-900 font-mono tracking-wider w-8 text-center">
                    {String(currentHours12).padStart(2, "0")}
                  </span>
                  <button
                    type="button"
                    onClick={() => adjustHour(-1)}
                    className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                  >
                    ▼
                  </button>
                </div>

                <span className="text-xl font-bold text-slate-400 -mt-0.5">:</span>

                {/* Minutes */}
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => adjustMinutes(5)}
                    className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                  >
                    ▲
                  </button>
                  <span className="text-xl font-extrabold text-slate-900 font-mono tracking-wider w-8 text-center">
                    {String(currentMinutes).padStart(2, "0")}
                  </span>
                  <button
                    type="button"
                    onClick={() => adjustMinutes(-5)}
                    className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                  >
                    ▼
                  </button>
                </div>

                {/* AM/PM Switcher */}
                <button
                  type="button"
                  onClick={togglePeriod}
                  className="ml-2 px-2.5 py-1.5 rounded-lg bg-white border border-indigo-200 text-xs font-extrabold text-indigo-700 shadow-2xs hover:bg-indigo-50 transition-colors cursor-pointer"
                >
                  {currentPeriod}
                </button>
              </div>

              {/* Quick Standard Exam Times Grid */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                  Popular Exam Time Slots
                </label>
                <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto pr-0.5 [scrollbar-width:thin]">
                  {STANDARD_TIME_SLOTS.map((slot) => {
                    const isSelected = displayTimeStr === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => handleSelectTimeSlot(slot)}
                        className={`py-1.5 px-1 rounded-md text-[11px] font-bold transition-all text-center cursor-pointer ${
                          isSelected
                            ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-2xs"
                            : "bg-slate-50 hover:bg-indigo-50/70 hover:text-indigo-900 text-slate-700 border border-slate-200/60"
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Footer Bar */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]">
              {displayDateStr} · {displayTimeStr}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3.5 py-1 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
