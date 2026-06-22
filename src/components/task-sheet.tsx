import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ImageLightbox } from "@/components/image-lightbox";
import { TagChip } from "@/components/tag-chip";
import { cn } from "@/lib/utils";
import type { AddTaskInput, ResolvedTask, Tag } from "@/types/models";
import { toDisplayDate } from "@/utils/date";
import { ImageUploadError, type ImageUploadErrorCode, optimizeImageFile } from "@/utils/image";

interface TaskSheetProps {
  open: boolean;
  mode: "create" | "detail" | "complete" | null;
  task: ResolvedTask | null;
  tags: Tag[];
  selectedDate: string;
  onClose: () => void;
  onSave: (input: AddTaskInput) => Promise<void>;
  onUpdate: (task: ResolvedTask, input: AddTaskInput) => Promise<void>;
  onConfirmComplete: (task: ResolvedTask, completionPhoto?: string) => Promise<void>;
  onDelete: (task: ResolvedTask) => Promise<void>;
  onEndRoutine: (task: ResolvedTask) => Promise<void>;
}

export function TaskSheet({
  open,
  mode,
  task,
  tags,
  selectedDate,
  onClose,
  onSave,
  onUpdate,
  onConfirmComplete,
  onDelete,
  onEndRoutine,
}: TaskSheetProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [deadline, setDeadline] = useState("");
  const [isRoutine, setIsRoutine] = useState(false);
  const [isMustDo, setIsMustDo] = useState(false);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [photo, setPhoto] = useState<string | undefined>();
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (mode !== "create") {
      return;
    }

    setName("");
    setDetail("");
    setDeadline(toDisplayDate(selectedDate));
    setIsRoutine(false);
    setIsMustDo(false);
    setTagIds([]);
    setPhoto(undefined);
    setImageError(null);
  }, [mode, selectedDate]);

  useEffect(() => {
    if (mode !== "complete") {
      return;
    }

    setPhoto(undefined);
    setImageError(null);
  }, [mode, task?.seriesId, task?.date]);

  useEffect(() => {
    if (mode !== "detail" || !task) {
      return;
    }

    setName(task.name);
    setDetail(task.detail);
    setDeadline(toDisplayDate(task.date));
    setIsRoutine(task.isRoutine);
    setIsMustDo(task.isMustDo);
    setTagIds(task.tagIds);
    setPhoto(task.photo);
    setImageError(null);
  }, [mode, task?.seriesId, task?.date]);

  const title = useMemo(() => {
    if (mode === "complete") {
      return t("complete");
    }

    return t("addTask");
  }, [mode, t]);

  if (!open || !mode) {
    return null;
  }

  function resolveImageError(code: ImageUploadErrorCode) {
    switch (code) {
      case "invalid_type":
        return t("imageInvalidType");
      case "file_too_large":
        return t("imageTooLarge");
      case "load_failed":
      case "process_failed":
      default:
        return t("imageProcessFailed");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !deadline.trim()) {
      return;
    }

    try {
      const payload: AddTaskInput = {
        name,
        detail,
        deadline,
        isRoutine,
        isMustDo,
        tagIds,
        photo,
      };

      if (mode === "detail" && task) {
        await onUpdate(task, payload);
        setImageError(null);
        return;
      }

      await onSave(payload);
      setImageError(null);
    } catch {
      setImageError(t("imageSaveFailed"));
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setImageError(null);
    setIsProcessingImage(true);

    try {
      const optimizedImage = await optimizeImageFile(file);
      setPhoto(optimizedImage.dataUrl);
    } catch (error) {
      if (error instanceof ImageUploadError) {
        setImageError(resolveImageError(error.code));
      } else {
        setImageError(t("imageProcessFailed"));
      }
    } finally {
      setIsProcessingImage(false);
    }
  }

  function openFilePicker() {
    if (isProcessingImage) {
      return;
    }

    fileInputRef.current?.click();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-900/50 backdrop-blur-sm">
      <section
        className={cn(
          "w-full overflow-y-auto bg-blue-50 px-5 pb-4 pt-4 shadow-2xl shadow-blue-900/20",
          mode === "create" ? "h-screen rounded-none" : "max-h-[92vh] rounded-t-[32px]",
        )}
      >
        {mode !== "create" ? <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-slate-200" /> : null}
        {mode !== "create" ? (
          <div className="mb-3 flex items-center justify-between gap-4">
            {mode === "detail" ? <div /> : <h2 className="text-lg font-semibold text-slate-900">{title}</h2>}
            <div className="flex items-center gap-2">
              {mode === "detail" && task ? (
                <button
                  type="button"
                  onClick={() => void onDelete(task)}
                  className="rounded-full border border-rose-200 bg-rose-50 p-2 text-rose-600 transition hover:border-rose-300"
                  aria-label={t("delete")}
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-blue-100 bg-white p-2 text-slate-500 transition hover:border-blue-200"
                aria-label={t("close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : null}

        {mode === "complete" && task ? (
          <div className="space-y-4">
            <div className="rounded-[28px] border border-blue-100 bg-white p-4">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900">{task.name}</h3>
                {task.isMustDo ? <span className="text-sm font-black text-rose-600">!</span> : null}
              </div>
              <p className="mt-3 text-xs text-slate-500">
                {t("deadline")}: {toDisplayDate(task.date)}
              </p>
              {photo ? (
                <button type="button" className="mt-4 block w-full" onClick={() => setPreviewImage({ src: photo, alt: t("completionRecordPreview") })}>
                  <img src={photo} alt={t("completionRecordPreview")} className="h-44 w-full rounded-2xl object-cover cursor-zoom-in" />
                </button>
              ) : null}
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t("uploadRecord")}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileChange}
                disabled={isProcessingImage}
                tabIndex={-1}
              />
              <button
                type="button"
                onClick={openFilePicker}
                disabled={isProcessingImage}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-blue-200 bg-white px-4 py-5 text-sm font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Camera className="h-4 w-4" />
                <span>{isProcessingImage ? `${t("uploadRecord")}...` : t("uploadRecord")}</span>
              </button>
              <p className="text-xs text-slate-400">{t("imageUploadHint")}</p>
              {imageError ? <p className="text-sm text-rose-600">{imageError}</p> : null}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await onConfirmComplete(task, photo);
                    setImageError(null);
                  } catch {
                    setImageError(t("imageSaveFailed"));
                  }
                }}
                disabled={isProcessingImage}
                className="rounded-2xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {t("complete")}
              </button>
            </div>
          </div>
        ) : (
          <form className="space-y-3" onSubmit={handleSubmit}>
            <label className="block space-y-1.5">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-base font-semibold text-slate-900 outline-none transition focus:border-blue-400"
                placeholder={t("taskName")}
                required
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t("taskDetail")}</span>
              <textarea
                value={detail}
                onChange={(event) => setDetail(event.target.value)}
                className="min-h-16 w-full rounded-2xl border border-blue-100 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                placeholder={t("taskDetail")}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t("deadline")}</span>
              <input
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
                className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                placeholder="dd/mm/yyyy"
                required
              />
            </label>

            <label className="flex items-center justify-between rounded-2xl border border-blue-100 bg-white px-4 py-3">
              <span className="text-sm font-medium text-slate-700">{t("routineTask")}</span>
              <input type="checkbox" checked={isRoutine} onChange={(event) => setIsRoutine(event.target.checked)} />
            </label>

            <label className="flex items-center justify-between rounded-2xl border border-blue-100 bg-white px-4 py-3">
              <span className="text-sm font-medium text-slate-700">{t("mustDo")}</span>
              <input type="checkbox" checked={isMustDo} onChange={(event) => setIsMustDo(event.target.checked)} />
            </label>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t("chooseTags")}</span>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <TagChip
                    key={tag.id}
                    label={tag.name}
                    color={tag.color}
                    selected={tagIds.includes(tag.id)}
                    onClick={() =>
                      setTagIds((current) =>
                        current.includes(tag.id) ? current.filter((item) => item !== tag.id) : [...current, tag.id],
                      )
                    }
                  />
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileChange}
                disabled={isProcessingImage}
                tabIndex={-1}
              />
              <button
                type="button"
                onClick={openFilePicker}
                disabled={isProcessingImage}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-blue-200 bg-white px-4 py-4 text-sm font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Camera className="h-4 w-4" />
                <span>{isProcessingImage ? `${t("photoUpload")}...` : t("photoUpload")}</span>
              </button>
              <p className="text-xs text-slate-400">{t("imageUploadHint")}</p>
              {imageError ? <p className="text-sm text-rose-600">{imageError}</p> : null}
              {photo ? (
                <button type="button" className="block w-full" onClick={() => setPreviewImage({ src: photo, alt: t("taskPreview") })}>
                  <img src={photo} alt={t("taskPreview")} className="h-40 w-full rounded-2xl object-cover cursor-zoom-in" />
                </button>
              ) : null}
            </div>

            {mode === "detail" && task?.completionPhoto ? (
              <button
                type="button"
                className="block w-full"
                onClick={() => setPreviewImage({ src: task.completionPhoto ?? "", alt: `${task.name} ${t("uploadRecord")}` })}
              >
                <img
                  src={task.completionPhoto}
                  alt={`${task.name} ${t("uploadRecord")}`}
                  className="h-28 w-full rounded-2xl object-cover cursor-zoom-in"
                  loading="lazy"
                />
              </button>
            ) : null}

            {mode === "detail" && task?.isRoutine ? (
              <button
                type="button"
                onClick={() => void onEndRoutine(task)}
                className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-blue-50"
              >
                {t("endRoutineTask")}
              </button>
            ) : null}

            <div className="sticky bottom-0 -mx-5 bg-blue-50/95 px-5 pb-2 pt-3 backdrop-blur">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isProcessingImage}
                  className="rounded-2xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {t("saveTask")}
                </button>
              </div>
            </div>
          </form>
        )}
      </section>
      {previewImage ? <ImageLightbox open={true} src={previewImage.src} alt={previewImage.alt} onClose={() => setPreviewImage(null)} /> : null}
    </div>
  );
}
