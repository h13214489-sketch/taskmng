import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { CalendarGrid } from "@/components/calendar-grid";
import { TaskCard } from "@/components/task-card";
import { useAppStore } from "@/store/use-app-store";
import { buildCalendarSeverity, resolveTasksForDate, resolveTasksForMonth } from "@/utils/task-logic";
import { parseStorageDate } from "@/utils/date";

export default function CalendarPage() {
  const { t } = useTranslation();
  const {
    series,
    occurrences,
    checklistItems,
    menuItems,
    tags,
    settings,
    currentMonth,
    selectedDate,
    setSelectedDate,
    shiftCurrentMonth,
    setTaskStatus,
    openDetailSheet,
    openCompleteSheet,
  } = useAppStore();

  const snapshot = useMemo(
    () => ({ series, occurrences, checklistItems, menuItems, tags, settings }),
    [series, occurrences, checklistItems, menuItems, tags, settings],
  );
  const monthTasks = useMemo(() => resolveTasksForMonth(snapshot, parseStorageDate(currentMonth)), [snapshot, currentMonth]);
  const selectedTasks = useMemo(() => resolveTasksForDate(snapshot, selectedDate), [snapshot, selectedDate]);

  const severityByDate = useMemo(() => {
    return monthTasks.reduce<Record<string, ReturnType<typeof buildCalendarSeverity>>>((result, task) => {
      const related = monthTasks.filter((item) => item.date === task.date);
      result[task.date] = buildCalendarSeverity(related);
      return result;
    }, {});
  }, [monthTasks]);

  return (
    <div className="space-y-5">
      <section className="rounded-[32px] bg-blue-700 px-5 py-5 text-white shadow-xl shadow-blue-900/15">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="mt-1 text-lg font-semibold">
              {parseStorageDate(currentMonth).toLocaleDateString(settings.language === "zh" ? "zh-HK" : "en-GB", {
                month: "long",
                year: "numeric",
              })}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => shiftCurrentMonth(-1)}
              className="rounded-full border border-blue-500 p-2 text-blue-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => shiftCurrentMonth(1)}
              className="rounded-full border border-blue-500 p-2 text-blue-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-blue-100 bg-blue-50/70 p-4">
        <CalendarGrid
          month={currentMonth}
          selectedDate={selectedDate}
          severityByDate={severityByDate}
          onSelectDate={setSelectedDate}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{t("selectedDate")}</p>
            <h2 className="text-base font-semibold text-slate-900">{selectedDate}</h2>
          </div>
        </div>

        {selectedTasks.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
            {t("noTasks")}
          </div>
        ) : (
          selectedTasks
            .filter((task) => task.status !== "complete")
            .map((task) => (
              <TaskCard
                key={`${task.seriesId}-${task.date}`}
                task={task}
                tags={tags}
                onComplete={() => openCompleteSheet(task)}
                onPending={() => void setTaskStatus(task, "pending")}
                onSetTodo={() => void setTaskStatus(task, "todo")}
                onOpenDetail={() => openDetailSheet(task)}
              />
            ))
        )}
      </section>
    </div>
  );
}
