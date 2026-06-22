import { isSameMonth } from "date-fns";

import type {
  AppSnapshot,
  CalendarSeverity,
  ResolvedTask,
  TaskOccurrence,
  TaskSeries,
} from "@/types/models";
import {
  buildMonthlyOccurrenceDate,
  isFutureOrToday,
  isMonthOnOrAfter,
  isPastDate,
  monthEnd,
  monthStart,
  parseStorageDate,
  todayStorageDate,
} from "@/utils/date";

function resolveOccurrenceStatus(
  occurrence: TaskOccurrence | undefined,
): TaskOccurrence["status"] {
  if (!occurrence) {
    return "todo";
  }

  return occurrence.status;
}

function isOccurrenceDeleted(occurrence?: TaskOccurrence) {
  return Boolean(occurrence?.deletedAt);
}

export function resolveTaskForDate(
  series: TaskSeries,
  occurrences: TaskOccurrence[],
  date: string,
): ResolvedTask | null {
  const matchingOccurrence = occurrences.find((item) => item.seriesId === series.id && item.date === date);

  if (isOccurrenceDeleted(matchingOccurrence)) {
    return null;
  }

  if (series.isRoutine) {
    if (!isMonthOnOrAfter(series.startDate, date)) {
      return null;
    }

    if (series.endedAt && !isFutureOrToday(series.endedAt, date)) {
      return null;
    }
  } else if (series.startDate !== date) {
    return null;
  }

  return {
    occurrenceId: matchingOccurrence?.id ?? `${series.id}:${date}`,
    seriesId: series.id,
    date,
    name: series.name,
    detail: series.detail,
    photo: series.photo,
    isRoutine: series.isRoutine,
    isMustDo: series.isMustDo,
    tagIds: series.tagIds,
    status: resolveOccurrenceStatus(matchingOccurrence),
    completionPhoto: matchingOccurrence?.completionPhoto,
  };
}

export function resolveTasksForMonth(snapshot: AppSnapshot, monthDate: Date) {
  const start = monthStart(monthDate);
  const end = monthEnd(monthDate);
  const results: ResolvedTask[] = [];

  snapshot.series.forEach((series) => {
    if (series.isRoutine) {
      const date = buildMonthlyOccurrenceDate(monthDate, series.deadlineDay);
      const resolved = resolveTaskForDate(series, snapshot.occurrences, date);
      if (resolved) {
        results.push(resolved);
      }
      return;
    }

    const taskDate = parseStorageDate(series.startDate);
    if (taskDate >= start && taskDate <= end) {
      const resolved = resolveTaskForDate(series, snapshot.occurrences, series.startDate);
      if (resolved) {
        results.push(resolved);
      }
    }
  });

  return results.sort((left, right) => left.date.localeCompare(right.date) || left.name.localeCompare(right.name));
}

export function resolveTasksForDate(snapshot: AppSnapshot, date: string) {
  const target = parseStorageDate(date);

  return snapshot.series
    .map((series) => {
      if (series.isRoutine) {
        const routineDate = buildMonthlyOccurrenceDate(target, series.deadlineDay);
        return resolveTaskForDate(series, snapshot.occurrences, routineDate);
      }

      return resolveTaskForDate(series, snapshot.occurrences, series.startDate);
    })
    .filter((task): task is ResolvedTask => Boolean(task) && task.date === date)
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function resolveActiveTasks(snapshot: AppSnapshot) {
  const today = todayStorageDate();
  const todayMonth = monthStart(today);
  const nextYearMonths = Array.from({ length: 12 }, (_, index) => {
    const month = new Date(todayMonth.getFullYear(), todayMonth.getMonth() + index, 1);
    return month;
  });

  const upcomingRoutineTasks = nextYearMonths.flatMap((month) => resolveTasksForMonth(snapshot, month));
  const oneOffTasks = snapshot.series
    .filter((series) => !series.isRoutine)
    .map((series) => resolveTaskForDate(series, snapshot.occurrences, series.startDate))
    .filter((task): task is ResolvedTask => Boolean(task));

  const unique = new Map<string, ResolvedTask>();
  [...oneOffTasks, ...upcomingRoutineTasks].forEach((task) => {
    unique.set(`${task.seriesId}:${task.date}`, task);
  });

  return [...unique.values()].sort((left, right) => left.date.localeCompare(right.date));
}

export function splitTaskSections(tasks: ResolvedTask[], compareDate = todayStorageDate()) {
  const visible = tasks.filter((task) => task.status !== "complete");

  return {
    outstanding: visible.filter((task) => isPastDate(task.date, compareDate)),
    todo: visible.filter((task) => isFutureOrToday(task.date, compareDate)),
  };
}

export function resolveReminderTasks(snapshot: AppSnapshot, compareDate = todayStorageDate()) {
  return resolveActiveTasks(snapshot)
    .filter((task) => task.status === "todo" || task.status === "pending")
    .filter((task) => task.date === compareDate || isPastDate(task.date, compareDate))
    .sort((left, right) => left.date.localeCompare(right.date) || left.name.localeCompare(right.name));
}

export function buildCalendarSeverity(tasks: ResolvedTask[], compareDate = todayStorageDate()): CalendarSeverity {
  const activeTasks = tasks.filter((task) => task.status !== "complete");
  const mustDoCount = activeTasks.filter((task) => task.isMustDo).length;
  const hasOverdueTask = activeTasks.some((task) => isPastDate(task.date, compareDate));

  if (hasOverdueTask) {
    return "overdue";
  }

  if (mustDoCount > 0 || activeTasks.length >= 4) {
    return "high";
  }

  if (activeTasks.length >= 2) {
    return "medium";
  }

  if (activeTasks.length >= 1) {
    return "low";
  }

  return "none";
}

export function hasTasksInMonth(snapshot: AppSnapshot, monthDate: Date) {
  return snapshot.series.some((series) => {
    if (series.isRoutine) {
      return isMonthOnOrAfter(series.startDate, buildMonthlyOccurrenceDate(monthDate, series.deadlineDay));
    }

    return isSameMonth(parseStorageDate(series.startDate), monthDate);
  });
}

export function resolveCompletedTasks(snapshot: AppSnapshot) {
  const seriesMap = new Map(snapshot.series.map((series) => [series.id, series] as const));

  return snapshot.occurrences
    .filter((occurrence) => occurrence.status === "complete" && !occurrence.deletedAt)
    .map((occurrence) => {
      const series = seriesMap.get(occurrence.seriesId);
      if (!series) {
        return null;
      }

      const resolved = resolveTaskForDate(series, snapshot.occurrences, occurrence.date);
      if (!resolved || resolved.status !== "complete") {
        return null;
      }

      return resolved;
    })
    .filter((task): task is ResolvedTask => Boolean(task))
    .sort((left, right) => right.date.localeCompare(left.date) || left.name.localeCompare(right.name));
}
