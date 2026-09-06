import { describe, expect, it } from "vitest";
import { compileStageBPrompt } from "../src/ppFoodPrompts";
import { decideProductionGate } from "../src/pipeline";
import type { ArtDirection, ProductTruth } from "../src/types";

const truth: ProductTruth = {
  productIdentity: "杏鲍菇辣炒牛肉",
  primaryCategory: "CHINESE_HOT_FOOD",
  packOrFood: "FOOD",
  visibleComponents: ["beef", "king oyster mushroom", "red pepper", "yellow pepper"],
  geometry: ["stir-fry bowl"],
  platingOrTopology: ["mixed stir-fry"],
  physicalRelationships: ["beef and mushroom interleaved"],
  surfaceState: { glossy: true },
  dominantProductColors: ["brown", "red", "yellow"],
  sensorySemantics: { wokHeat: true },
  emotionalSemantics: { primary: ["hot", "fresh"], secondary: [], forbidden: [] },
  fidelityRisks: [],
  unknown: []
};

const direction: ArtDirection = {
  conceptId: "PRIMARY",
  oneBigIdea: "wok heat becomes title energy",
  productHeroDirection: "large lower hero",
  typographyDirection: "bold headline",
  typographyProductRelationship: "shared light and perspective",
  compositionDirection: "multi-depth vertical surge",
  categoryAtmosphere: "contemporary Chinese wok atmosphere",
  colorDirection: "food-derived warm palette",
  lightingDirection: "wok glow with product-first key light",
  forbiddenDrift: []
};

describe("B title spatiality contract", () => {
  it("compiles explicit anti-flatness and headline/subtitle depth rules", () => {
    const prompt = compileStageBPrompt({
      productTruth: truth,
      userFacts: {
        productName: "杏鲍菇辣炒牛肉",
        headline: "杏鲍菇辣炒牛肉",
        subtitle: "新品上市",
        brand: "二大爷饭馆"
      },
      direction
    });

    expect(prompt).toContain("flat 2D overlay");
    expect(prompt).toContain("distinct depth roles");
    expect(prompt).toContain("perspective");
    expect(prompt).toContain("occlusion");
    expect(prompt).toContain("TITLE_SPATIALITY_WEAK");
    expect(prompt).toContain("does not require literal 3D extrusion");
  });

  it("treats TITLE_SPATIALITY_WEAK as a production hard gate", () => {
    const gate = decideProductionGate({
      decision: "RETRY",
      failures: [
        {
          code: "TITLE_SPATIALITY_WEAK",
          severity: "CRITICAL",
          evidence: ["headline and subtitle are flat overlays"]
        }
      ],
      mechanicalPass: true,
      referenceBindingVerified: true,
      productTruthPass: true,
      copyTruthPass: true,
      productFirstHero: true,
      confidence: 0.9
    });

    expect(gate.decision).toBe("RETRY");
    expect(gate.retryEligible).toBe(true);
    expect(gate.failureCodes).toContain("TITLE_SPATIALITY_WEAK");
    expect(gate.repairInstruction).toContain("perspective");
  });
});
