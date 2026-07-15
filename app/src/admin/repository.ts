import type { Session } from "@supabase/supabase-js";
import { runtimeConfig } from "../lib/config";
import { supabase } from "../lib/supabase";
import type { AdminData, FaqRecord, ProcedureRecord, ResultRecord, SectionRecord, SiteRecord, SiteSettings, TestimonialRecord, TrackingConfig } from "../lib/types";
import "./auth-ui";

export type EditableTable = "cq_procedures" | "cq_results" | "cq_testimonials" | "cq_faq_items";
export type EditableRecord = ProcedureRecord | ResultRecord | TestimonialRecord | FaqRecord;

export interface Membership {
  siteId: string;
  role: "owner" | "editor";
  site: SiteRecord;
}

interface ClaimedMembership {
  site_id: string;
  role: "owner" | "editor";
  site: SiteRecord;
}

const tableColumns = "*";

function membershipError(error: { message?: string } | null): Error {
  const message = error?.message ?? "";
  if (message.includes("email_not_authorized")) return new Error("Este e-mail não está autorizado a acessar o painel.");
  if (message.includes("authentication_required")) return new Error("Sua sessão expirou. Entre novamente.");
  return new Error("Não foi possível vincular seu acesso ao site. Tente novamente.");
}

export async function currentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function requestMagicLink(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/admin/`,
      shouldCreateUser: false,
    },
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function loadMembership(): Promise<Membership> {
  const { data, error } = await supabase.rpc("cq_claim_admin_access");
  if (error) throw membershipError(error);

  const claimed = data as ClaimedMembership | null;
  if (!claimed?.site_id || !claimed.site) throw new Error("Seu e-mail não possui acesso ativo a nenhum site.");

  return {
    siteId: claimed.site_id,
    role: claimed.role,
    site: claimed.site,
  };
}

export async function loadAdminData(membership: Membership): Promise<AdminData> {
  const siteId = membership.siteId;
  const [settings, sections, procedures, results, testimonials, faq, tracking, media] = await Promise.all([
    supabase.from("cq_site_settings").select(tableColumns).eq("site_id", siteId).single(),
    supabase.from("cq_sections").select(tableColumns).eq("site_id", siteId).order("sort_order"),
    supabase.from("cq_procedures").select(tableColumns).eq("site_id", siteId).order("sort_order"),
    supabase.from("cq_results").select(tableColumns).eq("site_id", siteId).order("sort_order"),
    supabase.from("cq_testimonials").select(tableColumns).eq("site_id", siteId).order("sort_order"),
    supabase.from("cq_faq_items").select(tableColumns).eq("site_id", siteId).order("sort_order"),
    supabase.from("cq_tracking_configs").select(tableColumns).eq("site_id", siteId).single(),
    supabase.from("cq_media_files").select(tableColumns).eq("site_id", siteId).order("created_at", { ascending: false }),
  ]);

  const firstError = [settings, sections, procedures, results, testimonials, faq, tracking, media].find((response) => response.error)?.error;
  if (firstError) throw firstError;

  return {
    site: membership.site,
    settings: settings.data as SiteSettings,
    sections: (sections.data ?? []) as SectionRecord[],
    procedures: (procedures.data ?? []) as ProcedureRecord[],
    results: (results.data ?? []) as ResultRecord[],
    testimonials: (testimonials.data ?? []) as TestimonialRecord[],
    faq: (faq.data ?? []) as FaqRecord[],
    tracking: tracking.data as TrackingConfig,
    media: (media.data ?? []) as Array<Record<string, unknown>>,
  };
}

export async function saveSettings(siteId: string, payload: Partial<SiteSettings>): Promise<void> {
  const { error } = await supabase.from("cq_site_settings").update(payload).eq("site_id", siteId);
  if (error) throw error;
}

export async function saveSection(siteId: string, id: string, payload: Partial<SectionRecord>): Promise<void> {
  const { error } = await supabase.from("cq_sections").update({ ...payload, site_id: siteId }).eq("id", id).eq("site_id", siteId);
  if (error) throw error;
}

export async function saveTracking(siteId: string, payload: Partial<TrackingConfig>): Promise<void> {
  const { error } = await supabase.from("cq_tracking_configs").update(payload).eq("site_id", siteId);
  if (error) throw error;
}

export async function saveTrackingSecrets(siteId: string, secrets: Record<string, string>): Promise<void> {
  const { error } = await supabase.functions.invoke(runtimeConfig.trackingSecretsFunction, { body: { siteId, secrets } });
  if (error) throw error;
}

export async function upsertRecord(table: EditableTable, siteId: string, payload: Record<string, unknown>, id?: string): Promise<void> {
  const cleanPayload = { ...payload, site_id: siteId };
  if (id) {
    const { error } = await supabase.from(table).update(cleanPayload).eq("id", id).eq("site_id", siteId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from(table).insert(cleanPayload);
  if (error) throw error;
}

export async function deleteRecord(table: EditableTable, siteId: string, id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq("id", id).eq("site_id", siteId);
  if (error) throw error;
}

export async function uploadMedia(siteId: string, file: File, category: string, altText: string): Promise<string> {
  if (file.size > 5 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 5 MB.");
  if (!file.type.startsWith("image/")) throw new Error("Envie somente arquivos de imagem.");
  const extension = file.name.split(".").pop()?.toLowerCase() || "webp";
  const storagePath = `${siteId}/${category}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from(runtimeConfig.mediaBucket).upload(storagePath, file, { upsert: false, contentType: file.type });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from(runtimeConfig.mediaBucket).getPublicUrl(storagePath);
  const publicUrl = data.publicUrl;
  const { error: databaseError } = await supabase.from("cq_media_files").insert({
    site_id: siteId,
    storage_path: storagePath,
    public_url: publicUrl,
    file_name: file.name,
    mime_type: file.type,
    size_bytes: file.size,
    alt_text: altText,
    category,
  });
  if (databaseError) throw databaseError;
  return publicUrl;
}
