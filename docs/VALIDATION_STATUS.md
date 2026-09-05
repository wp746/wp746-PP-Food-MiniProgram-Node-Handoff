# Validation Status — handoff-1.0.0-rc.3

## Version Mapping

```text
Node Handoff:    handoff-1.0.0-rc.3
Runtime Version: 1.0.0-rc.3
Runtime Commit:  9dd3aa4725efd008ec6382f9abbce81d146ee024
SYNC TARGET:     MATCHED
FINAL STATUS:    requires this commit's npm test + npm run typecheck
```

## RC3 reason

真实 S02 `PRODUCTION_FAST` 已完成图片生成并进入 Production Evaluator，但 SiliconFlow 返回 `RawEvaluation` JSON Schema 本身而不是评审数据实例，导致 Pydantic structured-output validation failure。RC3 将 `INVALID_JSON / SCHEMA_ECHO / MODEL_VALIDATION` 归一为 `STRUCTURED_OUTPUT_PROTOCOL_FAILURE`，Production Fast 只允许一次 evaluator-only retry，使用完全相同的 Source / Stage A / Candidate，不重生图、不消耗 creative retry；第二次仍失败则 `NEEDS_HUMAN_REVIEW + EVALUATOR_PROTOCOL_FAILURE`。

RC3 不改变已批准的视觉方法论、Product Truth、Category Translation、Golden floors、Stage A 或 B 图像生成策略。

## Verified Policy Parity

```text
Runtime Modes                     = VALIDATION / PRODUCTION_FAST
Production initial B renders      = 1
Production creative retries       <= 1
Validation creative cycle cap     <= 3
Evaluator confidence boundary     = 0.65
Evaluator protocol retries        <= 1 evaluator call
Evaluator protocol image renders  = 0
Protocol second failure           = HUMAN_REVIEW / no image regeneration
Production hard failure set       = MATCHED
Production soft advisory rule     = MATCHED
Pairwise image slots              = Stage A / Primary / Challenger
Stage A can win pairwise          = NO
Current-job Stage A binding       = REQUIRED
Pack/food casing normalization    = REQUIRED
Canned-fruit PACK canonical id    = CANNED_FRUIT_RETAIL
```

Production Hard Failure Set:

```text
PRODUCT_IDENTITY_DRIFT
COPY_TRUTH_FAILURE
MECHANICAL_FAILURE
REFERENCE_BINDING_FAILURE
HERO_WEAK
SCENE_DOMINATES_PRODUCT
COMMERCIAL_FINISH_WEAK
```

Validation Golden floors remain unchanged:

```text
product_hero_strength        9.2
headline_aggression          8.8
typography_product_symbiosis 8.8
one_big_idea_clarity         9.0
compositional_depth_tension  8.8
category_inevitability       9.0
information_density_control  8.8
commercial_finish            9.2
```

## Python Runtime CI Evidence

Final Python Runtime RC3 commit:

```text
9dd3aa4725efd008ec6382f9abbce81d146ee024
85 passed
3 skipped
0 failed
workflow = SUCCESS
```

3 skipped are opt-in real-provider/private live tests.

## Node TDD Evidence

RC3 protocol tests were added before implementation. RED state: 2 protocol tests failed because `StructuredOutputProtocolError` did not exist. After adding the protocol type and evaluator-only retry implementation, the core Node commit `d80a3a24730d6aa8e806ced290ce450ba6c9954f` passed `npm test` and `npm run typecheck`.

This release metadata commit must also pass both steps before delivery is considered synchronized.

## Live Acceptance Boundary

Real provider evidence currently proves:

- S02 category/Golden routing bug from RC1 was diagnosed and fixed in RC2.
- Real S02 Validation on the corrected path can generate actual candidates.
- Real S02 Production Fast reached image generation and Production Evaluator.
- The latest live blocker was evaluator schema echo, not image generation.

RC3 live evaluator acceptance remains pending. Do not repeat full image generation solely to validate this fix when the existing S02 candidate can be reused; evaluator-only acceptance is preferred.

## Security / Private Assets

RC tree contains no real API Key, customer job asset, private S01/S02 or Golden image. Keep credentials only in backend Secrets/env. Old keys exposed in prior chat/files must not be reused.
