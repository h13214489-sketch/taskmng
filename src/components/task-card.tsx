import { Camera, CheckCheck, Clock3 } from "lucide-react";
import { useTranslation } from "react-i18next";

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
}

export function TaskCard({ task, tags, onComplete, onPending, onSetTodo, onOpenDetail }: TaskCardProps) {
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
        "cursor-pointer rounded-[28px] border border-teal-100 bg-white/95 p-4 shadow-sm shadow-teal-900/5",
        task.status === "pending" && "border-slate-200 bg-slate-100/90 shadow-slate-900/5",
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
        <div className="flex max-w-[9rem] flex-wrap justify-end gap-1.5">
          {taskTags.map((tag) => (
            <div
              key={tag.id}
              className="inline-flex items-center gap-1 rounded-full border border-teal-100 bg-white px-2 py-1 text-[10px] font-medium text-slate-600"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
              <span className="truncate">{tag.name}</span>
            </div>
          ))}
        </div>
      </div>

      {task.status === "complete" ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSetTodo();
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-teal-700"
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
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-xs font-semibold transition",
              task.status === "pending"
                ? "bg-slate-700 text-white hover:bg-slate-800"
                : "bg-teal-600 text-white hover:bg-teal-700",
            )}
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
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
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
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-teal-100 bg-teal-50 px-3 py-2.5 text-xs font-semibold text-teal-700 transition hover:bg-teal-100"
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
