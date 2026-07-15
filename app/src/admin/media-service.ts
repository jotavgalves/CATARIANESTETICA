import type { MediaRecord, MediaUsageReference, MediaVariantRecord } from "../lib/types";
import { AdminError, normalizeAdminError, reportAdminError } from "./errors";
import { generateMediaFiles, type MediaTransform, type PreparedMediaSource } from "./media-processor";
import type { MediaSlotDefinition } from "./media-schema";
import {
  createMediaRecord,
  createMediaVariant,
  deleteMediaMetadata,
  loadMediaUsage,
  removeMediaRecord,
  removeStorageFiles,
  replaceMediaUrl,
  replaceMediaVariant,
  restoreMedia,
  trashMedia,
  uploadStorageFile,
  type StoredMediaObject,
} from "./repository";

export type MediaUploadStage = "generating" | "uploading-original" | "uploading-variants" | "registering" | "complete";

export interface MediaUploadProgress {
  stage: MediaUploadStage;
  message: string;
  completed: number;
  total: number;
}

export interface MediaUploadResult {
  media: MediaRecord;
  primaryUrl: string;
  primaryVariant: MediaVariantRecord;
  uploadedBytes: number;
}

export function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function primaryVariant(variants: MediaVariantRecord[], preferredSlot: string): MediaVariantRecord {
  const exact = variants.find((variant) => variant.slot_key === preferredSlot);
  const favicon = variants.find((variant) => variant.slot_key === "favicon_32");
  const first = variants[0];
  if (exact) return exact;
  if (favicon) return favicon;
  if (first) return first;
  throw new AdminError("Nenhuma versão final foi criada.", "MEDIA_PRIMARY_VARIANT_MISSING");
}

async function cleanupIncomplete(siteId: string, mediaId: string | null, paths: string[]): Promise<void> {
  try {
    await removeStorageFiles(paths);
  } catch (error) {
    const normalized = normalizeAdminError(error, {
      code: "STORAGE_CLEANUP_FAILED",
      message: "Não foi possível remover todos os arquivos incompletos.",
    });
    reportAdminError("media-cleanup-storage", error, normalized);
  }
  if (!mediaId) return;
  try {
    await removeMediaRecord(siteId, mediaId);
  } catch (error) {
    const normalized = normalizeAdminError(error, {
      code: "MEDIA_RECORD_CLEANUP_FAILED",
      message: "Não foi possível remover o registro incompleto.",
    });
    reportAdminError("media-cleanup-record", error, normalized);
  }
}

export async function storeMedia(
  siteId: string,
  source: PreparedMediaSource,
  slot: MediaSlotDefinition,
  transform: MediaTransform,
  altText: string,
  onProgress?: (progress: MediaUploadProgress) => void,
): Promise<MediaUploadResult> {
  onProgress?.({ stage: "generating", message: "Gerando versões no tamanho correto…", completed: 0, total: 1 });
  const outputs = await generateMediaFiles(source, slot, transform);
  const totalSteps = outputs.length + 2;
  const uploadedPaths: string[] = [];
  let mediaId: string | null = null;

  try {
    onProgress?.({ stage: "uploading-original", message: "Enviando o arquivo original…", completed: 0, total: totalSteps });
    const originalStored = await uploadStorageFile(siteId, source.file, `${slot.category}/originals`);
    uploadedPaths.push(originalStored.storagePath);

    onProgress?.({ stage: "registering", message: "Registrando o original na biblioteca…", completed: 1, total: totalSteps });
    const media = await createMediaRecord(siteId, originalStored, {
      originalName: source.originalName,
      mimeType: source.mimeType,
      sizeBytes: source.file.size,
      category: slot.category,
      altText,
      mediaKind: slot.kind,
      width: source.width,
      height: source.height,
      checksum: source.checksum,
    });
    mediaId = media.id;

    const variants: MediaVariantRecord[] = [];
    let uploadedBytes = source.file.size;
    for (const [index, output] of outputs.entries()) {
      onProgress?.({
        stage: "uploading-variants",
        message: `Enviando versão ${index + 1} de ${outputs.length}…`,
        completed: index + 2,
        total: totalSteps,
      });
      let stored: StoredMediaObject;
      if (output.file === source.file) {
        stored = originalStored;
      } else {
        stored = await uploadStorageFile(siteId, output.file, `${slot.category}/variants`);
        uploadedPaths.push(stored.storagePath);
        uploadedBytes += output.file.size;
      }
      const variant = await createMediaVariant(siteId, media.id, stored, {
        slotKey: output.slotKey,
        mimeType: output.file.type,
        sizeBytes: output.file.size,
        width: output.width,
        height: output.height,
        crop: output.crop,
      });
      variants.push(variant);
    }

    const mainVariant = primaryVariant(variants, slot.key);
    const completeMedia: MediaRecord = { ...media, variants };
    onProgress?.({ stage: "complete", message: "Mídia pronta e registrada.", completed: totalSteps, total: totalSteps });
    return {
      media: completeMedia,
      primaryUrl: mainVariant.public_url,
      primaryVariant: mainVariant,
      uploadedBytes,
    };
  } catch (error) {
    await cleanupIncomplete(siteId, mediaId, uploadedPaths);
    throw error;
  }
}

export async function downloadMediaOriginal(media: MediaRecord): Promise<File> {
  let response: Response;
  try {
    response = await fetch(media.public_url, { cache: "no-store" });
  } catch (error) {
    throw normalizeAdminError(error, { code: "MEDIA_ORIGINAL_DOWNLOAD_FAILED", message: "Não foi possível baixar o original para reenquadrar." });
  }
  if (!response.ok) throw new AdminError("O arquivo original não está disponível.", "MEDIA_ORIGINAL_NOT_AVAILABLE");
  const blob = await response.blob();
  return new File([blob], media.file_name, { type: media.mime_type || blob.type, lastModified: Date.now() });
}

export async function reframeMedia(
  siteId: string,
  media: MediaRecord,
  source: PreparedMediaSource,
  slot: MediaSlotDefinition,
  transform: MediaTransform,
  onProgress?: (progress: MediaUploadProgress) => void,
): Promise<string> {
  onProgress?.({ stage: "generating", message: "Gerando o novo enquadramento…", completed: 0, total: 1 });
  const outputs = await generateMediaFiles(source, slot, transform);
  const newPaths: string[] = [];
  const oldPaths: string[] = [];
  let primaryUrl = "";

  try {
    for (const [index, output] of outputs.entries()) {
      onProgress?.({
        stage: "uploading-variants",
        message: `Enviando nova versão ${index + 1} de ${outputs.length}…`,
        completed: index,
        total: outputs.length,
      });
      const stored = await uploadStorageFile(siteId, output.file, `${slot.category}/variants`);
      newPaths.push(stored.storagePath);
      const previous = media.variants.find((variant) => variant.slot_key === output.slotKey);
      if (previous && previous.storage_path !== media.storage_path) oldPaths.push(previous.storage_path);
      const next = await replaceMediaVariant(siteId, media.id, stored, {
        slotKey: output.slotKey,
        mimeType: output.file.type,
        sizeBytes: output.file.size,
        width: output.width,
        height: output.height,
        crop: output.crop,
      });
      if (output.primary) {
        primaryUrl = next.public_url;
        if (previous?.public_url && previous.public_url !== next.public_url) {
          await replaceMediaUrl(siteId, previous.public_url, next.public_url);
        }
      }
    }
    await removeStorageFiles(oldPaths);
    onProgress?.({ stage: "complete", message: "Novo enquadramento aplicado.", completed: outputs.length, total: outputs.length });
    if (!primaryUrl) throw new AdminError("A versão principal não foi criada.", "MEDIA_PRIMARY_VARIANT_MISSING");
    return primaryUrl;
  } catch (error) {
    try {
      await removeStorageFiles(newPaths);
    } catch (cleanupError) {
      const normalized = normalizeAdminError(cleanupError, {
        code: "STORAGE_CLEANUP_FAILED",
        message: "Não foi possível limpar as versões incompletas.",
      });
      reportAdminError("media-reframe-cleanup", cleanupError, normalized);
    }
    throw error;
  }
}

export async function sendMediaToTrash(media: MediaRecord): Promise<void> {
  const usage = await loadMediaUsage(media.id);
  if (usage.length > 0) {
    const first = usage[0];
    const location = first ? `${first.area}: ${first.label}` : "o site";
    throw new AdminError(`Esta mídia está sendo usada em ${location}. Substitua ou remova a referência antes de enviá-la para a lixeira.`, "MEDIA_IN_USE");
  }
  await trashMedia(media.id);
}

export async function restoreMediaFromTrash(media: MediaRecord): Promise<void> {
  await restoreMedia(media.id);
}

export async function deleteMediaPermanently(media: MediaRecord): Promise<void> {
  if (!media.deleted_at) throw new AdminError("Envie a mídia para a lixeira antes da exclusão definitiva.", "MEDIA_NOT_IN_TRASH");
  const usage: MediaUsageReference[] = await loadMediaUsage(media.id);
  if (usage.length > 0) throw new AdminError("Esta mídia voltou a ser usada e não pode ser excluída.", "MEDIA_IN_USE");
  const paths = [media.storage_path, ...media.variants.map((variant) => variant.storage_path)];
  await removeStorageFiles(paths);
  await deleteMediaMetadata(media.id);
}
