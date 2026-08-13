import type { PublicSitePayload } from "../lib/types";

export interface SeoSnapshot {
  canonicalUrl: string;
  canonicalHost: string;
  siteName: string;
  title: string;
  description: string;
  imageUrl: string;
  robots: string;
  verificationToken: string;
  structuredData: Record<string, unknown>;
}

function safeHttpUrl(value: unknown): string {
  const candidate = String(value ?? "").trim();
  if (!candidate) return "";
  try {
    const parsed = new URL(/^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function originFrom(value: unknown): string {
  const parsed = safeHttpUrl(value);
  if (!parsed) return "";
  return new URL(parsed).origin;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildStructuredData(data: PublicSitePayload, canonicalUrl: string): Record<string, unknown> {
  const settings = data.settings;
  const heroImage = safeHttpUrl(settings.hero.image_url);
  const logo = safeHttpUrl(settings.logo_url);
  const instagram = safeHttpUrl(settings.instagram_url);
  const map = safeHttpUrl(settings.maps_url);
  const businessId = `${canonicalUrl}#business`;
  const websiteId = `${canonicalUrl}#website`;
  const webpageId = `${canonicalUrl}#webpage`;

  const business: Record<string, unknown> = {
    "@type": ["BeautySalon", "LocalBusiness"],
    "@id": businessId,
    name: data.site.name || settings.professional_name,
    alternateName: settings.professional_name,
    url: canonicalUrl,
    description: settings.seo_description,
    telephone: settings.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address_line,
      addressLocality: settings.city,
      addressRegion: settings.state,
      addressCountry: "BR",
    },
    areaServed: {
      "@type": "City",
      name: settings.city,
    },
  };

  if (settings.email) business.email = settings.email;
  if (logo) business.logo = logo;
  if (heroImage) business.image = [heroImage];
  if (instagram) business.sameAs = [instagram];
  if (map) business.hasMap = map;
  if (data.procedures.length > 0) {
    business.hasOfferCatalog = {
      "@type": "OfferCatalog",
      name: "Procedimentos",
      itemListElement: data.procedures.map((procedure) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: procedure.name,
          description: procedure.short_description,
          serviceType: procedure.category,
          provider: { "@id": businessId },
        },
      })),
    };
  }

  const website: Record<string, unknown> = {
    "@type": "WebSite",
    "@id": websiteId,
    url: canonicalUrl,
    name: data.site.name,
    inLanguage: "pt-BR",
    publisher: { "@id": businessId },
  };

  const webpage: Record<string, unknown> = {
    "@type": "WebPage",
    "@id": webpageId,
    url: canonicalUrl,
    name: settings.seo_title || data.site.name,
    description: settings.seo_description,
    inLanguage: "pt-BR",
    isPartOf: { "@id": websiteId },
    about: { "@id": businessId },
  };
  if (heroImage) webpage.primaryImageOfPage = { "@type": "ImageObject", url: heroImage };

  return {
    "@context": "https://schema.org",
    "@graph": [business, website, webpage],
  };
}

export function buildSeoSnapshot(
  data: PublicSitePayload,
  currentOrigin: string,
  verificationToken = "",
): SeoSnapshot {
  const currentOriginNormalized = originFrom(currentOrigin);
  const canonicalOrigin = originFrom(data.site.default_domain) || currentOriginNormalized || "https://dracatarinaqueiroz.pages.dev";
  const canonicalUrl = `${canonicalOrigin}/`;
  const canonicalHost = new URL(canonicalUrl).hostname.toLowerCase();
  const currentHost = currentOriginNormalized ? new URL(currentOriginNormalized).hostname.toLowerCase() : canonicalHost;
  const isPrimaryHost = currentHost === canonicalHost;
  const siteName = String(data.site.name || data.settings.professional_name).trim();
  const title = String(data.settings.seo_title || siteName).trim();
  const description = String(data.settings.seo_description || "").trim();
  const imageUrl = safeHttpUrl(data.settings.hero.image_url);

  return {
    canonicalUrl,
    canonicalHost,
    siteName,
    title,
    description,
    imageUrl,
    robots: isPrimaryHost
      ? "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
      : "noindex,follow",
    verificationToken: verificationToken.trim(),
    structuredData: buildStructuredData(data, canonicalUrl),
  };
}

export function serializeStructuredData(value: Record<string, unknown>): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

export function renderSeoHead(snapshot: SeoSnapshot): string {
  const tags = [
    `<title>${escapeHtml(snapshot.title)}</title>`,
    `<meta name="description" content="${escapeHtml(snapshot.description)}">`,
    `<meta name="robots" content="${escapeHtml(snapshot.robots)}">`,
    `<meta name="googlebot" content="${escapeHtml(snapshot.robots)}">`,
    `<link rel="canonical" href="${escapeHtml(snapshot.canonicalUrl)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:locale" content="pt_BR">`,
    `<meta property="og:site_name" content="${escapeHtml(snapshot.siteName)}">`,
    `<meta property="og:title" content="${escapeHtml(snapshot.title)}">`,
    `<meta property="og:description" content="${escapeHtml(snapshot.description)}">`,
    `<meta property="og:url" content="${escapeHtml(snapshot.canonicalUrl)}">`,
    `<meta name="twitter:card" content="${snapshot.imageUrl ? "summary_large_image" : "summary"}">`,
    `<meta name="twitter:title" content="${escapeHtml(snapshot.title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(snapshot.description)}">`,
  ];
  if (snapshot.imageUrl) {
    tags.push(`<meta property="og:image" content="${escapeHtml(snapshot.imageUrl)}">`);
    tags.push(`<meta property="og:image:alt" content="${escapeHtml(snapshot.title)}">`);
    tags.push(`<meta name="twitter:image" content="${escapeHtml(snapshot.imageUrl)}">`);
  }
  if (snapshot.verificationToken) {
    tags.push(`<meta name="google-site-verification" content="${escapeHtml(snapshot.verificationToken)}">`);
  }
  tags.push(`<script type="application/ld+json" data-cq-structured-data>${serializeStructuredData(snapshot.structuredData)}</script>`);
  return tags.join("\n  ");
}

function upsertMeta(selector: string, attribute: "name" | "property", key: string, content: string): void {
  let meta = document.head.querySelector<HTMLMetaElement>(selector);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attribute, key);
    document.head.append(meta);
  }
  meta.content = content;
}

function upsertCanonical(href: string): void {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.append(link);
  }
  link.href = href;
}

export function initializeSeo(data: PublicSitePayload): void {
  const verificationToken = String(import.meta.env.VITE_GOOGLE_SITE_VERIFICATION ?? "");
  const snapshot = buildSeoSnapshot(data, window.location.origin, verificationToken);

  document.title = snapshot.title;
  upsertMeta('meta[name="description"]', "name", "description", snapshot.description);
  upsertMeta('meta[name="robots"]', "name", "robots", snapshot.robots);
  upsertMeta('meta[name="googlebot"]', "name", "googlebot", snapshot.robots);
  upsertMeta('meta[property="og:type"]', "property", "og:type", "website");
  upsertMeta('meta[property="og:locale"]', "property", "og:locale", "pt_BR");
  upsertMeta('meta[property="og:site_name"]', "property", "og:site_name", snapshot.siteName);
  upsertMeta('meta[property="og:title"]', "property", "og:title", snapshot.title);
  upsertMeta('meta[property="og:description"]', "property", "og:description", snapshot.description);
  upsertMeta('meta[property="og:url"]', "property", "og:url", snapshot.canonicalUrl);
  upsertMeta('meta[name="twitter:card"]', "name", "twitter:card", snapshot.imageUrl ? "summary_large_image" : "summary");
  upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", snapshot.title);
  upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", snapshot.description);
  if (snapshot.imageUrl) {
    upsertMeta('meta[property="og:image"]', "property", "og:image", snapshot.imageUrl);
    upsertMeta('meta[property="og:image:alt"]', "property", "og:image:alt", snapshot.title);
    upsertMeta('meta[name="twitter:image"]', "name", "twitter:image", snapshot.imageUrl);
  }
  if (snapshot.verificationToken) {
    upsertMeta('meta[name="google-site-verification"]', "name", "google-site-verification", snapshot.verificationToken);
  }
  upsertCanonical(snapshot.canonicalUrl);

  document.head.querySelectorAll<HTMLScriptElement>('script[data-cq-structured-data]').forEach((script) => script.remove());
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.dataset.cqStructuredData = "true";
  script.textContent = JSON.stringify(snapshot.structuredData);
  document.head.append(script);
}
