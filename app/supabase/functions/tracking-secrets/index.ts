import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, "Content-Type": "application/json" },
});

function encode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function key(): Promise<CryptoKey> {
  const secret = Deno.env.get("TRACKING_ENCRYPTION_KEY");
  if (!secret || secret.length < 32) throw new Error("TRACKING_ENCRYPTION_KEY must have at least 32 characters");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt"]);
}

async function encrypt(payload: Record<string, unknown>): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(), new TextEncoder().encode(JSON.stringify(payload)));
  return `${encode(iv)}.${encode(new Uint8Array(encrypted))}`;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: request.headers.get("Authorization") ?? "" } },
    });
    const service = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: auth, error: authError } = await authClient.auth.getUser();
    if (authError || !auth.user) return response({ error: "unauthorized" }, 401);

    const body = request.method === "GET"
      ? Object.fromEntries(new URL(request.url).searchParams.entries())
      : await request.json();
    const siteId = String(body.siteId ?? "");
    if (!siteId) return response({ error: "siteId is required" }, 400);

    const { data: member } = await service.from("cq_site_members").select("role,active").eq("site_id", siteId).eq("user_id", auth.user.id).maybeSingle();
    if (!member?.active || member.role !== "owner") return response({ error: "owner access required" }, 403);

    if (request.method === "GET") {
      const { data } = await service.from("cq_tracking_secrets").select("encrypted_payload,updated_at").eq("site_id", siteId).maybeSingle();
      return response({ configured: Boolean(data?.encrypted_payload), updatedAt: data?.updated_at ?? null });
    }
    if (request.method === "DELETE") {
      await service.from("cq_tracking_secrets").upsert({ site_id: siteId, encrypted_payload: "" });
      return response({ ok: true });
    }

    const allowed = new Set([
      "metaAccessToken", "metaApiVersion", "ga4ApiSecret", "googleOAuthAccessToken",
      "googleDataManagerEndpoint", "googleOperatingAccountId", "googleLoginAccountId",
      "googleConversionActionId",
    ]);
    const secrets = body.secrets;
    if (!secrets || typeof secrets !== "object" || Array.isArray(secrets)) return response({ error: "secrets object is required" }, 400);
    const sanitized = Object.fromEntries(Object.entries(secrets).filter(([name, value]) => allowed.has(name) && typeof value === "string"));
    const encryptedPayload = await encrypt(sanitized);
    const { error } = await service.from("cq_tracking_secrets").upsert({ site_id: siteId, encrypted_payload: encryptedPayload });
    if (error) throw error;
    return response({ ok: true, configuredKeys: Object.keys(sanitized) });
  } catch (error) {
    return response({ error: error instanceof Error ? error.message : "unexpected error" }, 500);
  }
});
