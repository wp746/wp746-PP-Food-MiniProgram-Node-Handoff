import { describe, expect, it } from "vitest";
import { normalizeProductTruth } from "../src/pipeline";
import type { ProductTruth } from "../src/types";

const cannedFruitTruth: ProductTruth = {
  productIdentity: "玻璃罐装桔子罐头",
  primaryCategory: "Canned fruit",
  packOrFood: "Pack",
  visibleComponents: ["glass jar", "tangerine segments"],
  visibleCount: 1,
  geometry: ["upright cylindrical jar"],
  platingOrTopology: ["fruit segments inside jar"],
  physicalRelationships: ["label attached to jar"],
  surfaceState: { syrupGloss: true },
  dominantProductColors: ["orange", "cream"],
  sensorySemantics: { juicy: true },
  emotionalSemantics: { primary: ["sunlit sweetness"], secondary: [], forbidden: [] },
  fidelityRisks: [],
  unknown: []
};

describe("RC2 product-truth normalization", () => {
  it("normalizes title-case Pack and routes canned fruit to the canonical retail category", () => {
    const normalized = normalizeProductTruth(cannedFruitTruth, {
      productName: "桔子罐头",
      brand: "林家铺子"
    });

    expect(normalized.packOrFood).toBe("PACK");
    expect(normalized.primaryCategory).toBe("CANNED_FRUIT_RETAIL");
  });
});
