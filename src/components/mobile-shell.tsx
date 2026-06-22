import { CalendarDays, CheckCircle2, ListChecks, ListTodo, Menu, Plus, Settings2, Tags, UtensilsCrossed, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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
    updateTask,
    deleteTask,
    endRoutineTask,
  } = useAppStore();
  const shellOverlayHistoryActiveRef = useRef(false);
  const shellOverlayClosingFromHistoryRef = useRef(false);

  function requestCloseMenu() {
    if (!menuExpanded) {
      return;
    }

    if (shellOverlayHistoryActiveRef.current) {
      shellOverlayClosingFromHistoryRef.current = true;
      window.history.back();
      return;
    }

    toggleMenu();
  }

  function handleMenuNavigate(to: string) {
    if (!menuExpanded) {
      navigate(to);
      return;
    }

    shellOverlayClosingFromHistoryRef.current = true;
    toggleMenu();
    navigate(to, { replace: true });
  }

  useEffect(() => {
    const shouldLock = menuExpanded || Boolean(editorMode);
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehaviorY;
    const previousBodyOverscroll = document.body.style.overscrollBehaviorY;

    if (shouldLock) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overscrollBehaviorY = "none";
      document.body.style.overscrollBehaviorY = "none";
    }

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overscrollBehaviorY = previousHtmlOverscroll;
      document.body.style.overscrollBehaviorY = previousBodyOverscroll;
    };
  }, [editorMode, menuExpanded]);

  useEffect(() => {
    const hasOverlay = menuExpanded || Boolean(editorMode);

    function handlePopState() {
      shellOverlayClosingFromHistoryRef.current = true;

      if (editorMode) {
        closeSheet();
        return;
      }

      if (menuExpanded) {
        toggleMenu();
      }
    }

    if (hasOverlay && !shellOverlayHistoryActiveRef.current) {
      window.history.pushState({ overlay: "shell" }, "", window.location.href);
      shellOverlayHistoryActiveRef.current = true;
    }

    if (hasOverlay) {
      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }

    if (shellOverlayHistoryActiveRef.current) {
      if (shellOverlayClosingFromHistoryRef.current) {
        shellOverlayClosingFromHistoryRef.current = false;
        shellOverlayHistoryActiveRef.current = false;
        return;
      }

      shellOverlayHistoryActiveRef.current = false;
      window.history.back();
    }
  }, [closeSheet, editorMode, menuExpanded, toggleMenu]);

  const shouldShowFab = !["/checklist", "/menu", "/settings"].includes(location.pathname);

  return (
    <div className="min-h-screen bg-[#edf4ff] text-slate-900">
      {menuExpanded ? <div className="fixed inset-0 z-40 bg-slate-900/20" onClick={requestCloseMenu} /> : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-blue-100 bg-white px-4 py-5 transition-transform duration-200",
          menuExpanded ? "translate-x-0" : "-translate-x-full",
        )}
        aria-hidden={!menuExpanded}
      >
        <nav className="mt-16 flex flex-1 flex-col gap-3">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{t("calendarGroup")}</p>

          {calendarNavItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={(event) => {
                  event.preventDefault();
                  handleMenuNavigate(item.to);
                }}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition",
                  active ? "bg-blue-700 text-white shadow-lg shadow-blue-900/15" : "text-slate-500 hover:bg-blue-50",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{t(item.key)}</span>
              </NavLink>
            );
          })}

          <div className="mx-3 my-2 border-t border-slate-200" />

          {otherNavItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={(event) => {
                  event.preventDefault();
                  handleMenuNavigate(item.to);
                }}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition",
                  active ? "bg-blue-700 text-white shadow-lg shadow-blue-900/15" : "text-slate-500 hover:bg-blue-50",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{t(item.key)}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <main className="min-h-screen px-2 pb-6 pt-3">
        <div className="mx-auto w-full max-w-[440px] pb-28">
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={menuExpanded ? requestCloseMenu : toggleMenu}
              className="z-30 mt-0.5 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-lg shadow-blue-900/20"
              aria-label={menuExpanded ? t("close") : t("menu")}
            >
              {menuExpanded ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="min-w-0 flex-1 pt-0.5">
              <Outlet />
            </div>
          </div>
        </div>
      </main>

      {shouldShowFab ? (
        <button
          type="button"
          onClick={() => openCreateSheet(selectedDate)}
          className="fixed bottom-6 right-4 z-30 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl shadow-blue-500/30 transition hover:scale-[1.02]"
        >
          <Plus className="h-7 w-7" />
        </button>
      ) : null}

      <TaskSheet
        open={Boolean(editorMode)}
        mode={editorMode}
        task={editorTask}
        tags={tags}
        selectedDate={selectedDate}
        onClose={closeSheet}
        onSave={addTask}
        onUpdate={updateTask}
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
