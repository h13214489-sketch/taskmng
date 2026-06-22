import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import i18n from "@/app/i18n";
import { MobileShell } from "@/components/mobile-shell";
import { useReminderNotifications } from "@/hooks/use-reminder-notifications";
import CalendarPage from "@/pages/calendar-page";
import ChecklistPage from "@/pages/checklist-page";
import CompletedPage from "@/pages/completed-page";
import ListPage from "@/pages/list-page";
import MenuPage from "@/pages/menu-page";
import SettingsPage from "@/pages/settings-page";
import TagsPage from "@/pages/tags-page";
import { useAppStore } from "@/store/use-app-store";

function AppRoutes() {
  const { isReady, settings, loadApp } = useAppStore();

  useReminderNotifications();

  useEffect(() => {
    void loadApp();
  }, [loadApp]);

  useEffect(() => {
    void i18n.changeLanguage(settings.language);
  }, [settings.language]);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-rose-50 px-6 text-center">
        <div className="rounded-[32px] bg-white px-6 py-8 shadow-lg shadow-slate-900/10">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Task List Mobile</p>
          <h1 className="mt-2 text-lg font-semibold text-slate-900">Loading your tasks...</h1>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<MobileShell />}>
          <Route path="/" element={<CalendarPage />} />
          <Route path="/list" element={<ListPage />} />
          <Route path="/checklist" element={<ChecklistPage />} />
          <Route path="/completed" element={<CompletedPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/tags" element={<TagsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <AppRoutes />
    </I18nextProvider>
  );
}
