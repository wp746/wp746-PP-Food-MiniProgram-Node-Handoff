# PP Food MiniProgram Handoff — Production V1 Freeze

Handoff release: `handoff-1.0.0`

Exact upstream source:

```text
PP-Food-Runtime-001
Version: 1.0.0
Commit:  5a2d6c9757dc0f55c75128587fa0c8cd3dbe112c
```

## Developer implementation baseline

The mini-program backend must implement this repository as a behavioral mirror of the upstream Runtime. It must not rebuild the logic from legacy Skills, archived prompts, chat history, or local interpretations.

Frozen online defaults:

```text
runtimeMode = PRODUCTION_FAST
initial B renders = 1
max targeted creative retry = 1
normal PASS challenger count = 0
normal PASS pairwise count = 0
evaluator protocol retry <= 1
provider/evaluator/runtime failure creative-retry cost = 0
```

Frozen routing/protocol requirements:

- current-job Source is product truth root;
- current-job Stage A PASS is the only B reference;
- provider `Pack / PACK` normalizes to `PACK` before category routing;
- canned-fruit package jobs resolve to `CANNED_FRUIT_RETAIL`;
- evaluator schema echo / invalid JSON / response-model validation is a structured-output protocol failure;
- first evaluator protocol failure retries evaluator only on the same images;
- second evaluator protocol failure returns human review and never regenerates B;
- Production Hard Gate retains `HERO_WEAK` and other delivery blockers; QC is not lowered to force PASS.

## Evidence boundary

Upstream Runtime production-freeze commit `5a2d6c9757dc0f55c75128587fa0c8cd3dbe112c` passed its GitHub Actions offline/contract suite with `85 passed / 3 skipped / 0 failed`.

Live evaluator-only acceptance closed the structured-output crash path and confirmed the corrected canned-fruit route. The historical reused S02 candidate itself returned `HERO_WEAK`; that result remains a legitimate hard-gate retry signal and is not represented as a fresh V1 image-quality PASS.

## Security

Production credentials must be injected only through backend secrets/environment variables. Do not commit API keys, customer images, private Goldens, or job artifacts.
