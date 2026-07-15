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
    expect(repository).not.toMatch(/from\s+["'][^"']*(?:render|auth-ui|controller)/i);
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

  it("keeps Supabase storage access inside the repository", () => {
    for (const [path, content] of Object.entries(source)) {
      if (path === "src/admin/repository.ts") continue;
      expect(content, path).not.toMatch(/supabase\.storage\b/);
    }
  });

  it("keeps image preparation inside the media service", () => {
    const main = source["src/admin/main.ts"] ?? "";
    const repository = source["src/admin/repository.ts"] ?? "";
    expect(main).toMatch(/from\s+["']\.\/media-service["']/);
    expect(repository).not.toMatch(/createImageBitmap|canvas\.toBlob|document\.createElement\(["']canvas/);
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
