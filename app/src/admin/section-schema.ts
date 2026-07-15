import type { MediaSlotKey } from "./media-schema";

export type SectionFieldType = "text" | "textarea" | "media" | "repeater";

interface BaseSectionField {
  key: string;
  label: string;
  type: SectionFieldType;
  help?: string;
  required?: boolean;
}

export interface TextSectionField extends BaseSectionField {
  type: "text" | "textarea";
}

export interface MediaSectionField extends BaseSectionField {
  type: "media";
  slot: MediaSlotKey;
}

export interface RepeaterSectionField extends BaseSectionField {
  type: "repeater";
  itemLabel: string;
  minimumItems?: number;
  fields: Array<TextSectionField | MediaSectionField>;
}

export type SectionField = TextSectionField | MediaSectionField | RepeaterSectionField;

export interface SectionSchema {
  key: string;
  label: string;
  description: string;
  fields: SectionField[];
}

export const sectionSchemas: Record<string, SectionSchema> = {
  needs: {
    key: "needs",
    label: "Necessidades",
    description: "Edite os motivos e necessidades apresentados ao visitante.",
    fields: [{
      key: "items",
      label: "Necessidades",
      type: "repeater",
      itemLabel: "necessidade",
      minimumItems: 1,
      fields: [
        { key: "title", label: "Título", type: "text", required: true },
        { key: "text", label: "Descrição", type: "textarea" },
      ],
    }],
  },
  procedures: {
    key: "procedures",
    label: "Apresentação dos procedimentos",
    description: "O conteúdo desta seção vem dos procedimentos cadastrados.",
    fields: [],
  },
  process: {
    key: "process",
    label: "Como funciona",
    description: "Organize as imagens e as etapas do atendimento.",
    fields: [
      { key: "image_url", label: "Imagem principal", type: "media", slot: "section_landscape" },
      { key: "secondary_image_url", label: "Imagem secundária", type: "media", slot: "section_portrait" },
      {
        key: "steps",
        label: "Etapas",
        type: "repeater",
        itemLabel: "etapa",
        minimumItems: 1,
        fields: [
          { key: "title", label: "Título", type: "text", required: true },
          { key: "text", label: "Descrição", type: "textarea" },
        ],
      },
    ],
  },
  about: {
    key: "about",
    label: "Sobre a profissional",
    description: "Apresente a profissional e a imagem usada nesta seção.",
    fields: [
      { key: "image_url", label: "Foto da profissional", type: "media", slot: "section_portrait" },
      { key: "body", label: "Texto principal", type: "textarea" },
    ],
  },
  results: {
    key: "results",
    label: "Antes e depois",
    description: "Os cartões desta seção vêm dos resultados cadastrados.",
    fields: [],
  },
  testimonials: {
    key: "testimonials",
    label: "Depoimentos",
    description: "Os cartões desta seção vêm dos depoimentos publicados.",
    fields: [],
  },
  faq: {
    key: "faq",
    label: "Perguntas frequentes",
    description: "As perguntas desta seção vêm do cadastro de perguntas.",
    fields: [],
  },
  location: {
    key: "location",
    label: "Localização",
    description: "Endereço, mapa e horários são definidos nas configurações do site.",
    fields: [],
  },
};

export function getSectionSchema(sectionKey: string): SectionSchema {
  return sectionSchemas[sectionKey] ?? {
    key: sectionKey,
    label: sectionKey,
    description: "Esta seção não possui campos adicionais.",
    fields: [],
  };
}
