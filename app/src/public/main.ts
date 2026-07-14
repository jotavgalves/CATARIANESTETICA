import { getSiteIdentifier } from "../lib/config";
import { supabase } from "../lib/supabase";
import type { ConsentState, PublicSitePayload } from "../lib/types";
import { AnalyticsService } from "./analytics";
import { readConsent, renderConsentBanner } from "./consent";
import { applyDocumentMetadata, renderPublicSite } from "./render";

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

function initializeInteractions(analytics: AnalyticsService): void {
  const header = document.querySelector<HTMLElement>("[data-header]");
  const navigation = document.querySelector<HTMLElement>("[data-nav]");
  const menuButton = document.querySelector<HTMLButtonElement>("[data-menu]");

  const closeMenu = () => {
    navigation?.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    menuButton?.setAttribute("aria-expanded", "false");
  };

  window.addEventListener("scroll", () => header?.classList.toggle("is-scrolled", window.scrollY > 20), { passive: true });
  menuButton?.addEventListener("click", () => {
    const isOpen = navigation?.classList.toggle("is-open") ?? false;
    document.body.classList.toggle("menu-open", isOpen);
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });
  navigation?.addEventListener("click", closeMenu);

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
    if (eventName) {
      void analytics.track(eventName as Parameters<AnalyticsService["track"]>[0], {
        placement: tracked.dataset.placement,
        procedureId: tracked.dataset.procedureId,
        procedureName: tracked.dataset.procedureName,
      });
    }
  });

  const resultObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const resultId = (entry.target as HTMLElement).dataset.resultId;
      void analytics.track("view_result", { resultId });
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
    root.innerHTML = renderPublicSite(data);

    const analytics = new AnalyticsService(siteIdentifier, data.tracking, readConsent() ?? defaultConsent);
    await analytics.initialize();
    initializeInteractions(analytics);

    const consent = readConsent();
    if (consent) void analytics.track("page_view");
    else renderConsentBanner(consentRoot, (nextConsent) => {
      void analytics.updateConsent(nextConsent).then(() => analytics.track("page_view"));
    });
  } catch (error) {
    root.innerHTML = `<main class="error-state"><div><h1>Não foi possível carregar o site.</h1><p>${error instanceof Error ? error.message : "Erro inesperado."}</p></div></main>`;
  }
}

void start();
