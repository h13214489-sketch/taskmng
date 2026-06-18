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
  low: "bg-sky-50 text-sky-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-indigo-100 text-indigo-700",
  overdue: "bg-rose-50 text-rose-700",
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
                isSameMonth(day, monthDate) ? "border-transparent" : "border-slate-100 text-slate-300",
                isSelected && "ring-2 ring-blue-700 ring-offset-2 ring-offset-blue-50",
              )}
            >
              <span className={cn("font-semibold", isToday && "text-slate-900")}>{format(day, "d")}</span>
              {severity !== "none" ? (
                <span
                  className={cn(
                    "absolute bottom-2 left-2 h-2.5 w-2.5 rounded-full",
                    severity === "low" && "bg-sky-500",
                    severity === "medium" && "bg-blue-500",
                    severity === "high" && "bg-indigo-600",
                    severity === "overdue" && "bg-rose-500",
                  )}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
