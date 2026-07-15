import { AdminError, normalizeAdminError } from "./errors";
import { mediaAspectRatio, type MediaFit, type MediaSlotDefinition } from "./media-schema";

const SOURCE_LIMIT = 30 * 1024 * 1024;
const SVG_LIMIT = 2 * 1024 * 1024;
const OUTPUT_LIMIT = 5 * 1024 * 1024;
const OUTPUT_TARGET = 4.6 * 1024 * 1024;

const rasterExtensions = new Set(["jpg", "jpeg", "png", "webp", "avif", "heic", "heif"]);
const rasterMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
]);

const forbiddenSvgElements = new Set([
  "script",
  "foreignobject",
  "iframe",
  "object",
  "embed",
  "audio",
  "video",
  "canvas",
  "style",
  "animate",
  "animatemotion",
  "animatetransform",
  "set",
]);

export interface MediaTransform {
  zoom: number;
  offsetX: number;
  offsetY: number;
  rotation: 0 | 90 | 180 | 270;
  fit: MediaFit;
}

export interface PreparedMediaSource {
  file: File;
  originalName: string;
  mimeType: string;
  width: number;
  height: number;
  checksum: string;
  isSvg: boolean;
  drawable: CanvasImageSource;
  previewUrl: string;
  release: () => void;
}

export interface GeneratedMediaFile {
  slotKey: string;
  file: File;
  width: number;
  height: number;
  primary: boolean;
  crop: MediaTransform;
}

function extension(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function safeBaseName(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "") || "imagem";
}

function isSvgFile(file: File): boolean {
  return file.type.toLowerCase() === "image/svg+xml" || extension(file.name) === "svg";
}

function isHeicFile(file: File): boolean {
  const ext = extension(file.name);
  const mime = file.type.toLowerCase();
  return ext === "heic" || ext === "heif" || mime === "image/heic" || mime === "image/heif";
}

async function checksum(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}

function numericDimension(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value.replace(/[^0-9.+-]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function sanitizeSvgAttribute(element: Element, attribute: Attr): void {
  const name = attribute.name.toLowerCase();
  const value = attribute.value.trim();
  if (name.startsWith("on")) {
    element.removeAttribute(attribute.name);
    return;
  }
  if (name === "href" || name === "xlink:href") {
    if (!value.startsWith("#")) element.removeAttribute(attribute.name);
    return;
  }
  if (/javascript:|data:text\/html|vbscript:/i.test(value)) {
    element.removeAttribute(attribute.name);
    return;
  }
  if (name === "style" && /url\s*\(|@import|expression\s*\(|behavior\s*:/i.test(value)) {
    element.removeAttribute(attribute.name);
    return;
  }
  if (/url\s*\(/i.test(value) && !/^url\(\s*#[^)]+\s*\)$/i.test(value)) {
    element.removeAttribute(attribute.name);
  }
}

async function sanitizeSvg(file: File): Promise<{ file: File; width: number; height: number }> {
  if (file.size > SVG_LIMIT) {
    throw new AdminError("O SVG excede 2 MB. Simplifique o arquivo antes de enviar.", "MEDIA_SVG_TOO_LARGE");
  }
  const parser = new DOMParser();
  const documentNode = parser.parseFromString(await file.text(), "image/svg+xml");
  if (documentNode.querySelector("parsererror")) {
    throw new AdminError("O arquivo SVG não possui uma estrutura válida.", "MEDIA_SVG_INVALID");
  }
  const root = documentNode.documentElement;
  if (root.localName.toLowerCase() !== "svg") {
    throw new AdminError("O arquivo selecionado não é um SVG válido.", "MEDIA_SVG_INVALID_ROOT");
  }

  for (const element of Array.from(root.querySelectorAll("*"))) {
    if (forbiddenSvgElements.has(element.localName.toLowerCase())) {
      element.remove();
      continue;
    }
    for (const attribute of Array.from(element.attributes)) sanitizeSvgAttribute(element, attribute);
  }
  for (const attribute of Array.from(root.attributes)) sanitizeSvgAttribute(root, attribute);

  let width = numericDimension(root.getAttribute("width"));
  let height = numericDimension(root.getAttribute("height"));
  const viewBox = root.getAttribute("viewBox")?.trim().split(/[ ,]+/).map(Number);
  const viewWidth = viewBox?.[2];
  const viewHeight = viewBox?.[3];
  if (
    viewBox?.length === 4
    && viewBox.every(Number.isFinite)
    && typeof viewWidth === "number"
    && typeof viewHeight === "number"
    && viewWidth > 0
    && viewHeight > 0
  ) {
    width ??= viewWidth;
    height ??= viewHeight;
  }
  if (!width || !height) {
    throw new AdminError("O SVG precisa ter viewBox ou largura e altura válidas.", "MEDIA_SVG_DIMENSIONS_REQUIRED");
  }
  if (!root.getAttribute("viewBox")) root.setAttribute("viewBox", `0 0 ${width} ${height}`);
  root.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  root.removeAttribute("width");
  root.removeAttribute("height");

  const serialized = new XMLSerializer().serializeToString(root);
  const sanitized = new File([serialized], `${safeBaseName(file.name)}.svg`, {
    type: "image/svg+xml",
    lastModified: Date.now(),
  });
  return { file: sanitized, width: Math.round(width), height: Math.round(height) };
}

async function loadDrawable(file: File): Promise<{ drawable: CanvasImageSource; width: number; height: number; previewUrl: string; release: () => void }> {
  const previewUrl = URL.createObjectURL(file);
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        drawable: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        previewUrl,
        release: () => {
          bitmap.close();
          URL.revokeObjectURL(previewUrl);
        },
      };
    } catch {
      // Safari and some HEIC implementations need the image element fallback.
    }
  }

  const image = new Image();
  image.decoding = "async";
  image.src = previewUrl;
  try {
    await new Promise<void>((resolve, reject) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => reject(new Error("image_decode_failed")), { once: true });
    });
  } catch (error) {
    URL.revokeObjectURL(previewUrl);
    throw error;
  }
  return {
    drawable: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    previewUrl,
    release: () => URL.revokeObjectURL(previewUrl),
  };
}

export async function prepareMediaSource(file: File, slot: MediaSlotDefinition): Promise<PreparedMediaSource> {
  if (file.size === 0) throw new AdminError("Escolha um arquivo válido.", "MEDIA_EMPTY_FILE");
  if (file.size > SOURCE_LIMIT) throw new AdminError("O arquivo original excede 30 MB.", "MEDIA_SOURCE_TOO_LARGE");

  let sourceFile = file;
  let declaredWidth: number | null = null;
  let declaredHeight: number | null = null;
  const svg = isSvgFile(file);
  if (svg) {
    if (!slot.acceptsSvg) {
      throw new AdminError("SVG é aceito somente nos campos de logo e favicon.", "MEDIA_SVG_SLOT_NOT_ALLOWED");
    }
    const sanitized = await sanitizeSvg(file);
    sourceFile = sanitized.file;
    declaredWidth = sanitized.width;
    declaredHeight = sanitized.height;
  } else {
    const ext = extension(file.name);
    const mime = file.type.toLowerCase();
    if (!rasterExtensions.has(ext) && !rasterMimeTypes.has(mime)) {
      throw new AdminError("Formato não reconhecido. Use SVG, JPG, PNG, WebP, AVIF, HEIC ou HEIF conforme o campo.", "MEDIA_UNSUPPORTED_SOURCE");
    }
  }

  let loaded: Awaited<ReturnType<typeof loadDrawable>>;
  try {
    loaded = await loadDrawable(sourceFile);
  } catch (error) {
    if (isHeicFile(file)) {
      throw new AdminError("Este navegador não conseguiu abrir a foto HEIC. No iPhone, use o Safari atualizado ou envie em formato Mais Compatível.", "MEDIA_HEIC_DECODE_FAILED");
    }
    throw normalizeAdminError(error, { code: "MEDIA_DECODE_FAILED", message: "Não foi possível abrir este arquivo." });
  }

  const width = declaredWidth ?? loaded.width;
  const height = declaredHeight ?? loaded.height;
  if (width < 1 || height < 1) {
    loaded.release();
    throw new AdminError("O arquivo não possui dimensões válidas.", "MEDIA_INVALID_DIMENSIONS");
  }

  return {
    file: sourceFile,
    originalName: file.name,
    mimeType: sourceFile.type || file.type,
    width,
    height,
    checksum: await checksum(sourceFile),
    isSvg: svg,
    drawable: loaded.drawable,
    previewUrl: loaded.previewUrl,
    release: loaded.release,
  };
}

function canvasBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("canvas_encode_failed")), mimeType, quality);
  });
}

function rotatedSize(source: PreparedMediaSource, rotation: MediaTransform["rotation"]): { width: number; height: number } {
  return rotation === 90 || rotation === 270
    ? { width: source.height, height: source.width }
    : { width: source.width, height: source.height };
}

export function renderMediaCanvas(
  source: PreparedMediaSource,
  width: number,
  height: number,
  transform: MediaTransform,
  transparent = true,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: transparent });
  if (!context) throw new AdminError("O navegador não conseguiu preparar a imagem.", "MEDIA_CANVAS_UNAVAILABLE");
  if (!transparent) {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  }

  const rotated = rotatedSize(source, transform.rotation);
  const baseScale = transform.fit === "cover"
    ? Math.max(width / rotated.width, height / rotated.height)
    : Math.min(width / rotated.width, height / rotated.height);
  const scale = baseScale * Math.max(1, transform.zoom);
  const offsetX = transform.offsetX * width;
  const offsetY = transform.offsetY * height;

  context.save();
  context.translate(width / 2 + offsetX, height / 2 + offsetY);
  context.rotate(transform.rotation * Math.PI / 180);
  context.scale(scale, scale);
  context.drawImage(source.drawable, -source.width / 2, -source.height / 2, source.width, source.height);
  context.restore();
  return canvas;
}

async function encodedRaster(
  canvas: HTMLCanvasElement,
  name: string,
  preferredMime: "image/webp" | "image/png",
): Promise<File> {
  let mimeType: string = preferredMime;
  let quality = 0.9;
  let blob = await canvasBlob(canvas, mimeType, preferredMime === "image/webp" ? quality : undefined);

  if (preferredMime === "image/png" && blob.size > OUTPUT_TARGET) {
    mimeType = "image/webp";
    blob = await canvasBlob(canvas, mimeType, quality);
  }
  while (blob.size > OUTPUT_TARGET && mimeType === "image/webp" && quality > 0.55) {
    quality -= 0.07;
    blob = await canvasBlob(canvas, mimeType, quality);
  }
  if (blob.size > OUTPUT_LIMIT) {
    throw new AdminError("A versão final permaneceu acima de 5 MB.", "MEDIA_OUTPUT_TOO_LARGE");
  }
  const ext = mimeType === "image/png" ? "png" : "webp";
  return new File([blob], `${safeBaseName(name)}.${ext}`, { type: mimeType, lastModified: Date.now() });
}

function proportionalSize(source: PreparedMediaSource, maximum: number): { width: number; height: number } {
  const scale = Math.min(1, maximum / Math.max(source.width, source.height));
  return {
    width: Math.max(1, Math.round(source.width * scale)),
    height: Math.max(1, Math.round(source.height * scale)),
  };
}

async function generateLogo(source: PreparedMediaSource, transform: MediaTransform): Promise<GeneratedMediaFile[]> {
  if (source.isSvg) {
    const fallbackSize = proportionalSize(source, 1200);
    const fallbackCanvas = renderMediaCanvas(source, fallbackSize.width, fallbackSize.height, { ...transform, fit: "contain", zoom: 1, offsetX: 0, offsetY: 0 }, true);
    const fallback = await encodedRaster(fallbackCanvas, `${source.originalName}-fallback`, "image/png");
    return [
      { slotKey: "logo_header", file: source.file, width: source.width, height: source.height, primary: true, crop: transform },
      { slotKey: "logo_header_png", file: fallback, width: fallbackSize.width, height: fallbackSize.height, primary: false, crop: transform },
    ];
  }
  const size = proportionalSize(source, 1600);
  const canvas = renderMediaCanvas(source, size.width, size.height, { ...transform, fit: "contain", zoom: 1, offsetX: 0, offsetY: 0 }, true);
  const file = await encodedRaster(canvas, source.originalName, "image/png");
  return [{ slotKey: "logo_header", file, width: size.width, height: size.height, primary: true, crop: transform }];
}

async function generateFavicons(source: PreparedMediaSource, transform: MediaTransform): Promise<GeneratedMediaFile[]> {
  const sizes = [32, 180, 192, 512];
  const outputs: GeneratedMediaFile[] = [];
  for (const size of sizes) {
    const paddedTransform: MediaTransform = { ...transform, fit: "contain", zoom: Math.max(1, transform.zoom) * 0.84 };
    const canvas = renderMediaCanvas(source, size, size, paddedTransform, true);
    const file = await encodedRaster(canvas, `${source.originalName}-${size}`, "image/png");
    outputs.push({
      slotKey: `favicon_${size}`,
      file,
      width: size,
      height: size,
      primary: size === 32,
      crop: paddedTransform,
    });
  }
  return outputs;
}

export async function generateMediaFiles(
  source: PreparedMediaSource,
  slot: MediaSlotDefinition,
  transform: MediaTransform,
): Promise<GeneratedMediaFile[]> {
  if (slot.kind === "logo") return generateLogo(source, transform);
  if (slot.kind === "favicon") return generateFavicons(source, transform);

  const ratio = mediaAspectRatio(slot);
  const dimensions = ratio && slot.width && slot.height
    ? { width: slot.width, height: slot.height }
    : proportionalSize(source, slot.maximumDimension);
  const canvas = renderMediaCanvas(source, dimensions.width, dimensions.height, transform, false);
  const file = await encodedRaster(canvas, source.originalName, "image/webp");
  return [{
    slotKey: slot.key,
    file,
    width: dimensions.width,
    height: dimensions.height,
    primary: true,
    crop: transform,
  }];
}
