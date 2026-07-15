import type { AdminData, FaqRecord, ProcedureRecord, ResultRecord, TestimonialRecord } from "../lib/types";
import type { Membership } from "./repository";

export type AdminTab = "dashboard" | "settings" | "content" | "procedures" | "results" | "testimonials" | "faq" | "tracking" | "media";

export interface AdminViewState {
  membership: Membership;
  data: AdminData;
  tab: AdminTab;
  editingId: string | null;
  message: string;
  isError: boolean;
}

export interface LoginViewState {
  message: string;
  isError: boolean;
  email: string;
  recoveryMinutes: number;
}

const escapeHtml = (value: unknown): string => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const input = (
  name: string,
  label: string,
  value: unknown,
  options: { type?: string; full?: boolean; required?: boolean; placeholder?: string; autocomplete?: string; minlength?: number; help?: string } = {},
): string => `
  <div class="field${options.full ? " field-full" : ""}">
    <label for="${name}">${escapeHtml(label)}</label>
    <input id="${name}" name="${name}" type="${options.type ?? "text"}" value="${escapeHtml(value)}"${options.required ? " required" : ""}${options.placeholder ? ` placeholder="${escapeHtml(options.placeholder)}"` : ""}${options.autocomplete ? ` autocomplete="${escapeHtml(options.autocomplete)}"` : ""}${options.minlength ? ` minlength="${options.minlength}"` : ""}>
    ${options.help ? `<small class="field-help">${escapeHtml(options.help)}</small>` : ""}
  </div>`;

const textarea = (name: string, label: string, value: unknown, full = true, help = ""): string => `
  <div class="field${full ? " field-full" : ""}">
    <label for="${name}">${escapeHtml(label)}</label>
    <textarea id="${name}" name="${name}">${escapeHtml(value)}</textarea>
    ${help ? `<small class="field-help">${escapeHtml(help)}</small>` : ""}
  </div>`;

const checkbox = (name: string, label: string, checked: boolean): string => `
  <label class="checkbox-field"><input name="${name}" type="checkbox"${checked ? " checked" : ""}> ${escapeHtml(label)}</label>`;

const uploadField = (target: string, label: string): string => `
  <div class="field field-full upload-field">
    <label for="upload-${target}">${escapeHtml(label)}</label>
    <input id="upload-${target}" type="file" accept="image/*" data-upload-target="${target}">
    <small class="field-help">JPG, PNG ou WebP, com no máximo 5 MB.</small>
  </div>`;

const formGroup = (title: string, description: string, fields: string): string => `
  <fieldset class="form-group field-full">
    <legend>${escapeHtml(title)}</legend>
    <p class="form-group-description">${escapeHtml(description)}</p>
    <div class="form-grid form-group-grid">${fields}</div>
  </fieldset>`;

const sectionNames: Record<string, string> = {
  needs: "Necessidades",
  procedures: "Apresentação dos procedimentos",
  process: "Como funciona",
  about: "Sobre a profissional",
  results: "Antes e depois",
  testimonials: "Depoimentos",
  faq: "Perguntas frequentes",
  location: "Localização",
};

function navigation(active: AdminTab): string {
  const items: Array<[AdminTab, string]> = [
    ["dashboard", "Visão geral"],
    ["settings", "Identidade e contato"],
    ["content", "Páginas e seções"],
    ["procedures", "Procedimentos"],
    ["results", "Antes e depois"],
    ["testimonials", "Depoimentos"],
    ["faq", "Perguntas"],
    ["media", "Biblioteca de imagens"],
    ["tracking", "Pixels e integrações"],
  ];
  return items.map(([tab, label]) => `<button type="button" class="${active === tab ? "is-active" : ""}" data-tab="${tab}">${label}</button>`).join("");
}

export function renderLogin(state: LoginViewState): string {
  const recoveryLabel = state.recoveryMinutes > 0 ? `Novo e-mail em ${state.recoveryMinutes} min` : "Esqueci minha senha";
  return `<main class="login-page"><section class="login-brand"><p class="eyebrow">CMS multi-site</p><h1>Controle todo o site sem editar código.</h1><p>Textos, imagens, procedimentos, resultados, depoimentos, SEO e rastreamento em um único painel.</p></section><section class="login-panel"><form class="login-card" data-form="login"><p class="eyebrow">Área administrativa</p><h2>Entrar no painel</h2><p>Entre com seu e-mail autorizado e sua senha.</p>${state.message ? `<div class="status-message${state.isError ? " is-error" : ""}">${escapeHtml(state.message)}</div>` : ""}${input("email", "E-mail", state.email, { type: "email", required: true, full: true, placeholder: "seu@email.com", autocomplete: "email" })}${input("password", "Senha", "", { type: "password", required: true, full: true, autocomplete: "current-password", minlength: 8 })}<div class="form-actions"><button class="button button-primary" type="submit">Entrar</button><button class="button button-outline" type="button" data-auth-recovery${state.recoveryMinutes > 0 ? " disabled" : ""}>${recoveryLabel}</button></div><p class="auth-help field-full">O e-mail é usado somente para recuperar a senha quando necessário.</p></form></section></main>`;
}

function dashboard(data: AdminData): string {
  const publishedResults = data.results.filter((item) => item.is_published).length;
  const publishedTestimonials = data.testimonials.filter((item) => item.is_published).length;
  const alerts = [
    publishedResults === 0 ? '<article class="publication-alert"><strong>Antes e depois não aparece no site</strong><p>Cadastre um resultado, confirme a autorização e marque como publicado.</p><button type="button" class="button button-outline button-small" data-tab="results">Cadastrar resultado</button></article>' : "",
    publishedTestimonials === 0 ? '<article class="publication-alert"><strong>Depoimentos não aparecem no site</strong><p>Cadastre um depoimento real, confirme a autorização e marque como publicado.</p><button type="button" class="button button-outline button-small" data-tab="testimonials">Cadastrar depoimento</button></article>' : "",
  ].join("");
  return `<div class="admin-grid"><article class="metric-card"><strong>${data.procedures.length}</strong><span>procedimentos cadastrados</span></article><article class="metric-card"><strong>${publishedResults}</strong><span>resultados publicados</span></article><article class="metric-card"><strong>${publishedTestimonials}</strong><span>depoimentos publicados</span></article></div>${alerts ? `<section class="publication-alerts">${alerts}</section>` : ""}<section class="panel"><div class="panel-heading"><div><h2>Estado da publicação</h2><p>O site mostra apenas registros publicados e autorizados.</p></div><a class="button button-outline" href="/" target="_blank" rel="noopener">Visualizar site</a></div><p>Itens salvos como rascunho permanecem no painel, mas não aparecem para visitantes. Resultados e depoimentos exigem autorização confirmada.</p></section><section class="panel account-security-panel"><div class="panel-heading"><div><h2>Senha de acesso</h2><p>Defina ou altere a senha usada para entrar no painel.</p></div></div><form class="form-grid" data-form="password">${input("new_password", "Nova senha", "", { type: "password", required: true, autocomplete: "new-password", minlength: 10 })}${input("confirm_password", "Confirmar senha", "", { type: "password", required: true, autocomplete: "new-password", minlength: 10 })}<div class="form-actions"><button class="button button-primary" type="submit">Salvar senha</button></div></form></section>`;
}

function settingsForm(data: AdminData): string {
  const item = data.settings;
  return `<section class="panel"><div class="panel-heading"><div><p class="eyebrow">Configuração do site</p><h2>Identidade, contato e localização</h2><p>Os campos são agrupados conforme a parte do site que alteram.</p></div></div><form class="form-grid settings-form" data-form="settings">${formGroup("Identidade", "Nome, especialidade e arquivos usados na marca.", `${input("professional_name", "Nome profissional", item.professional_name, { required: true })}${input("professional_title", "Título ou especialidade", item.professional_title)}${input("logo_url", "URL atual da logo", item.logo_url, { full: true, help: "É preenchida automaticamente ao enviar uma nova logo." })}${uploadField("logo_url", "Enviar nova logo")}${input("favicon_url", "URL do ícone do navegador", item.favicon_url, { full: true })}`)}${formGroup("Contato", "Canais exibidos nos botões e no rodapé.", `${input("whatsapp", "WhatsApp com DDI", item.whatsapp, { required: true, help: "Exemplo: 5581989844806" })}${input("phone", "Telefone exibido", item.phone)}${input("email", "E-mail público", item.email, { type: "email" })}${input("instagram_url", "Link do Instagram", item.instagram_url, { full: true })}`)}${formGroup("Endereço e atendimento", "Informações usadas na localização e nos resumos de atendimento.", `${input("address_line", "Endereço", item.address_line, { full: true })}${input("city", "Cidade", item.city)}${input("state", "Estado", item.state)}${input("maps_url", "Link do Google Maps", item.maps_url, { full: true })}${input("opening_hours", "Horário de atendimento", item.opening_hours, { full: true })}`)}${formGroup("Google e compartilhamento", "Textos usados nos resultados de pesquisa.", `${input("seo_title", "Título para Google", item.seo_title, { full: true })}${textarea("seo_description", "Descrição para Google", item.seo_description, true, "Use uma descrição objetiva da clínica, localização e serviços.")}`)}${formGroup("Rodapé", "Texto institucional exibido no final do site.", textarea("footer_text", "Texto do rodapé", item.footer_text))}<div class="form-actions sticky-form-actions"><button class="button button-primary" type="submit">Salvar todas as configurações</button></div></form></section>`;
}

function contentForms(data: AdminData): string {
  const hero = data.settings.hero;
  const heroForm = `<section class="panel"><div class="panel-heading"><div><p class="eyebrow">Primeira tela</p><h2>Apresentação principal</h2><p>É a primeira parte vista no celular e no computador.</p></div></div><form class="form-grid" data-form="hero">${input("eyebrow", "Chamada superior", hero.eyebrow)}${input("title", "Título principal", hero.title, { full: true, required: true })}${textarea("subtitle", "Texto de apoio", hero.subtitle)}${input("image_url", "URL atual da imagem", hero.image_url, { full: true })}${uploadField("image_url", "Enviar imagem principal")}${input("primary_cta", "Texto do botão principal", hero.primary_cta)}${input("secondary_cta", "Texto do botão secundário", hero.secondary_cta)}<div class="form-actions sticky-form-actions"><button class="button button-primary" type="submit">Salvar primeira tela</button></div></form></section>`;
  const sections = data.sections.map((item) => {
    const contentItems = Object.values(item.content).find(Array.isArray);
    const itemCount = Array.isArray(contentItems) ? contentItems.length : 0;
    return `<details class="panel content-panel"${item.section_key === "needs" ? " open" : ""}><summary><span><strong>${escapeHtml(sectionNames[item.section_key] || item.section_key)}</strong><small>${item.is_enabled ? "Visível" : "Oculta"}${itemCount ? ` · ${itemCount} itens` : ""}</small></span><span>Editar</span></summary><form class="form-grid content-panel-form" data-form="section"><input type="hidden" name="id" value="${escapeHtml(item.id)}">${input("eyebrow", "Chamada superior", item.eyebrow)}${input("title", "Título", item.title, { full: true })}${textarea("subtitle", "Texto de apoio", item.subtitle)}${input("sort_order", "Ordem da seção", item.sort_order, { type: "number" })}<div class="field">${checkbox("is_enabled", "Mostrar esta seção no site", item.is_enabled)}</div><details class="advanced-fields field-full"><summary>Conteúdo avançado da seção</summary>${textarea("content", "Estrutura de conteúdo", JSON.stringify(item.content, null, 2), true, "Esta área mantém listas e campos específicos. Edite apenas quando necessário.")}</details><div class="form-actions sticky-form-actions"><button class="button button-primary" type="submit">Salvar seção</button></div></form></details>`;
  }).join("");
  return heroForm + `<div class="content-panels">${sections}</div>`;
}

function procedureForm(item?: ProcedureRecord): string {
  return `<section class="panel"><div class="panel-heading"><div><h2>${item ? "Editar procedimento" : "Novo procedimento"}</h2><p>O cartão se reorganiza automaticamente quando campos opcionais ficam vazios.</p></div>${item ? '<button class="button button-outline button-small" type="button" data-cancel-edit>Cancelar</button>' : ""}</div><form class="form-grid" data-form="procedure"><input type="hidden" name="id" value="${escapeHtml(item?.id)}">${input("name", "Nome", item?.name, { required: true })}${input("slug", "Identificador", item?.slug, { required: true })}${input("category", "Categoria", item?.category)}${input("image_url", "URL atual da imagem", item?.image_url, { full: true })}${uploadField("image_url", "Enviar imagem")}${textarea("short_description", "Descrição curta", item?.short_description)}${textarea("full_description", "Descrição completa", item?.full_description)}${input("duration", "Duração", item?.duration)}${input("session_estimate", "Estimativa de sessões", item?.session_estimate)}${textarea("contraindications", "Contraindicações", item?.contraindications)}${textarea("whatsapp_message", "Mensagem do WhatsApp", item?.whatsapp_message)}${input("sort_order", "Ordem", item?.sort_order ?? 0, { type: "number" })}<div class="field">${checkbox("is_featured", "Destaque", item?.is_featured ?? false)}${checkbox("is_published", "Publicado", item?.is_published ?? true)}</div><div class="form-actions sticky-form-actions"><button class="button button-primary" type="submit">Salvar procedimento</button></div></form></section>`;
}

function resultForm(item?: ResultRecord): string {
  return `<section class="panel"><div class="panel-heading"><div><h2>${item ? "Editar resultado" : "Novo antes e depois"}</h2><p>As duas fotos são obrigatórias. A publicação exige autorização confirmada.</p></div>${item ? '<button class="button button-outline button-small" type="button" data-cancel-edit>Cancelar</button>' : ""}</div><form class="form-grid" data-form="result"><input type="hidden" name="id" value="${escapeHtml(item?.id)}">${input("title", "Título", item?.title, { full: true, required: true })}${textarea("summary", "Descrição do resultado", item?.summary)}${input("procedure_id", "ID do procedimento", item?.procedure_id)}${input("body_area", "Região tratada", item?.body_area)}${input("before_image_url", "URL da foto antes", item?.before_image_url, { full: true, required: true })}${uploadField("before_image_url", "Enviar foto antes")}${input("after_image_url", "URL da foto depois", item?.after_image_url, { full: true, required: true })}${uploadField("after_image_url", "Enviar foto depois")}${input("sessions", "Quantidade de sessões", item?.sessions)}${input("treatment_period", "Período", item?.treatment_period)}${textarea("testimonial_text", "Relato associado", item?.testimonial_text)}${input("client_display_name", "Nome ou iniciais", item?.client_display_name)}${input("sort_order", "Ordem", item?.sort_order ?? 0, { type: "number" })}<div class="field publication-checks">${checkbox("consent_confirmed", "Autorização confirmada", item?.consent_confirmed ?? false)}${checkbox("is_published", "Publicado", item?.is_published ?? false)}</div><div class="form-actions sticky-form-actions"><button class="button button-primary" type="submit">Salvar resultado</button></div></form></section>`;
}

function testimonialForm(item?: TestimonialRecord): string {
  return `<section class="panel"><div class="panel-heading"><div><h2>${item ? "Editar depoimento" : "Novo depoimento"}</h2><p>Use somente depoimentos reais com autorização para publicação.</p></div>${item ? '<button class="button button-outline button-small" type="button" data-cancel-edit>Cancelar</button>' : ""}</div><form class="form-grid" data-form="testimonial"><input type="hidden" name="id" value="${escapeHtml(item?.id)}">${input("client_display_name", "Nome ou iniciais", item?.client_display_name, { required: true })}${input("procedure_id", "ID do procedimento", item?.procedure_id)}${input("photo_url", "URL atual da foto", item?.photo_url, { full: true })}${uploadField("photo_url", "Enviar foto")}${textarea("testimonial_text", "Depoimento", item?.testimonial_text)}${input("rating", "Estrelas", item?.rating ?? 5, { type: "number" })}${input("source_name", "Origem", item?.source_name)}${input("source_url", "Link original", item?.source_url, { full: true })}${input("sort_order", "Ordem", item?.sort_order ?? 0, { type: "number" })}<div class="field publication-checks">${checkbox("consent_confirmed", "Autorização confirmada", item?.consent_confirmed ?? false)}${checkbox("is_published", "Publicado", item?.is_published ?? false)}</div><div class="form-actions sticky-form-actions"><button class="button button-primary" type="submit">Salvar depoimento</button></div></form></section>`;
}

function faqForm(item?: FaqRecord): string {
  return `<section class="panel"><div class="panel-heading"><h2>${item ? "Editar pergunta" : "Nova pergunta"}</h2>${item ? '<button class="button button-outline button-small" type="button" data-cancel-edit>Cancelar</button>' : ""}</div><form class="form-grid" data-form="faq"><input type="hidden" name="id" value="${escapeHtml(item?.id)}">${input("question", "Pergunta", item?.question, { full: true, required: true })}${textarea("answer", "Resposta", item?.answer)}${input("sort_order", "Ordem", item?.sort_order ?? 0, { type: "number" })}<div class="field">${checkbox("is_published", "Publicado", item?.is_published ?? true)}</div><div class="form-actions sticky-form-actions"><button class="button button-primary" type="submit">Salvar pergunta</button></div></form></section>`;
}

function dataRows(items: Array<ProcedureRecord | ResultRecord | TestimonialRecord | FaqRecord>, type: "procedure" | "result" | "testimonial" | "faq"): string {
  if (items.length === 0) return '<div class="empty-state"><strong>Nenhum item cadastrado.</strong><p>Use o formulário acima para criar o primeiro item. Ele só aparecerá no site depois de ser publicado.</p></div>';
  return `<div class="data-list">${items.map((item) => {
    const title = "name" in item ? item.name : "title" in item ? item.title : "question" in item ? item.question : item.client_display_name;
    const image = "image_url" in item ? item.image_url : "before_image_url" in item ? item.before_image_url : "photo_url" in item ? item.photo_url : "";
    const published = "is_published" in item ? item.is_published : false;
    return `<article class="data-row">${image ? `<img src="${escapeHtml(image)}" alt="">` : '<div class="data-row-placeholder">Sem imagem</div>'}<div><strong>${escapeHtml(title)}</strong><span class="publication-status ${published ? "is-published" : "is-draft"}">${published ? "Publicado" : "Rascunho ou oculto"}</span></div><div class="row-actions"><button class="button button-outline button-small" type="button" data-edit-type="${type}" data-edit-id="${escapeHtml(item.id)}">Editar</button><button class="button button-danger button-small" type="button" data-delete-type="${type}" data-delete-id="${escapeHtml(item.id)}">Excluir</button></div></article>`;
  }).join("")}</div>`;
}

function trackingForm(data: AdminData): string {
  const item = data.tracking;
  return `<section class="panel"><div class="panel-heading"><div><h2>Configurações públicas</h2><p>Ative apenas as plataformas realmente configuradas.</p></div></div><form class="form-grid" data-form="tracking">${input("meta_pixel_id", "Meta Pixel ID", item.meta_pixel_id)}${input("ga4_measurement_id", "GA4 Measurement ID", item.ga4_measurement_id)}${input("google_ads_conversion_id", "Google Ads Conversion ID", item.google_ads_conversion_id)}${input("google_ads_conversion_label", "Google Ads Conversion Label", item.google_ads_conversion_label)}<div class="field">${checkbox("meta_browser_enabled", "Meta no navegador", item.meta_browser_enabled)}${checkbox("meta_server_enabled", "Meta CAPI", item.meta_server_enabled)}</div><div class="field">${checkbox("ga4_browser_enabled", "GA4 no navegador", item.ga4_browser_enabled)}${checkbox("ga4_server_enabled", "GA4 no servidor", item.ga4_server_enabled)}</div><div class="field">${checkbox("google_ads_browser_enabled", "Google Ads no navegador", item.google_ads_browser_enabled)}${checkbox("google_ads_server_enabled", "Google Ads no servidor", item.google_ads_server_enabled)}</div><div class="form-actions sticky-form-actions"><button class="button button-primary" type="submit">Salvar rastreamento</button></div></form></section><section class="panel"><div class="panel-heading"><div><h2>Credenciais protegidas</h2><p>Os valores são criptografados e nunca retornam ao navegador.</p></div></div><form class="form-grid" data-form="tracking-secrets">${input("metaAccessToken", "Token da Meta CAPI", "", { type: "password", full: true })}${input("metaApiVersion", "Versão da API Meta", "v23.0")}${input("ga4ApiSecret", "GA4 API Secret", "", { type: "password" })}${input("googleDataManagerEndpoint", "Endpoint Google Data Manager", "", { full: true })}${input("googleOAuthAccessToken", "OAuth token do Google", "", { type: "password", full: true })}${input("googleOperatingAccountId", "Conta operacional Google Ads", "")}${input("googleLoginAccountId", "Conta de login Google Ads", "")}${input("googleConversionActionId", "Ação de conversão", "")}<div class="form-actions sticky-form-actions"><button class="button button-primary" type="submit">Salvar credenciais</button></div></form></section>`;
}

function mediaView(data: AdminData): string {
  return `<section class="panel"><div class="panel-heading"><div><h2>Enviar imagem</h2><p>As imagens ficam organizadas por site e categoria no Supabase Storage.</p></div></div><form class="form-grid" data-form="media"><div class="field field-full"><label for="media-file">Arquivo</label><input id="media-file" name="file" type="file" accept="image/*" required><small class="field-help">JPG, PNG ou WebP, com no máximo 5 MB.</small></div>${input("category", "Categoria", "general", { help: "Exemplos: hero, procedimentos, resultados ou equipe." })}${input("alt_text", "Descrição da imagem", "", { help: "Ajuda acessibilidade e mecanismos de busca." })}<div class="form-actions sticky-form-actions"><button class="button button-primary" type="submit">Enviar imagem</button></div></form></section><section class="panel"><div class="panel-heading"><h2>Biblioteca</h2><span>${data.media.length} arquivo(s)</span></div>${data.media.length ? `<div class="media-grid">${data.media.map((item) => `<article class="media-card"><img src="${escapeHtml(item.public_url)}" alt="${escapeHtml(item.alt_text)}"><div><strong>${escapeHtml(item.file_name)}</strong><span>${escapeHtml(item.public_url)}</span></div></article>`).join("")}</div>` : '<div class="empty-state"><strong>Nenhuma imagem enviada.</strong><p>Envie a primeira imagem pelo formulário acima.</p></div>'}</section>`;
}

function tabContent(state: AdminViewState): string {
  const data = state.data;
  if (state.tab === "dashboard") return dashboard(data);
  if (state.tab === "settings") return settingsForm(data);
  if (state.tab === "content") return contentForms(data);
  if (state.tab === "procedures") return procedureForm(data.procedures.find((item) => item.id === state.editingId)) + `<section class="panel"><div class="panel-heading"><h2>Procedimentos cadastrados</h2><span>${data.procedures.length} item(ns)</span></div>${dataRows(data.procedures, "procedure")}</section>`;
  if (state.tab === "results") return resultForm(data.results.find((item) => item.id === state.editingId)) + `<section class="panel"><div class="panel-heading"><h2>Resultados cadastrados</h2><span>${data.results.length} item(ns)</span></div>${dataRows(data.results, "result")}</section>`;
  if (state.tab === "testimonials") return testimonialForm(data.testimonials.find((item) => item.id === state.editingId)) + `<section class="panel"><div class="panel-heading"><h2>Depoimentos cadastrados</h2><span>${data.testimonials.length} item(ns)</span></div>${dataRows(data.testimonials, "testimonial")}</section>`;
  if (state.tab === "faq") return faqForm(data.faq.find((item) => item.id === state.editingId)) + `<section class="panel"><div class="panel-heading"><h2>Perguntas cadastradas</h2><span>${data.faq.length} item(ns)</span></div>${dataRows(data.faq, "faq")}</section>`;
  if (state.tab === "tracking") return trackingForm(data);
  return mediaView(data);
}

export function renderAdmin(state: AdminViewState): string {
  return `<div class="admin-layout"><aside class="admin-sidebar"><div class="admin-logo">CQ · Painel</div><nav class="admin-nav" aria-label="Seções do painel">${navigation(state.tab)}</nav><div class="admin-sidebar-footer"><a class="button button-light button-small" href="/" target="_blank" rel="noopener">Abrir site</a><button class="button button-outline button-small" type="button" data-sign-out>Sair</button></div></aside><main class="admin-main"><header class="admin-header"><div><p class="eyebrow">Painel administrativo</p><h1>${escapeHtml(state.membership.site.name)}</h1><p>Perfil: ${escapeHtml(state.membership.role)}</p></div></header>${state.message ? `<div class="status-message${state.isError ? " is-error" : ""}">${escapeHtml(state.message)}</div>` : ""}${tabContent(state)}</main></div>`;
}
