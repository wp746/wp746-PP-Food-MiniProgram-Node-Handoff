# Node Integration Guide — handoff-1.0.0

Runtime source: `PP-Food-Runtime-001 1.0.0 @ 5a2d6c9757dc0f55c75128587fa0c8cd3dbe112c`.

## 1. 模块边界

```text
src/
  ppFoodPrompts.ts   # Prompt/role contract
  types.ts           # Runtime types + structured protocol error contract
  pipeline.ts        # Deterministic A/B + normalization + runtime-mode/evaluator policy
  index.ts           # exports
```

业务 Controller 不应直接拼另一套 Prompt 或另写 Retry 状态机。

## 2. 创建 Pipeline

线上 B 默认：

```ts
const ppFood = new PPFoodPipeline(vision, text, image, {
  runtimeMode: "PRODUCTION_FAST",
  productionMaxCreativeRetries: 1,
  validationMaxCreativeCycles: 3
});
```

研发模式显式使用 `{ runtimeMode: "VALIDATION" }`。

## 3. Product Truth Normalization

`vision.analyze()` 的 raw ProductTruth 不能直接进入 Category Translation：

```text
Pack / PACK -> PACK
Food / FOOD -> FOOD
PACK + 产品名包含 罐头/蜜橘/桔子 -> CANNED_FRUIT_RETAIL
```

业务方若单独调用 Vision，也必须在后续 PP Food pipeline 前应用同一 normalization。

## 4. Stage A

```ts
const a = await ppFood.runStageA(job);
```

A 从 source 做 reference edit。独立 A QC PASS 后，保存输出与 hash 作为当前 Job `stageAPassImage`。B 不允许用另一 Job 的 A，也不允许绕过 A。

## 5. Stage B — PRODUCTION_FAST

```ts
const b = await ppFood.runStageB({
  ...job,
  mode: "B",
  stageAPassImage
}, productTruth);
```

Fast Path：

```text
Normalized Product Truth
→ Primary Direction
→ Primary image.edit(stageAPassImage)
→ Production Evaluator
→ Production Hard Gate
→ PASS
```

正常 PASS 只有一次 B image edit。Hard Gate 失败且 `retryEligible=true` 时最多再进行一次 targeted repair。

## 6. V1 Evaluator Protocol Adapter — 必须实现

Provider adapter 负责把 structured-output 异常统一成 `StructuredOutputProtocolError`：

```ts
new StructuredOutputProtocolError("INVALID_JSON")
new StructuredOutputProtocolError("SCHEMA_ECHO")
new StructuredOutputProtocolError("MODEL_VALIDATION")
```

典型 `SCHEMA_ECHO` 信号是模型返回评审模型自己的 JSON Schema，例如根对象同时出现：

```text
$defs / properties / required / title / type=object
```

不要让 schema 原样流入业务 EvaluationResult，也不要把它识别成 image creative failure。

`pipeline.ts` 在 `PRODUCTION_FAST` 中负责：

```text
first protocol failure
→ vision.analyze evaluator-only retry × 1
→ same [sourceImage, stageAPassImage, candidateImage]
→ system instruction includes INSTANCE_RETRY
→ no image.edit

second protocol failure
→ NEEDS_HUMAN_REVIEW
→ EVALUATOR_PROTOCOL_FAILURE
→ retryEligible=false
→ no image.edit
```

如果使用的 Vision SDK 有原生 JSON Schema/structured-output 支持，也必须在 adapter 边界验证“返回的是 data instance，不是 schema definition”，并映射相同错误语义。

真实 evaluator-only acceptance 已证明 Runtime 1.0.0 的协议路径能产出正常 Production Gate；历史 S02 候选返回 `HERO_WEAK` 是候选本身的视觉交付结果，不是协议错误。

## 7. Stage B — VALIDATION

Validation 会生成 Primary 与 Challenger，并执行：

```ts
vision.analyze({
  system: PAIRWISE_EVALUATOR_SYSTEM,
  images: [stageAPassImage, primaryImage, challengerImage]
});
```

图位固定：

```text
1 = Stage A control
2 = Primary
3 = Challenger
```

Pairwise winner 只能 `primary | challenger`。无效 winner 必须失败关闭。

## 8. Image Provider Adapter

B 必须是真实 reference edit：

```ts
interface ImageProvider {
  edit(input: {
    image: Buffer | string;
    prompt: string;
    aspectRatio: "9:16";
  }): Promise<ImageProviderResult>;
}
```

B 的 `image` 必须是 current-job Stage A PASS。禁止 text-to-image fallback。

## 9. Artifact / Logging

至少保存：

```text
jobId
handoffVersion
runtimeSourceVersion
runtimeSourceCommit
runtimeMode
sourceSha256
stageASha256
normalized packOrFood / primaryCategory
promptSha256
provider/model/requestId
generationLatency
productionGate/evaluation
failureClass
evaluatorProtocolRetryCount
creativeRetryCount
finalDecision
outputSha256
```

不要记录 API Key、Authorization header 或含凭据的原始请求。

## 10. 文案与文本渲染

Copy Firewall allowlist 是文字事实边界。`defaultCopyAuthorized=true` 只允许非事实型 campaign copy。

`IMAGE_NATIVE` 必须检查实际可见文案准确性；`HYBRID_COMPOSITE` 可另行实现精确排字，但不能绕过 allowlist。

## 11. 接入验收

开发公司至少验证：

- `Pack` → `PACK`。
- 桔子罐头 + PACK → `CANNED_FRUIT_RETAIL`。
- Production Fast PASS = 1 次初始 B 生图，0 Pairwise。
- Hard Failure = 最多 1 次 creative retry。
- Soft aesthetic issue = 不自动重生图。
- evaluator confidence `<0.65` = 只重评。
- `SCHEMA_ECHO` 第一次 = 只重 evaluator，同三张图，0 image.edit。
- `SCHEMA_ECHO` 连续两次 = HUMAN_REVIEW + `EVALUATOR_PROTOCOL_FAILURE`，0 creative retry。
- Validation = 2 candidates + 独立评审 + 三图 Pairwise。
- B reference hash = current-job Stage A PASS hash。
- 所有硬事实来自 allowlist。

仓库必须通过 `npm test` 与 `npm run typecheck`。
