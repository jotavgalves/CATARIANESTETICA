export type MediaKind = "photo" | "logo" | "favicon" | "graphic";
export type MediaFit = "cover" | "contain";

export type MediaSlotKey =
  | "general"
  | "logo_header"
  | "favicon"
  | "hero_desktop"
  | "hero_mobile"
  | "procedure_card"
  | "result_before"
  | "result_after"
  | "testimonial_photo"
  | "section_portrait"
  | "section_landscape"
  | "social_share";

export interface MediaSlotDefinition {
  key: MediaSlotKey;
  label: string;
  category: string;
  kind: MediaKind;
  width: number | null;
  height: number | null;
  maximumDimension: number;
  fit: MediaFit;
  acceptsSvg: boolean;
  help: string;
}

export const mediaSlots: Record<MediaSlotKey, MediaSlotDefinition> = {
  general: {
    key: "general",
    label: "Imagem geral",
    category: "general",
    kind: "photo",
    width: null,
    height: null,
    maximumDimension: 2000,
    fit: "contain",
    acceptsSvg: false,
    help: "Mantém a proporção original e reduz apenas quando necessário.",
  },
  logo_header: {
    key: "logo_header",
    label: "Logo do cabeçalho",
    category: "identity",
    kind: "logo",
    width: null,
    height: null,
    maximumDimension: 1600,
    fit: "contain",
    acceptsSvg: true,
    help: "SVG sanitizado, PNG ou WebP transparente. A proporção original é preservada.",
  },
  favicon: {
    key: "favicon",
    label: "Favicon e ícones",
    category: "identity",
    kind: "favicon",
    width: 512,
    height: 512,
    maximumDimension: 1600,
    fit: "contain",
    acceptsSvg: true,
    help: "Enquadramento quadrado com margem de segurança. Gera 32, 180, 192 e 512 px.",
  },
  hero_desktop: {
    key: "hero_desktop",
    label: "Hero desktop",
    category: "hero",
    kind: "photo",
    width: 1920,
    height: 1080,
    maximumDimension: 2400,
    fit: "cover",
    acceptsSvg: false,
    help: "Formato horizontal 16:9 para computadores.",
  },
  hero_mobile: {
    key: "hero_mobile",
    label: "Hero mobile",
    category: "hero",
    kind: "photo",
    width: 1080,
    height: 1350,
    maximumDimension: 1800,
    fit: "cover",
    acceptsSvg: false,
    help: "Formato vertical 4:5 para celulares.",
  },
  procedure_card: {
    key: "procedure_card",
    label: "Cartão de procedimento",
    category: "procedures",
    kind: "photo",
    width: 1200,
    height: 900,
    maximumDimension: 1800,
    fit: "cover",
    acceptsSvg: false,
    help: "Formato 4:3 para a grade de procedimentos.",
  },
  result_before: {
    key: "result_before",
    label: "Resultado — antes",
    category: "results",
    kind: "photo",
    width: 1200,
    height: 1500,
    maximumDimension: 2200,
    fit: "cover",
    acceptsSvg: false,
    help: "Formato vertical 4:5. Use o mesmo enquadramento visual da foto depois.",
  },
  result_after: {
    key: "result_after",
    label: "Resultado — depois",
    category: "results",
    kind: "photo",
    width: 1200,
    height: 1500,
    maximumDimension: 2200,
    fit: "cover",
    acceptsSvg: false,
    help: "Formato vertical 4:5. Use o mesmo enquadramento visual da foto antes.",
  },
  testimonial_photo: {
    key: "testimonial_photo",
    label: "Foto de depoimento",
    category: "testimonials",
    kind: "photo",
    width: 800,
    height: 800,
    maximumDimension: 1200,
    fit: "cover",
    acceptsSvg: false,
    help: "Formato quadrado 1:1.",
  },
  section_portrait: {
    key: "section_portrait",
    label: "Imagem vertical de seção",
    category: "sections",
    kind: "photo",
    width: 1200,
    height: 1500,
    maximumDimension: 2000,
    fit: "cover",
    acceptsSvg: false,
    help: "Formato vertical 4:5.",
  },
  section_landscape: {
    key: "section_landscape",
    label: "Imagem horizontal de seção",
    category: "sections",
    kind: "photo",
    width: 1600,
    height: 1000,
    maximumDimension: 2200,
    fit: "cover",
    acceptsSvg: false,
    help: "Formato horizontal 8:5.",
  },
  social_share: {
    key: "social_share",
    label: "Compartilhamento social",
    category: "social",
    kind: "graphic",
    width: 1200,
    height: 630,
    maximumDimension: 1600,
    fit: "cover",
    acceptsSvg: false,
    help: "Formato 1,91:1 para WhatsApp, Facebook e outras redes.",
  },
};

export function getMediaSlot(value: string | undefined): MediaSlotDefinition {
  if (value && value in mediaSlots) return mediaSlots[value as MediaSlotKey];
  return mediaSlots.general;
}

export function mediaSlotOptions(): MediaSlotDefinition[] {
  return Object.values(mediaSlots);
}

export function mediaAspectRatio(slot: MediaSlotDefinition): number | null {
  return slot.width && slot.height ? slot.width / slot.height : null;
}
