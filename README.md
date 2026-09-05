# PP Food MiniProgram Node Handoff

这是交给小程序开发公司的 **Node/TypeScript Runtime 交接仓库**。

```text
Handoff Version: handoff-1.0.0-rc.3
Runtime Source:  PP-Food-Runtime-001 1.0.0-rc.3
Runtime Commit:  9dd3aa4725efd008ec6382f9abbce81d146ee024
```

本仓库不是另一套 Skill，而是 Python Runtime 的生产行为镜像。开发公司应按本仓库的类型、状态机、Prompt Compiler、QC/Retry 契约实现，不得重新解释方法论。

## RC3 新增：Production Evaluator 协议保护

真实 S02 `PRODUCTION_FAST` 已经跑到 Production Evaluator，但 SiliconFlow 曾返回 `RawEvaluation` 的 JSON Schema 本身，而不是评审数据实例。RC3 将此类情况定义为 structured-output protocol failure。

Node 交接行为必须与 Python RC3 一致：

```text
Production evaluator
→ valid EvaluationResult → normal Production Hard Gate
→ STRUCTURED_OUTPUT_PROTOCOL_FAILURE
   → evaluator-only retry × 1
   → same Source / Stage A / B Candidate
   → no image regeneration
   → zero creative retry cost
→ protocol failure again
   → NEEDS_HUMAN_REVIEW
   → EVALUATOR_PROTOCOL_FAILURE
   → retryEligible = false
```

`INVALID_JSON`、`SCHEMA_ECHO`、`MODEL_VALIDATION` 都属于 structured-output protocol failure。Provider adapter 应把这些错误归一为 `STRUCTURED_OUTPUT_PROTOCOL_FAILURE`，而不是当成创意失败。

## RC2 仍保留：Product Truth normalization

Vision Provider 输出是观察证据，不是内部 routing key。`Pack / PACK` 必须先统一为 `PACK`；当前任务为包装桔子/蜜橘/罐头时，内部类别必须进入 `CANNED_FRUIT_RETAIL`。不得删除这层确定性规范化。

## 用户层 A / B

- `A`：高保真商业商拍，只升级摄影，不做 KV、不加字。
- `B`：必须基于当前 Job 的 Stage A PASS 图继续。锁 Product DNA，不锁死相机。

`按默认文案来` 只授权非事实型软 campaign copy，不授权虚构价格、地址、电话、认证、奖项、产地、净含量、配方、健康功效等硬事实。

## Runtime Mode

### PRODUCTION_FAST — 小程序默认

```text
Source
→ Product Truth + deterministic normalization
→ current Stage A PASS
→ Copy Firewall / Category Translation / Primary Art Direction
→ B Primary（1 张初始图）
→ Independent Production Hard Gate
→ PASS
```

只有交付级硬错误允许最多 1 次 targeted creative retry。正常 PASS 不生成 Challenger、不跑 Pairwise。

Provider / Evaluator / Runtime 故障不消耗 creative retry。Evaluator protocol failure 只允许重跑 evaluator，绝不能因此重生图。

### VALIDATION — 内部质量研发

```text
Primary + Challenger
→ independent evaluations
→ Pairwise: Stage A control + Primary + Challenger
```

Stage A 只作为 control，不能成为 winner。Validation 的 Golden floors 与 Python Runtime 保持一致。

## Production Hard Failure Set

```text
PRODUCT_IDENTITY_DRIFT
COPY_TRUTH_FAILURE
MECHANICAL_FAILURE
REFERENCE_BINDING_FAILURE
HERO_WEAK
SCENE_DOMINATES_PRODUCT
COMMERCIAL_FINISH_WEAK
```

`PHOTO_PLUS_TEXT`、`CATEGORY_CLICHE_DEPENDENCE`、`GENERIC_PREMIUM_SKIN`、`GOLDEN_DISTANCE` 等软审美问题不能单独触发线上重生图。

## 开发公司阅读顺序

1. `HANDOFF.md`
2. `docs/NODE_INTEGRATION_GUIDE.md`
3. `docs/PROMPT_RUNTIME_FULL.md`
4. `docs/QC_RETRY.md`
5. `docs/SECURITY_AND_FACTS.md`
6. `src/types.ts`
7. `src/ppFoodPrompts.ts`
8. `src/pipeline.ts`

## CI 门槛

```text
npm test
npm run typecheck
```

必须在同一最终 commit 上同时通过，才能标记 handoff 同步完成。

## 安全

API Key 只允许存在后端 Secrets/环境变量。禁止提交 `.env`、真实 Key、客户 Job 资产、私有 S01/S02 或 Golden 图片。
