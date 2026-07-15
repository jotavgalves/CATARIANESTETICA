import { runtimeConfig } from "../lib/config";
import { supabase } from "../lib/supabase";
import type {
  AdminData,
  FaqRecord,
  MediaRecord,
  MediaUsageReference,
  MediaVariantRecord,
  ProcedureRecord,
  ResultRecord,
  SectionRecord,
  SiteRecord,
  SiteSettings,
  TestimonialRecord,
  TrackingConfig,
} from "../lib/types";
import { AdminError, normalizeAdminError } from "./errors";
import type { MediaKind } from "./media-schema";
import type { MediaTransform } from "./media-processor";

export type EditableTable = "cq_procedures" | "cq_results" | "cq_testimonials" | "cq_faq_items";
export type EditableRecord = ProcedureRecord | ResultRecord | TestimonialRecord | FaqRecord;

export interface Membership {
  siteId: string;
  role: "owner" | "editor";
  site: SiteRecord;
}

export interface StoredMediaObject {
  storagePath: string;
  publicUrl: string;
}

export interface OriginalMediaInput {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  category: string;
  altText: string;
  mediaKind: MediaKind;
  width: number;
  height: number;
  checksum: string;
}

export interface VariantMediaInput {
  slotKey: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
  crop: MediaTransform;
}

export interface CommittedMediaVariant extends VariantMediaInput {
  storagePath: string;
  publicUrl: string;
}

interface ClaimedMembership {
  site_id: string;
  role: "owner" | "editor";
  site: SiteRecord;
}

const tableColumns = "*";

function membershipError(error: unknown): AdminError {
  const message = typeof error === "object" && error !== null && "message" in error ? String(error.message ?? "") : "";
  if (message.includes("email_not_authorized")) return new AdminError("Este e-mail não está autorizado a acessar o painel.", "CMS_ACCESS_DENIED");
  if (message.includes("authentication_required")) return new AdminError("Sua sessão expirou. Entre novamente.", "AUTH_SESSION_REQUIRED");
  return normalizeAdminError(error, {
    code: "CMS_MEMBERSHIP_FAILED",
    message: "Não foi possível vincular seu acesso ao site.",
  });
}

function dataError(error: unknown, code: string, message: string): AdminError {
  return normalizeAdminError(error, { code, message });
}

function safeSegment(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "general";
}

function fileExtension(file: File): string {
  const byMime: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
    "image/svg+xml": "svg",
    "image/heic": "heic",
    "image/heif": "heif",
  };
  return byMime[file.type] ?? file.name.split(".").pop()?.toLowerCase() ?? "bin";
}

export async function loadMembership(): Promise<Membership> {
  const { data, error } = await supabase.rpc("cq_claim_admin_access");
  if (error) throw membershipError(error);

  const claimed = data as ClaimedMembership | null;
  if (!claimed?.site_id || !claimed.site) {
    throw new AdminError("Seu e-mail não possui acesso ativo a nenhum site.", "CMS_MEMBERSHIP_EMPTY");
  }

  return {
    siteId: claimed.site_id,
    role: claimed.role,
    site: claimed.site,
  };
}

export async function loadAdminData(membership: Membership): Promise<AdminData> {
  const siteId = membership.siteId;
  const [settings, sections, procedures, results, testimonials, faq, tracking, mediaFiles, mediaVariants] = await Promise.all([
    supabase.from("cq_site_settings").select(tableColumns).eq("site_id", siteId).maybeSingle(),
    supabase.from("cq_sections").select(tableColumns).eq("site_id", siteId).order("sort_order"),
    supabase.from("cq_procedures").select(tableColumns).eq("site_id", siteId).order("sort_order"),
    supabase.from("cq_results").select(tableColumns).eq("site_id", siteId).order("sort_order"),
    supabase.from("cq_testimonials").select(tableColumns).eq("site_id", siteId).order("sort_order"),
    supabase.from("cq_faq_items").select(tableColumns).eq("site_id", siteId).order("sort_order"),
    supabase.from("cq_tracking_configs").select(tableColumns).eq("site_id", siteId).maybeSingle(),
    supabase.from("cq_media_files").select(tableColumns).eq("site_id", siteId).order("created_at", { ascending: false }),
    supabase.from("cq_media_variants").select(tableColumns).eq("site_id", siteId).order("created_at", { ascending: false }),
  ]);

  if (settings.error || !settings.data) throw dataError(settings.error, "CMS_SETTINGS_FAILED", "Não foi possível carregar as configurações do site.");
  if (sections.error) throw dataError(sections.error, "CMS_SECTIONS_FAILED", "Não foi possível carregar as seções do site.");
  if (procedures.error) throw dataError(procedures.error, "CMS_PROCEDURES_FAILED", "Não foi possível carregar os procedimentos.");
  if (results.error) throw dataError(results.error, "CMS_RESULTS_FAILED", "Não foi possível carregar os resultados.");
  if (testimonials.error) throw dataError(testimonials.error, "CMS_TESTIMONIALS_FAILED", "Não foi possível carregar os depoimentos.");
  if (faq.error) throw dataError(faq.error, "CMS_FAQ_FAILED", "Não foi possível carregar as perguntas frequentes.");
  if (tracking.error || !tracking.data) throw dataError(tracking.error, "CMS_TRACKING_FAILED", "Não foi possível carregar as configurações de rastreamento.");
  if (mediaFiles.error) throw dataError(mediaFiles.error, "MEDIA_LIBRARY_FAILED", "Não foi possível carregar a biblioteca de mídia.");
  if (mediaVariants.error) throw dataError(mediaVariants.error, "MEDIA_VARIANTS_FAILED", "Não foi possível carregar as versões de mídia.");

  const variants = (mediaVariants.data ?? []) as MediaVariantRecord[];
  const media = ((mediaFiles.data ?? []) as Omit<MediaRecord, "variants">[]).map((item) => ({
    ...item,
    variants: variants.filter((variant) => variant.media_id === item.id),
  }));

  return {
    site: membership.site,
    settings: settings.data as SiteSettings,
    sections: (sections.data ?? []) as SectionRecord[],
    procedures: (procedures.data ?? []) as ProcedureRecord[],
    results: (results.data ?? []) as ResultRecord[],
    testimonials: (testimonials.data ?? []) as TestimonialRecord[],
    faq: (faq.data ?? []) as FaqRecord[],
    tracking: tracking.data as TrackingConfig,
    media,
  };
}

export async function saveSettings(siteId: string, payload: Partial<SiteSettings>): Promise<void> {
  const { error } = await supabase.from("cq_site_settings").update(payload).eq("site_id", siteId);
  if (error) throw dataError(error, "CMS_SETTINGS_SAVE_FAILED", "Não foi possível salvar as configurações.");
}

export async function saveSection(siteId: string, id: string, payload: Partial<SectionRecord>): Promise<void> {
  const { error } = await supabase.from("cq_sections").update({ ...payload, site_id: siteId }).eq("id", id).eq("site_id", siteId);
  if (error) throw dataError(error, "CMS_SECTION_SAVE_FAILED", "Não foi possível salvar esta seção.");
}

export async function saveTracking(siteId: string, payload: Partial<TrackingConfig>): Promise<void> {
  const { error } = await supabase.from("cq_tracking_configs").update(payload).eq("site_id", siteId);
  if (error) throw dataError(error, "CMS_TRACKING_SAVE_FAILED", "Não foi possível salvar a configuração de rastreamento.");
}

export async function saveTrackingSecrets(siteId: string, secrets: Record<string, string>): Promise<void> {
  const { error } = await supabase.functions.invoke(runtimeConfig.trackingSecretsFunction, { body: { siteId, secrets } });
  if (error) throw dataError(error, "CMS_TRACKING_SECRET_FAILED", "Não foi possível salvar as credenciais protegidas.");
}

export async function upsertRecord(table: EditableTable, siteId: string, payload: Record<string, unknown>, id?: string): Promise<void> {
  const cleanPayload = { ...payload, site_id: siteId };
  if (id) {
    const { error } = await supabase.from(table).update(cleanPayload).eq("id", id).eq("site_id", siteId);
    if (error) throw dataError(error, "CMS_RECORD_UPDATE_FAILED", "Não foi possível atualizar este item.");
    return;
  }
  const { error } = await supabase.from(table).insert(cleanPayload);
  if (error) throw dataError(error, "CMS_RECORD_CREATE_FAILED", "Não foi possível criar este item.");
}

export async function deleteRecord(table: EditableTable, siteId: string, id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq("id", id).eq("site_id", siteId);
  if (error) throw dataError(error, "CMS_RECORD_DELETE_FAILED", "Não foi possível excluir este item.");
}

export async function uploadStorageFile(siteId: string, file: File, folder: string): Promise<StoredMediaObject> {
  const storagePath = `${siteId}/${safeSegment(folder)}/${crypto.randomUUID()}.${fileExtension(file)}`;
  const { error } = await supabase.storage.from(runtimeConfig.mediaBucket).upload(storagePath, file, {
    upsert: false,
    contentType: file.type,
    cacheControl: "31536000",
  });
  if (error) throw dataError(error, "STORAGE_UPLOAD_FAILED", "Não foi possível enviar o arquivo.");

  const { data } = supabase.storage.from(runtimeConfig.mediaBucket).getPublicUrl(storagePath);
  return { storagePath, publicUrl: data.publicUrl };
}

export async function createMediaRecord(siteId: string, stored: StoredMediaObject, record: OriginalMediaInput): Promise<MediaRecord> {
  const { data, error } = await supabase.from("cq_media_files").insert({
    site_id: siteId,
    storage_path: stored.storagePath,
    public_url: stored.publicUrl,
    file_name: record.originalName,
    mime_type: record.mimeType,
    size_bytes: record.sizeBytes,
    alt_text: record.altText,
    category: safeSegment(record.category),
    media_kind: record.mediaKind,
    width: record.width,
    height: record.height,
    aspect_ratio: record.height > 0 ? record.width / record.height : 0,
    checksum: record.checksum,
  }).select(tableColumns).single();
  if (error || !data) throw dataError(error, "MEDIA_REGISTER_FAILED", "O original foi enviado, mas não pôde ser registrado.");
  return { ...(data as Omit<MediaRecord, "variants">), variants: [] };
}

export async function createMediaVariant(
  siteId: string,
  mediaId: string,
  stored: StoredMediaObject,
  variant: VariantMediaInput,
): Promise<MediaVariantRecord> {
  const { data, error } = await supabase.from("cq_media_variants").insert({
    site_id: siteId,
    media_id: mediaId,
    slot_key: variant.slotKey,
    storage_path: stored.storagePath,
    public_url: stored.publicUrl,
    width: variant.width,
    height: variant.height,
    mime_type: variant.mimeType,
    size_bytes: variant.sizeBytes,
    crop: variant.crop,
  }).select(tableColumns).single();
  if (error || !data) throw dataError(error, "MEDIA_VARIANT_REGISTER_FAILED", "A versão foi enviada, mas não pôde ser registrada.");
  return data as MediaVariantRecord;
}

export async function commitMediaVariants(
  siteId: string,
  mediaId: string,
  variants: CommittedMediaVariant[],
  oldUrl?: string,
  newUrl?: string,
): Promise<MediaVariantRecord[]> {
  const { data, error } = await supabase.rpc("cq_commit_media_variants", {
    p_site_id: siteId,
    p_media_id: mediaId,
    p_variants: variants.map((variant) => ({
      slot_key: variant.slotKey,
      storage_path: variant.storagePath,
      public_url: variant.publicUrl,
      width: variant.width,
      height: variant.height,
      mime_type: variant.mimeType,
      size_bytes: variant.sizeBytes,
      crop: variant.crop,
    })),
    p_old_url: oldUrl ?? null,
    p_new_url: newUrl ?? null,
  });
  if (error) throw dataError(error, "MEDIA_VARIANTS_COMMIT_FAILED", "Não foi possível confirmar as novas versões da mídia.");
  return Array.isArray(data) ? data as MediaVariantRecord[] : [];
}

export async function removeStorageFiles(storagePaths: string[]): Promise<void> {
  const uniquePaths = [...new Set(storagePaths.filter(Boolean))];
  if (uniquePaths.length === 0) return;
  const { error } = await supabase.storage.from(runtimeConfig.mediaBucket).remove(uniquePaths);
  if (error) throw dataError(error, "STORAGE_DELETE_FAILED", "Não foi possível remover os arquivos do armazenamento.");
}

export async function removeMediaRecord(siteId: string, mediaId: string): Promise<void> {
  const { error } = await supabase.from("cq_media_files").delete().eq("id", mediaId).eq("site_id", siteId);
  if (error) throw dataError(error, "MEDIA_RECORD_CLEANUP_FAILED", "Não foi possível limpar um registro incompleto da biblioteca.");
}

export async function loadMediaUsage(mediaId: string): Promise<MediaUsageReference[]> {
  const { data, error } = await supabase.rpc("cq_media_usage", { p_media_id: mediaId });
  if (error) throw dataError(error, "MEDIA_USAGE_FAILED", "Não foi possível verificar onde a imagem é usada.");
  return Array.isArray(data) ? data as MediaUsageReference[] : [];
}

export async function trashMedia(mediaId: string): Promise<void> {
  const { error } = await supabase.rpc("cq_trash_media", { p_media_id: mediaId });
  if (error) throw dataError(error, "MEDIA_TRASH_FAILED", "Não foi possível enviar a imagem para a lixeira.");
}

export async function restoreMedia(mediaId: string): Promise<void> {
  const { error } = await supabase.rpc("cq_restore_media", { p_media_id: mediaId });
  if (error) throw dataError(error, "MEDIA_RESTORE_FAILED", "Não foi possível restaurar a imagem.");
}

export async function deleteMediaMetadata(mediaId: string): Promise<void> {
  const { error } = await supabase.rpc("cq_delete_media_metadata", { p_media_id: mediaId });
  if (error) throw dataError(error, "MEDIA_DELETE_METADATA_FAILED", "Os arquivos foram removidos, mas não foi possível limpar a biblioteca.");
}
