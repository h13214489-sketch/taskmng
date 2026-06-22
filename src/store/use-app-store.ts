import { addMonths } from "date-fns";
import { create } from "zustand";

import { db, loadSnapshot } from "@/services/db";
import type {
  AddTaskInput,
  AppSnapshot,
  ChecklistItem,
  Language,
  RestaurantMenuItem,
  ResolvedTask,
  Settings,
  Tag,
  TaskOccurrence,
  TaskSeries,
} from "@/types/models";
import { parseDisplayDate, toStorageDate, todayStorageDate } from "@/utils/date";

type EditorMode = "create" | "detail" | "complete" | null;

interface AppStore extends AppSnapshot {
  isReady: boolean;
  menuExpanded: boolean;
  currentMonth: string;
  selectedDate: string;
  activeTagId: string | null;
  editorMode: EditorMode;
  editorTask: ResolvedTask | null;
  loadApp: () => Promise<void>;
  toggleMenu: () => void;
  setSelectedDate: (date: string) => void;
  setCurrentMonth: (date: string) => void;
  shiftCurrentMonth: (offset: number) => void;
  setActiveTagId: (tagId: string | null) => void;
  openCreateSheet: (date?: string) => void;
  openDetailSheet: (task: ResolvedTask) => void;
  openCompleteSheet: (task: ResolvedTask) => void;
  closeSheet: () => void;
  addTask: (input: AddTaskInput) => Promise<void>;
  setTaskStatus: (task: ResolvedTask, status: TaskOccurrence["status"], completionPhoto?: string) => Promise<void>;
  deleteTask: (task: ResolvedTask) => Promise<void>;
  endRoutineTask: (task: ResolvedTask) => Promise<void>;
  addChecklistItem: (title: string) => Promise<void>;
  toggleChecklistItem: (itemId: string) => Promise<void>;
  deleteChecklistItems: (itemIds: string[]) => Promise<void>;
  addMenuItem: (restaurantName: string, qrCodeImage: string) => Promise<void>;
  deleteMenuItem: (itemId: string) => Promise<void>;
  addTag: (name: string, color: string) => Promise<void>;
  deleteTag: (tagId: string) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  setLanguage: (language: Language) => Promise<void>;
}

const initialDate = todayStorageDate();

const defaultState: AppSnapshot = {
  series: [],
  occurrences: [],
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

function createSeriesFromInput(input: AddTaskInput): TaskSeries {
  const parsedDate = parseDisplayDate(input.deadline);
  return {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    detail: input.detail.trim(),
    photo: input.photo,
    startDate: toStorageDate(parsedDate),
    deadlineDay: parsedDate.getDate(),
    isRoutine: input.isRoutine,
    isMustDo: input.isMustDo,
    tagIds: input.tagIds,
    createdAt: Date.now(),
  };
}

function createOccurrenceForSeries(series: TaskSeries): TaskOccurrence {
  return {
    id: crypto.randomUUID(),
    seriesId: series.id,
    date: series.startDate,
    status: "todo",
  };
}

function createChecklistItem(title: string): ChecklistItem {
  const timestamp = Date.now();
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    completed: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function createMenuItem(restaurantName: string, qrCodeImage: string): RestaurantMenuItem {
  const timestamp = Date.now();
  return {
    id: crypto.randomUUID(),
    restaurantName: restaurantName.trim(),
    qrCodeImage,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

async function persistSettings(settings: Settings) {
  await db.settings.put({ id: "app-settings", ...settings });
}

export const useAppStore = create<AppStore>((set, get) => ({
  ...defaultState,
  isReady: false,
  menuExpanded: false,
  currentMonth: initialDate,
  selectedDate: initialDate,
  activeTagId: null,
  editorMode: null,
  editorTask: null,

  async loadApp() {
    const snapshot = await loadSnapshot();
    set({
      ...snapshot,
      isReady: true,
      currentMonth: snapshot.settings.language ? initialDate : initialDate,
      selectedDate: initialDate,
    });
  },

  toggleMenu() {
    set((state) => ({ menuExpanded: !state.menuExpanded }));
  },

  setSelectedDate(date) {
    set({ selectedDate: date, currentMonth: date });
  },

  setCurrentMonth(date) {
    set({ currentMonth: date });
  },

  shiftCurrentMonth(offset) {
    const current = new Date(`${get().currentMonth}T00:00:00`);
    set({ currentMonth: toStorageDate(addMonths(current, offset)) });
  },

  setActiveTagId(tagId) {
    set({ activeTagId: tagId });
  },

  openCreateSheet(date) {
    if (date) {
      set({ selectedDate: date });
    }

    set({ editorMode: "create", editorTask: null });
  },

  openDetailSheet(task) {
    set({ editorMode: "detail", editorTask: task });
  },

  openCompleteSheet(task) {
    set({ editorMode: "complete", editorTask: task });
  },

  closeSheet() {
    set({ editorMode: null, editorTask: null });
  },

  async addTask(input) {
    const series = createSeriesFromInput(input);
    const occurrence = createOccurrenceForSeries(series);

    await db.transaction("rw", db.taskSeries, db.taskOccurrences, async () => {
      await db.taskSeries.add(series);
      await db.taskOccurrences.add(occurrence);
    });

    set((state) => ({
      series: [...state.series, series],
      occurrences: [...state.occurrences, occurrence],
      selectedDate: series.startDate,
      currentMonth: series.startDate,
      editorMode: null,
      editorTask: null,
    }));
  },

  async setTaskStatus(task, status, completionPhoto) {
    const existing = get().occurrences.find((item) => item.seriesId === task.seriesId && item.date === task.date);
    const nextOccurrence: TaskOccurrence = existing
      ? {
          ...existing,
          status,
          completedAt: status === "complete" ? todayStorageDate() : undefined,
          completionPhoto: status === "complete" ? completionPhoto ?? existing.completionPhoto : undefined,
        }
      : {
          id: crypto.randomUUID(),
          seriesId: task.seriesId,
          date: task.date,
          status,
          completedAt: status === "complete" ? todayStorageDate() : undefined,
          completionPhoto: status === "complete" ? completionPhoto : undefined,
        };

    await db.taskOccurrences.put(nextOccurrence);

    set((state) => ({
      occurrences: state.occurrences.some((item) => item.id === nextOccurrence.id)
        ? state.occurrences.map((item) => (item.id === nextOccurrence.id ? nextOccurrence : item))
        : [...state.occurrences, nextOccurrence],
      editorTask: state.editorTask?.occurrenceId === task.occurrenceId
        ? { ...state.editorTask, status: nextOccurrence.status, completionPhoto: nextOccurrence.completionPhoto }
        : state.editorTask,
    }));
  },

  async deleteTask(task) {
    const series = get().series.find((item) => item.id === task.seriesId);
    if (!series) {
      return;
    }

    if (!series.isRoutine) {
      await db.transaction("rw", db.taskSeries, db.taskOccurrences, async () => {
        await db.taskSeries.delete(series.id);
        const relatedIds = get()
          .occurrences.filter((item) => item.seriesId === series.id)
          .map((item) => item.id);
        if (relatedIds.length > 0) {
          await db.taskOccurrences.bulkDelete(relatedIds);
        }
      });

      set((state) => ({
        series: state.series.filter((item) => item.id !== series.id),
        occurrences: state.occurrences.filter((item) => item.seriesId !== series.id),
        editorMode: null,
        editorTask: null,
      }));
      return;
    }

    const existing = get().occurrences.find((item) => item.seriesId === task.seriesId && item.date === task.date);
    const nextOccurrence: TaskOccurrence = existing
      ? { ...existing, deletedAt: todayStorageDate() }
      : {
          id: crypto.randomUUID(),
          seriesId: task.seriesId,
          date: task.date,
          status: task.status,
          deletedAt: todayStorageDate(),
        };

    await db.taskOccurrences.put(nextOccurrence);
    set((state) => ({
      occurrences: state.occurrences.some((item) => item.id === nextOccurrence.id)
        ? state.occurrences.map((item) => (item.id === nextOccurrence.id ? nextOccurrence : item))
        : [...state.occurrences, nextOccurrence],
      editorMode: null,
      editorTask: null,
    }));
  },

  async endRoutineTask(task) {
    const series = get().series.find((item) => item.id === task.seriesId && item.isRoutine);
    if (!series) {
      return;
    }

    const updatedSeries = { ...series, endedAt: task.date };
    await db.taskSeries.put(updatedSeries);

    set((state) => ({
      series: state.series.map((item) => (item.id === updatedSeries.id ? updatedSeries : item)),
      editorMode: null,
      editorTask: null,
    }));
  },

  async addChecklistItem(title) {
    if (!title.trim()) {
      return;
    }

    const item = createChecklistItem(title);
    await db.checklistItems.add(item);
    set((state) => ({ checklistItems: [...state.checklistItems, item] }));
  },

  async toggleChecklistItem(itemId) {
    const existing = get().checklistItems.find((item) => item.id === itemId);
    if (!existing) {
      return;
    }

    const nextItem: ChecklistItem = {
      ...existing,
      completed: !existing.completed,
      updatedAt: Date.now(),
    };
    await db.checklistItems.put(nextItem);
    set((state) => ({
      checklistItems: state.checklistItems.map((item) => (item.id === nextItem.id ? nextItem : item)),
    }));
  },

  async deleteChecklistItems(itemIds) {
    if (itemIds.length === 0) {
      return;
    }

    await db.checklistItems.bulkDelete(itemIds);
    set((state) => ({
      checklistItems: state.checklistItems.filter((item) => !itemIds.includes(item.id)),
    }));
  },

  async addMenuItem(restaurantName, qrCodeImage) {
    if (!restaurantName.trim() || !qrCodeImage) {
      return;
    }

    const item = createMenuItem(restaurantName, qrCodeImage);
    await db.menuItems.add(item);
    set((state) => ({ menuItems: [...state.menuItems, item] }));
  },

  async deleteMenuItem(itemId) {
    await db.menuItems.delete(itemId);
    set((state) => ({
      menuItems: state.menuItems.filter((item) => item.id !== itemId),
    }));
  },

  async addTag(name, color) {
    const tag: Tag = {
      id: crypto.randomUUID(),
      name: name.trim(),
      color,
      createdAt: Date.now(),
    };

    await db.tags.add(tag);
    set((state) => ({ tags: [...state.tags, tag] }));
  },

  async deleteTag(tagId) {
    await db.transaction("rw", db.tags, db.taskSeries, async () => {
      await db.tags.delete(tagId);
      const seriesToUpdate = get().series.filter((item) => item.tagIds.includes(tagId));
      await Promise.all(
        seriesToUpdate.map((series) =>
          db.taskSeries.put({
            ...series,
            tagIds: series.tagIds.filter((item) => item !== tagId),
          }),
        ),
      );
    });

    set((state) => ({
      tags: state.tags.filter((item) => item.id !== tagId),
      series: state.series.map((item) => ({
        ...item,
        tagIds: item.tagIds.filter((id) => id !== tagId),
      })),
      activeTagId: state.activeTagId === tagId ? null : state.activeTagId,
    }));
  },

  async updateSettings(patch) {
    const nextSettings = { ...get().settings, ...patch };
    await persistSettings(nextSettings);
    set({ settings: nextSettings });
  },

  async setLanguage(language) {
    const nextSettings = { ...get().settings, language };
    await persistSettings(nextSettings);
    set({ settings: nextSettings });
  },
}));
