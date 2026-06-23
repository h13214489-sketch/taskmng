import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, MoreHorizontal, Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";

type ChecklistFilter = "all" | "todo" | "complete";

export default function ChecklistPage() {
  const { t } = useTranslation();
  const {
    checklistGroups,
    checklistItems,
    addChecklistGroup,
    renameChecklistGroup,
    deleteChecklistGroup,
    addChecklistItem,
    toggleChecklistItem,
    deleteChecklistItems,
  } = useAppStore();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<ChecklistFilter>("all");
  const [actionsOpen, setActionsOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupActionsId, setGroupActionsId] = useState<string | null>(null);
  const [renameGroupId, setRenameGroupId] = useState<string | null>(null);
  const [draftByGroup, setDraftByGroup] = useState<Record<string, string>>({});
  const [collapsedByGroup, setCollapsedByGroup] = useState<Record<string, boolean>>({});

  const sortedGroups = useMemo(() => {
    return [...checklistGroups].sort((left, right) => left.createdAt - right.createdAt);
  }, [checklistGroups]);
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

  useEffect(() => {
    setCollapsedByGroup((current) => {
      if (sortedGroups.length === 0) {
        return {};
      }

      if (Object.keys(current).length > 0) {
        const next: Record<string, boolean> = { ...current };
        sortedGroups.forEach((group) => {
          if (typeof next[group.id] !== "boolean") {
            next[group.id] = true;
          }
        });
        return next;
      }

      return sortedGroups.reduce<Record<string, boolean>>((result, group) => {
        result[group.id] = true;
        return result;
      }, {});
    });
  }, [sortedGroups]);

  function toggleSelected(itemId: string) {
    setSelectedIds((current) => (current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]));
  }

  function openActions() {
    if (selectionMode) {
      return;
    }
    setActionsOpen(true);
  }

  function closeActions() {
    setActionsOpen(false);
  }

  function openCreateGroup() {
    setGroupName("");
    setRenameGroupId(null);
    setCreateGroupOpen(true);
  }

  function closeCreateGroup() {
    setCreateGroupOpen(false);
    setRenameGroupId(null);
  }

  function closeGroupActions() {
    setGroupActionsId(null);
  }

  function openRenameGroup(groupId: string) {
    const group = checklistGroups.find((item) => item.id === groupId);
    if (!group) {
      return;
    }

    setGroupName(group.name);
    setRenameGroupId(groupId);
    setCreateGroupOpen(true);
  }

  async function handleDeleteSelected() {
    if (selectedIds.length === 0) {
      return;
    }

    await deleteChecklistItems(selectedIds);
    setSelectedIds([]);
    setSelectionMode(false);
  }

  async function handleCreateGroup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextName = groupName.trim();
    if (!nextName) {
      return;
    }

    if (renameGroupId) {
      await renameChecklistGroup(renameGroupId, nextName);
      setRenameGroupId(null);
    } else {
      await addChecklistGroup(nextName);
    }
    closeCreateGroup();
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[30px] border border-blue-100 bg-white/90 p-3 shadow-sm shadow-blue-900/5">
        <div className="flex items-center gap-2">
          <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFilter((current) => (current === "todo" ? "all" : "todo"))}
              aria-pressed={filter === "todo"}
              className={cn(
                "rounded-[22px] bg-blue-50 px-3 py-2.5 text-left transition hover:bg-blue-100",
                filter === "todo" && "ring-2 ring-blue-700/30",
              )}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-500">{t("todo")}</p>
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
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-slate-600 transition hover:bg-blue-100"
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
              onClick={openActions}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-slate-600 transition hover:bg-blue-100"
              aria-label={t("manage")}
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          )}
        </div>
      </section>

      <section className="-ml-14 w-[calc(100%+3.5rem)] space-y-3">
        {sortedGroups.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
            {t("noCheckListItems")}
          </div>
        ) : (
          <section className="space-y-2.5">
            {sortedGroups.map((group) => {
              const items = sortedItems.filter((item) => item.groupId === group.id);
              const groupCompletedCount = items.filter((item) => item.completed).length;
              const visibleItems = filteredItems.filter((item) => item.groupId === group.id);
              const collapsed = collapsedByGroup[group.id] ?? true;
              const draft = draftByGroup[group.id] ?? "";
              const canSubmit = Boolean(draft.trim());

              return (
                <section key={group.id} className="rounded-[28px] border border-slate-100 bg-white p-3 shadow-sm shadow-blue-900/5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCollapsedByGroup((current) => ({
                          ...current,
                          [group.id]: !(current[group.id] ?? true),
                        }))
                      }
                      className="flex min-w-0 flex-1 items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{group.name}</p>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <span className="text-xs font-semibold">
                          {groupCompletedCount}/{items.length}
                        </span>
                        <ChevronDown className={cn("h-5 w-5 transition", !collapsed && "rotate-180")} />
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGroupActionsId(group.id)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600"
                      aria-label={t("manage")}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>

                  {!collapsed ? (
                    <div className="mt-3 space-y-2">
                      {visibleItems.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
                          {t("noCheckListItems")}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {visibleItems.map((item) => (
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
                                "flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-3 py-2 transition",
                                item.completed && "border-emerald-100 bg-emerald-50/30",
                                selectionMode && "cursor-pointer",
                                selectionMode && selectedIds.includes(item.id) && "border-slate-900 bg-slate-900/5",
                              )}
                            >
                              <div className="min-w-0 flex-1">
                                <p className={cn("truncate text-sm font-medium text-slate-900", item.completed && "text-slate-400 line-through")}>
                                  {item.title}
                                </p>
                              </div>
                              {selectionMode ? (
                                <div
                                  className={cn(
                                    "inline-flex h-8 w-8 items-center justify-center rounded-2xl border transition",
                                    selectedIds.includes(item.id)
                                      ? "border-slate-900 bg-slate-900 text-white"
                                      : "border-slate-300 bg-white text-slate-500",
                                  )}
                                >
                                  {selectedIds.includes(item.id) ? <Check className="h-4 w-4" /> : null}
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => void toggleChecklistItem(item.id)}
                                  className={cn(
                                    "inline-flex h-8 w-8 items-center justify-center rounded-2xl border transition",
                                    item.completed
                                      ? "border-slate-900 bg-slate-900 text-white"
                                      : "border-slate-300 bg-white text-slate-500",
                                  )}
                                  aria-label={item.completed ? t("complete") : t("todo")}
                                >
                                  {item.completed ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {!selectionMode ? (
                        <form
                          onSubmit={(event) => {
                            event.preventDefault();
                            const nextTitle = draft.trim();
                            if (!nextTitle) {
                              return;
                            }

                            void addChecklistItem(nextTitle, group.id);
                            setDraftByGroup((current) => ({ ...current, [group.id]: "" }));
                          }}
                          className="flex items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3"
                        >
                          <Plus className="h-4 w-4 text-slate-400" />
                          <input
                            value={draft}
                            onChange={(event) => setDraftByGroup((current) => ({ ...current, [group.id]: event.target.value }))}
                            placeholder={t("checkListPlaceholder")}
                            className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                          />
                          <button
                            type="submit"
                            disabled={!canSubmit}
                            className={cn(
                              "inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-700 text-white transition",
                              !canSubmit && "cursor-not-allowed bg-slate-200 text-slate-500",
                            )}
                            aria-label={t("saveTask")}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </form>
                      ) : null}
                    </div>
                  ) : null}
                </section>
              );
            })}
          </section>
        )}
      </section>

      {actionsOpen ? (
        <div className="fixed inset-0 z-[60] flex items-end bg-slate-900/35 backdrop-blur-sm" onClick={closeActions}>
          <section className="w-full rounded-t-[28px] bg-white p-4" onClick={(event) => event.stopPropagation()}>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  closeActions();
                  openCreateGroup();
                }}
                className="w-full rounded-2xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white"
              >
                {t("addGroup")}
              </button>
              <button
                type="button"
                onClick={() => {
                  closeActions();
                  setSelectionMode(true);
                  setSelectedIds([]);
                }}
                className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
              >
                {t("manage")}
              </button>
              <button
                type="button"
                onClick={closeActions}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
              >
                {t("cancel")}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {createGroupOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/35 px-4 backdrop-blur-sm"
          onClick={closeCreateGroup}
        >
          <section className="w-full max-w-[22rem] rounded-[28px] bg-white p-4 shadow-2xl shadow-slate-900/15" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">{renameGroupId ? t("renameGroup") : t("addGroup")}</p>
              <button
                type="button"
                onClick={closeCreateGroup}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700"
                aria-label={t("close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={(event) => void handleCreateGroup(event)} className="mt-4 space-y-3">
              <input
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                placeholder={t("groupName")}
                className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                autoFocus
              />
              <button
                type="submit"
                disabled={!groupName.trim()}
                className="w-full rounded-2xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                {renameGroupId ? t("renameGroup") : t("createGroup")}
              </button>
            </form>
          </section>
        </div>
      ) : null}

      {groupActionsId ? (
        <div className="fixed inset-0 z-[60] flex items-end bg-slate-900/35 backdrop-blur-sm" onClick={closeGroupActions}>
          <section className="w-full rounded-t-[28px] bg-white p-4" onClick={(event) => event.stopPropagation()}>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  closeGroupActions();
                  openRenameGroup(groupActionsId);
                }}
                className="w-full rounded-2xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white"
              >
                {t("renameGroup")}
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = groupActionsId;
                  closeGroupActions();
                  if (!window.confirm(t("confirmDeleteGroup"))) {
                    return;
                  }
                  void deleteChecklistGroup(target);
                }}
                className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
              >
                {t("deleteGroup")}
              </button>
              <button
                type="button"
                onClick={closeGroupActions}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
              >
                {t("cancel")}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
