# Validation Status — handoff-1.0.0

## Version Mapping

```text
Node Handoff:    handoff-1.0.0
Runtime Version: 1.0.0
Runtime Commit:  5a2d6c9757dc0f55c75128587fa0c8cd3dbe112c
SYNC TARGET:     MATCHED
FINAL STATUS:    VERIFIED
```

## Production V1 reason

V1 promotes the RC3 behavior to production without changing the approved A/B visual methodology. The final release includes two live-discovered hardening fixes:

1. Product Truth routing normalizes raw provider casing (`Pack -> PACK`) before category/Golden routing; canned-fruit package jobs resolve to `CANNED_FRUIT_RETAIL`.
2. Production evaluator structured-output failures (`INVALID_JSON / SCHEMA_ECHO / MODEL_VALIDATION`) are normalized to `STRUCTURED_OUTPUT_PROTOCOL_FAILURE`; Production Fast allows one evaluator-only retry on the same Source / Stage A / Candidate, with zero image regeneration and zero creative-retry cost. A second protocol failure fails closed to human review.

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

## Python Runtime V1 CI Evidence

Runtime production-freeze source commit:

```text
5a2d6c9757dc0f55c75128587fa0c8cd3dbe112c
85 passed
3 skipped
0 failed
push workflow 33959171648 = SUCCESS
PR workflow   33959521703 = SUCCESS
```

The 3 skipped tests are opt-in real-provider/private live tests; they are not silently treated as PASS.

Runtime was merged to `main` by PR #1. The merge commit tree is the same production-freeze tree validated above.

## Node V1 CI Evidence

The evaluator protocol contract was introduced test-first during RC3. RED state: protocol tests failed before `StructuredOutputProtocolError` and evaluator-only retry existed. After implementation, the frozen `handoff-1.0.0` commit passed:

```text
558b406fb2c87b44d4ef639f2787631edd6edb56
4 test files passed
10 / 10 tests passed
npm run typecheck = PASS
npm audit = 0 vulnerabilities
push workflow 33959449090 = SUCCESS
PR workflow   33959532228 = SUCCESS
```

The V1 handoff was merged to `main` by PR #1. This status record is a post-merge documentation closure only; it does not alter runtime/pipeline behavior.

## Live Acceptance Closure

Real provider evidence now proves:

- The S02 category routing bug was diagnosed and fixed: raw `Pack` normalizes to `PACK`, and the corrected V1 route is `CANNED_FRUIT_RETAIL`.
- Real S02 image generation reached Production Fast and exposed the evaluator schema-echo protocol failure.
- A later self-contained evaluator-only acceptance reused an already-generated real S02 candidate and called SiliconFlow only; it performed no Yunwu regeneration.
- Runtime 1.0.0/RC3 evaluator behavior parsed the provider response into a normal Production Gate instead of crashing on a JSON-Schema echo.
- The reused historical candidate returned `RETRY / HERO_WEAK`. This is a visual delivery-hard-gate result, not a structured-output protocol failure. The V1 release retains this gate rather than weakening QC to manufacture PASS.

This evaluator-only acceptance is technical protocol evidence; it is not claimed as a fresh V1 image-quality render.

## Security / Private Assets

The handoff tree must contain no real API Key, customer job asset, private S01/S02 or Golden image. Keep credentials only in backend Secrets/env. Old keys exposed in prior chat/files must not be reused.
