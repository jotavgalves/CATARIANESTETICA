import type { AdminData, JsonObject } from "../lib/types";
import {
  authErrorMessage,
  consumeAuthUrlNotice,
  currentSession,
  recoveryMinutesRemaining,
  requestPasswordReset,
  signInWithPassword,
  signOut,
  subscribeToAuth,
  updatePassword,
} from "./auth-controller";
import { AdminError, formatAdminError, normalizeAdminError, reportAdminError } from "./errors";
import { formatByteSize, uploadMedia, type MediaUploadProgress, type MediaUploadResult } from "./media-service";
import { renderAdmin, renderLogin, type AdminTab, type AdminViewState, type LoginViewState } from "./render";
import {
  deleteRecord,
  loadAdminData,
  loadMembership,
  saveSection,
  saveSettings,
  saveTracking,
  saveTrackingSecrets,
  upsertRecord,
  type EditableTable,
  type Membership,
} from "./repository";

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Required element not found: ${selector}`);
  return element;
}

const root = requiredElement<HTMLElement>("#admin-root");
let state: AdminViewState | null = null;
let authenticatedInitialization: Promise<void> | null = null;
let loginState: LoginViewState = {
  message: "",
  isError: false,
  email: "",
  recoveryMinutes: recoveryMinutesRemaining(),
};

const editableTable: Record<string, EditableTable> = {
  procedure: "cq_procedures",
  result: "cq_results",
  testimonial: "cq_testimonials",
  faq: "cq_faq_items",
};

function render(): void {
  root.innerHTML = state ? renderAdmin(state) : renderLogin(loginState);
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

function slugify(valueToConvert: string): string {
  return valueToConvert.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function loginErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : "";
  if (/^(Informe|Use uma senha|As senhas)/.test(raw)) return raw;
  return authErrorMessage(error);
}

function setLoginMessage(message: string, isError: boolean, email = loginState.email): void {
  loginState = {
    message,
    isError,
    email,
    recoveryMinutes: recoveryMinutesRemaining(),
  };
  render();
}

function setMessage(message: string, isError = false): void {
  if (!state) return;
  state.message = message;
  state.isError = isError;
  const status = root.querySelector<HTMLElement>("[data-admin-status]");
  if (!status) return;
  status.textContent = message;
  status.hidden = !message;
  status.classList.toggle("is-error", isError);
  status.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function clearFormErrors(form: HTMLFormElement): void {
  form.querySelectorAll<HTMLElement>(".field.has-error").forEach((field) => field.classList.remove("has-error"));
  form.querySelectorAll<HTMLElement>("[data-field-error]").forEach((message) => message.remove());
  form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("[aria-invalid='true']").forEach((field) => field.removeAttribute("aria-invalid"));
}

function applyFieldError(form: HTMLFormElement, error: AdminError): void {
  if (!error.field) return;
  const control = form.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`[name="${error.field}"]`);
  if (!control) return;
  control.setAttribute("aria-invalid", "true");
  const field = control.closest<HTMLElement>(".field");
  field?.classList.add("has-error");
  const message = document.createElement("small");
  message.dataset.fieldError = "true";
  message.className = "field-error";
  message.textContent = error.message;
  field?.append(message);
  control.focus({ preventScroll: false });
}

function setFormBusy(form: HTMLFormElement, busy: boolean): void {
  const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (!submitButton) return;
  if (busy) {
    submitButton.dataset.originalLabel = submitButton.textContent ?? "Salvar";
    submitButton.textContent = form.dataset.form === "media" ? "Preparando imagem…" : "Salvando…";
    submitButton.disabled = true;
    form.setAttribute("aria-busy", "true");
  } else {
    submitButton.textContent = submitButton.dataset.originalLabel ?? submitButton.textContent;
    submitButton.disabled = false;
    form.removeAttribute("aria-busy");
  }
}

function normalizeOperationError(context: string, error: unknown): AdminError {
  const fallbackByContext: Record<string, { code: string; message: string }> = {
    settings: { code: "CMS_SETTINGS_SAVE_FAILED", message: "Não foi possível salvar as configurações." },
    hero: { code: "CMS_HERO_SAVE_FAILED", message: "Não foi possível salvar a primeira tela." },
    section: { code: "CMS_SECTION_SAVE_FAILED", message: "Não foi possível salvar esta seção." },
    procedure: { code: "CMS_PROCEDURE_SAVE_FAILED", message: "Não foi possível salvar o procedimento." },
    result: { code: "CMS_RESULT_SAVE_FAILED", message: "Não foi possível salvar o resultado." },
    testimonial: { code: "CMS_TESTIMONIAL_SAVE_FAILED", message: "Não foi possível salvar o depoimento." },
    faq: { code: "CMS_FAQ_SAVE_FAILED", message: "Não foi possível salvar a pergunta." },
    tracking: { code: "CMS_TRACKING_SAVE_FAILED", message: "Não foi possível salvar o rastreamento." },
    "tracking-secrets": { code: "CMS_TRACKING_SECRET_FAILED", message: "Não foi possível salvar as credenciais." },
    media: { code: "MEDIA_UPLOAD_FAILED", message: "Não foi possível enviar a imagem." },
    delete: { code: "CMS_DELETE_FAILED", message: "Não foi possível excluir o item." },
    initialization: { code: "CMS_INITIALIZATION_FAILED", message: "Não foi possível carregar o painel." },
  };
  const fallback = fallbackByContext[context] ?? { code: "ADMIN_OPERATION_FAILED", message: "Não foi possível concluir esta operação." };
  const normalized = normalizeAdminError(error, fallback);
  reportAdminError(context, error, normalized);
  return normalized;
}

function handleAdminFailure(context: string, error: unknown, form?: HTMLFormElement): void {
  const normalized = normalizeOperationError(context, error);
  if (form) applyFieldError(form, normalized);
  setMessage(formatAdminError(normalized), true);
}

function uploadElements(inputElement: HTMLInputElement): {
  feedback: HTMLElement | null;
  preview: HTMLImageElement | null;
  status: HTMLElement | null;
  meta: HTMLElement | null;
  progress: HTMLProgressElement | null;
} {
  const field = inputElement.closest<HTMLElement>("[data-upload-field]");
  return {
    feedback: field?.querySelector<HTMLElement>("[data-upload-feedback]") ?? null,
    preview: field?.querySelector<HTMLImageElement>("[data-upload-preview]") ?? null,
    status: field?.querySelector<HTMLElement>("[data-upload-status]") ?? null,
    meta: field?.querySelector<HTMLElement>("[data-upload-meta]") ?? null,
    progress: field?.querySelector<HTMLProgressElement>("[data-upload-progress]") ?? null,
  };
}

function updateUploadProgress(inputElement: HTMLInputElement, update: MediaUploadProgress): void {
  const elements = uploadElements(inputElement);
  const stageValue: Record<MediaUploadProgress["stage"], number> = {
    validating: 1,
    preparing: 2,
    uploading: 3,
    registering: 4,
    complete: 5,
  };
  if (elements.feedback) elements.feedback.hidden = false;
  if (elements.status) elements.status.textContent = update.message;
  if (elements.progress) elements.progress.value = stageValue[update.stage];
}

function showUploadResult(inputElement: HTMLInputElement, result: MediaUploadResult): void {
  const elements = uploadElements(inputElement);
  if (elements.feedback) elements.feedback.hidden = false;
  if (elements.preview) {
    elements.preview.src = result.publicUrl;
    elements.preview.hidden = false;
  }
  if (elements.status) elements.status.textContent = "Imagem pronta e enviada.";
  if (elements.meta) {
    const reduction = result.originalBytes > 0 ? Math.max(0, Math.round((1 - result.uploadedBytes / result.originalBytes) * 100)) : 0;
    elements.meta.textContent = `${result.width} × ${result.height}px · ${formatByteSize(result.uploadedBytes)}${result.converted ? ` · redução de ${reduction}%` : ""}`;
  }
  if (elements.progress) elements.progress.value = 5;
}

function showUploadError(inputElement: HTMLInputElement, error: AdminError): void {
  const elements = uploadElements(inputElement);
  if (elements.feedback) elements.feedback.hidden = false;
  if (elements.status) elements.status.textContent = error.message;
  if (elements.meta) elements.meta.textContent = `Código: ${error.code}`;
  if (elements.progress) elements.progress.removeAttribute("value");
}

async function reloadData(message = ""): Promise<void> {
  if (!state) return;
  state.data = await loadAdminData(state.membership);
  state.message = message;
  state.isError = false;
  state.editingId = null;
  render();
}

function initializeAuthenticatedOnce(): Promise<void> {
  if (state) return Promise.resolve();
  if (authenticatedInitialization) return authenticatedInitialization;

  authenticatedInitialization = (async () => {
    const membership: Membership = await loadMembership();
    const data: AdminData = await loadAdminData(membership);
    state = { membership, data, tab: "dashboard", editingId: null, message: "", isError: false };
    render();
  })().finally(() => {
    authenticatedInitialization = null;
  });

  return authenticatedInitialization;
}

async function initialize(): Promise<void> {
  const notice = consumeAuthUrlNotice();
  if (notice) {
    loginState = {
      message: notice.message,
      isError: notice.isError,
      email: "",
      recoveryMinutes: recoveryMinutesRemaining(),
    };
  }

  const session = await currentSession();
  if (session) {
    await initializeAuthenticatedOnce();
    return;
  }
  render();
}

async function submitLogin(form: HTMLFormElement): Promise<void> {
  const data = new FormData(form);
  const email = value(data, "email");
  const password = String(data.get("password") ?? "");
  if (!email || !password) throw new Error("Informe o e-mail e a senha.");

  setLoginMessage("Validando acesso…", false, email);
  await signInWithPassword(email, password);
  await initializeAuthenticatedOnce();
}

async function submitPasswordRecovery(): Promise<void> {
  const emailInput = root.querySelector<HTMLInputElement>('input[name="email"]');
  const email = emailInput?.value.trim() ?? "";
  if (!email) throw new Error("Informe o e-mail antes de solicitar a recuperação.");

  const remaining = recoveryMinutesRemaining();
  if (remaining > 0) {
    setLoginMessage(`Um e-mail já foi solicitado. Aguarde ${remaining} minuto${remaining === 1 ? "" : "s"}.`, true, email);
    return;
  }

  setLoginMessage("Enviando recuperação de senha…", false, email);
  await requestPasswordReset(email);
  setLoginMessage("E-mail enviado. Use o link recebido para definir uma nova senha.", false, email);
}

async function submitPasswordChange(form: HTMLFormElement): Promise<void> {
  const data = new FormData(form);
  const password = String(data.get("new_password") ?? "");
  const confirmation = String(data.get("confirm_password") ?? "");
  if (password.length < 10) throw new Error("Use uma senha com pelo menos 10 caracteres.");
  if (password !== confirmation) throw new Error("As senhas não são iguais.");
  await updatePassword(password);
  form.reset();
  setMessage("Senha atualizada com sucesso.");
}

async function submitSettings(form: HTMLFormElement): Promise<void> {
  if (!state) return;
  const data = new FormData(form);
  const keys = [
    "professional_name", "professional_title", "logo_url", "favicon_url", "whatsapp", "phone",
    "email", "instagram_url", "address_line", "city", "state", "maps_url", "opening_hours",
    "seo_title", "seo_description", "footer_text",
  ];
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
    throw new AdminError("O conteúdo avançado desta seção não possui um JSON válido.", "CMS_SECTION_JSON_INVALID", "content");
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
  const name = value(data, "name");
  const slug = value(data, "slug") || slugify(name);
  if (!slug) throw new AdminError("Informe um nome válido para gerar o identificador.", "CMS_PROCEDURE_SLUG_EMPTY", "name");
  await upsertRecord("cq_procedures", state.membership.siteId, {
    name,
    slug,
    category: value(data, "category"),
    image_url: value(data, "image_url"),
    short_description: value(data, "short_description"),
    full_description: value(data, "full_description"),
    duration: value(data, "duration"),
    session_estimate: value(data, "session_estimate"),
    contraindications: value(data, "contraindications"),
    whatsapp_message: value(data, "whatsapp_message"),
    sort_order: numberValue(data, "sort_order"),
    is_featured: checked(form, "is_featured"),
    is_published: checked(form, "is_published"),
  }, value(data, "id") || undefined);
  await reloadData("Procedimento salvo.");
}

async function submitResult(form: HTMLFormElement): Promise<void> {
  if (!state) return;
  const data = new FormData(form);
  const isPublished = checked(form, "is_published");
  const hasConsent = checked(form, "consent_confirmed");
  if (isPublished && !hasConsent) throw new AdminError("Confirme a autorização antes de publicar o resultado.", "CONTENT_CONSENT_REQUIRED", "consent_confirmed");
  await upsertRecord("cq_results", state.membership.siteId, {
    title: value(data, "title"),
    summary: value(data, "summary"),
    procedure_id: value(data, "procedure_id") || null,
    body_area: value(data, "body_area"),
    before_image_url: value(data, "before_image_url"),
    after_image_url: value(data, "after_image_url"),
    sessions: value(data, "sessions"),
    treatment_period: value(data, "treatment_period"),
    testimonial_text: value(data, "testimonial_text"),
    client_display_name: value(data, "client_display_name"),
    sort_order: numberValue(data, "sort_order"),
    consent_confirmed: hasConsent,
    is_published: isPublished,
  }, value(data, "id") || undefined);
  await reloadData("Resultado salvo.");
}

async function submitTestimonial(form: HTMLFormElement): Promise<void> {
  if (!state) return;
  const data = new FormData(form);
  const isPublished = checked(form, "is_published");
  const hasConsent = checked(form, "consent_confirmed");
  if (isPublished && !hasConsent) throw new AdminError("Confirme a autorização antes de publicar o depoimento.", "CONTENT_CONSENT_REQUIRED", "consent_confirmed");
  await upsertRecord("cq_testimonials", state.membership.siteId, {
    client_display_name: value(data, "client_display_name"),
    procedure_id: value(data, "procedure_id") || null,
    photo_url: value(data, "photo_url"),
    testimonial_text: value(data, "testimonial_text"),
    rating: Math.min(5, Math.max(1, numberValue(data, "rating"))),
    source_name: value(data, "source_name"),
    source_url: value(data, "source_url"),
    sort_order: numberValue(data, "sort_order"),
    consent_confirmed: hasConsent,
    is_published: isPublished,
  }, value(data, "id") || undefined);
  await reloadData("Depoimento salvo.");
}

async function submitFaq(form: HTMLFormElement): Promise<void> {
  if (!state) return;
  const data = new FormData(form);
  await upsertRecord("cq_faq_items", state.membership.siteId, {
    question: value(data, "question"),
    answer: value(data, "answer"),
    sort_order: numberValue(data, "sort_order"),
    is_published: checked(form, "is_published"),
  }, value(data, "id") || undefined);
  await reloadData("Pergunta salva.");
}

async function submitTracking(form: HTMLFormElement): Promise<void> {
  if (!state) return;
  const data = new FormData(form);
  await saveTracking(state.membership.siteId, {
    meta_pixel_id: value(data, "meta_pixel_id"),
    meta_browser_enabled: checked(form, "meta_browser_enabled"),
    meta_server_enabled: checked(form, "meta_server_enabled"),
    ga4_measurement_id: value(data, "ga4_measurement_id"),
    ga4_browser_enabled: checked(form, "ga4_browser_enabled"),
    ga4_server_enabled: checked(form, "ga4_server_enabled"),
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
  const keys = [
    "metaAccessToken", "metaApiVersion", "ga4ApiSecret", "googleDataManagerEndpoint",
    "googleOAuthAccessToken", "googleOperatingAccountId", "googleLoginAccountId", "googleConversionActionId",
  ];
  const secrets: Record<string, string> = {};
  for (const key of keys) {
    const current = value(data, key);
    if (current) secrets[key] = current;
  }
  if (Object.keys(secrets).length === 0) throw new Error("Informe ao menos uma credencial.");
  await saveTrackingSecrets(state.membership.siteId, secrets);
  setMessage("Credenciais criptografadas e salvas.");
}

async function submitMedia(form: HTMLFormElement): Promise<void> {
  if (!state) return;
  const data = new FormData(form);
  const file = data.get("file");
  const inputElement = form.querySelector<HTMLInputElement>('input[name="file"]');
  if (!(file instanceof File) || file.size === 0 || !inputElement) throw new AdminError("Escolha uma imagem.", "MEDIA_FILE_REQUIRED", "file");
  const result = await uploadMedia(
    state.membership.siteId,
    file,
    value(data, "category") || "general",
    value(data, "alt_text"),
    (progress) => updateUploadProgress(inputElement, progress),
  );
  showUploadResult(inputElement, result);
  await reloadData("Imagem enviada e registrada na biblioteca.");
}

async function handleSubmit(form: HTMLFormElement): Promise<void> {
  const kind = form.dataset.form;
  if (kind === "login") return submitLogin(form);
  if (kind === "password") return submitPasswordChange(form);
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

async function uploadFromField(inputElement: HTMLInputElement): Promise<void> {
  if (!state || !inputElement.dataset.uploadTarget) return;
  const file = inputElement.files?.[0];
  if (!file) return;
  const targetName = inputElement.dataset.uploadTarget;
  const form = inputElement.closest<HTMLFormElement>("form");
  const target = form?.querySelector<HTMLInputElement>(`[name="${targetName}"]`);
  if (!form || !target) throw new AdminError("O campo de destino da imagem não foi encontrado.", "MEDIA_TARGET_NOT_FOUND");

  inputElement.disabled = true;
  try {
    const result = await uploadMedia(
      state.membership.siteId,
      file,
      targetName,
      "",
      (progress) => updateUploadProgress(inputElement, progress),
    );
    target.value = result.publicUrl;
    target.dispatchEvent(new Event("change", { bubbles: true }));
    showUploadResult(inputElement, result);
    setMessage("Imagem enviada. Agora salve o formulário para aplicar a alteração.");
  } catch (error) {
    const normalized = normalizeOperationError("media", error);
    showUploadError(inputElement, normalized);
    setMessage(formatAdminError(normalized), true);
  } finally {
    inputElement.disabled = false;
    inputElement.value = "";
  }
}

root.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  clearFormErrors(form);
  setFormBusy(form, true);
  void handleSubmit(form).catch((error: unknown) => {
    if (state) handleAdminFailure(form.dataset.form ?? "operation", error, form);
    else setLoginMessage(loginErrorMessage(error), true, value(new FormData(form), "email"));
  }).finally(() => setFormBusy(form, false));
});

root.addEventListener("change", (event) => {
  const inputElement = event.target;
  if (!(inputElement instanceof HTMLInputElement) || !inputElement.dataset.uploadTarget) return;
  void uploadFromField(inputElement);
});

root.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  if (target.closest("[data-auth-recovery]")) {
    void submitPasswordRecovery().catch((error: unknown) => {
      const email = root.querySelector<HTMLInputElement>('input[name="email"]')?.value.trim() ?? "";
      setLoginMessage(loginErrorMessage(error), true, email);
    });
    return;
  }

  const tabButton = target.closest<HTMLButtonElement>("[data-tab]");
  if (tabButton && state) {
    state.tab = tabButton.dataset.tab as AdminTab;
    state.editingId = null;
    state.message = "";
    render();
    return;
  }

  if (target.closest("[data-sign-out]")) {
    void signOut().then(() => {
      state = null;
      loginState = { message: "", isError: false, email: "", recoveryMinutes: recoveryMinutesRemaining() };
      render();
    });
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
    const table = editableTable[deleteButton.dataset.deleteType ?? ""];
    const id = deleteButton.dataset.deleteId;
    if (!table || !id || !window.confirm("Excluir este item?")) return;
    void deleteRecord(table, state.membership.siteId, id)
      .then(() => reloadData("Item excluído."))
      .catch((error: unknown) => handleAdminFailure("delete", error));
  }
});

subscribeToAuth((event, session) => {
  if (event === "SIGNED_IN" && session && !state) {
    void initializeAuthenticatedOnce().catch((error: unknown) => {
      const normalized = normalizeOperationError("initialization", error);
      setLoginMessage(formatAdminError(normalized), true);
    });
  }
  if (event === "SIGNED_OUT") {
    state = null;
    render();
  }
});

void initialize().catch((error: unknown) => {
  const normalized = normalizeOperationError("initialization", error);
  setLoginMessage(formatAdminError(normalized), true);
});
