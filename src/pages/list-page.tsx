import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

import { TaskCard } from "@/components/task-card";
import { useAppStore } from "@/store/use-app-store";
import { resolveActiveTasks, splitTaskSections } from "@/utils/task-logic";

const PAGE_SIZE = 5;

interface SectionProps {
  tasks: ReturnType<typeof resolveActiveTasks>;
  visibleCount: number;
  onLoadMore: () => void;
}

function Section({ tasks, visibleCount, onLoadMore }: SectionProps) {
  const { tags, setTaskStatus, openDetailSheet, openCompleteSheet } = useAppStore();
  const visibleTasks = tasks.slice(0, visibleCount);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

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

  return (
    <section className="space-y-3">
      {visibleTasks.map((task) => (
        <TaskCard
          key={`${task.seriesId}-${task.date}`}
          task={task}
          tags={tags}
          tagsBelowActions={true}
          onComplete={() => openCompleteSheet(task)}
          onPending={() => void setTaskStatus(task, "pending")}
          onSetTodo={() => void setTaskStatus(task, "todo")}
          onOpenDetail={() => openDetailSheet(task)}
        />
      ))}
      {visibleCount < tasks.length ? <div ref={sentinelRef} className="h-10 rounded-2xl bg-slate-100/80" /> : null}
    </section>
  );
}

export default function ListPage() {
  const { t } = useTranslation();
  const { series, occurrences, checklistItems, menuItems, tags, settings } = useAppStore();
  const [outstandingCount, setOutstandingCount] = useState(PAGE_SIZE);
  const [todoCount, setTodoCount] = useState(PAGE_SIZE);
  const [activeTab, setActiveTab] = useState<"outstanding" | "todo">("todo");
  const [query, setQuery] = useState("");

  const snapshot = useMemo(
    () => ({ series, occurrences, checklistItems, menuItems, tags, settings }),
    [series, occurrences, checklistItems, menuItems, tags, settings],
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
      <section className="h-12 rounded-[32px] border border-blue-100 bg-blue-50/70 p-1">
        <div className="grid h-full grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("todo")}
            className={
              activeTab === "todo"
                ? "inline-flex h-full items-center justify-center rounded-[24px] bg-blue-700 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-900/15"
                : "inline-flex h-full items-center justify-center rounded-[24px] bg-white px-4 text-sm font-semibold text-slate-600"
            }
          >
            {t("todo")} ({sections.todo.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("outstanding")}
            className={
              activeTab === "outstanding"
                ? "inline-flex h-full items-center justify-center rounded-[24px] bg-blue-700 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-900/15"
                : "inline-flex h-full items-center justify-center rounded-[24px] bg-white px-4 text-sm font-semibold text-slate-600"
            }
          >
            {t("outstanding")} ({sections.outstanding.length})
          </button>
        </div>
      </section>

      <section className="-ml-14 w-[calc(100%+3.5rem)] space-y-4">
        <div className="flex items-center gap-3 rounded-[28px] border border-blue-100 bg-white px-4 py-3">
          <Search className="h-4 w-4 text-slate-400" />
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
        />
      </section>
    </div>
  );
}
