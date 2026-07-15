import type { JsonObject, SectionRecord } from "../lib/types";
import { getMediaSlot } from "./media-schema";
import { normalizeSectionContent } from "./section-content";
import { getSectionSchema, type MediaSectionField, type RepeaterSectionField, type SectionField } from "./section-schema";

const escapeHtml = (value: unknown): string => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

function safeId(value: string): string {
  return value.replace(/[^a-z0-9_-]+/gi, "-");
}

function textField(name: string, label: string, value: unknown, textarea = false, required = false): string {
  const id = safeId(name);
  const control = textarea
    ? `<textarea id="${id}" name="${escapeHtml(name)}"${required ? " required" : ""}>${escapeHtml(value)}</textarea>`
    : `<input id="${id}" name="${escapeHtml(name)}" type="text" value="${escapeHtml(value)}"${required ? " required" : ""}>`;
  return `<div class="field field-full" data-field-name="${escapeHtml(name)}"><label for="${id}">${escapeHtml(label)}</label>${control}</div>`;
}

function uploadFeedback(): string {
  return `<div class="upload-feedback" data-upload-feedback hidden><img class="upload-preview" data-upload-preview alt="Prévia da mídia preparada" hidden><div class="upload-feedback-copy"><strong data-upload-status>Preparando arquivo…</strong><span data-upload-meta></span><progress data-upload-progress max="100" value="0"></progress></div></div>`;
}

function mediaField(field: MediaSectionField, value: unknown, prefix = "content"): string {
  const name = `${prefix}.${field.key}`;
  const id = safeId(name);
  const slot = getMediaSlot(field.slot);
  return `<div class="section-media-field field-full"><div class="field" data-field-name="${escapeHtml(name)}"><label for="${id}">${escapeHtml(field.label)}</label><input id="${id}" name="${escapeHtml(name)}" type="url" value="${escapeHtml(value)}" readonly><small class="field-help">${escapeHtml(field.help ?? slot.help)}</small></div><div class="field upload-field" data-upload-field><label for="upload-${id}">Selecionar imagem</label><input id="upload-${id}" type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,.heic,.heif" data-upload-target="${escapeHtml(name)}" data-media-slot="${slot.key}">${uploadFeedback()}</div></div>`;
}

function repeaterRow(field: RepeaterSectionField, row: JsonObject, index: number): string {
  const prefix = `content.${field.key}.${index}`;
  const controls = field.fields.map((child) => child.type === "media"
    ? mediaField(child, row[child.key], prefix)
    : textField(`${prefix}.${child.key}`, child.label, row[child.key], child.type === "textarea", child.required)).join("");
  return `<article class="section-repeater-item" data-section-repeater-item><header><strong>${escapeHtml(field.itemLabel)} ${index + 1}</strong><div class="section-repeater-actions"><button class="button button-outline button-small" type="button" data-section-item-up aria-label="Mover para cima">↑</button><button class="button button-outline button-small" type="button" data-section-item-down aria-label="Mover para baixo">↓</button><button class="button button-outline button-small" type="button" data-section-item-duplicate>Duplicar</button><button class="button button-danger button-small" type="button" data-section-item-remove>Excluir</button></div></header><div class="form-grid">${controls}</div></article>`;
}

function repeaterField(field: RepeaterSectionField, value: unknown): string {
  const rows = Array.isArray(value) ? value as JsonObject[] : [];
  const initialRows = rows.length > 0 ? rows : Array.from({ length: field.minimumItems ?? 0 }, () => ({}));
  return `<section class="section-repeater field-full" data-section-repeater="${escapeHtml(field.key)}" data-item-label="${escapeHtml(field.itemLabel)}"><div class="section-repeater-heading"><div><h3>${escapeHtml(field.label)}</h3>${field.help ? `<p>${escapeHtml(field.help)}</p>` : ""}</div><button class="button button-outline button-small" type="button" data-section-item-add>Adicionar ${escapeHtml(field.itemLabel)}</button></div><input type="hidden" name="content.${escapeHtml(field.key)}.__count" value="${initialRows.length}" data-section-item-count><div class="section-repeater-list">${initialRows.map((row, index) => repeaterRow(field, row, index)).join("")}</div></section>`;
}

function renderField(field: SectionField, content: JsonObject): string {
  if (field.type === "repeater") return repeaterField(field, content[field.key]);
  if (field.type === "media") return mediaField(field, content[field.key]);
  return textField(`content.${field.key}`, field.label, content[field.key], field.type === "textarea", field.required);
}

export function renderSectionEditor(section: SectionRecord): string {
  const schema = getSectionSchema(section.section_key);
  const content = normalizeSectionContent(section.section_key, section.content);
  if (schema.fields.length === 0) {
    return `<div class="section-editor-empty field-full"><strong>Conteúdo conectado</strong><p>${escapeHtml(schema.description)}</p></div>`;
  }
  return `<section class="section-editor field-full"><div class="section-editor-intro"><strong>Conteúdo visual</strong><p>${escapeHtml(schema.description)}</p></div>${schema.fields.map((field) => renderField(field, content)).join("")}</section>`;
}
