import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (path: string): string => readFileSync(resolve(root, path), "utf8");

describe("visual section editor architecture", () => {
  it("does not expose or parse section JSON", () => {
    const render = read("src/admin/render.ts");
    const main = read("src/admin/main.ts");
    expect(render).not.toMatch(/name=["']content["']/);
    expect(render).not.toMatch(/JSON\.stringify\(item\.content/);
    expect(main).not.toMatch(/JSON\.parse\(/);
    expect(main).not.toMatch(/CMS_SECTION_JSON_INVALID/);
  });

  it("keeps section responsibilities in one module each", () => {
    const main = read("src/admin/main.ts");
    const render = read("src/admin/render.ts");
    expect(main.match(/serializeSectionContent/g)?.length ?? 0).toBe(2);
    expect(main.match(/handleSectionEditorClick/g)?.length ?? 0).toBe(2);
    expect(render.match(/renderSectionEditor/g)?.length ?? 0).toBe(2);
  });

  it("keeps persistence out of the editor modules", () => {
    for (const path of [
      "src/admin/section-schema.ts",
      "src/admin/section-content.ts",
      "src/admin/section-editor.ts",
      "src/admin/section-controller.ts",
    ]) {
      const content = read(path);
      expect(content, path).not.toMatch(/supabase|repository|saveSection/);
    }
  });
});
