import { useMemo, useState } from "react";
import { Check, MoreHorizontal, Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";

export default function ChecklistPage() {
  const { t } = useTranslation();
  const { checklistItems, addChecklistItem, toggleChecklistItem, deleteChecklistItems } = useAppStore();
  const [title, setTitle] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const sortedItems = useMemo(() => {
    return [...checklistItems].sort((left, right) => {
      if (left.completed !== right.completed) {
        return left.completed ? 1 : -1;
      }

      return left.createdAt - right.createdAt;
    });
  }, [checklistItems]);

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
      <div className="relative flex items-center justify-between gap-3">
        {selectionMode ? (
          <button
            type="button"
            onClick={() => {
              setSelectionMode(false);
              setSelectedIds([]);
            }}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700"
          >
            <X className="h-4 w-4" />
            {t("cancel")}
          </button>
        ) : (
          <h1 className="text-lg font-semibold text-slate-900">{t("checkList")}</h1>
        )}

        {selectionMode ? (
          <button
            type="button"
            onClick={() => void handleDeleteSelected()}
            disabled={selectedIds.length === 0}
            className={cn(
              "rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition",
              selectedIds.length === 0 && "cursor-not-allowed bg-slate-200 text-slate-500",
            )}
          >
            {t("delete")} ({selectedIds.length})
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setSelectionMode(true);
              setSelectedIds([]);
            }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-white text-slate-600 transition hover:bg-blue-50"
            aria-label={t("manage")}
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        )}
      </div>

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="flex items-center gap-3 rounded-[28px] border border-blue-100 bg-white px-4 py-3"
      >
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t("checkListPlaceholder")}
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
        <button
          type="submit"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-white transition hover:bg-blue-800"
        >
          <Plus className="h-5 w-5" />
        </button>
      </form>

      {sortedItems.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
          {t("noCheckListItems")}
        </div>
      ) : (
        <section className="space-y-2">
          {sortedItems.map((item) => (
            <div
              key={item.id}
              role={selectionMode ? "button" : undefined}
              tabIndex={selectionMode ? 0 : undefined}
              onClick={
                selectionMode
                  ? () => {
                      toggleSelected(item.id);
                    }
                  : undefined
              }
              onKeyDown={
                selectionMode
                  ? (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        toggleSelected(item.id);
                      }
                    }
                  : undefined
              }
              className={cn(
                "flex items-center justify-between gap-4 rounded-[28px] border border-slate-100 bg-white px-4 py-4 shadow-sm shadow-blue-900/5",
                selectionMode && "cursor-pointer",
              )}
            >
              <span
                className={cn(
                  "text-sm font-medium text-slate-900",
                  item.completed && "text-slate-400 line-through",
                )}
              >
                {item.title}
              </span>
              {selectionMode ? (
                <div
                  className={cn(
                    "inline-flex h-10 w-10 items-center justify-center rounded-full border transition",
                    selectedIds.includes(item.id)
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white text-slate-500",
                  )}
                >
                  {selectedIds.includes(item.id) ? <Check className="h-6 w-6" /> : null}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => void toggleChecklistItem(item.id)}
                  className={cn(
                    "inline-flex h-10 w-10 items-center justify-center rounded-full border transition",
                    item.completed ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-500",
                  )}
                  aria-label={item.completed ? t("complete") : t("todo")}
                >
                  {item.completed ? <Check className="h-6 w-6" /> : null}
                </button>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
