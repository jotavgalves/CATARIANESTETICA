import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const allowedEvents = new Set([
  "page_view",
  "view_procedure",
  "view_result",
  "click_whatsapp",
  "click_phone",
  "click_instagram",
  "click_map",
  "start_contact",
  "submit_lead",
  "schedule_requested",
  "appointment_confirmed",
]);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, "Content-Type": "application/json" },
});

function decode(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function encryptionKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("TRACKING_ENCRYPTION_KEY");
  if (!secret || secret.length < 32) throw new Error("tracking encryption is not configured");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["decrypt"]);
}

async function decrypt(value: string): Promise<Record<string, string>> {
  if (!value) return {};
  const [iv, payload] = value.split(".");
  if (!iv || !payload) return {};
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: decode(iv) },
    await encryptionKey(),
    decode(payload),
  );
  return JSON.parse(new TextDecoder().decode(decrypted)) as Record<string, string>;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function metaEventName(eventName: string): string {
  const names: Record<string, string> = {
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

async function sendMeta(config: Record<string, unknown>, secrets: Record<string, string>, event: Record<string, unknown>, request: Request): Promise<string> {
  if (!config.meta_server_enabled || !config.meta_pixel_id || !secrets.metaAccessToken) return "not_configured";
  const userData: Record<string, unknown> = {
    client_ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "",
    client_user_agent: request.headers.get("user-agent") ?? "",
  };
  if (event.fbp) userData.fbp = event.fbp;
  if (event.fbc) userData.fbc = event.fbc;
  const supplied = event.userData as Record<string, string> | undefined;
  if (supplied?.email) userData.em = [await sha256(normalizeEmail(supplied.email))];
  if (supplied?.phone) userData.ph = [await sha256(normalizePhone(supplied.phone))];

  const version = secrets.metaApiVersion || "v23.0";
  const endpoint = `https://graph.facebook.com/${version}/${String(config.meta_pixel_id)}/events?access_token=${encodeURIComponent(secrets.metaAccessToken)}`;
  const apiResponse = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: [{
        event_name: metaEventName(String(event.eventName)),
        event_time: Math.floor(Number(event.timestamp) / 1000),
        event_id: event.eventId,
        action_source: "website",
        event_source_url: event.pageUrl,
        user_data: userData,
        custom_data: event.context ?? {},
      }],
    }),
  });
  if (!apiResponse.ok) throw new Error(`Meta CAPI ${apiResponse.status}: ${await apiResponse.text()}`);
  return "sent";
}

async function sendGa4(config: Record<string, unknown>, secrets: Record<string, string>, event: Record<string, unknown>): Promise<string> {
  if (!config.ga4_server_enabled || !config.ga4_measurement_id || !secrets.ga4ApiSecret) return "not_configured";
  const endpoint = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(String(config.ga4_measurement_id))}&api_secret=${encodeURIComponent(secrets.ga4ApiSecret)}`;
  const apiResponse = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: event.visitorId || event.sessionId || event.eventId,
      user_id: event.userId || undefined,
      timestamp_micros: String(Number(event.timestamp) * 1000),
      events: [{
        name: event.eventName,
        params: {
          event_id: event.eventId,
          page_location: event.pageUrl,
          page_title: event.pageTitle || "",
          session_id: event.sessionId || undefined,
          engagement_time_msec: 100,
          ...((event.context as Record<string, unknown> | undefined) ?? {}),
        },
      }],
    }),
  });
  if (!apiResponse.ok) throw new Error(`GA4 Measurement Protocol ${apiResponse.status}: ${await apiResponse.text()}`);
  return "sent";
}

async function sendGoogleAds(config: Record<string, unknown>, secrets: Record<string, string>, event: Record<string, unknown>): Promise<string> {
  if (!config.google_ads_server_enabled) return "not_configured";
  if (!secrets.googleDataManagerEndpoint || !secrets.googleOAuthAccessToken) {
    return config.ga4_server_enabled ? "routed_via_ga4" : "credentials_required";
  }

  const supplied = event.userData as Record<string, string> | undefined;
  const userIdentifiers: Array<Record<string, string>> = [];
  if (supplied?.email) userIdentifiers.push({ emailAddress: await sha256(normalizeEmail(supplied.email)) });
  if (supplied?.phone) userIdentifiers.push({ phoneNumber: await sha256(normalizePhone(supplied.phone)) });

  const apiResponse = await fetch(secrets.googleDataManagerEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secrets.googleOAuthAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      destinations: [{
        operatingAccount: { accountType: "GOOGLE_ADS", accountId: secrets.googleOperatingAccountId },
        loginAccount: { accountType: "GOOGLE_ADS", accountId: secrets.googleLoginAccountId || secrets.googleOperatingAccountId },
        productDestinationId: secrets.googleConversionActionId,
        reference: "primary",
      }],
      events: [{
        eventTimestamp: new Date(Number(event.timestamp)).toISOString(),
        transactionId: event.eventId,
        eventSource: "WEB",
        adIdentifiers: event.gclid ? { gclid: event.gclid } : undefined,
        userData: { userIdentifiers },
        additionalEventParameters: [{ key: "event_name", value: { stringValue: event.eventName } }],
        destinationReferences: ["primary"],
      }],
      consent: {
        adUserData: (event.consent as Record<string, boolean> | undefined)?.marketing ? "CONSENT_GRANTED" : "CONSENT_DENIED",
        adPersonalization: (event.consent as Record<string, boolean> | undefined)?.marketing ? "CONSENT_GRANTED" : "CONSENT_DENIED",
      },
      encoding: "HEX",
      validateOnly: false,
    }),
  });
  if (!apiResponse.ok) throw new Error(`Google Data Manager ${apiResponse.status}: ${await apiResponse.text()}`);
  return "sent";
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: cors });
  if (request.method !== "POST") return response({ error: "method not allowed" }, 405);

  const service = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const body = await request.json() as Record<string, unknown>;
    if (!allowedEvents.has(String(body.eventName))) return response({ error: "unsupported event" }, 400);
    if (!body.eventId || !body.siteIdentifier || !body.pageUrl || !Number.isFinite(body.timestamp)) {
      return response({ error: "eventId, siteIdentifier, pageUrl and timestamp are required" }, 400);
    }

    const consent = body.consent as Record<string, boolean> | undefined;
    if (!consent?.marketing && !consent?.analytics) return response({ accepted: false, reason: "consent_denied" }, 202);

    const { data: publicSite, error: siteError } = await service.rpc("cq_get_public_site", {
      p_identifier: body.siteIdentifier,
    });
    if (siteError || !publicSite?.site?.id) return response({ error: "site not found" }, 404);
    const siteId = String(publicSite.site.id);

    const origin = request.headers.get("origin");
    if (origin) {
      const originHost = new URL(origin).hostname.toLowerCase();
      const { data: domains } = await service.from("cq_site_domains").select("hostname").eq("site_id", siteId);
      const allowedHosts = new Set([
        publicSite.site.default_domain,
        ...((domains ?? []) as Array<{ hostname: string }>).map((item) => item.hostname),
      ].filter(Boolean).map((value) => String(value).toLowerCase()));
      if (!allowedHosts.has(originHost) && originHost !== "localhost" && originHost !== "127.0.0.1") {
        return response({ error: "origin not allowed" }, 403);
      }
    }

    const context = { ...((body.context as Record<string, unknown> | undefined) ?? {}) };
    delete context.email;
    delete context.phone;

    const { error: insertError } = await service.from("cq_tracking_events").insert({
      site_id: siteId,
      event_id: body.eventId,
      event_name: body.eventName,
      page_url: body.pageUrl,
      session_id: body.sessionId ?? "",
      visitor_id: body.visitorId ?? "",
      consent: body.consent ?? {},
      context,
    });
    if (insertError?.code === "23505") return response({ accepted: true, duplicate: true });
    if (insertError) throw insertError;

    const { data: config } = await service.from("cq_tracking_configs").select("*").eq("site_id", siteId).maybeSingle();
    const { data: secretRow } = await service.from("cq_tracking_secrets").select("encrypted_payload").eq("site_id", siteId).maybeSingle();
    const secrets = secretRow?.encrypted_payload ? await decrypt(secretRow.encrypted_payload) : {};
    const publicConfig = (config ?? {}) as Record<string, unknown>;
    const statuses = { meta: "not_configured", ga4: "not_configured", googleAds: "not_configured" };
    const errors: string[] = [];

    if (consent.marketing) {
      try { statuses.meta = await sendMeta(publicConfig, secrets, body, request); } catch (error) { statuses.meta = "failed"; errors.push(String(error)); }
      try { statuses.googleAds = await sendGoogleAds(publicConfig, secrets, body); } catch (error) { statuses.googleAds = "failed"; errors.push(String(error)); }
    }
    if (consent.analytics) {
      try { statuses.ga4 = await sendGa4(publicConfig, secrets, body); } catch (error) { statuses.ga4 = "failed"; errors.push(String(error)); }
    }

    await service.from("cq_tracking_events").update({
      meta_status: statuses.meta,
      ga4_status: statuses.ga4,
      google_ads_status: statuses.googleAds,
      last_error: errors.join(" | ").slice(0, 4000),
      processed_at: new Date().toISOString(),
    }).eq("site_id", siteId).eq("event_id", body.eventId);

    return response({ accepted: true, statuses, errors });
  } catch (error) {
    return response({ error: error instanceof Error ? error.message : "unexpected error" }, 500);
  }
});
