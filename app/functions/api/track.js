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

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function metaEventName(eventName) {
  const names = {
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

function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

function clientIp(request) {
  return request.headers.get("cf-connecting-ip")
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "";
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!sameOrigin(request)) return json({ error: "origin not allowed" }, 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const eventName = String(body?.eventName ?? "");
  if (!allowedEvents.has(eventName)) return json({ error: "unsupported event" }, 400);
  if (!body?.consent?.marketing) return json({ accepted: false, reason: "consent_denied" }, 202);

  const eventId = String(body?.eventId ?? "");
  const pageUrl = String(body?.pageUrl ?? "");
  const pixelId = String(body?.metaPixelId ?? "").trim();
  const timestamp = Number(body?.timestamp);

  if (!eventId || !pageUrl || !Number.isFinite(timestamp)) {
    return json({ error: "eventId, pageUrl and timestamp are required" }, 400);
  }
  if (!/^\d+$/.test(pixelId)) return json({ error: "invalid Meta Pixel ID" }, 400);

  const accessToken = String(env.META_ACCESS_TOKEN ?? "").trim();
  if (!accessToken) return json({ error: "META_ACCESS_TOKEN is not configured" }, 503);

  const apiVersion = String(env.META_API_VERSION ?? "v23.0").trim() || "v23.0";
  const userData = {
    client_ip_address: clientIp(request),
    client_user_agent: request.headers.get("user-agent") ?? "",
  };
  if (body.fbp) userData.fbp = String(body.fbp);
  if (body.fbc) userData.fbc = String(body.fbc);

  const endpoint = `https://graph.facebook.com/${encodeURIComponent(apiVersion)}/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`;
  const metaResponse = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      data: [{
        event_name: metaEventName(eventName),
        event_time: Math.floor(timestamp / 1000),
        event_id: eventId,
        action_source: "website",
        event_source_url: pageUrl,
        user_data: userData,
        custom_data: body.context ?? {},
      }],
    }),
  });

  if (!metaResponse.ok) {
    const detail = (await metaResponse.text()).slice(0, 1200);
    return json({ error: "Meta CAPI rejected the event", status: metaResponse.status, detail }, 502);
  }

  return json({ accepted: true, meta: "sent" });
}
