import { addDays, format, isSameDay } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { useTranslation } from "react-i18next";

import { TaskCard } from "@/components/task-card";
import { useAppStore } from "@/store/use-app-store";
import { resolveActiveTasks, splitTaskSections } from "@/utils/task-logic";
import { parseStorageDate } from "@/utils/date";

const PAGE_SIZE = 5;

interface SectionProps {
  tasks: ReturnType<typeof resolveActiveTasks>;
  visibleCount: number;
  onLoadMore: () => void;
  storageKey: string;
}

interface TaskDateGroup {
  key: string;
  label: string;
  tasks: ReturnType<typeof resolveActiveTasks>;
}

function buildDateGroups(tasks: ReturnType<typeof resolveActiveTasks>) {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const groups = new Map<string, TaskDateGroup>();

  tasks.forEach((task) => {
    const taskDate = parseStorageDate(task.date);
    const labelPrefix = isSameDay(taskDate, today)
      ? "Today"
      : isSameDay(taskDate, tomorrow)
        ? "Tomorrow"
        : format(taskDate, "dd-MM-yyyy");
    const label = isSameDay(taskDate, today) || isSameDay(taskDate, tomorrow)
      ? `${labelPrefix} ${format(taskDate, "dd-MM-yyyy")}`
      : labelPrefix;

    const existing = groups.get(task.date);
    if (existing) {
      existing.tasks.push(task);
      return;
    }

    groups.set(task.date, {
      key: task.date,
      label,
      tasks: [task],
    });
  });

  return [...groups.values()];
}

function Section({ tasks, visibleCount, onLoadMore, storageKey }: SectionProps) {
  const { tags, setTaskStatus, openDetailSheet, openCompleteSheet } = useAppStore();
  const visibleTasks = tasks.slice(0, visibleCount);
  const groups = useMemo(() => buildDateGroups(visibleTasks), [visibleTasks]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [collapsedByGroup, setCollapsedByGroup] = useState<Record<string, boolean>>(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        return {};
      }
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== "object") {
        return {};
      }
      return parsed as Record<string, boolean>;
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target || visibleCount >= tasks.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.8 },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [onLoadMore, tasks.length, visibleCount]);

  useEffect(() => {
    setCollapsedByGroup((current) => {
      const next: Record<string, boolean> = {};
      groups.forEach((group) => {
        next[group.key] = current[group.key] ?? false;
      });
      return next;
    });
  }, [groups]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(collapsedByGroup));
    } catch {
      return;
    }
  }, [collapsedByGroup, storageKey]);

  return (
    <section className="space-y-4">
      {groups.map((group) => {
        const collapsed = collapsedByGroup[group.key] ?? false;

        return (
        <section key={group.key} className="space-y-3">
          <button
            type="button"
            onClick={() =>
              setCollapsedByGroup((current) => ({
                ...current,
                [group.key]: !(current[group.key] ?? false),
              }))
            }
            className="flex w-full items-center gap-3 rounded-[22px] border border-teal-200 bg-white px-4 py-2.5 text-left shadow-sm shadow-teal-900/10 transition hover:bg-teal-50"
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500" />
            <p className="min-w-0 flex-1 truncate text-xs font-black tracking-[0.14em] text-teal-800">{group.label}</p>
            <span className="rounded-full bg-teal-100 px-2.5 py-1 text-[10px] font-semibold text-teal-800">{group.tasks.length}</span>
            <ChevronDown className={collapsed ? "h-4 w-4 shrink-0 text-teal-700 transition" : "h-4 w-4 shrink-0 rotate-180 text-teal-700 transition"} />
          </button>
          {!collapsed ? (
            <div className="space-y-3">
              {group.tasks.map((task) => (
                <TaskCard
                  key={`${task.seriesId}-${task.date}`}
                  task={task}
                  tags={tags}
                  onComplete={() => openCompleteSheet(task)}
                  onPending={() => void setTaskStatus(task, "pending")}
                  onSetTodo={() => void setTaskStatus(task, "todo")}
                  onOpenDetail={() => openDetailSheet(task)}
                />
              ))}
            </div>
          ) : null}
        </section>
      )})}
      {visibleCount < tasks.length ? <div ref={sentinelRef} className="h-10 rounded-2xl bg-slate-100/80" /> : null}
    </section>
  );
}

export default function ListPage() {
  const { t } = useTranslation();
  const { series, occurrences, checklistGroups, checklistItems, menuItems, tags, settings } = useAppStore();
  const [outstandingCount, setOutstandingCount] = useState(PAGE_SIZE);
  const [todoCount, setTodoCount] = useState(PAGE_SIZE);
  const [activeTab, setActiveTab] = useState<"outstanding" | "todo">("outstanding");
  const [query, setQuery] = useState("");

  const snapshot = useMemo(
    () => ({ series, occurrences, checklistGroups, checklistItems, menuItems, tags, settings }),
    [series, occurrences, checklistGroups, checklistItems, menuItems, tags, settings],
  );
  const rawSections = useMemo(() => splitTaskSections(resolveActiveTasks(snapshot)), [snapshot]);
  const normalizedQuery = query.trim().toLowerCase();
  const sections = useMemo(() => {
    if (!normalizedQuery) {
      return rawSections;
    }

    const filterByName = (tasks: typeof rawSections.outstanding) =>
      tasks.filter((task) => task.name.toLowerCase().includes(normalizedQuery));

    return {
      outstanding: filterByName(rawSections.outstanding),
      todo: filterByName(rawSections.todo),
    };
  }, [normalizedQuery, rawSections]);

  useEffect(() => {
    setOutstandingCount(PAGE_SIZE);
    setTodoCount(PAGE_SIZE);
  }, [series, occurrences, normalizedQuery]);

  return (
    <div className="space-y-4">
      <section className="rounded-[32px] border border-teal-200 bg-white p-1.5 shadow-sm shadow-teal-900/10">
        <div className="grid h-full grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("outstanding")}
            className={
              activeTab === "outstanding"
                ? "inline-flex h-11 items-center justify-center rounded-[24px] bg-teal-700 px-4 text-sm font-semibold text-white shadow-lg shadow-teal-900/20"
                : "inline-flex h-11 items-center justify-center rounded-[24px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700"
            }
          >
            {t("outstanding")} ({sections.outstanding.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("todo")}
            className={
              activeTab === "todo"
                ? "inline-flex h-11 items-center justify-center rounded-[24px] bg-teal-700 px-4 text-sm font-semibold text-white shadow-lg shadow-teal-900/20"
                : "inline-flex h-11 items-center justify-center rounded-[24px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700"
            }
          >
            {t("todo")} ({sections.todo.length})
          </button>
        </div>
      </section>

      <section className="-ml-14 w-[calc(100%+3.5rem)] space-y-4">
        <div className="flex items-center gap-3 rounded-[28px] border border-teal-200 bg-white px-4 py-3 shadow-sm shadow-teal-900/10">
          <Search className="h-4 w-4 text-teal-600" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchTasks")}
            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>

        <Section
          tasks={activeTab === "outstanding" ? sections.outstanding : sections.todo}
          visibleCount={activeTab === "outstanding" ? outstandingCount : todoCount}
          onLoadMore={() =>
            activeTab === "outstanding"
              ? setOutstandingCount((value) => value + PAGE_SIZE)
              : setTodoCount((value) => value + PAGE_SIZE)
          }
          storageKey={`taskmng:list:collapsed:${activeTab}`}
        />
      </section>
    </div>
  );
}
