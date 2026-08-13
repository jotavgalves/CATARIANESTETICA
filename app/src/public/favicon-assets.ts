import type { PublicSitePayload } from "../lib/types";

function safeUrl(value: unknown): string {
  const candidate = String(value ?? "").trim();
  return /^(https?:\/\/|\/)/i.test(candidate) ? candidate : "";
}

export function initializeFavicons(data: PublicSitePayload): void {
  const assets = data.media_assets?.favicon ?? {};
  document.head.querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="apple-touch-icon"]')
    .forEach((link) => link.remove());

  const vectorIcon = document.createElement("link");
  vectorIcon.rel = "icon";
  vectorIcon.href = "/favicon.svg?v=3";
  vectorIcon.type = "image/svg+xml";
  vectorIcon.dataset.generatedFavicon = "vector-primary";
  document.head.append(vectorIcon);

  const appleTouch = safeUrl(assets.favicon_180);
  if (appleTouch) {
    const link = document.createElement("link");
    link.rel = "apple-touch-icon";
    link.sizes = "180x180";
    link.href = appleTouch;
    link.type = "image/png";
    link.dataset.generatedFavicon = "favicon_180";
    document.head.append(link);
  }
}
