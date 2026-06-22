import { useMemo, useState } from "react";
import { Camera, Store, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ImageLightbox } from "@/components/image-lightbox";
import { useAppStore } from "@/store/use-app-store";
import { ImageUploadError, type ImageUploadErrorCode, optimizeImageFile } from "@/utils/image";

export default function MenuPage() {
  const { t } = useTranslation();
  const { menuItems, addMenuItem, deleteMenuItem } = useAppStore();
  const [restaurantName, setRestaurantName] = useState("");
  const [qrCodeImage, setQrCodeImage] = useState<string | undefined>();
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const sortedItems = useMemo(() => {
    return [...menuItems].sort((left, right) => right.createdAt - left.createdAt);
  }, [menuItems]);

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
      setQrCodeImage(optimizedImage.dataUrl);
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!restaurantName.trim() || !qrCodeImage) {
      return;
    }

    try {
      await addMenuItem(restaurantName, qrCodeImage);
      setRestaurantName("");
      setQrCodeImage(undefined);
      setImageError(null);
    } catch {
      setImageError(t("imageSaveFailed"));
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex h-12 items-center">
        <h1 className="text-base font-semibold text-slate-900">{t("restaurantMenu")}</h1>
      </div>

      <section className="-ml-14 w-[calc(100%+3.5rem)] space-y-3 pt-0.5">
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-3 rounded-[28px] border border-blue-100 bg-white p-3"
        >
          <label className="block space-y-2">
            <input
              value={restaurantName}
              onChange={(event) => setRestaurantName(event.target.value)}
              placeholder={t("restaurantNamePlaceholder")}
              className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400"
            />
          </label>

          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{t("qrCode")}</span>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 px-4 py-4 text-sm font-medium text-slate-700">
              <Camera className="h-4 w-4" />
              <span>{isProcessingImage ? `${t("uploadQrCode")}...` : t("uploadQrCode")}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={isProcessingImage} />
            </label>
            <p className="text-xs text-slate-400">{t("imageUploadHint")}</p>
            {imageError ? <p className="text-sm text-rose-600">{imageError}</p> : null}
            {qrCodeImage ? (
              <button
                type="button"
                onClick={() => setPreviewImage({ src: qrCodeImage, alt: t("qrCode") })}
                className="block w-full"
              >
                <img src={qrCodeImage} alt={t("qrCode")} className="h-24 w-full rounded-2xl bg-slate-50 p-3 object-contain cursor-zoom-in" />
              </button>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={!restaurantName.trim() || !qrCodeImage || isProcessingImage}
            className="w-full rounded-2xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            {t("saveMenu")}
          </button>
        </form>

        {sortedItems.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
            {t("noMenuItems")}
          </div>
        ) : (
          <section className="space-y-2.5">
            {sortedItems.map((item) => (
              <article key={item.id} className="rounded-[28px] border border-slate-100 bg-white p-3 shadow-sm shadow-blue-900/5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-slate-400" />
                    <h2 className="text-sm font-semibold text-slate-900">{item.restaurantName}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => void deleteMenuItem(item.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-100 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                    aria-label={t("delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewImage({ src: item.qrCodeImage, alt: `${item.restaurantName} QR Code` })}
                  className="mt-3 block w-full"
                >
                  <img
                    src={item.qrCodeImage}
                    alt={`${item.restaurantName} QR Code`}
                    className="h-36 w-full rounded-2xl bg-slate-50 p-3 object-contain cursor-zoom-in"
                  />
                </button>
              </article>
            ))}
          </section>
        )}
      </section>

      {previewImage ? <ImageLightbox open={true} src={previewImage.src} alt={previewImage.alt} onClose={() => setPreviewImage(null)} /> : null}
    </div>
  );
}
