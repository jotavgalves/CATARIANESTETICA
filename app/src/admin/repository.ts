import { runtimeConfig } from "../lib/config";
import { supabase } from "../lib/supabase";
import type { AdminData, FaqRecord, ProcedureRecord, ResultRecord, SectionRecord, SiteRecord, SiteSettings, TestimonialRecord, TrackingConfig } from "../lib/types";
import { AdminError, normalizeAdminError } from "./errors";

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

export interface MediaDatabaseRecord {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  category: string;
  altText: string;
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

function safeCategory(category: string): string {
  return category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "general";
}

function fileExtension(file: File): string {
  const byMime: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
  };
  return byMime[file.type] ?? file.name.split(".").pop()?.toLowerCase() ?? "webp";
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
  const [settings, sections, procedures, results, testimonials, faq, tracking] = await Promise.all([
    supabase.from("cq_site_settings").select(tableColumns).eq("site_id", siteId).maybeSingle(),
    supabase.from("cq_sections").select(tableColumns).eq("site_id", siteId).order("sort_order"),
    supabase.from("cq_procedures").select(tableColumns).eq("site_id", siteId).order("sort_order"),
    supabase.from("cq_results").select(tableColumns).eq("site_id", siteId).order("sort_order"),
    supabase.from("cq_testimonials").select(tableColumns).eq("site_id", siteId).order("sort_order"),
    supabase.from("cq_faq_items").select(tableColumns).eq("site_id", siteId).order("sort_order"),
    supabase.from("cq_tracking_configs").select(tableColumns).eq("site_id", siteId).maybeSingle(),
  ]);

  if (settings.error || !settings.data) throw dataError(settings.error, "CMS_SETTINGS_FAILED", "Não foi possível carregar as configurações do site.");
  if (sections.error) throw dataError(sections.error, "CMS_SECTIONS_FAILED", "Não foi possível carregar as seções do site.");
  if (procedures.error) throw dataError(procedures.error, "CMS_PROCEDURES_FAILED", "Não foi possível carregar os procedimentos.");
  if (results.error) throw dataError(results.error, "CMS_RESULTS_FAILED", "Não foi possível carregar os resultados.");
  if (testimonials.error) throw dataError(testimonials.error, "CMS_TESTIMONIALS_FAILED", "Não foi possível carregar os depoimentos.");
  if (faq.error) throw dataError(faq.error, "CMS_FAQ_FAILED", "Não foi possível carregar as perguntas frequentes.");
  if (tracking.error || !tracking.data) throw dataError(tracking.error, "CMS_TRACKING_FAILED", "Não foi possível carregar as configurações de rastreamento.");

  const media = await supabase.from("cq_media_files").select(tableColumns).eq("site_id", siteId).order("created_at", { ascending: false });

  return {
    site: membership.site,
    settings: settings.data as SiteSettings,
    sections: (sections.data ?? []) as SectionRecord[],
    procedures: (procedures.data ?? []) as ProcedureRecord[],
    results: (results.data ?? []) as ResultRecord[],
    testimonials: (testimonials.data ?? []) as TestimonialRecord[],
    faq: (faq.data ?? []) as FaqRecord[],
    tracking: tracking.data as TrackingConfig,
    media: media.error ? [] : (media.data ?? []) as Array<Record<string, unknown>>,
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

export async function uploadStorageFile(siteId: string, file: File, category: string): Promise<StoredMediaObject> {
  const storagePath = `${siteId}/${safeCategory(category)}/${crypto.randomUUID()}.${fileExtension(file)}`;
  const { error } = await supabase.storage.from(runtimeConfig.mediaBucket).upload(storagePath, file, {
    upsert: false,
    contentType: file.type,
    cacheControl: "31536000",
  });
  if (error) throw dataError(error, "STORAGE_UPLOAD_FAILED", "Não foi possível enviar a imagem.");

  const { data } = supabase.storage.from(runtimeConfig.mediaBucket).getPublicUrl(storagePath);
  return { storagePath, publicUrl: data.publicUrl };
}

export async function registerMediaFile(siteId: string, stored: StoredMediaObject, record: MediaDatabaseRecord): Promise<void> {
  const { error } = await supabase.from("cq_media_files").insert({
    site_id: siteId,
    storage_path: stored.storagePath,
    public_url: stored.publicUrl,
    file_name: record.originalName,
    mime_type: record.mimeType,
    size_bytes: record.sizeBytes,
    alt_text: record.altText,
    category: safeCategory(record.category),
  });
  if (error) throw dataError(error, "MEDIA_REGISTER_FAILED", "A imagem foi enviada, mas não pôde ser registrada na biblioteca.");
}

export async function removeStorageFile(storagePath: string): Promise<void> {
  const { error } = await supabase.storage.from(runtimeConfig.mediaBucket).remove([storagePath]);
  if (error) throw dataError(error, "STORAGE_CLEANUP_FAILED", "Não foi possível remover um arquivo incompleto do armazenamento.");
}
