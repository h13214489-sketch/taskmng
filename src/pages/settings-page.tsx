import { useState } from "react";
import { BellRing } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAppStore } from "@/store/use-app-store";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { settings, updateSettings, setLanguage } = useAppStore();
  const [notificationError, setNotificationError] = useState<string | null>(null);

  async function handleLanguageChange(language: "en" | "zh") {
    await setLanguage(language);
    await i18n.changeLanguage(language);
  }

  async function handleNotificationsChange(enabled: boolean) {
    if (!enabled) {
      setNotificationError(null);
      await updateSettings({ notificationsEnabled: false });
      return;
    }

    if (typeof Notification === "undefined" || !("serviceWorker" in navigator)) {
      setNotificationError(t("notificationUnsupported"));
      await updateSettings({ notificationsEnabled: false });
      return;
    }

    const permission = Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission();

    if (permission !== "granted") {
      setNotificationError(
        permission === "denied"
          ? t("notificationPermissionDenied")
          : t("notificationPermissionRequired"),
      );
      await updateSettings({ notificationsEnabled: false });
      return;
    }

    setNotificationError(null);
    await updateSettings({ notificationsEnabled: true });
  }

  return (
    <div className="space-y-2">
      <div className="flex h-12 items-center justify-between">
        <h1 className="text-base font-semibold text-slate-900">{t("settings")}</h1>
      </div>

      <section className="-ml-14 w-[calc(100%+3.5rem)] space-y-3 rounded-[32px] border border-rose-100 bg-rose-50/70 p-3">
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{t("language")}</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "en" as const, label: "English" },
              { value: "zh" as const, label: "中文" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => void handleLanguageChange(option.value)}
                className={`rounded-2xl px-4 py-2.5 text-sm font-semibold ${
                  settings.language === option.value
                    ? "bg-rose-600 text-white"
                    : "border border-rose-100 bg-white text-slate-700"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-rose-100 bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <BellRing className="h-5 w-5 text-rose-500" />
            <div>
              <p className="text-sm font-semibold text-slate-900">{t("notifications")}</p>
              <p className="mt-1 text-xs text-slate-500">{t("notificationsDescription")}</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.notificationsEnabled}
            aria-label={t("notifications")}
            onClick={() => void handleNotificationsChange(!settings.notificationsEnabled)}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
              settings.notificationsEnabled ? "bg-rose-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition ${
                settings.notificationsEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <p className="rounded-2xl border border-rose-100 bg-white px-4 py-2.5 text-xs text-slate-500">
          {t("notificationFormat", { count: 3 })}
        </p>

        {notificationError ? (
          <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-xs text-rose-600">
            {notificationError}
          </p>
        ) : null}

        <label className="block space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{t("reminderTime")}</span>
          <input
            type="time"
            value={settings.dailyReminderTime}
            onChange={(event) => void updateSettings({ dailyReminderTime: event.target.value })}
            className="w-full rounded-2xl border border-rose-100 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400"
          />
        </label>
      </section>
    </div>
  );
}
