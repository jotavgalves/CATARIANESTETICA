import type { AnalyticsEventName, ConsentState, TrackingConfig } from "../lib/types";

type MetaFbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: MetaFbq;
  loaded: boolean;
  version: string;
};

interface AnalyticsWindow extends Window {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  fbq?: MetaFbq;
  _fbq?: MetaFbq;
  __cqAnalyticsInitialized?: boolean;
  __cqMetaLoaded?: boolean;
  __cqMetaPageViewSent?: boolean;
  __cqGooglePrepared?: boolean;
}

interface TrackContext {
  placement?: string;
  procedureId?: string;
  procedureName?: string;
  value?: number;
  currency?: string;
  [key: string]: string | number | boolean | undefined;
}

const validMeta = (value: string): boolean => /^\d{5,25}$/.test(String(value || "").trim());
const validGA = (value: string): boolean => /^G-[A-Z0-9]+$/i.test(String(value || "").trim());
const validAW = (value: string): boolean => /^AW-\d+$/i.test(String(value || "").trim());

function metaEventName(eventName: AnalyticsEventName): string {
  const names: Partial<Record<AnalyticsEventName, string>> = {
    page_view: "PageView",
    view_procedure: "ViewContent",
    click_whatsapp: "Contact",
    start_contact: "Contact",
    submit_lead: "Lead",
    schedule_requested: "Schedule",
    appointment_confirmed: "Schedule",
  };
  return names[eventName] ?? eventName;
}

function ensureDataLayer(): AnalyticsWindow {
  const analyticsWindow = window as AnalyticsWindow;
  analyticsWindow.dataLayer ??= [];
  analyticsWindow.gtag ??= (...args: unknown[]) => { analyticsWindow.dataLayer?.push(args); };
  return analyticsWindow;
}

export class AnalyticsService {
  readonly #tracking: TrackingConfig;
  #consent: ConsentState;

  constructor(_siteIdentifier: string, tracking: TrackingConfig, consent: ConsentState) {
    this.#tracking = tracking;
    this.#consent = consent;
  }

  async initialize(): Promise<void> {
    const analyticsWindow = window as AnalyticsWindow;
    if (analyticsWindow.__cqAnalyticsInitialized) return;
    analyticsWindow.__cqAnalyticsInitialized = true;
    this.#initializeProviders();
  }

  async updateConsent(consent: ConsentState): Promise<void> {
    this.#consent = consent;
    this.#initializeProviders();
  }

  #initializeProviders(): void {
    if (this.#consent.marketing && this.#tracking.meta_browser_enabled && validMeta(this.#tracking.meta_pixel_id)) {
      this.#initializeMetaExactlyLikeLyzandra();
    }
    if ((this.#consent.analytics || this.#consent.marketing) && this.#hasGoogleBrowserTracking()) {
      this.#initializeGoogleLikeLyzandra();
    }
  }

  #initializeMetaExactlyLikeLyzandra(): void {
    const analyticsWindow = window as AnalyticsWindow;
    if (analyticsWindow.__cqMetaLoaded) return;

    if (!analyticsWindow.fbq) {
      let fbq: MetaFbq;
      const queue = (...args: unknown[]): void => {
        if (fbq.callMethod) fbq.callMethod(...args);
        else fbq.queue.push(args);
      };
      fbq = queue as MetaFbq;
      fbq.push = fbq;
      fbq.loaded = true;
      fbq.version = "2.0";
      fbq.queue = [];
      if (!analyticsWindow._fbq) analyticsWindow._fbq = fbq;
      analyticsWindow.fbq = fbq;

      const script = document.createElement("script");
      script.async = true;
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      script.dataset.cqMetaPixel = "1";
      const first = document.getElementsByTagName("script")[0];
      if (first?.parentNode) first.parentNode.insertBefore(script, first);
      else document.head.appendChild(script);
    }

    analyticsWindow.fbq("init", this.#tracking.meta_pixel_id.trim());
    analyticsWindow.fbq("track", "PageView");
    analyticsWindow.__cqMetaLoaded = true;
    analyticsWindow.__cqMetaPageViewSent = true;
  }

  #initializeGoogleLikeLyzandra(): void {
    const analyticsWindow = ensureDataLayer();
    if (analyticsWindow.__cqGooglePrepared) return;

    const ids: string[] = [];
    if (this.#tracking.ga4_browser_enabled && validGA(this.#tracking.ga4_measurement_id)) ids.push(this.#tracking.ga4_measurement_id.trim());
    if (this.#tracking.google_ads_browser_enabled && validAW(this.#tracking.google_ads_conversion_id)) ids.push(this.#tracking.google_ads_conversion_id.trim());
    const primaryId = ids[0];
    if (!primaryId) return;

    analyticsWindow.gtag?.("js", new Date());
    ids.forEach((id) => {
      if (id.startsWith("G-")) analyticsWindow.gtag?.("config", id, { send_page_view: false });
      else analyticsWindow.gtag?.("config", id);
    });

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(primaryId)}`;
    script.dataset.cqGoogleTag = "1";
    document.head.appendChild(script);
    analyticsWindow.__cqGooglePrepared = true;
  }

  #hasGoogleBrowserTracking(): boolean {
    return Boolean(
      (this.#tracking.ga4_browser_enabled && validGA(this.#tracking.ga4_measurement_id))
      || (this.#tracking.google_ads_browser_enabled && validAW(this.#tracking.google_ads_conversion_id)),
    );
  }

  async track(eventName: AnalyticsEventName, context: TrackContext = {}): Promise<void> {
    if (!this.#consent.analytics && !this.#consent.marketing) return;
    const analyticsWindow = window as AnalyticsWindow;

    if (this.#consent.marketing && this.#tracking.meta_browser_enabled && analyticsWindow.fbq) {
      if (!(eventName === "page_view" && analyticsWindow.__cqMetaPageViewSent)) {
        if (eventName === "click_whatsapp") {
          analyticsWindow.fbq("track", "Contact", { content_name: "WhatsApp" });
        } else {
          analyticsWindow.fbq("track", metaEventName(eventName), context);
        }
      }
    }

    if (this.#hasGoogleBrowserTracking()) {
      const current = ensureDataLayer();
      if (eventName === "click_whatsapp") {
        current.gtag?.("event", "generate_lead", { method: "whatsapp" });
      } else {
        current.gtag?.("event", eventName, context);
      }

      if (
        this.#consent.marketing
        && this.#tracking.google_ads_browser_enabled
        && validAW(this.#tracking.google_ads_conversion_id)
        && this.#tracking.google_ads_conversion_label
        && ["submit_lead", "schedule_requested", "appointment_confirmed"].includes(eventName)
      ) {
        current.gtag?.("event", "conversion", {
          send_to: `${this.#tracking.google_ads_conversion_id.trim()}/${this.#tracking.google_ads_conversion_label.trim()}`,
          ...context,
        });
      }
    }
  }
}
