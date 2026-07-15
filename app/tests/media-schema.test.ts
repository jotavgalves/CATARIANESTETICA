import { describe, expect, it } from "vitest";
import { getMediaSlot, mediaAspectRatio, mediaSlotOptions, mediaSlots } from "../src/admin/media-schema";

describe("media schema", () => {
  it("keeps slot keys unique and resolvable", () => {
    const slots = mediaSlotOptions();
    expect(new Set(slots.map((slot) => slot.key)).size).toBe(slots.length);
    for (const slot of slots) expect(getMediaSlot(slot.key)).toBe(slot);
    expect(getMediaSlot("unknown").key).toBe("general");
  });

  it("allows SVG only for identity slots", () => {
    const svgSlots = mediaSlotOptions().filter((slot) => slot.acceptsSvg).map((slot) => slot.key).sort();
    expect(svgSlots).toEqual(["favicon", "logo_header"]);
  });

  it("uses matching dimensions for before and after", () => {
    expect(mediaSlots.result_before.width).toBe(mediaSlots.result_after.width);
    expect(mediaSlots.result_before.height).toBe(mediaSlots.result_after.height);
    expect(mediaAspectRatio(mediaSlots.result_before)).toBeCloseTo(0.8);
  });

  it("defines separate desktop and mobile hero formats", () => {
    expect(mediaAspectRatio(mediaSlots.hero_desktop)).toBeCloseTo(16 / 9);
    expect(mediaAspectRatio(mediaSlots.hero_mobile)).toBeCloseTo(4 / 5);
    expect(mediaSlots.hero_desktop.width).not.toBe(mediaSlots.hero_mobile.width);
  });

  it("requires fixed output dimensions for visual slots", () => {
    for (const slot of mediaSlotOptions()) {
      if (slot.key === "general" || slot.key === "logo_header") continue;
      expect(slot.width, slot.key).toBeGreaterThan(0);
      expect(slot.height, slot.key).toBeGreaterThan(0);
    }
  });
});
