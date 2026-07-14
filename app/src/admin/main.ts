import { supabase } from "../lib/supabase";
import type { AdminData, JsonObject } from "../lib/types";
import { renderAdmin, renderLogin, type AdminTab, type AdminViewState } from "./render";
import {
  currentSession,
  deleteRecord,
  loadAdminData,
  loadMembership,
  requestMagicLink,
  saveSection,
  saveSettings,
  saveTracking,
  saveTrackingSecrets,
  signOut,
  uploadMedia,
  upsertRecord,
  type EditableTable,
  type Membership,
} from "./repository";

declare global {
  interface Window { __cqAdminAppInitialized?: boolean; }
}

const root = document.querySelector<HTMLElement>("#admin-root");
if (!root) throw new Error("Admin root is missing.");

let state: AdminViewState | null = null;
let loginMessage = "";

const editableTable: Record<string, EditableTable> = {
  procedure: "cq_procedures",
  result: "cq_results",
  testimonial: "cq_testimonials",
  faq: "cq_faq_items",
};

function render(): void {
  root.innerHTML = state ? renderAdmin(state) : renderLogin(loginMessage);
}

function value(form: FormData, key: string): string {
  const current = form.get(key);
  return typeof current === "string" ? current.trim() : "";
}

function checked(form: HTMLFormElement, key: string): boolean {
  return form.querySelector<HTMLInputElement>(`[name="${key}"]`)?.checked ?? false;
}

function numberValue(form: FormData, key: string): number {
  const parsed = Number(value(form, key));
  return Number.isFinite(parsed) ? parsed : 0;
}

function setMessage(message: string, isError = false): void {
  if (!state) return;
  state.message = message;
  state.isError = isError;
  render();
}

async function reloadData(message = ""): Promise<void> {
  if (!state) return;
  state.data = await loadAdminData(state.membership);
  state.message = message;
  state.isError = false;
  state.editingId = null;
  render();
}

async function initializeAuthenticated(): Promise<void> {
  const membership: Membership = await loadMembership();
  const data: AdminData = await loadAdminData(membership);
  state = { membership, data, tab: "dashboard", editingId: null, message: "", isError: false };
  render();
}

async function initialize(): Promise<void> {
  if (window.__cqAdminAppInitialized) throw new Error("Admin application initialized more than once.");
  window.__cqAdminAppInitialized = true;
  const session = await currentSession();
  if (session) await initializeAuthenticated();
  else render();
}

async function submitLogin(form: HTMLFormElement): Promise<void> {
  const data = new FormData(form);
  const email = value(data, "email");
  if (!email) throw new Error("Informe o e-mail.");
  await requestMagicLink(email);
  loginMessage = "Link enviado. Abra o e-mail e use o botão de acesso.";
  render();
}

async function submitSettings(form: HTMLFormElement): Promise<void> {
  if (!state) return;
  const data = new FormData(form);
  const keys = ["professional_name", "professional_title", "logo_url", "favicon_url", "whatsapp", "phone", "email", "instagram_url", "address_line", "city", "state", "maps_url", "opening_hours", "seo_title", "seo_description", "footer_text"];
  const payload = Object.fromEntries(keys.map((key) => [key, value(data, key)]));
  await saveSettings(state.membership.siteId, payload);
  await reloadData("Configurações salvas.");
}

async function submitHero(form: HTMLFormElement): Promise<void> {
  if (!state) return;
  const data = new FormData(form);
  const hero: JsonObject = {
    ...state.data.settings.hero,
    eyebrow: value(data, "eyebrow"),
    title: value(data, "title"),
    subtitle: value(data, "subtitle"),
    image_url: value(data, "image_url"),
    primary_cta: value(data, "primary_cta"),
    secondary_cta: value(data, "secondary_cta"),
  };
  await saveSettings(state.membership.siteId, { hero });
  await reloadData("Primeira tela atualizada.");
}

async function submitSection(form: HTMLFormElement): Promise<void> {
  if (!state) return;
  const data = new FormData(form);
  let content: JsonObject;
  try {
    content = JSON.parse(value(data, "content")) as JsonObject;
  } catch {
    throw new Error("O conteúdo JSON da seção é inválido.");
  }
  await saveSection(state.membership.siteId, value(data, "id"), {
    eyebrow: value(data, "eyebrow"),
    title: value(data, "title"),
    subtitle: value(data, "subtitle"),
    content,
    sort_order: numberValue(data, "sort_order"),
    is_enabled: checked(form, "is_enabled"),
  });
  await reloadData("Seção atualizada.");
}

async function submitProcedure(form: HTMLFormElement): Promise<void> {
  if (!state) return;
  const data = new FormData(form);
  await upsertRecord("cq_procedures", state.membership.siteId, {
    name: value(data, "name"), slug: value(data, "slug"), category: value(data, "category"),
    image_url: value(data, "image_url"), short_description: value(data, "short_description"),
    full_description: value(data, "full_description"), duration: value(data, "duration"),
    session_estimate: value(data, "session_estimate"), contraindications: value(data, "contraindications"),
    whatsapp_message: value(data, "whatsapp_message"), sort_order: numberValue(data, "sort_order"),
    is_featured: checked(form, "is_featured"), is_published: checked(form, "is_published"),
  }, value(data, "id") || undefined);
  await reloadData("Procedimento salvo.");
}

async function submitResult(form: HTMLFormElement): Promise<void> {
  if (!state) return;
  const data = new FormData(form);
  const isPublished = checked(form, "is_published");
  const hasConsent = checked(form, "consent_confirmed");
  if (isPublished && !hasConsent) throw new Error("Confirme a autorização antes de publicar o resultado.");
  await upsertRecord("cq_results", state.membership.siteId, {
    title: value(data, "title"), summary: value(data, "summary"), procedure_id: value(data, "procedure_id") || null,
    body_area: value(data, "body_area"), before_image_url: value(data, "before_image_url"),
    after_image_url: value(data, "after_image_url"), sessions: value(data, "sessions"),
    treatment_period: value(data, "treatment_period"), testimonial_text: value(data, "testimonial_text"),
    client_display_name: value(data, "client_display_name"), sort_order: numberValue(data, "sort_order"),
    consent_confirmed: hasConsent, is_published: isPublished,
  }, value(data, "id") || undefined);
  await reloadData("Resultado salvo.");
}

async function submitTestimonial(form: HTMLFormElement): Promise<void> {
  if (!state) return;
  const data = new FormData(form);
  const isPublished = checked(form, "is_published");
  const hasConsent = checked(form, "consent_confirmed");
  if (isPublished && !hasConsent) throw new Error("Confirme a autorização antes de publicar o depoimento.");
  await upsertRecord("cq_testimonials", state.membership.siteId, {
    client_display_name: value(data, "client_display_name"), procedure_id: value(data, "procedure_id") || null,
    photo_url: value(data, "photo_url"), testimonial_text: value(data, "testimonial_text"),
    rating: Math.min(5, Math.max(1, numberValue(data, "rating"))), source_name: value(data, "source_name"),
    source_url: value(data, "source_url"), sort_order: numberValue(data, "sort_order"),
    consent_confirmed: hasConsent, is_published: isPublished,
  }, value(data, "id") || undefined);
  await reloadData("Depoimento salvo.");
}

async function submitFaq(form: HTMLFormElement): Promise<void> {
  if (!state) return;
  const data = new FormData(form);
  await upsertRecord("cq_faq_items", state.membership.siteId, {
    question: value(data, "question"), answer: value(data, "answer"),
    sort_order: numberValue(data, "sort_order"), is_published: checked(form, "is_published"),
  }, value(data, "id") || undefined);
  await reloadData("Pergunta salva.");
}

async function submitTracking(form: HTMLFormElement): Promise<void> {
  if (!state) return;
  const data = new FormData(form);
  await saveTracking(state.membership.siteId, {
    meta_pixel_id: value(data, "meta_pixel_id"), meta_browser_enabled: checked(form, "meta_browser_enabled"),
    meta_server_enabled: checked(form, "meta_server_enabled"), ga4_measurement_id: value(data, "ga4_measurement_id"),
    ga4_browser_enabled: checked(form, "ga4_browser_enabled"), ga4_server_enabled: checked(form, "ga4_server_enabled"),
    google_ads_conversion_id: value(data, "google_ads_conversion_id"),
    google_ads_conversion_label: value(data, "google_ads_conversion_label"),
    google_ads_browser_enabled: checked(form, "google_ads_browser_enabled"),
    google_ads_server_enabled: checked(form, "google_ads_server_enabled"),
  });
  await reloadData("Configuração de rastreamento salva.");
}

async function submitTrackingSecrets(form: HTMLFormElement): Promise<void> {
  if (!state) return;
  const data = new FormData(form);
  const keys = ["metaAccessToken", "metaApiVersion", "ga4ApiSecret", "googleDataManagerEndpoint", "googleOAuthAccessToken", "googleOperatingAccountId", "googleLoginAccountId", "googleConversionActionId"];
  const secrets = Object.fromEntries(keys.map((key) => [key, value(data, key)]).filter(([, current]) => current.length > 0));
  if (Object.keys(secrets).length === 0) throw new Error("Informe ao menos uma credencial.");
  await saveTrackingSecrets(state.membership.siteId, secrets);
  setMessage("Credenciais criptografadas e salvas.");
}

async function submitMedia(form: HTMLFormElement): Promise<void> {
  if (!state) return;
  const data = new FormData(form);
  const file = data.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Escolha uma imagem.");
  await uploadMedia(state.membership.siteId, file, value(data, "category") || "general", value(data, "alt_text"));
  await reloadData("Imagem enviada.");
}

async function handleSubmit(form: HTMLFormElement): Promise<void> {
  const kind = form.dataset.form;
  if (kind === "login") return submitLogin(form);
  if (kind === "settings") return submitSettings(form);
  if (kind === "hero") return submitHero(form);
  if (kind === "section") return submitSection(form);
  if (kind === "procedure") return submitProcedure(form);
  if (kind === "result") return submitResult(form);
  if (kind === "testimonial") return submitTestimonial(form);
  if (kind === "faq") return submitFaq(form);
  if (kind === "tracking") return submitTracking(form);
  if (kind === "tracking-secrets") return submitTrackingSecrets(form);
  if (kind === "media") return submitMedia(form);
}

root.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  void handleSubmit(form).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    if (state) setMessage(message, true);
    else { loginMessage = message; render(); }
  });
});

root.addEventListener("change", (event) => {
  const inputElement = event.target;
  if (!(inputElement instanceof HTMLInputElement) || !inputElement.dataset.uploadTarget || !state) return;
  const file = inputElement.files?.[0];
  if (!file) return;
  const targetName = inputElement.dataset.uploadTarget;
  void uploadMedia(state.membership.siteId, file, targetName, "").then((url) => {
    const form = inputElement.closest("form");
    const target = form?.querySelector<HTMLInputElement>(`[name="${targetName}"]`);
    if (target) target.value = url;
    setMessage("Imagem enviada. Salve o formulário para aplicar a alteração.");
  }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Falha no upload.", true));
});

root.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const tabButton = target.closest<HTMLButtonElement>("[data-tab]");
  if (tabButton && state) {
    state.tab = tabButton.dataset.tab as AdminTab;
    state.editingId = null;
    state.message = "";
    render();
    return;
  }

  if (target.closest("[data-sign-out]")) {
    void signOut().then(() => { state = null; loginMessage = ""; render(); });
    return;
  }

  if (target.closest("[data-cancel-edit]") && state) {
    state.editingId = null;
    render();
    return;
  }

  const editButton = target.closest<HTMLElement>("[data-edit-id]");
  if (editButton && state) {
    state.editingId = editButton.dataset.editId ?? null;
    render();
    return;
  }

  const deleteButton = target.closest<HTMLElement>("[data-delete-id]");
  if (deleteButton && state) {
    const type = deleteButton.dataset.deleteType ?? "";
    const table = editableTable[type];
    const id = deleteButton.dataset.deleteId;
    if (!table || !id || !window.confirm("Excluir este item?")) return;
    void deleteRecord(table, state.membership.siteId, id)
      .then(() => reloadData("Item excluído."))
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Falha ao excluir.", true));
  }
});

supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_IN" && session && !state) void initializeAuthenticated().catch((error: unknown) => { loginMessage = error instanceof Error ? error.message : "Falha ao carregar painel."; render(); });
  if (event === "SIGNED_OUT") { state = null; render(); }
});

void initialize().catch((error: unknown) => {
  loginMessage = error instanceof Error ? error.message : "Não foi possível abrir o painel.";
  render();
});
