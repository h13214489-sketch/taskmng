import { Camera, CheckCheck, Clock3 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { TagChip } from "@/components/tag-chip";
import { cn } from "@/lib/utils";
import type { ResolvedTask, Tag } from "@/types/models";
import { toDisplayDate } from "@/utils/date";

interface TaskCardProps {
  task: ResolvedTask;
  tags: Tag[];
  onComplete: () => void;
  onPending: () => void;
  onSetTodo: () => void;
  onOpenDetail: () => void;
  tagsBelowActions?: boolean;
}

export function TaskCard({ task, tags, onComplete, onPending, onSetTodo, onOpenDetail, tagsBelowActions = false }: TaskCardProps) {
  const { t } = useTranslation();
  const taskTags = tags.filter((tag) => task.tagIds.includes(tag.id));

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpenDetail}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          onOpenDetail();
        }
      }}
      className={cn(
        "cursor-pointer rounded-[28px] border border-blue-100 bg-white p-4 shadow-sm shadow-blue-900/5",
        task.status === "pending" && "border-emerald-200 bg-emerald-50/80 shadow-emerald-900/5",
        task.status === "complete" && "border-slate-200 bg-slate-50/80",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">{task.name}</h3>
            {task.isMustDo ? <span className="text-sm font-black text-rose-600">!</span> : null}
            {task.photo || task.completionPhoto ? <Camera className="h-4 w-4 text-slate-400" /> : null}
          </div>
          <p className="text-xs text-slate-500">
            {t("deadline")}: {toDisplayDate(task.date)}
          </p>
        </div>
        <div className={cn("flex items-center gap-2", tagsBelowActions && "flex-col items-end gap-1.5")}>
          {task.status === "pending" ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onSetTodo();
              }}
              className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700"
            >
              {t("pending")}
            </button>
          ) : (
            <div
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
                task.status === "complete" ? "bg-slate-200 text-slate-600" : "bg-slate-100 text-slate-500",
              )}
            >
              {task.status === "complete" ? t("complete") : t("todo")}
            </div>
          )}

          {tagsBelowActions ? (
            <div className="flex max-w-[9rem] flex-wrap justify-end gap-1.5">
              {taskTags.map((tag) => (
                <div
                  key={tag.id}
                  className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-white px-2 py-1 text-[10px] font-medium text-slate-600"
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
                  <span className="truncate">{tag.name}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {!tagsBelowActions ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {taskTags.map((tag) => (
            <TagChip key={tag.id} label={tag.name} color={tag.color} />
          ))}
        </div>
      ) : null}

      {task.status === "complete" ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSetTodo();
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-800"
          >
            <Clock3 className="h-4 w-4" />
            {t("todo")}
          </button>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onComplete();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-800"
          >
            <CheckCheck className="h-4 w-4" />
            {t("complete")}
          </button>
          {task.status === "pending" ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onSetTodo();
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              <Clock3 className="h-4 w-4" />
              {t("todo")}
            </button>
          ) : (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onPending();
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              <Clock3 className="h-4 w-4" />
              {t("pending")}
            </button>
          )}
        </div>
      )}

    </article>
  );
}
