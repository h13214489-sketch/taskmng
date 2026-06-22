import type { Settings, Tag, TaskOccurrence, TaskSeries } from "@/types/models";
import { todayStorageDate } from "@/utils/date";

const today = todayStorageDate();
const [year, month] = today.split("-").map(Number);

function buildDate(dayOffset: number) {
  const date = new Date(year, (month ?? 1) - 1, Number(today.slice(-2)) + dayOffset);
  return date.toISOString().slice(0, 10);
}

export const defaultTags: Tag[] = [
  { id: "tag-credit", name: "Credit Card", color: "#ef4444", createdAt: Date.now() - 10000 },
  { id: "tag-home", name: "Home", color: "#22c55e", createdAt: Date.now() - 9000 },
  { id: "tag-work", name: "Work", color: "#3b82f6", createdAt: Date.now() - 8000 },
];

export const defaultSeries: TaskSeries[] = [
  {
    id: "series-rent",
    name: "Pay apartment rent",
    detail: "Transfer rent and save the receipt screenshot.",
    startDate: buildDate(-25),
    deadlineDay: 5,
    isRoutine: true,
    isMustDo: true,
    tagIds: ["tag-home"],
    createdAt: Date.now() - 7000,
  },
  {
    id: "series-credit",
    name: "Credit card payment",
    detail: "Check statement total and submit payment before cutoff.",
    startDate: buildDate(-40),
    deadlineDay: 12,
    isRoutine: true,
    isMustDo: true,
    tagIds: ["tag-credit"],
    createdAt: Date.now() - 6000,
  },
  {
    id: "series-report",
    name: "Submit monthly report",
    detail: "Upload the operations report to the team drive.",
    startDate: buildDate(-2),
    deadlineDay: new Date(buildDate(2)).getDate(),
    isRoutine: false,
    isMustDo: false,
    tagIds: ["tag-work"],
    createdAt: Date.now() - 5000,
  },
  {
    id: "series-insurance",
    name: "Renew insurance document",
    detail: "Take a photo of the updated paper copy and keep it in the app.",
    startDate: buildDate(4),
    deadlineDay: new Date(buildDate(4)).getDate(),
    isRoutine: false,
    isMustDo: false,
    tagIds: ["tag-home"],
    createdAt: Date.now() - 4000,
  },
];

export const defaultOccurrences: TaskOccurrence[] = [
  {
    id: "occ-credit-last-month",
    seriesId: "series-credit",
    date: buildDate(-18),
    status: "complete",
    completedAt: buildDate(-18),
  },
];

export const defaultSettings: Settings = {
  language: "en",
  notificationsEnabled: false,
  dailyReminderTime: "09:00",
};
