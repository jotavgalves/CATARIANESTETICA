import type { MediaRecord } from "../lib/types";
import { AdminError, formatAdminError, normalizeAdminError, reportAdminError } from "./errors";
import { openMediaEditor } from "./media-editor";
import { prepareMediaSource, type MediaTransform } from "./media-processor";
import { getMediaSlot, mediaSlots, type MediaSlotKey } from "./media-schema";
import {
  deleteMediaPermanently,
  downloadMediaOriginal,
  formatByteSize,
  reframeMedia,
  restoreMediaFromTrash,
  sendMediaToTrash,
  storeMedia,
  type MediaUploadProgress,
  type MediaUploadResult,
} from "./media-service";
import type { AdminViewState, MediaFilter } from "./render";

export interface MediaControllerDependencies {
  getState: () => AdminViewState | null;
  render: () => void;
  setMessage: (message: string, isError?: boolean) => void;
  reloadData: (message?: string) => Promise<void>;
}

export interface MediaController {
  submitLibraryForm: (form: HTMLFormElement) => Promise<void>;
  handleUploadInput: (input: HTMLInputElement) => Promise<void>;
  handleClick: (target: Element) => boolean;
  showInputFailure: (input: HTMLInputElement, error: unknown) => void;
}

function value(form: FormData, key: string): string {
  const current = form.get(key);
  return typeof current === "string" ? current.trim() : "";
}

function uploadElements(input: HTMLInputElement): {
  feedback: HTMLElement | null;
  preview: HTMLImageElement | null;
  status: HTMLElement | null;
  meta: HTMLElement | null;
  progress: HTMLProgressElement | null;
} {
  const field = input.closest<HTMLElement>("[data-upload-field]");
  return {
    feedback: field?.querySelector<HTMLElement>("[data-upload-feedback]") ?? null,
    preview: field?.querySelector<HTMLImageElement>("[data-upload-preview]") ?? null,
    status: field?.querySelector<HTMLElement>("[data-upload-status]") ?? null,
    meta: field?.querySelector<HTMLElement>("[data-upload-meta]") ?? null,
    progress: field?.querySelector<HTMLProgressElement>("[data-upload-progress]") ?? null,
  };
}

function setUploadStatus(input: HTMLInputElement, message: string, percent: number): void {
  const elements = uploadElements(input);
  if (elements.feedback) elements.feedback.hidden = false;
  if (elements.status) elements.status.textContent = message;
  if (elements.progress) {
    elements.progress.max = 100;
    elements.progress.value = Math.max(0, Math.min(100, percent));
  }
}

function updateUploadProgress(input: HTMLInputElement, update: MediaUploadProgress): void {
  const percent = update.total > 0 ? Math.round(update.completed / update.total * 100) : 0;
  setUploadStatus(input, update.message, percent);
}

function showUploadResult(input: HTMLInputElement, result: MediaUploadResult): void {
  const elements = uploadElements(input);
  if (elements.feedback) elements.feedback.hidden = false;
  if (elements.preview) {
    elements.preview.src = result.primaryUrl;
    elements.preview.hidden = false;
  }
  if (elements.status) elements.status.textContent = "Mídia pronta e enviada.";
  if (elements.meta) {
    elements.meta.textContent = `${result.primaryVariant.width} × ${result.primaryVariant.height}px · ${formatByteSize(result.primaryVariant.size_bytes)} · original preservado`;
  }
  if (elements.progress) elements.progress.value = 100;
}

function normalizeMediaError(context: string, error: unknown): AdminError {
  const fallbackByContext: Record<string, { code: string; message: string }> = {
    upload: { code: "MEDIA_UPLOAD_FAILED", message: "Não foi possível enviar a mídia." },
    reframe: { code: "MEDIA_REFRAME_FAILED", message: "Não foi possível aplicar o novo enquadramento." },
    trash: { code: "MEDIA_TRASH_FAILED", message: "Não foi possível enviar a mídia para a lixeira." },
    restore: { code: "MEDIA_RESTORE_FAILED", message: "Não foi possível restaurar a mídia." },
    delete: { code: "MEDIA_DELETE_FAILED", message: "Não foi possível excluir a mídia definitivamente." },
  };
  const fallback = fallbackByContext[context] ?? fallbackByContext.upload;
  const normalized = normalizeAdminError(error, fallback);
  reportAdminError(`media-${context}`, error, normalized);
  return normalized;
}

function showUploadError(input: HTMLInputElement, error: AdminError): void {
  const elements = uploadElements(input);
  if (elements.feedback) elements.feedback.hidden = false;
  if (elements.status) elements.status.textContent = error.message;
  if (elements.meta) elements.meta.textContent = `Código: ${error.code}`;
  if (elements.progress) elements.progress.removeAttribute("value");
}

function initialTransform(media: MediaRecord, slotKey: string): MediaTransform | undefined {
  const variant = media.variants.find((item) => item.slot_key === slotKey)
    ?? media.variants.find((item) => item.slot_key.startsWith("favicon_"))
    ?? media.variants[0];
  const crop = variant?.crop;
  if (!crop || typeof crop !== "object") return undefined;
  const zoom = typeof crop.zoom === "number" ? crop.zoom : 1;
  const offsetX = typeof crop.offsetX === "number" ? crop.offsetX : 0;
  const offsetY = typeof crop.offsetY === "number" ? crop.offsetY : 0;
  const rawRotation = typeof crop.rotation === "number" ? crop.rotation : 0;
  const rotation: MediaTransform["rotation"] = rawRotation === 90 || rawRotation === 180 || rawRotation === 270 ? rawRotation : 0;
  const fit = crop.fit === "contain" ? "contain" : "cover";
  return { zoom, offsetX, offsetY, rotation, fit };
}

function slotForMedia(media: MediaRecord): MediaSlotKey {
  if (media.media_kind === "logo") return "logo_header";
  if (media.media_kind === "favicon") return "favicon";
  const slotKey = media.variants.find((variant) => variant.slot_key in mediaSlots)?.slot_key;
  return slotKey && slotKey in mediaSlots ? slotKey as MediaSlotKey : "general";
}

export function createMediaController(dependencies: MediaControllerDependencies): MediaController {
  const { getState, reloadData, render, setMessage } = dependencies;

  const findMedia = (id: string | undefined): MediaRecord | null => {
    const state = getState();
    if (!state || !id) return null;
    return state.data.media.find((media) => media.id === id) ?? null;
  };

  const processMedia = async (
    input: HTMLInputElement,
    file: File,
    slotKey: string,
    altText: string,
  ): Promise<MediaUploadResult | null> => {
    const state = getState();
    if (!state) return null;
    const slot = getMediaSlot(slotKey);
    setUploadStatus(input, "Validando e abrindo o arquivo…", 5);
    const source = await prepareMediaSource(file, slot);
    try {
      setUploadStatus(input, "Aguardando confirmação do enquadramento…", 10);
      const transform = await openMediaEditor(source, slot);
      if (!transform) {
        setUploadStatus(input, "Envio cancelado.", 0);
        return null;
      }
      const result = await storeMedia(
        state.membership.siteId,
        source,
        slot,
        transform,
        altText,
        (progress) => updateUploadProgress(input, progress),
      );
      state.data.media.unshift(result.media);
      showUploadResult(input, result);
      return result;
    } finally {
      source.release();
    }
  };

  const submitLibraryForm = async (form: HTMLFormElement): Promise<void> => {
    const data = new FormData(form);
    const file = data.get("file");
    const input = form.querySelector<HTMLInputElement>('input[name="file"]');
    if (!(file instanceof File) || file.size === 0 || !input) {
      throw new AdminError("Escolha uma mídia.", "MEDIA_FILE_REQUIRED", "file");
    }
    const result = await processMedia(input, file, value(data, "slot_key") || "general", value(data, "alt_text"));
    if (result) await reloadData("Mídia enviada e registrada na biblioteca.");
  };

  const handleUploadInput = async (input: HTMLInputElement): Promise<void> => {
    const state = getState();
    const targetName = input.dataset.uploadTarget;
    if (!state || !targetName) return;
    const file = input.files?.[0];
    if (!file) return;
    const form = input.closest<HTMLFormElement>("form");
    const target = form?.querySelector<HTMLInputElement>(`[name="${targetName}"]`);
    if (!form || !target) throw new AdminError("O campo de destino da mídia não foi encontrado.", "MEDIA_TARGET_NOT_FOUND");

    input.disabled = true;
    try {
      const result = await processMedia(input, file, input.dataset.mediaSlot ?? "general", "");
      if (!result) return;
      target.value = result.primaryUrl;
      target.dispatchEvent(new Event("change", { bubbles: true }));
      setMessage("Mídia enviada. Salve o formulário para aplicar a alteração.");
    } finally {
      input.disabled = false;
      input.value = "";
    }
  };

  const reframe = async (media: MediaRecord): Promise<void> => {
    const state = getState();
    if (!state) return;
    const slotKey = slotForMedia(media);
    const slot = getMediaSlot(slotKey);
    setMessage("Baixando o original para reenquadrar…");
    const file = await downloadMediaOriginal(media);
    const source = await prepareMediaSource(file, slot);
    try {
      const transform = await openMediaEditor(source, slot, initialTransform(media, slotKey));
      if (!transform) {
        setMessage("Reenquadramento cancelado.");
        return;
      }
      await reframeMedia(state.membership.siteId, media, source, slot, transform, (progress) => setMessage(progress.message));
      await reloadData("Novo enquadramento aplicado em todos os locais que usavam a versão anterior.");
    } finally {
      source.release();
    }
  };

  const fail = (context: string, error: unknown): void => {
    const normalized = normalizeMediaError(context, error);
    setMessage(formatAdminError(normalized), true);
  };

  const handleClick = (target: Element): boolean => {
    const state = getState();
    if (!state) return false;

    const filterButton = target.closest<HTMLElement>("[data-media-filter]");
    if (filterButton) {
      state.mediaFilter = filterButton.dataset.mediaFilter as MediaFilter;
      render();
      return true;
    }

    const reframeButton = target.closest<HTMLElement>("[data-media-reframe]");
    const reframeItem = findMedia(reframeButton?.dataset.mediaReframe);
    if (reframeItem) {
      void reframe(reframeItem).catch((error: unknown) => fail("reframe", error));
      return true;
    }

    const trashButton = target.closest<HTMLElement>("[data-media-trash]");
    const trashItem = findMedia(trashButton?.dataset.mediaTrash);
    if (trashItem) {
      if (window.confirm("Enviar esta mídia para a lixeira? Ela poderá ser restaurada.")) {
        void sendMediaToTrash(trashItem)
          .then(() => reloadData("Mídia enviada para a lixeira."))
          .catch((error: unknown) => fail("trash", error));
      }
      return true;
    }

    const restoreButton = target.closest<HTMLElement>("[data-media-restore]");
    const restoreItem = findMedia(restoreButton?.dataset.mediaRestore);
    if (restoreItem) {
      void restoreMediaFromTrash(restoreItem)
        .then(() => reloadData("Mídia restaurada."))
        .catch((error: unknown) => fail("restore", error));
      return true;
    }

    const permanentButton = target.closest<HTMLElement>("[data-media-delete-permanent]");
    const permanentItem = findMedia(permanentButton?.dataset.mediaDeletePermanent);
    if (permanentItem) {
      if (window.confirm("Excluir definitivamente o original e todas as versões? Esta ação não pode ser desfeita.")) {
        void deleteMediaPermanently(permanentItem)
          .then(() => reloadData("Mídia excluída definitivamente."))
          .catch((error: unknown) => fail("delete", error));
      }
      return true;
    }

    return false;
  };

  return {
    submitLibraryForm,
    handleUploadInput,
    handleClick,
    showInputFailure: (input, error) => {
      const normalized = normalizeMediaError("upload", error);
      showUploadError(input, normalized);
      setMessage(formatAdminError(normalized), true);
    },
  };
}
