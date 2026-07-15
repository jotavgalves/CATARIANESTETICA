import type { PublicSitePayload } from "../lib/types";

interface FaviconLinkDefinition {
  rel: "icon" | "apple-touch-icon";
  size: string;
  slot: string;
}

const faviconLinks: FaviconLinkDefinition[] = [
  { rel: "icon", size: "32x32", slot: "favicon_32" },
  { rel: "apple-touch-icon", size: "180x180", slot: "favicon_180" },
  { rel: "icon", size: "192x192", slot: "favicon_192" },
  { rel: "icon", size: "512x512", slot: "favicon_512" },
];

function safeUrl(value: unknown): string {
  const candidate = String(value ?? "").trim();
  return /^(https?:\/\/|\/)/i.test(candidate) ? candidate : "";
}

export function initializeFavicons(data: PublicSitePayload): void {
  const assets = data.media_assets?.favicon ?? {};
  const fallback = safeUrl(data.settings.favicon_url);
  document.head.querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="apple-touch-icon"]')
    .forEach((link) => link.remove());

  let added = 0;
  for (const definition of faviconLinks) {
    const href = safeUrl(assets[definition.slot]);
    if (!href) continue;
    const link = document.createElement("link");
    link.rel = definition.rel;
    link.sizes = definition.size;
    link.href = href;
    link.type = "image/png";
    link.dataset.generatedFavicon = definition.slot;
    document.head.append(link);
    added += 1;
  }

  if (added === 0 && fallback) {
    const link = document.createElement("link");
    link.rel = "icon";
    link.href = fallback;
    link.dataset.generatedFavicon = "fallback";
    document.head.append(link);
  }
}
