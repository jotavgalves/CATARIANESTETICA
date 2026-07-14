import type { PublicSitePayload, SectionRecord } from "../lib/types";

const esc = (value: unknown): string => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const url = (value: unknown): string => {
  const candidate = String(value ?? "");
  return /^(https?:\/\/|\/)/i.test(candidate) ? esc(candidate) : "";
};

const getSection = (sections: SectionRecord[], key: string): SectionRecord | undefined => sections.find((item) => item.section_key === key);
const arrayContent = (item: SectionRecord | undefined, key: string): Array<Record<string, unknown>> => {
  const value = item?.content[key];
  return Array.isArray(value) ? value.filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === "object")) : [];
};

function whatsapp(number: string, message: string): string {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

function infoIcon(kind: "pin" | "clock" | "shield"): string {
  const body = {
    pin: '<path d="M12 21s6.4-5.7 6.4-11.5a6.4 6.4 0 1 0-12.8 0C5.6 15.3 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.2"/>',
    clock: '<circle cx="12" cy="12" r="8.7"/><path d="M12 7.4v5l3.2 2"/>',
    shield: '<path d="M12 3.4 18.8 6v5.2c0 4.4-2.8 7.8-6.8 9.4-4-1.6-6.8-5-6.8-9.4V6L12 3.4Z"/><path d="m8.8 11.8 2.1 2.1 4.5-4.6"/>',
  }[kind];
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

export function applyDocumentMetadata(data: PublicSitePayload): void {
  document.title = data.settings.seo_title || data.site.name;
  const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (description) description.content = data.settings.seo_description;
  const map: Record<string, string> = { brand: "--color-brand", brand_dark: "--color-brand-dark", paper: "--color-paper", ink: "--color-ink" };
  for (const [key, property] of Object.entries(map)) {
    const value = data.settings.theme[key];
    if (typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)) document.documentElement.style.setProperty(property, value);
  }
  if (data.settings.favicon_url) {
    const link = document.createElement("link");
    link.rel = "icon";
    link.href = data.settings.favicon_url;
    document.head.append(link);
  }
}

export function renderPublicSite(data: PublicSitePayload): string {
  const settings = data.settings;
  const hero = settings.hero;
  const sections = data.sections;
  const needs = getSection(sections, "needs");
  const procedureSection = getSection(sections, "procedures");
  const process = getSection(sections, "process");
  const about = getSection(sections, "about");
  const results = getSection(sections, "results");
  const faq = getSection(sections, "faq");
  const location = getSection(sections, "location");
  const city = [settings.city, settings.state].filter(Boolean).join(" — ");
  const defaultMessage = "Olá, gostaria de agendar uma avaliação estética.";
  const whatsappUrl = whatsapp(settings.whatsapp, defaultMessage);
  const navigation = sections.filter((item) => item.is_enabled).map((item) => `<a href="#${esc(item.section_key)}">${esc(item.eyebrow || item.title)}</a>`).join("");
  const aboutImage = url(about?.content.image_url);
  const processImage = url(process?.content.image_url) || "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1400&q=85";
  const processSecondary = url(process?.content.secondary_image_url) || "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=85";

  const procedureCards = data.procedures.map((item) => `
    <article class="procedure-card">
      <div class="procedure-image"><img src="${url(item.image_url)}" alt="${esc(item.name)}" loading="lazy"><span class="card-tag">${esc(item.category)}</span></div>
      <div class="procedure-body"><h3>${esc(item.name)}</h3><p>${esc(item.short_description)}</p><a class="text-link" href="${whatsapp(settings.whatsapp, item.whatsapp_message || `Olá, tenho interesse em ${item.name}.`)}" target="_blank" rel="noopener" data-track="click_whatsapp" data-placement="procedure" data-procedure-id="${esc(item.id)}" data-procedure-name="${esc(item.name)}">Tenho interesse →</a></div>
    </article>`).join("");

  const resultCards = data.results.map((item) => `
    <article class="case-card" data-result-id="${esc(item.id)}">
      <div class="case-visual">
        <figure class="case-image"><img src="${url(item.before_image_url)}" alt="Antes do tratamento" loading="lazy"><figcaption class="case-badge">Antes</figcaption></figure>
        <figure class="case-image"><img src="${url(item.after_image_url)}" alt="Depois do tratamento" loading="lazy"><figcaption class="case-badge">Depois</figcaption></figure>
      </div>
      <div class="case-content"><div><p class="eyebrow">${esc(item.procedure_name || item.body_area)}</p><h3>${esc(item.title)}</h3><p>${esc(item.summary)}</p></div>${item.testimonial_text ? `<blockquote class="case-quote">“${esc(item.testimonial_text)}”${item.client_display_name ? `<footer>${esc(item.client_display_name)}</footer>` : ""}</blockquote>` : ""}</div>
    </article>`).join("");

  const testimonialCards = data.testimonials.map((item) => `
    <article class="testimonial-card"><div class="stars" aria-label="${item.rating} estrelas">${"★".repeat(item.rating)}</div><blockquote>“${esc(item.testimonial_text)}”</blockquote><div class="testimonial-person">${item.photo_url ? `<img src="${url(item.photo_url)}" alt="" loading="lazy">` : ""}<div><strong>${esc(item.client_display_name)}</strong><span>${esc(item.procedure_name || item.source_name)}</span></div></div></article>`).join("");

  return `
    <header class="site-header" data-header><div class="container nav-shell"><a class="brand" href="#inicio" aria-label="${esc(data.site.name)}">${settings.logo_url ? `<img class="brand-mark" src="${url(settings.logo_url)}" alt="">` : '<span class="brand-mark">CQ</span>'}<span class="brand-copy"><strong>${esc(settings.professional_name)}</strong><span>Clínica Estética</span></span></a><nav class="nav-links" data-nav aria-label="Navegação principal">${navigation}<a class="button button-primary" href="${whatsappUrl}" target="_blank" rel="noopener" data-track="click_whatsapp" data-placement="header">Agendar avaliação</a></nav><button class="menu-button" type="button" data-menu aria-label="Abrir menu" aria-expanded="false"><span></span><span></span><span></span></button></div></header>
    <main id="main">
      <section class="hero" id="inicio"><img class="hero-media" src="${url(hero.image_url)}" alt="Atendimento estético em ambiente profissional"><div class="hero-overlay"></div><div class="container hero-content"><p class="eyebrow">${esc(hero.eyebrow)}</p><h1>${esc(hero.title)}</h1><p class="lead">${esc(hero.subtitle)}</p><div class="hero-actions"><a class="button button-light" href="${whatsappUrl}" target="_blank" rel="noopener" data-track="click_whatsapp" data-placement="hero">${esc(hero.primary_cta || "Agendar pelo WhatsApp")}</a><a class="button button-outline" href="#procedures">${esc(hero.secondary_cta || "Conhecer os procedimentos")}</a></div><div class="hero-trust"><span>Atendimento com hora marcada</span><span>Avaliação antes da indicação</span><span>${esc(city)}</span></div></div></section>
      <aside class="info-strip" aria-label="Informações principais"><div class="container info-grid"><div class="info-item"><span class="info-icon">${infoIcon("pin")}</span><span class="info-copy"><strong>Boa Viagem</strong><span>${esc(settings.address_line)}</span></span></div><div class="info-item"><span class="info-icon">${infoIcon("clock")}</span><span class="info-copy"><strong>Hora marcada</strong><span>${esc(settings.opening_hours)}</span></span></div><div class="info-item"><span class="info-icon">${infoIcon("shield")}</span><span class="info-copy"><strong>Indicação responsável</strong><span>O protocolo é definido após avaliação individual</span></span></div></div></aside>
      ${needs ? `<section class="section" id="needs"><div class="container two-column"><div class="sticky-copy"><p class="eyebrow">${esc(needs.eyebrow)}</p><h2>${esc(needs.title)}</h2><p class="lead">${esc(needs.subtitle)}</p></div><div class="need-list">${arrayContent(needs, "items").map((item, index) => `<article class="need-card"><span class="need-number">${String(index + 1).padStart(2, "0")}</span><div><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p></div></article>`).join("")}</div></div></section>` : ""}
      <section class="section section-soft" id="procedures"><div class="container"><div class="section-heading"><p class="eyebrow">${esc(procedureSection?.eyebrow || "Procedimentos")}</p><h2>${esc(procedureSection?.title)}</h2><p class="lead">${esc(procedureSection?.subtitle)}</p></div><div class="card-grid">${procedureCards}</div></div></section>
      ${process ? `<section class="section" id="process"><div class="container process-grid"><div class="process-media"><img src="${processImage}" alt="Atendimento estético" loading="lazy"><img src="${processSecondary}" alt="Ambiente da clínica" loading="lazy"></div><div><p class="eyebrow">${esc(process.eyebrow)}</p><h2>${esc(process.title)}</h2><p class="lead">${esc(process.subtitle)}</p><div class="step-list">${arrayContent(process, "steps").map((item, index) => `<div class="step-item"><span class="step-number">${index + 1}</span><div><strong>${esc(item.title)}</strong><p>${esc(item.text)}</p></div></div>`).join("")}</div></div></div></section>` : ""}
      ${about ? `<section class="section section-dark" id="about"><div class="container about-grid"><div class="about-photo"><img src="${aboutImage}" alt="${esc(settings.professional_name)}" loading="lazy"></div><div><p class="eyebrow">${esc(about.eyebrow)}</p><h2>${esc(about.title)}</h2><p class="lead">${esc(about.subtitle)}</p><p class="about-body">${esc(about.content.body)}</p><div class="credentials"><div class="credential"><strong>Formação</strong><span>${esc(settings.professional_title)}</span></div><div class="credential"><strong>Atuação</strong><span>Tratamentos faciais e corporais</span></div><div class="credential"><strong>Atendimento</strong><span>${esc(city)}</span></div></div><a class="button button-light" href="${whatsappUrl}" target="_blank" rel="noopener" data-track="click_whatsapp" data-placement="about">Conversar com a clínica</a></div></div></section>` : ""}
      ${data.results.length > 0 ? `<section class="section section-soft" id="results"><div class="container"><div class="section-heading"><p class="eyebrow">${esc(results?.eyebrow)}</p><h2>${esc(results?.title)}</h2><p class="lead">${esc(results?.subtitle)}</p></div><div class="case-list">${resultCards}</div></div></section>` : ""}
      ${data.testimonials.length > 0 ? `<section class="section" id="testimonials"><div class="container"><div class="section-heading"><p class="eyebrow">Experiências</p><h2>Relatos de atendimento</h2></div><div class="testimonial-grid">${testimonialCards}</div></div></section>` : ""}
      <section class="section" id="faq"><div class="container faq-layout"><div class="sticky-copy"><p class="eyebrow">${esc(faq?.eyebrow)}</p><h2>${esc(faq?.title)}</h2><p class="lead">${esc(faq?.subtitle)}</p></div><div class="faq-list">${data.faq.map((item, index) => `<article class="faq-item${index === 0 ? " is-open" : ""}"><button class="faq-question" type="button" aria-expanded="${index === 0 ? "true" : "false"}"><span>${esc(item.question)}</span><span class="faq-toggle">+</span></button><div class="faq-answer"><p>${esc(item.answer)}</p></div></article>`).join("")}</div></div></section>
      <section class="section" id="location"><div class="container"><div class="location-card"><div class="location-copy"><p class="eyebrow">${esc(location?.eyebrow)}</p><h2>${esc(location?.title)}</h2><div class="location-list"><p><strong>Endereço:</strong> ${esc(settings.address_line)}, ${esc(city)}</p><p><strong>Atendimento:</strong> ${esc(settings.opening_hours)}</p><p><strong>Contato:</strong> ${esc(settings.phone)}</p></div><div class="hero-actions"><a class="button button-light" href="${whatsappUrl}" target="_blank" rel="noopener" data-track="click_whatsapp" data-placement="location">Agendar atendimento</a><a class="button button-outline button-on-dark" href="${url(settings.maps_url)}" target="_blank" rel="noopener" data-track="click_map">Traçar rota</a></div></div><div class="location-media"><img src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1400&q=85" alt="Interior de uma clínica" loading="lazy"></div></div></div></section>
    </main>
    <footer class="site-footer"><div class="container"><div class="footer-grid"><div><a class="brand" href="#inicio"><span class="brand-mark">CQ</span><span class="brand-copy"><strong>${esc(settings.professional_name)}</strong><span>Clínica Estética</span></span></a><p>${esc(settings.seo_description)}</p></div><div class="footer-links"><strong>Navegação</strong>${navigation}</div><div class="footer-links"><strong>Contato</strong><a href="tel:${esc(settings.phone.replace(/\D/g, ""))}" data-track="click_phone">${esc(settings.phone)}</a><a href="${whatsappUrl}" target="_blank" rel="noopener" data-track="click_whatsapp" data-placement="footer">WhatsApp</a><span>${esc(settings.address_line)}</span></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} ${esc(data.site.name)}</span><span>${esc(settings.footer_text)}</span></div></div></footer>`;
}
