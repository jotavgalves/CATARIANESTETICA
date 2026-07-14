import type { AdminData, FaqRecord, ProcedureRecord, ResultRecord, SectionRecord, TestimonialRecord } from "../lib/types";
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

const escapeHtml = (value: unknown): string => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const input = (name: string, label: string, value: unknown, options: { type?: string; full?: boolean; required?: boolean; placeholder?: string } = {}): string => `
  <div class="field${options.full ? " field-full" : ""}">
    <label for="${name}">${escapeHtml(label)}</label>
    <input id="${name}" name="${name}" type="${options.type ?? "text"}" value="${escapeHtml(value)}"${options.required ? " required" : ""}${options.placeholder ? ` placeholder="${escapeHtml(options.placeholder)}"` : ""}>
  </div>`;

const textarea = (name: string, label: string, value: unknown, full = true): string => `
  <div class="field${full ? " field-full" : ""}">
    <label for="${name}">${escapeHtml(label)}</label>
    <textarea id="${name}" name="${name}">${escapeHtml(value)}</textarea>
  </div>`;

const checkbox = (name: string, label: string, checked: boolean): string => `
  <label class="checkbox-field"><input name="${name}" type="checkbox"${checked ? " checked" : ""}> ${escapeHtml(label)}</label>`;

const uploadField = (target: string, label: string): string => `
  <div class="field field-full">
    <label for="upload-${target}">${escapeHtml(label)}</label>
    <input id="upload-${target}" type="file" accept="image/*" data-upload-target="${target}">
  </div>`;

function navigation(active: AdminTab): string {
  const items: Array<[AdminTab, string]> = [
    ["dashboard", "Visão geral"], ["settings", "Configurações"], ["content", "Conteúdo"],
    ["procedures", "Procedimentos"], ["results", "Antes e depois"], ["testimonials", "Depoimentos"],
    ["faq", "Perguntas"], ["tracking", "Pixels e Ads"], ["media", "Imagens"],
  ];
  return items.map(([tab, label]) => `<button type="button" class="${active === tab ? "is-active" : ""}" data-tab="${tab}">${label}</button>`).join("");
}

export function renderLogin(message = ""): string {
  return `<main class="login-page"><section class="login-brand"><p class="eyebrow">CMS multi-site</p><h1>Controle todo o site sem editar código.</h1><p>Textos, imagens, procedimentos, resultados, depoimentos, SEO e rastreamento em um único painel.</p></section><section class="login-panel"><form class="login-card" data-form="login"><p class="eyebrow">Área administrativa</p><h2>Entrar no painel</h2><p>Informe um e-mail autorizado. Você receberá um link seguro de acesso.</p>${message ? `<div class="status-message">${escapeHtml(message)}</div>` : ""}${input("email", "E-mail", "", { type: "email", required: true, full: true, placeholder: "seu@email.com" })}<div class="form-actions"><button class="button button-primary" type="submit">Enviar link de acesso</button></div></form></section></main>`;
}

function dashboard(data: AdminData): string {
  return `<div class="admin-grid"><article class="metric-card"><strong>${data.procedures.length}</strong><span>procedimentos cadastrados</span></article><article class="metric-card"><strong>${data.results.filter((item) => item.is_published).length}</strong><span>resultados publicados</span></article><article class="metric-card"><strong>${data.testimonials.filter((item) => item.is_published).length}</strong><span>depoimentos publicados</span></article></div><section class="panel"><div class="panel-heading"><h2>Publicação</h2><a class="button button-outline" href="/" target="_blank" rel="noopener">Visualizar site</a></div><p>O site público lê somente conteúdo publicado. Resultados e depoimentos exigem confirmação de autorização antes de serem exibidos.</p></section>`;
}

function settingsForm(data: AdminData): string {
  const item = data.settings;
  return `<section class="panel"><div class="panel-heading"><h2>Configurações gerais</h2></div><form class="form-grid" data-form="settings">${input("professional_name", "Nome profissional", item.professional_name, { required: true })}${input("professional_title", "Título profissional", item.professional_title)}${input("logo_url", "URL da logo", item.logo_url)}${input("favicon_url", "URL do favicon", item.favicon_url)}${uploadField("logo_url", "Enviar nova logo")}${input("whatsapp", "WhatsApp com DDI", item.whatsapp, { required: true })}${input("phone", "Telefone exibido", item.phone)}${input("email", "E-mail", item.email, { type: "email" })}${input("instagram_url", "Instagram", item.instagram_url)}${input("address_line", "Endereço", item.address_line, { full: true })}${input("city", "Cidade", item.city)}${input("state", "Estado", item.state)}${input("maps_url", "Link do Google Maps", item.maps_url, { full: true })}${input("opening_hours", "Horário de atendimento", item.opening_hours, { full: true })}${input("seo_title", "Título para Google", item.seo_title, { full: true })}${textarea("seo_description", "Descrição para Google", item.seo_description)}${textarea("footer_text", "Texto do rodapé", item.footer_text)}<div class="form-actions"><button class="button button-primary" type="submit">Salvar configurações</button></div></form></section>`;
}

function contentForms(data: AdminData): string {
  const hero = data.settings.hero;
  const heroForm = `<section class="panel"><div class="panel-heading"><h2>Primeira tela</h2></div><form class="form-grid" data-form="hero">${input("eyebrow", "Chamada superior", hero.eyebrow)}${input("title", "Título principal", hero.title, { full: true, required: true })}${textarea("subtitle", "Texto de apoio", hero.subtitle)}${input("image_url", "Imagem de fundo", hero.image_url, { full: true })}${uploadField("image_url", "Enviar imagem principal")}${input("primary_cta", "Botão principal", hero.primary_cta)}${input("secondary_cta", "Botão secundário", hero.secondary_cta)}<div class="form-actions"><button class="button button-primary" type="submit">Salvar primeira tela</button></div></form></section>`;
  const sections = data.sections.map((item) => `<section class="panel"><div class="panel-heading"><h2>${escapeHtml(item.section_key)}</h2></div><form class="form-grid" data-form="section"><input type="hidden" name="id" value="${escapeHtml(item.id)}">${input("eyebrow", "Chamada superior", item.eyebrow)}${input("title", "Título", item.title, { full: true })}${textarea("subtitle", "Subtítulo", item.subtitle)}${textarea("content", "Conteúdo estruturado em JSON", JSON.stringify(item.content, null, 2))}${input("sort_order", "Ordem", item.sort_order, { type: "number" })}<div class="field">${checkbox("is_enabled", "Seção visível", item.is_enabled)}</div><div class="form-actions"><button class="button button-primary" type="submit">Salvar seção</button></div></form></section>`).join("");
  return heroForm + sections;
}

function procedureForm(item?: ProcedureRecord): string {
  return `<section class="panel"><div class="panel-heading"><h2>${item ? "Editar procedimento" : "Novo procedimento"}</h2>${item ? '<button class="button button-outline button-small" type="button" data-cancel-edit>Cancelar</button>' : ""}</div><form class="form-grid" data-form="procedure"><input type="hidden" name="id" value="${escapeHtml(item?.id)}">${input("name", "Nome", item?.name, { required: true })}${input("slug", "Identificador", item?.slug, { required: true })}${input("category", "Categoria", item?.category)}${input("image_url", "Imagem", item?.image_url, { full: true })}${uploadField("image_url", "Enviar imagem")}${textarea("short_description", "Descrição curta", item?.short_description)}${textarea("full_description", "Descrição completa", item?.full_description)}${input("duration", "Duração", item?.duration)}${input("session_estimate", "Estimativa de sessões", item?.session_estimate)}${textarea("contraindications", "Contraindicações", item?.contraindications)}${textarea("whatsapp_message", "Mensagem do WhatsApp", item?.whatsapp_message)}${input("sort_order", "Ordem", item?.sort_order ?? 0, { type: "number" })}<div class="field">${checkbox("is_featured", "Destaque", item?.is_featured ?? false)}${checkbox("is_published", "Publicado", item?.is_published ?? true)}</div><div class="form-actions"><button class="button button-primary" type="submit">Salvar procedimento</button></div></form></section>`;
}

function resultForm(item?: ResultRecord): string {
  return `<section class="panel"><div class="panel-heading"><h2>${item ? "Editar resultado" : "Novo antes e depois"}</h2>${item ? '<button class="button button-outline button-small" type="button" data-cancel-edit>Cancelar</button>' : ""}</div><form class="form-grid" data-form="result"><input type="hidden" name="id" value="${escapeHtml(item?.id)}">${input("title", "Título", item?.title, { full: true, required: true })}${textarea("summary", "Descrição do resultado", item?.summary)}${input("procedure_id", "ID do procedimento", item?.procedure_id)}${input("body_area", "Região tratada", item?.body_area)}${input("before_image_url", "Foto antes", item?.before_image_url, { full: true, required: true })}${uploadField("before_image_url", "Enviar foto antes")}${input("after_image_url", "Foto depois", item?.after_image_url, { full: true, required: true })}${uploadField("after_image_url", "Enviar foto depois")}${input("sessions", "Quantidade de sessões", item?.sessions)}${input("treatment_period", "Período", item?.treatment_period)}${textarea("testimonial_text", "Relato associado", item?.testimonial_text)}${input("client_display_name", "Nome ou iniciais", item?.client_display_name)}${input("sort_order", "Ordem", item?.sort_order ?? 0, { type: "number" })}<div class="field">${checkbox("consent_confirmed", "Autorização confirmada", item?.consent_confirmed ?? false)}${checkbox("is_published", "Publicado", item?.is_published ?? false)}</div><div class="form-actions"><button class="button button-primary" type="submit">Salvar resultado</button></div></form></section>`;
}

function testimonialForm(item?: TestimonialRecord): string {
  return `<section class="panel"><div class="panel-heading"><h2>${item ? "Editar depoimento" : "Novo depoimento"}</h2>${item ? '<button class="button button-outline button-small" type="button" data-cancel-edit>Cancelar</button>' : ""}</div><form class="form-grid" data-form="testimonial"><input type="hidden" name="id" value="${escapeHtml(item?.id)}">${input("client_display_name", "Nome ou iniciais", item?.client_display_name, { required: true })}${input("procedure_id", "ID do procedimento", item?.procedure_id)}${input("photo_url", "Foto", item?.photo_url, { full: true })}${uploadField("photo_url", "Enviar foto")}${textarea("testimonial_text", "Depoimento", item?.testimonial_text)}${input("rating", "Estrelas", item?.rating ?? 5, { type: "number" })}${input("source_name", "Origem", item?.source_name)}${input("source_url", "Link original", item?.source_url, { full: true })}${input("sort_order", "Ordem", item?.sort_order ?? 0, { type: "number" })}<div class="field">${checkbox("consent_confirmed", "Autorização confirmada", item?.consent_confirmed ?? false)}${checkbox("is_published", "Publicado", item?.is_published ?? false)}</div><div class="form-actions"><button class="button button-primary" type="submit">Salvar depoimento</button></div></form></section>`;
}

function faqForm(item?: FaqRecord): string {
  return `<section class="panel"><div class="panel-heading"><h2>${item ? "Editar pergunta" : "Nova pergunta"}</h2>${item ? '<button class="button button-outline button-small" type="button" data-cancel-edit>Cancelar</button>' : ""}</div><form class="form-grid" data-form="faq"><input type="hidden" name="id" value="${escapeHtml(item?.id)}">${input("question", "Pergunta", item?.question, { full: true, required: true })}${textarea("answer", "Resposta", item?.answer)}${input("sort_order", "Ordem", item?.sort_order ?? 0, { type: "number" })}<div class="field">${checkbox("is_published", "Publicado", item?.is_published ?? true)}</div><div class="form-actions"><button class="button button-primary" type="submit">Salvar pergunta</button></div></form></section>`;
}

function dataRows(items: Array<ProcedureRecord | ResultRecord | TestimonialRecord | FaqRecord>, type: "procedure" | "result" | "testimonial" | "faq"): string {
  if (items.length === 0) return '<div class="empty-state">Nenhum item cadastrado.</div>';
  return `<div class="data-list">${items.map((item) => {
    const title = "name" in item ? item.name : "title" in item ? item.title : "question" in item ? item.question : item.client_display_name;
    const image = "image_url" in item ? item.image_url : "before_image_url" in item ? item.before_image_url : "photo_url" in item ? item.photo_url : "";
    const published = "is_published" in item ? item.is_published : false;
    return `<article class="data-row">${image ? `<img src="${escapeHtml(image)}" alt="">` : '<div></div>'}<div><strong>${escapeHtml(title)}</strong><span>${published ? "Publicado" : "Oculto ou rascunho"}</span></div><div class="row-actions"><button class="button button-outline button-small" type="button" data-edit-type="${type}" data-edit-id="${escapeHtml(item.id)}">Editar</button><button class="button button-danger button-small" type="button" data-delete-type="${type}" data-delete-id="${escapeHtml(item.id)}">Excluir</button></div></article>`;
  }).join("")}</div>`;
}

function trackingForm(data: AdminData): string {
  const item = data.tracking;
  return `<section class="panel"><div class="panel-heading"><h2>Configurações públicas</h2></div><form class="form-grid" data-form="tracking">${input("meta_pixel_id", "Meta Pixel ID", item.meta_pixel_id)}${input("ga4_measurement_id", "GA4 Measurement ID", item.ga4_measurement_id)}${input("google_ads_conversion_id", "Google Ads Conversion ID", item.google_ads_conversion_id)}${input("google_ads_conversion_label", "Google Ads Conversion Label", item.google_ads_conversion_label)}<div class="field">${checkbox("meta_browser_enabled", "Meta no navegador", item.meta_browser_enabled)}${checkbox("meta_server_enabled", "Meta CAPI", item.meta_server_enabled)}</div><div class="field">${checkbox("ga4_browser_enabled", "GA4 no navegador", item.ga4_browser_enabled)}${checkbox("ga4_server_enabled", "GA4 no servidor", item.ga4_server_enabled)}</div><div class="field">${checkbox("google_ads_browser_enabled", "Google Ads no navegador", item.google_ads_browser_enabled)}${checkbox("google_ads_server_enabled", "Google Ads no servidor", item.google_ads_server_enabled)}</div><div class="form-actions"><button class="button button-primary" type="submit">Salvar rastreamento</button></div></form></section><section class="panel"><div class="panel-heading"><h2>Credenciais protegidas</h2></div><p>Os valores abaixo são criptografados pela função de servidor e nunca retornam ao navegador.</p><form class="form-grid" data-form="tracking-secrets">${input("metaAccessToken", "Token da Meta CAPI", "", { type: "password", full: true })}${input("metaApiVersion", "Versão da API Meta", "v23.0")}${input("ga4ApiSecret", "GA4 API Secret", "", { type: "password" })}${input("googleDataManagerEndpoint", "Endpoint Google Data Manager", "", { full: true })}${input("googleOAuthAccessToken", "OAuth token do Google", "", { type: "password", full: true })}${input("googleOperatingAccountId", "Conta operacional Google Ads", "")}${input("googleLoginAccountId", "Conta de login Google Ads", "")}${input("googleConversionActionId", "Ação de conversão", "")}<div class="form-actions"><button class="button button-primary" type="submit">Salvar credenciais</button></div></form></section>`;
}

function mediaView(data: AdminData): string {
  return `<section class="panel"><div class="panel-heading"><h2>Enviar imagem</h2></div><form class="form-grid" data-form="media"><div class="field field-full"><label for="media-file">Arquivo</label><input id="media-file" name="file" type="file" accept="image/*" required></div>${input("category", "Categoria", "general")}${input("alt_text", "Texto alternativo", "")}<div class="form-actions"><button class="button button-primary" type="submit">Enviar imagem</button></div></form></section><section class="panel"><div class="panel-heading"><h2>Biblioteca</h2></div><div class="media-grid">${data.media.map((item) => `<article class="media-card"><img src="${escapeHtml(item.public_url)}" alt="${escapeHtml(item.alt_text)}"><div><strong>${escapeHtml(item.file_name)}</strong><span>${escapeHtml(item.public_url)}</span></div></article>`).join("")}</div></section>`;
}

function tabContent(state: AdminViewState): string {
  const data = state.data;
  if (state.tab === "dashboard") return dashboard(data);
  if (state.tab === "settings") return settingsForm(data);
  if (state.tab === "content") return contentForms(data);
  if (state.tab === "procedures") return procedureForm(data.procedures.find((item) => item.id === state.editingId)) + `<section class="panel"><div class="panel-heading"><h2>Procedimentos cadastrados</h2></div>${dataRows(data.procedures, "procedure")}</section>`;
  if (state.tab === "results") return resultForm(data.results.find((item) => item.id === state.editingId)) + `<section class="panel"><div class="panel-heading"><h2>Resultados cadastrados</h2></div>${dataRows(data.results, "result")}</section>`;
  if (state.tab === "testimonials") return testimonialForm(data.testimonials.find((item) => item.id === state.editingId)) + `<section class="panel"><div class="panel-heading"><h2>Depoimentos cadastrados</h2></div>${dataRows(data.testimonials, "testimonial")}</section>`;
  if (state.tab === "faq") return faqForm(data.faq.find((item) => item.id === state.editingId)) + `<section class="panel"><div class="panel-heading"><h2>Perguntas cadastradas</h2></div>${dataRows(data.faq, "faq")}</section>`;
  if (state.tab === "tracking") return trackingForm(data);
  return mediaView(data);
}

export function renderAdmin(state: AdminViewState): string {
  return `<div class="admin-layout"><aside class="admin-sidebar"><div class="admin-logo">CQ · Painel</div><nav class="admin-nav" aria-label="Seções do painel">${navigation(state.tab)}</nav><div class="admin-sidebar-footer"><a class="button button-light button-small" href="/" target="_blank" rel="noopener">Abrir site</a><button class="button button-outline button-small" type="button" data-sign-out>Sair</button></div></aside><main class="admin-main"><header class="admin-header"><div><h1>${escapeHtml(state.membership.site.name)}</h1><p>Perfil: ${escapeHtml(state.membership.role)}</p></div></header>${state.message ? `<div class="status-message${state.isError ? " is-error" : ""}">${escapeHtml(state.message)}</div>` : ""}${tabContent(state)}</main></div>`;
}
