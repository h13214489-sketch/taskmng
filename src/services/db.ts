import Dexie, { type Table } from "dexie";

import {
  defaultOccurrences,
  defaultSeries,
  defaultSettings,
  defaultTags,
} from "@/data/sample-data";
import type { ChecklistGroup, ChecklistItem, RestaurantMenuItem, Settings, Tag, TaskOccurrence, TaskSeries } from "@/types/models";

class TaskListDatabase extends Dexie {
  taskSeries!: Table<TaskSeries, string>;
  taskOccurrences!: Table<TaskOccurrence, string>;
  checklistGroups!: Table<ChecklistGroup, string>;
  checklistItems!: Table<ChecklistItem, string>;
  menuItems!: Table<RestaurantMenuItem, string>;
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

    this.version(3).stores({
      taskSeries: "id, startDate, isRoutine, createdAt",
      taskOccurrences: "id, seriesId, date, status",
      checklistItems: "id, completed, createdAt",
      menuItems: "id, restaurantName, createdAt",
      tags: "id, name, createdAt",
      settings: "id",
    });

    this.version(4)
      .stores({
        taskSeries: "id, startDate, isRoutine, createdAt",
        taskOccurrences: "id, seriesId, date, status",
        checklistGroups: "id, createdAt",
        checklistItems: "id, groupId, completed, createdAt",
        menuItems: "id, restaurantName, createdAt",
        tags: "id, name, createdAt",
        settings: "id",
      })
      .upgrade(async (tx) => {
        const groupsTable = tx.table("checklistGroups") as Table<ChecklistGroup, string>;
        const itemsTable = tx.table("checklistItems") as Table<ChecklistItem, string>;

        const existingGroups = await groupsTable.toArray();
        const defaultGroup =
          existingGroups[0] ??
          ({
            id: crypto.randomUUID(),
            name: "General",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          } satisfies ChecklistGroup);

        if (existingGroups.length === 0) {
          await groupsTable.add(defaultGroup);
        }

        await itemsTable.toCollection().modify((item: any) => {
          if (!item.groupId) {
            item.groupId = defaultGroup.id;
            item.updatedAt = typeof item.updatedAt === "number" ? item.updatedAt : Date.now();
          }
        });
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
    const groups = await db.checklistGroups.toArray().catch(() => []);
    if (groups.length === 0) {
      const timestamp = Date.now();
      await db.checklistGroups.add({
        id: crypto.randomUUID(),
        name: "General",
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
    return;
  }

  await db.transaction("rw", db.taskSeries, db.taskOccurrences, db.tags, db.settings, db.checklistGroups, async () => {
    await db.taskSeries.bulkAdd(defaultSeries);
    await db.taskOccurrences.bulkAdd(defaultOccurrences);
    await db.tags.bulkAdd(defaultTags);
    await db.settings.put({ ...defaultSettings, id: "app-settings" });
    const timestamp = Date.now();
    await db.checklistGroups.add({
      id: crypto.randomUUID(),
      name: "General",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });
}

export async function loadSnapshot() {
  await ensureSeedData();

  const [series, occurrences, checklistGroups, checklistItems, menuItems, tags, settings] = await Promise.all([
    db.taskSeries.toArray(),
    db.taskOccurrences.toArray(),
    db.checklistGroups.toArray(),
    db.checklistItems.toArray(),
    db.menuItems.toArray(),
    db.tags.toArray(),
    db.settings.get("app-settings"),
  ]);

  return {
    series,
    occurrences,
    checklistGroups,
    checklistItems,
    menuItems,
    tags,
    settings: settings
      ? {
          language: settings.language,
          notificationsEnabled: settings.notificationsEnabled,
          dailyReminderTime: settings.dailyReminderTime,
          lastReminderProcessedOn: settings.lastReminderProcessedOn,
        }
      : defaultSettings,
  };
}
