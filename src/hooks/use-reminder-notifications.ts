import { useEffect, useMemo } from "react";

import { useAppStore } from "@/store/use-app-store";
import type { Language, ResolvedTask } from "@/types/models";
import { todayStorageDate } from "@/utils/date";
import { resolveReminderTasks } from "@/utils/task-logic";

const CHECK_INTERVAL_MS = 30 * 1000;

function hasReachedReminderTime(reminderTime: string, now: Date) {
  const [hoursText = "0", minutesText = "0"] = reminderTime.split(":");
  const hours = Number.parseInt(hoursText, 10);
  const minutes = Number.parseInt(minutesText, 10);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return false;
  }

  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);
  return now >= target;
}

function buildReminderTitle(language: Language, count: number) {
  return language === "zh"
    ? `你今天有 ${count} 個待辨事項`
    : `You have ${count} tasks to handle today`;
}

function buildReminderBody(tasks: ResolvedTask[]) {
  return tasks.map((task) => `- ${task.name}`).join("\n");
}

async function deliverReminderNotification(language: Language, tasks: ResolvedTask[]) {
  const title = buildReminderTitle(language, tasks.length);
  const body = buildReminderBody(tasks);
  const icon = `${import.meta.env.BASE_URL}pwa-192x192.png`;
  const badge = `${import.meta.env.BASE_URL}pwa-64x64.png`;

  const registration = await navigator.serviceWorker.ready.catch(() => null);
  if (registration) {
    await registration.showNotification(title, {
      body,
      icon,
      badge,
      tag: `daily-reminder-${todayStorageDate()}`,
      renotify: false,
    });
    return true;
  }

  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    return false;
  }

  new Notification(title, { body, icon });
  return true;
}

export function useReminderNotifications() {
  const { isReady, series, occurrences, checklistItems, menuItems, tags, settings, updateSettings } = useAppStore();

  const snapshot = useMemo(
    () => ({ series, occurrences, checklistItems, menuItems, tags, settings }),
    [series, occurrences, checklistItems, menuItems, tags, settings],
  );

  useEffect(() => {
    if (!isReady || !settings.notificationsEnabled) {
      return;
    }

    let cancelled = false;

    async function checkReminder() {
      if (cancelled) {
        return;
      }

      if (typeof Notification === "undefined" || !("serviceWorker" in navigator)) {
        await updateSettings({ notificationsEnabled: false });
        return;
      }

      if (Notification.permission !== "granted") {
        await updateSettings({ notificationsEnabled: false });
        return;
      }

      const today = todayStorageDate();
      if (settings.lastReminderProcessedOn === today) {
        return;
      }

      if (!hasReachedReminderTime(settings.dailyReminderTime, new Date())) {
        return;
      }

      const reminderTasks = resolveReminderTasks(snapshot, today);
      if (reminderTasks.length === 0) {
        await updateSettings({ lastReminderProcessedOn: today });
        return;
      }

      const delivered = await deliverReminderNotification(settings.language, reminderTasks);
      if (delivered) {
        await updateSettings({ lastReminderProcessedOn: today });
      }
    }

    void checkReminder();
    const intervalId = window.setInterval(() => {
      void checkReminder();
    }, CHECK_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [
    checklistItems,
    isReady,
    menuItems,
    occurrences,
    series,
    settings,
    tags,
    updateSettings,
    snapshot,
  ]);
}
