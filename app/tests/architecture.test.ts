import { readFileSync, readdirSync, statSync } from "node:fs";
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
    for (const htmlPath of [join(root, "index.html"), join(root, "admin/index.html")]) {
      const html = readFileSync(htmlPath, "utf8");
      expect(html.match(/<script\s+type="module"/g)?.length ?? 0, htmlPath).toBe(1);
      expect(html).not.toMatch(/<script(?!\s+type="module")[^>]*>/i);
    }
  });
});
