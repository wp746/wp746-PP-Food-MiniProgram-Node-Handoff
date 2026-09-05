import { describe, expect, it } from "vitest";
import { PPFoodPipeline } from "../src/pipeline";
import { StructuredOutputProtocolError } from "../src/types";
import type { ArtDirection, CategoryVisualTranslation, PPFoodJobInput, ProductTruth } from "../src/types";

const truth: ProductTruth = {
  productIdentity: "桔子罐头",
  primaryCategory: "CANNED_FRUIT_RETAIL",
  packOrFood: "PACK",
  visibleComponents: ["glass jar", "mandarin segments"],
  visibleCount: 1,
  geometry: ["cylindrical jar"],
  platingOrTopology: ["fruit inside jar"],
  physicalRelationships: ["fruit contained by jar"],
  surfaceState: { glossy: true },
  dominantProductColors: ["orange", "clear glass"],
  sensorySemantics: { citrus: true, juicy: true },
  emotionalSemantics: { primary: ["fresh"], secondary: ["sunlit"], forbidden: [] },
  fidelityRisks: [],
  unknown: []
};

const translation: CategoryVisualTranslation = {
  primaryCategory: "CANNED_FRUIT_RETAIL",
  sensorySemantics: { primary: ["citrus", "juicy"], secondary: [] },
  emotionalSemantics: { primary: ["fresh"], secondary: ["sunlit"], forbidden: [] },
  brandTemperament: ["retail", "clean"],
  materialMetaphor: { primary: "translucent citrus glass" },
  typography: {
    personality: "bold retail",
    dimensionality: "controlled",
    materialMetaphor: "citrus glass",
    edgeBehavior: "clean",
    spatialBehavior: "integrated"
  },
  color: {}, lighting: {}, spatial: {}, motion: {}, information: {},
  oneBigIdeaSeed: "sunlight concentrated into the jar",
  forbiddenDrift: ["night market"]
};

const primaryDirection: ArtDirection = {
  conceptId: "PRIMARY",
  oneBigIdea: "sunlight concentrated into the mandarin jar",
  productHeroDirection: "large package-led hero",
  typographyDirection: "bold retail headline",
  typographyProductRelationship: "shared citrus light",
  compositionDirection: "multi-depth retail campaign",
  categoryAtmosphere: "bright citrus retail world",
  colorDirection: "orange and warm white",
  lightingDirection: "bright directional sunlight",
  forbiddenDrift: []
};

function job(): PPFoodJobInput {
  return {
    jobId: "s02",
    mode: "B",
    sourceImage: Buffer.from("source"),
    stageAPassImage: Buffer.from("stage-a"),
    productName: "桔子罐头",
    headline: "阳光蜜橘",
    defaultCopyAuthorized: true,
    aspectRatio: "9:16"
  };
}

function passingEvaluation() {
  return {
    decision: "PASS",
    failures: [],
    mechanicalPass: true,
    referenceBindingVerified: true,
    productTruthPass: true,
    copyTruthPass: true,
    productFirstHero: true,
    confidence: 0.92
  };
}

function harness(sequence: Array<unknown>) {
  const imageCalls: Array<{ image: Buffer | string; prompt: string }> = [];
  const visionCalls: Array<{ system: string; images: Array<Buffer | string> }> = [];
  let imageCounter = 0;
  let productionEvalIndex = 0;

  const image = {
    async edit(input: { image: Buffer | string; prompt: string; aspectRatio: "9:16" }) {
      imageCalls.push({ image: input.image, prompt: input.prompt });
      imageCounter += 1;
      return { image: Buffer.from(`render-${imageCounter}`), provider: "mock", model: "mock" };
    }
  };

  const text = {
    async complete({ system }: any) {
      if (system.includes("Copy Firewall")) return { authorized: ["桔子罐头", "阳光蜜橘"] };
      if (system.includes("Category Visual Translator")) return translation;
      if (system.includes("B KV Art Director")) return primaryDirection;
      return {};
    }
  };

  const vision: any = {
    async analyze({ system, images }: any) {
      visionCalls.push({ system, images });
      if (!system.includes("Production delivery")) return truth;
      const value = sequence[productionEvalIndex++];
      if (value instanceof Error) throw value;
      return value;
    }
  };

  return { image, text, vision, imageCalls, visionCalls };
}

describe("RC3 production evaluator protocol", () => {
  it("retries evaluator once on the exact same images and does not regenerate", async () => {
    const h = harness([
      new StructuredOutputProtocolError("SCHEMA_ECHO"),
      passingEvaluation()
    ]);
    const pipeline = new PPFoodPipeline(h.vision, h.text as any, h.image as any, {
      runtimeMode: "PRODUCTION_FAST"
    });

    const result = (await pipeline.runStageB(job(), truth)) as any;
    const evalCalls = h.visionCalls.filter((call) => call.system.includes("Production delivery"));

    expect(h.imageCalls).toHaveLength(1);
    expect(evalCalls).toHaveLength(2);
    expect(evalCalls[1].system).toContain("INSTANCE_RETRY");
    expect(evalCalls[0].images).toEqual(evalCalls[1].images);
    expect(result.productionGate.decision).toBe("PASS");
  });

  it("fails closed to human review after two protocol failures without creative retry", async () => {
    const h = harness([
      new StructuredOutputProtocolError("SCHEMA_ECHO"),
      new StructuredOutputProtocolError("MODEL_VALIDATION")
    ]);
    const pipeline = new PPFoodPipeline(h.vision, h.text as any, h.image as any, {
      runtimeMode: "PRODUCTION_FAST",
      productionMaxCreativeRetries: 1
    });

    const result = (await pipeline.runStageB(job(), truth)) as any;
    const evalCalls = h.visionCalls.filter((call) => call.system.includes("Production delivery"));

    expect(h.imageCalls).toHaveLength(1);
    expect(evalCalls).toHaveLength(2);
    expect(result.retry).toBeUndefined();
    expect(result.productionGate.decision).toBe("NEEDS_HUMAN_REVIEW");
    expect(result.productionGate.failureCodes).toEqual(["EVALUATOR_PROTOCOL_FAILURE"]);
    expect(result.productionGate.retryEligible).toBe(false);
    expect(result.productionGate.failureClass).toBe("EVALUATOR_PROTOCOL");
    expect(result.productionGate.repairInstruction.toLowerCase()).toContain("do not regenerate");
  });
});
