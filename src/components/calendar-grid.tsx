import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import { cn } from "@/lib/utils";
import type { CalendarSeverity } from "@/types/models";
import { parseStorageDate, todayStorageDate, toStorageDate } from "@/utils/date";

interface CalendarGridProps {
  month: string;
  selectedDate: string;
  severityByDate: Record<string, CalendarSeverity>;
  onSelectDate: (date: string) => void;
}

const severityStyles: Record<CalendarSeverity, string> = {
  none: "bg-white text-slate-500",
  low: "bg-amber-50 text-amber-800",
  medium: "bg-orange-100 text-orange-800",
  high: "bg-pink-100 text-pink-800",
  overdue: "bg-rose-100 text-rose-800",
};

const severityEdgeStyles: Record<CalendarSeverity, string> = {
  none: "border-transparent",
  low: "border-amber-400/80",
  medium: "border-orange-500/80",
  high: "border-pink-500/80",
  overdue: "border-rose-500/80",
};

export function CalendarGrid({ month, selectedDate, severityByDate, onSelectDate }: CalendarGridProps) {
  const monthDate = parseStorageDate(month);
  const range = eachDayOfInterval({
    start: startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 }),
  });
  const today = todayStorageDate();

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {range.map((day) => {
          const storageDate = toStorageDate(day);
          const severity = severityByDate[storageDate] ?? "none";
          const hasTasks = severity !== "none";
          const isSelected = storageDate === selectedDate;
          const isToday = storageDate === today;

          return (
            <button
              key={storageDate}
              type="button"
              onClick={() => onSelectDate(storageDate)}
              className={cn(
                "relative aspect-square rounded-2xl border p-2 text-left text-xs transition",
                severityStyles[severity],
                isSameMonth(day, monthDate)
                  ? cn(hasTasks && "border-2", severityEdgeStyles[severity])
                  : "border-slate-100 text-slate-300",
                isSelected && "ring-2 ring-rose-600 ring-offset-2 ring-offset-rose-50",
                !isSelected && isToday && "ring-2 ring-slate-900/40 ring-offset-2 ring-offset-rose-50",
                isToday && "shadow-sm shadow-slate-900/10",
              )}
            >
              <span className={cn("font-semibold", isToday && "font-extrabold text-slate-950")}>{format(day, "d")}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
