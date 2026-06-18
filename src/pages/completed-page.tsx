import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

import { TaskCard } from "@/components/task-card";
import { useAppStore } from "@/store/use-app-store";
import { resolveCompletedTasks } from "@/utils/task-logic";

export default function CompletedPage() {
  const { t } = useTranslation();
  const { series, occurrences, checklistItems, tags, settings, setTaskStatus, openDetailSheet } = useAppStore();
  const [query, setQuery] = useState("");

  const snapshot = useMemo(
    () => ({ series, occurrences, checklistItems, tags, settings }),
    [series, occurrences, checklistItems, tags, settings],
  );
  const tasks = useMemo(() => resolveCompletedTasks(snapshot), [snapshot]);
  const normalizedQuery = query.trim().toLowerCase();
  const visibleTasks = useMemo(() => {
    if (!normalizedQuery) {
      return tasks;
    }

    return tasks.filter((task) => task.name.toLowerCase().includes(normalizedQuery));
  }, [normalizedQuery, tasks]);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">{t("completed")}</h1>
      <section className="flex items-center gap-3 rounded-[28px] border border-blue-100 bg-white px-4 py-3">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchTasks")}
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
      </section>
      {visibleTasks.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
          {t("noTasks")}
        </div>
      ) : (
        visibleTasks.map((task) => (
          <TaskCard
            key={`${task.seriesId}-${task.date}`}
            task={task}
            tags={tags}
            onComplete={() => {}}
            onPending={() => {}}
            onSetTodo={() => void setTaskStatus(task, "todo")}
            onOpenDetail={() => openDetailSheet(task)}
          />
        ))
      )}
    </div>
  );
}
