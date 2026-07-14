import { runtimeConfig } from "../lib/config";
import { supabase } from "../lib/supabase";
import type { AnalyticsEventName, ConsentState, TrackingConfig } from "../lib/types";

interface AnalyticsWindow extends Window {
  dataLayer?: unknown[];
  fbq?: (...args: unknown[]) => void;
  _fbq?: unknown;
  __cqAnalyticsInitialized?: boolean;
}

interface TrackContext {
  placement?: string;
  procedureId?: string;
  procedureName?: string;
  value?: number;
  currency?: string;
  [key: string]: string | number | boolean | undefined;
}

const sessionKey = "cq-session-id";
const visitorKey = "cq-visitor-id";

function persistentId(key: string): string {
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const value = crypto.randomUUID();
  window.localStorage.setItem(key, value);
  return value;
}

function cookie(name: string): string {
  const match = document.cookie.split("; ").find((item) => item.startsWith(`${name}=`));
  return match?.split("=").slice(1).join("=") ?? "";
}

function loadScript(provider: string, source: string): Promise<void> {
  const existing = document.querySelector<HTMLScriptElement>(`script[data-provider="${provider}"]`);
  if (existing) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.src = source;
    script.dataset.provider = provider;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error(`Unable to load ${provider}`)), { once: true });
    document.head.append(script);
  });
}

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

export class AnalyticsService {
  readonly #siteIdentifier: string;
  readonly #tracking: TrackingConfig;
  #consent: ConsentState;

  constructor(siteIdentifier: string, tracking: TrackingConfig, consent: ConsentState) {
    this.#siteIdentifier = siteIdentifier;
    this.#tracking = tracking;
    this.#consent = consent;
  }

  async initialize(): Promise<void> {
    const analyticsWindow = window as AnalyticsWindow;
    if (analyticsWindow.__cqAnalyticsInitialized) return;
    analyticsWindow.__cqAnalyticsInitialized = true;
    await this.#initializeProviders();
  }

  async updateConsent(consent: ConsentState): Promise<void> {
    this.#consent = consent;
    await this.#initializeProviders();
  }

  async #initializeProviders(): Promise<void> {
    if (this.#consent.marketing && this.#tracking.meta_browser_enabled && this.#tracking.meta_pixel_id) {
      await this.#initializeMeta();
    }
    if ((this.#consent.analytics || this.#consent.marketing) && this.#hasGoogleBrowserTracking()) {
      await this.#initializeGoogle();
    }
  }

  async #initializeMeta(): Promise<void> {
    const analyticsWindow = window as AnalyticsWindow;
    if (!analyticsWindow.fbq) {
      const queue = (...args: unknown[]) => {
        const queued = queue as typeof queue & { queue?: unknown[][]; callMethod?: (...values: unknown[]) => void };
        if (queued.callMethod) queued.callMethod(...args);
        else (queued.queue ??= []).push(args);
      };
      analyticsWindow.fbq = queue;
      analyticsWindow._fbq = queue;
      await loadScript("meta-pixel", "https://connect.facebook.net/en_US/fbevents.js");
      analyticsWindow.fbq("init", this.#tracking.meta_pixel_id);
    }
  }

  async #initializeGoogle(): Promise<void> {
    const googleId = this.#tracking.ga4_measurement_id || this.#tracking.google_ads_conversion_id;
    if (!googleId) return;
    const analyticsWindow = window as AnalyticsWindow;
    analyticsWindow.dataLayer ??= [];
    const gtag = (...args: unknown[]) => analyticsWindow.dataLayer?.push(args);
    await loadScript("google-tag", `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleId)}`);
    gtag("js", new Date());
    if (this.#tracking.ga4_browser_enabled && this.#tracking.ga4_measurement_id) {
      gtag("config", this.#tracking.ga4_measurement_id, { send_page_view: false });
    }
    if (this.#tracking.google_ads_browser_enabled && this.#tracking.google_ads_conversion_id) {
      gtag("config", this.#tracking.google_ads_conversion_id);
    }
  }

  #hasGoogleBrowserTracking(): boolean {
    return Boolean(
      (this.#tracking.ga4_browser_enabled && this.#tracking.ga4_measurement_id)
      || (this.#tracking.google_ads_browser_enabled && this.#tracking.google_ads_conversion_id),
    );
  }

  async track(eventName: AnalyticsEventName, context: TrackContext = {}): Promise<void> {
    if (!this.#consent.analytics && !this.#consent.marketing) return;
    const eventId = crypto.randomUUID();
    const timestamp = Date.now();
    const analyticsWindow = window as AnalyticsWindow;

    if (this.#consent.marketing && this.#tracking.meta_browser_enabled && analyticsWindow.fbq) {
      analyticsWindow.fbq("track", metaEventName(eventName), context, { eventID: eventId });
    }

    if (this.#hasGoogleBrowserTracking() && analyticsWindow.dataLayer) {
      analyticsWindow.dataLayer.push(["event", eventName, { event_id: eventId, ...context }]);
      if (
        this.#consent.marketing
        && this.#tracking.google_ads_browser_enabled
        && this.#tracking.google_ads_conversion_id
        && this.#tracking.google_ads_conversion_label
        && ["submit_lead", "schedule_requested", "appointment_confirmed"].includes(eventName)
      ) {
        analyticsWindow.dataLayer.push(["event", "conversion", {
          send_to: `${this.#tracking.google_ads_conversion_id}/${this.#tracking.google_ads_conversion_label}`,
          event_id: eventId,
          ...context,
        }]);
      }
    }

    const query = new URLSearchParams(window.location.search);
    const payload = {
      eventId,
      eventName,
      timestamp,
      siteIdentifier: this.#siteIdentifier,
      pageUrl: window.location.href,
      pageTitle: document.title,
      sessionId: persistentId(sessionKey),
      visitorId: persistentId(visitorKey),
      consent: this.#consent,
      context,
      fbp: cookie("_fbp"),
      fbc: cookie("_fbc"),
      gclid: query.get("gclid") ?? window.sessionStorage.getItem("cq-gclid") ?? "",
    };

    if (payload.gclid) window.sessionStorage.setItem("cq-gclid", payload.gclid);

    const { error } = await supabase.functions.invoke(runtimeConfig.trackingFunction, { body: payload });
    if (error) window.dispatchEvent(new CustomEvent("cq:tracking-error", { detail: error.message }));
  }
}
