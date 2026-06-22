import { describe, expect, it } from "vitest";

import type { AppSnapshot, TaskOccurrence, TaskSeries } from "@/types/models";
import { buildCalendarSeverity, resolveTasksForDate, splitTaskSections } from "@/utils/task-logic";

const baseSeries: TaskSeries[] = [
  {
    id: "routine-1",
    name: "Pay rent",
    detail: "",
    startDate: "2026-05-05",
    deadlineDay: 5,
    isRoutine: true,
    isMustDo: true,
    tagIds: [],
    createdAt: 1,
  },
  {
    id: "oneoff-1",
    name: "Submit report",
    detail: "",
    startDate: "2026-06-10",
    deadlineDay: 10,
    isRoutine: false,
    isMustDo: false,
    tagIds: [],
    createdAt: 2,
  },
];

function createSnapshot(occurrences: TaskOccurrence[]): AppSnapshot {
  return {
    series: baseSeries,
    occurrences,
    checklistItems: [],
    menuItems: [],
    tags: [],
    settings: {
      language: "en",
      notificationsEnabled: false,
      dailyReminderTime: "09:00",
      reminderSupportAcknowledged: false,
    },
  };
}

describe("task logic", () => {
  it("keeps routine tasks visible for future months", () => {
    const snapshot = createSnapshot([]);
    const tasks = resolveTasksForDate(snapshot, "2026-06-05");

    expect(tasks).toHaveLength(1);
    expect(tasks[0]?.name).toBe("Pay rent");
  });

  it("hides only the completed routine occurrence", () => {
    const snapshot = createSnapshot([
      {
        id: "occ-1",
        seriesId: "routine-1",
        date: "2026-06-05",
        status: "complete",
        completedAt: "2026-06-05",
      },
    ]);

    const currentMonth = resolveTasksForDate(snapshot, "2026-06-05");
    const nextMonth = resolveTasksForDate(snapshot, "2026-07-05");

    expect(currentMonth[0]?.status).toBe("complete");
    expect(nextMonth[0]?.status).toBe("todo");
  });

  it("splits overdue and upcoming tasks by deadline", () => {
    const sections = splitTaskSections(
      [
        {
          occurrenceId: "1",
          seriesId: "a",
          date: "2026-06-01",
          name: "Past",
          detail: "",
          isRoutine: false,
          isMustDo: false,
          tagIds: [],
          status: "todo",
        },
        {
          occurrenceId: "2",
          seriesId: "b",
          date: "2026-06-21",
          name: "Future",
          detail: "",
          isRoutine: false,
          isMustDo: false,
          tagIds: [],
          status: "todo",
        },
      ],
      "2026-06-10",
    );

    expect(sections.outstanding).toHaveLength(1);
    expect(sections.todo).toHaveLength(1);
  });

  it("marks days with must-do tasks as high severity", () => {
    const severity = buildCalendarSeverity([
      {
        occurrenceId: "1",
        seriesId: "a",
        date: "2026-06-05",
        name: "Pay rent",
        detail: "",
        isRoutine: true,
        isMustDo: true,
        tagIds: [],
        status: "todo",
      },
    ], "2026-06-01");

    expect(severity).toBe("high");
  });

  it("marks overdue days as overdue severity", () => {
    const severity = buildCalendarSeverity(
      [
        {
          occurrenceId: "1",
          seriesId: "a",
          date: "2026-06-01",
          name: "Past task",
          detail: "",
          isRoutine: false,
          isMustDo: false,
          tagIds: [],
          status: "todo",
        },
      ],
      "2026-06-10",
    );

    expect(severity).toBe("overdue");
  });
});
