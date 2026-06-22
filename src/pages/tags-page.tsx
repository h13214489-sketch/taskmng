import { useMemo, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { TagChip } from "@/components/tag-chip";
import { TaskCard } from "@/components/task-card";
import { useAppStore } from "@/store/use-app-store";
import { resolveActiveTasks } from "@/utils/task-logic";

const colorChoices = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"];

export default function TagsPage() {
  const { t } = useTranslation();
  const {
    series,
    occurrences,
    checklistItems,
    menuItems,
    tags,
    settings,
    activeTagId,
    setActiveTagId,
    addTag,
    deleteTag,
    setTaskStatus,
    openCompleteSheet,
    openDetailSheet,
  } = useAppStore();
  const [name, setName] = useState("");
  const [color, setColor] = useState(colorChoices[0]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [query, setQuery] = useState("");

  const tasks = useMemo(() => {
    const resolved = resolveActiveTasks({ series, occurrences, checklistItems, menuItems, tags, settings }).filter(
      (task) => task.status !== "complete",
    );
    if (!activeTagId) {
      return resolved;
    }

    return resolved.filter((task) => task.tagIds.includes(activeTagId));
  }, [series, occurrences, checklistItems, menuItems, tags, settings, activeTagId]);
  const normalizedQuery = query.trim().toLowerCase();
  const visibleTasks = useMemo(() => {
    if (!normalizedQuery) {
      return tasks;
    }

    return tasks.filter((task) => task.name.toLowerCase().includes(normalizedQuery));
  }, [normalizedQuery, tasks]);

  async function handleCreateTag(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }

    await addTag(name, color);
    setName("");
    setColor(colorChoices[0]);
    setIsCreateOpen(false);
  }

  async function handleDeleteTag(tagId: string) {
    if (!window.confirm(t("confirmDeleteTag"))) {
      return;
    }

    await deleteTag(tagId);
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-slate-900">{t("activeTag")}</h2>
            <button
              type="button"
              onClick={() => setIsCreateOpen((value) => !value)}
              className="rounded-2xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/15"
            >
              {isCreateOpen ? t("close") : t("addTag")}
            </button>
          </div>
          {activeTagId ? (
            <button type="button" onClick={() => setActiveTagId(null)} className="text-xs font-semibold text-blue-700">
              {t("viewAll")}
            </button>
          ) : null}
        </div>

        {isCreateOpen ? (
          <form className="rounded-[32px] border border-blue-100 bg-blue-50/70 p-5 space-y-3" onSubmit={handleCreateTag}>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("tagName")}
              className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400"
            />
            <div className="flex flex-wrap gap-2">
              {colorChoices.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => setColor(choice)}
                  className="h-9 w-9 rounded-full border-2"
                  style={{ backgroundColor: choice, borderColor: color === choice ? "#1d4ed8" : "#ffffff" }}
                />
              ))}
            </div>
            <button type="submit" className="w-full rounded-2xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white">
              {t("createTag")}
            </button>
          </form>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <div key={tag.id} className="inline-flex items-center gap-2 rounded-full bg-white pr-2 shadow-sm">
              <TagChip
                label={tag.name}
                color={tag.color}
                selected={activeTagId === tag.id}
                onClick={() => setActiveTagId(activeTagId === tag.id ? null : tag.id)}
              />
              <button
                type="button"
                onClick={() => void handleDeleteTag(tag.id)}
                className="text-slate-400 transition hover:text-rose-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-3 rounded-[28px] border border-blue-100 bg-white px-4 py-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchTasks")}
            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>

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
              onComplete={() => openCompleteSheet(task)}
              onPending={() => void setTaskStatus(task, "pending")}
              onSetTodo={() => void setTaskStatus(task, "todo")}
              onOpenDetail={() => openDetailSheet(task)}
            />
          ))
        )}
      </section>
    </div>
  );
}
