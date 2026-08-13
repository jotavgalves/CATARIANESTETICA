import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const seoSource = readFileSync(new URL("../src/public/seo.ts", import.meta.url), "utf8");

describe("SEO público", () => {
  it("usa o domínio próprio como canonical oficial", () => {
    expect(seoSource).toContain("https://catarinaqueiroz.com.br");
    expect(seoSource).toContain("noindex,follow");
    expect(seoSource).toContain("BeautySalon");
    expect(seoSource).toContain("application/ld+json");
  });
});
