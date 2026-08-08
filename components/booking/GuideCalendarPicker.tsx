"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, Ban } from "lucide-react";

interface GuideCalendarPickerProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  availableDays?: string[]; // e.g. ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
}

export default function GuideCalendarPicker({
  selectedDate,
  onSelectDate,
  availableDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
}: GuideCalendarPickerProps) {
  const [viewDate, setViewDate] = useState(() => {
    if (selectedDate) {
      const [y, m, d] = selectedDate.split("-").map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayHeaders = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const fullDayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Calculate calendar grid for current month
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate calendar day cells
  const calendarCells = [];

  // Previous month padding
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push({ isPadding: true, key: `pad-${i}` });
  }

  // Days of current month
  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const cellDate = new Date(year, month, dayNum);
    cellDate.setHours(0, 0, 0, 0);

    const yearStr = year.toString();
    const monthStr = String(month + 1).padStart(2, "0");
    const dayStr = String(dayNum).padStart(2, "0");
    const dateStr = `${yearStr}-${monthStr}-${dayStr}`;

    const dayNameIndex = cellDate.getDay();
    const dayNameFull = fullDayNames[dayNameIndex];

    const isPast = cellDate < today;
    const isGuideOff = availableDays.length > 0 && !availableDays.includes(dayNameFull);
    const isDisabled = isPast || isGuideOff;
    const isSelected = selectedDate === dateStr;

    calendarCells.push({
      isPadding: false,
      key: dateStr,
      dayNum,
      dateStr,
      dayNameFull,
      isPast,
      isGuideOff,
      isDisabled,
      isSelected,
    });
  }

  const formatSelectedDisplay = () => {
    if (!selectedDate) return "Select a date...";
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="bg-white rounded-2xl border border-dark-200 p-4 space-y-3 shadow-xs">
      
      {/* Month & Year Navigation Header */}
      <div className="flex items-center justify-between pb-2 border-b border-dark-150">
        <div className="flex items-center gap-1.5 font-bold text-dark-900 text-sm">
          <CalendarIcon className="w-4 h-4 text-primary" />
          <span>{monthNames[month]} {year}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1 hover:bg-dark-100 rounded-lg text-dark-600 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1 hover:bg-dark-100 rounded-lg text-dark-600 transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Guide Availability Legend */}
      <div className="flex items-center justify-between text-[11px] px-1 font-medium text-dark-500">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Available
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-300 inline-block" /> Guide OFF (Disabled)
        </span>
      </div>

      {/* Day Headers (Su, Mo, Tu...) */}
      <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-dark-400">
        {dayHeaders.map((dh) => (
          <div key={dh} className="py-1">{dh}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {calendarCells.map((cell) => {
          if (cell.isPadding) {
            return <div key={cell.key} className="h-9" />;
          }

          if (cell.isDisabled) {
            return (
              <button
                key={cell.key}
                type="button"
                disabled
                className={`h-9 rounded-xl flex flex-col items-center justify-center text-xs font-semibold cursor-not-allowed transition-all select-none ${
                  cell.isGuideOff
                    ? "bg-rose-50 text-rose-300 border border-rose-150 line-through opacity-60"
                    : "bg-dark-50 text-dark-300 opacity-40 line-through"
                }`}
                title={cell.isGuideOff ? `Guide is OFF on ${cell.dayNameFull}s` : "Past date"}
              >
                <span>{cell.dayNum}</span>
              </button>
            );
          }

          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => cell.dateStr && onSelectDate(cell.dateStr)}
              className={`h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                cell.isSelected
                  ? "bg-primary text-white shadow-md border-2 border-primary scale-105"
                  : "bg-white text-dark-900 border border-dark-200 hover:border-primary hover:bg-primary/10 hover:text-primary"
              }`}
            >
              {cell.dayNum}
            </button>
          );
        })}
      </div>

      {/* Selected Date Summary */}
      {selectedDate ? (
        <div className="pt-2 border-t border-dark-150 flex items-center justify-between text-xs">
          <span className="text-dark-500 font-medium">Selected Date:</span>
          <span className="font-bold text-primary flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {formatSelectedDisplay()}
          </span>
        </div>
      ) : (
        <div className="pt-2 border-t border-dark-150 text-center text-xs text-rose-600 font-semibold">
          Please select an available date above.
        </div>
      )}

    </div>
  );
}
