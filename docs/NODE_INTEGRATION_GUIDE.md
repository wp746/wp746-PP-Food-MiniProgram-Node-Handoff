# Node Integration Guide — handoff-1.0.0-rc.2

Runtime source: `PP-Food-Runtime-001 1.0.0-rc.2 @ 0930fe08fd2188196478d658739f4e128527501d`.

## 1. 模块边界

```text
src/
  ppFoodPrompts.ts   # Prompt/role contract
  types.ts           # Runtime types
  pipeline.ts        # Deterministic A/B + normalization + runtime-mode policy
  index.ts           # exports
```

业务 Controller 不应直接拼另一套 Prompt。

## 2. 创建 Pipeline

线上小程序 B 默认使用：

```ts
const ppFood = new PPFoodPipeline(vision, text, image, {
  runtimeMode: "PRODUCTION_FAST",
  productionMaxCreativeRetries: 1,
  validationMaxCreativeCycles: 3
});
```

质量研发时显式改为：

```ts
{ runtimeMode: "VALIDATION" }
```

## 3. Product Truth Normalization — 必须保留

`vision.analyze()` 的 raw ProductTruth 不能直接进入 Category Translation。`pipeline.ts` 的 `normalizeProductTruth()` 是生产契约的一部分：

```text
Pack / PACK -> PACK
Food / FOOD -> FOOD
PACK + 产品名包含 罐头/蜜橘/桔子 -> CANNED_FRUIT_RETAIL
```

这条规则来自真实 S02 live run；RC1 删除/绕过该层会导致桔子罐头误入 generic category，并错取非 S02 Golden 方向。

如果业务方单独调用 Vision 接口，也必须在进入后续 PP Food pipeline 前应用同一规范化函数。

## 4. Stage A

```ts
const a = await ppFood.runStageA(job);
```

A 从 source 做 reference edit；Vision Product Truth 会先被规范化。独立 A QC PASS 后，保存其输出与 hash，作为当前 Job 的 `stageAPassImage`。

B 不允许用另一 Job 的 A，也不允许绕过 A。

## 5. Stage B — PRODUCTION_FAST

```ts
const b = await ppFood.runStageB({
  ...job,
  mode: "B",
  stageAPassImage
}, productTruth);
```

即使调用方传入已有 `productTruth`，Stage B 仍会再次做 deterministic normalization，避免外部 Provider casing 漂移。

Fast Path 行为固定：

```text
Normalized Product Truth
→ Primary Direction
→ Primary image.edit(stageAPassImage)
→ PRODUCTION_EVALUATOR_SYSTEM
→ decideProductionGate()
→ PASS
```

正常 PASS 只有一次 B image edit。Hard Gate 失败且 `retryEligible=true` 时，最多再进行一次 targeted repair。

低置信度评审只重评，不重生图。Provider/Runtime 故障也不得转换为创意重试。

## 6. Stage B — VALIDATION

Validation 会生成 Primary 与 Challenger，并分别看图评价，然后执行：

```ts
vision.analyze({
  system: PAIRWISE_EVALUATOR_SYSTEM,
  images: [stageAPassImage, primaryImage, challengerImage]
});
```

图位不能改变：

```text
1 = Stage A control
2 = Primary
3 = Challenger
```

Pairwise winner 只能是 `primary | challenger`。无效 winner id 必须按 `EVALUATOR_FAILURE` 失败关闭。

## 7. Provider Adapter

Image Provider 必须是真正 reference edit：

```ts
interface ImageProvider {
  edit(input: {
    image: Buffer | string;
    prompt: string;
    aspectRatio: "9:16";
  }): Promise<ImageProviderResult>;
}
```

B 的 `image` 参数必须是 current-job Stage A PASS。不得静默 text-to-image fallback。

## 8. Artifact / Logging

线上实现至少持久化：

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
creativeRetryCount
finalDecision
outputSha256
```

不要记录 API Key、Authorization header 或包含凭据的原始请求。

## 9. 文案与文本渲染

Copy Firewall 的 allowlist 是文字事实边界。`defaultCopyAuthorized=true` 只允许非事实型 campaign copy。

`IMAGE_NATIVE` 必须检查实际可见文案准确性。`HYBRID_COMPOSITE` 可以由业务后端另行实现精确排字，但不得绕过 allowlist。

## 10. 接入验收

开发公司在自己的后端接入后至少跑：

- Product Truth：`Pack` 输入规范化为 `PACK`。
- 桔子罐头 + PACK：内部类别为 `CANNED_FRUIT_RETAIL`。
- Production Fast：正常 PASS = 1 次初始 B 生图，0 Pairwise。
- Production Fast：硬失败 = 最多 1 次创意 Retry。
- Production Fast：软审美问题 = 不自动重生图。
- Production Fast：低 evaluator confidence = 重评，不重生图。
- Validation：2 个候选 + 独立评审 + 三图 Pairwise。
- B reference hash = 当前 Job A PASS hash。
- 所有可见硬事实来自 allowlist。

仓库本身必须通过 `npm test` 和 `npm run typecheck`。
