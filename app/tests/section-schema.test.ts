import { describe, expect, it } from "vitest";
import { mediaSlots } from "../src/admin/media-schema";
import { getSectionSchema, sectionSchemas } from "../src/admin/section-schema";

const expectedSections = ["needs", "procedures", "process", "about", "results", "testimonials", "faq", "location"];

describe("section schema", () => {
  it("defines every public section once", () => {
    expect(Object.keys(sectionSchemas).sort()).toEqual(expectedSections.sort());
    for (const key of expectedSections) expect(getSectionSchema(key).key).toBe(key);
  });

  it("keeps field keys unique inside each section", () => {
    for (const schema of Object.values(sectionSchemas)) {
      const keys = schema.fields.map((field) => field.key);
      expect(new Set(keys).size, schema.key).toBe(keys.length);
      for (const field of schema.fields) {
        if (field.type !== "repeater") continue;
        const childKeys = field.fields.map((child) => child.key);
        expect(new Set(childKeys).size, `${schema.key}.${field.key}`).toBe(childKeys.length);
      }
    }
  });

  it("references only existing media slots", () => {
    for (const schema of Object.values(sectionSchemas)) {
      for (const field of schema.fields) {
        if (field.type === "media") expect(field.slot in mediaSlots, `${schema.key}.${field.key}`).toBe(true);
        if (field.type === "repeater") {
          for (const child of field.fields) {
            if (child.type === "media") expect(child.slot in mediaSlots, `${schema.key}.${field.key}.${child.key}`).toBe(true);
          }
        }
      }
    }
  });
});
