export const runtimeConfig = Object.freeze({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "https://euvwkkmkkunuimbrfpds.supabase.co",
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_c53gPWCZom1evm0sf_Mngw_pixOwGr4",
  defaultSiteIdentifier: import.meta.env.VITE_SITE_IDENTIFIER || "catarina-queiroz",
  mediaBucket: "cq-media",
  trackingFunction: "track-event",
  trackingSecretsFunction: "tracking-secrets",
});

export function getSiteIdentifier(): string {
  const hostname = window.location.hostname.toLowerCase();
  if (hostname === "localhost" || hostname === "127.0.0.1") return runtimeConfig.defaultSiteIdentifier;
  return hostname || runtimeConfig.defaultSiteIdentifier;
}
