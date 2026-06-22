import { CalendarDays, CheckCircle2, ListChecks, ListTodo, Menu, Plus, Settings2, Tags, UtensilsCrossed, X } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { TaskSheet } from "@/components/task-sheet";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";

const calendarNavItems = [
  { to: "/", key: "calendar", icon: CalendarDays },
  { to: "/list", key: "list", icon: ListTodo },
  { to: "/tags", key: "tags", icon: Tags },
  { to: "/completed", key: "completed", icon: CheckCircle2 },
] as const;

const otherNavItems = [
  { to: "/checklist", key: "checkList", icon: ListChecks },
  { to: "/menu", key: "restaurantMenu", icon: UtensilsCrossed },
  { to: "/settings", key: "settings", icon: Settings2 },
] as const;

export function MobileShell() {
  const { t } = useTranslation();
  const location = useLocation();
  const {
    menuExpanded,
    toggleMenu,
    openCreateSheet,
    openCompleteSheet,
    editorMode,
    editorTask,
    tags,
    selectedDate,
    closeSheet,
    addTask,
    deleteTask,
    endRoutineTask,
  } = useAppStore();

  return (
    <div className="min-h-screen bg-[#edf4ff] text-slate-900">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-blue-100 bg-white/90 px-3 py-4 backdrop-blur",
          menuExpanded ? "w-64" : "w-20",
        )}
      >
        <button
          type="button"
          onClick={toggleMenu}
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-700 text-white"
        >
          {menuExpanded ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <nav className="mt-8 flex flex-1 flex-col gap-3">
          {menuExpanded ? (
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{t("calendarGroup")}</p>
          ) : null}

          {calendarNavItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition",
                  active ? "bg-blue-700 text-white shadow-lg shadow-blue-900/15" : "text-slate-500 hover:bg-blue-50",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {menuExpanded ? <span>{t(item.key)}</span> : null}
              </NavLink>
            );
          })}

          <div
            className={cn(
              "mx-3 my-2 border-t border-slate-200",
              menuExpanded ? "opacity-100" : "mx-4",
            )}
          />

          {otherNavItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition",
                  active ? "bg-blue-700 text-white shadow-lg shadow-blue-900/15" : "text-slate-500 hover:bg-blue-50",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {menuExpanded ? <span>{t(item.key)}</span> : null}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <main className="min-h-screen pl-24 pr-4 pt-5">
        <div className="mx-auto max-w-xl pb-28">
          <Outlet />
        </div>
      </main>

      <button
        type="button"
        onClick={() => openCreateSheet(selectedDate)}
        className="fixed bottom-6 right-4 z-30 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl shadow-blue-500/30 transition hover:scale-[1.02]"
      >
        <Plus className="h-7 w-7" />
      </button>

      <TaskSheet
        open={Boolean(editorMode)}
        mode={editorMode}
        task={editorTask}
        tags={tags}
        selectedDate={selectedDate}
        onClose={closeSheet}
        onSave={addTask}
        onConfirmComplete={async (task, completionPhoto) => {
          await useAppStore.getState().setTaskStatus(task, "complete", completionPhoto);
          closeSheet();
        }}
        onDelete={deleteTask}
        onEndRoutine={endRoutineTask}
      />
    </div>
  );
}
