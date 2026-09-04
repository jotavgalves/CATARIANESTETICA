// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { AnalyticsService } from "../src/public/analytics";
import type { ConsentState, TrackingConfig } from "../src/lib/types";

const tracking = (overrides: Partial<TrackingConfig> = {}): TrackingConfig => ({
  consent_mode: "required",
  meta_pixel_id: "690363007479331",
  meta_browser_enabled: true,
  meta_server_enabled: false,
  ga4_measurement_id: "",
  ga4_browser_enabled: false,
  ga4_server_enabled: false,
  google_ads_conversion_id: "",
  google_ads_conversion_label: "",
  google_ads_browser_enabled: false,
  google_ads_server_enabled: false,
  ...overrides,
});

const consent = (marketing: boolean): ConsentState => ({
  necessary: true,
  analytics: false,
  marketing,
  updatedAt: new Date().toISOString(),
});

type TestWindow = Window & {
  fbq?: ((...args: unknown[]) => void) & { queue?: unknown[][] };
  _fbq?: unknown;
  __cqAnalyticsInitialized?: boolean;
  __cqMetaLoaded?: boolean;
  __cqMetaPageViewSent?: boolean;
  __cqGooglePrepared?: boolean;
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

function resetTracking(): void {
  const current = window as TestWindow;
  delete current.fbq;
  delete current._fbq;
  delete current.__cqAnalyticsInitialized;
  delete current.__cqMetaLoaded;
  delete current.__cqMetaPageViewSent;
  delete current.__cqGooglePrepared;
  delete current.dataLayer;
  delete current.gtag;
  document.querySelectorAll('script[data-cq-meta-pixel], script[data-cq-google-tag]').forEach((node) => node.remove());
}

afterEach(resetTracking);

describe("Meta Pixel browser tracking", () => {
  it("initializes the Meta queue immediately and queues init + PageView", async () => {
    const service = new AnalyticsService("catarina", tracking(), consent(true));
    await service.initialize();

    const current = window as TestWindow;
    expect(typeof current.fbq).toBe("function");
    expect(document.querySelector('script[src="https://connect.facebook.net/en_US/fbevents.js"]')).not.toBeNull();
    expect(current.fbq?.queue).toEqual([
      ["init", "690363007479331"],
      ["track", "PageView"],
    ]);
  });

  it("does not load Meta before marketing consent", async () => {
    const service = new AnalyticsService("catarina", tracking(), consent(false));
    await service.initialize();

    const current = window as TestWindow;
    expect(current.fbq).toBeUndefined();
    expect(document.querySelector('script[src="https://connect.facebook.net/en_US/fbevents.js"]')).toBeNull();
  });

  it("loads Meta after consent changes to marketing granted", async () => {
    const service = new AnalyticsService("catarina", tracking(), consent(false));
    await service.initialize();
    await service.updateConsent(consent(true));

    const current = window as TestWindow;
    expect(current.fbq?.queue?.[0]).toEqual(["init", "690363007479331"]);
    expect(current.fbq?.queue?.[1]).toEqual(["track", "PageView"]);
  });

  it("fires Contact for WhatsApp and does not duplicate PageView", async () => {
    const service = new AnalyticsService("catarina", tracking(), consent(true));
    await service.initialize();
    await service.track("page_view");
    await service.track("click_whatsapp", { placement: "hero" });

    const current = window as TestWindow;
    const queue = current.fbq?.queue ?? [];
    expect(queue.filter((entry) => entry[0] === "track" && entry[1] === "PageView")).toHaveLength(1);
    expect(queue).toContainEqual(["track", "Contact", { content_name: "WhatsApp" }]);
  });

  it("rejects malformed Meta Pixel IDs", async () => {
    const service = new AnalyticsService("catarina", tracking({ meta_pixel_id: "abc-123" }), consent(true));
    await service.initialize();
    expect((window as TestWindow).fbq).toBeUndefined();
  });
});
