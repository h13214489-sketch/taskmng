export type Language = "en" | "zh";
export type TaskStatus = "todo" | "pending" | "complete";
export type CalendarSeverity = "none" | "low" | "medium" | "high" | "overdue";

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface RestaurantMenuItem {
  id: string;
  restaurantName: string;
  qrCodeImage: string;
  createdAt: number;
  updatedAt: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export interface TaskSeries {
  id: string;
  name: string;
  detail: string;
  photo?: string;
  startDate: string;
  deadlineDay: number;
  isRoutine: boolean;
  endedAt?: string;
  isMustDo: boolean;
  tagIds: string[];
  createdAt: number;
}

export interface TaskOccurrence {
  id: string;
  seriesId: string;
  date: string;
  status: TaskStatus;
  completedAt?: string;
  completionPhoto?: string;
  deletedAt?: string;
}

export interface Settings {
  language: Language;
  notificationsEnabled: boolean;
  dailyReminderTime: string;
  lastReminderProcessedOn?: string;
}

export interface ResolvedTask {
  occurrenceId: string;
  seriesId: string;
  date: string;
  name: string;
  detail: string;
  photo?: string;
  isRoutine: boolean;
  isMustDo: boolean;
  tagIds: string[];
  status: TaskStatus;
  completionPhoto?: string;
}

export interface AppSnapshot {
  series: TaskSeries[];
  occurrences: TaskOccurrence[];
  checklistItems: ChecklistItem[];
  menuItems: RestaurantMenuItem[];
  tags: Tag[];
  settings: Settings;
}

export interface AddTaskInput {
  name: string;
  detail: string;
  photo?: string;
  deadline: string;
  isRoutine: boolean;
  isMustDo: boolean;
  tagIds: string[];
}
