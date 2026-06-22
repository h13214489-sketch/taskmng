import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { CalendarGrid } from "@/components/calendar-grid";
import { TaskCard } from "@/components/task-card";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";
import type { Language } from "@/types/models";
import { buildCalendarSeverity, resolveTasksForDate, resolveTasksForMonth } from "@/utils/task-logic";
import { parseStorageDate, toStorageDate, todayStorageDate } from "@/utils/date";

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
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<"month" | "year">("month");
  const [pickerYear, setPickerYear] = useState<number>(() => parseStorageDate(currentMonth).getFullYear());
  const [pickerMonth, setPickerMonth] = useState<number>(() => parseStorageDate(currentMonth).getMonth());
  const [pickerDecadeStart, setPickerDecadeStart] = useState<number>(() => Math.floor(pickerYear / 10) * 10);

  const snapshot = useMemo(
    () => ({ series, occurrences, checklistItems, menuItems, tags, settings }),
    [series, occurrences, checklistItems, menuItems, tags, settings],
  );
  const monthTasks = useMemo(() => resolveTasksForMonth(snapshot, parseStorageDate(currentMonth)), [snapshot, currentMonth]);
  const selectedTasks = useMemo(() => resolveTasksForDate(snapshot, selectedDate), [snapshot, selectedDate]);
  const isSelectedToday = selectedDate === todayStorageDate();

  const severityByDate = useMemo(() => {
    return monthTasks.reduce<Record<string, ReturnType<typeof buildCalendarSeverity>>>((result, task) => {
      const related = monthTasks.filter((item) => item.date === task.date);
      result[task.date] = buildCalendarSeverity(related);
      return result;
    }, {});
  }, [monthTasks]);

  useEffect(() => {
    if (!monthPickerOpen) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [monthPickerOpen]);

  function openMonthPicker() {
    const monthDate = parseStorageDate(currentMonth);
    const year = monthDate.getFullYear();
    setPickerYear(year);
    setPickerMonth(monthDate.getMonth());
    setPickerDecadeStart(Math.floor(year / 10) * 10);
    setPickerMode("month");
    setMonthPickerOpen(true);
  }

  function closeMonthPicker() {
    setMonthPickerOpen(false);
  }

  function monthLabel(language: Language, monthIndex: number) {
    if (language === "zh") {
      return `${monthIndex + 1}月`;
    }

    return new Date(2020, monthIndex, 1).toLocaleDateString("en-GB", { month: "short" });
  }

  function handleSelectMonth(monthIndex: number) {
    const nextDate = toStorageDate(new Date(pickerYear, monthIndex, 1));
    setPickerMonth(monthIndex);
    setSelectedDate(nextDate);
    closeMonthPicker();
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-white/20 bg-gradient-to-br from-teal-500 via-cyan-500 to-sky-500 px-4 text-white shadow-xl shadow-teal-900/10">
        <div className="flex h-12 items-center justify-between gap-3">
          <div>
            <button
              type="button"
              onClick={openMonthPicker}
              className="inline-flex items-center gap-1 text-left text-sm font-semibold text-white/95"
            >
              <span>
                {parseStorageDate(currentMonth).toLocaleDateString(settings.language === "zh" ? "zh-HK" : "en-GB", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <ChevronDown className="h-4 w-4 text-white/70" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => shiftCurrentMonth(-1)}
              className="rounded-full border border-white/15 bg-white/5 p-1.5 text-white/90 backdrop-blur-sm transition hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => shiftCurrentMonth(1)}
              className="rounded-full border border-white/15 bg-white/5 p-1.5 text-white/90 backdrop-blur-sm transition hover:bg-white/10"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="-ml-14 w-[calc(100%+3.5rem)] rounded-[32px] border border-teal-100 bg-white/75 p-3 shadow-sm shadow-teal-900/5">
        <CalendarGrid
          month={currentMonth}
          selectedDate={selectedDate}
          severityByDate={severityByDate}
          onSelectDate={setSelectedDate}
        />
      </section>

      <section className="-ml-14 w-[calc(100%+3.5rem)] space-y-3">
        <h2
          className={
            isSelectedToday
              ? "text-base font-extrabold text-slate-950"
              : "text-base font-semibold text-slate-900"
          }
        >
          {selectedDate}
        </h2>

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

      {monthPickerOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/30 px-4 backdrop-blur-sm"
          onClick={closeMonthPicker}
        >
          <section
            className="w-full max-w-[22rem] rounded-[28px] bg-white p-4 shadow-2xl shadow-slate-900/15"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              {pickerMode === "year" ? (
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  {pickerDecadeStart} - {pickerDecadeStart + 9}
                </p>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPickerYear((value) => value - 1)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700"
                    aria-label="Previous year"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPickerDecadeStart(Math.floor(pickerYear / 10) * 10);
                      setPickerMode("year");
                    }}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900"
                  >
                    {pickerYear}
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickerYear((value) => value + 1)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700"
                    aria-label="Next year"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={closeMonthPicker}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700"
                aria-label={t("close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {pickerMode === "year" ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setPickerDecadeStart((value) => value - 10)}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {pickerDecadeStart - 10}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickerDecadeStart((value) => value + 10)}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
                  >
                    {pickerDecadeStart + 10}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 12 }, (_, index) => pickerDecadeStart + index).map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => {
                        setPickerYear(year);
                        setPickerMode("month");
                      }}
                      className={cn(
                        "h-12 rounded-2xl text-sm font-semibold transition",
                        year === pickerYear
                          ? "bg-blue-700 text-white shadow-lg shadow-blue-900/15"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                      )}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-4 gap-2">
                {Array.from({ length: 12 }, (_, index) => index).map((monthIndex) => (
                  <button
                    key={monthIndex}
                    type="button"
                    onClick={() => handleSelectMonth(monthIndex)}
                    className={cn(
                      "h-12 rounded-2xl text-sm font-semibold transition",
                      monthIndex === pickerMonth
                        ? "bg-blue-700 text-white shadow-lg shadow-blue-900/15"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                    )}
                  >
                    {monthLabel(settings.language, monthIndex)}
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
