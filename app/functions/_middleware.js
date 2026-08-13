import { renderPublicSite } from "../src/public/render";
import { buildSeoSnapshot, renderSeoHead } from "../src/public/seo";

const fallbackSupabaseUrl = "https://euvwkkmkkunuimbrfpds.supabase.co";
const fallbackPublishableKey = "sb_publishable_c53gPWCZom1evm0sf_Mngw_pixOwGr4";
const fallbackSiteIdentifier = "catarina-queiroz";

async function fetchPublicSite(env, identifier) {
  const supabaseUrl = String(env.VITE_SUPABASE_URL || fallbackSupabaseUrl).replace(/\/$/, "");
  const publishableKey = String(env.VITE_SUPABASE_PUBLISHABLE_KEY || fallbackPublishableKey);
  const response = await globalThis.fetch(`${supabaseUrl}/rest/v1/rpc/cq_get_public_site`, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      authorization: `Bearer ${publishableKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ p_identifier: identifier }),
  });
  if (!response.ok) return null;
  return response.json();
}

async function loadSite(env, hostname) {
  const configuredIdentifier = String(env.VITE_SITE_IDENTIFIER || fallbackSiteIdentifier);
  const identifiers = hostname === configuredIdentifier
    ? [hostname]
    : [hostname, configuredIdentifier];

  for (const identifier of identifiers) {
    try {
      const data = await fetchPublicSite(env, identifier);
      if (data) return data;
    } catch {
      // Falha aberta: o asset estático continua disponível caso o Supabase esteja indisponível.
    }
  }
  return null;
}

function replaceSeoBlock(html, head) {
  const startMarker = "<!-- cq:seo-start -->";
  const endMarker = "<!-- cq:seo-end -->";
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker);
  if (start < 0 || end < 0 || end <= start) return html;
  return `${html.slice(0, start)}${startMarker}\n  ${head}\n  ${endMarker}${html.slice(end + endMarker.length)}`;
}

function replaceSiteRoot(html, renderedSite) {
  const rootStart = '<div id="site-root" aria-live="polite">';
  const consentStart = '<div id="consent-root">';
  const start = html.indexOf(rootStart);
  const consent = html.indexOf(consentStart, start + rootStart.length);
  if (start < 0 || consent < 0) return html;
  const before = html.slice(0, start);
  const after = html.slice(consent);
  return `${before}${rootStart}\n${renderedSite}\n  </div>\n  ${after}`;
}

function sitemapXml(canonicalUrl) {
  const escaped = canonicalUrl.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${escaped}</loc>\n  </url>\n</urlset>\n`;
}

function robotsTxt(canonicalUrl) {
  return `User-agent: *\nAllow: /\nSitemap: ${canonicalUrl}sitemap.xml\n`;
}

export async function onRequest(context) {
  if (context.request.method !== "GET") return context.next();

  const requestUrl = new globalThis.URL(context.request.url);
  const hostname = requestUrl.hostname.toLowerCase();
  const data = await loadSite(context.env, hostname);

  if (requestUrl.pathname === "/robots.txt") {
    if (!data) return context.next();
    const snapshot = buildSeoSnapshot(data, requestUrl.origin);
    return new globalThis.Response(robotsTxt(snapshot.canonicalUrl), {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "public, max-age=300",
      },
    });
  }

  if (requestUrl.pathname === "/sitemap.xml") {
    if (!data) return context.next();
    const snapshot = buildSeoSnapshot(data, requestUrl.origin);
    return new globalThis.Response(sitemapXml(snapshot.canonicalUrl), {
      headers: {
        "content-type": "application/xml; charset=utf-8",
        "cache-control": "public, max-age=300",
      },
    });
  }

  if (requestUrl.pathname !== "/" && requestUrl.pathname !== "/index.html") return context.next();

  const assetResponse = await context.next();
  if (!data || !assetResponse.ok) return assetResponse;

  const contentType = assetResponse.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return assetResponse;

  const verificationToken = String(
    context.env.GOOGLE_SITE_VERIFICATION
    || context.env.VITE_GOOGLE_SITE_VERIFICATION
    || "",
  );
  const snapshot = buildSeoSnapshot(data, requestUrl.origin, verificationToken);
  const sourceHtml = await assetResponse.text();
  const withSeo = replaceSeoBlock(sourceHtml, renderSeoHead(snapshot));
  const html = replaceSiteRoot(withSeo, renderPublicSite(data));
  const headers = new globalThis.Headers(assetResponse.headers);
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("link", `<${snapshot.canonicalUrl}>; rel="canonical"`);
  if (snapshot.robots.startsWith("noindex")) headers.set("x-robots-tag", "noindex, follow");

  return new globalThis.Response(html, {
    status: assetResponse.status,
    statusText: assetResponse.statusText,
    headers,
  });
}
