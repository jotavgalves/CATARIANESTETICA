import type { PublicSitePayload } from "../src/lib/types";
import { buildSeoSnapshot, renderSeoHead } from "../src/public/seo";

const payload: PublicSitePayload = {
  site: {
    id: "site-1",
    slug: "catarina-queiroz",
    name: "Catarina Queiroz Clínica Estética",
    default_domain: "dracatarinaqueiroz.pages.dev",
    status: "active",
  },
  settings: {
    logo_url: "https://cdn.example.com/logo.svg",
    favicon_url: "",
    professional_name: "Catarina Queiroz",
    professional_title: "Esteticista e cosmetóloga",
    whatsapp: "5581999999999",
    phone: "(81) 99999-9999",
    email: "contato@example.com",
    instagram_url: "https://www.instagram.com/catarina",
    address_line: "Rua Ribeiro de Brito, 554 — Boa Viagem",
    city: "Recife",
    state: "PE",
    maps_url: "https://www.google.com/maps/search/?api=1&query=Recife",
    opening_hours: "Atendimento com hora marcada",
    seo_title: "Catarina Queiroz | Estética em Boa Viagem",
    seo_description: "Clínica de estética facial e corporal em Boa Viagem, Recife.",
    footer_text: "",
    hero: {
      image_url: "https://cdn.example.com/hero.jpg",
    },
    theme: {},
  },
  sections: [],
  procedures: [{
    id: "procedure-1",
    name: "Limpeza de pele",
    slug: "limpeza-de-pele",
    category: "Facial",
    short_description: "Limpeza e cuidado facial.",
    full_description: "",
    image_url: "",
    indications: [],
    benefits: [],
    contraindications: "",
    duration: "",
    session_estimate: "",
    whatsapp_message: "",
    is_featured: true,
    is_published: true,
    sort_order: 10,
  }],
  results: [],
  testimonials: [],
  faq: [],
  tracking: {
    consent_mode: "required",
    meta_pixel_id: "",
    meta_browser_enabled: false,
    meta_server_enabled: false,
    ga4_measurement_id: "",
    ga4_browser_enabled: false,
    ga4_server_enabled: false,
    google_ads_conversion_id: "",
    google_ads_conversion_label: "",
    google_ads_browser_enabled: false,
    google_ads_server_enabled: false,
  },
};

describe("SEO público", () => {
  it("indexa somente o domínio principal e mantém canonical estável", () => {
    const production = buildSeoSnapshot(payload, "https://dracatarinaqueiroz.pages.dev");
    const preview = buildSeoSnapshot(payload, "https://abc123.dracatarinaqueiroz.pages.dev");

    expect(production.canonicalUrl).toBe("https://dracatarinaqueiroz.pages.dev/");
    expect(production.robots).toContain("index,follow");
    expect(preview.canonicalUrl).toBe(production.canonicalUrl);
    expect(preview.robots).toBe("noindex,follow");
  });

  it("inclui negócio local e procedimentos nos dados estruturados", () => {
    const snapshot = buildSeoSnapshot(payload, "https://dracatarinaqueiroz.pages.dev");
    const graph = snapshot.structuredData["@graph"];

    expect(Array.isArray(graph)).toBe(true);
    expect(JSON.stringify(graph)).toContain("BeautySalon");
    expect(JSON.stringify(graph)).toContain("Limpeza de pele");
    expect(JSON.stringify(graph)).toContain("PostalAddress");
  });

  it("gera head com canonical, robots, compartilhamento e verificação", () => {
    const snapshot = buildSeoSnapshot(
      payload,
      "https://dracatarinaqueiroz.pages.dev",
      "google-token",
    );
    const head = renderSeoHead(snapshot);

    expect(head).toContain('rel="canonical" href="https://dracatarinaqueiroz.pages.dev/"');
    expect(head).toContain('name="google-site-verification" content="google-token"');
    expect(head).toContain('property="og:title"');
    expect(head).toContain('type="application/ld+json"');
  });
});
