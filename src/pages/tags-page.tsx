import { useMemo, useRef, useState } from "react";
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
    checklistGroups,
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
  const tagScrollRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{ pointerId: number | null; startX: number; scrollLeft: number }>({
    pointerId: null,
    startX: 0,
    scrollLeft: 0,
  });

  const tasks = useMemo(() => {
    const resolved = resolveActiveTasks({ series, occurrences, checklistGroups, checklistItems, menuItems, tags, settings }).filter(
      (task) => task.status !== "complete",
    );
    if (!activeTagId) {
      return resolved;
    }

    return resolved.filter((task) => task.tagIds.includes(activeTagId));
  }, [series, occurrences, checklistGroups, checklistItems, menuItems, tags, settings, activeTagId]);
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

  function handleTagPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: event.currentTarget.scrollLeft,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleTagPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (dragStateRef.current.pointerId !== event.pointerId) {
      return;
    }

    const nextScrollLeft = dragStateRef.current.scrollLeft - (event.clientX - dragStateRef.current.startX);
    event.currentTarget.scrollLeft = nextScrollLeft;
  }

  function handleTagPointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    if (dragStateRef.current.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragStateRef.current.pointerId = null;
  }

  return (
    <div className="space-y-4">
      <section className="space-y-3">
        <div className="flex h-12 items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-[24px] border border-blue-100 bg-white px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchTasks")}
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
            {activeTagId ? (
              <button type="button" onClick={() => setActiveTagId(null)} className="shrink-0 text-xs font-semibold text-blue-700">
                {t("viewAll")}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setIsCreateOpen((value) => !value)}
              className="inline-flex h-8 shrink-0 items-center rounded-xl bg-blue-700 px-3 text-xs font-semibold text-white shadow-lg shadow-blue-900/15"
            >
              {isCreateOpen ? t("close") : t("addTag")}
            </button>
          </div>
        </div>

        <div className="-ml-14 w-[calc(100%+3.5rem)] space-y-3 pt-2">
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

          <div
            ref={tagScrollRef}
            className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing"
            onPointerDown={handleTagPointerDown}
            onPointerMove={handleTagPointerMove}
            onPointerUp={handleTagPointerEnd}
            onPointerCancel={handleTagPointerEnd}
          >
            <div className="flex w-max items-center gap-2 pr-1">
                {tags.map((tag) => (
                  <div key={tag.id} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white pr-2 shadow-sm">
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
          </div>
        </div>
      </section>

      <section className="-ml-14 w-[calc(100%+3.5rem)] space-y-3">
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
