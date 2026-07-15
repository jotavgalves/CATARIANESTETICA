import type { JsonObject } from "../lib/types";
import { AdminError } from "./errors";
import { getSectionSchema, type RepeaterSectionField, type SectionField } from "./section-schema";

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeField(field: SectionField, value: unknown): unknown {
  if (field.type === "repeater") {
    const rows = Array.isArray(value) ? value : [];
    return rows
      .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object" && !Array.isArray(row))
      .map((row) => Object.fromEntries(field.fields.map((child) => [child.key, stringValue(row[child.key])] )));
  }
  return stringValue(value);
}

export function normalizeSectionContent(sectionKey: string, content: JsonObject): JsonObject {
  const schema = getSectionSchema(sectionKey);
  return Object.fromEntries(schema.fields.map((field) => [field.key, normalizeField(field, content[field.key])]));
}

function indexedValue(data: FormData, name: string): string {
  const value = data.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function serializeRepeater(data: FormData, field: RepeaterSectionField): JsonObject[] {
  const countValue = Number(indexedValue(data, `content.${field.key}.__count`));
  const count = Number.isInteger(countValue) && countValue >= 0 ? countValue : 0;
  const rows: JsonObject[] = [];

  for (let index = 0; index < count; index += 1) {
    const row = Object.fromEntries(field.fields.map((child) => [
      child.key,
      indexedValue(data, `content.${field.key}.${index}.${child.key}`),
    ]));
    const hasContent = Object.values(row).some((value) => String(value).length > 0);
    if (!hasContent) continue;

    const missing = field.fields.find((child) => child.required && !String(row[child.key] ?? ""));
    if (missing) {
      throw new AdminError(
        `Preencha o campo “${missing.label}” no item ${rows.length + 1}.`,
        "CMS_SECTION_FIELD_REQUIRED",
        `content.${field.key}.${index}.${missing.key}`,
      );
    }
    rows.push(row);
  }

  if (rows.length < (field.minimumItems ?? 0)) {
    throw new AdminError(
      `A seção precisa de pelo menos ${field.minimumItems} ${field.itemLabel}.`,
      "CMS_SECTION_MINIMUM_ITEMS",
      `content.${field.key}`,
    );
  }

  return rows;
}

export function serializeSectionContent(sectionKey: string, form: HTMLFormElement): JsonObject {
  const schema = getSectionSchema(sectionKey);
  const data = new FormData(form);
  const content: JsonObject = {};

  for (const field of schema.fields) {
    if (field.type === "repeater") {
      content[field.key] = serializeRepeater(data, field);
      continue;
    }
    const current = indexedValue(data, `content.${field.key}`);
    if (field.required && !current) {
      throw new AdminError(
        `Preencha o campo “${field.label}”.`,
        "CMS_SECTION_FIELD_REQUIRED",
        `content.${field.key}`,
      );
    }
    content[field.key] = current;
  }

  return content;
}
