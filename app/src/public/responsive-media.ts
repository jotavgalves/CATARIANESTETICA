import type { PublicSitePayload } from "../lib/types";

function validMediaUrl(value: unknown): string {
  const candidate = String(value ?? "").trim();
  return /^(https?:\/\/|\/)/i.test(candidate) ? candidate : "";
}

export function initializeResponsiveMedia(data: PublicSitePayload): () => void {
  const heroImage = document.querySelector<HTMLImageElement>(".hero-media");
  if (!heroImage) return () => undefined;

  const desktopUrl = validMediaUrl(data.settings.hero.image_url);
  const mobileUrl = validMediaUrl(data.settings.hero.mobile_image_url) || desktopUrl;
  const mediaQuery = window.matchMedia("(max-width: 700px)");

  const apply = (): void => {
    const nextUrl = mediaQuery.matches ? mobileUrl : desktopUrl;
    if (nextUrl && heroImage.src !== new URL(nextUrl, window.location.href).href) heroImage.src = nextUrl;
  };

  apply();
  mediaQuery.addEventListener("change", apply);
  return () => mediaQuery.removeEventListener("change", apply);
}
