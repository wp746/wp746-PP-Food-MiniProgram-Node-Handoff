import { describe, expect, it } from "vitest";
import { PPFoodPipeline } from "../src/pipeline";
import type { ArtDirection, CategoryVisualTranslation, PPFoodJobInput, ProductTruth } from "../src/types";

const truth: ProductTruth = {
  productIdentity: "测试产品",
  primaryCategory: "STREET_FOOD",
  visibleComponents: ["product"],
  visibleCount: 1,
  geometry: ["stable geometry"],
  platingOrTopology: ["single hero"],
  physicalRelationships: [],
  surfaceState: { cooked: true },
  dominantProductColors: ["warm"],
  sensorySemantics: { hot: true },
  emotionalSemantics: { primary: ["fresh"], secondary: [], forbidden: [] },
  fidelityRisks: [],
  unknown: []
};

const translation: CategoryVisualTranslation = {
  primaryCategory: "STREET_FOOD",
  sensorySemantics: { primary: ["hot"], secondary: [] },
  emotionalSemantics: { primary: ["fresh"], secondary: [], forbidden: [] },
  brandTemperament: ["direct"],
  materialMetaphor: { primary: "heat sheen" },
  typography: {
    personality: "bold",
    dimensionality: "controlled",
    materialMetaphor: "heat sheen",
    edgeBehavior: "clean",
    spatialBehavior: "integrated"
  },
  color: {},
  lighting: {},
  spatial: {},
  motion: {},
  information: {},
  oneBigIdeaSeed: "product heat becomes campaign energy",
  forbiddenDrift: []
};

function direction(variant: string): ArtDirection {
  return {
    conceptId: variant,
    oneBigIdea: `${variant} product-derived campaign idea with enough structural specificity`,
    productHeroDirection: "large product-first hero",
    typographyDirection: "integrated headline",
    typographyProductRelationship: "shared light and perspective",
    compositionDirection: variant === "PRIMARY" ? "diagonal depth" : "offset vertical depth",
    categoryAtmosphere: "category-native contemporary atmosphere",
    colorDirection: "product-derived palette",
    lightingDirection: "product-first key light",
    forbiddenDrift: []
  };
}

function job(): PPFoodJobInput {
  return {
    jobId: "job-1",
    mode: "B",
    sourceImage: Buffer.from("source"),
    stageAPassImage: Buffer.from("stage-a"),
    productName: "测试产品",
    headline: "测试产品",
    subtitle: "现做现享",
    defaultCopyAuthorized: true,
    aspectRatio: "9:16"
  };
}

function harness(productionEval: Record<string, unknown> = {}) {
  const imageCalls: Array<{ image: Buffer | string; prompt: string }> = [];
  let imageCounter = 0;
  const image = {
    async edit(input: { image: Buffer | string; prompt: string; aspectRatio: "9:16" }) {
      imageCalls.push({ image: input.image, prompt: input.prompt });
      imageCounter += 1;
      return { image: Buffer.from(`render-${imageCounter}`), provider: "mock", model: "mock" };
    }
  };

  const text = {
    async complete({ system, input }: any) {
      if (system.includes("Copy Firewall")) return { authorized: ["测试产品", "现做现享"] };
      if (system.includes("Category Visual Translator")) return translation;
      if (system.includes("B KV Art Director")) return direction(input.variant);
      return {};
    }
  };

  const visionCalls: Array<{ system: string; images: Array<Buffer | string> }> = [];
  const vision = {
    async analyze({ system, images }: any) {
      visionCalls.push({ system, images });
      if (system.includes("Pairwise")) {
        return {
          winnerId: "primary",
          visuallyDistinct: true,
          confidence: 0.9,
          evidence: ["primary stronger"]
        };
      }
      if (system.includes("Production delivery")) {
        return {
          decision: "PASS",
          failures: [],
          mechanicalPass: true,
          referenceBindingVerified: true,
          productTruthPass: true,
          copyTruthPass: true,
          productFirstHero: true,
          confidence: 0.9,
          ...productionEval
        };
      }
      return {
        decision: "PASS",
        failures: [],
        confidence: 0.9,
        firstRead: ["product", "headline", "message"]
      };
    }
  };

  return { image, text, vision, imageCalls, visionCalls };
}

describe("Runtime 1.0.0-rc.1 mode parity", () => {
  it("PRODUCTION_FAST renders one initial B candidate and skips pairwise on pass", async () => {
    const h = harness();
    const pipeline = new PPFoodPipeline(h.vision as any, h.text as any, h.image as any, {
      runtimeMode: "PRODUCTION_FAST",
      productionMaxCreativeRetries: 1
    });

    const result = (await pipeline.runStageB(job(), truth)) as any;

    expect(result.runtimeMode).toBe("PRODUCTION_FAST");
    expect(h.imageCalls).toHaveLength(1);
    expect(result.primary).toBeTruthy();
    expect(result.challenger).toBeUndefined();
    expect(result.productionGate.decision).toBe("PASS");
    expect(h.visionCalls.some((call) => call.system.includes("Pairwise"))).toBe(false);
  });

  it("VALIDATION renders Primary + Challenger and pairwise sees only Stage A, Primary, Challenger", async () => {
    const h = harness();
    const pipeline = new PPFoodPipeline(h.vision as any, h.text as any, h.image as any, {
      runtimeMode: "VALIDATION"
    });

    const result = (await pipeline.runStageB(job(), truth)) as any;
    const pairwise = h.visionCalls.find((call) => call.system.includes("Pairwise"));

    expect(h.imageCalls).toHaveLength(2);
    expect(result.primary).toBeTruthy();
    expect(result.challenger).toBeTruthy();
    expect(pairwise).toBeTruthy();
    expect(pairwise!.images).toHaveLength(3);
    expect(Buffer.from(pairwise!.images[0] as Buffer).toString()).toBe("stage-a");
    expect(Buffer.from(pairwise!.images[1] as Buffer).toString()).toBe("render-1");
    expect(Buffer.from(pairwise!.images[2] as Buffer).toString()).toBe("render-2");
  });

  it("PRODUCTION_FAST uses at most one creative retry for a hard delivery failure", async () => {
    let evalCount = 0;
    const h = harness();
    h.vision.analyze = async ({ system, images }: any) => {
      h.visionCalls.push({ system, images });
      if (system.includes("Production delivery")) {
        evalCount += 1;
        return evalCount === 1
          ? {
              decision: "RETRY",
              failures: [{ code: "PRODUCT_IDENTITY_DRIFT", severity: "CRITICAL", evidence: ["drift"] }],
              mechanicalPass: true,
              referenceBindingVerified: true,
              productTruthPass: false,
              copyTruthPass: true,
              productFirstHero: true,
              confidence: 0.9
            }
          : {
              decision: "RETRY",
              failures: [{ code: "PRODUCT_IDENTITY_DRIFT", severity: "CRITICAL", evidence: ["still drift"] }],
              mechanicalPass: true,
              referenceBindingVerified: true,
              productTruthPass: false,
              copyTruthPass: true,
              productFirstHero: true,
              confidence: 0.9
            };
      }
      return { decision: "PASS", failures: [], confidence: 0.9 };
    };

    const pipeline = new PPFoodPipeline(h.vision as any, h.text as any, h.image as any, {
      runtimeMode: "PRODUCTION_FAST",
      productionMaxCreativeRetries: 1
    });
    const result = (await pipeline.runStageB(job(), truth)) as any;

    expect(h.imageCalls).toHaveLength(2);
    expect(result.retry).toBeTruthy();
    expect(result.productionGate.decision).not.toBe("PASS");
  });

  it("soft aesthetic failures alone do not regenerate in PRODUCTION_FAST", async () => {
    const h = harness({
      failures: [{ code: "PHOTO_PLUS_TEXT", severity: "MAJOR", evidence: ["soft style issue"] }]
    });
    const pipeline = new PPFoodPipeline(h.vision as any, h.text as any, h.image as any, {
      runtimeMode: "PRODUCTION_FAST"
    });

    const result = (await pipeline.runStageB(job(), truth)) as any;

    expect(h.imageCalls).toHaveLength(1);
    expect(result.productionGate.decision).toBe("PASS");
  });

  it("low evaluator confidence requests re-evaluation without image regeneration", async () => {
    const h = harness({ confidence: 0.5 });
    const pipeline = new PPFoodPipeline(h.vision as any, h.text as any, h.image as any, {
      runtimeMode: "PRODUCTION_FAST"
    });

    const result = (await pipeline.runStageB(job(), truth)) as any;

    expect(h.imageCalls).toHaveLength(1);
    expect(result.productionGate.decision).toBe("NEEDS_SECOND_EVALUATION");
    expect(result.productionGate.retryEligible).toBe(false);
  });
});
