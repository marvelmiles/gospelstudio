import { describe, expect, it } from "vitest";
import { sortAssets } from "./assetSort";

const assets = [
  { name: "Cedar", createdAt: "2026-01-02T00:00:00.000Z" },
  { name: "Built in", builtIn: true },
  {
    name: "Edited built in",
    builtIn: true,
    createdAt: "2026-10-29T00:00:00.000Z",
    updatedAt: "2026-12-01T00:00:00.000Z",
  },
  {
    name: "Acacia",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2027-01-01T00:00:00.000Z",
  },
];

const names = (list: { name: string }[]) => list.map((asset) => asset.name);

describe("sortAssets", () => {
  it("orders by name either way", () => {
    expect(names(sortAssets(assets, "ascending"))).toEqual([
      "Acacia",
      "Built in",
      "Cedar",
      "Edited built in",
    ]);
    expect(names(sortAssets(assets, "descending"))).toEqual([
      "Edited built in",
      "Cedar",
      "Built in",
      "Acacia",
    ]);
  });

  it("keeps built-ins older than anything the user added", () => {
    expect(names(sortAssets(assets, "newest")).slice(0, 2)).toEqual([
      "Cedar",
      "Acacia",
    ]);
    expect(names(sortAssets(assets, "oldest")).slice(2)).toEqual([
      "Acacia",
      "Cedar",
    ]);
  });

  it("puts the most recently edited first, built-ins included", () => {
    expect(names(sortAssets(assets, "modified")).slice(0, 2)).toEqual([
      "Acacia",
      "Edited built in",
    ]);
  });
});
