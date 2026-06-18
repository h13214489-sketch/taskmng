import Dexie, { type Table } from "dexie";

import {
  defaultOccurrences,
  defaultSeries,
  defaultSettings,
  defaultTags,
} from "@/data/sample-data";
import type { ChecklistItem, Settings, Tag, TaskOccurrence, TaskSeries } from "@/types/models";

class TaskListDatabase extends Dexie {
  taskSeries!: Table<TaskSeries, string>;
  taskOccurrences!: Table<TaskOccurrence, string>;
  checklistItems!: Table<ChecklistItem, string>;
  tags!: Table<Tag, string>;
  settings!: Table<Settings & { id: string }, string>;

  constructor() {
    super("TaskListMobileApp");

    this.version(1).stores({
      taskSeries: "id, startDate, isRoutine, createdAt",
      taskOccurrences: "id, seriesId, date, status",
      tags: "id, name, createdAt",
      settings: "id",
    });

    this.version(2).stores({
      taskSeries: "id, startDate, isRoutine, createdAt",
      taskOccurrences: "id, seriesId, date, status",
      checklistItems: "id, completed, createdAt",
      tags: "id, name, createdAt",
      settings: "id",
    });
  }
}

export const db = new TaskListDatabase();

export async function ensureSeedData() {
  const count = await db.taskSeries.count();
  if (count > 0) {
    await Promise.all(
      defaultTags.map((tag) =>
        db.tags.update(tag.id, {
          color: tag.color,
        }),
      ),
    );
    return;
  }

  await db.transaction("rw", db.taskSeries, db.taskOccurrences, db.tags, db.settings, async () => {
    await db.taskSeries.bulkAdd(defaultSeries);
    await db.taskOccurrences.bulkAdd(defaultOccurrences);
    await db.tags.bulkAdd(defaultTags);
    await db.settings.put({ ...defaultSettings, id: "app-settings" });
  });
}

export async function loadSnapshot() {
  await ensureSeedData();

  const [series, occurrences, checklistItems, tags, settings] = await Promise.all([
    db.taskSeries.toArray(),
    db.taskOccurrences.toArray(),
    db.checklistItems.toArray(),
    db.tags.toArray(),
    db.settings.get("app-settings"),
  ]);

  return {
    series,
    occurrences,
    checklistItems,
    tags,
    settings: settings
      ? {
          language: settings.language,
          notificationsEnabled: settings.notificationsEnabled,
          dailyReminderTime: settings.dailyReminderTime,
          reminderSupportAcknowledged: settings.reminderSupportAcknowledged,
        }
      : defaultSettings,
  };
}
