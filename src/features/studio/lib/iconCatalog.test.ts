import { describe, expect, it } from "vitest";
import {
  DEFAULT_ICON,
  ICONS,
  ICON_ORDER,
  iconDefinition,
  isIconName,
} from "./iconCatalog";

describe("icon catalog", () => {
  it("lists every icon exactly once", () => {
    expect(new Set(ICON_ORDER).size).toBe(ICON_ORDER.length);
    expect([...ICON_ORDER].sort()).toEqual(Object.keys(ICONS).sort());
  });

  it("gives every icon a label people can read", () => {
    for (const name of ICON_ORDER) {
      expect(ICONS[name].label.trim(), name).not.toBe("");
      expect(ICONS[name].icon, name).toBeTruthy();
    }
  });

  it("knows its own icons and nothing else", () => {
    expect(isIconName("bell")).toBe(true);
    expect(isIconName("rocket")).toBe(false);
    expect(isIconName("toString")).toBe(false);
    expect(isIconName("")).toBe(false);
  });

  it("falls back to the default icon for a name it does not know", () => {
    expect(iconDefinition("megaphone")).toBe(ICONS.megaphone);
    expect(iconDefinition("rocket")).toBe(ICONS[DEFAULT_ICON]);
    expect(iconDefinition("constructor")).toBe(ICONS[DEFAULT_ICON]);
  });
});
