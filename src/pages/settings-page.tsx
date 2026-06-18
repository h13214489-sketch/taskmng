import { BellRing } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAppStore } from "@/store/use-app-store";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { settings, updateSettings, setLanguage } = useAppStore();

  async function handleLanguageChange(language: "en" | "zh") {
    await setLanguage(language);
    await i18n.changeLanguage(language);
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[32px] bg-blue-700 px-5 py-5 text-white shadow-xl shadow-blue-900/15">
        <h1 className="mt-1 text-lg font-semibold">{t("settings")}</h1>
      </section>

      <section className="space-y-4 rounded-[32px] border border-blue-100 bg-blue-50/70 p-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{t("language")}</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "en" as const, label: "English" },
              { value: "zh" as const, label: "中文" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => void handleLanguageChange(option.value)}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                  settings.language === option.value
                    ? "bg-blue-700 text-white"
                    : "border border-blue-100 bg-white text-slate-700"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center justify-between rounded-2xl border border-blue-100 bg-white px-4 py-4">
          <div className="flex items-center gap-3">
            <BellRing className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm font-semibold text-slate-900">{t("notifications")}</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.notificationsEnabled}
            onChange={(event) => void updateSettings({ notificationsEnabled: event.target.checked })}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{t("reminderTime")}</span>
          <input
            type="time"
            value={settings.dailyReminderTime}
            onChange={(event) => void updateSettings({ dailyReminderTime: event.target.value })}
            className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400"
          />
        </label>

      </section>
    </div>
  );
}
