import { describe, expect, it } from "vitest";
import { normalizeMediaTransform, type PreparedMediaSource } from "../src/admin/media-processor";
import { mediaSlots } from "../src/admin/media-schema";

const source = {
  width: 1600,
  height: 900,
} as PreparedMediaSource;

describe("media transform", () => {
  it("does not allow cover mode to expose empty areas", () => {
    const normalized = normalizeMediaTransform(source, 1080, 1350, {
      zoom: 1,
      offsetX: 10,
      offsetY: -10,
      rotation: 0,
      fit: "cover",
    });

    expect(normalized.offsetX).toBeCloseTo(0.611111, 5);
    expect(normalized.offsetY).toBe(0);
  });

  it("allows contain mode to use a safe inset", () => {
    const normalized = normalizeMediaTransform(source, 512, 512, {
      zoom: mediaSlots.favicon.defaultZoom ?? 1,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      fit: "contain",
    });

    expect(normalized.zoom).toBeCloseTo(0.84);
  });

  it("swaps dimensions when rotation changes cover limits", () => {
    const normalized = normalizeMediaTransform(source, 1200, 1500, {
      zoom: 1,
      offsetX: 3,
      offsetY: 3,
      rotation: 90,
      fit: "cover",
    });

    expect(normalized.offsetX).toBe(0);
    expect(normalized.offsetY).toBeGreaterThan(0);
  });
});