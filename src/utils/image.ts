export const MAX_IMAGE_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 1600;
const OUTPUT_IMAGE_TYPE = "image/webp";
const OUTPUT_IMAGE_QUALITY = 0.86;

export type ImageUploadErrorCode = "invalid_type" | "file_too_large" | "load_failed" | "process_failed";

export class ImageUploadError extends Error {
  code: ImageUploadErrorCode;

  constructor(code: ImageUploadErrorCode) {
    super(code);
    this.code = code;
    this.name = "ImageUploadError";
  }
}

function loadImage(objectUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new ImageUploadError("load_failed"));
    image.src = objectUrl;
  });
}

function readBlobAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new ImageUploadError("process_failed"));
    };
    reader.onerror = () => reject(new ImageUploadError("process_failed"));
    reader.readAsDataURL(blob);
  });
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new ImageUploadError("process_failed"));
      },
      OUTPUT_IMAGE_TYPE,
      OUTPUT_IMAGE_QUALITY,
    );
  });
}

export async function optimizeImageFile(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new ImageUploadError("invalid_type");
  }

  if (file.size > MAX_IMAGE_UPLOAD_SIZE_BYTES) {
    throw new ImageUploadError("file_too_large");
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
    const targetWidth = Math.max(1, Math.round(image.width * scale));
    const targetHeight = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new ImageUploadError("process_failed");
    }

    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    const blob = await canvasToBlob(canvas);
    const dataUrl = await readBlobAsDataUrl(blob);

    return {
      dataUrl,
      width: targetWidth,
      height: targetHeight,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

