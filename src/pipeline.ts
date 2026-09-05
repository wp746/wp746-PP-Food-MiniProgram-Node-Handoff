import { StructuredOutputProtocolError } from "./types";
import type {
  ArtDirection,
  CategoryVisualTranslation,
  EvaluationResult,
  ImageProvider,
  PairwiseResult,
  PPFoodJobInput,
  PPFoodPipelineOptions,
  ProductTruth,
  ProductionGateResult,
  RuntimeMode,
  TextProvider,
  VisionProvider,
} from "./types";
import {
  B_ART_DIRECTOR_SYSTEM,
  B_EVALUATOR_SYSTEM,
  CATEGORY_TRANSLATOR_SYSTEM,
  COPY_FIREWALL_SYSTEM,
  PAIRWISE_EVALUATOR_SYSTEM,
  PRODUCTION_EVALUATOR_SYSTEM,
  RETRY_PLANNER_SYSTEM,
  STAGE_A_DIRECTOR_SYSTEM,
  STAGE_A_QC_SYSTEM,
  VISION_OBSERVER_SYSTEM,
  compileStageAPrompt,
  compileStageBPrompt,
} from "./ppFoodPrompts";

const HARD_PRODUCTION_FAILURES = new Set([
  "PRODUCT_IDENTITY_DRIFT",
  "COPY_TRUTH_FAILURE",
  "MECHANICAL_FAILURE",
  "REFERENCE_BINDING_FAILURE",
  "HERO_WEAK",
  "SCENE_DOMINATES_PRODUCT",
  "COMMERCIAL_FINISH_WEAK",
]);

const PRODUCTION_EVALUATOR_PROTOCOL_RETRY = String.raw`
INSTANCE_RETRY: The previous evaluator response was rejected as a structured-output protocol failure.
Return a DATA INSTANCE compatible with EvaluationResult. Do not return, quote, summarize, or embed a JSON Schema.
Do not output $defs, properties, required, title, schema metadata, or explanatory prose.
Re-evaluate the exact same three images and return one JSON object only.
`;

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function protocolReason(error: unknown): string {
  if (error instanceof StructuredOutputProtocolError) return error.reason;
  if (typeof error === "object" && error !== null && "reason" in error) {
    return String((error as { reason?: unknown }).reason ?? "UNKNOWN");
  }
  return "UNKNOWN";
}

function isStructuredOutputProtocolError(error: unknown): boolean {
  if (error instanceof StructuredOutputProtocolError) return true;
  return Boolean(
    typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: unknown }).code === "STRUCTURED_OUTPUT_PROTOCOL_FAILURE",
  );
}

export function normalizeProductTruth(
  truth: ProductTruth,
  facts: { productName?: string } = {},
): ProductTruth {
  const rawPackOrFood = truth.packOrFood?.trim().toUpperCase();
  const packOrFood =
    rawPackOrFood === "PACK" || rawPackOrFood === "FOOD"
      ? rawPackOrFood
      : truth.packOrFood;
  let primaryCategory = truth.primaryCategory;
  const productName = facts.productName ?? "";

  if (packOrFood === "PACK" && /(罐头|蜜橘|桔子)/.test(productName)) {
    primaryCategory = "CANNED_FRUIT_RETAIL";
  }

  return {
    ...truth,
    primaryCategory,
    packOrFood,
  };
}

export function decideProductionGate(evaluation: EvaluationResult): ProductionGateResult {
  const confidence = evaluation.confidence ?? 0;
  const evidence = evaluation.failures.flatMap((failure) => failure.evidence ?? []);

  if (confidence < 0.65) {
    return {
      decision: "NEEDS_SECOND_EVALUATION",
      failureCodes: ["EVALUATOR_FAILURE"],
      retryEligible: false,
      failureClass: "EVALUATOR",
      evidence,
      repairInstruction: "Re-run evaluation only; do not regenerate the image.",
    };
  }

  const reported = evaluation.failures
    .map((failure) => failure.code)
    .filter((code) => HARD_PRODUCTION_FAILURES.has(code));
  const failures = [...reported];

  const mechanicalPass = evaluation.mechanicalPass ?? !reported.includes("MECHANICAL_FAILURE");
  const referenceBindingVerified =
    evaluation.referenceBindingVerified ?? !reported.includes("REFERENCE_BINDING_FAILURE");
  const productTruthPass = evaluation.productTruthPass ?? !reported.includes("PRODUCT_IDENTITY_DRIFT");
  const copyTruthPass = evaluation.copyTruthPass ?? !reported.includes("COPY_TRUTH_FAILURE");
  const firstReadProduct = evaluation.firstRead?.[0]?.toLowerCase() === "product";
  const productFirstHero =
    evaluation.productFirstHero ??
    (evaluation.firstRead ? firstReadProduct : !reported.includes("HERO_WEAK") && !reported.includes("SCENE_DOMINATES_PRODUCT"));

  if (!mechanicalPass) failures.push("MECHANICAL_FAILURE");
  if (!referenceBindingVerified) failures.push("REFERENCE_BINDING_FAILURE");
  if (!productTruthPass) failures.push("PRODUCT_IDENTITY_DRIFT");
  if (!copyTruthPass) failures.push("COPY_TRUTH_FAILURE");
  if (!productFirstHero) failures.push("HERO_WEAK");

  const failureCodes = unique(failures);
  if (failureCodes.length > 0) {
    return {
      decision: "RETRY",
      failureCodes,
      retryEligible: true,
      failureClass: "DELIVERY_HARD_GATE",
      evidence,
      repairInstruction:
        `Repair only these delivery-blocking failures: ${failureCodes.join(", ")}. ` +
        "Preserve current Stage A reference, product truth, authorized copy and all passing dimensions.",
    };
  }

  return {
    decision: "PASS",
    failureCodes: [],
    retryEligible: false,
    failureClass: "NONE",
    evidence,
    repairInstruction: "",
  };
}

export class PPFoodPipeline {
  private readonly runtimeMode: RuntimeMode;
  private readonly productionMaxCreativeRetries: number;
  private readonly validationMaxCreativeCycles: number;

  constructor(
    private readonly vision: VisionProvider,
    private readonly text: TextProvider,
    private readonly image: ImageProvider,
    options: PPFoodPipelineOptions = {},
  ) {
    this.runtimeMode = options.runtimeMode ?? "VALIDATION";
    this.productionMaxCreativeRetries = Math.max(0, Math.min(1, options.productionMaxCreativeRetries ?? 1));
    this.validationMaxCreativeCycles = Math.max(1, Math.min(3, options.validationMaxCreativeCycles ?? 3));
  }

  async analyzeSource(sourceImage: string | Buffer): Promise<ProductTruth> {
    return this.vision.analyze<ProductTruth>({
      system: VISION_OBSERVER_SYSTEM,
      images: [sourceImage],
      responseFormat: "json",
    });
  }

  async runStageA(job: PPFoodJobInput): Promise<{
    productTruth: ProductTruth;
    prompt: string;
    image: Awaited<ReturnType<ImageProvider["edit"]>>;
    qc: EvaluationResult;
  }> {
    const productTruth = normalizeProductTruth(await this.analyzeSource(job.sourceImage), job);

    const artDirection = await this.text.complete<{
      backgroundDirection: string;
      lightingDirection: string;
      compositionDirection: string;
      commercialDirection?: string;
    }>({
      system: STAGE_A_DIRECTOR_SYSTEM,
      input: { productTruth, userFacts: job },
      responseFormat: "json",
    });

    const prompt = compileStageAPrompt({
      productTruth,
      productName: job.productName,
      artDirection,
    });

    const rendered = await this.image.edit({
      image: job.sourceImage,
      prompt,
      aspectRatio: "9:16",
    });

    const qc = await this.vision.analyze<EvaluationResult>({
      system: STAGE_A_QC_SYSTEM,
      images: [job.sourceImage, rendered.image],
      input: { productTruth, promptVersion: "handoff-1.0.0-rc.3" },
      responseFormat: "json",
    });

    return { productTruth, prompt, image: rendered, qc };
  }

  async runStageB(job: PPFoodJobInput, productTruth?: ProductTruth) {
    if (!job.stageAPassImage) {
      throw new Error("Stage B requires the current job Stage A PASS image.");
    }

    const truth = normalizeProductTruth(
      productTruth ?? (await this.analyzeSource(job.sourceImage)),
      job,
    );
    const copyAllowlist = await this.text.complete({
      system: COPY_FIREWALL_SYSTEM,
      input: { productTruth: truth, userFacts: job },
      responseFormat: "json",
    });

    const translation = await this.text.complete<CategoryVisualTranslation>({
      system: CATEGORY_TRANSLATOR_SYSTEM,
      input: { productTruth: truth, userFacts: job, copyAllowlist },
      responseFormat: "json",
    });

    const primaryDirection = await this.text.complete<ArtDirection>({
      system: B_ART_DIRECTOR_SYSTEM,
      input: {
        variant: "PRIMARY",
        productTruth: truth,
        userFacts: job,
        copyAllowlist,
        translation,
      },
      responseFormat: "json",
    });

    const primaryPrompt = compileStageBPrompt({
      productTruth: truth,
      userFacts: job,
      direction: primaryDirection,
      brandTemperament: translation.brandTemperament,
    });

    if (this.runtimeMode === "PRODUCTION_FAST") {
      return this.runProductionFast({
        job,
        truth,
        copyAllowlist,
        translation,
        primaryDirection,
        primaryPrompt,
      });
    }

    return this.runValidation({
      job,
      truth,
      copyAllowlist,
      translation,
      primaryDirection,
      primaryPrompt,
    });
  }

  private async evaluateProductionCandidate(input: {
    job: PPFoodJobInput;
    truth: ProductTruth;
    copyAllowlist: unknown;
    translation: CategoryVisualTranslation;
    direction: ArtDirection;
    candidateId: string;
    candidateImage: Buffer | string;
    targetedRepair?: string;
  }): Promise<{ evaluation: EvaluationResult; gate: ProductionGateResult }> {
    const images = [input.job.sourceImage, input.job.stageAPassImage!, input.candidateImage];
    const requestInput = {
      candidateId: input.candidateId,
      productTruth: input.truth,
      userFacts: input.job,
      copyAllowlist: input.copyAllowlist,
      translation: input.translation,
      direction: input.direction,
      targetedRepair: input.targetedRepair,
    };

    let evaluation: EvaluationResult;
    try {
      evaluation = await this.vision.analyze<EvaluationResult>({
        system: PRODUCTION_EVALUATOR_SYSTEM,
        images,
        input: requestInput,
        responseFormat: "json",
      });
    } catch (firstError) {
      if (!isStructuredOutputProtocolError(firstError)) throw firstError;
      try {
        evaluation = await this.vision.analyze<EvaluationResult>({
          system: `${PRODUCTION_EVALUATOR_SYSTEM}\n\n${PRODUCTION_EVALUATOR_PROTOCOL_RETRY}\nPrevious protocol failure reason: ${protocolReason(firstError)}`,
          images,
          input: { ...requestInput, protocolRetry: true },
          responseFormat: "json",
        });
      } catch (secondError) {
        if (!isStructuredOutputProtocolError(secondError)) throw secondError;
        const evidence = [
          `Production evaluator structured-output protocol failed twice: ${protocolReason(firstError)} -> ${protocolReason(secondError)}.`,
        ];
        const protocolEvaluation: EvaluationResult = {
          decision: "NEEDS_HUMAN_REVIEW",
          failures: [
            {
              code: "EVALUATOR_PROTOCOL_FAILURE",
              severity: "CRITICAL",
              evidence,
            },
          ],
          confidence: 0,
        };
        return {
          evaluation: protocolEvaluation,
          gate: {
            decision: "NEEDS_HUMAN_REVIEW",
            failureCodes: ["EVALUATOR_PROTOCOL_FAILURE"],
            retryEligible: false,
            failureClass: "EVALUATOR_PROTOCOL",
            evidence,
            repairInstruction: "Review the existing generated image or re-run evaluator only; do not regenerate the image.",
          },
        };
      }
    }

    return { evaluation, gate: decideProductionGate(evaluation) };
  }

  private async runProductionFast(input: {
    job: PPFoodJobInput;
    truth: ProductTruth;
    copyAllowlist: unknown;
    translation: CategoryVisualTranslation;
    primaryDirection: ArtDirection;
    primaryPrompt: string;
  }) {
    const { job, truth, copyAllowlist, translation, primaryDirection, primaryPrompt } = input;
    const stageA = job.stageAPassImage!;

    const primaryImage = await this.image.edit({
      image: stageA,
      prompt: primaryPrompt,
      aspectRatio: "9:16",
    });

    const primaryResult = await this.evaluateProductionCandidate({
      job,
      truth,
      copyAllowlist,
      translation,
      direction: primaryDirection,
      candidateId: "primary",
      candidateImage: primaryImage.image,
    });
    const primaryEvaluation = primaryResult.evaluation;
    let productionGate = primaryResult.gate;
    const evaluations: Record<string, EvaluationResult> = { primary: primaryEvaluation };
    let retry:
      | {
          direction: ArtDirection;
          prompt: string;
          image: Awaited<ReturnType<ImageProvider["edit"]>>;
          evaluation: EvaluationResult;
        }
      | undefined;

    if (productionGate.retryEligible && this.productionMaxCreativeRetries >= 1) {
      const retryPrompt =
        `${primaryPrompt.trim()}\n\n[PRODUCTION TARGETED REPAIR]\n${productionGate.repairInstruction}\n` +
        "This is the only creative retry. Do not redesign passing dimensions.\n";
      const retryImage = await this.image.edit({
        image: stageA,
        prompt: retryPrompt,
        aspectRatio: "9:16",
      });
      const retryResult = await this.evaluateProductionCandidate({
        job,
        truth,
        copyAllowlist,
        translation,
        direction: primaryDirection,
        candidateId: "retry-1",
        candidateImage: retryImage.image,
        targetedRepair: productionGate.repairInstruction,
      });
      const retryEvaluation = retryResult.evaluation;
      productionGate = retryResult.gate;
      evaluations["retry-1"] = retryEvaluation;
      retry = {
        direction: primaryDirection,
        prompt: retryPrompt,
        image: retryImage,
        evaluation: retryEvaluation,
      };
    }

    return {
      runtimeMode: this.runtimeMode,
      productTruth: truth,
      copyAllowlist,
      translation,
      primary: { direction: primaryDirection, prompt: primaryPrompt, image: primaryImage },
      challenger: undefined,
      retry,
      evaluations,
      evaluation: retry?.evaluation ?? primaryEvaluation,
      productionGate,
      pairwise: undefined,
      policy: {
        productionMaxCreativeRetries: this.productionMaxCreativeRetries,
        validationMaxCreativeCycles: this.validationMaxCreativeCycles,
      },
    };
  }

  private async runValidation(input: {
    job: PPFoodJobInput;
    truth: ProductTruth;
    copyAllowlist: unknown;
    translation: CategoryVisualTranslation;
    primaryDirection: ArtDirection;
    primaryPrompt: string;
  }) {
    const { job, truth, copyAllowlist, translation, primaryDirection, primaryPrompt } = input;
    const stageA = job.stageAPassImage!;

    const challengerDirection = await this.text.complete<ArtDirection>({
      system: B_ART_DIRECTOR_SYSTEM,
      input: {
        variant: "CHALLENGER",
        diversityRequirement:
          "Must differ from Primary in at least two structural dimensions: composition axis, headline spatial behavior, product placement, energy direction, depth architecture, information integration.",
        productTruth: truth,
        userFacts: job,
        copyAllowlist,
        translation,
        primaryDirection,
      },
      responseFormat: "json",
    });

    const challengerPrompt = compileStageBPrompt({
      productTruth: truth,
      userFacts: job,
      direction: challengerDirection,
      brandTemperament: translation.brandTemperament,
    });

    const [primaryImage, challengerImage] = await Promise.all([
      this.image.edit({ image: stageA, prompt: primaryPrompt, aspectRatio: "9:16" }),
      this.image.edit({ image: stageA, prompt: challengerPrompt, aspectRatio: "9:16" }),
    ]);

    const [primaryEvaluation, challengerEvaluation] = await Promise.all([
      this.vision.analyze<EvaluationResult>({
        system: B_EVALUATOR_SYSTEM,
        images: [job.sourceImage, stageA, primaryImage.image],
        input: {
          candidateId: "primary",
          productTruth: truth,
          userFacts: job,
          copyAllowlist,
          translation,
          direction: primaryDirection,
        },
        responseFormat: "json",
      }),
      this.vision.analyze<EvaluationResult>({
        system: B_EVALUATOR_SYSTEM,
        images: [job.sourceImage, stageA, challengerImage.image],
        input: {
          candidateId: "challenger",
          productTruth: truth,
          userFacts: job,
          copyAllowlist,
          translation,
          direction: challengerDirection,
        },
        responseFormat: "json",
      }),
    ]);

    const rawPairwise = await this.vision.analyze<PairwiseResult>({
      system: PAIRWISE_EVALUATOR_SYSTEM,
      images: [stageA, primaryImage.image, challengerImage.image],
      input: {
        validWinnerIds: ["primary", "challenger"],
        primaryDirection,
        challengerDirection,
        productTruth: truth,
      },
      responseFormat: "json",
    });

    if (rawPairwise.winnerId !== "primary" && rawPairwise.winnerId !== "challenger") {
      throw new Error(`EVALUATOR_FAILURE: invalid pairwise winner ${String(rawPairwise.winnerId)}`);
    }

    const evaluations = {
      primary: primaryEvaluation,
      challenger: challengerEvaluation,
    };
    const winnerEvaluation = evaluations[rawPairwise.winnerId];

    return {
      runtimeMode: this.runtimeMode,
      productTruth: truth,
      copyAllowlist,
      translation,
      primary: { direction: primaryDirection, prompt: primaryPrompt, image: primaryImage },
      challenger: {
        direction: challengerDirection,
        prompt: challengerPrompt,
        image: challengerImage,
      },
      retry: undefined,
      evaluations,
      evaluation: winnerEvaluation,
      productionGate: undefined,
      pairwise: rawPairwise,
      policy: {
        productionMaxCreativeRetries: this.productionMaxCreativeRetries,
        validationMaxCreativeCycles: this.validationMaxCreativeCycles,
      },
    };
  }

  async planRetry(input: unknown) {
    return this.text.complete({
      system: RETRY_PLANNER_SYSTEM,
      input,
      responseFormat: "json",
    });
  }
}
