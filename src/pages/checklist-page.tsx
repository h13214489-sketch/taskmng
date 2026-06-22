import { useEffect, useMemo, useState } from "react";
import { Check, MoreHorizontal, Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";

type ChecklistFilter = "all" | "todo" | "complete";

export default function ChecklistPage() {
  const { t } = useTranslation();
  const { checklistItems, addChecklistItem, toggleChecklistItem, deleteChecklistItems } = useAppStore();
  const [title, setTitle] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<ChecklistFilter>("all");
  const canSubmit = Boolean(title.trim());

  const sortedItems = useMemo(() => {
    return [...checklistItems].sort((left, right) => {
      if (left.completed !== right.completed) {
        return left.completed ? 1 : -1;
      }

      return left.createdAt - right.createdAt;
    });
  }, [checklistItems]);
  const completedCount = sortedItems.filter((item) => item.completed).length;
  const remainingCount = sortedItems.length - completedCount;
  const filteredItems = useMemo(() => {
    if (filter === "complete") {
      return sortedItems.filter((item) => item.completed);
    }

    if (filter === "todo") {
      return sortedItems.filter((item) => !item.completed);
    }

    return sortedItems;
  }, [filter, sortedItems]);

  useEffect(() => {
    setSelectedIds([]);
  }, [filter]);

  function toggleSelected(itemId: string) {
    setSelectedIds((current) => (current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]));
  }

  async function handleDeleteSelected() {
    if (selectedIds.length === 0) {
      return;
    }

    await deleteChecklistItems(selectedIds);
    setSelectedIds([]);
    setSelectionMode(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextTitle = title.trim();
    if (!nextTitle) {
      return;
    }

    await addChecklistItem(nextTitle);
    setTitle("");
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[30px] border border-teal-100 bg-white/90 p-3 shadow-sm shadow-teal-900/5">
        <div className="flex items-center gap-2">
          <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFilter((current) => (current === "todo" ? "all" : "todo"))}
              aria-pressed={filter === "todo"}
              className={cn(
                "rounded-[22px] bg-teal-50 px-3 py-2.5 text-left transition hover:bg-teal-100",
                filter === "todo" && "ring-2 ring-teal-600/30",
              )}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-500">{t("todo")}</p>
              <p className="mt-0.5 text-lg font-semibold text-slate-900">{remainingCount}</p>
            </button>
            <button
              type="button"
              onClick={() => setFilter((current) => (current === "complete" ? "all" : "complete"))}
              aria-pressed={filter === "complete"}
              className={cn(
                "rounded-[22px] bg-emerald-50 px-3 py-2.5 text-left transition hover:bg-emerald-100",
                filter === "complete" && "ring-2 ring-emerald-600/30",
              )}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-600">{t("complete")}</p>
              <p className="mt-0.5 text-lg font-semibold text-slate-900">{completedCount}</p>
            </button>
          </div>

          {selectionMode ? (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectionMode(false);
                  setSelectedIds([]);
                }}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-teal-100 bg-teal-50 text-slate-600 transition hover:bg-teal-100"
                aria-label={t("cancel")}
              >
                <X className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteSelected()}
                disabled={selectedIds.length === 0}
                className={cn(
                  "rounded-2xl px-3 py-2.5 text-sm font-semibold transition",
                  selectedIds.length === 0
                    ? "cursor-not-allowed bg-slate-200 text-slate-500"
                    : "bg-slate-900 text-white",
                )}
              >
                {t("delete")} ({selectedIds.length})
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSelectionMode(true);
                setSelectedIds([]);
              }}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-slate-600 transition hover:bg-blue-100"
              aria-label={t("manage")}
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          )}
        </div>
      </section>

      <section className="-ml-14 w-[calc(100%+3.5rem)] space-y-3">
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="flex items-center gap-3 rounded-[28px] border border-teal-100 bg-white px-4 py-3 shadow-sm shadow-teal-900/5"
        >
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t("checkListPlaceholder")}
            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!canSubmit}
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-white transition hover:bg-teal-700",
              !canSubmit && "cursor-not-allowed bg-slate-200 text-slate-500 hover:bg-slate-200",
            )}
          >
            <Plus className="h-5 w-5" />
          </button>
        </form>

        {filteredItems.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
            {t("noCheckListItems")}
          </div>
        ) : (
          <section className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (selectionMode) {
                    toggleSelected(item.id);
                    return;
                  }
                  void toggleChecklistItem(item.id);
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") {
                    return;
                  }
                  if (selectionMode) {
                    toggleSelected(item.id);
                    return;
                  }
                  void toggleChecklistItem(item.id);
                }}
                className={cn(
                  "flex items-center justify-between gap-4 rounded-[28px] border border-slate-100 bg-white px-4 py-4 shadow-sm shadow-teal-900/5 transition",
                  item.completed && "border-emerald-100 bg-emerald-50/50",
                  !item.completed && "hover:border-teal-200 hover:bg-teal-50/40",
                  selectionMode && "cursor-pointer",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-base font-semibold text-slate-900",
                      item.completed && "text-slate-400 line-through",
                    )}
                  >
                    {item.title}
                  </p>
                </div>
                {selectionMode ? (
                  <div
                    className={cn(
                      "inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition",
                      selectedIds.includes(item.id)
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-white text-slate-500",
                    )}
                  >
                    {selectedIds.includes(item.id) ? <Check className="h-6 w-6" /> : null}
                  </div>
                ) : null}
              </div>
            ))}
          </section>
        )}
      </section>
    </div>
  );
}
