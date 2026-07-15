import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

function filesUnder(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

const sourceFiles = filesUnder(join(root, "src"));
const source = Object.fromEntries(sourceFiles.map((path) => [relative(root, path), readFileSync(path, "utf8")]));
const authMethods = /supabase\.auth\.(?:signInWithPassword|signInWithOtp|resetPasswordForEmail|updateUser|signOut|getSession|onAuthStateChange)\b/;

function moduleScriptCount(htmlPath: string): number {
  const html = readFileSync(htmlPath, "utf8");
  expect(html).not.toMatch(/<script(?!\s+type="module")[^>]*>/i);
  return html.match(/<script\s+type="module"/g)?.length ?? 0;
}

describe("architecture rules", () => {
  it("does not use important declarations", () => {
    for (const [path, content] of Object.entries(source)) {
      if (path.endsWith(".css")) expect(content, path).not.toMatch(/!important/i);
    }
  });

  it("does not use inline style attributes", () => {
    for (const [path, content] of Object.entries(source)) {
      expect(content, path).not.toMatch(/\sstyle=["']/i);
    }
  });

  it("keeps tracking provider globals inside analytics", () => {
    for (const [path, content] of Object.entries(source)) {
      if (path === "src/public/analytics.ts") continue;
      expect(content, path).not.toMatch(/\b(?:fbq|gtag|dataLayer)\b/);
    }
  });

  it("does not create patch class names", () => {
    for (const [path, content] of Object.entries(source)) {
      expect(content, path).not.toMatch(/class=["'][^"']*(?:fix|patch|temp|final)[^"']*["']/i);
    }
  });

  it("has exactly one module entry per html page", () => {
    for (const htmlPath of [
      join(root, "index.html"),
      join(root, "admin/index.html"),
      join(root, "admin/reset-password/index.html"),
    ]) {
      expect(moduleScriptCount(htmlPath), htmlPath).toBe(1);
    }
  });

  it("keeps all Supabase auth calls in the auth controller", () => {
    for (const [path, content] of Object.entries(source)) {
      if (path === "src/admin/auth-controller.ts") continue;
      expect(content, path).not.toMatch(authMethods);
    }
  });

  it("does not import UI modules from the repository", () => {
    const repository = source["src/admin/repository.ts"] ?? "";
    expect(repository).not.toMatch(/import\s+["']\.\//);
    expect(repository).not.toMatch(/from\s+["'][^"']*(?:render|auth-ui|controller|editor|service)/i);
  });

  it("does not mutate rendered authentication forms", () => {
    const adminSource = Object.entries(source)
      .filter(([path]) => path.startsWith("src/admin/"))
      .map(([, content]) => content)
      .join("\n");
    expect(adminSource).not.toMatch(/MutationObserver/);
    expect(existsSync(join(root, "src/admin/auth-ui.ts"))).toBe(false);
  });

  it("has a single authentication state subscription", () => {
    const controller = source["src/admin/auth-controller.ts"] ?? "";
    expect(controller.match(/onAuthStateChange/g)?.length ?? 0).toBe(1);
  });

  it("keeps Supabase persistence inside the repository", () => {
    for (const [path, content] of Object.entries(source)) {
      if (!path.startsWith("src/admin/") || path === "src/admin/repository.ts" || path === "src/admin/auth-controller.ts") continue;
      expect(content, path).not.toMatch(/supabase\.(?:storage|from|rpc|functions)\b/);
    }
  });

  it("keeps SVG sanitization and file generation inside the processor", () => {
    for (const [path, content] of Object.entries(source)) {
      if (path === "src/admin/media-processor.ts") continue;
      expect(content, path).not.toMatch(/\b(?:DOMParser|XMLSerializer|createImageBitmap)\b/);
      expect(content, path).not.toMatch(/canvas\.toBlob\b/);
    }
  });

  it("has one crop renderer shared by processor and editor", () => {
    const processor = source["src/admin/media-processor.ts"] ?? "";
    const editor = source["src/admin/media-editor.ts"] ?? "";
    const adminMedia = Object.entries(source)
      .filter(([path]) => path.startsWith("src/admin/media-"))
      .map(([, content]) => content)
      .join("\n");
    expect(processor.match(/function renderMediaCanvas/g)?.length ?? 0).toBe(1);
    expect(editor).toMatch(/import\s+\{[^}]*renderMediaCanvas[^}]*\}\s+from\s+["']\.\/media-processor["']/s);
    expect(adminMedia.match(/context\.translate\(width \/ 2 \+ offsetX/g)?.length ?? 0).toBe(1);
    expect(adminMedia.match(/context\.rotate\(normalized\.rotation/g)?.length ?? 0).toBe(1);
  });

  it("keeps slot definitions in one schema", () => {
    const schema = source["src/admin/media-schema.ts"] ?? "";
    const otherAdmin = Object.entries(source)
      .filter(([path]) => path.startsWith("src/admin/") && path !== "src/admin/media-schema.ts")
      .map(([, content]) => content)
      .join("\n");
    for (const slot of ["hero_desktop", "hero_mobile", "procedure_card", "result_before", "result_after", "testimonial_photo"]) {
      expect(schema).toContain(`${slot}:`);
      expect(otherAdmin.match(new RegExp(`${slot}:\\s*\\{`, "g"))?.length ?? 0).toBe(0);
    }
  });

  it("keeps the editor independent from persistence", () => {
    const editor = source["src/admin/media-editor.ts"] ?? "";
    expect(editor).not.toMatch(/supabase|repository|media-service/);
  });

  it("does not retain the previous upload implementation", () => {
    const repository = source["src/admin/repository.ts"] ?? "";
    const service = source["src/admin/media-service.ts"] ?? "";
    expect(repository).not.toMatch(/registerMediaFile|removeStorageFile\s*\(/);
    expect(service).not.toMatch(/function prepareImage|function encodeImage|mediaMaximumDimension/);
  });

  it("does not throw raw Supabase errors from the repository", () => {
    const repository = source["src/admin/repository.ts"] ?? "";
    expect(repository).not.toMatch(/throw\s+error\s*;/);
  });

  it("does not discard admin errors behind a generic message", () => {
    const adminSource = Object.entries(source)
      .filter(([path]) => path.startsWith("src/admin/"))
      .map(([, content]) => content)
      .join("\n");
    expect(adminSource).not.toMatch(/Erro inesperado/i);
    expect(adminSource).toMatch(/normalizeAdminError/);
  });
});