import { Download, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getDistance(left: { x: number; y: number }, right: { x: number; y: number }) {
  return Math.hypot(right.x - left.x, right.y - left.y);
}

function getCenter(left: { x: number; y: number }, right: { x: number; y: number }) {
  return { x: (left.x + right.x) / 2, y: (left.y + right.y) / 2 };
}

interface ImageLightboxProps {
  open: boolean;
  src: string;
  alt: string;
  onClose: () => void;
}

const MIN_SCALE = 0.5;
const BASE_SCALE = 0.9;
const MAX_SCALE = 5;

export function ImageLightbox({ open, src, alt, onClose }: ImageLightboxProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(BASE_SCALE);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [pointers, setPointers] = useState<Record<number, { x: number; y: number }>>({});
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [isScanningQr, setIsScanningQr] = useState(false);
  const [pinchStart, setPinchStart] = useState<{
    distance: number;
    scale: number;
    center: { x: number; y: number };
    offset: { x: number; y: number };
  } | null>(null);
  const lightboxHistoryActiveRef = useRef(false);
  const lightboxClosingFromHistoryRef = useRef(false);

  const safeScale = useMemo(() => clamp(scale, MIN_SCALE, MAX_SCALE), [scale]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setScale(BASE_SCALE);
    setOffset({ x: 0, y: 0 });
    setPointers({});
    setPinchStart(null);
    setQrValue(null);
    setQrError(null);
    setIsScanningQr(false);
  }, [open, src]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    function handlePopState() {
      lightboxClosingFromHistoryRef.current = true;
      onClose();
    }

    if (open && !lightboxHistoryActiveRef.current) {
      window.history.pushState({ overlay: "lightbox" }, "", window.location.href);
      lightboxHistoryActiveRef.current = true;
    }

    if (open) {
      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }

    if (lightboxHistoryActiveRef.current) {
      if (lightboxClosingFromHistoryRef.current) {
        lightboxClosingFromHistoryRef.current = false;
        lightboxHistoryActiveRef.current = false;
        return;
      }

      lightboxHistoryActiveRef.current = false;
      window.history.back();
    }
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  function getPoint(event: { clientX: number; clientY: number }) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      return { x: event.clientX, y: event.clientY };
    }

    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function toggleZoom() {
    if (safeScale > BASE_SCALE) {
      setScale(BASE_SCALE);
      setOffset({ x: 0, y: 0 });
      return;
    }

    setScale(2);
  }

  function handleDownload() {
    const link = document.createElement("a");
    link.href = src;
    link.download = alt || "image";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function decodeQr() {
    if (isScanningQr) {
      return;
    }

    setIsScanningQr(true);
    setQrValue(null);
    setQrError(null);

    try {
      const BarcodeDetectorCtor = (window as unknown as { BarcodeDetector?: any }).BarcodeDetector;
      if (!BarcodeDetectorCtor) {
        setQrError(t("qrUnsupported"));
        return;
      }

      const response = await fetch(src);
      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob);
      const detector = new BarcodeDetectorCtor({ formats: ["qr_code"] });
      const results: Array<{ rawValue?: string }> = await detector.detect(bitmap);
      const value = results[0]?.rawValue?.trim();

      if (!value) {
        setQrError(t("qrNotFound"));
        return;
      }

      setQrValue(value);
    } catch {
      setQrError(t("qrScanFailed"));
    } finally {
      setIsScanningQr(false);
    }
  }

  async function copyQrValue() {
    if (!qrValue) {
      return;
    }

    try {
      await navigator.clipboard.writeText(qrValue);
      setQrError(t("copied"));
    } catch {
      setQrError(qrValue);
    }
  }

  function openQrLink() {
    if (!qrValue) {
      return;
    }

    if (/^https?:\/\//i.test(qrValue)) {
      window.open(qrValue, "_blank", "noopener,noreferrer");
      return;
    }

    setQrError(qrValue);
  }

  function clearPointer(pointerId: number) {
    setPointers((prev) => {
      const next = { ...prev };
      delete next[pointerId];
      return next;
    });
    setPinchStart(null);
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[80] bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-end gap-3 p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleDownload();
          }}
          className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow-lg shadow-slate-900/15 transition hover:bg-white"
          aria-label={t("download")}
        >
          <Download className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow-lg shadow-slate-900/15 transition hover:bg-white"
          aria-label={t("close")}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div
        ref={containerRef}
        className="flex h-screen w-screen items-center justify-center overflow-hidden px-[8vw] py-[12vh]"
        onClick={(event) => event.stopPropagation()}
        onDoubleClick={toggleZoom}
        onWheel={(event) => {
          event.preventDefault();
          const direction = event.deltaY > 0 ? -1 : 1;
          setScale((current) => clamp(current + direction * 0.15, MIN_SCALE, MAX_SCALE));
        }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setPointers((prev) => ({ ...prev, [event.pointerId]: getPoint(event) }));
        }}
        onPointerMove={(event) => {
          const nextPointers = { ...pointers, [event.pointerId]: getPoint(event) };
          const ids = Object.keys(nextPointers).map((value) => Number(value));

          if (ids.length >= 2) {
            const [firstId, secondId] = ids;
            const first = nextPointers[firstId];
            const second = nextPointers[secondId];
            if (!first || !second) {
              setPointers(nextPointers);
              return;
            }

            const center = getCenter(first, second);
            const distance = getDistance(first, second);

            if (!pinchStart) {
              setPinchStart({ distance, scale: safeScale, center, offset });
              setPointers(nextPointers);
              return;
            }

            const nextScale = clamp((distance / pinchStart.distance) * pinchStart.scale, MIN_SCALE, MAX_SCALE);
            const nextOffset = { x: pinchStart.offset.x + (center.x - pinchStart.center.x), y: pinchStart.offset.y + (center.y - pinchStart.center.y) };

            setScale(nextScale);
            setOffset(nextOffset);
            setPointers(nextPointers);
            return;
          }

          if (ids.length === 1 && safeScale > BASE_SCALE) {
            const pointer = nextPointers[ids[0]];
            const previous = pointers[ids[0]];
            if (pointer && previous) {
              setOffset((current) => ({
                x: current.x + (pointer.x - previous.x),
                y: current.y + (pointer.y - previous.y),
              }));
            }
          }

          setPointers(nextPointers);
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          clearPointer(event.pointerId);
        }}
        onPointerCancel={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          clearPointer(event.pointerId);
        }}
        onLostPointerCapture={(event) => {
          clearPointer(event.pointerId);
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse" && event.buttons === 0) {
            clearPointer(event.pointerId);
          }
        }}
      >
        <div className="flex h-full w-full items-center justify-center overflow-hidden bg-transparent">
          <img
            src={src}
            alt={alt}
            className="max-h-full max-w-full select-none object-contain"
            draggable={false}
            style={{
              transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${safeScale})`,
              transformOrigin: "center center",
              cursor: safeScale > BASE_SCALE ? "grab" : "zoom-in",
              touchAction: "none",
              willChange: "transform",
            }}
            onContextMenu={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void decodeQr();
            }}
            onClick={(event) => {
              if (safeScale <= BASE_SCALE + 0.001) {
                event.stopPropagation();
                toggleZoom();
              }
            }}
          />
        </div>
      </div>
      {qrValue || qrError ? (
        <div className="fixed inset-x-0 bottom-0 z-20 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div
            className="mx-auto w-full max-w-[440px] rounded-[28px] border border-rose-100 bg-white/95 p-4 shadow-2xl shadow-slate-900/25 backdrop-blur"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{t("qrResult")}</p>
                <p className="mt-2 break-words text-sm font-medium text-slate-900">{qrValue ?? qrError}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setQrValue(null);
                  setQrError(null);
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-slate-600 transition hover:bg-rose-100"
                aria-label={t("close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {qrValue ? (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => void copyQrValue()}
                  className="rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-rose-50"
                >
                  {t("copyLink")}
                </button>
                <button
                  type="button"
                  onClick={openQrLink}
                  className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
                >
                  {t("openLink")}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
