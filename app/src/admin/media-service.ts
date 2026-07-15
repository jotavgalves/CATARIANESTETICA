import { AdminError, normalizeAdminError } from "./errors";
import { storeMediaFile } from "./repository";

const SOURCE_FILE_LIMIT = 30 * 1024 * 1024;
const UPLOAD_FILE_LIMIT = 5 * 1024 * 1024;
const TARGET_FILE_SIZE = 4.5 * 1024 * 1024;
const MIN_QUALITY = 0.58;

const supportedExtensions = new Set(["jpg", "jpeg", "png", "webp", "avif", "heic", "heif"]);
const supportedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
]);

export type MediaUploadStage = "validating" | "preparing" | "uploading" | "registering" | "complete";

export interface MediaUploadProgress {
  stage: MediaUploadStage;
  message: string;
}

export interface MediaUploadResult {
  publicUrl: string;
  storagePath: string;
  originalBytes: number;
  uploadedBytes: number;
  width: number;
  height: number;
  mimeType: string;
  converted: boolean;
}

interface PreparedImage {
  file: File;
  width: number;
  height: number;
  converted: boolean;
}

interface DrawableImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
}

function extension(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function isHeicSource(file: Pick<File, "name" | "type">): boolean {
  const type = file.type.toLowerCase();
  const ext = extension(file.name);
  return type === "image/heic" || type === "image/heif" || ext === "heic" || ext === "heif";
}

export function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function mediaMaximumDimension(category: string): number {
  const normalized = category.toLowerCase();
  if (normalized.includes("hero") || normalized === "image_url") return 2400;
  if (normalized.includes("before") || normalized.includes("after") || normalized.includes("result")) return 2200;
  if (normalized.includes("logo") || normalized.includes("favicon")) return 1600;
  if (normalized.includes("photo") || normalized.includes("team")) return 1800;
  return 2000;
}

function validateSource(file: File): void {
  if (file.size === 0) throw new AdminError("Escolha uma imagem válida.", "MEDIA_EMPTY_FILE");
  if (file.size > SOURCE_FILE_LIMIT) {
    throw new AdminError("A imagem original excede 30 MB. Reduza o arquivo antes de enviar.", "MEDIA_SOURCE_TOO_LARGE");
  }

  const ext = extension(file.name);
  const mime = file.type.toLowerCase();
  if (ext === "svg" || mime === "image/svg+xml") {
    throw new AdminError("Envie a logo ou a foto em PNG, JPG, WebP ou AVIF. SVG não é aceito pelo painel por segurança.", "MEDIA_SVG_BLOCKED");
  }
  if (!supportedExtensions.has(ext) && !supportedMimeTypes.has(mime)) {
    throw new AdminError("Formato não reconhecido. Use JPG, PNG, WebP, AVIF, HEIC ou HEIF.", "MEDIA_UNSUPPORTED_SOURCE");
  }
}

async function decodeWithImageElement(file: File): Promise<DrawableImage> {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = "async";
  image.src = objectUrl;

  try {
    await new Promise<void>((resolve, reject) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => reject(new Error("Image decoding failed")), { once: true });
    });
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      release: () => URL.revokeObjectURL(objectUrl),
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

async function decodeImage(file: File): Promise<DrawableImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      };
    } catch {
      return decodeWithImageElement(file);
    }
  }
  return decodeWithImageElement(file);
}

function scaledDimensions(width: number, height: number, maximum: number): { width: number; height: number } {
  if (width <= maximum && height <= maximum) return { width, height };
  const scale = Math.min(maximum / width, maximum / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function canvasBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas conversion failed"));
    }, mimeType, quality);
  });
}

function outputName(originalName: string, mimeType: string): string {
  const base = originalName.replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "") || "imagem";
  const ext = mimeType === "image/png" ? "png" : mimeType === "image/jpeg" ? "jpg" : "webp";
  return `${base}.${ext}`;
}

async function encodeImage(drawable: DrawableImage, file: File, category: string): Promise<PreparedImage> {
  const maximum = mediaMaximumDimension(category);
  let dimensions = scaledDimensions(drawable.width, drawable.height, maximum);
  let quality = 0.88;
  let mimeType = category.toLowerCase().includes("favicon") && file.type === "image/png" ? "image/png" : "image/webp";
  let lastBlob: Blob | null = null;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) throw new AdminError("Este navegador não conseguiu preparar a imagem.", "MEDIA_CANVAS_UNAVAILABLE");
    context.drawImage(drawable.source, 0, 0, dimensions.width, dimensions.height);

    try {
      lastBlob = await canvasBlob(canvas, mimeType, quality);
    } catch {
      if (mimeType === "image/webp") {
        mimeType = "image/jpeg";
        lastBlob = await canvasBlob(canvas, mimeType, quality);
      } else {
        throw new AdminError("Não foi possível converter a imagem neste navegador.", "MEDIA_CONVERSION_FAILED");
      }
    }

    if (lastBlob.size <= TARGET_FILE_SIZE) break;
    if (quality > MIN_QUALITY) {
      quality = Math.max(MIN_QUALITY, quality - 0.08);
    } else {
      dimensions = {
        width: Math.max(640, Math.round(dimensions.width * 0.84)),
        height: Math.max(640, Math.round(dimensions.height * 0.84)),
      };
      quality = 0.82;
    }
  }

  if (!lastBlob || lastBlob.size > UPLOAD_FILE_LIMIT) {
    throw new AdminError("A imagem não pôde ser reduzida para menos de 5 MB.", "MEDIA_OUTPUT_TOO_LARGE");
  }

  return {
    file: new File([lastBlob], outputName(file.name, lastBlob.type), {
      type: lastBlob.type,
      lastModified: Date.now(),
    }),
    width: dimensions.width,
    height: dimensions.height,
    converted: lastBlob.type !== file.type || lastBlob.size !== file.size || dimensions.width !== drawable.width || dimensions.height !== drawable.height,
  };
}

async function prepareImage(file: File, category: string): Promise<PreparedImage> {
  validateSource(file);

  let drawable: DrawableImage;
  try {
    drawable = await decodeImage(file);
  } catch (error) {
    if (isHeicSource(file)) {
      throw new AdminError("O navegador não conseguiu abrir esta foto HEIC. No iPhone, tente pelo Safari atualizado ou altere Câmera > Formatos > Mais Compatível.", "MEDIA_HEIC_DECODE_FAILED");
    }
    throw normalizeAdminError(error, {
      code: "MEDIA_DECODE_FAILED",
      message: "Não foi possível abrir esta imagem.",
    });
  }

  try {
    if (drawable.width < 1 || drawable.height < 1) {
      throw new AdminError("A imagem não possui dimensões válidas.", "MEDIA_INVALID_DIMENSIONS");
    }
    return await encodeImage(drawable, file, category);
  } finally {
    drawable.release();
  }
}

export async function uploadMedia(
  siteId: string,
  file: File,
  category: string,
  altText: string,
  onProgress?: (progress: MediaUploadProgress) => void,
): Promise<MediaUploadResult> {
  onProgress?.({ stage: "validating", message: "Validando a imagem…" });
  const originalBytes = file.size;

  onProgress?.({ stage: "preparing", message: isHeicSource(file) ? "Convertendo HEIC e otimizando…" : "Otimizando dimensões e tamanho…" });
  const prepared = await prepareImage(file, category);

  onProgress?.({ stage: "uploading", message: `Enviando ${formatByteSize(prepared.file.size)}…` });
  const stored = await storeMediaFile(siteId, {
    file: prepared.file,
    originalName: file.name,
    category,
    altText,
  });

  onProgress?.({ stage: "registering", message: "Registrando na biblioteca…" });
  const result: MediaUploadResult = {
    publicUrl: stored.publicUrl,
    storagePath: stored.storagePath,
    originalBytes,
    uploadedBytes: prepared.file.size,
    width: prepared.width,
    height: prepared.height,
    mimeType: prepared.file.type,
    converted: prepared.converted,
  };
  onProgress?.({ stage: "complete", message: "Imagem enviada com sucesso." });
  return result;
}
