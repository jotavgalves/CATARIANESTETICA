import { getSiteIdentifier } from "../lib/config";
import { supabase } from "../lib/supabase";
import type { ConsentState, PublicSitePayload } from "../lib/types";
import { AnalyticsService } from "./analytics";
import { readConsent, renderConsentBanner } from "./consent";
import { initializeFavicons } from "./favicon-assets";
import { initializeMobileNavigation } from "./mobile-navigation";
import { applyDocumentMetadata, renderPublicSite } from "./render";
import { initializeResponsiveMedia } from "./responsive-media";

declare global {
  interface Window { __cqPublicAppInitialized?: boolean; }
}

const defaultConsent: ConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
  updatedAt: new Date().toISOString(),
};

async function loadSite(identifier: string): Promise<PublicSitePayload> {
  const { data, error } = await supabase.rpc("cq_get_public_site", { p_identifier: identifier });
  if (error) throw error;
  if (!data) throw new Error("Site não encontrado para este domínio.");
  return data as PublicSitePayload;
}

function initializeBrandLogos(): void {
  document.querySelectorAll<HTMLImageElement>("[data-logo-image]").forEach((image) => {
    const visual = image.closest<HTMLElement>(".brand-visual");
    const showLogo = (): void => {
      image.hidden = false;
      visual?.classList.add("has-logo");
    };
    const showFallback = (): void => {
      image.hidden = true;
      visual?.classList.remove("has-logo");
    };

    image.addEventListener("load", showLogo, { once: true });
    image.addEventListener("error", showFallback, { once: true });

    if (image.complete) {
      if (image.naturalWidth > 0) showLogo();
      else showFallback();
    }
  });
}

function initializeInteractions(analytics: AnalyticsService): void {
  const header = document.querySelector<HTMLElement>("[data-header]");
  window.addEventListener("scroll", () => header?.classList.toggle("is-scrolled", window.scrollY > 20), { passive: true });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const faqButton = target.closest<HTMLButtonElement>(".faq-question");
    if (faqButton) {
      const item = faqButton.closest<HTMLElement>(".faq-item");
      const wasOpen = item?.classList.contains("is-open") ?? false;
      document.querySelectorAll<HTMLElement>(".faq-item").forEach((current) => {
        current.classList.remove("is-open");
        current.querySelector<HTMLButtonElement>(".faq-question")?.setAttribute("aria-expanded", "false");
      });
      if (item && !wasOpen) {
        item.classList.add("is-open");
        faqButton.setAttribute("aria-expanded", "true");
      }
    }

    const tracked = target.closest<HTMLElement>("[data-track]");
    const eventName = tracked?.dataset.track;
    if (eventName && tracked) {
      const context: Record<string, string> = {};
      if (tracked.dataset.placement) context.placement = tracked.dataset.placement;
      if (tracked.dataset.procedureId) context.procedureId = tracked.dataset.procedureId;
      if (tracked.dataset.procedureName) context.procedureName = tracked.dataset.procedureName;
      void analytics.track(eventName as Parameters<AnalyticsService["track"]>[0], context);
    }
  });

  const resultObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const resultId = (entry.target as HTMLElement).dataset.resultId;
      void analytics.track("view_result", resultId ? { resultId } : {});
      resultObserver.unobserve(entry.target);
    }
  }, { threshold: 0.65 });
  document.querySelectorAll<HTMLElement>("[data-result-id]").forEach((item) => resultObserver.observe(item));
}

async function start(): Promise<void> {
  if (window.__cqPublicAppInitialized) throw new Error("Public application initialized more than once.");
  window.__cqPublicAppInitialized = true;

  const siteIdentifier = getSiteIdentifier();
  const root = document.querySelector<HTMLElement>("#site-root");
  const consentRoot = document.querySelector<HTMLElement>("#consent-root");
  if (!root || !consentRoot) throw new Error("Application roots are missing.");

  try {
    const data = await loadSite(siteIdentifier);
    applyDocumentMetadata(data);
    initializeFavicons(data);
    root.innerHTML = renderPublicSite(data);
    initializeResponsiveMedia(data);
    initializeBrandLogos();
    initializeMobileNavigation();

    const analytics = new AnalyticsService(siteIdentifier, data.tracking, readConsent() ?? defaultConsent);
    await analytics.initialize();
    initializeInteractions(analytics);

    const consent = readConsent();
    if (consent) void analytics.track("page_view");
    else renderConsentBanner(consentRoot, (nextConsent) => {
      void analytics.updateConsent(nextConsent).then(() => analytics.track("page_view"));
    });
  } catch (error) {
    root.innerHTML = `<main class="error-state"><div><h1>Não foi possível carregar o site.</h1><p>${error instanceof Error ? error.message : "Não foi possível concluir o carregamento."}</p></div></main>`;
  }
}

void start();
