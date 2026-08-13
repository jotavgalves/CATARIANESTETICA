import type { PublicSitePayload } from "../lib/types";

function safeHttpUrl(value: unknown): string {
  const candidate = String(value ?? "").trim();
  if (!candidate) return "";
  try {
    const parsed = new URL(candidate.startsWith("http") ? candidate : `https://${candidate}`);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : "";
  } catch {
    return "";
  }
}

function canonicalUrl(data: PublicSitePayload): string {
  const configured = safeHttpUrl(data.site.default_domain);
  const origin = configured ? new URL(configured).origin : window.location.origin;
  return `${origin}/`;
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

function setStructuredData(data: PublicSitePayload, canonical: string): void {
  document.head.querySelectorAll<HTMLScriptElement>('script[data-cq-structured-data]').forEach((item) => item.remove());

  const settings = data.settings;
  const heroImage = safeHttpUrl(settings.hero.image_url);
  const logo = safeHttpUrl(settings.logo_url);
  const instagram = safeHttpUrl(settings.instagram_url);

  const structuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: data.site.name || settings.professional_name,
    url: canonical,
    description: settings.seo_description,
    telephone: settings.phone,
    email: settings.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address_line,
      addressLocality: settings.city,
      addressRegion: settings.state,
      addressCountry: "BR",
    },
  };

  if (logo) structuredData.logo = logo;
  if (heroImage) structuredData.image = heroImage;
  if (instagram) structuredData.sameAs = [instagram];

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.dataset.cqStructuredData = "local-business";
  script.textContent = JSON.stringify(structuredData);
  document.head.append(script);
}

export function initializeSeo(data: PublicSitePayload): void {
  const settings = data.settings;
  const canonical = canonicalUrl(data);
  const title = settings.seo_title || data.site.name;
  const description = settings.seo_description || "Clínica de estética facial e corporal em Recife.";
  const heroImage = safeHttpUrl(settings.hero.image_url);

  upsertCanonical(canonical);
  upsertMeta('meta[name="robots"]', "name", "robots", "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1");
  upsertMeta('meta[name="googlebot"]', "name", "googlebot", "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1");
  upsertMeta('meta[property="og:type"]', "property", "og:type", "website");
  upsertMeta('meta[property="og:locale"]', "property", "og:locale", "pt_BR");
  upsertMeta('meta[property="og:title"]', "property", "og:title", title);
  upsertMeta('meta[property="og:description"]', "property", "og:description", description);
  upsertMeta('meta[property="og:url"]', "property", "og:url", canonical);
  if (heroImage) upsertMeta('meta[property="og:image"]', "property", "og:image", heroImage);
  upsertMeta('meta[name="twitter:card"]', "name", "twitter:card", heroImage ? "summary_large_image" : "summary");
  upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
  upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
  if (heroImage) upsertMeta('meta[name="twitter:image"]', "name", "twitter:image", heroImage);

  setStructuredData(data, canonical);
}
